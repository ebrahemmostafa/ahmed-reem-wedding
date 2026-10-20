-- Ahmed & Reem — RSVPs
-- Safe to run on an existing project: it only ADDS new objects, all named
-- ar_wedding_*, and stops before doing anything if one of them already exists.
-- Run once in Supabase → SQL Editor → New query → Run.
-- Before running, set the passcode for the RSVP page in step 2.

-- 0. Safety check: never touch anything that's already there ----------------
do $$
begin
  if to_regclass('public.ar_wedding_rsvps') is not null
     or to_regclass('public.ar_wedding_secret') is not null
     or to_regclass('public.ar_wedding_failed_attempts') is not null
     or exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                where n.nspname = 'public'
                  and p.proname in ('ar_wedding_passcode_ok', 'ar_wedding_get_rsvps', 'ar_wedding_delete_rsvp')) then
    raise exception 'ar_wedding_* objects already exist in this project. Nothing was changed.';
  end if;
end $$;

-- Supabase projects normally have this already; it is only added if missing.
create extension if not exists pgcrypto with schema extensions;

-- 1. The table guests write to ------------------------------------------
create table public.ar_wedding_rsvps (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  full_name   text not null check (char_length(btrim(full_name)) between 2 and 120),
  message     text check (message is null or char_length(message) <= 600)
);
alter table public.ar_wedding_rsvps enable row level security;

-- Guests (the invitation, using the public anon key) can only ADD an RSVP.
-- There is no select policy, so nobody can read the table directly.
create policy "ar_wedding guests can send an rsvp"
  on public.ar_wedding_rsvps for insert
  to anon, authenticated
  with check (true);
revoke all on public.ar_wedding_rsvps from anon, authenticated;
grant insert on public.ar_wedding_rsvps to anon, authenticated;

-- 2. The passcode for ahmed-reem-rsvp.html ------------------------------
-- Stored only as a bcrypt hash; never sent to the browser.
create table public.ar_wedding_secret (
  id             int primary key default 1 check (id = 1),
  passcode_hash  text not null
);
alter table public.ar_wedding_secret enable row level security;   -- no policies: unreadable through the API
revoke all on public.ar_wedding_secret from anon, authenticated;

insert into public.ar_wedding_secret (id, passcode_hash)
values (1, extensions.crypt('CHANGE-ME', extensions.gen_salt('bf')));   -- ← your passcode

-- Wrong-passcode log, used to lock out guessing:
--   10 wrong tries per IP per 15 minutes,
--   30 in total per 15 minutes, and 100 in total per day.
-- If the page ever stays locked for you, clear it with:
--   delete from public.ar_wedding_failed_attempts;
create table public.ar_wedding_failed_attempts (
  at timestamptz not null default now(),
  ip text
);
create index ar_wedding_failed_attempts_at on public.ar_wedding_failed_attempts (at);
alter table public.ar_wedding_failed_attempts enable row level security;
revoke all on public.ar_wedding_failed_attempts from anon, authenticated;

create function public.ar_wedding_passcode_ok(p_passcode text)
returns text            -- 'ok' | 'wrong' | 'locked'
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_hash text;
  v_ip   text;
begin
  -- One passcode check at a time, so parallel guesses can't slip past the counter.
  perform pg_advisory_xact_lock(hashtext('ar_wedding_passcode_ok'));

  -- Client IP: the right-most x-forwarded-for entry is the one added by
  -- Supabase's own proxy; the left-most entries can be faked by the caller.
  v_ip := nullif(btrim(regexp_replace(coalesce(
            current_setting('request.headers', true)::json ->> 'x-forwarded-for', ''), '^.*,', '')), '');

  delete from ar_wedding_failed_attempts where at < now() - interval '2 days';
  if (select count(*) from ar_wedding_failed_attempts
        where at > now() - interval '15 minutes' and ip is not distinct from v_ip) >= 10
     or (select count(*) from ar_wedding_failed_attempts
        where at > now() - interval '15 minutes') >= 30
     or (select count(*) from ar_wedding_failed_attempts
        where at > now() - interval '1 day') >= 100 then
    return 'locked';
  end if;

  select passcode_hash into v_hash from ar_wedding_secret where id = 1;
  if v_hash is not null and coalesce(p_passcode, '') <> '' and crypt(p_passcode, v_hash) = v_hash then
    return 'ok';
  end if;
  insert into ar_wedding_failed_attempts (ip) values (v_ip);
  return 'wrong';
end;
$$;
revoke all on function public.ar_wedding_passcode_ok(text) from public, anon, authenticated;

-- 3. What the RSVP page calls ------------------------------------------------
create function public.ar_wedding_get_rsvps(p_passcode text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_check text := ar_wedding_passcode_ok(p_passcode);
begin
  if v_check <> 'ok' then
    return json_build_object('ok', false, 'error', v_check);
  end if;
  return json_build_object('ok', true, 'rows', coalesce((
    select json_agg(r order by r.created_at desc)
    from (select id, created_at, full_name, message from ar_wedding_rsvps) r
  ), '[]'::json));
end;
$$;

create function public.ar_wedding_delete_rsvp(p_passcode text, p_id bigint)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_check text := ar_wedding_passcode_ok(p_passcode);
begin
  if v_check <> 'ok' then
    return json_build_object('ok', false, 'error', v_check);
  end if;
  delete from ar_wedding_rsvps where id = p_id;
  return json_build_object('ok', true);
end;
$$;

revoke all on function public.ar_wedding_get_rsvps(text) from public;
revoke all on function public.ar_wedding_delete_rsvp(text, bigint) from public;
grant execute on function public.ar_wedding_get_rsvps(text) to anon, authenticated;
grant execute on function public.ar_wedding_delete_rsvp(text, bigint) to anon, authenticated;

-- To change the passcode later, run only this (with the new passcode):
--   update public.ar_wedding_secret
--   set passcode_hash = extensions.crypt('NEW-PASSCODE', extensions.gen_salt('bf'))
--   where id = 1;

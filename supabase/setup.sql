-- Ahmed & Reem — RSVPs
-- Run once in Supabase → SQL Editor → New query → Run.
-- Before running, choose the passcode for the RSVP page in step 2.

create extension if not exists pgcrypto with schema extensions;

-- 1. The table guests write to ------------------------------------------
create table if not exists public.rsvps (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  full_name   text not null check (char_length(btrim(full_name)) between 2 and 120),
  message     text check (message is null or char_length(message) <= 600)
);
alter table public.rsvps enable row level security;

-- Guests (the invitation, using the public anon key) can only ADD an RSVP.
-- There is no select policy, so nobody can read the table directly.
drop policy if exists "guests can send an rsvp" on public.rsvps;
create policy "guests can send an rsvp"
  on public.rsvps for insert
  to anon, authenticated
  with check (true);
grant insert on public.rsvps to anon, authenticated;
revoke select, update, delete on public.rsvps from anon, authenticated;

-- 2. The passcode for ahmed-reem-rsvp.html ------------------------------
-- Stored only as a bcrypt hash; never sent to the browser.
create table if not exists public.rsvp_secret (
  id             int primary key default 1 check (id = 1),
  passcode_hash  text not null
);
alter table public.rsvp_secret enable row level security;   -- no policies: unreadable through the API
revoke all on public.rsvp_secret from anon, authenticated;

insert into public.rsvp_secret (id, passcode_hash)
values (1, extensions.crypt('CHANGE-ME', extensions.gen_salt('bf')))   -- ← your passcode
on conflict (id) do update set passcode_hash = excluded.passcode_hash;

-- Wrong-passcode log, used to lock out guessing:
-- 10 wrong tries per IP per 15 minutes, and 200 in total across all IPs.
create table if not exists public.rsvp_failed_attempts (
  at timestamptz not null default now(),
  ip text
);
alter table public.rsvp_failed_attempts add column if not exists ip text;
create index if not exists rsvp_failed_attempts_at on public.rsvp_failed_attempts (at);
alter table public.rsvp_failed_attempts enable row level security;
revoke all on public.rsvp_failed_attempts from anon, authenticated;

create or replace function public.rsvp_passcode_ok(p_passcode text)
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
  perform pg_advisory_xact_lock(hashtext('rsvp_passcode_ok'));

  -- Client IP as forwarded to PostgREST (first address in x-forwarded-for).
  v_ip := nullif(btrim(split_part(coalesce(
            current_setting('request.headers', true)::json ->> 'x-forwarded-for', ''), ',', 1)), '');

  delete from rsvp_failed_attempts where at < now() - interval '1 day';
  if (select count(*) from rsvp_failed_attempts
        where at > now() - interval '15 minutes' and ip is not distinct from v_ip) >= 10
     or (select count(*) from rsvp_failed_attempts
        where at > now() - interval '15 minutes') >= 200 then
    return 'locked';
  end if;

  select passcode_hash into v_hash from rsvp_secret where id = 1;
  if v_hash is not null and coalesce(p_passcode, '') <> '' and crypt(p_passcode, v_hash) = v_hash then
    return 'ok';
  end if;
  insert into rsvp_failed_attempts (ip) values (v_ip);
  return 'wrong';
end;
$$;
revoke all on function public.rsvp_passcode_ok(text) from public, anon, authenticated;

-- 3. What the RSVP page calls ------------------------------------------------
create or replace function public.get_rsvps(p_passcode text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_check text := rsvp_passcode_ok(p_passcode);
begin
  if v_check <> 'ok' then
    return json_build_object('ok', false, 'error', v_check);
  end if;
  return json_build_object('ok', true, 'rows', coalesce((
    select json_agg(r order by r.created_at desc)
    from (select id, created_at, full_name, message from rsvps) r
  ), '[]'::json));
end;
$$;

create or replace function public.delete_rsvp(p_passcode text, p_id bigint)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_check text := rsvp_passcode_ok(p_passcode);
begin
  if v_check <> 'ok' then
    return json_build_object('ok', false, 'error', v_check);
  end if;
  delete from rsvps where id = p_id;
  return json_build_object('ok', true);
end;
$$;

revoke all on function public.get_rsvps(text) from public;
revoke all on function public.delete_rsvp(text, bigint) from public;
grant execute on function public.get_rsvps(text) to anon, authenticated;
grant execute on function public.delete_rsvp(text, bigint) to anon, authenticated;

-- To change the passcode later, run only this (with the new passcode):
--   update public.rsvp_secret
--   set passcode_hash = extensions.crypt('NEW-PASSCODE', extensions.gen_salt('bf'))
--   where id = 1;

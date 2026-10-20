/* ==========================================================
   Ahmed & Reem — RSVP list (ahmed-reem-rsvp.html)
   The passcode is checked inside Supabase (ar_wedding_get_rsvps / ar_wedding_delete_rsvp
   in supabase/setup.sql); it is never stored in this code.
   ========================================================== */

const $ = (sel) => document.querySelector(sel);
const cfg = window.SUPABASE_CONFIG || {};
const STORE_KEY = 'ar-rsvp-passcode';   // kept for this tab only

const els = {
  notConfigured: $('#not-configured'),
  signin: $('#signin'),
  form: $('#signin-form'),
  btn: $('#signin-btn'),
  signinStatus: $('#signin-status'),
  replies: $('#replies'),
  list: $('#list'),
  empty: $('#empty'),
  listStatus: $('#list-status'),
  total: $('#stat-total'),
  withMsg: $('#stat-messages'),
  search: $('#search'),
  refresh: $('#refresh-btn'),
  exportBtn: $('#export-btn'),
  lock: $('#signout-btn'),
  tpl: $('#reply-tpl'),
};

let passcode = '';
let rows = [];
let autoTimer;

const timeFmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Africa/Cairo',
  weekday: 'short', day: 'numeric', month: 'short',
  hour: 'numeric', minute: '2-digit', hour12: true,
});

const ERRORS = {
  wrong: "That passcode isn't right. Try again.",
  locked: 'Too many wrong tries. Wait 15 minutes, then try again.',
};

function setStatus(el, text, kind = '') {
  el.textContent = text;
  el.className = 'status' + (kind ? ' is-' + kind : '');
}

function remember(code) {
  try { code ? sessionStorage.setItem(STORE_KEY, code) : sessionStorage.removeItem(STORE_KEY); } catch (e) { /* storage blocked: just don't remember */ }
}
function recall() {
  try { return sessionStorage.getItem(STORE_KEY) || ''; } catch (e) { return ''; }
}

async function rpc(fn, body) {
  const res = await fetch(`${cfg.url}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: {
      apikey: cfg.anonKey,
      Authorization: `Bearer ${cfg.anonKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}`);
  return res.json();
}

/* ---------------------------------------------------------- */

if (!cfg.url || !cfg.anonKey) {
  els.notConfigured.hidden = false;
} else {
  els.signin.hidden = false;
  const saved = recall();
  if (saved) unlock(saved, { silent: true });
  else els.form.elements.namedItem('passcode').focus();
}

els.form.addEventListener('submit', (e) => {
  e.preventDefault();
  const code = els.form.elements.namedItem('passcode').value.trim();
  if (!code) { setStatus(els.signinStatus, 'Enter the passcode.', 'error'); return; }
  unlock(code);
});

async function unlock(code, { silent = false } = {}) {
  els.btn.disabled = true;
  if (!silent) setStatus(els.signinStatus, 'Checking…');
  try {
    const data = await rpc('ar_wedding_get_rsvps', { p_passcode: code });
    if (!data.ok) {
      remember('');
      setStatus(els.signinStatus, silent ? '' : (ERRORS[data.error] || "Couldn't open the replies."), 'error');
      return;
    }
    passcode = code;
    remember(code);
    els.form.reset();
    setStatus(els.signinStatus, '');
    els.signin.hidden = true;
    els.replies.hidden = false;
    rows = data.rows || [];
    render();
    clearInterval(autoTimer);
    autoTimer = setInterval(() => { if (!document.hidden) load({ quiet: true }); }, 30000);
  } catch (err) {
    setStatus(els.signinStatus, "Couldn't reach Supabase. Check your connection and try again.", 'error');
  } finally {
    els.btn.disabled = false;
  }
}

async function load({ quiet = false } = {}) {
  if (!passcode) return;
  if (!quiet) setStatus(els.listStatus, 'Loading replies…');
  try {
    const data = await rpc('ar_wedding_get_rsvps', { p_passcode: passcode });
    if (!data.ok) { lock(ERRORS[data.error]); return; }
    rows = data.rows || [];
    if (!quiet) setStatus(els.listStatus, '');
    render();
  } catch (err) {
    if (!quiet) setStatus(els.listStatus, "Couldn't load the replies. Check your connection and try again.", 'error');
  }
}

function lock(message = '') {
  passcode = '';
  rows = [];
  remember('');
  clearInterval(autoTimer);
  els.list.replaceChildren();
  els.replies.hidden = true;
  els.signin.hidden = false;
  setStatus(els.signinStatus, message, message ? 'error' : '');
  els.form.elements.namedItem('passcode').focus();
}

els.lock.addEventListener('click', () => lock());
els.refresh.addEventListener('click', () => load());
els.search.addEventListener('input', render);
els.exportBtn.addEventListener('click', exportCsv);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && passcode) load({ quiet: true });
});

/* ---------------------------------------------------------- */

function render() {
  const q = els.search.value.trim().toLowerCase();
  const visible = q
    ? rows.filter((r) => (r.full_name || '').toLowerCase().includes(q) || (r.message || '').toLowerCase().includes(q))
    : rows;

  els.total.textContent = rows.length;
  els.withMsg.textContent = rows.filter((r) => r.message && r.message.trim()).length;

  const frag = document.createDocumentFragment();
  for (const r of visible) {
    const li = els.tpl.content.firstElementChild.cloneNode(true);
    li.querySelector('.reply__name').textContent = r.full_name;
    const t = li.querySelector('.reply__time');
    t.dateTime = r.created_at;
    t.textContent = timeFmt.format(new Date(r.created_at));
    const msg = li.querySelector('.reply__msg');
    if (r.message && r.message.trim()) msg.textContent = r.message;
    else { msg.textContent = 'No message'; msg.classList.add('is-empty'); }
    li.querySelector('.reply__del').addEventListener('click', () => removeRow(r));
    frag.appendChild(li);
  }
  els.list.replaceChildren(frag);
  els.empty.hidden = rows.length > 0;
  if (rows.length && !visible.length) setStatus(els.listStatus, `No replies match "${els.search.value.trim()}".`);
  else if (els.listStatus.textContent.startsWith('No replies match')) setStatus(els.listStatus, '');
}

async function removeRow(r) {
  if (!confirm(`Delete the RSVP from ${r.full_name}? This can't be undone.`)) return;
  try {
    const data = await rpc('ar_wedding_delete_rsvp', { p_passcode: passcode, p_id: r.id });
    if (!data.ok) { lock(ERRORS[data.error]); return; }
    rows = rows.filter((x) => x.id !== r.id);
    setStatus(els.listStatus, `Deleted the RSVP from ${r.full_name}.`, 'ok');
    render();
  } catch (err) {
    setStatus(els.listStatus, "Couldn't delete it. Check your connection and try again.", 'error');
  }
}

function exportCsv() {
  const cell = (v) => {
    let s = String(v ?? '');
    // keep spreadsheets from running it as a formula (incl. leading spaces/tabs and fullwidth forms)
    if (/^\s*[=+\-@\t\r\uFF1D\uFF0B\uFF0D\uFF20]/.test(s)) s = "'" + s;
    return '"' + s.replace(/"/g, '""') + '"';
  };
  const lines = [['Time (Cairo)', 'Full name', 'Message'].map(cell).join(',')];
  for (const r of rows) lines.push([timeFmt.format(new Date(r.created_at)), r.full_name, r.message || ''].map(cell).join(','));
  const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });   // BOM so Excel shows Arabic correctly
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `ahmed-reem-rsvps-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

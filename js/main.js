/* ==========================================================
   Ahmed & Reem — wedding invitation
   ========================================================== */

const CONFIG = {
  // Egypt is UTC+2 in November
  weddingDate: '2026-11-10T20:00:00+02:00',

  musicVolume: 0.6,
};

const $ = (sel, root = document) => root.querySelector(sel);
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------------------------------------------------------- */
/* Music                                                       */
/* ---------------------------------------------------------- */
const music = $('#music');
const musicToggle = $('#music-toggle');
let musicWanted = false;

function fadeVolume(to, ms = 1800) {
  const from = music.volume;
  const start = performance.now();
  const step = (now) => {
    const t = Math.min(1, Math.max(0, (now - start) / ms));
    music.volume = from + (to - from) * t;
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function startMusic() {
  musicWanted = true;
  music.volume = 0;
  const p = music.play();
  if (p) p.then(() => fadeVolume(CONFIG.musicVolume)).catch(() => setMusicUi(false));
  setMusicUi(true);
}

function setMusicUi(playing) {
  musicToggle.setAttribute('aria-pressed', String(playing));
  musicToggle.setAttribute('aria-label', playing ? 'Pause music' : 'Play music');
}

musicToggle.addEventListener('click', () => {
  if (music.paused) {
    musicWanted = true;
    music.play().then(() => fadeVolume(CONFIG.musicVolume, 600)).catch(() => {});
    setMusicUi(true);
  } else {
    musicWanted = false;
    music.pause();
    setMusicUi(false);
  }
});

// Pause when the guest leaves the tab / locks the phone, resume when back
document.addEventListener('visibilitychange', () => {
  if (document.hidden) music.pause();
  else if (musicWanted) music.play().catch(() => {});
});

/* ---------------------------------------------------------- */
/* Intro: the door                                             */
/* ---------------------------------------------------------- */
const intro = $('#intro');
const doorOpen = $('#door-open');
const openBtn = $('#open-btn');
const skipBtn = $('#skip-btn');
let introFinished = false;
let safetyTimer;

openBtn.addEventListener('click', () => {
  intro.classList.add('is-opening');
  startMusic();

  if (reducedMotion) { finishIntro(); return; }

  doorOpen.currentTime = 0;
  const p = doorOpen.play();
  if (p) p.catch(finishIntro);
  doorOpen.classList.add('is-visible');
  skipBtn.hidden = false;
  safetyTimer = setTimeout(finishIntro, 14000); // in case the video stalls
});

doorOpen.addEventListener('ended', finishIntro);
skipBtn.addEventListener('click', finishIntro);

function finishIntro() {
  if (introFinished) return;
  introFinished = true;
  clearTimeout(safetyTimer);

  intro.classList.add('is-done');
  document.documentElement.classList.remove('is-locked');
  window.scrollTo(0, 0);
  document.body.classList.add('is-revealed');
  musicToggle.hidden = false;

  setTimeout(() => {
    doorOpen.pause();
    introPetals.stop();
    intro.hidden = true;
  }, 1300);
}

/* ---------------------------------------------------------- */
/* Countdown                                                   */
/* ---------------------------------------------------------- */
const target = new Date(CONFIG.weddingDate).getTime();
const countdown = $('.cd');
const countdownDone = $('#countdown-done');
const units = {
  days: $('[data-unit="days"]'),
  hours: $('[data-unit="hours"]'),
  minutes: $('[data-unit="minutes"]'),
  seconds: $('[data-unit="seconds"]'),
};

function tick() {
  const diff = target - Date.now();
  if (diff <= 0) {
    countdown.hidden = true;
    countdownDone.hidden = false;
    return false;
  }
  const s = Math.floor(diff / 1000);
  units.days.textContent = Math.floor(s / 86400);
  units.hours.textContent = String(Math.floor(s / 3600) % 24).padStart(2, '0');
  units.minutes.textContent = String(Math.floor(s / 60) % 60).padStart(2, '0');
  units.seconds.textContent = String(s % 60).padStart(2, '0');
  return true;
}
if (tick()) {
  const timer = setInterval(() => { if (!tick()) clearInterval(timer); }, 1000);
}

/* ---------------------------------------------------------- */
/* Falling leaves and petals: "Our story" and the closed door   */
/* ---------------------------------------------------------- */
const LEAVES_AND_PETALS = [
  { fill: '#8E9B6E', rib: '#6F7C52', kind: 'leaf' },   // eucalyptus
  { fill: '#A7B08A', rib: '#848E66', kind: 'leaf' },   // sage
  { fill: '#C9A86A', rib: '#A9894E', kind: 'leaf' },   // gold
  { fill: '#FFFDF7', rib: '#EADFCB', kind: 'petal' },  // white petal
  { fill: '#FFFDF7', rib: '#EADFCB', kind: 'petal' },  // white petal
  { fill: '#F6E7DF', rib: '#E6CFC3', kind: 'petal' },  // blush petal
];
const PETALS_ONLY = LEAVES_AND_PETALS.filter((c) => c.kind === 'petal');

function makeFalling(canvas, COLORS, density = 11000) {
  const ctx = canvas.getContext('2d');
  const section = canvas.parentElement;
  let w = 0, h = 0, dpr = 1, items = [], running = false, last = 0, raf;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = section.clientWidth;
    h = section.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.round(Math.min(42, Math.max(14, (w * h) / density)));
    while (items.length < count) items.push(spawn(true));
    items.length = count;
  }

  function spawn(anywhere) {
    const c = COLORS[Math.floor(Math.random() * COLORS.length)];
    return {
      c,
      x: Math.random() * w,
      y: anywhere ? Math.random() * h : -30,
      size: c.kind === 'petal' ? 7 + Math.random() * 6 : 9 + Math.random() * 8,
      vy: 18 + Math.random() * 26,            // px per second
      vx: 6 + Math.random() * 14,             // gentle wind to the right
      sway: 14 + Math.random() * 24,
      phase: Math.random() * Math.PI * 2,
      freq: 0.6 + Math.random() * 0.8,
      rot: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 1.6,
      flip: Math.random() * Math.PI * 2,
      flipSpeed: 1 + Math.random() * 2,
      alpha: 0.75 + Math.random() * 0.25,
    };
  }

  function drawLeaf(p) {
    const s = p.size;
    ctx.beginPath();
    if (p.c.kind === 'leaf') {
      ctx.moveTo(0, -s);
      ctx.bezierCurveTo(s * 0.7, -s * 0.5, s * 0.55, s * 0.6, 0, s);
      ctx.bezierCurveTo(-s * 0.55, s * 0.6, -s * 0.7, -s * 0.5, 0, -s);
    } else {
      ctx.moveTo(0, s * 0.9);
      ctx.bezierCurveTo(s * 0.9, s * 0.4, s * 0.8, -s * 0.8, s * 0.15, -s * 0.7);
      ctx.quadraticCurveTo(0, -s * 0.45, -s * 0.15, -s * 0.7);
      ctx.bezierCurveTo(-s * 0.8, -s * 0.8, -s * 0.9, s * 0.4, 0, s * 0.9);
    }
    ctx.fillStyle = p.c.fill;
    ctx.fill();
    ctx.strokeStyle = p.c.rib;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    if (p.c.kind === 'leaf') {
      ctx.moveTo(0, -s * 0.85);
      ctx.lineTo(0, s * 1.15);
    } else {
      ctx.moveTo(0, s * 0.6);
      ctx.lineTo(0, -s * 0.2);
    }
    ctx.stroke();
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000 || 0);
    last = now;
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < items.length; i++) {
      const p = items[i];
      p.phase += p.freq * dt;
      p.flip += p.flipSpeed * dt;
      p.rot += p.spin * dt;
      p.y += p.vy * dt;
      p.x += (p.vx + Math.cos(p.phase) * p.sway) * dt;
      if (p.y > h + 30 || p.x > w + 30) {
        items[i] = spawn(false);
        items[i].x = Math.random() * w * 1.1 - w * 0.1;
        continue;
      }
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.scale(1, 0.35 + Math.abs(Math.cos(p.flip)) * 0.65);  // tumbling
      ctx.shadowColor = 'rgba(74, 52, 38, .18)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetY = 2;
      drawLeaf(p);
      ctx.restore();
    }
    if (running) raf = requestAnimationFrame(frame);
  }

  function start() {
    if (running) return;
    running = true;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
    cancelAnimationFrame(raf);
  }

  resize();
  window.addEventListener('resize', resize);
  new ResizeObserver(resize).observe(section);

  if (reducedMotion) {          // a still scatter, no movement
    frame(performance.now());
    return { stop() {} };
  }
  const io = new IntersectionObserver(([entry]) => {
    entry.isIntersecting ? start() : stop();
  }, { rootMargin: '100px' });
  io.observe(section);
  return { stop() { io.disconnect(); stop(); } };
}

makeFalling($('#leaves'), LEAVES_AND_PETALS);
const introPetals = makeFalling($('#intro-petals'), PETALS_ONLY, 16000);

/* ---------------------------------------------------------- */
/* RSVP                                                        */
/* ---------------------------------------------------------- */
(function rsvp() {
  const form = $('#rsvp-form');
  const nameInput = form.elements.namedItem('fullname');
  const messageInput = form.elements.namedItem('message');
  const trap = form.elements.namedItem('website');
  const submit = $('#rsvp-submit');
  const status = $('#rsvp-status');

  function setStatus(text, kind = '') {
    status.textContent = text;
    status.className = 'rsvp__status' + (kind ? ' is-' + kind : '');
  }

  nameInput.addEventListener('input', () => nameInput.removeAttribute('aria-invalid'));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (trap.value) return;

    const fullname = nameInput.value.trim();
    const message = messageInput.value.trim();

    if (fullname.length < 2) {
      nameInput.setAttribute('aria-invalid', 'true');
      nameInput.focus();
      setStatus('Please write your full name.', 'error');
      return;
    }

    const sb = window.SUPABASE_CONFIG || {};
    if (!sb.url || !sb.anonKey) {
      console.warn('Supabase is not set up. See README.md → "Connect the RSVP form".');
      setStatus('RSVP opens soon. Please try again later.', 'error');
      return;
    }

    submit.disabled = true;
    submit.textContent = 'Sending…';
    setStatus('');

    try {
      const res = await fetch(`${sb.url}/rest/v1/${sb.table}`, {
        method: 'POST',
        headers: {
          apikey: sb.anonKey,
          Authorization: `Bearer ${sb.anonKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({ full_name: fullname, message: message || null }),
      });
      if (!res.ok) throw new Error(`Supabase ${res.status}`);

      form.reset();
      setStatus(`Thank you, ${fullname.split(' ')[0]}. Your RSVP was sent.`, 'ok');
    } catch (err) {
      setStatus("Your RSVP didn't send. Check your connection and try again.", 'error');
    } finally {
      submit.disabled = false;
      submit.textContent = 'Send RSVP';
    }
  });
})();

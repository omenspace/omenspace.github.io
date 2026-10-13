/* OMEN Space — interactive UI demo (pure simulation, no hardware access) */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const app = $('#omenApp');
  if (!app) return;

  const S = { mode: 'balanced', fan: 'auto', custom: 3500, pl1: 45, pl2: 56, tcc: 0, gpu: 'hybrid',
              effect: 'cycle', speed: 50, bright: 100, color: '#3584e4' };
  const DEF = { pl1: 45, pl2: 56, tcc: 0 };
  const cur = { ct: 43, cp: 8.8, cl: 6, gt: 36, gp: 3.7, gl: 0, rpm: 2400 };
  let visible = false, page = 'perf', dirty = true;

  /* ---------- toast ---------- */
  const toastEl = $('#oaToast'); let tt;
  function toast(m) { toastEl.textContent = m; toastEl.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => toastEl.classList.remove('on'), 2300); }

  /* ---------- pages ---------- */
  const tabs = $$('.oa-side [data-page]');
  tabs.forEach(b => b.addEventListener('click', () => {
    page = b.dataset.page;
    tabs.forEach(x => x.classList.toggle('on', x === b));
    $$('.oa-page').forEach(p => p.classList.toggle('on', p.dataset.page === page));
    $('.oa-main').scrollTop = 0; dirty = true;
  }));

  /* ---------- option groups (mode / fan / gpu) ---------- */
  const GPU_ROUTE = { hybrid: 'eDP-1 \u2192 Intel Integrated Graphics (Hybrid)', discrete: 'eDP-1 \u2192 NVIDIA GeForce RTX 4050 (Discrete)', advanced: 'eDP-1 \u2192 Dynamic MUX (Advanced)' };
  function syncGroups() {
    $$('.oa-opt').forEach(b => b.classList.toggle('on', S[b.dataset.g] === b.dataset.v));
    $('#customRow').hidden = S.fan !== 'custom';
    $('#gpuRoute').textContent = GPU_ROUTE[S.gpu];
    hudRender();
  }
  $$('.oa-opt').forEach(b => b.addEventListener('click', () => {
    const g = b.dataset.g, v = b.dataset.v;
    if (S[g] === v) return;
    S[g] = v; syncGroups(); tick(true);
    if (g === 'gpu') toast('GPU mode set to ' + b.querySelector('b').textContent + ' \u2014 restart required');
    else toast((g === 'mode' ? 'Performance mode: ' : 'Fan mode: ') + b.querySelector('b').textContent);
  }));

  /* ---------- sliders ---------- */
  const FMT = {
    pl1: v => v + ' W', pl2: v => v + ' W', tcc: v => (100 - v) + '\u00B0C (Offset: ' + v + '\u00B0C)',
    speed: v => v, bright: v => v, custom: v => v + ' RPM'
  };
  function paintRange(r) { const p = (r.value - r.min) / (r.max - r.min) * 100; r.style.setProperty('--p', p + '%'); }
  function syncSlider(k) {
    const r = $('[data-s="' + k + '"]'), o = $('[data-o="' + k + '"]');
    r.value = S[k]; paintRange(r); o.textContent = FMT[k](S[k]);
  }
  $$('[data-s]').forEach(r => r.addEventListener('input', () => {
    const k = r.dataset.s; S[k] = +r.value;
    if (k === 'pl1' && S.pl2 < S.pl1) { S.pl2 = S.pl1; syncSlider('pl2'); }
    if (k === 'pl2' && S.pl2 < S.pl1) { S.pl1 = S.pl2; syncSlider('pl1'); }
    paintRange(r); $('[data-o="' + k + '"]').textContent = FMT[k](S[k]);
    if (k === 'bright') { kb.style.setProperty('--b', .15 + .85 * S.bright / 100); }
    dirty = true; tick(true);
  }));
  Object.keys(FMT).forEach(syncSlider);
  $('#pwApply').addEventListener('click', () => toast('Power limits applied & saved (simulated)'));
  $('#pwReset').addEventListener('click', () => { Object.assign(S, DEF); ['pl1', 'pl2', 'tcc'].forEach(syncSlider); tick(true); toast('Power limits reset to defaults'); });

  /* ---------- simulated telemetry ---------- */
  const MODES = { eco: { t: 36, p: 6, l: 5 }, balanced: { t: 43, p: 9, l: 8 }, performance: { t: 58, p: 30, l: 26 } };
  function target() {
    const m = MODES[S.mode]; let t = m.t, p = m.p, l = m.l;
    if (S.mode === 'performance') { t += (S.pl1 - 45) * .45; p *= S.pl1 / 45; l += (S.pl2 - 56) * .05; }
    let rpm;
    if (S.fan === 'max') { rpm = 5800; t -= 8; }
    else if (S.fan === 'quiet') { rpm = 1800; t += 5; }
    else if (S.fan === 'custom') { rpm = S.custom; t -= (S.custom - 3000) / 400; }
    else rpm = 1700 + Math.max(0, t - 34) * 55;
    t = Math.min(t, 100 - S.tcc);
    let gt = 36, gp = 3.7, gl = 0;
    if (S.gpu !== 'hybrid') { gt = 45; gp = 14; gl = 5; }
    if (S.mode === 'performance') { gt += 7; gp += S.gpu === 'hybrid' ? 4 : 16; gl += S.gpu === 'hybrid' ? 2 : 18; }
    if (S.fan === 'max') gt -= 6; if (S.fan === 'quiet') gt += 4;
    return { ct: t, cp: p, cl: l, gt, gp, gl, rpm };
  }
  const el = { cT: $('#cT'), cL: $('#cL'), cP: $('#cP'), cF: $('#cF'), cBar: $('#cBar'),
               gT: $('#gT'), gL: $('#gL'), gP: $('#gP'), gF: $('#gF'), gBar: $('#gBar'), ramBar: $('#ramBar') };
  function tick(fast) {
    const g = target(), k = fast ? .6 : .35, n = () => Math.random() - .5;
    cur.ct += (g.ct + n() * 1.2 - cur.ct) * k;
    cur.cp += (g.cp * (1 + n() * .12) - cur.cp) * k;
    cur.cl += (Math.max(1, g.cl + n() * 4) - cur.cl) * k;
    cur.gt += (g.gt + n() * .8 - cur.gt) * k;
    cur.gp += (g.gp * (1 + n() * .1) - cur.gp) * k;
    cur.gl += (Math.max(0, g.gl + n() * 2) - cur.gl) * k;
    cur.rpm += (g.rpm + n() * 60 - cur.rpm) * k;
    const rpm = Math.round(cur.rpm / 10) * 10;
    el.cT.textContent = Math.round(cur.ct) + '\u00B0C'; el.cL.textContent = Math.round(cur.cl) + '%';
    el.cP.textContent = cur.cp.toFixed(1) + 'W'; el.cF.textContent = rpm + ' RPM';
    el.cBar.style.width = Math.max(3, cur.cl) + '%';
    el.gT.textContent = Math.round(cur.gt) + '\u00B0C'; el.gL.textContent = Math.round(cur.gl) + '%';
    el.gP.textContent = cur.gp.toFixed(1) + 'W'; el.gF.textContent = Math.round((cur.rpm - 40) / 10) * 10 + ' RPM';
    el.gBar.style.width = Math.max(2, cur.gl) + '%';
    el.ramBar.style.width = (53 + n() * 2) + '%';
    hudRender();
  }
  setInterval(() => { if (visible && !document.hidden) tick(); }, 900);

  /* ---------- quick HUD ---------- */
  const hud = $('#oaHud'), hudBtn = $('#hudBtn');
  const MODE_LIST = ['eco', 'balanced', 'performance'], FAN_LIST = ['auto', 'max', 'custom', 'quiet'];
  const cap = s => s[0].toUpperCase() + s.slice(1);
  function hudRender() {
    if (hud.hidden) return;
    $('#hudLine').innerHTML = '<b>' + cap(S.mode) + '</b> &middot; Fan ' + cap(S.fan) + '<br>CPU ' + el.cT.textContent + ' &middot; ' + el.cF.textContent;
  }
  function hudToggle(on) { hud.hidden = on === undefined ? !hud.hidden : !on; hudBtn.classList.toggle('on', !hud.hidden); hudRender(); }
  hudBtn.addEventListener('click', () => hudToggle());
  $('#hudMode').addEventListener('click', () => { S.mode = MODE_LIST[(MODE_LIST.indexOf(S.mode) + 1) % 3]; syncGroups(); tick(true); });
  $('#hudFan').addEventListener('click', () => { S.fan = FAN_LIST[(FAN_LIST.indexOf(S.fan) + 1) % 4]; syncGroups(); tick(true); });
  document.addEventListener('keydown', e => { if (visible && e.shiftKey && e.key === 'F2') { e.preventDefault(); hudToggle(); } });

  /* ---------- RGB studio ---------- */
  const ROWS = [
    ['Esc', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12', 'Del'],
    ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', ['Bksp', 2]],
    [['Tab', 1.5], 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[', ']', ['\\', 1.5]],
    [['Caps', 1.8], 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', "'", ['Enter', 2.2]],
    [['Shift', 2.3], 'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/', ['Shift', 2.7]],
    [['Ctrl', 1.4], 'Fn', ['Alt', 1.4], ['', 6], ['Alt', 1.4], ['Ctrl', 1.4], '\u2190', '\u2191', '\u2193', '\u2192']
  ];
  const kb = $('#rgbKb'), keys = [];
  ROWS.forEach((r, ri) => {
    const row = document.createElement('div'); row.className = 'oa-krow';
    const total = r.reduce((a, k) => a + (Array.isArray(k) ? k[1] : 1), 0); let acc = 0;
    r.forEach(k => {
      const [label, w] = Array.isArray(k) ? k : [k, 1];
      const b = document.createElement('button'); b.className = 'oa-key'; b.textContent = label; b.style.flex = w; b.tabIndex = -1;
      const key = { b, x: (acc + w / 2) / total, y: ri / 5, own: null, last: '' }; acc += w;
      b.addEventListener('click', () => { key.own = S.color; if (S.effect !== 'static') { S.effect = 'static'; effSel.value = 'static'; toast('Static effect \u2014 painting keys'); } dirty = true; });
      keys.push(key); row.appendChild(b);
    });
    kb.appendChild(row);
  });
  const effSel = $('#rgbEffect');
  effSel.addEventListener('change', () => { S.effect = effSel.value; keys.forEach(k => k.own = null); dirty = true; });
  const PAL = ['#3584e4', '#ff4d6d', '#57e389', '#f8e45c', '#ff9f43', '#b57bff', '#00e5ff', '#ffffff'];
  const pal = $('#rgbPal');
  PAL.forEach((c, i) => {
    const b = document.createElement('button'); b.style.setProperty('--c', c); b.setAttribute('aria-label', c); if (i === 0) b.classList.add('on');
    b.addEventListener('click', () => {
      S.color = c; $$('button', pal).forEach(x => x.classList.toggle('on', x === b));
      keys.forEach(k => k.own = null); if (S.effect !== 'static') { S.effect = 'static'; effSel.value = 'static'; }
      dirty = true;
    });
    pal.appendChild(b);
  });
  function rgbFrame() {
    if (!visible || page !== 'rgb' || document.hidden) return;
    if (S.effect === 'static' && !dirty) return;
    dirty = false;
    const t = performance.now() / 1000, sp = S.speed / 50;
    keys.forEach(k => {
      let c;
      if (k.own) c = k.own;
      else if (S.effect === 'static') c = S.color;
      else if (S.effect === 'cycle') c = 'hsl(' + ((t * 50 * sp) % 360).toFixed(0) + ',90%,55%)';
      else if (S.effect === 'wave') c = 'hsl(' + ((k.x * 300 + t * 70 * sp) % 360).toFixed(0) + ',90%,55%)';
      else { const f = .3 + .7 * (.5 + .5 * Math.sin(t * sp * 2.2)); c = 'color-mix(in srgb,' + S.color + ' ' + (f * 100).toFixed(0) + '%,#222)'; }
      if (c !== k.last) { k.b.style.background = c; k.last = c; }
    });
  }
  setInterval(rgbFrame, 45);

  /* ---------- visibility ---------- */
  new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) { dirty = true; tick(true); } }, { threshold: .15 }).observe(app);
  syncGroups(); tick(true);
})();

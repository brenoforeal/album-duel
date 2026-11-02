// Mix restyle tests. Run on the app page (local http server), on an album's Rankings tab:
//   await fetch('tests/theme.js?' + Date.now()).then(r => r.text()).then(t => (0, eval)(t))
(() => {
  const out = [];
  const eq = (a, b) => { const x = JSON.stringify(a), y = JSON.stringify(b); if (x !== y) throw new Error(`got ${x}, want ${y}`); };
  const T = (name, fn) => { try { fn(); out.push('PASS ' + name); } catch (e) { out.push('FAIL ' + name + ': ' + e.message); } };
  const cs = getComputedStyle(document.documentElement), src = [...document.querySelectorAll('style')].map(s => s.textContent).join('\n');
  const js = [...document.scripts].map(s => s.textContent).join('\n');

  // ---- Task 1: tokens, greys and font ----
  T('bg is true black', () => eq(getComputedStyle(document.body).backgroundColor, 'rgb(10, 10, 10)'));
  T('tokens', () => eq(['--bg', '--panel', '--panel2', '--line', '--text', '--muted', '--head', '--accent'].map(v => cs.getPropertyValue(v).trim()),
    ['#0a0a0a', '#141414', '#1c1c1c', '#2a2a2a', '#d4d7db', '#8c9196', '#fff', '#c9b6ff']));
  T('body font', () => eq(/Inter Tight/.test(getComputedStyle(document.body).fontFamily), true));
  T('chart font (single quotes, sits in an SVG attribute)', () => eq(FONT.startsWith("'Inter Tight'"), true));
  T('no old greys in CSS', () => eq(src.match(/#(0e1015|161922|1d212c|2a2f3c|e9ebf1|8d94a6|1f2330|262b37|252a36|2c3242|141720|1c2030|232837|3d4456|3a4152|17131f)\b|rgba\(14,16,21/gi), null));
  T('capture uses new bg + font', () => eq([/backgroundColor: '#0a0a0a'/.test(js), /16px "Inter Tight"/.test(js)], [true, true]));
  T('static export loads Inter Tight', () => eq(/family=Inter\+Tight/.test(js), true));

  // ---- Task 2: rounded shapes (run where a card, a button and a text input are on screen) ----
  const rad = sel => { const e = document.querySelector(sel); return e ? getComputedStyle(e).borderTopLeftRadius : 'missing'; };
  const flat = src.replace(/\s/g, '');
  T('card radius', () => eq(rad('.card'), '16px'));
  T('button is pill', () => eq(rad('.btn'), '999px'));
  T('score pill is pill', () => eq(/(^|})\.pill\{[^}]*border-radius:999px/.test(flat), true));
  T('input radius', () => eq(rad('input[type=text],input:not([type]),textarea'), '10px'));

  // ---- Task 3: score scale, stars, charts, people defaults ----
  T('RATE retuned', () => eq(RATE.map(r => r[1]), ['#1f9d55', '#57c27a', '#d9c13a', '#e8892b', '#d6453d', '#8b5cf6']));
  T('RATE text', () => eq(RATE.map(r => r[2]), ['#fff', '#000', '#000', '#000', '#fff', '#fff']));
  T('PAL', () => eq([PAL.grid, PAL.ax, PAL.text, PAL.panel, PAL.line], ['#1e1e1e', '#8c9196', '#d4d7db', '#141414', '#4a4a4a']));
  T('both default', () => { const b = S.ui.both; delete S.ui.both; try { eq(PAL.both, '#c9b6ff'); } finally { if (b) S.ui.both = b; } });
  T('people defaults', () => eq(typeof PEOPLE_COLS !== 'undefined' && PEOPLE_COLS, ['#00d1b2', '#ff4f6d', '#4aa8ff', '#ff8a3d', '#9be15d']));
  T('no old people blue left', () => eq(/'#5aa9ff'|'#ff5a5f'/.test(js), false));
  T('star gradient uses new green', () => eq([/#1f9d55/.test(src), /#186a3b/.test(src)], [true, false]));
  T('logo dot teal/pink', () => eq(/\.logo \.dot\{[^}]*#00d1b2[^}]*#ff4f6d/.test(src), true));
  T('saved colours untouched', () => eq(S.slots.every(sl => sl.people.every(p => /^#[0-9a-f]{6}$/i.test(p.color))), true));

  // ---- Final review fixes ----
  T('wrapping button rows are not capsules', () => { const segs = [...js.matchAll(/class="seg"[^>]*flex-wrap:wrap/g)]; eq(segs.length, 0);
    eq(/\.seg\.wrap\{[^}]*border-radius:18px/.test(flat), true); });
  T('added person avoids colours already in the slot', () => eq(typeof nextPersonColor === 'function' && [nextPersonColor(['#5aa9ff', '#ff5a5f']), nextPersonColor(['#00d1b2', '#ff4f6d'])], ['#00d1b2', '#4aa8ff']));
  T('chart lines visible on black', () => eq(PAL.line, '#4a4a4a'));

  const fails = out.filter(l => l.startsWith('FAIL'));
  return `${out.length - fails.length}/${out.length} pass\n` + (fails.length ? fails.join('\n') : 'all green');
})()

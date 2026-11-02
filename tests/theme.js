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

  const fails = out.filter(l => l.startsWith('FAIL'));
  return `${out.length - fails.length}/${out.length} pass\n` + (fails.length ? fails.join('\n') : 'all green');
})()

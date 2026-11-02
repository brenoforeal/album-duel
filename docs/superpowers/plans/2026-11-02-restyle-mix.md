# Restyle "Mix" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give `album-duel.html` the Mix look (true black, rounded pill shapes, Inter Tight, lavender accent, teal/pink defaults) with no feature or layout change.

**Architecture:** All CSS lives in the one `<style>` block (lines 10–492); exports and screenshots copy it, so restyling that block plus a few JS colour constants (`PAL`, `FONT`, `RATE`, default people colours, `captureEl`) restyles everything. Old hard-coded greys become CSS variables or the new values from the mapping table below.

**Tech Stack:** Plain HTML/CSS/JS, single file, no build. html2canvas 1.4.1 for screenshots. Google Fonts.

**Spec:** `docs/superpowers/specs/2026-11-02-redesign-design.md` (mockup: `docs/mockups/design-options.html`, style "★ Mix", accent 5, pair 4).

## Global Constraints
- Single file `album-duel.html`, no build step, no new libraries.
- No layout, feature or stored-data change. People already saved keep their stored colours.
- Font: **Inter Tight** 400/500/600/700/800 everywhere; numbers `font-variant-numeric: tabular-nums`.
- Accent `#c9b6ff` (text on it `#0a0a0a`). Default people: `#00d1b2`, `#ff4f6d`, then `#4aa8ff`, `#ff8a3d`, `#9be15d`.
- Colour pickers (per person, `pp_both`, per export) keep working exactly as now.
- Work on a branch `restyle-mix`, not `main`.
- Test in the browser from a local http server (the preview pane has no localStorage). Tests run on the app page like `tests/special-tens.js`.

## Colour mapping (old → new), used by Tasks 1 and 3
| Old | New | Role |
|---|---|---|
| `#0e1015`, `rgba(14,16,21,a)` | `#0a0a0a`, `rgba(10,10,10,a)` | `--bg`, sticky bars, capture background |
| `#161922` | `#141414` | `--panel` |
| `#1d212c` | `#1c1c1c` | `--panel2` |
| `#2a2f3c` | `#2a2a2a` | `--line` |
| `#e9ebf1` | `#d4d7db` | `--text` (headings get new `--head:#fff`) |
| `#8d94a6`, `#7f879a` | `#8c9196` | `--muted`, `PAL.ax` |
| `#1f2330`, `#262b37` | `#1e1e1e` | row lines, `PAL.grid` |
| `#252a36`, `#2c3242` | `#242424`, `#2e2e2e` | inner borders |
| `#141720`, `#1c2030` | `#101010`, `#1a1a1a` | inner fills |
| `#232837`, `#3d4456`, `#3a4152` | `#222222`, `#3a3a3a`, `#383838` | hover fill / hover border |
| `#4a5163` | `#2a2a2a` | `PAL.line` |
| `#17131f` | `#0a0a0a` | text on primary button |
| `rgba(5,6,9,.7)` | `rgba(0,0,0,.7)` | modal overlay |
`--good #6fdc9a`, `--warn #ffd166`, `--bad #ff7a7a`, medal colours (line 875) and `PAL.hot` stay.

## Review Focus
1. Screenshots (Copy image / Save PNG): background must be the new black and Inter Tight must be measured and drawn (no spread-out words) — fallback to system font still works if it never loads.
2. Static and clickable exports and Site app `index.html` show the new look (they copy `<style>` and the font `<link>`).
3. Star pills (10* / 10**) on pill shapes: silver/gold rings show live and in screenshots.
4. Phone width (≤880px): sticky toolbar background, pills and cards still fit, no horizontal scroll.
5. Old saved data: people keep blue/red; a new slot / new person gets teal, pink, …

---

### Task 1: Tokens, greys and font

**Files:**
- Modify: `album-duel.html:7-8` (font link), `:12-13` (`:root`), `:16-17` (body font, headings), all CSS lines with old greys from the mapping table (12, 30, 32, 46, 47, 61, 144, 145, 171, 189, 199, 216, 237, 239, 243, 249, 301, 306, 319, 347, 349, 368, 374, 381, 395, 445, 479)
- Modify: `album-duel.html:523` (`FONT`), `:2460-2469` (`captureEl`), `:3053` (`buildStaticPage` font link)
- Create: `tests/theme.js`

**Interfaces:**
- Produces: CSS vars `--bg --panel --panel2 --line --text --muted --head --accent`; `FONT = '"Inter Tight", system-ui, sans-serif'`; `tests/theme.js` with the same runner shape as `tests/special-tens.js` (`T(name, fn)`, `eq`, returns `"n/m pass"`), which Tasks 2–3 append to.

- [ ] **Step 1: Create branch** `git switch -c restyle-mix`; commit the spec and mockup (`docs/superpowers/specs/…`, `docs/mockups/design-options.html`, this plan).

- [ ] **Step 2: Write failing tests in `tests/theme.js`**

```js
const cs = getComputedStyle(document.documentElement), src = [...document.querySelectorAll('style')].map(s => s.textContent).join('\n');
const js = [...document.scripts].map(s => s.textContent).join('\n');
T('bg is true black', () => eq(getComputedStyle(document.body).backgroundColor, 'rgb(10, 10, 10)'));
T('tokens', () => eq(['--bg','--panel','--panel2','--line','--text','--muted','--head','--accent'].map(v => cs.getPropertyValue(v).trim()),
  ['#0a0a0a','#141414','#1c1c1c','#2a2a2a','#d4d7db','#8c9196','#fff','#c9b6ff']));
T('body font', () => eq(/Inter Tight/.test(getComputedStyle(document.body).fontFamily), true));
T('chart font', () => eq(FONT.startsWith('"Inter Tight"'), true));
T('no old greys in CSS', () => eq(src.match(/#(0e1015|161922|1d212c|2a2f3c|e9ebf1|8d94a6|1f2330|262b37|252a36|2c3242|141720|1c2030|232837|3d4456|3a4152|17131f)\b|rgba\(14,16,21/gi), null));
T('capture uses new bg + font', () => eq([/backgroundColor: '#0a0a0a'/.test(js), /16px "Inter Tight"/.test(js)], [true, true]));
T('static export loads Inter Tight', () => eq(/family=Inter\+Tight/.test(js), true));
```

- [ ] **Step 3: Run, expect FAIL** — serve the folder (`python -m http.server 8000`), open `http://localhost:8000/album-duel.html`, run in the console: `await fetch('tests/theme.js?' + Date.now()).then(r => r.text()).then(t => (0, eval)(t))`. Expected: failures on every test.

- [ ] **Step 4: Implement**
  - Font links (head and `buildStaticPage`): `family=Inter+Tight:wght@400;500;600;700;800`.
  - `:root`: values from the mapping table plus `--head:#fff`; keep `--good/--warn/--bad`; `--radius:16px`.
  - `body` font stack `"Inter Tight",system-ui,…`; `h1,h2,h3{color:var(--head)}`, `h1` letter-spacing `-.025em`; add `font-variant-numeric:tabular-nums` to `body`.
  - Replace every old grey per the table (prefer `var(--…)` where a token matches).
  - `.btn.primary` text `#0a0a0a`.
  - `captureEl`: `backgroundColor: '#0a0a0a'`; font load ``d.fonts.load(`${w} 16px "Inter Tight"`)``. `interReady()` regex stays.

- [ ] **Step 5: Run tests, expect 7/7 pass.** Also run `tests/special-tens.js`: expect all green.

- [ ] **Step 6: Commit** `git commit -am "Restyle: true black tokens and Inter Tight"`

### Task 2: Rounded Pudding shapes

**Files:**
- Modify: `album-duel.html` CSS radius rules (lines 45–479, list below)

**Interfaces:**
- Consumes: `--radius` from Task 1.

Radius map — **999px (pill):** `.btn` (45), `.btn.sm` (50), `.seg` (59), `.seg button` (60), `.tabs button` (133), `.offbtn` (154), `.sumtab .pill` (174), `.tnlist .pill,.alltab .pill` (245), `.gapchip` (252), `.icon-x` (287), `.mx td` (314), `.sp-pill` (399), and the base `.pill` rule. **16px:** `.card` (via `--radius`), `.snap-area` (98), `.mbox` (375), `.kpi` (262), `.oc` (103), `.hc` (117), `.acard` (367), `.rt tr`/`.step` phone rules (465, 478). **10px:** text inputs/select/textarea (52), `.band-name` (83), `.alb` (85), `.rank-list li` (208), `.res` (379), `.toast` (381). Leave tiny bars, meters, legend swatches, covers and `.pd-b` as they are.

- [ ] **Step 1: Append failing tests to `tests/theme.js`**

```js
const rad = sel => { const e = document.querySelector(sel); return e ? getComputedStyle(e).borderTopLeftRadius : 'missing'; };
T('card radius', () => eq(rad('.card'), '16px'));
T('button is pill', () => eq(rad('.btn'), '999px'));
T('score pill is pill', () => eq(/\.pill\{[^}]*border-radius:999px/.test(src.replace(/\s/g, '')), true));
T('input radius', () => eq(rad('input[type=text],input:not([type]),textarea'), '10px'));
```
(Run on an album page in Rankings so `.card`, `.btn`, inputs exist.)

- [ ] **Step 2: Run, expect the 4 new tests to FAIL.**
- [ ] **Step 3: Apply the radius map.** Pills that hold two-digit scores keep their `min-width`; add `padding-inline` where text touches the round ends.
- [ ] **Step 4: Run, expect all theme tests pass**; screenshot Rankings, Stats and a modal to check nothing looks clipped.
- [ ] **Step 5: Commit** `git commit -am "Restyle: pill buttons, chips and score pills; 16px cards"`

### Task 3: JS colours — score scale, stars, charts, people defaults

**Files:**
- Modify: `album-duel.html:32` (logo dot), `:176-178` (star pill CSS), `:522` (`PAL`), `:793` (`RATE`), `:1855` (`librarySlot` fallback), `:2468` (capture star border), `:2576` (`ppAdd`), `:2915` (`slNew` cols), `:2949` (new person)

**Interfaces:**
- Produces: `const PEOPLE_COLS = ['#00d1b2', '#ff4f6d', '#4aa8ff', '#ff8a3d', '#9be15d']` next to `PAL`; used by `slNew`, `ppAdd` (`PEOPLE_COLS[sl.people.length % 5]`), the new-person default and `librarySlot` fallback (`PEOPLE_COLS[0]`).

- [ ] **Step 1: Append failing tests**

```js
T('RATE retuned', () => eq(RATE.map(r => r[1]), ['#1f9d55','#57c27a','#d9c13a','#e8892b','#d6453d','#8b5cf6']));
T('RATE text', () => eq(RATE.map(r => r[2]), ['#fff','#000','#000','#000','#fff','#fff']));
T('PAL', () => eq([PAL.grid, PAL.ax, PAL.text, PAL.panel, PAL.line], ['#1e1e1e','#8c9196','#d4d7db','#141414','#2a2a2a']));
T('both default', () => { const b = S.ui.both; delete S.ui.both; try { eq(PAL.both, '#c9b6ff'); } finally { if (b) S.ui.both = b; } });
T('people defaults', () => eq(PEOPLE_COLS, ['#00d1b2','#ff4f6d','#4aa8ff','#ff8a3d','#9be15d']));
T('no old people blue left', () => eq(/'#5aa9ff'|'#ff5a5f'/.test(js), false));
T('star gradient uses new green', () => eq([/#1f9d55/.test(src), /#186a3b/.test(src)], [true, false]));
T('saved colours untouched', () => eq(S.slots.every(sl => sl.people.every(p => /^#[0-9a-f]{6}$/i.test(p.color))), true));
```

- [ ] **Step 2: Run, expect the new tests to FAIL.**
- [ ] **Step 3: Implement** — `RATE` and `PAL` values from the tests; star gradient stops built around `#1f9d55` (e.g. `#28b866 0%, #1f9d55 45%, #177a42 55%, #1c8c4c 100%`), keep silver `#d9dde3` / gold `#ffd34d` rings in both the live CSS and the capture override; logo dot `conic-gradient(#00d1b2 0 50%,#ff4f6d 50% 100%)` with ring colours `#0a0a0a`/`#2a2a2a`; `PEOPLE_COLS` wired into the four places above. Do not touch any stored `p.color`.
- [ ] **Step 4: Run theme tests and `tests/special-tens.js`: all green.**
- [ ] **Step 5: Commit** `git commit -am "Restyle: score scale, star pills, chart palette, teal/pink defaults"`

### Task 4: Full check in the browser

**Files:** none (fix in `album-duel.html` only if something fails; then rerun both test files).

- [ ] **Step 1:** With real data on `localhost:8000`, look at: solo, duo and group album pages (Ratings, Rankings, Stats), band Stats, All artists, My library, History, a modal, a toast. Expected: true black, pill controls, Inter Tight, existing people still blue/red.
- [ ] **Step 2:** Copy image on Rankings summary and on band Stats. Expected: black background, star rings visible, no spread words.
- [ ] **Step 3:** Export page (static and clickable) and All artists export; open the files. Expected: same look, Inter Tight loads.
- [ ] **Step 4:** Create a throwaway slot with 5 people (then delete it). Expected: teal, pink, blue, orange, green.
- [ ] **Step 5:** Phone width (375px): sticky toolbar, cards, pills fit; no horizontal scroll.
- [ ] **Step 6:** Update `CLAUDE.md` where it names colours (IMDb-heatmap line, star pills) and add one line on the Mix look; commit `git commit -am "Restyle: docs"`.

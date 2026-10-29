# Special 10s (10\* / 10\*\*) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a 10 be entered as `10*` / `10**`, use stars to break ties everywhere, optionally count them as 10.25 / 10.5, show them with special pills, and add tie-safe top lists to All artists.

**Architecture:** Starred scores are stored as the strings `'10*'` / `'10**'` in `scores[pid][tid]` (and in history listens). A small set of helpers turns a stored value into a number (`scoreNum`) and a star level (`starLevel`). `scRaw()` and the history reader `lv()` go through them, so every stat changes in one place. Row objects carry a star level (`st`) so sorts and displays can use it.

**Tech Stack:** Plain HTML/CSS/JS in one file, `album-duel.html`. No build and no test framework: tests are a plain JS file run inside the app page in the browser.

**Spec:** `docs/superpowers/specs/2026-10-22-special-tens-design.md`

## Global Constraints

- Stored star values are exactly `'10*'` and `'10**'`. Plain scores stay numbers, and `'x'` stays the skip marker.
- With `S.ui.countStars` off (the default), no average, Gap, match %, correlation, chart or distribution may change. Stars then only affect sort order and the text shown.
- `S.ui.countStars` on: 10\* = 10.25, 10\*\* = 10.5.
- `S.ui.starCol` on by default. Pill CSS is copied from the spec: 10\* gets gradient `linear-gradient(160deg,#2a8a52 0%,#186a3b 45%,#0f4f2b 55%,#1c7543 100%)`, white text and `box-shadow: inset 0 0 0 2px #d9dde3`. 10\*\* gets the same gradient with `box-shadow: inset 0 0 0 2px #ffd34d, 0 0 10px 1px rgba(255,200,60,.75)`.
- Only scores of exactly 10 can be starred. `9*`, `10***` and `10.5` typed by hand are invalid.
- The project isn't a git repo, so there are no commit steps. Each task ends with the test run instead.
- Don't call `overall()` twice on `effAlbum` copies (`_eff`). Match the file's style: terse one-line helpers and short comments.
- Testing: start the local server with preview_start `{name: "album-duel"}` (`.claude/launch.json`, python http.server on 8765). If `python` isn't on PATH, change `runtimeExecutable` to `py`, or use `npx http-server -p 8765`. Storage doesn't work in the preview pane's data: URLs.

## Test harness (used by every task)

Create `tests/special-tens.js`. It defines `T(name, fn)` (records pass/fail; fn throws on failure), `eq(a, b)` (JSON compare, throws with both values), and a fixture `starFixture()`. The fixture builds and returns an album object `{ id, title: 'Daisy', tracks, scores, ranks: {}, off: [] }` with two people `pB` / `pE`. Its tracks, in this order, are Noro, Daisy, You Stole, In a Jar, At the Bottom, Bed and Gasoline, with the ids `noro, daisy, stole, jar, bottom, bed, gas`. The scores are:

| track | pB | pE |
|---|---|---|
| Noro | '10\*' | '10\*\*' |
| Daisy | '10\*' | '10\*' |
| You Stole | 10 | '10\*\*' |
| In a Jar | 10 | '10\*' |
| At the Bottom | '10\*' | 10 |
| Bed | 10 | 9.75 |
| Gasoline | 9.5 | 10 |

At the end it prints a pass/fail summary and returns it. Each task appends its own `T(...)` blocks. Run it on the app page with javascript_tool:

```js
S.ui.countStars = false; S.ui.starCol = true;
await fetch('tests/special-tens.js?' + Date.now()).then(r => r.text()).then(t => (0, eval)(t))
```

Indirect eval runs in global scope, so the app's top-level `const`/`function` helpers are visible. Tests must restore any `S.ui` they change.

## Review Focus

1. **Old data and shared files:** existing numeric scores, `'x'` skips and blank scores must read exactly as before. Pin it with test `old values unchanged` (Task 1).
2. **Starring a left-out song:** `sc()` must still return null, and `scStars()` 0, for songs in `al.off`. Pin it with test `left-out star ignored` (Task 1).
3. **Typing `10*` then deleting the star:** the box must store `10` again, not keep the old string. Pin it with test `parseScoreText round trip` (Task 2).
4. **Drop worst with stars:** with count stars off, a 10\* is never dropped ahead of an equal 10 in a way that changes averages, and with it on, `effAlbum` still drops by value. Pin it with test `drop worst unaffected when off` (Task 4).
5. **Ties toggle with mixed star levels:** a 10\*/10 song is not tied with a 10/10 song at the cut-off. Pin it with test `tie key includes stars` (Task 5).

---

### Task 1: Score value model and settings

**Files:**
- Modify: `album-duel.html`: `defaultUi()` (~line 583) and `scRaw` (~707), plus new helpers next to `scRaw`. Also `lv` (~1453).
- Create: `tests/special-tens.js` (harness + this task's tests)

**Interfaces:**
- Produces:
  - `STAR_VAL = { 1: 10.25, 2: 10.5 }`
  - `starLevel(v: any) -> 0|1|2`: 1 for `'10*'`, 2 for `'10**'`, otherwise 0.
  - `scoreNum(v: any) -> number|null`: null for `''`, null/undefined, `'x'` and any non-numeric value. For starred values it returns 10, or `STAR_VAL[level]` when `S.ui.countStars` is on. Otherwise `+v`.
  - `scRaw(al, pid, tid)` returns `scoreNum(al.scores?.[pid]?.[tid])`.
  - `scStars(al, pid, tid) -> 0|1|2`: 0 if `offSong(al, tid)`, else `starLevel` of the stored value.
  - `lv(L, t)` returns `scoreNum(L.scores?.[t.id])`. `lvStars(L, t) -> 0|1|2`.
  - `defaultUi()` gains `countStars: false, starCol: true`.

- [ ] **Step 1: Write the harness and failing tests**

```js
T('starLevel', () => { eq([starLevel('10*'), starLevel('10**'), starLevel(10), starLevel('x'), starLevel('')], [1, 2, 0, 0, 0]); });
T('scoreNum off', () => { S.ui.countStars = false; eq([scoreNum('10*'), scoreNum('10**'), scoreNum(9.5), scoreNum('x'), scoreNum('')], [10, 10, 9.5, null, null]); });
T('scoreNum on', () => { S.ui.countStars = true; eq([scoreNum('10*'), scoreNum('10**'), scoreNum(10)], [10.25, 10.5, 10]); S.ui.countStars = false; });
T('old values unchanged', () => { const al = starFixture(); eq([scRaw(al, 'pB', 'bed'), scRaw(al, 'pE', 'bed'), scRaw(al, 'pB', 'gas')], [10, 9.75, 9.5]); });
T('left-out star ignored', () => { const al = starFixture(); al.off = ['noro']; eq([sc(al, 'pB', 'noro'), scStars(al, 'pB', 'noro'), scRaw(al, 'pB', 'noro')], [null, 0, 10]); });
T('rawAvg off vs on', () => { const al = starFixture(); eq(+rawAvg(al, 'pE').toFixed(4), +((10+10+10+10+10+9.75+10)/7).toFixed(4)); S.ui.countStars = true; eq(+rawAvg(al, 'pE').toFixed(4), +((10.5+10.25+10.5+10.25+10+9.75+10)/7).toFixed(4)); S.ui.countStars = false; });
```

- [ ] **Step 2: Run tests and check they fail.** Expected: FAIL, `starLevel is not defined`.
- [ ] **Step 3: Implement the helpers above, rewire `scRaw` and `lv`, and add the `defaultUi` keys.**
- [ ] **Step 4: Run the tests.** Expected: all PASS. Reload the app with existing data and check one album's Rankings averages are identical to before.

### Task 2: Entering stars (Ratings box, history box, stepper, paste, Copy scores)

**Files:**
- Modify: `album-duel.html`: input handler (~3058–3070, `input.score` and `input.hscore`), `step` action (~2616), Ratings input `value=` (~1365), `parseScoreLines` tok (~2529), `parseNotionBlocks` regex (~2536), the score-only paste (~1468–1470), `copyScores` (~2707), `copyMine` rows (~2624), and the Ratings help text under the table (~1368).
- Test: `tests/special-tens.js`

**Interfaces:**
- Consumes: `starLevel`, `scoreNum` (Task 1).
- Produces:
  - `parseScoreText(raw: string) -> number|'10*'|'10**'|'x'|''|undefined`. It trims the input and turns `,` into `.`. `''` means clear the score. `undefined` means invalid (mark the box `.bad`). Accepts `10*`, `10**`, `x`/`X`, and numbers from 0 to 10.
  - `fmtStored(v) -> string`: the text for a stored value: `'10*'`, `'10**'`, `'x'`, `''` or `fmtNum(v)`.
  - `stepScore(cur: string, d: number) -> string`, a pure function the `step` action calls. Going up: 10 → `10*` → `10**` (and it stays there). Going down: `10**` → `10*` → `10` → `9.75`. Blank starts at 8 (as now). Otherwise it uses the current quarter-step clamp at 0–10.

- [ ] **Step 1: Write failing tests**

```js
T('parseScoreText', () => { eq(['10*', '10**', ' 9,5 ', 'x', '', '9*', '10***', '10.5', '11'].map(parseScoreText), ['10*', '10**', 9.5, 'x', '', undefined, undefined, undefined, undefined]); });
T('parseScoreText round trip', () => { eq([parseScoreText('10*'), parseScoreText('10')], ['10*', 10]); });
T('stepScore', () => { eq([stepScore('10', .25), stepScore('10*', .25), stepScore('10**', .25), stepScore('10**', -.25), stepScore('10*', -.25), stepScore('10', -.25), stepScore('', .25)], ['10*', '10**', '10**', '10*', '10', '9.75', '8']); });
T('paste lines', () => { eq(parseScoreLines('Noro: 10* 10**\nBed\t10\t9.75'), [['10*', '10**'], [10, 9.75]]); });
T('notion stars', () => { eq(parseNotionBlocks('- **1. Noro (3:12) - 10****\n- **2. Bed - 10**').map(b => b.score), ['10**', 10]); });
T('fmtStored', () => { eq(['10*', '10**', 'x', '', 9.5].map(fmtStored), ['10*', '10**', 'x', '', '9.5']); });
```

The Notion case is ambiguous because `**` is also bold markup. Read the score from the raw line (before stripping `**`/`__`), as the trailing token `10` followed by zero, one or two `*`, then the closing bold `**` if the line opened with `**`. Keep the existing match for everything else.

- [ ] **Step 2: Run the tests and check the new ones fail.**
- [ ] **Step 3: Implement.** The input handlers store `parseScoreText`'s result, and the history box accepts stars too. The Ratings `value=` uses `fmtStored(al.scores[pid][tid])`. Copy scores / Copy my scores write `fmtStored`. Add one sentence to the Ratings help text: type **10\*** or **10\*\*** for a special 10 (the + button goes past 10).
- [ ] **Step 4: Run the tests.** Expected: all PASS. In the browser, type `10*` in a Ratings box: it saves, and the value is still `10*` after a reload. Pressing + on a 10 gives `10*`, and − brings it back.

### Task 3: Display (pills, text, colours, distribution)

**Files:**
- Modify: `album-duel.html`: CSS (next to `.sumtab .pill`, ~174), `ratePill` (~803), every place a *single* score is shown via `ratePill`/`fmtNum`: summary table (~1535), Rankings rank lists, history table (~1501–1502), band/artist score lists, top lists (~2094–2116), group cell (~2100), Discord text (`statsTextAlbum` ~2161, `statsTextBand`, Copy-for-Discord tables) and export viewer tables. Also `histogram` (~1155).
- Test: `tests/special-tens.js`

**Interfaces:**
- Consumes: `scStars`, `lvStars`, `STAR_VAL` (Task 1).
- Produces:
  - `fmtSc(v: number|null, st: 0|1|2) -> string`: when `st` > 0 it returns `'10' + '*'.repeat(st)` (with count stars on or off), otherwise `fmtNum(v)`.
  - `ratePill(v, f = fmtNum, st = 0)`: with `st` > 0, the text is `fmtSc(v, st)`. If `S.ui.starCol` is also on, it uses the class `pill star1` / `pill star2` instead of the inline 9+ colours. Values above 10 use the 9+ colour.
  - CSS `.pill.star1` and `.pill.star2` with the Global Constraints values. Use `!important` only if a container's pill rule overrides them.

- [ ] **Step 1: Write failing tests**

```js
T('fmtSc', () => { eq([fmtSc(10, 1), fmtSc(10, 2), fmtSc(10.25, 1), fmtSc(9.5, 0)], ['10*', '10**', '10*', '9.5']); });
T('ratePill star class', () => { S.ui.starCol = true; eq(/star2/.test(ratePill(10, fmtNum, 2)), true); S.ui.starCol = false; eq(/star2/.test(ratePill(10, fmtNum, 2)), false); eq(/10\*\*/.test(ratePill(10, fmtNum, 2)), true); S.ui.starCol = true; });
T('distribution bins on', () => { S.ui.countStars = true; const h = histogram([{ name: 'a', color: '#fff', values: [10, 10.25, 10.5, 9] }]); S.ui.countStars = false; eq(/10\*\*/.test(h) && /10\*</.test(h), true); });
```

- [ ] **Step 2: Run the tests and check they fail.**
- [ ] **Step 3: Implement.** Every row that shows a single person's score passes its star level. Rows built from `sc()` get the level from `scStars` at the same place they read the value (Task 5 adds `st` fields to the shared row builders, so do this task's per-site wiring with `scStars(al, pid, t.id)` directly where the row has no field yet). Averages stay `fmt2` numbers with no star. Distribution: exact mode (solo/duo) labels the bin 10.25 as `10*` and 10.5 as `10**`. Group mode puts `v > 10` in its own bin (labelled by real min–max) instead of folding it into 10. With count stars off, starred values are 10 and land in the 10 bar.
- [ ] **Step 4: Run the tests.** Expected: all PASS. In the browser, Rankings on the fixture-like album shows silver and gold pills. Copy image / Save PNG: check the PNG shows the border and glow. If html2canvas drops the glow, the border alone is acceptable. Post text shows `10*`, and in "Columns (lined up for Discord)" the columns still line up (`*` is already in `AW`).

### Task 4: Settings controls and exports

**Files:**
- Modify: `album-duel.html`: `dropBar()` (~1279), the actions object (next to `keepOff`, ~2590), the drop notes/labels where helpful, and the export builders so `S.ui.countStars` / `S.ui.starCol` go into the page's `ui`.
- Test: `tests/special-tens.js`

**Interfaces:**
- Consumes: `S.ui.countStars`, `S.ui.starCol` (Task 1).
- Produces: actions `countStars` (toggles `S.ui.countStars`, `save()`, `renderAll()`) and `starCol` (same for `S.ui.starCol`). In `dropBar()`, show two segmented controls, "Stars: Tiebreak only / Count (10\* = 10.25)" and "Star colours: On / Off". Render them only when the current slot has at least one starred score anywhere (like the Left-out control only shows with left-out songs). When stars count, add a short note "10\* counts as 10.25, 10\*\* as 10.5" next to the existing drop note.

- [ ] **Step 1: Write failing tests**

```js
T('drop worst unaffected when off', () => { S.ui.drop = 1; S.ui.dropMode = 'own'; const al = starFixture(); al.tracks = al.tracks.slice(0, 5); const before = overall(al, 'pE'); eq(before, 10); S.ui.drop = 0; });
T('settings actions', () => { const c = S.ui.countStars; ACT.countStars(); eq(S.ui.countStars, !c); ACT.countStars(); eq(S.ui.countStars, c); });
```

Use the file's real name for the actions object in place of `ACT` (it's the object holding `keepOff:`/`setDrop:`).

- [ ] **Step 2: Run the tests and check they fail.**
- [ ] **Step 3: Implement.** Static exports keep the current values. Clickable exports carry them in `ui` and need no viewer toggle (left to the builder in the spec, decided here: no toggle).
- [ ] **Step 4: Run the tests.** Expected: all PASS. In the browser, toggle Count: the album averages change only for albums with stars, and toggling back restores them exactly. Export a static page and a clickable page and check the stars and colours show in both.

### Task 5: Tiebreaking by stars

**Files:**
- Modify: `album-duel.html`: `autoOrder` / `isTied` (~741–757), `pairRows` (~763), `groupRows` (~774), `favSort` / `leastSort` (~783–784), `bandRows` (~1776), per-person top/bottom sorts in `bandStats` (~2108–2109), and the album Stats Top/Bottom and favourite picks that sort `sc` values.
- Test: `tests/special-tens.js`

**Interfaces:**
- Consumes: `scStars` (Task 1).
- Produces:
  - `pairRows` rows gain `sa`, `sb` (star levels) and `st` (their average).
  - `groupRows` rows gain `sts` (array per person, 0 for skipped) and `st` (the average over people who scored).
  - `bandRows` rows gain `st`.
  - `favSort(P, alOf)`: `diff(y.m, x.m) || diff(y.st || 0, x.st || 0) || rankSum… || sd…`. `leastSort` is the mirror: fewer stars count as "worse".
  - `autoOrder` sorts by value, then star level, then position. In `isTied`, auto mode also requires an equal star level.
  - `tieKey(r) -> string`: the JSON of every person's `[value, stars]` for the row. Duo rows use `[[a, sa], [b, sb]]`, group rows use `vals` + `sts`, and single-person rows use `[[v, st]]`.
  - Consensus podium inherits this through `favSort`.

- [ ] **Step 1: Write failing tests**

```js
T('favSort with stars (off)', () => { S.ui.countStars = false; const al = starFixture(), A = { id: 'pB' }, B = { id: 'pE' };
  const rows = pairRows(al, A, B).map(r => ({ ...r, al, m: (r.a + r.b) / 2, sd: Math.abs(r.b - r.a) }));
  const order = rows.sort(favSort([A, B], r => r.al)).slice(0, 5).map(r => r.t.title);
  eq(order[0], 'Noro'); eq(new Set(order.slice(1, 3)), new Set(['Daisy', 'You Stole'])); eq(new Set(order.slice(3, 5)), new Set(['In a Jar', 'At the Bottom'])); });
T('autoOrder stars', () => { const al = starFixture(); eq(autoOrder(al, 'pE').slice(0, 2).map(id => al.tracks.find(t => t.id === id).title).sort(), ['Noro', 'You Stole']); });
T('tie key includes stars', () => { eq(tieKey({ a: 10, b: 10, sa: 1, sb: 0 }) === tieKey({ a: 10, b: 10, sa: 0, sb: 0 }), false); });
T('gap unchanged when off', () => { const al = starFixture(); const r = pairRows(al, { id: 'pB' }, { id: 'pE' }).find(r => r.t.title === 'At the Bottom'); eq(r.b - r.a, 0); });
```

Note: `eq` compares Sets by sorted array, so implement it that way.

- [ ] **Step 2: Run the tests and check they fail.**
- [ ] **Step 3: Implement.** With count stars on, `m` already includes the stars and `st` just agrees with it.
- [ ] **Step 4: Run the tests.** Expected: all PASS. In the browser, the real Daisy album with these stars shows Noro alone at #1 in the Rankings combined table, and the per-person auto rank lists put 10\*\* above 10\* above 10.

### Task 6: Tie toggle at the cut-off (band Stats)

**Files:**
- Modify: `album-duel.html`: `bandStats` top lists (~2090–2116). Add CSS for `details.tiemore`.
- Test: `tests/special-tens.js`

**Interfaces:**
- Consumes: `tieKey`, `favSort`, row `st` fields (Task 5); `fmtSc`, `ratePill` (Task 3).
- Produces:
  - `cutTies(sorted: Row[], n: number) -> { shown: Row[], extra: Row[] }`. `shown` is the first `n` rows. `extra` is the rows after `n` whose `tieKey` equals that of `shown[n-1]` (contiguous from n).
  - `tieMore(extra: Row[], li: Row => string, at: string) -> string`. It returns `''` when `extra` is empty. Otherwise it returns `<details class="tiemore"><summary>+${extra.length} more tied at ${at}</summary><ul class="dlist">…</ul></details>`, closed by default. `<details>` means it works in exports without JS.
  - `topTogetherCard(P, rows) -> string` and `topBottomCard(p, rows) -> string` hold today's inline card HTML, now with `cutTies` + `tieMore`, and they replace the old `more()` note. Top 10 uses n=10, top/bottom uses n=5, and `at` is `#10` / `#5`. The duo/group cell formatting stays as it is today but goes through `fmtSc`.

- [ ] **Step 1: Write failing tests**

```js
T('cutTies', () => { const r = k => ({ a: 10, b: 10, sa: k, sb: 0 }); const list = [r(1), r(1), r(0), r(0), r(0), r(0)];
  const x = cutTies(list, 3); eq([x.shown.length, x.extra.length], [3, 3]); eq(cutTies(list, 2).extra.length, 0); });
T('tieMore empty', () => { eq(tieMore([], () => '', '#10'), ''); eq(/<details class="tiemore">/.test(tieMore([{}], () => '<li></li>', '#10')), true); });
```

- [ ] **Step 2: Run the tests and check they fail.**
- [ ] **Step 3: Implement and replace the inline cards in `bandStats`.**
- [ ] **Step 4: Run the tests.** Expected: all PASS. In the browser, a band with more than 10 tied 10/10 songs shows 10 plus "+N more tied at #10", which opens and closes. The same works in a clickable export.

### Task 7: Top lists on All artists

**Files:**
- Modify: `album-duel.html`: `renderArtistsIn` (~1858–1950).
- Test: `tests/special-tens.js`

**Interfaces:**
- Consumes: `topTogetherCard`, `topBottomCard` (Task 6), `bandRows`, `pairRows`, `statAlbums`, `effAlbum`, `notRepeat`.
- Produces: `artistTopRows(P) -> { pairs: Row[], per: { [pid]: Row[] } }`. It covers every band in `slot().bands` with albums. Duo rows come from `statAlbums(b).map(effAlbum)` → `pairRows`, with `notRepeat(b)` applied and `al` set. Per-person rows come from `bandRows(b, pid)`. Each band is counted the way its own page counts it (release scope, Drop worst, left-out songs), and that comes for free through these helpers. The page renders `topTogetherCard` (duo only) and one `topBottomCard` per shown person, after the "Every album" table. It works the same in My library (inside `withSlot`) and in the artists export (`viewer.scope='artists'`).

- [ ] **Step 1: Write failing tests**

```js
T('artistTopRows', () => { const P = vis().slice(0, 2); const x = artistTopRows(P); eq(Array.isArray(x.pairs) && P.every(p => Array.isArray(x.per[p.id])), true); });
```

- [ ] **Step 2: Run the test and check it fails.**
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run all the tests and do a full browser check.** Expected: all PASS. Then work through the spec's Testing list on a local server: typing/pasting stars, defaults unchanged, Gap/averages with count off and on, the Daisy order, the tie toggle on Stats and All artists, post text, static and clickable export, Copy image/Save PNG, a Share file round-trip (export a band, load it into a second instance, and check the stars arrive and the loader's own scores stay), and Drop worst with stars on. Also check at phone width (375px) that the + button steps into `10*`.
- [ ] **Step 5: Update `CLAUDE.md`.** Under Data, add a short note on `'10*'`/`'10**'` storage, `scoreNum`/`starLevel`/`scStars`, and `S.ui.countStars` / `S.ui.starCol`. Replace the "Planned later: special 10s…" line with what was built.

# Album Duel

Single-file web app (`album-duel.html`, plain HTML/CSS/JS, no build) for rating albums track by track and
comparing ratings between people (solo, duo or group). Owner: a data scientist (SQL/Python), not a
front-end dev. Keep explanations plain, avoid wasting tokens, test changes in the browser before reporting.

## Deploy
- Hosted on **Cloudflare Pages** (moved off Netlify: its free plan charges 15 credits per deploy).
- In the app, **Site app** downloads `index.html` (the app with no personal data, seed stripped). The owner puts it in their
  site folder with any exported pages and uploads the **whole** folder (Workers & Pages → project → Create deployment).
- **Export page** makes a page for Notion `/embed` (link: `<project>.pages.dev/<band>-<name>`): static (no JS) or
  clickable (Drop worst, Albums counted, matrix tabs and chart name buttons live; history is left out). Only chosen people are included; "Show as" renames them for
  that file only (so does the colour picker beside it); slot names are rebuilt so other people's names don't leak. US dates (en-US) on exports only.

## Data
- State `S` in localStorage (`albumDuel:<instance>`); **covers live in IndexedDB** (db `albumDuel`, store `covers`,
  key `<LS_KEY>:cover:<albumId>`) because localStorage caps ~5 MB (~100 covers). Stress-tested 332 albums: fine.
- Slots → people (+ `me`), bands → albums → tracks; `scores[pid][tid]`, `ranks[pid]` (custom order), `ties[pid]`, `best`.
  Per album also `listen[pid]` ('first'|'re' tag), `history[pid]` (past listens `{id,date,scores}`), `listenDate[pid]`.
  All per-person maps merge with `keepMine` on share.
- A score of `'x'` = the person chose not to rate that song (`skipped()`): `sc()` reads it as no score, but `groupRows`
  still includes the track (needs everyone scored or skipped, and 2+ scores). Blank = not rated yet, so it's left out.
- Share = JSON file of a slot/band; loading merges and never overwrites the loader's own (`me`) data.
- Special 10s: stored as strings `'10*'` / `'10**'` (also in history listens). Always read through `scoreNum()` (via
  `scRaw`/`sc`/`lv`): 10, or 10.25 / 10.5 with `S.ui.countStars`. Star level: `starLevel(v)`, `scStars(al,pid,tid)`;
  rows carry it (`pairRows` sa/sb/st, `groupRows` sts/st, `bandRows` st). Stars break ties in `favSort`/`leastSort`,
  `autoOrder`/`isTied` and top lists; `tieKey()` = same scores + same stars. Show single scores with `fmtSc(v, st)` /
  `ratePill(v, f, st)` (silver/gold pills unless `S.ui.starCol === false`). Typed via `parseScoreText`, + / − step
  past 10 (`stepScore`). Post text escapes them as `10\*` outside code blocks (`dcEscStars`).

## Decisions / preferences
- Track notes from Notion are **ignored** (only scores and lengths are taken). Paste and track boxes accept Notion
  lists like `- **1. Title (2:31) - 8**`.
- Post text: "Columns (lined up for Discord)" pads by a fixed width table (Arial widths, space ×0.86, i/l/j/t widened),
  calibrated from real Discord screenshots. Phone-friendly is default. Second post type: "Stats summary".
- Favourite/least-favourite ties break by combined ranking position, then agreement.
- Drop worst: stats use `effAlbum()` copies marked `_eff`; never call `overall()` on them twice (double-drop bug).
- Release types: `al.type` = album (default/missing) | ep | comp. Band switch `b.relScope` ("albums" default | "all");
  `scopeOut()` folds it into `albumHidden()`, so stats, post text and exports follow. A band with no plain albums counts all.
  Repeated songs (`repeatIds()`, title via `songKey()`) on EPs/comps count once in band-wide track pools (album copy
  wins, then EP, then earlier year); per-release averages keep all their songs. Static exports freeze the current switch.
- Album tabs: **Ratings** = score inputs only. **Rankings** starts with `summaryBlock()` (#sumSnap: read-only score
  table + Most/Least divisive + At a glance, built from `effAlbum` so Drop worst applies), with its own Copy image /
  Save PNG (`capture(id)`, `.part-only` header shows only in that image). Per-person rank lists hide behind a toggle
  (`S.ui.rankCols`, hidden by default for 3+ people). Stats Top/Bottom list every tied track.
- 3+ people visible → group views; "Showing" panel hides people / top N / harshest N / extremes.
- Group stats: hot takes, consensus podium (by everyone's lowest score), "without X", taste camps (average-linkage on
  the matrix's current measure, join only ≥10 points above the average pair). Who agrees with whom has Normal match /
  Score correlation (r as %) tabs (`S.ui.mxMode`). Group line charts = average + low–high band; tapping names
  (`S.ui.hl`) adds lines everywhere. Distribution = half-point ranges labelled by real min–max, empty ranges skipped;
  groups get full width + on/off names (`S.ui.distOff`). Tall/short cards sit in `cols2()` stacks to avoid gaps.
- Re-listen tag: picked per person in Ratings (duo/group only), shown in their top card. History tab: solo view only;
  past listens are made on purpose (Start a re-listen / Add a past listen) so typo fixes never count.
- All artists page (`S.cur.page='artists'`, solo/duo only): each band counted the way its own page counts it. Has
  Overall average, Every album table (top 10, `S.ui.artAlbAll` shows all), biggest differences, distribution, spot/length bars.
  "Artists" button row (`artHideBar`) hides artists from the whole page: `S.ui.artHide` = lowercased band names (works in
  My library too), `artBands()` filters them; Export page leaves hidden artists out.
- `trackNumCard()` (solo/duo, band Stats + All artists): spot highlights + one `<details>` row per track number
  (opens without JS, so exports work). Highlights only use numbers more than half the albums reach.
- Band Stats (and group extras) use `cols2b([[html, roughHeight]])`: cards go to the shorter column; `balanceCols()` re-places
  them by real height after render, on resize and in the screenshot clone (phone = one column, original order).
  Tile rows use `kgrid()` (picks 3/4/5 columns so no lone tile).
- Left-out songs: `al.off` (track ids, shared by everyone) toggled in Ratings. `sc()` returns null for them (so every
  stat skips them) unless `S.ui.keepOff`; `scRaw()` = the stored score (Ratings inputs, Copy scores). Rankings table shows
  them struck through at the bottom; post text skips them. Share merge keeps the loader's `off` if set.
- My library (All artists → "My library", `S.ui.artLib`): `librarySlot()` builds a virtual solo slot from your scores in
  every slot (you = slot Me, the only person, or the person named like you); `withSlot()` swaps it in while rendering.
  Bands match by name, albums by title; `S.ui.libPick[bandKey]` = slot that wins, else the slot with most songs rated.
- All artists **Export page** (`artExGo`): clickable viewer with `viewer.scope='artists'`, only shown people's scores, no covers/notes.
- Phones: charts draw 400 wide (`CW()`/`PHONE()`) with bigger text; screenshots set `WIDE` and redraw full width first.
- Special 10s (10* / 10**): bar controls "Stars: Tiebreak only / Count (10* = 10.25)" and "Star colours", shown only
  once the slot has a star. Top 10 together and top 5 / bottom 5 (`topTogetherCard`, `topBottomCard`) are on band
  Stats and All artists; songs tied with the last one shown go in a closed `<details class="tiemore">` (`cutTies`).
  Screenshots swap the star pills' inset shadow for a real border (html2canvas paints inset shadows solid).
  Tests: `tests/special-tens.js`, run on the app page from a local server (see the file's first lines).
- Score cells (Rankings table, artists, history) and the matrix use IMDb-heatmap colours (`RATE`/`ratePill`): 9+ dark
  green, 8s green, 7s yellow, 6s orange, 5s red, below purple. Match % maps /10; correlation uses its own steps (`corrBand`).
  Distribution: exact scores for solo/duo, half-point ranges for groups. Group matrix is a full-width card.
- Long names are cut with `pn(p, n)` in tight headers/labels (full name in a tooltip).

## Gotchas
- Screenshots use html2canvas on a cloned 1400px-wide page: SVG sizes are pinned in `onclone`, Android font
  boosting is disabled (`max-height` trick), fonts awaited; pseudo-elements leak from the live page, so use real spans.
- `[hidden]` needs `display:none!important` because some containers set `display:flex`.
- Screenshots widen the image when a card or a scrolling table inside one overflows (matrix/summary with many people).
- Browser pane screenshots can come back stale; the `zoom` action takes a fresh one.
- The preview pane serves files as data: URLs (no localStorage/IndexedDB); test storage on a local http server.

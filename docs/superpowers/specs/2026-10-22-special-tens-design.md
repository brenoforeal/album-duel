# Special 10s (10\* and 10\*\*): design

## Why

Two users both rate some songs as a 10 that's more special than their other 10s. In their own tier lists,
one uses one level above 10 (10\*), the other uses two ("Magical" = 10\*, "Best Ever" = 10\*\*). In the app those
songs are plain 10s, so favourites and top lists end in big ties (one album had five songs tied at #1).
Stars fix that, which also makes it possible to bring "Top 10 together" and each person's top 5 to the All
artists page. One of them had already suggested counting 10\* as 10.25 and 10\*\* as 10.5. That becomes an option.

## Goals
- A 10 can be entered as `10`, `10*` or `10**`, per person per song.
- Stars always break ties in favourites and top lists.
- An option makes stars count as numbers (10\* = 10.25, 10\*\* = 10.5) in every stat.
- Stars show as `10*` / `10**` everywhere a score shows, with special colours that can be turned off.
- Top 10 together + top 5 / bottom 5 on All artists. Ties at the cut-off are never settled by a hidden guess:
  the extra tied songs show in a toggle list.

## Non-goals
- No stars on scores other than 10 (no `9*`), and no `10***`.
- No reading of stars from Notion colours. Notion pastes come in as plain 10s, and the user adds stars by hand.
- No new colour band in charts, distribution or the matrix (see "Colours").

## Anti-goals (a failure even if it works)
- With "count stars" off, any average, gap, match %, correlation, chart or distribution changes because of a
  star. Off has to behave exactly like today, except for tie order and the `*` shown in the text.
- Old data, shared files or exports break, or a starred 10 silently turns into "not rated".
- The double-drop bug comes back (`effAlbum` copies must still be handled as now).

## Data
- The score stays in `scores[pid][tid]`, stored as the strings `'10*'` and `'10**'` (like `'x'` for skipped).
  Plain scores stay numbers, so old data needs no migration.
- One helper decides the star level (`stars(al, pid, tid)` → 0/1/2), and one decides the value, used by `scRaw()`:
  `'10*'` → 10, or 10.25 with count stars on; `'10**'` → 10, or 10.5. Today `scRaw()` uses `isNaN`, which would
  read `'10*'` as unrated, so this is the key change. `sc()`, `skipped()` and `offSong()` work as now.
- Share files carry the strings as they are, and merge with `keepMine` as now.
- **Older copies of the app** (e.g. a friend's site build that hasn't been updated) would read `'10*'` as unrated.
  That's accepted, and the fix is to update the app. Builder's call: whether to show a one-line note about it.

## Settings (both in `S.ui`, saved like the others, shown in the bar with Drop worst / Left-out songs)
- **Count stars**: off by default. Off means a star is only a tiebreaker. On means 10\* = 10.25 and 10\*\* = 10.5
  in every stat: averages, Gap, match %, correlation, charts, distribution, divisive lists, hot takes, Drop worst
  choice, history and All artists. With it off, Gap between a 10\* and a 10 is "=".
- **Special colours**: on by default. Off means starred pills use the normal 9+ dark green.
- Static exports keep the current state of both settings (like `relScope`). Clickable exports follow the
  exported state; builder's call whether the viewer can toggle them.

## Entering stars
- Ratings score box accepts `10*` and `10**` (typed). Any other starred value is rejected the same way a bad
  score is now. A score of 10.25 or 10.5 typed by hand stays invalid (over 10).
- Paste box (`parseScoreLines`) and Notion-style lines (`parseNotionBlocks`) accept `10*` / `10**` too. In Notion,
  `**` is bold markup and gets stripped, so the builder must make sure a trailing `10**` / `10*` inside bold
  (e.g. `- **1. Noro (3:12) - 10****`) is still read. Builder's call how, but plain `- 10` lines must still work.
- **Phones** (the score box opens the number keypad, which has no `*` on iPhone): the +/− stepper buttons go past
  10: + on 10 → `10*` → `10**` (stops there), and − goes `10**` → `10*` → 10 → 9.75. This applies on every screen
  size, not just phones. Typing `10*` still works wherever a keyboard has `*`.
- Copy scores writes `10*` / `10**`.

## Tiebreaking
- Wherever songs are sorted by score (favourite/least favourite, Top/Bottom lists, Rankings auto order,
  consensus podium, Top 10 together, top 5/bottom 5), sort on the value first, then the star level, then the
  existing rules (combined ranking position, then agreement / within-album rank).
  - Count stars off: same value 10, so more stars wins. For groups, use the average star level of the row's scores.
  - Count stars on: the value already includes the stars.
- Rankings auto order: a 10\* sorts above a 10. With "ties allowed", a 10\* and a 10 are **not** tied (each star
  level is its own tie group).
- Least-favourite / bottom lists: stars only matter if 10s get there; the same rule applies in reverse.

## Display
- Every score shows its stars as text: Rankings table, summary table (#sumSnap), All artists, history, top lists,
  post text (Discord, both layouts) and exports. `fmtNum` and the Discord column width table must handle `*`.
- **Colours (picked from mockups, option E)**, when Special colours is on:
  - 10\*: the 9+ dark green with a metallic sheen (diagonal gradient, roughly `#2a8a52 → #186a3b → #0f4f2b →
    #1c7543`), white text and a 2px silver inner border (`#d9dde3`).
  - 10\*\*: the same green, a 2px bright gold inner border (`#ffd34d`) and a gold glow
    (`0 0 10px 1px rgba(255,200,60,.75)`).
  - Applies to score pills (`ratePill` and the Ratings/summary pills). Charts, distribution and matrix colours are
    unchanged. With count stars on, a value over 10 still uses the 9+ colour.
- Screenshots (html2canvas) must show the border and glow, and the builder checks that box-shadow and gradient
  come through in the clone. If the glow doesn't render, a solid border is acceptable there.
- Values shown with count stars on (averages like 10.13) display as numbers. Only single scores show `*`.
- *(My call)* Score distribution with count stars on: solo/duo get their own bars for 10\* and 10\*\*, labelled
  `10*` / `10**`. Groups get one range above 10, labelled by its real min–max as now. With it off, starred scores
  sit in the 10 bar.

## Top lists and ties at the cut-off
- Applies to Top 10 together, each person's top 5 and bottom 5: on band Stats (exists now) and **new on All
  artists** (solo/duo per that page's rules, using each band's own counting: release scope, Drop worst, left-out
  songs; My library works the same).
- A tie means the same scores from everyone, stars included (with count stars off, 10\*/10 and 10/10 aren't tied).
- The list shows exactly 10 (or 5), sorted as in "Tiebreaking". If songs past the cut-off tie with the last song
  shown, a toggle under the list ("+4 more tied at #10") shows or hides them. It's hidden by default, and there's
  no toggle when there are no extra tied songs. This replaces today's "+n more tied at X" note in top 5 / bottom 5.
- The toggle must work in clickable exports. Using `<details>` (like `trackNumCard`) means it works without JS.
- Screenshots show the toggle as it is on screen.

## Left to the builder
- Exact helper names, where the two buttons sit in the bar, wording of labels/tooltips.
- How the group star tiebreak is computed beyond "average star level".
- Whether the settings appear in the Discord post panel and the export dialogs.

## Testing
- Test in the browser on a local http server (storage doesn't work in the preview pane's data: URLs).
- Check: typing/pasting stars; old data unchanged with both settings at default; Gap/averages unchanged with count
  stars off and changed with it on; the five-way tie album (Brand New, *Daisy*) with these test stars:
  Noro B 10\* / E 10\*\*, Daisy 10\* / 10\*, You Stole 10 / 10\*\*, In a Jar 10 / 10\*, At the Bottom 10\* / 10
  orders Noro first, then Daisy and You Stole (same star total, so rank position decides), then In a Jar and
  At the Bottom (same again); tie toggle on Stats + All artists; post text; static and clickable
  export; Copy image/Save PNG; Share file round-trip; Drop worst with stars on.

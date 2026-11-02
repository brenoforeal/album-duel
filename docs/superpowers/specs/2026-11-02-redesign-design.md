# Album Duel restyle ("Mix") — design

## Why
The app works, but it looks like a stock AI dashboard: near-black navy (`#0e1015`), lavender accent, plain
blue/red people. The owner's view: presentation is what makes people notice the quality of the data. The new
look takes the best part of three data/rating sites the owner judged in a mockup
(`docs/mockups/design-options.html`, style "★ Mix", accent 5, people pair 4):

- **Bloomberg terminal**: true black background, no blue tint.
- **The Pudding**: rounded, clean shapes — rounded cards, pill buttons, pill score chips, pill tabs.
- **Letterboxd**: Inter Tight for all text (best readability), tabular numbers.

## Goals
- Restyle the whole app (`album-duel.html`) to the Mix look: top bar, side panel, buttons, inputs, tabs,
  cards, tables, score pills, matrix, charts, modals, toasts.
- Everything that copies the app's look follows automatically: screenshots (Copy image / Save PNG),
  Export page (static and clickable), All artists export, Site app (`index.html`).
- Same features, same layout logic, same data. Only looks change.

## Non-goals
- No layout or feature changes (card order, `cols2b`/`balanceCols`, tabs, stats all stay).
- No light mode, no theme switcher.
- No change to stored data. People's saved colours are **not** recoloured.

## Anti-goals (would make this a failure even if it "works")
- Screenshots or exported pages that look different from the app, or break (html2canvas quirks).
- Worse readability: low-contrast text, score pills whose text is hard to read, numbers that don't line up.
- Losing any colour control the owner has today.

## Decided by the owner
- Background true black, Pudding rounded shapes, Letterboxd font (Inter Tight).
- Accent: **lavender `#c9b6ff`**.
- Default people colours: **teal `#00d1b2`** (1st), **pink `#ff4f6d`** (2nd). Only for people added from now on:
  people already saved keep their stored colours (no one-time recolour).
- Colour editing stays exactly as now: per-person picker in people settings, "Colour for Average and Score match"
  picker (`S.ui.both`, default already `#c9b6ff`), per-export colour picker.

## Design tokens (from the mockup's Mix style)
| Token | Value | Use |
|---|---|---|
| `--bg` | `#0a0a0a` | page, top bar, sticky bars (translucent versions use `rgba(10,10,10,.94)`) |
| `--panel` | `#141414` | cards |
| `--panel2` | `#1c1c1c` *(my call)* | buttons, inputs, inner boxes |
| `--line` | `#2a2a2a` | borders, table header rule |
| card border | `#222` | card outline |
| row line | `#1e1e1e` | table row dividers |
| `--text` | `#d4d7db` | body text |
| `--muted` | `#8c9196` | captions, labels |
| headings | `#ffffff` | h1–h3, big numbers |
| `--accent` | `#c9b6ff` | primary button (text `#0a0a0a`), active tab/nav pill (no new kicker labels: that would change layout) |
| `--good/--warn/--bad` | keep current hues, check contrast on black *(my call)* | |

Shapes: cards radius **16px**; buttons, segmented controls, tabs, score pills, chips **999px (pill)**; inputs
**10px** *(my call: full pills on multi-line inputs look wrong)*; modals 16px. Borders 1px. No card shadows.

Type: **Inter Tight** 400/500/600/700/800 from Google Fonts replaces Inter everywhere — CSS, the SVG `FONT`
constant, the Google Fonts links in the head and in `buildStaticPage`, and `interReady()` checks.
Headings 800, letter-spacing about −0.025em. All numbers `font-variant-numeric: tabular-nums`.

Score colour scale (`RATE`): same bands and meaning (9+ dark green … below 5 purple), retuned for black as in the
mockup *(my call — the owner picked the mockup with these)*:
9+ `#1f9d55`/white · 8s `#57c27a`/black · 7s `#d9c13a`/black · 6s `#e8892b`/black · 5s `#d6453d`/white · below `#8b5cf6`/white.
Matrix match % and correlation (`corrBand`) keep using `RATE`. Silver/gold star pills stay, restyled as pills;
their gradient moves from the old 9+ green `#186a3b` to the new `#1f9d55` *(my call)*.

Charts (`PAL`): grid `#1e1e1e`, axis/labels `--muted`, text `--text`, panel `#141414`, line `#4a4a4a` (was `#2a2a2a`: too faint, changed after review);
`PAL.hot` stays a warm yellow. Default extra people colours (`cols` list at ~line 2915, new-person default at ~2949,
`librarySlot` fallback at ~1855) become teal, pink, then three more picked to read well on black and stay distinct
from teal/pink/lavender and from the star/`PAL.hot` yellows *(my call; suggestion `#4aa8ff`, `#ff8a3d`, `#9be15d`)*.
Logo dot = teal/pink split.

Inter Tight check: `interReady()` matches `/inter/i`, which also matches "Inter Tight"; no logic change, but test
that Inter Tight has really loaded before a capture.

## Constraints
- Single file, no build, plain CSS/JS. Prefer turning hard-coded hexes (~85 in the file) into CSS variables
  where they are in CSS; JS colours (`PAL`, `RATE`, chart code) stay JS constants.
- Screenshots: `captureEl` passes `backgroundColor: '#0e1015'` → must become the new bg. The inset-shadow → border
  swap for star pills must still work on pill shapes. html2canvas draws rounded corners fine, but check
  `border-radius:999px` pills and cards in a real capture.
- Phones (`CW()`/`PHONE()`), sticky toolbars, `[hidden]` rule: unchanged behaviour.
- Exports reuse the app's `<style>` tags, so they inherit the look; the static page's extra rules must still fit.
- Test in the browser (owner's rule): main views (solo, duo, group, All artists, My library), a screenshot, a
  static export and a clickable export, and phone width. Run `tests/special-tens.js` from a local server.

## Left to the builder
- Exact hover/focus states (keep them subtle: slightly lighter panel, accent focus ring).
- `--panel2`, input radius, extra people colours and good/warn/bad tweaks within the guidance above.
- Order of work and how to group the CSS changes.

# Album Duel

A single-file web app for rating albums track by track and comparing those ratings with other people,
solo, as a pair or as a group. It's plain HTML, CSS and JavaScript in one file. There's no build step, no
server and no account: everything stays in the browser until you choose to share it.

## What it does

- **Rate** every track from 0 to 10 in steps of 0.25. Two "special 10" levels (`10*`, `10**`) break ties
  between favourites, and can optionally count as 10.25 / 10.5.
- **Rank** tracks in your own order, or let the app order them from your scores.
- **Compare** with other people: score gaps, agreement, most and least divisive songs, consensus picks
  and "hot takes".
- **See stats** for an album, a whole discography or every artist at once: averages, spread, score
  distributions, line charts, a heatmap score table and track-number patterns (how good track 1 usually is,
  and so on).
- **Share** an album or band as a JSON file. Loading it merges with your data and never overwrites your
  own scores.
- **Export** read-only pages (static or clickable) that can be embedded in Notion, plus Discord-ready text
  posts and PNG screenshots of any card.
- **Import** track lists from the iTunes Search API, or paste them from Notion-style lists.

## The statistics

Albums are small samples (about 10–14 tracks), so each measure was chosen with that in mind and documented
in [`stats-prompt.md`](stats-prompt.md).

| Measure | How it's calculated |
|---|---|
| Average, median, spread | Mean, median and population standard deviation of one person's scores |
| Score match % | `100 − 40 × mean absolute difference` over the tracks both people rated |
| Score correlation | Pearson r on shared tracks (needs at least 3) |
| Ranking agreement | Correlation of rank positions (Spearman) |
| Taste groups | Average-linkage hierarchical clustering on the agreement matrix. A group only forms when it's at least 10 points above the average pair |
| Consensus podium | Tracks ranked by the lowest score anyone gave them |

Data rules that keep the numbers honest:

- **Blank vs. skipped.** A blank score means "not rated yet" and is left out. A skipped song (`x`) means
  "chose not to rate it": the track still counts in group views, but has no score.
- **Left-out songs** (intros, skits) can be excluded from every stat in one click.
- **Drop worst** removes each person's lowest track before computing the stats, applied exactly once.
- **Repeated songs** on EPs or compilations count once in band-wide totals. The album version wins.
- **Ties** in favourites break by combined ranking position, then by agreement.

## Running it

Open `album-duel.html` in a browser. That's it.

To run the tests (they load with `fetch`, which needs a web server), serve the folder locally:

```bash
python -m http.server 8765
```

Then open <http://localhost:8765/album-duel.html>.

### Storage

- Ratings live in `localStorage`.
- Album covers live in IndexedDB, because `localStorage` caps at about 5 MB (roughly 100 covers).
- A stress test with 332 albums ran fine.

### Tests

With the local server running, open the app and paste this into the browser console:

```js
await fetch('tests/special-tens.js?' + Date.now()).then(r => r.text()).then(t => (0, eval)(t))
```

It prints a pass count, for example `40/40 pass`. The tests don't need any saved data and never save
anything.

## Deploying

In the app, **Site app** downloads an `index.html` with no personal data inside. Put it in a folder with
any exported pages and upload that folder to a static host (this project uses Cloudflare Pages). People who
open the hosted app start with an empty library.

## How it was built

Built with [Claude Code](https://claude.com/claude-code). I wrote the requirements, data rules and
statistical choices; the AI agent wrote the code. A few habits kept it manageable:

- [`CLAUDE.md`](CLAUDE.md) is living documentation: the data model, decisions and known pitfalls. Every
  new session starts from it instead of re-reading 3,000+ lines.
- Features are planned before they're coded. See [`docs/superpowers/`](docs/superpowers) for the design
  and plan behind the special 10s.
- Every change is tested in the browser before it's accepted.

## Project layout

```
album-duel.html   the whole app
CLAUDE.md         architecture, data model and decisions
stats-prompt.md   how every statistic is calculated, and its limits
tests/            browser-console tests
docs/             design specs and implementation plans
```

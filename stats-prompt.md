I built a small web app ("Album Duel") where friends rate album tracks from 0 to 10 (steps of 0.25) and compare
their ratings. I'm a data scientist (mostly SQL and Python) and want to talk through the statistics it uses:
whether they're sound, what their limits are with small samples (an album is ~10–14 tracks), and what better or
additional measures I could use. Here is exactly how each number is calculated today.

Data model: albums → tracks (title, length in seconds, track number); one score per person per track; each person
can also have a ranking of the tracks (a manual order, or derived from scores).

| Shown as | How it's calculated |
|---|---|
| Average / median | Mean and median of a person's track scores on an album (or across a whole discography). |
| Spread (±0.65) | Population standard deviation of a person's scores (divides by n, not n−1). Labels: < 0.35 "very consistent", < 0.6 "fairly consistent", otherwise "all over the place". |
| Score match % | For two people, over tracks both scored: MAD = mean of abs(score_A − score_B). Match = max(0, round(100 − 40 × MAD)). So a 0.5 average gap = 80%. Made-up but readable scale. |
| Score correlation | Pearson r between two people's scores on the tracks both rated (needs ≥ 3 tracks). Words: ≥ 0.7 strong, ≥ 0.4 moderate, ≥ 0.15 weak, > −0.15 "basically none", > −0.4 weak opposite, else opposite. |
| Ranking agreement | Pearson correlation of the two people's rank positions (effectively Spearman). With "ties" turned on, tied tracks share a rank (1, 1, 3), which is then used as-is. |
| More generous | Difference of the two people's means on shared tracks, plus a count of tracks where each scored higher. |
| Length vs score (r and "+0.31/min") | Pearson r between track length (minutes) and score, and the slope of an ordinary least-squares line (score change per extra minute). Needs ≥ 4 tracks with lengths. |
| Album shape | Mean of the first half of the tracklist (first ceil(n/2) tracks) vs the second half. Difference < 0.1 = "even", otherwise front- or back-loaded. |
| Shared favourite / least favourite | Track with the highest/lowest mean across people. Ties broken by everyone's combined list position (each person's position scaled 0–1 by album length, summed; lower = ranked higher), then by smallest disagreement. |
| Most divisive | Track with the largest standard deviation across people (for two people, largest absolute gap). |
| "Gem" (per person) | Track where that person's score minus the mean of everyone else's score is largest (must be > 0). |
| Group match % (3+ people) | Average of the pairwise score-match % over every pair of people. |
| Who agrees with whom | Matrix of pairwise score-match % (a similarity matrix). |
| Spread per track (group) | Range (max − min) of scores on a track; also shown as a dot plot, one dot per person. |
| Drop worst N | Each person's N lowest-scored tracks removed before averaging (or, in another mode, the N tracks with the lowest group mean removed for everyone). Ties on the cut-off drop the later track in the album. |
| Score by spot on the album (discography) | Mean score for openers, first third, middle, last third, closers, pooled across albums using relative position (i/(n−1)). |
| Score by track number (discography) | Mean score of track 1 across albums, track 2, etc.; marks positions that only some albums reach. |
| Score by song length | Mean score in buckets: < 3:00, 3:00–3:59, 4:00–4:59, 5:00+. |
| Discography average | Mean of all of a person's track scores across the counted albums (not a mean of album means). |

Questions I'd like to explore: Is the 40× MAD "match %" reasonable, and what would be a principled alternative?
How much can r or Spearman tell me with ~12 tracks (confidence intervals, significance)? Should spread use n−1?
Better ways to define "divisive", "gem" and "album shape"? How to compare people who rate on different scales
(z-scores, rank-based measures)? Anything I'm missing that would be interesting for this kind of data?

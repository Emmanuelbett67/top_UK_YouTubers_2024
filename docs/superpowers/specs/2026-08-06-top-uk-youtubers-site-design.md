# Top UK YouTubers 2024 — Website Design

**Date:** 2026-08-06
**Author:** Emmanuel Bett (with Claude)
**Status:** Approved

## Goal

Publish the existing Excel → SQL → Power BI analysis as an interactive web report. The
project currently exists only as a `README.md` rendered by the `pages-themes/slate` remote
theme — a dark markdown page that shares nothing with the rest of the portfolio. The site
replaces it: same design system as the sibling projects, charts computed live from the
source data, and the analysis carried through to the recommendation the README never
reached.

## Visual reference

The site adopts the design system of
[HR-employee-Attrition-Analysis](https://github.com/Emmanuelbett67/HR-employee-Attrition-Analysis),
which took it in turn from [mpesad3js](https://github.com/Emmanuelbett67/mpesad3js). Tokens
are copied, not reinterpreted. This is the third sibling.

| Token | Value |
|---|---|
| `--paper` / `--background` | `40 20% 98.5%` (warm paper, not white) |
| `--ink` | `220 15% 9%` |
| `--ink-muted` | `220 6% 42%` |
| `--ink-faint` | `220 6% 62%` |
| `--border` | `38 12% 89%` |
| `--border-strong` | `38 10% 80%` |
| `--positive` | `162 78% 24%` |
| `--negative` | `12 62% 42%` |
| `--radius` | `0.25rem` |

Carried over unchanged: Inter + JetBrains Mono via `next/font/google`; tabular numerals on
all figures (`.tnum`); the `.eyebrow` label (11px, uppercase, `0.14em` tracking); the
`.card-flat` panel (hairline border, **no shadow** — depth comes from spacing); the `.chart`
D3 furniture block, including dropped axis spines, gridline-carried structure, and the dark
`.chart-tooltip` with its 120ms fade.

### Chart colour

YouTube red is deliberately not used. It is too saturated for the paper surface and would
fight the hairline system — the same reasoning by which the HR site rejected the notebook's
`#E42D2E`.

Ranked bars are ink-toned throughout: the top three in each panel carry full-strength
`--ink`, the remainder sit at `--ink-faint`. Emphasis comes from weight, not hue, matching
the system's depth-from-spacing instinct.

`--positive` and `--negative` are reserved for the two places where sign is real: net profit
in the ROI table, and outlier flagging on the scatter.

## Stack

Next.js 14.2.5, TypeScript, Tailwind CSS 3.4, D3 7.9, PapaParse, Vitest. Static export
(`output: "export"`), deployed to GitHub Pages by GitHub Actions. Light theme only.

`next.config.mjs` derives `basePath` and `assetPrefix` from `GITHUB_REPOSITORY` at build
time. Target URL: `https://emmanuelbett67.github.io/top_UK_YouTubers_2024/`.

Following the HR spec, `typescript.ignoreBuildErrors` is **not** set — type errors must fail
the build.

This replaces the Jekyll setup. `_config.yml` is deleted and GitHub Pages switches from
branch-deploy to Actions.

## Data

`public/uk-youtubers-2024.csv` — `assets/Datasets/youtube_data_from_python.csv` trimmed to
its four clean columns. The Spanish-language Kaggle columns (`NOMBRE`, `SEGUIDORES`, `PAÍS`
and the rest) are dropped; the raw extract stays in `assets/Datasets/` for provenance.

| Column | Type |
|---|---|
| `channel_name` | string |
| `total_subscribers` | integer |
| `total_views` | integer |
| `total_videos` | integer |

100 rows. Verified: no duplicate channel names, no null values, no zero-video channels
(which would divide by zero in three of the six metrics).

Parsed client-side with PapaParse. Every figure on the site is computed in the browser from
this CSV; nothing is hardcoded. This keeps the site reproducible from source and is what
surfaced the corrections below.

### Verified figures

Computed against the shipped CSV. Tests assert this set.

- 100 channels · 1,055.5M subscribers · 471.21B views · 463,545 videos
- **Top 10 by subscribers (M):** NoCopyrightSounds 33.6 · DanTDM 28.6 · Dan Rhodes 26.5 ·
  Miss Katy 24.5 · Mister Max 24.4 · KSI 24.1 · Jelly 23.5 · Dua Lipa 23.3 · Sidemen 21.0 ·
  Ali-A 18.9
- **Most videos:** 24 News HD 165,103 · Sky News 46,009 · BBC News عربي 40,179
- **Most views (B):** DanTDM 19.78 · Dan Rhodes 18.56 · Mister Max 15.97
- **Avg views per video (M):** Mark Ronson 322.79 · Jessie J 59.77 · Dua Lipa 57.62
- **Views per subscriber:** GRM Daily 1,185.79 · Nickelodeon UK 1,061.04 · Disney Kids 1,031.97
- **Subscriber engagement rate:** Mark Ronson 343,000 · Jessie J 110,416.67 · Dua Lipa 104,954.95

## Corrections to the Power BI report

Three of the README's six answers do not survive recomputation. The site states the
corrected version and explains the discrepancy rather than silently replacing the numbers.

1. **Most videos is wrong, not merely imprecise.** The README reports GRM Daily 14,696 ·
   Manchester City 8,248 · Yogscast 6,435. The data gives 24 News HD 165,103 · Sky News
   46,009 · BBC News عربي 40,179. GRM Daily is not close to first. The pattern — every
   channel in the correct top five is a news broadcaster, none of which appear in the
   README — indicates news channels were filtered out of the Power BI table.

2. **Average views per video is 10× low throughout.** The README reports 32.27M / 5.97M /
   5.76M; the data gives 322.79M / 59.77M / 57.62M. The ranking is correct and the
   magnitudes are uniformly off by one decimal place. The engagement-rate table computes
   correctly from the same two columns, so the data is sound. The `Average Views per Video
   (M)` DAX measure is also sound — it divides the ratio by `1000000` exactly once and
   returns 322.79. The error is therefore in the results table as transcribed into the
   README, not in the model. The site states the corrected figures and notes that the
   published measure and the published table disagree.

3. **Two channel names are wrong in the views-per-subscriber table.** The README says
   "Nickelodeon" and "Disney Junior UK"; the source names them "Nickelodeon UK" and
   "Disney Kids". The values match to two decimal places, so this is a labelling slip.

## Analysis

### The small-denominator problem

Mark Ronson leads both ratio metrics — 322.79M average views per video and a 343,000
engagement rate — on **20 videos**. Jessie J, second on both, has 96. These are not
measurements of channel performance; they are artifacts of a small denominator, and a
campaign recommendation resting on them would be fragile.

A bar chart cannot show this: it plots the ratio and hides the count. The site therefore
carries a scatter panel — subscribers against views on log-log axes, video count as radius —
where the low-denominator channels are visibly separated from the mass. The two flagged
channels are drawn in `--negative`.

### ROI model

Per channel:

```
units       = avg views per video × conversion rate
revenue     = units × product price
net profit  = revenue − campaign cost
```

Inputs, stated on the page as assumptions rather than embedded silently:

| Input | Value |
|---|---|
| Product price | £5 |
| Conversion rate | 2% |
| Campaign cost | £50,000 per video |

**Candidate set: the top 10 by subscribers.** This follows the README's own stated
criterion — it prioritises "the YouTube channels with the most subscribers, total views,
videos uploaded". It also excludes Mark Ronson (6.86M subscribers), who would otherwise rank
first on the strength of 20 videos. The exclusion and its reason are stated on the page.

Computed result, ranked by net profit:

| Channel | Videos | Avg views | Units | Revenue | Net profit |
|---|---:|---:|---:|---:|---:|
| Dua Lipa | 222 | 57,623,428 | 1,152,469 | £5,762,343 | **£5,712,343** |
| Sidemen | 349 | 17,338,309 | 346,766 | £1,733,831 | £1,683,831 |
| Miss Katy | 1,079 | 14,330,765 | 286,615 | £1,433,076 | £1,383,076 |
| Mister Max | 1,136 | 14,061,269 | 281,225 | £1,406,127 | £1,356,127 |
| Dan Rhodes | 1,664 | 11,153,151 | 223,063 | £1,115,315 | £1,065,315 |
| NoCopyrightSounds | 1,591 | 6,920,950 | 138,419 | £692,095 | £642,095 |
| DanTDM | 3,705 | 5,337,639 | 106,753 | £533,764 | £483,764 |
| KSI | 1,252 | 4,804,365 | 96,087 | £480,436 | £430,436 |
| Jelly | 6,331 | 2,374,430 | 47,489 | £237,443 | £187,443 |
| Ali-A | 4,303 | 1,500,018 | 30,000 | £150,002 | £100,002 |

### Recommendation

**Dua Lipa**, at £5.71M projected net profit — 3.4× the runner-up. The site states the
qualification alongside it: at 222 videos she has the smallest denominator in the candidate
set by a wide margin (Sidemen 349, Miss Katy 1,079), so the same effect that disqualifies
Mark Ronson applies to her in weaker form. Her lead is large enough to survive it, but the
site says so rather than presenting the ranking as settled.

Sidemen and Miss Katy are named as the alternatives, on denominators roughly 1.6× and 4.9×
larger.

Note that subscriber count alone is a poor guide here: NoCopyrightSounds leads the
subscriber table and places sixth on projected profit, while Ali-A is tenth on both. The
gap between reach and return is the finding the README's dashboard implied but never stated.

## Architecture

Six of the README's questions share one shape — *top N channels by metric*. Six bespoke
charts would create six places for a bug to hide. The site is four primitives plus
configuration.

```
public/uk-youtubers-2024.csv     100 rows × 4 columns
src/lib/csv-loader.ts            PapaParse → typed Channel[]; validates row count, rejects zero-video rows
src/lib/metrics.ts               all aggregation: rankBy(), totals(), derived ratios
src/lib/roi.ts                   the ROI model; takes Channel[] + assumptions, returns ranked RoiRow[]
src/lib/format.ts                number, percent, currency, compact (M/B) formatting
src/lib/chart.ts                 shared D3 palette + tooltip (same module name as the siblings)
src/components/charts/           the four primitives
src/components/panels/           thin wrappers: select data, pass to primitive, render finding
src/app/page.tsx                 composition only
```

The boundary that matters: **`lib/` computes, `components/charts/` draws, and neither knows
about the other's concerns.** Aggregation functions take `Channel[]` and return plain
arrays; chart primitives take those arrays and know nothing about YouTube semantics. Panels
are the only place the two meet, and each is small enough to read at a glance.

`lib/roi.ts` is separated from `lib/metrics.ts` deliberately: it is the only module carrying
business assumptions rather than facts about the data, and keeping it isolated means the
assumptions have exactly one home.

### Chart primitives

**`RankBar`** — horizontal ranked bar, top-N by any metric, sorted descending, top three at
full `--ink`. Powers all six question panels through configuration alone. Horizontal
throughout: channel names are long and the axis has to hold them.

**`StatBand`** — the summary scorecard row. Four figures, `.stat-figure` type, tabular
numerals.

**`Scatter`** — subscribers against views, log-log, radius by video count. The
small-denominator panel described above. Log scales are necessary, not decorative: the
subscriber range spans two orders of magnitude and a linear axis would collapse the lower
80 channels into the origin.

**`RoiTable`** — the ranked profit table. Net profit in `--positive`; a column of inline
bars for magnitude, since eight of ten rows are otherwise a wall of similar-looking numbers.

Plus a sortable 100-row channel table under Data — not a primitive, just a table, so the raw
figures behind every chart stay inspectable.

## Page structure

Single page. Sticky top nav with section anchors, plus links to the GitHub repo and the
existing PDF.

1. **Masthead** — title, eyebrow, and a `<dl>` of dataset facts (channels, fields, source)
2. **Summary** — the `StatBand`: 100 channels · 1,055.5M subscribers · 471.21B views ·
   463,545 videos
3. **Reach** — top 10 by subscribers; most views; most videos uploaded (carrying the
   news-channel correction on the panel)
4. **Efficiency** — average views per video; views per subscriber; subscriber engagement
   rate; then the `Scatter`
5. **Return on investment** — assumptions, the `RoiTable`
6. **Recommendation** — Dua Lipa, with the qualification and the two alternatives
7. **Corrections to the Power BI report** — the three discrepancies above
8. **How it was built** — the Excel → SQL → Power BI pipeline, the SQL transform, the view,
   the six DAX measures, the four data-quality checks with their screenshots, and
   `top_uk_youtubers_2024.gif` as the original deliverable
9. **Method & limitations**
10. **Data** — the sortable 100-row table
11. **Footer** — colophon

Each panel renders its finding as one `text-ink-muted` line beneath the chart, carried from
the README's commentary. This is the README's most valuable asset and a pure dashboard would
discard it.

## Method section

Stated on the page, not buried:

- **Snapshot data.** A single 2024 extract with no time dimension. Nothing here supports a
  claim about growth, trend, or momentum.
- **Subscriber counts arrive pre-rounded.** The source reports 33.6M, not 33,600,000 exactly.
  Precision beyond three significant figures is not available.
- **Reach is measured; fit is not.** The dataset has no likes, comments, watch time,
  audience demographics, or content categories. Whether a channel's audience matches a given
  product is unmeasurable from this data, and it is at least as important as reach.
- **Ratio metrics are unstable at low video counts.** Below roughly 100 videos, average
  views per video says more about the denominator than the channel.
- **Lifetime averages, not recent performance.** A channel's next video is not its
  historical mean.
- **The ROI figures are illustrative.** Product price, conversion rate and campaign cost are
  assumptions, not quoted rates. They are shown so the reader can judge them.
- **Country is taken at face value** from the source's `PAÍS` = "Reino Unido" tag.

## README changes

The README becomes a repo front door: objective, the headline finding, the dashboard GIF,
and a link to the live site. The pipeline detail moves onto the site, so it exists in one
place.

Its table of contents currently promises six sections that were never written — Validation,
Discovery, Recommendations, Potential ROI, Potential Courses of Actions, Conclusion. The
file ends at an empty `## Validation` heading. The rewritten README does not carry a table
of contents for content that lives elsewhere.

## Testing

- Unit tests on `lib/metrics.ts` asserting all six rankings and the totals against the
  verified figures above.
- A loader test asserting 100 rows parse, four columns are present, channel names are
  unique, and no row has zero videos.
- Unit tests on `lib/roi.ts` asserting the formula against the computed table above and the
  net-profit ordering, with the assumptions passed in rather than imported — the test must
  fail if the model changes, not merely if the constants do.
- Manual responsive check at 375px, 768px, and 1440px; charts must reflow, not overflow.
- `npm run build` must pass with type checking enabled.

## Out of scope

- Predictive modelling or forecasting — the data is a single snapshot and cannot support it
- Time series or growth analysis, for the same reason
- Reader-adjustable ROI assumptions (considered and deferred; the static model plus a stated
  limitation carries the same caveat at a fraction of the surface area)
- Cross-filtering between panels
- Dark mode (the siblings are light-only)
- Any CMS, backend, or analytics

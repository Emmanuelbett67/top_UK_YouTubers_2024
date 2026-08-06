# Top UK YouTubers 2024

Which UK YouTube channel is worth a marketing campaign?

**→ [Read the report](https://emmanuelbett67.github.io/top_UK_YouTubers_2024/)**

![Power BI dashboard](assets/images/top_uk_youtubers_2024.gif)

## The question

The Head of Marketing wants to know which UK YouTubers to run campaigns with. Reach is the
easy part of that question and the least useful part of the answer.

## The finding

Ranked by projected return per campaign, **Dua Lipa** leads at £5.7M net — 3.4× the
runner-up. Ranked by subscribers, she is eighth. NoCopyrightSounds tops the subscriber table
and places sixth on projected profit.

Subscriber count is what these channels are publicly ranked by, and it turns out to be a
poor guide to what a campaign is worth.

The report also corrects three errors in the original Power BI output, the largest being the
most-videos ranking: the published answer was GRM Daily at 14,696, and the actual leader is
24 News HD at 165,103.

## How it was built

A Kaggle extract explored in Excel, cleaned and tested in SQL Server, visualised in Power BI,
and republished as a static site that recomputes every figure in the browser with D3. The
SQL, the DAX measures, the data-quality checks and the limitations are all documented in the
[How it was built](https://emmanuelbett67.github.io/top_UK_YouTubers_2024/#build) and
[Method](https://emmanuelbett67.github.io/top_UK_YouTubers_2024/#method) sections of the
report.

| | |
|---|---|
| Data | [Kaggle — Top 100 social media influencers 2024](https://www.kaggle.com/datasets/bhavyadhingra00020/top-100-social-media-influencers-2024-countrywise) |
| Analysis | Excel, SQL Server, Power BI |
| Site | Next.js, TypeScript, D3, Tailwind |
| Design | `docs/superpowers/specs/2026-08-06-top-uk-youtubers-site-design.md` |

## Running it locally

```bash
npm install
npm run data     # regenerate public/uk-youtubers-2024.csv from the raw extract
npm test
npm run dev
```

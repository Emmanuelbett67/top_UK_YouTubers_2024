# Top UK YouTubers 2024 Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Jekyll-rendered README with a Next.js/D3 static site that matches the design system of `HR-employee-Attrition-Analysis`, computes every figure in-browser from the source CSV, and carries the analysis through to an ROI-ranked campaign recommendation.

**Architecture:** `src/lib/` computes, `src/components/charts/` draws, and neither knows about the other's concerns. Panels are the only place the two meet. Four chart primitives plus configuration serve all six of the project's questions; a fifth module, `lib/roi.ts`, is kept separate because it is the only code carrying business assumptions rather than facts about the data.

**Tech Stack:** Next.js 14.2.35, TypeScript 5, Tailwind CSS 3.4, D3 7.9, PapaParse 5.5, Vitest 4. Static export deployed to GitHub Pages by GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-08-06-top-uk-youtubers-site-design.md`

---

## Domain background

You almost certainly have no context on this project. Here is what you need.

The repo analyses the top 100 UK YouTube channels of 2024. Four columns matter:
`channel_name`, `total_subscribers`, `total_views`, `total_videos`. Everything else on the
site is derived from those four.

The project answers six questions. **All six are the same shape — "top N channels by
metric" — which is why there is one bar primitive and not six charts.**

| # | Question | Metric |
|---|---|---|
| 1 | Most subscribers (top 10) | `total_subscribers` |
| 2 | Most videos uploaded | `total_videos` |
| 3 | Most views | `total_views` |
| 4 | Highest average views per video | `total_views / total_videos` |
| 5 | Highest views per subscriber | `total_views / total_subscribers` |
| 6 | Highest subscriber engagement rate | `total_subscribers / total_videos` |

**Three of the README's published answers are wrong.** You are not fixing the README's
numbers by hand — every figure is recomputed from the CSV, so the corrections happen
automatically. But the site has a section that states the discrepancies explicitly, so you
need to know what they are:

1. Most videos: README says GRM Daily 14,696. Truth is 24 News HD 165,103. News channels
   appear to have been filtered out of the Power BI table.
2. Average views per video: README's figures are uniformly 10× low. The DAX measure is
   correct; the transcribed results table is not.
3. Two channels are mislabelled in the views-per-subscriber table.

**The analytical trap.** Mark Ronson leads both ratio metrics (322.79M avg views per video,
343,000 engagement rate) on **20 videos**. Jessie J is second on 96. These are
small-denominator artifacts, not performance. The scatter panel exists specifically to make
this visible, and the ROI model's candidate set excludes them by construction.

---

## File structure

```
scripts/build-dataset.mjs              regenerates the clean CSV from the raw extract
public/uk-youtubers-2024.csv           100 rows × 4 columns — the site's only data input

src/app/globals.css                    design tokens + .chart furniture, copied from the sibling
src/app/layout.tsx                     fonts, metadata
src/app/page.tsx                       composition only

src/lib/csv-loader.ts                  PapaParse → Channel[]; validation
src/lib/metrics.ts                     METRICS accessors, rankBy(), totals()
src/lib/roi.ts                         the ROI model — the only module holding assumptions
src/lib/format.ts                      number/currency/compact formatting
src/lib/chart.ts                       shared D3 palette + tooltip

src/hooks/useChannels.ts               client-side dataset load

src/components/Nav.tsx                 sticky section nav
src/components/Panel.tsx               card-flat wrapper with title + finding footer
src/components/Section.tsx             anchored section heading + intro

src/components/charts/RankBar.tsx      the workhorse — all six questions
src/components/charts/StatBand.tsx     summary scorecards
src/components/charts/Scatter.tsx      log-log, exposes the small-denominator outliers
src/components/charts/RoiTable.tsx     ranked net profit
src/components/ChannelTable.tsx        sortable 100-row raw data table

src/components/sections/Masthead.tsx
src/components/sections/Reach.tsx
src/components/sections/Efficiency.tsx
src/components/sections/Roi.tsx
src/components/sections/Corrections.tsx
src/components/sections/HowItWasBuilt.tsx
src/components/sections/Method.tsx
src/components/sections/Footer.tsx
```

Prose-only sections (`Corrections`, `HowItWasBuilt`, `Method`, `Footer`) hold no data logic
and are plain server components. Everything data-driven hangs off `useChannels`.

---

## Task 1: Scaffold the project

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.mjs`, `postcss.config.mjs`, `tailwind.config.ts`, `vitest.config.ts`, `.eslintrc.json`, `.gitignore`
- Delete: `_config.yml`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "top-uk-youtubers-2024",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "data": "node scripts/build-dataset.mjs",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "clsx": "^2.1.1",
    "d3": "^7.9.0",
    "next": "14.2.35",
    "papaparse": "^5.5.3",
    "react": "^18",
    "react-dom": "^18",
    "tailwind-merge": "^2.4.0",
    "tailwindcss-animate": "^1.0.7"
  },
  "devDependencies": {
    "@types/d3": "^7.4.3",
    "@types/node": "^20",
    "@types/papaparse": "^5.3.16",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "eslint": "^8",
    "eslint-config-next": "14.2.35",
    "postcss": "^8",
    "tailwindcss": "^3.4.1",
    "typescript": "^5",
    "vitest": "^4.1.10"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create `next.config.mjs`**

`basePath` is derived from `GITHUB_REPOSITORY` so the config needs no repo-specific edit.
`NEXT_PUBLIC_BASE_PATH` is exported because the CSV is fetched at runtime and `basePath`
does not rewrite `fetch` URLs.

```js
const isGithubActions = process.env.GITHUB_ACTIONS || false;

let assetPrefix = "";
let basePath = "";

if (isGithubActions) {
  const repo = process.env.GITHUB_REPOSITORY.replace(/.*?\//, "");
  assetPrefix = `/${repo}/`;
  basePath = `/${repo}`;
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  assetPrefix,
  basePath,
  images: { unoptimized: true },
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

export default nextConfig;
```

Note: `typescript.ignoreBuildErrors` is deliberately absent. Do not add it.

- [ ] **Step 4: Create `postcss.config.mjs`**

```js
/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: { tailwindcss: {} },
};

export default config;
```

- [ ] **Step 5: Create `tailwind.config.ts`**

```ts
import type { Config } from "tailwindcss";

const config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: { center: true, padding: "2rem", screens: { "2xl": "1400px" } },
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        border: "hsl(var(--border))",
        "border-strong": "hsl(var(--border-strong))",
        paper: "hsl(var(--paper))",
        ink: {
          DEFAULT: "hsl(var(--ink))",
          muted: "hsl(var(--ink-muted))",
          faint: "hsl(var(--ink-faint))",
        },
        positive: {
          DEFAULT: "hsl(var(--positive))",
          soft: "hsl(var(--positive-soft))",
        },
        negative: {
          DEFAULT: "hsl(var(--negative))",
          soft: "hsl(var(--negative-soft))",
        },
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config;
```

- [ ] **Step 6: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // No test files exist until the loader lands; without this the runner exits 1.
    passWithNoTests: true,
  },
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
});
```

- [ ] **Step 7: Create `.eslintrc.json`**

```json
{
  "extends": ["next/core-web-vitals"]
}
```

- [ ] **Step 8: Create `.gitignore`**

```
node_modules
.next
out
next-env.d.ts
*.tsbuildinfo
.DS_Store
```

- [ ] **Step 9: Delete the Jekyll config**

The site is no longer built by Jekyll. Leaving `_config.yml` in place would let Pages keep
serving the old README build.

```bash
git rm _config.yml
```

- [ ] **Step 10: Install and verify**

```bash
npm install
```

Expected: dependencies resolve, `package-lock.json` created.

- [ ] **Step 11: Commit**

```bash
git add package.json package-lock.json tsconfig.json next.config.mjs postcss.config.mjs tailwind.config.ts vitest.config.ts .eslintrc.json .gitignore
git commit -m "chore: scaffold Next.js project, remove Jekyll config"
```

---

## Task 2: Build the clean dataset

**Files:**
- Create: `scripts/build-dataset.mjs`
- Create: `public/uk-youtubers-2024.csv` (generated)

The raw extract at `assets/Datasets/youtube_data_from_python.csv` carries nine
Spanish-language Kaggle columns plus a trailing empty column. The site needs four columns.
A committed script rather than a hand-edited file keeps the derivation reproducible and
auditable.

- [ ] **Step 1: Write the script**

Create `scripts/build-dataset.mjs`:

```js
// Regenerates public/uk-youtubers-2024.csv from the raw Kaggle-derived extract.
// Run: npm run data
import { readFileSync, writeFileSync } from "node:fs";
import Papa from "papaparse";

const SOURCE = "assets/Datasets/youtube_data_from_python.csv";
const TARGET = "public/uk-youtubers-2024.csv";
const COLUMNS = ["channel_name", "total_subscribers", "total_views", "total_videos"];

const { data } = Papa.parse(readFileSync(SOURCE, "utf8"), {
  header: true,
  skipEmptyLines: true,
});

const rows = data
  .filter((row) => (row.channel_name ?? "").trim() !== "")
  .map((row) => ({
    channel_name: row.channel_name.trim(),
    total_subscribers: Number(row.total_subscribers),
    total_views: Number(row.total_views),
    total_videos: Number(row.total_videos),
  }));

// These are the dataset's stated constraints. A silent violation would show up as a
// wrong figure on a chart, which is far harder to notice than a failed build.
if (rows.length !== 100) {
  throw new Error(`Expected 100 rows, got ${rows.length}`);
}
if (new Set(rows.map((r) => r.channel_name)).size !== rows.length) {
  throw new Error("Duplicate channel names in source");
}
for (const row of rows) {
  for (const column of COLUMNS.slice(1)) {
    if (!Number.isFinite(row[column])) throw new Error(`${row.channel_name}: bad ${column}`);
  }
  // Three of the six metrics divide by this.
  if (row.total_videos === 0) throw new Error(`${row.channel_name}: zero videos`);
}

writeFileSync(TARGET, Papa.unparse(rows, { columns: COLUMNS }) + "\n", "utf8");
console.log(`Wrote ${rows.length} rows to ${TARGET}`);
```

- [ ] **Step 2: Run it**

```bash
mkdir -p public
npm run data
```

Expected: `Wrote 100 rows to public/uk-youtubers-2024.csv`

- [ ] **Step 3: Spot-check the output**

```bash
head -3 public/uk-youtubers-2024.csv
```

Expected first three lines:

```
channel_name,total_subscribers,total_views,total_videos
NoCopyrightSounds,33600000,11011230785,1591
DanTDM,28600000,19775951435,3705
```

The file must be UTF-8 — one channel is named `BBC News عربي`. If that renders as mojibake,
the write encoding is wrong.

- [ ] **Step 4: Commit**

```bash
git add scripts/build-dataset.mjs public/uk-youtubers-2024.csv
git commit -m "feat: derive clean four-column dataset from raw extract"
```

---

## Task 3: CSV loader

**Files:**
- Create: `src/lib/csv-loader.ts`
- Test: `src/lib/csv-loader.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/csv-loader.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { parseChannels } from "./csv-loader";

const csv = readFileSync(
  path.resolve(process.cwd(), "public/uk-youtubers-2024.csv"),
  "utf8"
);

describe("parseChannels", () => {
  const channels = parseChannels(csv);

  it("parses every row of the dataset", () => {
    expect(channels).toHaveLength(100);
  });

  it("types all four columns", () => {
    const [first] = channels;
    expect(first.channel_name).toBe("NoCopyrightSounds");
    expect(first.total_subscribers).toBe(33_600_000);
    expect(first.total_views).toBe(11_011_230_785);
    expect(first.total_videos).toBe(1591);
  });

  it("has unique channel names", () => {
    const names = new Set(channels.map((c) => c.channel_name));
    expect(names.size).toBe(100);
  });

  it("has no zero-video channels, which would divide by zero", () => {
    expect(channels.filter((c) => c.total_videos === 0)).toEqual([]);
  });

  it("preserves non-latin channel names", () => {
    expect(channels.map((c) => c.channel_name)).toContain("BBC News عربي");
  });

  it("rejects a dataset that is not 100 rows", () => {
    const truncated = csv.split("\n").slice(0, 5).join("\n");
    expect(() => parseChannels(truncated)).toThrow(/100 rows/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/csv-loader.test.ts`
Expected: FAIL — cannot resolve `./csv-loader`.

- [ ] **Step 3: Write the implementation**

Create `src/lib/csv-loader.ts`:

```ts
import Papa from "papaparse";

/** The site's entire data model. Everything else is derived from these four fields. */
export interface Channel {
  channel_name: string;
  total_subscribers: number;
  total_views: number;
  total_videos: number;
}

export const EXPECTED_ROWS = 100;

type RawRow = Record<string, string | number | null>;

export function parseChannels(csvText: string): Channel[] {
  const { data } = Papa.parse<RawRow>(csvText, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
  });

  const channels = data
    .filter((row) => row && typeof row.channel_name === "string")
    .map((row) => ({
      channel_name: String(row.channel_name).trim(),
      total_subscribers: Number(row.total_subscribers),
      total_views: Number(row.total_views),
      total_videos: Number(row.total_videos),
    }));

  // A short read — a truncated fetch, a bad deploy — would otherwise render as
  // plausible-looking charts computed over partial data.
  if (channels.length !== EXPECTED_ROWS) {
    throw new Error(`Expected ${EXPECTED_ROWS} rows, parsed ${channels.length}`);
  }

  return channels;
}

export const loadChannels = (csvUrl: string): Promise<Channel[]> =>
  fetch(csvUrl)
    .then((response) => {
      if (!response.ok) throw new Error(`Failed to load dataset (${response.status})`);
      return response.text();
    })
    .then(parseChannels);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/csv-loader.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/csv-loader.ts src/lib/csv-loader.test.ts
git commit -m "feat: add CSV loader with row-count validation"
```

---

## Task 4: Metrics

**Files:**
- Create: `src/lib/metrics.ts`
- Test: `src/lib/metrics.test.ts`

This is the module that produces the corrected answers. The expected values below were
verified against the shipped CSV; they are the site's source of truth.

- [ ] **Step 1: Write the failing test**

Create `src/lib/metrics.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { parseChannels } from "./csv-loader";
import { rankBy, totals } from "./metrics";

const channels = parseChannels(
  readFileSync(path.resolve(process.cwd(), "public/uk-youtubers-2024.csv"), "utf8")
);

const names = (metric: Parameters<typeof rankBy>[1], n: number) =>
  rankBy(channels, metric, n).map((d) => d.label);

describe("totals", () => {
  it("sums the dataset", () => {
    const t = totals(channels);
    expect(t.channels).toBe(100);
    expect(t.subscribers).toBe(1_055_540_000);
    expect(t.views).toBe(471_205_591_517);
    expect(t.videos).toBe(463_545);
  });
});

describe("rankBy", () => {
  it("ranks the top 10 by subscribers", () => {
    expect(names("subscribers", 10)).toEqual([
      "NoCopyrightSounds",
      "DanTDM",
      "Dan Rhodes",
      "Miss Katy",
      "Mister Max",
      "KSI",
      "Jelly",
      "Dua Lipa",
      "Sidemen",
      "Ali-A",
    ]);
  });

  it("ranks by total views", () => {
    expect(names("views", 3)).toEqual(["DanTDM", "Dan Rhodes", "Mister Max"]);
  });

  // The README says GRM Daily 14,696. It is not close. News channels appear to have
  // been filtered out of the Power BI table; this test pins the corrected answer.
  it("ranks by videos uploaded, including news channels", () => {
    expect(names("videos", 3)).toEqual(["24 News HD", "Sky News", "BBC News عربي"]);
  });

  // The README's figures for this metric are uniformly 10x low.
  it("ranks by average views per video", () => {
    const top = rankBy(channels, "avgViewsPerVideo", 3);
    expect(top.map((d) => d.label)).toEqual(["Mark Ronson", "Jessie J", "Dua Lipa"]);
    expect(top[0].value / 1e6).toBeCloseTo(322.79, 2);
    expect(top[1].value / 1e6).toBeCloseTo(59.77, 2);
  });

  it("ranks by views per subscriber", () => {
    const top = rankBy(channels, "viewsPerSubscriber", 3);
    expect(top.map((d) => d.label)).toEqual([
      "GRM Daily",
      "Nickelodeon UK",
      "Disney Kids",
    ]);
    expect(top[0].value).toBeCloseTo(1185.79, 2);
  });

  it("ranks by subscriber engagement rate", () => {
    const top = rankBy(channels, "engagementRate", 3);
    expect(top.map((d) => d.label)).toEqual(["Mark Ronson", "Jessie J", "Dua Lipa"]);
    expect(top[0].value).toBeCloseTo(343_000, 0);
  });

  it("carries the source channel through, so panels can show context", () => {
    const [first] = rankBy(channels, "avgViewsPerVideo", 1);
    // The small-denominator problem the scatter panel exists to expose.
    expect(first.channel.total_videos).toBe(20);
  });

  it("does not mutate its input", () => {
    const before = channels.map((c) => c.channel_name);
    rankBy(channels, "views", 5);
    expect(channels.map((c) => c.channel_name)).toEqual(before);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/metrics.test.ts`
Expected: FAIL — cannot resolve `./metrics`.

- [ ] **Step 3: Write the implementation**

Create `src/lib/metrics.ts`:

```ts
import type { Channel } from "./csv-loader";

export type MetricKey =
  | "subscribers"
  | "views"
  | "videos"
  | "avgViewsPerVideo"
  | "viewsPerSubscriber"
  | "engagementRate";

/**
 * Every ranked panel on the site is one of these accessors plus a top-N. Adding a
 * question means adding an entry here, not writing a chart.
 */
export const METRICS: Record<MetricKey, (channel: Channel) => number> = {
  subscribers: (c) => c.total_subscribers,
  views: (c) => c.total_views,
  videos: (c) => c.total_videos,
  avgViewsPerVideo: (c) => c.total_views / c.total_videos,
  viewsPerSubscriber: (c) => c.total_views / c.total_subscribers,
  engagementRate: (c) => c.total_subscribers / c.total_videos,
};

export interface RankDatum {
  label: string;
  value: number;
  /** The source row, so a tooltip can show the figures behind a ratio. */
  channel: Channel;
}

export function rankBy(
  channels: Channel[],
  metric: MetricKey,
  topN: number
): RankDatum[] {
  const accessor = METRICS[metric];
  return [...channels]
    .sort((a, b) => accessor(b) - accessor(a))
    .slice(0, topN)
    .map((channel) => ({
      label: channel.channel_name,
      value: accessor(channel),
      channel,
    }));
}

export interface Totals {
  channels: number;
  subscribers: number;
  views: number;
  videos: number;
}

const sum = (channels: Channel[], accessor: (c: Channel) => number) =>
  channels.reduce((total, channel) => total + accessor(channel), 0);

export function totals(channels: Channel[]): Totals {
  return {
    channels: channels.length,
    subscribers: sum(channels, METRICS.subscribers),
    views: sum(channels, METRICS.views),
    videos: sum(channels, METRICS.videos),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/metrics.test.ts`
Expected: PASS, 9 tests.

If the `totals` assertions fail, print the actual values and update the test — the sums are
derived from the CSV, and the CSV is authoritative. Do not adjust `rankBy` assertions; those
were verified independently.

- [ ] **Step 5: Commit**

```bash
git add src/lib/metrics.ts src/lib/metrics.test.ts
git commit -m "feat: add metrics with all six rankings pinned by test"
```

---

## Task 5: ROI model

**Files:**
- Create: `src/lib/roi.ts`
- Test: `src/lib/roi.test.ts`

Kept separate from `metrics.ts` because it is the only module carrying business
assumptions rather than facts about the data. Assumptions are a parameter, never a hidden
constant — the test passes its own so that changing a default cannot silently pass a stale
test.

- [ ] **Step 1: Write the failing test**

Create `src/lib/roi.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { parseChannels } from "./csv-loader";
import { DEFAULT_ASSUMPTIONS, roiRanking } from "./roi";

const channels = parseChannels(
  readFileSync(path.resolve(process.cwd(), "public/uk-youtubers-2024.csv"), "utf8")
);

describe("roiRanking", () => {
  const rows = roiRanking(channels, DEFAULT_ASSUMPTIONS);

  it("considers exactly the top 10 by subscribers", () => {
    expect(rows).toHaveLength(10);
    expect(rows.map((r) => r.channel).sort()).toEqual(
      [
        "Ali-A",
        "Dan Rhodes",
        "DanTDM",
        "Dua Lipa",
        "Jelly",
        "KSI",
        "Miss Katy",
        "Mister Max",
        "NoCopyrightSounds",
        "Sidemen",
      ].sort()
    );
  });

  // Mark Ronson tops both ratio metrics on 20 videos. He must not reach the ranking:
  // at 6.86M subscribers he is outside the candidate set by construction.
  it("excludes the small-denominator outlier", () => {
    expect(rows.map((r) => r.channel)).not.toContain("Mark Ronson");
  });

  it("ranks by net profit descending", () => {
    const profits = rows.map((r) => r.netProfit);
    expect(profits).toEqual([...profits].sort((a, b) => b - a));
    expect(rows[0].channel).toBe("Dua Lipa");
    expect(rows[0].netProfit).toBeCloseTo(5_712_343, 0);
    expect(rows[1].channel).toBe("Sidemen");
    expect(rows[1].netProfit).toBeCloseTo(1_683_831, 0);
    expect(rows[9].channel).toBe("Ali-A");
    expect(rows[9].netProfit).toBeCloseTo(100_002, 0);
  });

  it("applies the formula, not a memorised table", () => {
    // Assumptions deliberately different from the defaults: if the model were
    // hardcoded to the shipped figures, this would not move.
    const custom = { productPrice: 10, conversionRate: 0.01, campaignCost: 0 };
    const [top] = roiRanking(channels, custom);
    expect(top.units).toBeCloseTo(top.avgViews * 0.01, 6);
    expect(top.revenue).toBeCloseTo(top.units * 10, 6);
    expect(top.netProfit).toBeCloseTo(top.revenue, 6);
  });

  it("lets the campaign cost change which candidates are viable", () => {
    // At £1M, five of the ten still clear. At £2M only Dua Lipa does — her revenue is
    // £5.76M against a runner-up on £1.73M.
    const expensive = { ...DEFAULT_ASSUMPTIONS, campaignCost: 2_000_000 };
    const viable = roiRanking(channels, expensive).filter((r) => r.netProfit > 0);
    expect(viable.map((r) => r.channel)).toEqual(["Dua Lipa"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/roi.test.ts`
Expected: FAIL — cannot resolve `./roi`.

- [ ] **Step 3: Write the implementation**

Create `src/lib/roi.ts`:

```ts
import type { Channel } from "./csv-loader";
import { METRICS, rankBy } from "./metrics";

export interface RoiAssumptions {
  /** GBP earned per unit sold. */
  productPrice: number;
  /** Fraction of viewers who buy, 0–1. */
  conversionRate: number;
  /** GBP, one-off, per video campaign. */
  campaignCost: number;
}

/**
 * Illustrative, not quoted rates. Shown on the page as inputs so the reader can
 * judge them rather than inherit them.
 */
export const DEFAULT_ASSUMPTIONS: RoiAssumptions = {
  productPrice: 5,
  conversionRate: 0.02,
  campaignCost: 50_000,
};

/**
 * Candidates are the top 10 by subscriber base — the README's own stated criterion.
 * It also excludes channels whose ratio metrics are small-denominator artifacts:
 * Mark Ronson leads average views per video on 20 videos and would otherwise rank
 * first here.
 */
export const CANDIDATE_COUNT = 10;

export interface RoiRow {
  channel: string;
  videos: number;
  avgViews: number;
  units: number;
  revenue: number;
  netProfit: number;
}

export function roiRanking(
  channels: Channel[],
  assumptions: RoiAssumptions = DEFAULT_ASSUMPTIONS,
  candidateCount: number = CANDIDATE_COUNT
): RoiRow[] {
  const { productPrice, conversionRate, campaignCost } = assumptions;

  return rankBy(channels, "subscribers", candidateCount)
    .map(({ channel }) => {
      const avgViews = METRICS.avgViewsPerVideo(channel);
      const units = avgViews * conversionRate;
      const revenue = units * productPrice;

      return {
        channel: channel.channel_name,
        videos: channel.total_videos,
        avgViews,
        units,
        revenue,
        netProfit: revenue - campaignCost,
      };
    })
    .sort((a, b) => b.netProfit - a.netProfit);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/roi.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 5: Run the whole suite**

Run: `npm test`
Expected: PASS, 20 tests across three files.

- [ ] **Step 6: Commit**

```bash
git add src/lib/roi.ts src/lib/roi.test.ts
git commit -m "feat: add ROI model with assumptions as a parameter"
```

---

## Task 6: Formatting and chart palette

**Files:**
- Create: `src/lib/format.ts`
- Create: `src/lib/chart.ts`

No tests: these are thin wrappers over `d3.format` with no branching worth pinning, and
their output is verified visually on every panel.

- [ ] **Step 1: Create `src/lib/format.ts`**

```ts
import * as d3 from "d3";

const grouped = d3.format(",");

/** `463,545` */
export const count = (value: number) => grouped(Math.round(value));

/** `£5,712,343` */
export const gbp = (value: number) => `£${grouped(Math.round(value))}`;

/** `33.6M` — the precision the source itself publishes. */
export const millions = (value: number) => `${d3.format(".1f")(value / 1e6)}M`;

/** `19.78B` */
export const billions = (value: number) => `${d3.format(".2f")(value / 1e9)}B`;

/** `1,185.79` — for unitless ratios. */
export const ratio = (value: number) => d3.format(",.2f")(value);

/**
 * `11.0B` / `33.6M` / `1.6k` — magnitude over digits, for axis ticks where four
 * ranked bars would otherwise carry twelve-digit labels.
 */
export const compact = (value: number) => {
  const abs = Math.abs(value);
  if (abs >= 1e9) return `${d3.format(".2~f")(value / 1e9)}B`;
  if (abs >= 1e6) return `${d3.format(".1~f")(value / 1e6)}M`;
  if (abs >= 1e3) return `${d3.format(".1~f")(value / 1e3)}k`;
  return d3.format(".0f")(value);
};

/** `£5.7M` — ROI figures run to seven digits and the axis cannot hold them. */
export const compactGbp = (value: number) => `£${compact(value)}`;
```

- [ ] **Step 2: Create `src/lib/chart.ts`**

D3 writes SVG attributes, which cannot read Tailwind classes, so the tokens are duplicated
here as hex. These values are the hex equivalents of the CSS custom properties in
`globals.css` — if one changes, change both.

```ts
import * as d3 from "d3";

/**
 * Ranked bars are ink-toned throughout: the panel's answer at full strength, the
 * remainder dimmed. Emphasis by weight, not hue — YouTube red is deliberately absent,
 * it would fight the paper surface and the hairline system.
 */
export const ink = {
  base: "#16181d",
  muted: "#666b75",
  faint: "#9a9ea6",
  /** Non-highlighted bars. Warm grey, sits with the paper rather than on it. */
  dim: "#bcb8b0",
  hairline: "#e5e2dd",
  paper: "#ffffff",
} as const;

/** Reserved for the two places sign is real: net profit, and outlier flagging. */
export const accent = {
  positive: "#0d6d50",
  negative: "#a94a2c",
} as const;

type TooltipRow = { key: string; value: string; accent?: string };

export function tooltip() {
  const node = d3
    .select<HTMLElement, unknown>("body")
    .selectAll<HTMLDivElement, unknown>("div.chart-tooltip")
    .data([null])
    .join("div")
    .attr("class", "chart-tooltip");

  return {
    show(event: MouseEvent, title: string, rows: TooltipRow[]) {
      node.attr("data-show", "true").html(
        `<div class="tt-title">${title}</div>` +
          rows
            .map(
              (r) =>
                `<div class="tt-row"><span class="tt-key">${r.key}</span>` +
                `<span class="tt-val"${
                  r.accent ? ` style="color:${r.accent}"` : ""
                }>${r.value}</span></div>`
            )
            .join("")
      );
      this.move(event);
    },
    move(event: MouseEvent) {
      const { width, height } = (node.node() as HTMLDivElement).getBoundingClientRect();
      const left =
        event.pageX + 16 + width > window.scrollX + window.innerWidth
          ? event.pageX - width - 16
          : event.pageX + 16;
      const top =
        event.pageY - height / 2 < window.scrollY
          ? window.scrollY + 8
          : event.pageY - height / 2;
      node.style("left", `${left}px`).style("top", `${top}px`);
    },
    hide() {
      node.attr("data-show", "false");
    },
  };
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/format.ts src/lib/chart.ts
git commit -m "feat: add formatting helpers and shared chart palette"
```

---

## Task 7: App shell — globals, layout, placeholder page

**Files:**
- Create: `src/app/globals.css`, `src/app/layout.tsx`, `src/app/page.tsx`

`globals.css` is copied verbatim from the sibling project. Do not reinterpret the tokens —
the whole point is that the three sites read as one portfolio.

- [ ] **Step 1: Create `src/app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --paper: 40 20% 98.5%;
    --background: 40 20% 98.5%;
    --foreground: 220 15% 9%;
    --card: 0 0% 100%;
    --card-foreground: 220 15% 9%;
    --popover: 220 15% 9%;
    --popover-foreground: 40 20% 98.5%;

    --ink: 220 15% 9%;
    --ink-muted: 220 6% 42%;
    --ink-faint: 220 6% 62%;

    --muted: 40 12% 95%;
    --muted-foreground: 220 6% 42%;

    --border: 38 12% 89%;
    --border-strong: 38 10% 80%;

    --positive: 162 78% 24%;
    --positive-soft: 162 40% 94%;
    --negative: 12 62% 42%;
    --negative-soft: 12 55% 95%;

    --radius: 0.25rem;
  }
}

@layer base {
  * {
    @apply border-border;
  }

  html {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
    scroll-behavior: smooth;
    scroll-padding-top: 5rem;
  }

  body {
    @apply bg-background text-foreground;
    font-feature-settings: "cv02", "cv03", "cv04", "cv11";
  }

  .tnum,
  table,
  [data-numeric] {
    font-variant-numeric: tabular-nums;
    font-feature-settings: "tnum";
  }
}

@layer components {
  .card-flat {
    @apply bg-card border border-border rounded;
  }

  .eyebrow {
    @apply text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground;
  }

  .stat-figure {
    @apply text-[26px] leading-none font-medium tracking-[-0.02em] tnum;
  }

  .rule {
    @apply border-t border-border;
  }
}

@layer utilities {
  .text-positive {
    color: hsl(var(--positive));
  }
  .text-negative {
    color: hsl(var(--negative));
  }
}

/* ---- D3 chart chrome -------------------------------------------------- */

.chart text {
  font-family: var(--font-sans), system-ui, sans-serif;
  fill: hsl(var(--ink-muted));
  font-size: 11px;
}

.chart .axis text {
  font-variant-numeric: tabular-nums;
  fill: hsl(var(--ink-faint));
  font-size: 10.5px;
  letter-spacing: 0.01em;
}

.chart .axis .domain {
  display: none;
}

.chart .axis line {
  stroke: hsl(var(--border));
}

.chart .axis--baseline .domain {
  display: initial;
  stroke: hsl(var(--border-strong));
}

.chart .grid line {
  stroke: hsl(var(--border));
  stroke-width: 1;
  shape-rendering: crispEdges;
}

.chart .grid .domain {
  display: none;
}

.chart .value-label {
  fill: hsl(var(--ink));
  font-size: 11px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}

.chart .baseline-rule {
  stroke: hsl(var(--ink-faint));
  stroke-dasharray: 3 3;
  stroke-width: 1;
}

.chart .baseline-label {
  fill: hsl(var(--ink-faint));
  font-size: 10px;
  letter-spacing: 0.01em;
}

.chart-tooltip {
  position: absolute;
  z-index: 50;
  pointer-events: none;
  min-width: 170px;
  padding: 10px 12px;
  border-radius: 4px;
  background: hsl(var(--popover));
  color: hsl(var(--popover-foreground));
  font-family: var(--font-sans), system-ui, sans-serif;
  font-size: 12px;
  line-height: 1.45;
  box-shadow: 0 8px 24px -6px rgb(0 0 0 / 0.35);
  opacity: 0;
  transition: opacity 120ms ease;
}

.chart-tooltip[data-show="true"] {
  opacity: 1;
}

.chart-tooltip .tt-title {
  font-weight: 500;
  letter-spacing: -0.01em;
  padding-bottom: 6px;
  margin-bottom: 6px;
  border-bottom: 1px solid rgb(255 255 255 / 0.14);
}

.chart-tooltip .tt-row {
  display: flex;
  justify-content: space-between;
  gap: 20px;
}

.chart-tooltip .tt-key {
  color: rgb(255 255 255 / 0.6);
}

.chart-tooltip .tt-val {
  font-variant-numeric: tabular-nums;
}
```

- [ ] **Step 2: Create `src/app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Top UK YouTubers 2024 — Analysis Report",
  description:
    "Which UK YouTube channel is worth a marketing campaign? 100 channels ranked by reach, efficiency, and projected return.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
```

- [ ] **Step 3: Create a placeholder `src/app/page.tsx`**

Replaced in Task 14. This exists so the build can be verified now.

```tsx
export default function Home() {
  return (
    <main className="mx-auto max-w-[1240px] px-6 py-16 lg:px-10">
      <p className="eyebrow">Data project</p>
      <h1 className="mt-3 text-3xl font-medium tracking-[-0.02em] text-ink">
        Top UK YouTubers 2024
      </h1>
    </main>
  );
}
```

- [ ] **Step 4: Verify the build**

```bash
npm run build
```

Expected: compiles, type-checks, and writes `out/`. Fonts are fetched at build time, so
this step needs network access.

- [ ] **Step 5: Commit**

```bash
git add src/app/globals.css src/app/layout.tsx src/app/page.tsx
git commit -m "feat: add app shell with design tokens copied from sibling project"
```

---

## Task 8: RankBar primitive

**Files:**
- Create: `src/components/charts/RankBar.tsx`

The workhorse. All six questions render through this one component; only the data and the
formatter change. Horizontal throughout — channel names are long and a vertical axis cannot
hold them.

- [ ] **Step 1: Write the component**

```tsx
"use client";

import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import type { RankDatum } from "@/lib/metrics";
import { ink, tooltip } from "@/lib/chart";
import { count } from "@/lib/format";

interface RankBarProps {
  data: RankDatum[];
  /**
   * Renders the bar value in labels, ticks and tooltip. Define this at module
   * scope in the calling panel — an inline arrow changes identity every render
   * and would redraw the chart on every parent update.
   */
  format: (value: number) => string;
  /** Tooltip row label for the metric, e.g. "Avg views per video". */
  metricLabel: string;
  /** Leading bars drawn at full ink — the panel's answer. */
  highlight?: number;
  /** Accessible description of the chart. */
  label: string;
}

const WIDTH = 720;

const RankBar: React.FC<RankBarProps> = ({
  data,
  format,
  metricLabel,
  highlight = 3,
  label,
}) => {
  const ref = useRef<SVGSVGElement>(null);
  const height = Math.max(220, data.length * 34 + 64);

  useEffect(() => {
    if (!ref.current || !data.length) return;

    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();

    // The left gutter holds channel names; the right holds the value label.
    const margin = { top: 20, right: 96, bottom: 34, left: 168 };
    const width = WIDTH - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const y = d3
      .scaleBand()
      .domain(data.map((d) => d.label))
      .range([0, innerHeight])
      .padding(0.28);

    const x = d3
      .scaleLinear()
      .domain([0, (d3.max(data, (d) => d.value) ?? 0) * 1.15])
      .nice()
      .range([0, width]);

    const fillFor = (index: number) => (index < highlight ? ink.base : ink.dim);
    const tip = tooltip();

    g.append("g")
      .attr("class", "grid")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(
        d3
          .axisBottom(x)
          .ticks(5)
          .tickSize(-innerHeight)
          .tickFormat(() => "")
      );

    g.append("g").attr("class", "axis").call(d3.axisLeft(y).tickSize(0).tickPadding(10));

    g.append("g")
      .attr("class", "axis")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(
        d3
          .axisBottom(x)
          .ticks(5)
          .tickSize(0)
          .tickPadding(10)
          .tickFormat((v) => format(v as number))
      );

    const bars = g
      .selectAll<SVGRectElement, RankDatum>("rect.bar")
      .data(data)
      .join("rect")
      .attr("class", "bar")
      .attr("y", (d) => y(d.label) ?? 0)
      .attr("height", y.bandwidth())
      .attr("x", 0)
      .attr("width", 0)
      .attr("rx", 1)
      .attr("fill", (_d, i) => fillFor(i))
      .style("cursor", "pointer");

    bars
      .on("mouseenter", function (this: SVGRectElement, event: MouseEvent, d: RankDatum) {
        d3.select(this).attr("fill", ink.base);
        tip.show(event, d.label, [
          { key: metricLabel, value: format(d.value) },
          { key: "Subscribers", value: count(d.channel.total_subscribers) },
          { key: "Total views", value: count(d.channel.total_views) },
          { key: "Videos", value: count(d.channel.total_videos) },
        ]);
      })
      .on("mousemove", (event: MouseEvent) => tip.move(event))
      .on("mouseleave", function (this: SVGRectElement, _event: MouseEvent, d: RankDatum) {
        d3.select(this).attr("fill", fillFor(data.indexOf(d)));
        tip.hide();
      });

    bars
      .transition()
      .duration(650)
      .delay((_d, i) => i * 45)
      .ease(d3.easeCubicOut)
      .attr("width", (d) => x(d.value));

    g.selectAll("text.value-label")
      .data(data)
      .join("text")
      .attr("class", "value-label")
      .attr("x", (d) => x(d.value) + 7)
      .attr("y", (d) => (y(d.label) ?? 0) + y.bandwidth() / 2 + 4)
      .attr("opacity", 0)
      .text((d) => format(d.value))
      .transition()
      .delay(600)
      .duration(300)
      .attr("opacity", 1);

    return () => tip.hide();
  }, [data, format, metricLabel, highlight, height]);

  return (
    <div className="w-full overflow-x-auto">
      <svg
        ref={ref}
        className="chart"
        role="img"
        aria-label={label}
        width="100%"
        viewBox={`0 0 ${WIDTH} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ display: "block", height: "auto", minWidth: 420 }}
      />
    </div>
  );
};

export default RankBar;
```

- [ ] **Step 2: Verify it type-checks**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/charts/RankBar.tsx
git commit -m "feat: add RankBar primitive serving all six questions"
```

---

## Task 9: StatBand and Scatter primitives

**Files:**
- Create: `src/components/charts/StatBand.tsx`, `src/components/charts/Scatter.tsx`

- [ ] **Step 1: Create `src/components/charts/StatBand.tsx`**

```tsx
import React from "react";

export interface Stat {
  label: string;
  value: string;
  note?: string;
}

const StatBand: React.FC<{ stats: Stat[] }> = ({ stats }) => (
  <dl className="card-flat grid grid-cols-2 divide-y divide-border sm:grid-cols-4 sm:divide-y-0 sm:divide-x">
    {stats.map((stat) => (
      <div key={stat.label} className="px-5 py-6">
        <dt className="eyebrow">{stat.label}</dt>
        <dd className="stat-figure mt-3 text-ink">{stat.value}</dd>
        {stat.note && <p className="mt-2 text-xs text-ink-faint">{stat.note}</p>}
      </div>
    ))}
  </dl>
);

export default StatBand;
```

- [ ] **Step 2: Create `src/components/charts/Scatter.tsx`**

Log scales are structural, not decorative: subscriber counts span two orders of magnitude
and a linear axis collapses the lower 80 channels into the origin. Radius encodes video
count, which is what makes the ratio outliers legible as *small* rather than merely extreme.

```tsx
"use client";

import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import type { Channel } from "@/lib/csv-loader";
import { accent, ink, tooltip } from "@/lib/chart";
import { compact, count, millions, ratio } from "@/lib/format";

interface ScatterProps {
  data: Channel[];
  /** Channels drawn in the accent colour and labelled — the outliers being called out. */
  flagged: string[];
  label: string;
}

const WIDTH = 720;
const HEIGHT = 420;

const Scatter: React.FC<ScatterProps> = ({ data, flagged, label }) => {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!ref.current || !data.length) return;

    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();

    const margin = { top: 20, right: 24, bottom: 48, left: 64 };
    const width = WIDTH - margin.left - margin.right;
    const height = HEIGHT - margin.top - margin.bottom;

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3
      .scaleLog()
      .domain(d3.extent(data, (d) => d.total_subscribers) as [number, number])
      .nice()
      .range([0, width]);

    const y = d3
      .scaleLog()
      .domain(d3.extent(data, (d) => d.total_views) as [number, number])
      .nice()
      .range([height, 0]);

    const r = d3
      .scaleSqrt()
      .domain(d3.extent(data, (d) => d.total_videos) as [number, number])
      .range([3, 16]);

    const isFlagged = (d: Channel) => flagged.includes(d.channel_name);

    g.append("g")
      .attr("class", "grid")
      .call(
        d3
          .axisLeft(y)
          .ticks(4)
          .tickSize(-width)
          .tickFormat(() => "")
      );

    g.append("g")
      .attr("class", "axis")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(5).tickSize(0).tickPadding(10).tickFormat((v) => compact(v as number)));

    g.append("g")
      .attr("class", "axis")
      .call(d3.axisLeft(y).ticks(4).tickSize(0).tickPadding(10).tickFormat((v) => compact(v as number)));

    g.append("text")
      .attr("class", "baseline-label")
      .attr("x", width)
      .attr("y", height + 38)
      .attr("text-anchor", "end")
      .text("subscribers →");

    g.append("text")
      .attr("class", "baseline-label")
      .attr("x", 0)
      .attr("y", -6)
      .text("total views ↑");

    const tip = tooltip();

    g.selectAll<SVGCircleElement, Channel>("circle")
      .data(data)
      .join("circle")
      .attr("cx", (d) => x(d.total_subscribers))
      .attr("cy", (d) => y(d.total_views))
      .attr("r", (d) => r(d.total_videos))
      .attr("fill", (d) => (isFlagged(d) ? accent.negative : ink.dim))
      .attr("fill-opacity", (d) => (isFlagged(d) ? 0.85 : 0.55))
      .attr("stroke", (d) => (isFlagged(d) ? accent.negative : ink.faint))
      .attr("stroke-width", 1)
      .style("cursor", "pointer")
      .on("mouseenter", function (this: SVGCircleElement, event: MouseEvent, d: Channel) {
        d3.select(this).attr("fill", ink.base).attr("fill-opacity", 0.9);
        tip.show(event, d.channel_name, [
          { key: "Subscribers", value: count(d.total_subscribers) },
          { key: "Total views", value: count(d.total_views) },
          { key: "Videos", value: count(d.total_videos) },
          {
            key: "Avg views/video",
            value: millions(d.total_views / d.total_videos),
            accent: isFlagged(d) ? accent.negative : undefined,
          },
          { key: "Views/subscriber", value: ratio(d.total_views / d.total_subscribers) },
        ]);
      })
      .on("mousemove", (event: MouseEvent) => tip.move(event))
      .on("mouseleave", function (this: SVGCircleElement, _event: MouseEvent, d: Channel) {
        d3.select(this)
          .attr("fill", isFlagged(d) ? accent.negative : ink.dim)
          .attr("fill-opacity", isFlagged(d) ? 0.85 : 0.55);
        tip.hide();
      });

    g.selectAll("text.flag-label")
      .data(data.filter(isFlagged))
      .join("text")
      .attr("class", "flag-label")
      .attr("x", (d) => x(d.total_subscribers) + r(d.total_videos) + 6)
      .attr("y", (d) => y(d.total_views) + 4)
      .attr("fill", accent.negative)
      .style("font-size", "11px")
      .text((d) => d.channel_name);

    return () => tip.hide();
  }, [data, flagged]);

  return (
    <div className="w-full overflow-x-auto">
      <svg
        ref={ref}
        className="chart"
        role="img"
        aria-label={label}
        width="100%"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ display: "block", height: "auto", minWidth: 420 }}
      />
    </div>
  );
};

export default Scatter;
```

- [ ] **Step 3: Verify it type-checks**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/charts/StatBand.tsx src/components/charts/Scatter.tsx
git commit -m "feat: add StatBand and log-log Scatter primitives"
```

---

## Task 10: RoiTable and ChannelTable

**Files:**
- Create: `src/components/charts/RoiTable.tsx`, `src/components/ChannelTable.tsx`

- [ ] **Step 1: Create `src/components/charts/RoiTable.tsx`**

Eight of ten rows are otherwise a wall of similar seven-digit numbers, so net profit
carries an inline magnitude bar.

```tsx
import React from "react";
import type { RoiRow } from "@/lib/roi";
import { count, gbp, millions } from "@/lib/format";

const RoiTable: React.FC<{ rows: RoiRow[] }> = ({ rows }) => {
  const max = Math.max(...rows.map((r) => r.netProfit));

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-border-strong text-left">
            <th className="py-2 pr-4 font-medium text-ink-muted">Channel</th>
            <th className="py-2 pr-4 text-right font-medium text-ink-muted">Videos</th>
            <th className="py-2 pr-4 text-right font-medium text-ink-muted">Avg views</th>
            <th className="py-2 pr-4 text-right font-medium text-ink-muted">Units</th>
            <th className="py-2 pr-4 text-right font-medium text-ink-muted">Revenue</th>
            <th className="py-2 text-right font-medium text-ink-muted">Net profit</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.channel} className="border-b border-border last:border-0">
              <td
                className={`py-2.5 pr-4 ${index === 0 ? "font-medium text-ink" : "text-ink-muted"}`}
              >
                {row.channel}
              </td>
              <td className="py-2.5 pr-4 text-right tnum text-ink-muted">
                {count(row.videos)}
              </td>
              <td className="py-2.5 pr-4 text-right tnum text-ink-muted">
                {millions(row.avgViews)}
              </td>
              <td className="py-2.5 pr-4 text-right tnum text-ink-muted">
                {count(row.units)}
              </td>
              <td className="py-2.5 pr-4 text-right tnum text-ink-muted">
                {gbp(row.revenue)}
              </td>
              <td className="py-2.5 text-right">
                <div className="flex items-center justify-end gap-3">
                  <span
                    aria-hidden
                    className="hidden h-1.5 rounded-sm bg-positive sm:block"
                    style={{ width: `${Math.max(2, (row.netProfit / max) * 72)}px` }}
                  />
                  <span className="tnum font-medium text-positive">{gbp(row.netProfit)}</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RoiTable;
```

- [ ] **Step 2: Create `src/components/ChannelTable.tsx`**

```tsx
"use client";

import React, { useMemo, useState } from "react";
import type { Channel } from "@/lib/csv-loader";
import { METRICS, type MetricKey } from "@/lib/metrics";
import { count, millions, ratio } from "@/lib/format";

const COLUMNS: { key: MetricKey; label: string; format: (v: number) => string }[] = [
  { key: "subscribers", label: "Subscribers", format: millions },
  { key: "views", label: "Total views", format: count },
  { key: "videos", label: "Videos", format: count },
  { key: "avgViewsPerVideo", label: "Avg views/video", format: millions },
  { key: "viewsPerSubscriber", label: "Views/sub", format: ratio },
  { key: "engagementRate", label: "Subs/video", format: count },
];

const ChannelTable: React.FC<{ channels: Channel[] }> = ({ channels }) => {
  const [sort, setSort] = useState<MetricKey>("subscribers");

  const sorted = useMemo(() => {
    const accessor = METRICS[sort];
    return [...channels].sort((a, b) => accessor(b) - accessor(a));
  }, [channels, sort]);

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[760px] text-sm">
        <thead>
          <tr className="border-b border-border-strong text-left">
            <th className="py-2 pr-4 font-medium text-ink-muted">Channel</th>
            {COLUMNS.map((column) => (
              <th key={column.key} className="py-2 pr-4 text-right font-medium">
                <button
                  type="button"
                  onClick={() => setSort(column.key)}
                  className={`transition-colors hover:text-ink ${
                    sort === column.key ? "text-ink" : "text-ink-muted"
                  }`}
                >
                  {column.label}
                  {sort === column.key && " ↓"}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((channel) => (
            <tr key={channel.channel_name} className="border-b border-border last:border-0">
              <td className="py-2 pr-4 text-ink">{channel.channel_name}</td>
              {COLUMNS.map((column) => (
                <td
                  key={column.key}
                  className="py-2 pr-4 text-right tnum text-ink-muted"
                >
                  {column.format(METRICS[column.key](channel))}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ChannelTable;
```

- [ ] **Step 3: Verify it type-checks**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/charts/RoiTable.tsx src/components/ChannelTable.tsx
git commit -m "feat: add ROI table and sortable channel table"
```

---

## Task 11: Layout components

**Files:**
- Create: `src/components/Panel.tsx`, `src/components/Section.tsx`, `src/components/Nav.tsx`
- Create: `src/hooks/useChannels.ts`

- [ ] **Step 1: Create `src/components/Panel.tsx`**

```tsx
import React from "react";

interface PanelProps {
  title: string;
  note?: string;
  /** The written finding, shown beneath the chart. */
  finding?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const Panel: React.FC<PanelProps> = ({ title, note, finding, children, className = "" }) => (
  <section className={`card-flat flex flex-col ${className}`}>
    <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border px-5 py-4">
      <h3 className="text-[15px] font-medium tracking-[-0.01em] text-ink">{title}</h3>
      {note && <p className="text-xs text-ink-faint">{note}</p>}
    </header>
    <div className="flex-1 p-5">{children}</div>
    {finding && (
      <footer className="border-t border-border px-5 py-4">
        <p className="text-sm leading-relaxed text-ink-muted">{finding}</p>
      </footer>
    )}
  </section>
);

export default Panel;
```

- [ ] **Step 2: Create `src/components/Section.tsx`**

```tsx
import React from "react";

interface SectionProps {
  id: string;
  eyebrow: string;
  title: string;
  intro?: React.ReactNode;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ id, eyebrow, title, intro, children }) => (
  <section id={id} className="scroll-mt-20 py-14">
    <p className="eyebrow">{eyebrow}</p>
    <h2 className="mt-3 text-2xl font-medium tracking-[-0.02em] text-ink">{title}</h2>
    {intro && (
      <div className="mt-4 max-w-[68ch] text-sm leading-relaxed text-ink-muted">{intro}</div>
    )}
    <div className="mt-8">{children}</div>
  </section>
);

export default Section;
```

- [ ] **Step 3: Create `src/components/Nav.tsx`**

```tsx
"use client";

import React from "react";

const SECTIONS = [
  { id: "summary", label: "Summary" },
  { id: "reach", label: "Reach" },
  { id: "efficiency", label: "Efficiency" },
  { id: "roi", label: "Return" },
  { id: "corrections", label: "Corrections" },
  { id: "build", label: "How it was built" },
  { id: "method", label: "Method" },
];

const Nav: React.FC = () => (
  /* Opaque, not translucent: content scrolling underneath ghosted through at
     85%, and a shadowless hairline system has nothing to gain from blur. */
  <nav className="sticky top-0 z-40 border-b border-border bg-paper">
    <div className="mx-auto flex max-w-[1240px] items-center justify-between gap-6 px-6 py-3 lg:px-10">
      <ul className="flex flex-wrap items-center gap-x-5 gap-y-1">
        {SECTIONS.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              className="text-xs text-ink-muted transition-colors hover:text-ink"
            >
              {section.label}
            </a>
          </li>
        ))}
      </ul>
      <a
        href="https://github.com/Emmanuelbett67/top_UK_YouTubers_2024"
        target="_blank"
        rel="noreferrer"
        className="shrink-0 text-xs text-ink-muted transition-colors hover:text-ink"
      >
        Source ↗
      </a>
    </div>
  </nav>
);

export default Nav;
```

- [ ] **Step 4: Create `src/hooks/useChannels.ts`**

`basePath` does not rewrite `fetch` URLs, which is why `NEXT_PUBLIC_BASE_PATH` was exported
from `next.config.mjs` in Task 1. Without it the CSV 404s on Pages while working locally.

```ts
"use client";

import { useEffect, useState } from "react";
import { loadChannels, type Channel } from "@/lib/csv-loader";

const DATASET_URL = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/uk-youtubers-2024.csv`;

export function useChannels() {
  const [channels, setChannels] = useState<Channel[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadChannels(DATASET_URL)
      .then((rows) => {
        if (!cancelled) setChannels(rows);
      })
      .catch((cause: Error) => {
        if (!cancelled) setError(cause.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { channels, error };
}
```

- [ ] **Step 5: Verify it type-checks**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/Panel.tsx src/components/Section.tsx src/components/Nav.tsx src/hooks/useChannels.ts
git commit -m "feat: add layout components and dataset hook"
```

---

## Task 12: Data-driven sections

**Files:**
- Create: `src/components/sections/Masthead.tsx`, `Reach.tsx`, `Efficiency.tsx`, `Roi.tsx`

Formatter functions are declared at module scope so their identity is stable across
renders — see the note on `RankBar`'s `format` prop.

- [ ] **Step 1: Create `src/components/sections/Masthead.tsx`**

```tsx
import React from "react";

const FACTS: { term: string; detail: string }[] = [
  { term: "Records", detail: "100 channels" },
  { term: "Fields", detail: "4 (name, subscribers, views, videos)" },
  { term: "Source", detail: "Kaggle — Top 100 social media influencers 2024" },
  { term: "Extracted", detail: "2024 · single snapshot" },
];

const Masthead: React.FC = () => (
  <header className="border-b border-border py-16">
    <p className="eyebrow">Excel · SQL Server · Power BI · D3</p>
    <h1 className="mt-4 max-w-[20ch] text-4xl font-medium leading-[1.1] tracking-[-0.03em] text-ink">
      Top UK YouTubers 2024
    </h1>
    <p className="mt-5 max-w-[62ch] text-base leading-relaxed text-ink-muted">
      The Head of Marketing wants to know which UK YouTuber is worth a campaign. Reach is the
      easy part of that question and the least useful. This report ranks 100 channels by
      reach, then by efficiency, then by projected return — and the three orderings disagree.
    </p>
    <dl className="mt-10 grid grid-cols-1 gap-x-10 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
      {FACTS.map((fact) => (
        <div key={fact.term}>
          <dt className="eyebrow">{fact.term}</dt>
          <dd className="mt-1.5 text-sm text-ink">{fact.detail}</dd>
        </div>
      ))}
    </dl>
  </header>
);

export default Masthead;
```

- [ ] **Step 2: Create `src/components/sections/Reach.tsx`**

```tsx
"use client";

import React from "react";
import type { Channel } from "@/lib/csv-loader";
import { rankBy } from "@/lib/metrics";
import { billions, compact, count, millions } from "@/lib/format";
import Section from "@/components/Section";
import Panel from "@/components/Panel";
import RankBar from "@/components/charts/RankBar";

const subscribersFormat = (value: number) => millions(value);
const viewsFormat = (value: number) => billions(value);
const videosFormat = (value: number) => compact(value);

const Reach: React.FC<{ channels: Channel[] }> = ({ channels }) => (
  <Section
    id="reach"
    eyebrow="Questions 1–3"
    title="Reach"
    intro="Who is biggest, on the three raw counts the dataset actually contains."
  >
    <div className="grid gap-6">
      <Panel
        title="Most subscribers"
        note="Top 10"
        finding={
          <>
            NoCopyrightSounds leads on {millions(33_600_000)} subscribers. Hold this order in
            mind — it is the one that gets overturned by the time we reach projected return.
          </>
        }
      >
        <RankBar
          data={rankBy(channels, "subscribers", 10)}
          format={subscribersFormat}
          metricLabel="Subscribers"
          label="Top 10 UK channels by subscriber count"
        />
      </Panel>

      <Panel
        title="Most total views"
        note="Top 5"
        finding={
          <>
            DanTDM and Dan Rhodes are within {billions(1_220_000_000)} of each other, on very
            different video counts — {count(3705)} against {count(1664)}.
          </>
        }
      >
        <RankBar
          data={rankBy(channels, "views", 5)}
          format={viewsFormat}
          metricLabel="Total views"
          label="Top 5 UK channels by total views"
        />
      </Panel>

      <Panel
        title="Most videos uploaded"
        note="Top 5 · corrected"
        finding={
          <>
            Every channel here is a news broadcaster, and none of them appear in the
            project&rsquo;s original Power BI answer, which reported GRM Daily at{" "}
            {count(14_696)}. 24 News HD has uploaded {count(165_103)} — more than eleven times
            that. See{" "}
            <a href="#corrections" className="underline decoration-border-strong underline-offset-2 hover:text-ink">
              Corrections
            </a>
            .
          </>
        }
      >
        <RankBar
          data={rankBy(channels, "videos", 5)}
          format={videosFormat}
          metricLabel="Videos uploaded"
          label="Top 5 UK channels by videos uploaded"
        />
      </Panel>
    </div>
  </Section>
);

export default Reach;
```

- [ ] **Step 3: Create `src/components/sections/Efficiency.tsx`**

```tsx
"use client";

import React from "react";
import type { Channel } from "@/lib/csv-loader";
import { rankBy } from "@/lib/metrics";
import { count, millions, ratio } from "@/lib/format";
import Section from "@/components/Section";
import Panel from "@/components/Panel";
import RankBar from "@/components/charts/RankBar";
import Scatter from "@/components/charts/Scatter";

const millionsFormat = (value: number) => millions(value);
const ratioFormat = (value: number) => ratio(value);
const countFormat = (value: number) => count(value);

/** The two channels whose ratio leadership is a small-denominator artifact. */
const FLAGGED = ["Mark Ronson", "Jessie J"];

const Efficiency: React.FC<{ channels: Channel[] }> = ({ channels }) => (
  <Section
    id="efficiency"
    eyebrow="Questions 4–6"
    title="Efficiency"
    intro="Ratios reward channels that do more with less — and reward channels that have simply done very little even more."
  >
    <div className="grid gap-6">
      <Panel
        title="Highest average views per video"
        note="Top 5 · corrected"
        finding={
          <>
            Mark Ronson averages {millions(322_787_511)} views per video across{" "}
            {count(20)} videos. Jessie J, second, has {count(96)}. These are properties of the
            denominator more than the channel. The project&rsquo;s published figures for this
            metric are ten times too low; the DAX measure is correct, the transcribed table is
            not.
          </>
        }
      >
        <RankBar
          data={rankBy(channels, "avgViewsPerVideo", 5)}
          format={millionsFormat}
          metricLabel="Avg views per video"
          label="Top 5 UK channels by average views per video"
        />
      </Panel>

      <Panel
        title="Highest views per subscriber"
        note="Top 5"
        finding={
          <>
            GRM Daily returns {ratio(1185.79)} views per subscriber — a catalogue watched far
            beyond its subscriber base, which is a different kind of asset from a large
            following.
          </>
        }
      >
        <RankBar
          data={rankBy(channels, "viewsPerSubscriber", 5)}
          format={ratioFormat}
          metricLabel="Views per subscriber"
          label="Top 5 UK channels by views per subscriber"
        />
      </Panel>

      <Panel
        title="Highest subscriber engagement rate"
        note="Subscribers per video · top 5"
        finding={
          <>
            The same three channels lead as on average views per video, for the same reason:
            both metrics divide by video count.
          </>
        }
      >
        <RankBar
          data={rankBy(channels, "engagementRate", 5)}
          format={countFormat}
          metricLabel="Subscribers per video"
          label="Top 5 UK channels by subscribers per video"
        />
      </Panel>

      <Panel
        title="Where the ratio leaders actually sit"
        note="Log scales · radius = videos uploaded"
        finding={
          <>
            Both axes are logarithmic; the subscriber range spans two orders of magnitude and a
            linear axis would collapse most of the field into the corner. Radius is video
            count, which is the point: the two flagged channels are small circles, and every
            ratio they lead is a small number divided by a smaller one. This is why the return
            model below does not consider them.
          </>
        }
      >
        <Scatter
          data={channels}
          flagged={FLAGGED}
          label="Subscribers against total views for all 100 channels, log scales, radius by video count"
        />
      </Panel>
    </div>
  </Section>
);

export default Efficiency;
```

- [ ] **Step 4: Create `src/components/sections/Roi.tsx`**

```tsx
"use client";

import React from "react";
import type { Channel } from "@/lib/csv-loader";
import { DEFAULT_ASSUMPTIONS, roiRanking } from "@/lib/roi";
import { count, gbp, millions } from "@/lib/format";
import Section from "@/components/Section";
import Panel from "@/components/Panel";
import RoiTable from "@/components/charts/RoiTable";

const Roi: React.FC<{ channels: Channel[] }> = ({ channels }) => {
  const rows = roiRanking(channels, DEFAULT_ASSUMPTIONS);
  const [best, second, third] = rows;

  return (
    <Section
      id="roi"
      eyebrow="Recommendation"
      title="Which channel is worth the campaign"
      intro={
        <>
          Projected return per video campaign, over the ten largest channels by subscriber
          base — the criterion this project set for itself. Mark Ronson is not a candidate:
          at {millions(6_860_000)} subscribers he falls outside the ten, which is fortunate,
          because on {count(20)} videos this model would otherwise rank him first by a wide
          margin.
        </>
      }
    >
      <div className="grid gap-6">
        <Panel title="Assumptions" note="Illustrative, not quoted rates">
          <dl className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div>
              <dt className="eyebrow">Product price</dt>
              <dd className="stat-figure mt-2 text-ink">
                {gbp(DEFAULT_ASSUMPTIONS.productPrice)}
              </dd>
            </div>
            <div>
              <dt className="eyebrow">Conversion rate</dt>
              <dd className="stat-figure mt-2 text-ink">
                {DEFAULT_ASSUMPTIONS.conversionRate * 100}%
              </dd>
            </div>
            <div>
              <dt className="eyebrow">Campaign cost</dt>
              <dd className="stat-figure mt-2 text-ink">
                {gbp(DEFAULT_ASSUMPTIONS.campaignCost)}
              </dd>
            </div>
          </dl>
          <p className="mt-6 max-w-[68ch] text-sm leading-relaxed text-ink-muted">
            Units sold = average views per video × conversion rate. Revenue = units × product
            price. Net profit = revenue − campaign cost. All three inputs are assumptions
            rather than quoted rates, stated here so you can judge them instead of inheriting
            them.
          </p>
        </Panel>

        <Panel
          title="Projected return per campaign"
          note="Ranked by net profit"
          finding={
            <>
              {best.channel} projects {gbp(best.netProfit)} — {(best.netProfit / second.netProfit).toFixed(1)}×
              the runner-up. The qualification: at {count(best.videos)} videos she has much the
              smallest denominator in the candidate set ({second.channel} {count(second.videos)},{" "}
              {third.channel} {count(third.videos)}), so the effect that disqualifies Mark Ronson
              touches her too, in weaker form. The lead is large enough to survive it, but it is
              a lead built on a thinner base than it appears.
            </>
          }
        >
          <RoiTable rows={rows} />
        </Panel>

        <Panel
          title="Reach is not return"
          finding={
            <>
              NoCopyrightSounds leads the subscriber table and places sixth here. Ali-A is tenth
              on both. Subscriber count — the number every one of these channels is ranked by in
              public — turns out to be a poor guide to what a campaign is worth. That gap is the
              finding the original dashboard implied but never stated.
            </>
          }
        >
          <p className="max-w-[68ch] text-sm leading-relaxed text-ink-muted">
            Read the two orderings side by side: the subscriber ranking in{" "}
            <a href="#reach" className="underline decoration-border-strong underline-offset-2 hover:text-ink">
              Reach
            </a>{" "}
            against the profit ranking above.
          </p>
        </Panel>
      </div>
    </Section>
  );
};

export default Roi;
```

- [ ] **Step 5: Verify it type-checks**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/sections
git commit -m "feat: add masthead, reach, efficiency and ROI sections"
```

---

## Task 13: Prose sections

**Files:**
- Create: `src/components/sections/Corrections.tsx`, `HowItWasBuilt.tsx`, `Method.tsx`, `Footer.tsx`

No data logic — plain components.

- [ ] **Step 1: Create `src/components/sections/Corrections.tsx`**

```tsx
import React from "react";
import Section from "@/components/Section";

const CORRECTIONS: { title: string; body: React.ReactNode }[] = [
  {
    title: "Most videos uploaded is wrong, not merely imprecise",
    body: (
      <>
        The published answer is GRM Daily 14,696 · Manchester City 8,248 · Yogscast 6,435. The
        data gives 24 News HD 165,103 · Sky News 46,009 · BBC News عربي 40,179. GRM Daily is
        not close to first. Every channel in the correct top five is a news broadcaster and
        none appear in the original — the pattern indicates news channels were filtered out of
        the Power BI table.
      </>
    ),
  },
  {
    title: "Average views per video is ten times low throughout",
    body: (
      <>
        The published figures are 32.27M / 5.97M / 5.76M; the data gives 322.79M / 59.77M /
        57.62M. The ranking is right and every magnitude is off by one decimal place. The
        engagement-rate table computes correctly from the same two columns, so the data is
        sound — and the <code className="font-mono text-[13px]">Average Views per Video (M)</code>{" "}
        DAX measure is sound too, dividing by a million exactly once. The error is in the
        results table as transcribed, not in the model. The published measure and the published
        table disagree with each other.
      </>
    ),
  },
  {
    title: "Two channels are mislabelled",
    body: (
      <>
        The views-per-subscriber table names &ldquo;Nickelodeon&rdquo; and &ldquo;Disney Junior
        UK&rdquo;. The source names them &ldquo;Nickelodeon UK&rdquo; and &ldquo;Disney
        Kids&rdquo;. The values match to two decimal places, so this is a labelling slip rather
        than a computation error.
      </>
    ),
  },
];

const Corrections: React.FC = () => (
  <Section
    id="corrections"
    eyebrow="Provenance"
    title="Corrections to the original report"
    intro="Every figure on this page is recomputed in your browser from the source CSV. Three of the six answers the Power BI report published do not survive that recomputation. They are set out here rather than quietly replaced."
  >
    <ol className="grid gap-6 lg:grid-cols-3">
      {CORRECTIONS.map((correction, index) => (
        <li key={correction.title} className="card-flat p-5">
          <p className="eyebrow">Correction {index + 1}</p>
          <h3 className="mt-3 text-[15px] font-medium leading-snug tracking-[-0.01em] text-ink">
            {correction.title}
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">{correction.body}</p>
        </li>
      ))}
    </ol>
  </Section>
);

export default Corrections;
```

- [ ] **Step 2: Create `src/components/sections/HowItWasBuilt.tsx`**

The four quality-check screenshots and the dashboard GIF already exist in `assets/images/`.
They are referenced through `NEXT_PUBLIC_BASE_PATH` because `next/image` is disabled under
static export and plain `<img>` tags do not get `basePath` applied.

```tsx
import React from "react";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const TOOLS: { tool: string; purpose: string }[] = [
  { tool: "Excel", purpose: "Exploring the raw extract" },
  { tool: "SQL Server", purpose: "Cleaning, testing and shaping the data" },
  { tool: "Power BI", purpose: "The original interactive dashboard" },
  { tool: "Next.js + D3", purpose: "This report" },
];

const CHECKS: { label: string; image: string }[] = [
  { label: "Row count", image: "row_count_check.png" },
  { label: "Column count", image: "column_count_check.png" },
  { label: "Data types", image: "data_type_check.png" },
  { label: "Duplicates", image: "duplicate_count_check.png" },
];

const TRANSFORM_SQL = `CREATE VIEW view_uk_youtubers_2024 AS

SELECT
    CAST(SUBSTRING(NOMBRE, 1, CHARINDEX('@', NOMBRE) - 1) AS VARCHAR(100)) AS channel_name,
    total_subscribers,
    total_views,
    total_videos

FROM
    top_uk_youtubers_2024`;

const DAX = `Average Views per Video (M) =
VAR sumOfTotalViews = SUM(view_uk_youtubers_2024[total_views])
VAR sumOfTotalVideos = SUM(view_uk_youtubers_2024[total_videos])
VAR avgViewsPerVideo = DIVIDE(sumOfTotalViews, sumOfTotalVideos, BLANK())
VAR finalAvgViewsPerVideo = DIVIDE(avgViewsPerVideo, 1000000, BLANK())

RETURN finalAvgViewsPerVideo`;

const Code: React.FC<{ children: string }> = ({ children }) => (
  <pre className="overflow-x-auto rounded border border-border bg-muted p-4 font-mono text-[12.5px] leading-relaxed text-ink">
    <code>{children}</code>
  </pre>
);

const HowItWasBuilt: React.FC = () => (
  <section id="build" className="scroll-mt-20 py-14">
    <p className="eyebrow">Method</p>
    <h2 className="mt-3 text-2xl font-medium tracking-[-0.02em] text-ink">How it was built</h2>
    <div className="mt-4 max-w-[68ch] text-sm leading-relaxed text-ink-muted">
      A Kaggle extract into Excel, cleaned and tested in SQL Server, visualised in Power BI,
      and republished here as a browser-computed report.
    </div>

    <div className="mt-8 grid gap-6 lg:grid-cols-2">
      <div className="card-flat p-5">
        <h3 className="text-[15px] font-medium tracking-[-0.01em] text-ink">Tools</h3>
        <dl className="mt-4 divide-y divide-border">
          {TOOLS.map((entry) => (
            <div key={entry.tool} className="flex justify-between gap-6 py-2.5">
              <dt className="text-sm text-ink">{entry.tool}</dt>
              <dd className="text-right text-sm text-ink-muted">{entry.purpose}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="card-flat p-5">
        <h3 className="text-[15px] font-medium tracking-[-0.01em] text-ink">
          The transform, as a SQL view
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
          The source packed the channel name and its ID into one column, separated by{" "}
          <code className="font-mono text-[13px]">@</code>.
        </p>
        <div className="mt-4">
          <Code>{TRANSFORM_SQL}</Code>
        </div>
      </div>
    </div>

    <div className="mt-6 card-flat p-5">
      <h3 className="text-[15px] font-medium tracking-[-0.01em] text-ink">Data quality checks</h3>
      <p className="mt-3 max-w-[68ch] text-sm leading-relaxed text-ink-muted">
        Four checks ran against the view: row count, column count, data types, and duplicates.
        The same four constraints are asserted by this site&rsquo;s test suite, so a bad dataset
        fails the build rather than reaching a chart.
      </p>
      <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {CHECKS.map((check) => (
          <figure key={check.label}>
            <img
              src={`${BASE}/assets/images/${check.image}`}
              alt={`${check.label} check result`}
              className="w-full rounded border border-border"
            />
            <figcaption className="mt-2 text-xs text-ink-faint">{check.label}</figcaption>
          </figure>
        ))}
      </div>
    </div>

    <div className="mt-6 card-flat p-5">
      <h3 className="text-[15px] font-medium tracking-[-0.01em] text-ink">
        A DAX measure, and the table that disagreed with it
      </h3>
      <p className="mt-3 max-w-[68ch] text-sm leading-relaxed text-ink-muted">
        Six measures drove the dashboard. This one is worth reading closely: it is correct, and
        it returns 322.79 for Mark Ronson. The report published 32.27.
      </p>
      <div className="mt-4">
        <Code>{DAX}</Code>
      </div>
    </div>

    <figure className="mt-6 card-flat p-5">
      <h3 className="text-[15px] font-medium tracking-[-0.01em] text-ink">
        The original Power BI dashboard
      </h3>
      <img
        src={`${BASE}/assets/images/top_uk_youtubers_2024.gif`}
        alt="Animated walkthrough of the original Power BI dashboard"
        className="mt-4 w-full rounded border border-border"
      />
      <figcaption className="mt-3 text-sm leading-relaxed text-ink-muted">
        The deliverable this report was rebuilt from.
      </figcaption>
    </figure>
  </section>
);

export default HowItWasBuilt;
```

- [ ] **Step 3: Create `src/components/sections/Method.tsx`**

```tsx
import React from "react";
import Section from "@/components/Section";

const LIMITS: { title: string; body: string }[] = [
  {
    title: "Snapshot data",
    body: "A single 2024 extract with no time dimension. Nothing here supports a claim about growth, trend or momentum.",
  },
  {
    title: "Subscriber counts arrive pre-rounded",
    body: "The source reports 33.6M, not 33,600,000 exactly. Precision beyond three significant figures is not available, and every ratio built on these counts inherits that limit.",
  },
  {
    title: "Reach is measured; fit is not",
    body: "There are no likes, comments, watch times, audience demographics or content categories in this dataset. Whether a channel's audience matches a given product is unmeasurable here — and it is at least as important as reach.",
  },
  {
    title: "Ratio metrics are unstable at low video counts",
    body: "Below roughly 100 videos, average views per video describes the denominator more than the channel. Two channels in this dataset are affected badly enough to be flagged on the scatter.",
  },
  {
    title: "Lifetime averages, not recent performance",
    body: "Average views per video is a lifetime figure. A channel's next video is not its historical mean, and the return model treats it as though it were.",
  },
  {
    title: "The return figures are illustrative",
    body: "Product price, conversion rate and campaign cost are assumptions, not quoted rates. They are stated on the page so they can be argued with.",
  },
  {
    title: "Country is taken at face value",
    body: "Channels are included on the strength of the source's own 'Reino Unido' tag. It was not independently verified.",
  },
];

const Method: React.FC = () => (
  <Section
    id="method"
    eyebrow="Limitations"
    title="What this analysis cannot tell you"
    intro="Descriptive, not causal, and narrower than the dashboard makes it look."
  >
    <dl className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
      {LIMITS.map((limit) => (
        <div key={limit.title}>
          <dt className="text-sm font-medium text-ink">{limit.title}</dt>
          <dd className="mt-1.5 max-w-[52ch] text-sm leading-relaxed text-ink-muted">
            {limit.body}
          </dd>
        </div>
      ))}
    </dl>
  </Section>
);

export default Method;
```

- [ ] **Step 4: Create `src/components/sections/Footer.tsx`**

```tsx
import React from "react";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const Footer: React.FC = () => (
  <footer className="rule mt-8 flex flex-wrap items-baseline justify-between gap-x-8 gap-y-3 py-10">
    <p className="text-sm text-ink-muted">
      Emmanuel Bett · analysis and build. Figures computed in-browser from a 100-row Kaggle
      extract.
    </p>
    <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
      <li>
        <a
          href="https://github.com/Emmanuelbett67/top_UK_YouTubers_2024"
          target="_blank"
          rel="noreferrer"
          className="text-ink-muted transition-colors hover:text-ink"
        >
          Repository ↗
        </a>
      </li>
      <li>
        <a
          href={`${BASE}/assets/images/top_uk_youtubers_2024.pdf`}
          target="_blank"
          rel="noreferrer"
          className="text-ink-muted transition-colors hover:text-ink"
        >
          Power BI report (PDF) ↗
        </a>
      </li>
      <li>
        <a
          href={`${BASE}/uk-youtubers-2024.csv`}
          className="text-ink-muted transition-colors hover:text-ink"
        >
          Dataset (CSV)
        </a>
      </li>
    </ul>
  </footer>
);

export default Footer;
```

- [ ] **Step 5: Verify it type-checks**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/sections
git commit -m "feat: add corrections, build, method and footer sections"
```

---

## Task 14: Compose the page

**Files:**
- Modify: `src/app/page.tsx` (replace the Task 7 placeholder entirely)
- Create: `public/assets/images/` (copied build assets)

`assets/images/` sits outside `public/`, so static export will not emit it. The images are
copied into `public/` rather than moved, leaving the README's own image references intact.

- [ ] **Step 1: Copy the images the site references**

```bash
mkdir -p public/assets/images
cp assets/images/row_count_check.png assets/images/column_count_check.png assets/images/data_type_check.png assets/images/duplicate_count_check.png assets/images/top_uk_youtubers_2024.gif assets/images/top_uk_youtubers_2024.pdf public/assets/images/
```

- [ ] **Step 2: Replace `src/app/page.tsx`**

```tsx
"use client";

import React from "react";
import { useChannels } from "@/hooks/useChannels";
import { totals } from "@/lib/metrics";
import { billions, count, millions } from "@/lib/format";
import Nav from "@/components/Nav";
import Section from "@/components/Section";
import StatBand from "@/components/charts/StatBand";
import ChannelTable from "@/components/ChannelTable";
import Masthead from "@/components/sections/Masthead";
import Reach from "@/components/sections/Reach";
import Efficiency from "@/components/sections/Efficiency";
import Roi from "@/components/sections/Roi";
import Corrections from "@/components/sections/Corrections";
import HowItWasBuilt from "@/components/sections/HowItWasBuilt";
import Method from "@/components/sections/Method";
import Footer from "@/components/sections/Footer";

export default function Home() {
  const { channels, error } = useChannels();

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-[1240px] px-6 lg:px-10">
        <Masthead />

        {error && (
          <p className="py-16 text-sm text-negative">Could not load the dataset: {error}</p>
        )}

        {!channels && !error && (
          <p className="py-16 text-sm text-ink-muted">Loading dataset…</p>
        )}

        {channels && (
          <>
            <Section
              id="summary"
              eyebrow="Summary"
              title="The field, in four numbers"
              intro="Every figure below is computed in your browser from the 100-row dataset."
            >
              <StatBand
                stats={[
                  { label: "Channels", value: count(totals(channels).channels) },
                  {
                    label: "Subscribers",
                    value: millions(totals(channels).subscribers),
                    note: "combined",
                  },
                  { label: "Total views", value: billions(totals(channels).views) },
                  { label: "Videos", value: count(totals(channels).videos) },
                ]}
              />
            </Section>

            <Reach channels={channels} />
            <Efficiency channels={channels} />
            <Roi channels={channels} />
            <Corrections />
            <HowItWasBuilt />
            <Method />

            <Section
              id="data"
              eyebrow="Data"
              title="All 100 channels"
              intro="Sort by any column. Every chart above is a slice of this table."
            >
              <div className="card-flat p-5">
                <ChannelTable channels={channels} />
              </div>
            </Section>
          </>
        )}

        <Footer />
      </main>
    </>
  );
}
```

- [ ] **Step 3: Run the dev server and check every section renders**

```bash
npm run dev
```

Open `http://localhost:3000`. Confirm, in order:
- The masthead renders immediately, then "Loading dataset…" is replaced by the summary band
- Summary reads 100 · 1,055.5M · 471.21B · 463,545
- Reach panel 3 shows 24 News HD first, not GRM Daily
- Efficiency panel 1 shows Mark Ronson at 322.8M
- The scatter draws two brick-coloured labelled circles
- The ROI table leads with Dua Lipa at £5,712,343
- Every check screenshot and the dashboard GIF load
- Hovering a bar shows the dark tooltip and fades it out on leave

- [ ] **Step 4: Verify the production build**

```bash
npm run build
```

Expected: compiles, type-checks, writes `out/`.

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx public/assets
git commit -m "feat: compose the full report page"
```

---

## Task 15: Deploy workflow and README

**Files:**
- Create: `.github/workflows/gh-pages.deploy.yml`
- Modify: `README.md` (full rewrite)

- [ ] **Step 1: Create the workflow**

`npm test` runs before `npm run build`, so a dataset that violates its constraints fails the
deploy rather than shipping wrong numbers.

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "npm"
      - run: npm ci
      - run: npm test
      - run: npm run build
      - run: touch ./out/.nojekyll
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: ./out
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Rewrite `README.md`**

The existing README's table of contents promises six sections that were never written —
Validation, Discovery, Recommendations, Potential ROI, Potential Courses of Actions,
Conclusion. The file ends at an empty `## Validation` heading. The pipeline detail now lives
on the site, so the README becomes a front door and does not carry a contents list for
content held elsewhere.

Replace the entire file with:

```markdown
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
```

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/gh-pages.deploy.yml README.md
git commit -m "feat: add Pages deploy workflow, rewrite README as front door"
```

- [ ] **Step 4: Switch the Pages source**

This cannot be done from the repo. In GitHub → Settings → Pages, set **Source** to
**GitHub Actions**. Until this is changed, Pages keeps serving the old Jekyll build and the
workflow's deploy step fails.

---

## Task 16: Responsive verification and final check

**Files:** none — verification only.

- [ ] **Step 1: Full test suite**

```bash
npm test
```

Expected: PASS, 20 tests across three files.

- [ ] **Step 2: Lint**

```bash
npm run lint
```

Expected: no errors. Warnings about `<img>` over `next/image` are expected and correct —
`next/image` does not work under static export with `unoptimized` paths.

- [ ] **Step 3: Production build**

```bash
npm run build
```

Expected: compiles and type-checks, `out/` written.

- [ ] **Step 4: Serve the export and check the real artifact**

```bash
npx serve out
```

Open the served URL. This catches basePath and asset problems that `npm run dev` hides.

- [ ] **Step 5: Responsive check**

At 375px, 768px and 1440px, confirm:
- No horizontal scroll on `body` at any width
- Charts scroll inside their own container rather than overflowing the page
- The `StatBand` is 2 columns at 375px and 4 at 1440px
- Both tables scroll horizontally inside their wrapper
- The sticky nav wraps to two lines at 375px without overlapping content
- Tooltips flip to the left of the cursor near the right edge rather than clipping

- [ ] **Step 6: Commit any fixes**

```bash
git add -A
git commit -m "fix: responsive adjustments from 375/768/1440 check"
```

---

## Self-review notes

**Spec coverage:** Stack (Task 1) · dataset and its constraints (Tasks 2–3) · verified
figures (Task 4) · corrections (Tasks 4, 13) · small-denominator problem (Tasks 9, 12) ·
ROI model and assumptions (Tasks 5, 12) · recommendation with its qualification (Task 12) ·
all four primitives (Tasks 8–10) · `lib`/`charts`/panels boundary (file structure) · all
eleven page sections (Tasks 12–14) · method section (Task 13) · README rewrite and Jekyll
removal (Tasks 1, 15) · every test the spec names (Tasks 3–5, 16).

**Type consistency:** `Channel` (csv-loader) → `RankDatum`, `MetricKey`, `Totals` (metrics)
→ `RoiAssumptions`, `RoiRow` (roi). `METRICS` keys are referenced by `ChannelTable`,
`Scatter` and `roi.ts`; all six spellings match `MetricKey`. `RankBar` takes `format` and
`metricLabel` in every call site.

**Known deferrals:** reader-adjustable ROI inputs are out of scope per the spec. The Pages
source switch in Task 15 Step 4 is a manual GitHub settings change and cannot be automated
from the repo.

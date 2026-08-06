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
      <div className="card-flat min-w-0 p-5">
        <h3 className="text-[15px] font-medium tracking-[-0.01em] text-ink">Tools</h3>
        <dl className="mt-4 divide-y divide-border">
          {TOOLS.map((entry) => (
            <div key={entry.tool} className="flex justify-between gap-6 py-2.5">
              <dt className="text-sm text-ink">{entry.tool}</dt>
              <dd className="min-w-0 text-right text-sm text-ink-muted">{entry.purpose}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="card-flat min-w-0 p-5">
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

    <div className="mt-6 card-flat min-w-0 p-5">
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

    <div className="mt-6 card-flat min-w-0 p-5">
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

    <figure className="mt-6 card-flat min-w-0 p-5">
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

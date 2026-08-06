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

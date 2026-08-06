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

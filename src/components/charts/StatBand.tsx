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

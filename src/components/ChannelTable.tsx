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

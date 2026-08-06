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

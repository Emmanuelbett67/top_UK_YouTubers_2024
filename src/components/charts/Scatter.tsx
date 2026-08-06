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

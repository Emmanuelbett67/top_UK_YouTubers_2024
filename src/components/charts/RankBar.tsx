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

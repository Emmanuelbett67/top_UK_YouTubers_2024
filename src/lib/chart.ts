import * as d3 from "d3";

/*
 * The hex values below shadow the CSS custom properties in src/app/globals.css.
 * D3 writes SVG presentation attributes, which cannot read Tailwind classes, so
 * the tokens have to exist twice. THEY MUST BE CHANGED TOGETHER — nothing here
 * fails if they drift, the charts just quietly stop matching the page around them.
 */

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

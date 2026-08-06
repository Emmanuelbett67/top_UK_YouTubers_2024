import * as d3 from "d3";

const grouped = d3.format(",");

/** `463,545` */
export const count = (value: number) => grouped(Math.round(value));

/**
 * `£5,712,343` / `−£266,169` — netProfit in the ROI model runs negative for most
 * candidates at high campaign costs. `grouped` prefixes negatives with d3's minus
 * (U+2212), which would land *inside* the symbol as `£−266,169`; the sign belongs
 * to the number, so it is pulled in front of the `£` instead.
 */
export const gbp = (value: number) => {
  const formatted = grouped(Math.round(value));
  return formatted.startsWith("−") ? `−£${formatted.slice(1)}` : `£${formatted}`;
};

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

/**
 * `£5.7M` / `−£266.2k` — ROI figures run to seven digits and the axis cannot hold
 * them. Same sign fix as `gbp`: `compact` embeds the minus before the digits, so
 * it is relocated in front of the `£` rather than trapped inside it.
 */
export const compactGbp = (value: number) => {
  const formatted = compact(value);
  return formatted.startsWith("−") ? `−£${formatted.slice(1)}` : `£${formatted}`;
};

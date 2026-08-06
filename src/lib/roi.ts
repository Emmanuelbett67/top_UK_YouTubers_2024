import type { Channel } from "./csv-loader";
import { METRICS, rankBy } from "./metrics";

export interface RoiAssumptions {
  /** GBP earned per unit sold. */
  productPrice: number;
  /** Fraction of viewers who buy, 0–1. */
  conversionRate: number;
  /** GBP, one-off, per video campaign. */
  campaignCost: number;
}

/**
 * Illustrative, not quoted rates. Shown on the page as inputs so the reader can
 * judge them rather than inherit them.
 */
export const DEFAULT_ASSUMPTIONS: RoiAssumptions = {
  productPrice: 5,
  conversionRate: 0.02,
  campaignCost: 50_000,
};

/**
 * Candidates are the top 10 by subscriber base — the README's own stated criterion.
 * It also excludes channels whose ratio metrics are small-denominator artifacts:
 * Mark Ronson leads average views per video on 20 videos and would otherwise rank
 * first here.
 */
export const CANDIDATE_COUNT = 10;

export interface RoiRow {
  channel: string;
  videos: number;
  avgViews: number;
  units: number;
  revenue: number;
  netProfit: number;
}

/**
 * `avgViews` is a lifetime mean — total views divided by total videos over a
 * channel's whole history — not a forecast of what a new sponsored video would get.
 * A channel with one old viral hit projects the same inflated figure as one
 * performing consistently today, and this model cannot tell the two apart.
 */
export function roiRanking(
  channels: Channel[],
  assumptions: RoiAssumptions = DEFAULT_ASSUMPTIONS,
  candidateCount: number = CANDIDATE_COUNT
): RoiRow[] {
  const { productPrice, conversionRate, campaignCost } = assumptions;

  return rankBy(channels, "subscribers", candidateCount)
    .map(({ channel }) => {
      const avgViews = METRICS.avgViewsPerVideo(channel);
      const units = avgViews * conversionRate;
      const revenue = units * productPrice;

      return {
        channel: channel.channel_name,
        videos: channel.total_videos,
        avgViews,
        units,
        revenue,
        netProfit: revenue - campaignCost,
      };
    })
    .sort((a, b) => b.netProfit - a.netProfit);
}

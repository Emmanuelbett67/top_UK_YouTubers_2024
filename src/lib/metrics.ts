import type { Channel } from "./csv-loader";

export type MetricKey =
  | "subscribers"
  | "views"
  | "videos"
  | "avgViewsPerVideo"
  | "viewsPerSubscriber"
  | "engagementRate";

/**
 * Every ranked panel on the site is one of these accessors plus a top-N. Adding a
 * question means adding an entry here, not writing a chart.
 */
export const METRICS: Record<MetricKey, (channel: Channel) => number> = {
  subscribers: (c) => c.total_subscribers,
  views: (c) => c.total_views,
  videos: (c) => c.total_videos,
  avgViewsPerVideo: (c) => c.total_views / c.total_videos,
  viewsPerSubscriber: (c) => c.total_views / c.total_subscribers,
  engagementRate: (c) => c.total_subscribers / c.total_videos,
};

export interface RankDatum {
  label: string;
  value: number;
  /** The source row, so a tooltip can show the figures behind a ratio. */
  channel: Channel;
}

export function rankBy(
  channels: Channel[],
  metric: MetricKey,
  topN: number
): RankDatum[] {
  const accessor = METRICS[metric];
  return [...channels]
    .sort((a, b) => accessor(b) - accessor(a))
    .slice(0, topN)
    .map((channel) => ({
      label: channel.channel_name,
      value: accessor(channel),
      channel,
    }));
}

export interface Totals {
  channels: number;
  subscribers: number;
  views: number;
  videos: number;
}

const sum = (channels: Channel[], accessor: (c: Channel) => number) =>
  channels.reduce((total, channel) => total + accessor(channel), 0);

export function totals(channels: Channel[]): Totals {
  return {
    channels: channels.length,
    subscribers: sum(channels, METRICS.subscribers),
    views: sum(channels, METRICS.views),
    videos: sum(channels, METRICS.videos),
  };
}

import Papa from "papaparse";

/** The site's entire data model. Everything else is derived from these four fields. */
export interface Channel {
  channel_name: string;
  total_subscribers: number;
  total_views: number;
  total_videos: number;
}

export const EXPECTED_ROWS = 100;

type RawRow = Record<string, string | number | null>;

export function parseChannels(csvText: string): Channel[] {
  const { data } = Papa.parse<RawRow>(csvText, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
  });

  const channels = data
    .filter((row) => row && typeof row.channel_name === "string")
    .map((row) => ({
      channel_name: String(row.channel_name).trim(),
      total_subscribers: Number(row.total_subscribers),
      total_views: Number(row.total_views),
      total_videos: Number(row.total_videos),
    }));

  // A short read — a truncated fetch, a bad deploy — would otherwise render as
  // plausible-looking charts computed over partial data.
  if (channels.length !== EXPECTED_ROWS) {
    throw new Error(`Expected ${EXPECTED_ROWS} rows, parsed ${channels.length}`);
  }

  return channels;
}

export const loadChannels = (csvUrl: string): Promise<Channel[]> =>
  fetch(csvUrl)
    .then((response) => {
      if (!response.ok) throw new Error(`Failed to load dataset (${response.status})`);
      return response.text();
    })
    .then(parseChannels);

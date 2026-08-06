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

  const rows = data.filter((row) => row && typeof row.channel_name === "string");

  // A short read — a truncated fetch, a bad deploy — would otherwise render as
  // plausible-looking charts computed over partial data.
  if (rows.length !== EXPECTED_ROWS) {
    throw new Error(`Expected ${EXPECTED_ROWS} rows, parsed ${rows.length}`);
  }

  // Row count alone doesn't guarantee the numeric fields are numbers. This must
  // run on papaparse's raw dynamicTyping output, before any Number(...) coercion
  // touches it — coercion is exactly what hides the problem. A text artifact
  // like "N/A" survives dynamicTyping as a string, and Number("N/A") is NaN,
  // which a downstream isFinite check would catch anyway. But a blank cell
  // survives dynamicTyping as null, and Number(null) is 0 — a legitimate-looking
  // figure a reader would never catch by eye. Number.isFinite, unlike the
  // coercing global isFinite(), rejects non-number types outright (including
  // null and strings) as well as NaN and Infinity, so checking it against the
  // raw value catches both failure modes.
  const numericFields = ["total_subscribers", "total_views", "total_videos"] as const;
  for (const row of rows) {
    for (const field of numericFields) {
      if (!Number.isFinite(row[field])) {
        throw new Error(
          `Expected a finite number for "${field}" on channel "${String(row.channel_name).trim()}", got ${JSON.stringify(row[field])}`
        );
      }
    }
  }

  const channels = rows.map((row) => ({
    channel_name: String(row.channel_name).trim(),
    total_subscribers: row.total_subscribers as number,
    total_views: row.total_views as number,
    total_videos: row.total_videos as number,
  }));

  return channels;
}

export const loadChannels = (csvUrl: string): Promise<Channel[]> =>
  fetch(csvUrl)
    .then((response) => {
      if (!response.ok) throw new Error(`Failed to load dataset (${response.status})`);
      return response.text();
    })
    .then(parseChannels);

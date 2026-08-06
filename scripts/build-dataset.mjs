// Regenerates public/uk-youtubers-2024.csv from the raw Kaggle-derived extract.
// Run: npm run data
import { readFileSync, writeFileSync } from "node:fs";
import Papa from "papaparse";

const SOURCE = "assets/Datasets/youtube_data_from_python.csv";
const TARGET = "public/uk-youtubers-2024.csv";
const COLUMNS = ["channel_name", "total_subscribers", "total_views", "total_videos"];
const NUMERIC_COLUMNS = COLUMNS.slice(1);

const { data } = Papa.parse(readFileSync(SOURCE, "utf8"), {
  header: true,
  skipEmptyLines: true,
});

const rows = data
  .filter((row) => (row.channel_name ?? "").trim() !== "")
  .map((row) => ({
    channel_name: row.channel_name.trim(),
    total_subscribers: Number(row.total_subscribers),
    total_views: Number(row.total_views),
    total_videos: Number(row.total_videos),
    // Keep the raw strings around only for validation below; Number("") is 0,
    // not NaN, so a blank cell would otherwise sail past Number.isFinite and
    // ship as a silently wrong 0 on a chart.
    _raw: row,
  }));

// These are the dataset's stated constraints. A silent violation would show up as a
// wrong figure on a chart, which is far harder to notice than a failed build.
if (rows.length !== 100) {
  throw new Error(`Expected 100 rows, got ${rows.length}`);
}
if (new Set(rows.map((r) => r.channel_name)).size !== rows.length) {
  throw new Error("Duplicate channel names in source");
}
for (const row of rows) {
  for (const column of NUMERIC_COLUMNS) {
    const raw = (row._raw[column] ?? "").toString().trim();
    if (raw === "") {
      throw new Error(`${row.channel_name}: missing ${column}`);
    }
    if (!Number.isFinite(row[column])) {
      throw new Error(`${row.channel_name}: ${column} is not a number (got "${raw}")`);
    }
  }
  // Three of the six metrics divide by total_videos, one divides by
  // total_subscribers. A zero in either would surface as Infinity on a chart.
  if (row.total_videos === 0) throw new Error(`${row.channel_name}: zero videos`);
  if (row.total_subscribers === 0) {
    throw new Error(`${row.channel_name}: zero subscribers`);
  }
}

writeFileSync(
  TARGET,
  Papa.unparse(rows, { columns: COLUMNS, newline: "\n" }) + "\n",
  "utf8"
);
console.log(`Wrote ${rows.length} rows to ${TARGET}`);

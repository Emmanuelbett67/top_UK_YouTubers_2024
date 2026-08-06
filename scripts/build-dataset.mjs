// Regenerates public/uk-youtubers-2024.csv from the raw Kaggle-derived extract.
// Run: npm run data
import { readFileSync, writeFileSync } from "node:fs";
import Papa from "papaparse";

const SOURCE = "assets/Datasets/youtube_data_from_python.csv";
const TARGET = "public/uk-youtubers-2024.csv";
const COLUMNS = ["channel_name", "total_subscribers", "total_views", "total_videos"];

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
  for (const column of COLUMNS.slice(1)) {
    if (!Number.isFinite(row[column])) throw new Error(`${row.channel_name}: bad ${column}`);
  }
  // Three of the six metrics divide by this.
  if (row.total_videos === 0) throw new Error(`${row.channel_name}: zero videos`);
}

writeFileSync(TARGET, Papa.unparse(rows, { columns: COLUMNS }) + "\n", "utf8");
console.log(`Wrote ${rows.length} rows to ${TARGET}`);

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { parseChannels } from "./csv-loader";

const csv = readFileSync(
  path.resolve(process.cwd(), "public/uk-youtubers-2024.csv"),
  "utf8"
);

describe("parseChannels", () => {
  const channels = parseChannels(csv);

  it("parses every row of the dataset", () => {
    expect(channels).toHaveLength(100);
  });

  it("types all four columns", () => {
    const [first] = channels;
    expect(first.channel_name).toBe("NoCopyrightSounds");
    expect(first.total_subscribers).toBe(33_600_000);
    expect(first.total_views).toBe(11_011_230_785);
    expect(first.total_videos).toBe(1591);
  });

  it("has unique channel names", () => {
    const names = new Set(channels.map((c) => c.channel_name));
    expect(names.size).toBe(100);
  });

  it("has no zero-video channels, which would divide by zero", () => {
    expect(channels.filter((c) => c.total_videos === 0)).toEqual([]);
  });

  it("preserves non-latin channel names", () => {
    expect(channels.map((c) => c.channel_name)).toContain("BBC News عربي");
  });

  it("rejects a dataset that is not 100 rows", () => {
    const truncated = csv.split("\n").slice(0, 5).join("\n");
    expect(() => parseChannels(truncated)).toThrow(/100 rows/);
  });

  it("rejects a numeric cell that contains non-numeric text", () => {
    const lines = csv.split("\n");
    // Row 1 is the first data row (NoCopyrightSounds). Corrupt total_subscribers
    // in place so the row count stays at 100 and only the field guard can fire.
    const fields = lines[1].split(",");
    fields[1] = "N/A";
    lines[1] = fields.join(",");
    const malformed = lines.join("\n");

    const dataRowCount = malformed
      .split("\n")
      .slice(1)
      .filter((line) => line.trim().length > 0).length;
    expect(dataRowCount).toBe(100);

    expect(() => parseChannels(malformed)).toThrow(
      /NoCopyrightSounds/
    );
    expect(() => parseChannels(malformed)).toThrow(/total_subscribers/);
  });

  it("rejects a blank numeric cell instead of silently coercing it to 0", () => {
    const lines = csv.split("\n");
    const fields = lines[1].split(",");
    fields[3] = ""; // blank total_videos
    lines[1] = fields.join(",");
    const malformed = lines.join("\n");

    const dataRowCount = malformed
      .split("\n")
      .slice(1)
      .filter((line) => line.trim().length > 0).length;
    expect(dataRowCount).toBe(100);

    expect(() => parseChannels(malformed)).toThrow(/total_videos/);
    expect(() => parseChannels(malformed)).toThrow(/NoCopyrightSounds/);
  });
});

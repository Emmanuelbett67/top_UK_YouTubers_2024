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
});

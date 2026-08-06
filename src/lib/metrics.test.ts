import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { parseChannels } from "./csv-loader";
import { rankBy, totals } from "./metrics";

const channels = parseChannels(
  readFileSync(path.resolve(process.cwd(), "public/uk-youtubers-2024.csv"), "utf8")
);

const names = (metric: Parameters<typeof rankBy>[1], n: number) =>
  rankBy(channels, metric, n).map((d) => d.label);

describe("totals", () => {
  it("sums the dataset", () => {
    const t = totals(channels);
    expect(t.channels).toBe(100);
    expect(t.subscribers).toBe(1_055_540_000);
    expect(t.views).toBe(471_205_591_517);
    expect(t.videos).toBe(463_545);
  });
});

describe("rankBy", () => {
  it("ranks the top 10 by subscribers", () => {
    expect(names("subscribers", 10)).toEqual([
      "NoCopyrightSounds",
      "DanTDM",
      "Dan Rhodes",
      "Miss Katy",
      "Mister Max",
      "KSI",
      "Jelly",
      "Dua Lipa",
      "Sidemen",
      "Ali-A",
    ]);
  });

  it("ranks by total views", () => {
    expect(names("views", 3)).toEqual(["DanTDM", "Dan Rhodes", "Mister Max"]);
  });

  // The README says GRM Daily 14,696. It is not close. News channels appear to have
  // been filtered out of the Power BI table; this test pins the corrected answer.
  it("ranks by videos uploaded, including news channels", () => {
    expect(names("videos", 3)).toEqual(["24 News HD", "Sky News", "BBC News عربي"]);
  });

  // The README's figures for this metric are uniformly 10x low.
  it("ranks by average views per video", () => {
    const top = rankBy(channels, "avgViewsPerVideo", 3);
    expect(top.map((d) => d.label)).toEqual(["Mark Ronson", "Jessie J", "Dua Lipa"]);
    expect(top[0].value / 1e6).toBeCloseTo(322.79, 2);
    expect(top[1].value / 1e6).toBeCloseTo(59.77, 2);
  });

  it("ranks by views per subscriber", () => {
    const top = rankBy(channels, "viewsPerSubscriber", 3);
    expect(top.map((d) => d.label)).toEqual([
      "GRM Daily",
      "Nickelodeon UK",
      "Disney Kids",
    ]);
    expect(top[0].value).toBeCloseTo(1185.79, 2);
  });

  it("ranks by subscriber engagement rate", () => {
    const top = rankBy(channels, "engagementRate", 3);
    expect(top.map((d) => d.label)).toEqual(["Mark Ronson", "Jessie J", "Dua Lipa"]);
    expect(top[0].value).toBeCloseTo(343_000, 0);
  });

  it("carries the source channel through, so panels can show context", () => {
    const [first] = rankBy(channels, "avgViewsPerVideo", 1);
    // The small-denominator problem the scatter panel exists to expose.
    expect(first.channel.total_videos).toBe(20);
  });

  it("does not mutate its input", () => {
    const before = channels.map((c) => c.channel_name);
    rankBy(channels, "views", 5);
    expect(channels.map((c) => c.channel_name)).toEqual(before);
  });
});

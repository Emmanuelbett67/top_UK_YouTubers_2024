import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { parseChannels } from "./csv-loader";
import { DEFAULT_ASSUMPTIONS, roiRanking } from "./roi";

const channels = parseChannels(
  readFileSync(path.resolve(process.cwd(), "public/uk-youtubers-2024.csv"), "utf8")
);

describe("roiRanking", () => {
  const rows = roiRanking(channels, DEFAULT_ASSUMPTIONS);

  it("considers exactly the top 10 by subscribers", () => {
    expect(rows).toHaveLength(10);
    expect(rows.map((r) => r.channel).sort()).toEqual(
      [
        "Ali-A",
        "Dan Rhodes",
        "DanTDM",
        "Dua Lipa",
        "Jelly",
        "KSI",
        "Miss Katy",
        "Mister Max",
        "NoCopyrightSounds",
        "Sidemen",
      ].sort()
    );
  });

  // Mark Ronson tops both ratio metrics on 20 videos. He must not reach the ranking:
  // at 6.86M subscribers he is outside the candidate set by construction.
  it("excludes the small-denominator outlier", () => {
    expect(rows.map((r) => r.channel)).not.toContain("Mark Ronson");
  });

  it("ranks by net profit descending", () => {
    const profits = rows.map((r) => r.netProfit);
    expect(profits).toEqual([...profits].sort((a, b) => b - a));
    expect(rows[0].channel).toBe("Dua Lipa");
    expect(rows[0].netProfit).toBeCloseTo(5_712_343, 0);
    expect(rows[1].channel).toBe("Sidemen");
    expect(rows[1].netProfit).toBeCloseTo(1_683_831, 0);
    expect(rows[9].channel).toBe("Ali-A");
    expect(rows[9].netProfit).toBeCloseTo(100_002, 0);
  });

  it("applies the formula, not a memorised table", () => {
    // Assumptions deliberately different from the defaults: if the model were
    // hardcoded to the shipped figures, this would not move. avgViews is anchored
    // to a figure computed independently from the raw channels array — not just
    // cross-checked against other fields on the same returned row — so an
    // implementation that invented a self-consistent avgViews, or ignored
    // `channels` entirely, cannot pass this.
    const custom = { productPrice: 10, conversionRate: 0.01, campaignCost: 0 };
    const [top] = roiRanking(channels, custom);

    expect(top.channel).toBe("Dua Lipa");
    const source = channels.find((c) => c.channel_name === "Dua Lipa")!;
    const expectedAvgViews = source.total_views / source.total_videos;
    expect(top.avgViews).toBeCloseTo(expectedAvgViews, 6);

    expect(top.units).toBeCloseTo(top.avgViews * 0.01, 6);
    expect(top.revenue).toBeCloseTo(top.units * 10, 6);
    expect(top.netProfit).toBeCloseTo(top.revenue, 6);
  });

  it("lets the campaign cost change which candidates are viable", () => {
    // At £1M, five of the ten still clear. At £2M only Dua Lipa does — her revenue is
    // £5.76M against a runner-up on £1.73M.
    const expensive = { ...DEFAULT_ASSUMPTIONS, campaignCost: 2_000_000 };
    const viable = roiRanking(channels, expensive).filter((r) => r.netProfit > 0);
    expect(viable.map((r) => r.channel)).toEqual(["Dua Lipa"]);
  });

  it("honours an explicit candidateCount", () => {
    // With only the top 3 by subscribers in play (NoCopyrightSounds, DanTDM,
    // Dan Rhodes), net profit under the default assumptions ranks Dan Rhodes
    // first (avg views/video 11,153,151 -> ~£1,065,315), then NoCopyrightSounds
    // (~6,920,950 -> ~£642,095), then DanTDM (~5,337,639 -> ~£483,764).
    const top3 = roiRanking(channels, DEFAULT_ASSUMPTIONS, 3);
    expect(top3).toHaveLength(3);
    expect(top3.map((r) => r.channel)).toEqual(["Dan Rhodes", "NoCopyrightSounds", "DanTDM"]);
  });
});

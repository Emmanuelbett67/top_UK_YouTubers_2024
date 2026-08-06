"use client";

import React from "react";
import type { Channel } from "@/lib/csv-loader";
import { DEFAULT_ASSUMPTIONS, roiRanking } from "@/lib/roi";
import { count, gbp, millions } from "@/lib/format";
import Section from "@/components/Section";
import Panel from "@/components/Panel";
import RoiTable from "@/components/charts/RoiTable";

const Roi: React.FC<{ channels: Channel[] }> = ({ channels }) => {
  const rows = roiRanking(channels, DEFAULT_ASSUMPTIONS);
  const [best, second, third] = rows;

  return (
    <Section
      id="roi"
      eyebrow="Recommendation"
      title="Which channel is worth the campaign"
      intro={
        <>
          Projected return per video campaign, over the ten largest channels by subscriber
          base — the criterion this project set for itself. Mark Ronson is not a candidate:
          at {millions(6_860_000)} subscribers he falls outside the ten, which is fortunate,
          because on {count(20)} videos this model would otherwise rank him first by a wide
          margin.
        </>
      }
    >
      <div className="grid gap-6">
        <Panel title="Assumptions" note="Illustrative, not quoted rates">
          <dl className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div>
              <dt className="eyebrow">Product price</dt>
              <dd className="stat-figure mt-2 text-ink">
                {gbp(DEFAULT_ASSUMPTIONS.productPrice)}
              </dd>
            </div>
            <div>
              <dt className="eyebrow">Conversion rate</dt>
              <dd className="stat-figure mt-2 text-ink">
                {DEFAULT_ASSUMPTIONS.conversionRate * 100}%
              </dd>
            </div>
            <div>
              <dt className="eyebrow">Campaign cost</dt>
              <dd className="stat-figure mt-2 text-ink">
                {gbp(DEFAULT_ASSUMPTIONS.campaignCost)}
              </dd>
            </div>
          </dl>
          <p className="mt-6 max-w-[68ch] text-sm leading-relaxed text-ink-muted">
            Units sold = average views per video × conversion rate. Revenue = units × product
            price. Net profit = revenue − campaign cost. All three inputs are assumptions
            rather than quoted rates, stated here so you can judge them instead of inheriting
            them.
          </p>
        </Panel>

        <Panel
          title="Projected return per campaign"
          note="Ranked by net profit"
          finding={
            <>
              {best.channel} projects {gbp(best.netProfit)} — {(best.netProfit / second.netProfit).toFixed(1)}×
              the runner-up. The qualification: at {count(best.videos)} videos she has much the
              smallest denominator in the candidate set ({second.channel} {count(second.videos)},{" "}
              {third.channel} {count(third.videos)}), so the effect that disqualifies Mark Ronson
              touches her too, in weaker form. The lead is large enough to survive it, but it is
              a lead built on a thinner base than it appears.
            </>
          }
        >
          <RoiTable rows={rows} />
        </Panel>

        <Panel
          title="Reach is not return"
          finding={
            <>
              NoCopyrightSounds leads the subscriber table and places sixth here. Ali-A is tenth
              on both. Subscriber count — the number every one of these channels is ranked by in
              public — turns out to be a poor guide to what a campaign is worth. That gap is the
              finding the original dashboard implied but never stated.
            </>
          }
        >
          <p className="max-w-[68ch] text-sm leading-relaxed text-ink-muted">
            Read the two orderings side by side: the subscriber ranking in{" "}
            <a href="#reach" className="underline decoration-border-strong underline-offset-2 hover:text-ink">
              Reach
            </a>{" "}
            against the profit ranking above.
          </p>
        </Panel>
      </div>
    </Section>
  );
};

export default Roi;

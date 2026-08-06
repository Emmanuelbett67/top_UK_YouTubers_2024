"use client";

import React from "react";
import type { Channel } from "@/lib/csv-loader";
import { rankBy } from "@/lib/metrics";
import { count, millions, ratio } from "@/lib/format";
import Section from "@/components/Section";
import Panel from "@/components/Panel";
import RankBar from "@/components/charts/RankBar";
import Scatter from "@/components/charts/Scatter";

const millionsFormat = (value: number) => millions(value);
const ratioFormat = (value: number) => ratio(value);
const countFormat = (value: number) => count(value);

/** The two channels whose ratio leadership is a small-denominator artifact. */
const FLAGGED = ["Mark Ronson", "Jessie J"];

const Efficiency: React.FC<{ channels: Channel[] }> = ({ channels }) => (
  <Section
    id="efficiency"
    eyebrow="Questions 4–6"
    title="Efficiency"
    intro="Ratios reward channels that do more with less — and reward channels that have simply done very little even more."
  >
    <div className="grid gap-6">
      <Panel
        title="Highest average views per video"
        note="Top 5 · corrected"
        finding={
          <>
            Mark Ronson averages {millions(322_787_511)} views per video across{" "}
            {count(20)} videos. Jessie J, second, has {count(96)}. These are properties of the
            denominator more than the channel. The project&rsquo;s published figures for this
            metric are ten times too low; the DAX measure is correct, the transcribed table is
            not.
          </>
        }
      >
        <RankBar
          data={rankBy(channels, "avgViewsPerVideo", 5)}
          format={millionsFormat}
          metricLabel="Avg views per video"
          label="Top 5 UK channels by average views per video"
        />
      </Panel>

      <Panel
        title="Highest views per subscriber"
        note="Top 5"
        finding={
          <>
            GRM Daily returns {ratio(1185.79)} views per subscriber — a catalogue watched far
            beyond its subscriber base, which is a different kind of asset from a large
            following.
          </>
        }
      >
        <RankBar
          data={rankBy(channels, "viewsPerSubscriber", 5)}
          format={ratioFormat}
          metricLabel="Views per subscriber"
          label="Top 5 UK channels by views per subscriber"
        />
      </Panel>

      <Panel
        title="Highest subscriber engagement rate"
        note="Subscribers per video · top 5"
        finding={
          <>
            The same three channels lead as on average views per video, for the same reason:
            both metrics divide by video count.
          </>
        }
      >
        <RankBar
          data={rankBy(channels, "engagementRate", 5)}
          format={countFormat}
          metricLabel="Subscribers per video"
          label="Top 5 UK channels by subscribers per video"
        />
      </Panel>

      <Panel
        title="Where the ratio leaders actually sit"
        note="Log scales · radius = videos uploaded"
        finding={
          <>
            Both axes are logarithmic; the subscriber range spans two orders of magnitude and a
            linear axis would collapse most of the field into the corner. Radius is video
            count, which is the point: the two flagged channels are small circles, and every
            ratio they lead is a small number divided by a smaller one. This is why the return
            model below does not consider them.
          </>
        }
      >
        <Scatter
          data={channels}
          flagged={FLAGGED}
          label="Subscribers against total views for all 100 channels, log scales, radius by video count"
        />
      </Panel>
    </div>
  </Section>
);

export default Efficiency;

"use client";

import React from "react";
import type { Channel } from "@/lib/csv-loader";
import { rankBy } from "@/lib/metrics";
import { billions, compact, count, millions } from "@/lib/format";
import Section from "@/components/Section";
import Panel from "@/components/Panel";
import RankBar from "@/components/charts/RankBar";

const subscribersFormat = (value: number) => millions(value);
const viewsFormat = (value: number) => billions(value);
const videosFormat = (value: number) => compact(value);

const Reach: React.FC<{ channels: Channel[] }> = ({ channels }) => (
  <Section
    id="reach"
    eyebrow="Questions 1–3"
    title="Reach"
    intro="Who is biggest, on the three raw counts the dataset actually contains."
  >
    <div className="grid gap-6">
      <Panel
        title="Most subscribers"
        note="Top 10"
        finding={
          <>
            NoCopyrightSounds leads on {millions(33_600_000)} subscribers. Hold this order in
            mind — it is the one that gets overturned by the time we reach projected return.
          </>
        }
      >
        <RankBar
          data={rankBy(channels, "subscribers", 10)}
          format={subscribersFormat}
          metricLabel="Subscribers"
          label="Top 10 UK channels by subscriber count"
        />
      </Panel>

      <Panel
        title="Most total views"
        note="Top 5"
        finding={
          <>
            DanTDM and Dan Rhodes are within {billions(1_220_000_000)} of each other, on very
            different video counts — {count(3705)} against {count(1664)}.
          </>
        }
      >
        <RankBar
          data={rankBy(channels, "views", 5)}
          format={viewsFormat}
          metricLabel="Total views"
          label="Top 5 UK channels by total views"
        />
      </Panel>

      <Panel
        title="Most videos uploaded"
        note="Top 5 · corrected"
        finding={
          <>
            Every channel here is a news broadcaster, and none of them appear in the
            project&rsquo;s original Power BI answer, which reported GRM Daily at{" "}
            {count(14_696)}. 24 News HD has uploaded {count(165_103)} — more than eleven times
            that. See{" "}
            <a href="#corrections" className="underline decoration-border-strong underline-offset-2 hover:text-ink">
              Corrections
            </a>
            .
          </>
        }
      >
        <RankBar
          data={rankBy(channels, "videos", 5)}
          format={videosFormat}
          metricLabel="Videos uploaded"
          label="Top 5 UK channels by videos uploaded"
        />
      </Panel>
    </div>
  </Section>
);

export default Reach;

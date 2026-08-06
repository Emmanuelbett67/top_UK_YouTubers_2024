"use client";

import React from "react";
import { useChannels } from "@/hooks/useChannels";
import { totals } from "@/lib/metrics";
import { billions, count } from "@/lib/format";
import Nav from "@/components/Nav";
import Section from "@/components/Section";
import StatBand from "@/components/charts/StatBand";
import ChannelTable from "@/components/ChannelTable";
import Masthead from "@/components/sections/Masthead";
import Reach from "@/components/sections/Reach";
import Efficiency from "@/components/sections/Efficiency";
import Roi from "@/components/sections/Roi";
import Corrections from "@/components/sections/Corrections";
import HowItWasBuilt from "@/components/sections/HowItWasBuilt";
import Method from "@/components/sections/Method";
import Footer from "@/components/sections/Footer";

export default function Home() {
  const { channels, error } = useChannels();

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-[1240px] px-6 lg:px-10">
        <Masthead />

        {error && (
          <p className="py-16 text-sm text-negative">Could not load the dataset: {error}</p>
        )}

        {!channels && !error && (
          <p className="py-16 text-sm text-ink-muted">Loading dataset…</p>
        )}

        {channels && (
          <>
            <Section
              id="summary"
              eyebrow="Summary"
              title="The field, in four numbers"
              intro="Every figure below is computed in your browser from the 100-row dataset."
            >
              <StatBand
                stats={[
                  { label: "Channels", value: count(totals(channels).channels) },
                  {
                    // Billions, not millions: the combined figure passed 1bn, and
                    // "1055.5M" sitting next to "471.21B" reads as two different
                    // conventions in one band.
                    label: "Subscribers",
                    value: billions(totals(channels).subscribers),
                    note: "combined",
                  },
                  { label: "Total views", value: billions(totals(channels).views) },
                  { label: "Videos", value: count(totals(channels).videos) },
                ]}
              />
            </Section>

            <Reach channels={channels} />
            <Efficiency channels={channels} />
            <Roi channels={channels} />
            <Corrections />
            <HowItWasBuilt />
            <Method />

            <Section
              id="data"
              eyebrow="Data"
              title="All 100 channels"
              intro="Sort by any column. Every chart above is a slice of this table."
            >
              <div className="card-flat min-w-0 p-5">
                <ChannelTable channels={channels} />
              </div>
            </Section>
          </>
        )}

        <Footer />
      </main>
    </>
  );
}

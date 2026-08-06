import React from "react";
import Section from "@/components/Section";

const CORRECTIONS: { title: string; body: React.ReactNode }[] = [
  {
    title: "Most videos uploaded is wrong, not merely imprecise",
    body: (
      <>
        The published answer is GRM Daily 14,696 · Manchester City 8,248 · Yogscast 6,435. The
        data gives 24 News HD 165,103 · Sky News 46,009 · BBC News عربي 40,179. GRM Daily is
        not close to first. Every channel in the correct top five is a news broadcaster and
        none appear in the original — the pattern indicates news channels were filtered out of
        the Power BI table.
      </>
    ),
  },
  {
    title: "Average views per video is ten times low throughout",
    body: (
      <>
        The published figures are 32.27M / 5.97M / 5.76M; the data gives 322.79M / 59.77M /
        57.62M. The ranking is right and every magnitude is off by one decimal place. The
        engagement-rate table computes correctly from the same two columns, so the data is
        sound — and the <code className="font-mono text-[13px]">Average Views per Video (M)</code>{" "}
        DAX measure is sound too, dividing by a million exactly once. The error is in the
        results table as transcribed, not in the model. The published measure and the published
        table disagree with each other.
      </>
    ),
  },
  {
    title: "Two channels are mislabelled",
    body: (
      <>
        The views-per-subscriber table names &ldquo;Nickelodeon&rdquo; and &ldquo;Disney Junior
        UK&rdquo;. The source names them &ldquo;Nickelodeon UK&rdquo; and &ldquo;Disney
        Kids&rdquo;. The values match to two decimal places, so this is a labelling slip rather
        than a computation error.
      </>
    ),
  },
];

const Corrections: React.FC = () => (
  <Section
    id="corrections"
    eyebrow="Provenance"
    title="Corrections to the original report"
    intro="Every figure on this page is recomputed in your browser from the source CSV. Three of the six answers the Power BI report published do not survive that recomputation. They are set out here rather than quietly replaced."
  >
    <ol className="grid gap-6 lg:grid-cols-3">
      {CORRECTIONS.map((correction, index) => (
        <li key={correction.title} className="card-flat p-5">
          <p className="eyebrow">Correction {index + 1}</p>
          <h3 className="mt-3 text-[15px] font-medium leading-snug tracking-[-0.01em] text-ink">
            {correction.title}
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">{correction.body}</p>
        </li>
      ))}
    </ol>
  </Section>
);

export default Corrections;

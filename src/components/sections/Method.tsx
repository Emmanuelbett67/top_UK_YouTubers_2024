import React from "react";
import Section from "@/components/Section";

const LIMITS: { title: string; body: string }[] = [
  {
    title: "Snapshot data",
    body: "A single 2024 extract with no time dimension. Nothing here supports a claim about growth, trend or momentum.",
  },
  {
    title: "Subscriber counts arrive pre-rounded",
    body: "The source reports 33.6M, not 33,600,000 exactly. Precision beyond three significant figures is not available, and every ratio built on these counts inherits that limit.",
  },
  {
    title: "Reach is measured; fit is not",
    body: "There are no likes, comments, watch times, audience demographics or content categories in this dataset. Whether a channel's audience matches a given product is unmeasurable here — and it is at least as important as reach.",
  },
  {
    title: "Ratio metrics are unstable at low video counts",
    body: "Below roughly 100 videos, average views per video describes the denominator more than the channel. Two channels in this dataset are affected badly enough to be flagged on the scatter.",
  },
  {
    title: "Lifetime averages, not recent performance",
    body: "Average views per video is a lifetime figure. A channel's next video is not its historical mean, and the return model treats it as though it were.",
  },
  {
    title: "The return figures are illustrative",
    body: "Product price, conversion rate and campaign cost are assumptions, not quoted rates. They are stated on the page so they can be argued with.",
  },
  {
    title: "Country is taken at face value",
    body: "Channels are included on the strength of the source's own 'Reino Unido' tag. It was not independently verified.",
  },
];

const Method: React.FC = () => (
  <Section
    id="method"
    eyebrow="Limitations"
    title="What this analysis cannot tell you"
    intro="Descriptive, not causal, and narrower than the dashboard makes it look."
  >
    <dl className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
      {LIMITS.map((limit) => (
        <div key={limit.title}>
          <dt className="text-sm font-medium text-ink">{limit.title}</dt>
          <dd className="mt-1.5 max-w-[52ch] text-sm leading-relaxed text-ink-muted">
            {limit.body}
          </dd>
        </div>
      ))}
    </dl>
  </Section>
);

export default Method;

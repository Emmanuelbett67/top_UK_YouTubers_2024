import React from "react";

interface SectionProps {
  id: string;
  eyebrow: string;
  title: string;
  intro?: React.ReactNode;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ id, eyebrow, title, intro, children }) => (
  <section id={id} className="scroll-mt-20 py-14">
    <p className="eyebrow">{eyebrow}</p>
    <h2 className="mt-3 text-2xl font-medium tracking-[-0.02em] text-ink">{title}</h2>
    {intro && (
      <div className="mt-4 max-w-[68ch] text-sm leading-relaxed text-ink-muted">{intro}</div>
    )}
    <div className="mt-8">{children}</div>
  </section>
);

export default Section;

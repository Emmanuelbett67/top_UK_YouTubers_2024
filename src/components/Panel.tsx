import React from "react";

interface PanelProps {
  title: string;
  note?: string;
  /** The written finding, shown beneath the chart. */
  finding?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const Panel: React.FC<PanelProps> = ({ title, note, finding, children, className = "" }) => (
  /* min-w-0: as a grid item this defaults to min-width:auto, which makes it
     refuse to shrink below the chart's intrinsic width — the inner
     overflow-x-auto then never engages and the whole page scrolls sideways. */
  <section className={`card-flat flex min-w-0 flex-col ${className}`}>
    <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border px-5 py-4">
      <h3 className="text-[15px] font-medium tracking-[-0.01em] text-ink">{title}</h3>
      {note && <p className="text-xs text-ink-faint">{note}</p>}
    </header>
    <div className="flex-1 p-5">{children}</div>
    {finding && (
      <footer className="border-t border-border px-5 py-4">
        <p className="text-sm leading-relaxed text-ink-muted">{finding}</p>
      </footer>
    )}
  </section>
);

export default Panel;

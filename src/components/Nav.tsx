"use client";

import React from "react";

const SECTIONS = [
  { id: "summary", label: "Summary" },
  { id: "reach", label: "Reach" },
  { id: "efficiency", label: "Efficiency" },
  { id: "roi", label: "Return" },
  { id: "corrections", label: "Corrections" },
  { id: "build", label: "How it was built" },
  { id: "method", label: "Method" },
];

const Nav: React.FC = () => (
  /* Opaque, not translucent: content scrolling underneath ghosted through at
     85%, and a shadowless hairline system has nothing to gain from blur. */
  <nav className="sticky top-0 z-40 border-b border-border bg-paper">
    <div className="mx-auto flex max-w-[1240px] items-center justify-between gap-6 px-6 py-3 lg:px-10">
      <ul className="flex flex-wrap items-center gap-x-5 gap-y-1">
        {SECTIONS.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              className="text-xs text-ink-muted transition-colors hover:text-ink"
            >
              {section.label}
            </a>
          </li>
        ))}
      </ul>
      <a
        href="https://github.com/Emmanuelbett67/top_UK_YouTubers_2024"
        target="_blank"
        rel="noreferrer"
        className="shrink-0 text-xs text-ink-muted transition-colors hover:text-ink"
      >
        Source ↗
      </a>
    </div>
  </nav>
);

export default Nav;

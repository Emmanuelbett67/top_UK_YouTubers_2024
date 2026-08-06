"use client";

import { useEffect, useState } from "react";
import { loadChannels, type Channel } from "@/lib/csv-loader";

const DATASET_URL = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/uk-youtubers-2024.csv`;

export function useChannels() {
  const [channels, setChannels] = useState<Channel[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadChannels(DATASET_URL)
      .then((rows) => {
        if (!cancelled) setChannels(rows);
      })
      .catch((cause: Error) => {
        if (!cancelled) setError(cause.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { channels, error };
}

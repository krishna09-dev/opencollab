// apps/web/src/features/prTracking/hooks/usePrTracking.ts
import { useEffect, useMemo, useState } from "react";
import type { PrFilterState, PrListResponse, PrMessage } from "../types";
import { fetchPrList, fetchPrMessages } from "../api/prTrackingApi";

export function usePrTracking(filters: PrFilterState) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PrListResponse>({ items: [], total: 0 });

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchPrList(filters);
        if (!alive) return;
        setData(res);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.response?.data?.message || "Failed to load PR tracking list.");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [filters.q, filters.status, filters.repo]);

  const repos = useMemo(() => {
    const set = new Set<string>();
    data.items.forEach((x) => set.add(x.repoFullName));
    return ["All" as const, ...Array.from(set).sort()];
  }, [data.items]);

  return { loading, error, data, repos };
}

export function usePrMessages(prId: string | null) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<PrMessage[]>([]);

  useEffect(() => {
    if (!prId) return;
    let alive = true;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchPrMessages(prId);
        if (!alive) return;
        setItems(res);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.response?.data?.message || "Failed to load messages.");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [prId]);

  return { loading, error, items, setItems };
}
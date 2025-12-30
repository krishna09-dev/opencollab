import * as React from "react";
import type { ResourceFilterState, ResourceItem } from "../types";
import { fetchResources } from "../api/resourcesApi";

export function useResources(filters: ResourceFilterState) {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [featured, setFeatured] = React.useState<ResourceItem[]>([]);
  const [items, setItems] = React.useState<ResourceItem[]>([]);
  const [total, setTotal] = React.useState<number>(0);

  React.useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetchResources(filters);
        if (!alive) return;

        setFeatured(res.featured ?? []);
        setItems(res.items ?? []);
        setTotal(res.total ?? 0);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.response?.data?.message || e?.message || "Failed to load resources.");
        setFeatured([]);
        setItems([]);
        setTotal(0);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [filters]);

  return { loading, error, featured, items, total };
}
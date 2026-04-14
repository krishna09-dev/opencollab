import * as React from "react";
import type { ResourceFilterState, ResourceItem } from "../types";
import { fetchResources } from "../api/resourcesApi";

type UseResourcesOptions = {
  page?: number;
  limit?: number;
};

function toErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null) {
    const maybeError = error as {
      response?: { data?: { message?: string } };
      message?: string;
    };

    return maybeError.response?.data?.message || maybeError.message || "Failed to load resources.";
  }

  return "Failed to load resources.";
}

export function useResources(filters: ResourceFilterState, options?: UseResourcesOptions) {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [featured, setFeatured] = React.useState<ResourceItem[]>([]);
  const [items, setItems] = React.useState<ResourceItem[]>([]);
  const [total, setTotal] = React.useState<number>(0);
  const [totalPages, setTotalPages] = React.useState<number>(1);

  const page = options?.page ?? 1;
  const limit = options?.limit ?? 12;

  React.useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetchResources(filters, { page, limit });
        if (!alive) return;

        setFeatured(res.featured ?? []);
        setItems(res.items ?? []);
        setTotal(res.total ?? 0);
        setTotalPages(res.totalPages ?? 1);
      } catch (e: unknown) {
        if (!alive) return;
        setError(toErrorMessage(e));
        setFeatured([]);
        setItems([]);
        setTotal(0);
        setTotalPages(1);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [filters, page, limit]);

  return { loading, error, featured, items, total, totalPages };
}
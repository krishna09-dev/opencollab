import * as React from "react";
import { seedResources } from "../api/resourcesApi";

export function useSeedResources() {
  const [seeding, setSeeding] = React.useState(false);

  const seed = React.useCallback(async () => {
    setSeeding(true);
    try {
      const res = await seedResources();
      return { ok: true, ...res };
    } catch (e: any) {
      return {
        ok: false,
        message: e?.response?.data?.message || e?.message || "Failed to seed."
      };
    } finally {
      setSeeding(false);
    }
  }, []);

  return { seeding, seed };
}
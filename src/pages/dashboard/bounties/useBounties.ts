import { useCallback, useEffect, useState } from "react";
import { bountyApi } from "../../../services/bountyApi";
import type { Bounty } from "./bountyData";

export function useBounties() {
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setBounties(await bountyApi.list());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load bounties.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { bounties, isLoading, error, reload };
}

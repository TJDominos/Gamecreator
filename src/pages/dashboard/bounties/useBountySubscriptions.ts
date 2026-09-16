import { useState, useEffect, useCallback } from 'react';
import { bountyApi } from '../../../services/bountyApi';

export function useBountySubscriptions() {
  const [subscribedIds, setSubscribedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    bountyApi.list()
      .then((bounties) => {
        if (active) setSubscribedIds(bounties.filter((bounty) => bounty.isSubscribed).map((bounty) => bounty.id));
      })
      .catch((loadError) => {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Could not load subscriptions.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => { active = false; };
  }, []);

  const isSubscribed = useCallback(
    (bountyId: string) => subscribedIds.includes(bountyId),
    [subscribedIds]
  );

  const subscribe = useCallback(
    async (bountyId: string) => {
      setError(null);
      try {
        await bountyApi.participate(bountyId);
        setSubscribedIds((current) => current.includes(bountyId) ? current : [...current, bountyId]);
        return true;
      } catch (subscribeError) {
        setError(subscribeError instanceof Error ? subscribeError.message : 'Could not subscribe to this bounty.');
        return false;
      }
    },
    []
  );

  const unsubscribe = useCallback(
    async (bountyId: string) => {
      setError(null);
      try {
        await bountyApi.leave(bountyId);
        setSubscribedIds((current) => current.filter((id) => id !== bountyId));
        return true;
      } catch (unsubscribeError) {
        setError(unsubscribeError instanceof Error ? unsubscribeError.message : 'Could not unsubscribe from this bounty.');
        return false;
      }
    },
    []
  );

  const toggleSubscription = useCallback(
    async (bountyId: string) => {
      if (subscribedIds.includes(bountyId)) {
        await unsubscribe(bountyId);
      } else {
        await subscribe(bountyId);
      }
    },
    [subscribedIds, subscribe, unsubscribe]
  );

  const resetSubscriptions = useCallback(() => {
    setSubscribedIds([]);
  }, []);

  return {
    subscribedIds,
    isSubscribed,
    subscribe,
    unsubscribe,
    toggleSubscription,
    resetSubscriptions,
    isLoading,
    error,
  };
}

import { useState, useEffect, useCallback } from 'react';
import { MOCK_BOUNTIES, canUnsubscribeFromBounty } from './bountyData';

const STORAGE_KEY = 'RS_BOUNTY_SUBSCRIPTIONS';
const DEFAULT_SUBSCRIBED_IDS = ['bty_001', 'bty_002', 'bty_003', 'bty_004'];

function getStoredSubscriptions(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SUBSCRIBED_IDS));
      return DEFAULT_SUBSCRIBED_IDS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return DEFAULT_SUBSCRIBED_IDS;
  } catch {
    return DEFAULT_SUBSCRIBED_IDS;
  }
}

export function useBountySubscriptions() {
  const [subscribedIds, setSubscribedIds] = useState<string[]>(getStoredSubscriptions);

  useEffect(() => {
    const handleSync = () => {
      setSubscribedIds(getStoredSubscriptions());
    };

    window.addEventListener('storage', handleSync);
    window.addEventListener('bounty_subscriptions_changed', handleSync);

    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('bounty_subscriptions_changed', handleSync);
    };
  }, []);

  const persist = (next: string[]) => {
    setSubscribedIds(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new CustomEvent('bounty_subscriptions_changed'));
    } catch (e) {
      console.error('Failed to save bounty subscriptions', e);
    }
  };

  const isSubscribed = useCallback(
    (bountyId: string) => subscribedIds.includes(bountyId),
    [subscribedIds]
  );

  const subscribe = useCallback(
    (bountyId: string) => {
      if (!subscribedIds.includes(bountyId)) {
        const next = [...subscribedIds, bountyId];
        persist(next);
      }
    },
    [subscribedIds]
  );

  const unsubscribe = useCallback(
    (bountyId: string) => {
      // Creators can only unsubscribe on bounties with open status and development stages
      const bounty = MOCK_BOUNTIES.find(b => b.id === bountyId);
      if (bounty && !canUnsubscribeFromBounty(bounty.state)) {
        console.warn(`Unsubscription locked for bounty ${bountyId} in stage: ${bounty.state}`);
        return false;
      }

      if (subscribedIds.includes(bountyId)) {
        const next = subscribedIds.filter(id => id !== bountyId);
        persist(next);
        return true;
      }
      return false;
    },
    [subscribedIds]
  );

  const toggleSubscription = useCallback(
    (bountyId: string) => {
      if (subscribedIds.includes(bountyId)) {
        unsubscribe(bountyId);
      } else {
        subscribe(bountyId);
      }
    },
    [subscribedIds, subscribe, unsubscribe]
  );

  const resetSubscriptions = useCallback(() => {
    persist(DEFAULT_SUBSCRIBED_IDS);
  }, []);

  return {
    subscribedIds,
    isSubscribed,
    subscribe,
    unsubscribe,
    toggleSubscription,
    resetSubscriptions,
  };
}

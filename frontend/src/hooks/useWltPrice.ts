import { useState, useEffect } from 'react';

export interface WltMarketData {
  price: number | null;
  change24h: number | null;
  fdv: number | null;
}

export const FALLBACK_STATS: WltMarketData = {
  price: 0.00015885,
  change24h: 0.0,
  fdv: 158850,
};

export function useWltPrice() {
  const [stats, setStats] = useState<WltMarketData>(FALLBACK_STATS);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const loadPrice = async () => {
      try {
        const response = await fetch(
          "https://api.geckoterminal.com/api/v2/networks/solana/pools/D3yTkWUxmL5T1roVkeWptLEaosw5k1nYSkt392QwAkg1",
          {
            signal: controller.signal,
            headers: { accept: "application/json" },
          },
        );
        if (!response.ok) return;
        const json = await response.json();
        const attrs = json?.data?.attributes;
        if (!attrs) return;

        setStats({
          price: parseFloat(attrs.base_token_price_usd) || FALLBACK_STATS.price,
          change24h: parseFloat(attrs.price_change_percentage?.h24) || FALLBACK_STATS.change24h,
          fdv: parseFloat(attrs.fdv_usd) || FALLBACK_STATS.fdv,
        });
        setIsLive(true);
      } catch (error) {
        if (!controller.signal.aborted) setIsLive(false);
      }
    };

    loadPrice();
    const interval = setInterval(loadPrice, 300000); // 300s update
    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, []);

  return { stats, isLive };
}

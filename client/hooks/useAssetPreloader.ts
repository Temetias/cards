import { useEffect, useRef, useState } from "react";
import { CARD_DEFINITIONS } from "../../shared/cards/index.ts";

const CARD_IMAGES = Object.keys(CARD_DEFINITIONS).map(
  (defId) => `/${defId}.png`,
);

export function useAssetPreloader(urls: string[] = CARD_IMAGES) {
  const [loadedCount, setLoadedCount] = useState(0);
  const [isDone, setIsDone] = useState(false);

  const total = urls.length;
  const startedRef = useRef(false);

  useEffect(() => {
    if (!urls.length || startedRef.current) return;

    startedRef.current = true;
    let cancelled = false;

    async function load() {
      let loaded = 0;
      await Promise.allSettled(
        urls.map((url) => {
          return new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = async () => {
              if (img.decode) {
                try {
                  await img.decode();
                } catch (_) {
                  // Decoding failed, but we can still consider the image loaded
                }
              }
              if (!cancelled) {
                loaded++;
                setLoadedCount(loaded);
              }
              resolve();
            };
            img.onerror = () => resolve();
            img.src = url;
          });
        }),
      );
      if (!cancelled) setIsDone(true);
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [urls]);

  return {
    loadedCount,
    total,
    isDone,
    progressPercentage: total ? (loadedCount / total) * 100 : 100,
  };
}

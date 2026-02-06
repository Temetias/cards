export const IS_PROD =
  (import.meta as unknown as { env?: { VITE_IS_PROD?: boolean } }).env
    ?.VITE_IS_PROD ?? false;

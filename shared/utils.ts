import type { GameLogicError } from "./communication.ts";

export type Brand<T, B extends string> = T & { __brand: B };
export type UUID = Brand<string, "UUID">;
export function brand<T, B extends string>(value: T, _brand: B): Brand<T, B> {
  //(value as any).__brand = brand;
  // Well, this fucking fails on primitives...
  return value as Brand<T, B>;
}
export function uuid(): UUID {
  const globalCrypto = globalThis.crypto;
  if (globalCrypto && typeof globalCrypto.randomUUID === "function") {
    return brand(globalCrypto.randomUUID(), "UUID");
  }
  // Fallback when randomUUID is unavailable (e.g., non-secure context).
  if (globalCrypto && typeof globalCrypto.getRandomValues === "function") {
    const bytes = new Uint8Array(16);
    globalCrypto.getRandomValues(bytes);
    // RFC 4122 version 4 variant.
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0"));
    const id =
      `${hex[0]}${hex[1]}${hex[2]}${hex[3]}` +
      `-${hex[4]}${hex[5]}` +
      `-${hex[6]}${hex[7]}` +
      `-${hex[8]}${hex[9]}` +
      `-${hex[10]}${hex[11]}${hex[12]}${hex[13]}${hex[14]}${hex[15]}`;
    return brand(id, "UUID");
  }
  const fallback = `fallback-${Math.random().toString(16).slice(2)}-${Date.now().toString(16)}`;
  return brand(fallback, "UUID");
}
export type Typed<T extends string> = { type: T };
export type Nullable<T> = T | null;
export type Identified = {
  id: UUID;
};
export type Named = {
  name: string;
};
export function gameLogicErrorLog(
  error: GameLogicError,
  at: string,
  ...args: unknown[]
) {
  console.error("Game logic error at ", at, ":", error, ...args);
}
/**
 * Make a array of objects unique by key
 */
export function uniqueByKey<T, K extends keyof T>(array: T[], key: K): T[] {
  const seen = new Set<T[K]>();
  return array.filter((item) => {
    const k = item[key];
    if (seen.has(k)) {
      return false;
    } else {
      seen.add(k);
      return true;
    }
  });
}

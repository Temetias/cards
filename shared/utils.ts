import type { GameLogicError } from "./communication.ts";

export type Brand<T, B extends string> = T & { __brand: B };
export type UUID = Brand<string, "UUID">;
export function brand<T, B extends string>(value: T, _brand: B): Brand<T, B> {
  // deno-lint-ignore no-explicit-any
  //(value as any).__brand = brand;
  // Well, this fucking fails on primitives...
  return value as Brand<T, B>;
}
export function uuid(): UUID {
  return brand(crypto.randomUUID(), "UUID");
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

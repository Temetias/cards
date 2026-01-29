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

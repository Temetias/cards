import { Entity } from "./crud.ts";

export type User = Entity<{ name: string; tokens: number }>;
export type CollectionItem = { id: string; amount: number };

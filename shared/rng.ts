import type { Card } from "./cards/index.ts";
import type { Seed } from "./game.ts";
import { brand } from "./utils.ts";

const MOD = 2147483647; // 2^31 - 1
const MUL = 16807;

export function generateSeed(): Seed {
  const seed = Math.floor(Math.random() * (MOD - 1)) + 1;
  return brand(seed, "SEED");
}

/**
 * Generates a pseudo-random number between 0 (inclusive) and 1 (exclusive) along with the next seed
 */
export function rng(seed: Seed): [value: number, nextSeed: Seed] {
  const next = (seed * MUL) % MOD;
  return [(next - 1) / (MOD - 1), brand(next, "SEED")];
}

export function draw(
  cards: Card[],
  amount: number,
): [drawn: Card[], remaining: Card[]] {
  return [cards.slice(0, amount), cards.slice(amount)];
}

export function shuffle(
  items: Card[],
  seed: Seed,
): [shuffled: Card[], nextSeed: Seed] {
  const result = [...items];
  let currentSeed = seed;
  for (let i = result.length - 1; i > 0; i--) {
    const [r, next] = rng(currentSeed);
    currentSeed = next;
    const j = Math.floor(r * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return [result, currentSeed];
}

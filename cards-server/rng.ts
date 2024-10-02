export type RNG = () => number;

export function seededRng(seed: number): RNG {
  let value = seed % 2147483647;
  if (value <= 0) value = value += 2147483646;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

export function generateSeed(): number {
  return Math.floor(Math.random() * 2147483647);
}

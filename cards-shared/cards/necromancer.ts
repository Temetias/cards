import { revive } from "./keywords.ts";
import { Card } from "./types.ts";

export const necromancer: Card = {
  name: "Necromancer",
  cost: 4,
  power: 20,
  description: "[revive] 1",
  playEffect: revive,
};

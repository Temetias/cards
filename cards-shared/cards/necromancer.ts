import { revive } from "./keywords.ts";
import { CreatureCard } from "./types.ts";

export const necromancer: CreatureCard = {
  type: "creature",
  name: "Necromancer",
  cost: 4,
  power: 20,
  description: "[revive] 1",
  playEffect: revive,
};

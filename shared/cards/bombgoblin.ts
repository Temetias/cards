import { FACTIONS } from "./factions.ts";
import { cardDefinitionId, type CreatureCardDefintion } from "./index.ts";

export const bombgoblin: CreatureCardDefintion = {
  definitionId: cardDefinitionId("collectible_bombgoblin"),
  cost: 6,
  name: "Bomb Goblin",
  description: [],
  type: "CREATURE",
  power: 4,
  onResourcePlay: null,
  keywords: ["#doublebreaker"],
  onPlay: null,
  triggers: {},
  faction: FACTIONS.NEUTRAL,
};

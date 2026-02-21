import { FACTIONS } from "./factions.ts";
import { cardDefinitionId, type CreatureCardDefintion } from "./index.ts";

export const armoredgoblin: CreatureCardDefintion = {
  definitionId: cardDefinitionId("collectible_armoredgoblin"),
  cost: 2,
  name: "Armored Goblin",
  faction: FACTIONS.NEUTRAL,
  description: [],
  type: "CREATURE",
  power: 1,
  keywords: ["#blocker"],
  onPlay: null,
  onResourcePlay: null,
  triggers: {},
};

import { FACTIONS } from "./factions.ts";
import { cardDefinitionId, type CreatureCardDefintion } from "./index.ts";

export const artillery: CreatureCardDefintion = {
  definitionId: cardDefinitionId("collectible_artillery"),
  cost: 3,
  name: "Artillery",
  description: [],
  type: "CREATURE",
  power: 1,
  onResourcePlay: null,
  keywords: ["#doublebreaker"],
  onPlay: null,
  triggers: {},
  faction: FACTIONS.NEUTRAL,
};

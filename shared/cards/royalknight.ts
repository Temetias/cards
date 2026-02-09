import { FACTIONS } from "./factions.ts";
import { cardDefinitionId, type CreatureCardDefintion } from "./index.ts";

export const royalknight: CreatureCardDefintion = {
  definitionId: cardDefinitionId("collectible_royalknight"),
  cost: 4,
  name: "Royal Knight",
  description: [],
  type: "CREATURE",
  power: 4,
  keywords: [],
  onPlay: null,
  onResourcePlay: null,
  triggers: {},
  faction: FACTIONS.NEUTRAL,
};

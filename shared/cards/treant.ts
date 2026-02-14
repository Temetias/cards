import { FACTIONS } from "./factions.ts";
import { cardDefinitionId, type CreatureCardDefintion } from "./index.ts";

export const treant: CreatureCardDefintion = {
  definitionId: cardDefinitionId("collectible_treant"),
  cost: 7,
  name: "Treant",
  description: [],
  type: "CREATURE",
  power: 7,
  keywords: [],
  onPlay: null,
  onResourcePlay: null,
  triggers: {},
  faction: FACTIONS.NEUTRAL,
};

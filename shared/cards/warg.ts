import { FACTIONS } from "./factions.ts";
import { cardDefinitionId, type CreatureCardDefintion } from "./index.ts";

export const warg: CreatureCardDefintion = {
  definitionId: cardDefinitionId("collectible_warg"),
  cost: 5,
  name: "Warg",
  faction: FACTIONS.DOMINION,
  description: [],
  type: "CREATURE",
  power: 5,
  keywords: [],
  onPlay: null,
  onResourcePlay: null,
  triggers: {},
};

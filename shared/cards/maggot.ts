import { FACTIONS } from "./factions.ts";
import { cardDefinitionId, type CreatureCardDefintion } from "./index.ts";

export const maggot: CreatureCardDefintion = {
  definitionId: cardDefinitionId("noncollectible_maggot"),
  cost: 2,
  name: "Maggot",
  description: [],
  type: "CREATURE",
  power: 0,
  keywords: [],
  onPlay: null,
  triggers: {},
  faction: FACTIONS.DOMINION,
};

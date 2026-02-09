import { FACTIONS } from "./factions.ts";
import { cardDefinitionId, type CreatureCardDefintion } from "./index.ts";

export const whitewolf: CreatureCardDefintion = {
  definitionId: cardDefinitionId("noncollectible_whitewolf"),
  cost: 2,
  name: "White Wolf",
  description: [],
  type: "CREATURE",
  power: 2,
  keywords: [],
  onPlay: null,
  onResourcePlay: null,
  triggers: {},
  faction: FACTIONS.NEUTRAL,
};

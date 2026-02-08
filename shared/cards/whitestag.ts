import { FACTIONS } from "./factions.ts";
import { cardDefinitionId, type CreatureCardDefintion } from "./index.ts";

export const whitestag: CreatureCardDefintion = {
  definitionId: cardDefinitionId("collectible_whitestag"),
  cost: 2,
  name: "White Stag",
  description: [],
  type: "CREATURE",
  power: 2,
  keywords: [],
  onPlay: null,
  triggers: {},
  faction: FACTIONS.NEUTRAL,
};

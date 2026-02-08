import { FACTIONS } from "./factions.ts";
import { cardDefinitionId, type CreatureCardDefintion } from "./index.ts";

export const butcher: CreatureCardDefintion = {
  definitionId: cardDefinitionId("collectible_butcher"),
  cost: 6,
  name: "Butcher",
  description: [],
  type: "CREATURE",
  power: 6,
  keywords: [],
  onPlay: null,
  triggers: {},
  faction: FACTIONS.DOMINION,
};

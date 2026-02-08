import { FACTIONS } from "./factions.ts";
import { cardDefinitionId, type CreatureCardDefintion } from "./index.ts";

export const lonelyarcher: CreatureCardDefintion = {
  definitionId: cardDefinitionId("collectible_lonelyarcher"),
  cost: 3,
  name: "Lonely Archer",
  description: [],
  type: "CREATURE",
  power: 3,
  keywords: [],
  onPlay: null,
  triggers: {},
  faction: FACTIONS.NEUTRAL,
};

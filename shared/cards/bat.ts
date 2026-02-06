import { cardDefinitionId, type CreatureCardDefintion } from "./index.ts";

export const bat: CreatureCardDefintion = {
  definitionId: cardDefinitionId("collectible_bat"),
  cost: 2,
  name: "Bat",
  description: [],
  type: "CREATURE",
  power: 2,
  keywords: [],
  onPlay: null,
  triggers: {},
};

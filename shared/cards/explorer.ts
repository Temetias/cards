import { cardDefinitionId, type CreatureCardDefintion } from "./index.ts";

export const explorer: CreatureCardDefintion = {
  definitionId: cardDefinitionId("collectible_explorer"),
  cost: 4,
  name: "Explorer",
  description: [],
  type: "CREATURE",
  power: 4,
  keywords: [],
  onPlay: null,
  triggers: {},
};

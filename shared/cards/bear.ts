import { cardDefinitionId, type CreatureCardDefintion } from "./index.ts";

export const bear: CreatureCardDefintion = {
  definitionId: cardDefinitionId("collectible_bear"),
  cost: 3,
  name: "Bear",
  description: [],
  type: "CREATURE",
  power: 3,
  keywords: [],
  onPlay: null,
  triggers: {},
};

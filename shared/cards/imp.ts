import { cardDefinitionId, type CreatureCardDefintion } from "./index.ts";

export const imp: CreatureCardDefintion = {
  definitionId: cardDefinitionId("collectible_imp"),
  cost: 1,
  name: "Imp",
  description: "",
  type: "CREATURE",
  power: 1,
  keywords: [],
  onPlay: null,
  triggers: {},
};

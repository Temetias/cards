import { cardDefinitionId, type CreatureCardDefintion } from "./index.ts";

export const butcher: CreatureCardDefintion = {
  definitionId: cardDefinitionId("collectible_butcher"),
  cost: 4,
  name: "Butcher",
  description: [],
  type: "CREATURE",
  power: 4,
  keywords: [],
  onPlay: null,
  triggers: {},
};

import { cardDefinitionId, type CreatureCardDefintion } from "./index.ts";

export const pawn: CreatureCardDefintion = {
  definitionId: cardDefinitionId("noncollectible_pawn"),
  cost: 1,
  name: "Pawn",
  description: [],
  type: "CREATURE",
  power: 1,
  keywords: [],
  onPlay: null,
  triggers: {},
};

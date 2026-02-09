import { FACTIONS } from "./factions.ts";
import { cardDefinitionId, type CreatureCardDefintion } from "./index.ts";

export const pawn: CreatureCardDefintion = {
  definitionId: cardDefinitionId("noncollectible_pawn"),
  cost: 1,
  name: "Pawn",
  description: ["The great equalizer."],
  type: "CREATURE",
  faction: FACTIONS.NEUTRAL,
  power: 1,
  keywords: [],
  onPlay: null,
  onResourcePlay: null,
  triggers: {},
};

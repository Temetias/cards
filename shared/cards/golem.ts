import { FACTIONS } from "./factions.ts";
import { cardDefinitionId, type CreatureCardDefintion } from "./index.ts";

export const golem: CreatureCardDefintion = {
  definitionId: cardDefinitionId("collectible_golem"),
  cost: 8,
  name: "Golem",
  description: [],
  type: "CREATURE",
  power: 7,
  keywords: ["#blocker"],
  onPlay: null,
  onResourcePlay: null,
  triggers: {},
  faction: FACTIONS.NEUTRAL,
};

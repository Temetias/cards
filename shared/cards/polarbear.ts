import type { GameState } from "../game.ts";
import type { UUID } from "../utils.ts";
import { FACTIONS } from "./factions.ts";
import {
  buildCardOnPlayNonTargeted,
  buildCardTrigger,
  getOwner,
} from "./helpers.ts";
import { cardDefinitionId, type CreatureCardDefintion } from "./index.ts";

export const polarbear: CreatureCardDefintion = {
  definitionId: cardDefinitionId("collectible_polarbear"),
  cost: 3,
  name: "Polar Bear",
  description: [
    "On play: For every friendly",
    "creature with 3 or more power,",
    "gain +1.",
  ],
  type: "CREATURE",
  power: 2,
  keywords: [],
  onResourcePlay: null,
  onPlay: buildCardOnPlayNonTargeted((state, { self }) => {
    const owner = getOwner(state, self as UUID, "polarbear.onPlay");
    const boost = owner.field.filter((creature) => creature.power > 2).length;
    if (boost === 0) return [state, []];

    const next: GameState = {
      ...state,
      players: {
        ...state.players,
        [owner.id]: {
          ...owner,
          field: owner.field.map((creature) =>
            creature.id === self
              ? { ...creature, power: creature.power + boost }
              : creature,
          ),
        },
      },
    };
    return [next, []];
  }),
  triggers: {},
  faction: FACTIONS.ASTRALS,
};

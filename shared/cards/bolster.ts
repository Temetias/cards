import { type GameState, getActivePlayer } from "../game.ts";
import { FACTIONS } from "./factions.ts";
import { buildCardOnPlayNonTargeted } from "./helpers.ts";
import { cardDefinitionId, type SpellCardDefintion } from "./index.ts";

export const bolster: SpellCardDefintion = {
  definitionId: cardDefinitionId("collectible_bolster"),
  name: "Bolster",
  description: [
    "Give +2 and #blocker to",
    "your leftmost and rightmost",
    "creatures.",
  ],
  cost: 3,
  type: "SPELL",
  keywords: [],
  faction: FACTIONS.ASTRALS,
  onResourcePlay: null,
  onPlay: buildCardOnPlayNonTargeted((state) => {
    const player = getActivePlayer(state);

    const next: GameState = {
      ...state,
      players: {
        ...state.players,
        [player.id]: {
          ...player,
          field: player.field.map((creature, index, array) => {
            if (index === 0 || index === array.length - 1) {
              return {
                ...creature,
                power: creature.power + 2,
                keywords: [...creature.keywords, "#blocker"],
              };
            }
            return creature;
          }),
        },
      },
    };
    return [next, []];
  }),
};

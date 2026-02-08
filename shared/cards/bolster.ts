import { type GameState, getActivePlayer } from "../game.ts";
import { FACTIONS } from "./factions.ts";
import { buildCardOnPlayNonTargeted } from "./helpers.ts";
import { cardDefinitionId, type SpellCardDefintion } from "./index.ts";

export const bolster: SpellCardDefintion = {
  definitionId: cardDefinitionId("collectible_bolster"),
  name: "Bolster",
  description: ["Give +1 power to", "all friendly creatures"],
  cost: 2,
  type: "SPELL",
  keywords: [],
  faction: FACTIONS.ASTRALS,
  onPlay: buildCardOnPlayNonTargeted((state) => {
    const player = getActivePlayer(state);

    const next: GameState = {
      ...state,
      players: {
        ...state.players,
        [player.id]: {
          ...player,
          field: player.field.map((creature) => ({
            ...creature,
            power: creature.power + 1,
          })),
        },
      },
    };
    return [next, []];
  }),
};

import { GAME_TRIGGER } from "../communication.ts";
import {
  type GameState,
  getActivePlayer,
  getInactivePlayer,
  getObservers,
} from "../game.ts";
import { buildCardOnPlayNonTargeted } from "./helpers.ts";
import { cardDefinitionId, type SpellCardDefintion } from "./index.ts";

export const doom: SpellCardDefintion = {
  definitionId: cardDefinitionId("collectible_doom"),
  name: "Doom",
  description: ["Destroy all creatures"],
  cost: 2,
  type: "SPELL",
  keywords: [],
  onPlay: buildCardOnPlayNonTargeted((state, { initiator }) => {
    const opponent = getInactivePlayer(state);
    const player = getActivePlayer(state);
    const opponentDyingCreatures = opponent.field;
    const playerDyingCreatures = player.field;

    const deathEffects = [
      ...opponentDyingCreatures,
      ...playerDyingCreatures,
    ].flatMap(() =>
      getObservers(state, GAME_TRIGGER.CREATURE_DIED).map(
        ({ getDispatch, self }) =>
          getDispatch({
            effectName: GAME_TRIGGER.CREATURE_DIED,
            initiator,
            self,
          }),
      ),
    );
    const next: GameState = {
      ...state,
      players: {
        ...state.players,
        [opponent.id]: {
          ...opponent,
          field: [],
          graveyard: [...opponent.graveyard, ...opponentDyingCreatures],
        },
        [player.id]: {
          ...player,
          field: [],
          graveyard: [...player.graveyard, ...playerDyingCreatures],
        },
      },
    };
    return [next, deathEffects];
  }),
};

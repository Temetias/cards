import { GAME_TRIGGER } from "../communication.ts";
import {
  fieldCreatureCardToCreatureCard,
  type GameState,
  getActivePlayer,
  getInactivePlayer,
  getObservers,
} from "../game.ts";
import { FACTIONS } from "./factions.ts";
import { buildCardOnPlayNonTargeted } from "./helpers.ts";
import { cardDefinitionId, type SpellCardDefintion } from "./index.ts";

export const doom: SpellCardDefintion = {
  definitionId: cardDefinitionId("collectible_doom"),
  name: "Doom",
  description: ["Destroy all creatures"],
  cost: 5,
  type: "SPELL",
  faction: FACTIONS.WORLDFORGED,
  keywords: [],
  onResourcePlay: null,
  onPlay: buildCardOnPlayNonTargeted((state) => {
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
            initiator: self,
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
          graveyard: [
            ...opponent.graveyard,
            ...opponentDyingCreatures.map(fieldCreatureCardToCreatureCard),
          ],
        },
        [player.id]: {
          ...player,
          field: [],
          graveyard: [
            ...player.graveyard,
            ...playerDyingCreatures.map(fieldCreatureCardToCreatureCard),
          ],
        },
      },
    };
    return [next, deathEffects];
  }),
};

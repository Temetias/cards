import { GAME_TRIGGER } from "../communication.ts";
import { type GameState, getInactivePlayer, getObservers } from "../game.ts";
import { buildCardOnPlayNonTargeted } from "./helpers.ts";
import { cardDefinitionId, type SpellCardDefintion } from "./index.ts";

export const firelash: SpellCardDefintion = {
  definitionId: cardDefinitionId("collectible_firelash"),
  name: "Fire Lash",
  description: ["Destroy enemy creatures", "with 3 or less power"],
  cost: 2,
  type: "SPELL",
  keywords: [],
  onPlay: buildCardOnPlayNonTargeted((state) => {
    const opponent = getInactivePlayer(state);
    const dyingCreatures = opponent.field.filter(
      (creature) => creature.power <= 3,
    );

    const deathEffects = dyingCreatures.flatMap((dc) =>
      getObservers(state, GAME_TRIGGER.CREATURE_DIED).map(
        ({ getDispatch, self }) =>
          getDispatch({
            effectName: GAME_TRIGGER.CREATURE_DIED,
            initiator: dc.id,
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
          field: opponent.field.filter((creature) =>
            dyingCreatures.every((dc) => dc.id !== creature.id),
          ),
          graveyard: [...opponent.graveyard, ...dyingCreatures],
        },
      },
    };
    return [next, deathEffects];
  }),
};

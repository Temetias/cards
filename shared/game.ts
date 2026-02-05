import {
  type GameEffectDispatchArguments,
  isCreature,
  type Card,
  type CreatureCard,
  type GameEffectDispatch,
  type GameEffectDispatchGetter,
} from "./cards/index.ts";
import {
  GAME_CONDITION_FAILURE,
  GAME_LOGIC_ERROR,
  type GameTrigger,
} from "./communication.ts";
import type { Brand, Identified, Named, Nullable } from "./utils.ts";

export type FieldCreatureCard = CreatureCard & {
  attacked: boolean;
};

export function creatureCardToFieldCreatureCard(
  creatureCard: CreatureCard,
): FieldCreatureCard {
  // Newly played creatures have not attacked yet
  // In future we might have "charge" keyword that allows attacking immediately
  // and that would be handled here
  return { ...creatureCard, attacked: true };
}

export function fieldCreatureCardToCreatureCard(
  fieldCreature: FieldCreatureCard,
): CreatureCard {
  const { attacked: _, ...creatureCard } = fieldCreature;
  return creatureCard;
}

export type ResourceCard = Card & {
  used: boolean;
};

export function cardToResourceCard(card: Card): ResourceCard {
  return { ...card, used: false };
}

export function resourceCardToCard(resourceCard: ResourceCard): Card {
  const { used: _, ...card } = resourceCard;
  return card;
}

export type Player = Identified &
  Named & {
    startingDeck: Card[];
    deck: Card[];
    hand: Card[];
    protection: Card[];
    resource: ResourceCard[];
    graveyard: CreatureCard[];
    discard: Card[];
    field: FieldCreatureCard[];
    userSelection: Nullable<Card | FieldCreatureCard[]>;
    hasPlayedResource: boolean;
  };

export type Seed = Brand<number, "SEED">;

/**
 * Game state should always be considered serializeable
 * Server will hold some runtime-only function but client should not care about those
 */
export type GameState = {
  rng: {
    initialSeed: Seed;
    currentSeed: Seed;
  };
  players: Record<Player["id"], Player>;
  cardPool: Card[];
  activePlayer: Player["id"];
  inactivePlayer: Player["id"];
  turnTimer: number;
  turnCount: number;
  winner: Nullable<Player["id"]>;
};

export type GameLog = (GameEffectDispatchArguments & { state: GameState })[];

export function getActivePlayer(state: GameState): Player {
  const player = state.players[state.activePlayer];
  if (!player) {
    throw new Error(GAME_LOGIC_ERROR.PLAYER_NOT_FOUND);
  }
  return player;
}

export function getInactivePlayer(state: GameState): Player {
  const inactivePlayer = state.players[state.inactivePlayer];
  if (!inactivePlayer) {
    throw new Error(GAME_LOGIC_ERROR.PLAYER_NOT_FOUND);
  }
  return inactivePlayer;
}

export function getFieldCreatures(state: GameState): FieldCreatureCard[] {
  const opponent = getInactivePlayer(state);
  const player = getActivePlayer(state);
  // This ultimately decides effect ordering. Maybe we could add field age or something later to have more deterministic ordering
  return [...opponent.field, ...player.field];
}

export function getObservers(
  state: GameState,
  trigger: GameTrigger,
): { getDispatch: GameEffectDispatchGetter; self: Card["id"] }[] {
  const fieldCreaturesWithEffects = getFieldCreatures(state)
    .filter((fc) => fc.triggers[trigger])
    .map((fc) => ({
      getDispatch: fc.triggers[trigger]!.getDispatch,
      self: fc.id,
    }));
  const loggerObserver = (
    args: GameEffectDispatchArguments,
  ): GameEffectDispatch => {
    return (state) => {
      return [state, [], args];
    };
  };
  // If in future we have effects that trigger in hand or deck, we can add those here
  // TODO: fix self typing
  return [
    ...fieldCreaturesWithEffects,
    { getDispatch: loggerObserver, self: "logger" as any },
  ];
}

export type GameConditionAssert<P extends unknown[]> = (
  state: GameState,
  ...params: P
) => asserts state;

export function isNoUserSelection(
  selection: Player["userSelection"],
): selection is null {
  return selection === null;
}

export function isHandCardSelection(
  selection: Player["userSelection"],
): selection is Card {
  return selection !== null && !Array.isArray(selection);
}

export function isFieldCreatureSelection(
  selection: Player["userSelection"],
): selection is FieldCreatureCard[] {
  return Array.isArray(selection);
}

export function isFieldCreature(
  card: Card | FieldCreatureCard,
): card is FieldCreatureCard {
  return isCreature(card) && "attacked" in card;
}

export const conditionIsPlayerTurn: GameConditionAssert<
  [playerId: Player["id"]]
> = (state, playerId) => {
  if (state.activePlayer !== playerId) {
    throw new Error(GAME_CONDITION_FAILURE.NOT_PLAYER_TURN);
  }
};

export const conditionHasHandCardSelected: GameConditionAssert<
  [playerId: Player["id"]]
> = (state, playerId) => {
  const player = state.players[playerId];
  if (!player) {
    throw new Error(GAME_LOGIC_ERROR.PLAYER_NOT_FOUND);
  }
  if (!isHandCardSelection(player.userSelection)) {
    throw new Error(GAME_CONDITION_FAILURE.NO_CARD_SELECTED);
  }
};

export const conditionHasFieldCreaturesSelected: GameConditionAssert<
  [playerId: Player["id"]]
> = (state, playerId) => {
  const player = state.players[playerId];
  if (!player) {
    throw new Error(GAME_LOGIC_ERROR.PLAYER_NOT_FOUND);
  }
  if (!isFieldCreatureSelection(player.userSelection)) {
    throw new Error(GAME_CONDITION_FAILURE.NO_CARD_SELECTED);
  }
};

export const conditionHasNotPlayedResource: GameConditionAssert<
  [playerId: Player["id"]]
> = (state, playerId) => {
  const player = state.players[playerId];
  if (!player) {
    throw new Error(GAME_LOGIC_ERROR.PLAYER_NOT_FOUND);
  }
  if (player.hasPlayedResource) {
    throw new Error(GAME_CONDITION_FAILURE.ALREADY_PLAYED_RESOURCE);
  }
};

export const conditionIsUserSelectableTarget: GameConditionAssert<
  [playerId: Player["id"], targetId: Card["id"]]
> = (state, playerId, targetId) => {
  const player = state.players[playerId];
  if (!player) {
    throw new Error(GAME_LOGIC_ERROR.PLAYER_NOT_FOUND);
  }
  const inHand = player.hand.find((c) => c.id === targetId);
  const inField = player.field.find(
    (c) => c.id === targetId && c.attacked === false && c.power > 0,
  );
  if (!inHand && !inField) {
    throw new Error(GAME_CONDITION_FAILURE.UNSELECTABLE_TARGET);
  }
  const userSelection = player.userSelection;
  if (
    isFieldCreatureSelection(userSelection) &&
    userSelection.find((c) => c.id === targetId)
  ) {
    throw new Error(GAME_CONDITION_FAILURE.UNSELECTABLE_TARGET);
  }
  if (isHandCardSelection(userSelection) && userSelection.id === targetId) {
    throw new Error(GAME_CONDITION_FAILURE.UNSELECTABLE_TARGET);
  }
};

export const conditionTargetIsInUserSelection: GameConditionAssert<
  [playerId: Player["id"], targetId: Card["id"]]
> = (state, playerId, targetId) => {
  const player = state.players[playerId];
  if (!player) {
    throw new Error(GAME_LOGIC_ERROR.PLAYER_NOT_FOUND);
  }
  const userSelection = player.userSelection;
  if (isNoUserSelection(userSelection)) {
    throw new Error(GAME_LOGIC_ERROR.CARD_NOT_FOUND);
  }
  if (isHandCardSelection(userSelection)) {
    if (userSelection.id !== targetId) {
      throw new Error(GAME_LOGIC_ERROR.CARD_NOT_FOUND);
    }
  } else if (isFieldCreatureSelection(userSelection)) {
    if (!userSelection.find((c) => c.id === targetId)) {
      throw new Error(GAME_LOGIC_ERROR.CARD_NOT_FOUND);
    }
  }
};

export const conditionHasEnoughResource: GameConditionAssert<
  [playerId: Player["id"]]
> = (state, playerId) => {
  const player = state.players[playerId];
  if (!player) {
    throw new Error(GAME_LOGIC_ERROR.PLAYER_NOT_FOUND);
  }
  const selectedCard = player.userSelection;
  if (!isHandCardSelection(selectedCard)) {
    throw new Error(GAME_LOGIC_ERROR.CARD_NOT_FOUND);
  }
  const availableResource = player.resource.filter((r) => !r.used).length;
  if (availableResource < selectedCard.cost) {
    throw new Error(GAME_CONDITION_FAILURE.NOT_ENOUGH_RESOURCE);
  }
};

export const conditionOpponentHasNoFieldCreatures: GameConditionAssert<
  [playerId: Player["id"]]
> = (state, playerId) => {
  const player = state.players[playerId];
  if (!player) {
    throw new Error(GAME_LOGIC_ERROR.PLAYER_NOT_FOUND);
  }
  const inactivePlayer =
    state.players[
      state.activePlayer === playerId
        ? state.inactivePlayer
        : state.activePlayer
    ];
  if (!inactivePlayer) {
    throw new Error(GAME_LOGIC_ERROR.PLAYER_NOT_FOUND);
  }
  if (inactivePlayer.field.length > 0) {
    throw new Error(GAME_CONDITION_FAILURE.OPPONENT_HAS_FIELD_CREATURES);
  }
};

export const conditionOpponentHasNoProtection: GameConditionAssert<
  [playerId: Player["id"]]
> = (state, playerId) => {
  const player = state.players[playerId];
  if (!player) {
    throw new Error(GAME_LOGIC_ERROR.PLAYER_NOT_FOUND);
  }
  const inactivePlayer =
    state.players[
      state.activePlayer === playerId
        ? state.inactivePlayer
        : state.activePlayer
    ];
  if (!inactivePlayer) {
    throw new Error(GAME_LOGIC_ERROR.PLAYER_NOT_FOUND);
  }
  if (inactivePlayer.protection.length > 0) {
    throw new Error(GAME_CONDITION_FAILURE.OPPONENT_HAS_PROTECTION);
  }
};

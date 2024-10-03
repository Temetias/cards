import type { DB } from "https://deno.land/x/sqlite@v3.9.0/mod.ts";
import { generateSeed, seededRng, type RNG } from "./rng.ts";
import {
  type GameCard,
  type GameState,
  type Player,
  type PlayerInfo,
  GAME_ACTION,
  GAME_CONDITION_FAIL,
  GAME_LOGIC_FAIL,
  GAME_MECHANIC,
  GAME_PROTECTION_POWER,
  GAME_TURN_TIME,
  pawn,
  draw,
  type ServerMessage,
  GAME_TRIGGER,
  type TriggerResult,
} from "@cards/shared";
import { V4 } from "https://deno.land/x/uuid@v0.1.2/mod.ts";

function send(payload: ServerMessage, socket: PlayerInfo["socket"]) {
  socket.send(JSON.stringify(payload));
}

function processTriggers(
  originalState: GameState,
  rng: RNG,
  ownerPlayerId: Player["id"],
  trigger: (typeof GAME_TRIGGER)[keyof typeof GAME_TRIGGER],
  origin: GameCard["id"] | typeof GAME_MECHANIC
): GameState {
  const [player, playerGameId] = getPlayer(originalState, ownerPlayerId);
  const [opponent, opponentGameId] = getOpponent(originalState, ownerPlayerId);
  const field = [
    ...player.field.map((card) => ({ card, owner: playerGameId })),
    ...opponent.field.map((card) => ({ card, owner: opponentGameId })),
  ];
  const { state: newState, triggers: newTriggers } = field.reduce(
    (acc: TriggerResult, cur) => {
      if (!cur.card.triggers) return acc;
      const triggerFn = cur.card.triggers[trigger];
      if (!triggerFn) return acc;
      const { state, triggers } = triggerFn(
        acc.state,
        cur.owner,
        rng,
        origin,
        cur.card.id
      );
      return { state, triggers: acc.triggers.concat(triggers) };
    },
    { state: originalState, triggers: [] } as TriggerResult
  );
  return newTriggers.reduce(
    (acc, cur) =>
      processTriggers(acc, rng, acc[cur.player].id, cur.trigger, cur.origin),
    newState
  );
}

function getPlayer(state: GameState, playerId: Player["id"]) {
  const player = state.player1.id === playerId ? state.player1 : state.player2;
  if (!player) throw new Error(GAME_LOGIC_FAIL.PLAYER_NOT_FOUND);
  return [
    player,
    state.player1.id === playerId ? "player1" : ("player2" as const),
  ] as const;
}

function getOpponent(state: GameState, playerId: Player["id"]) {
  const opponent =
    state.player1.id === playerId ? state.player2 : state.player1;
  if (!opponent) throw new Error(GAME_LOGIC_FAIL.PLAYER_NOT_FOUND);
  return [
    opponent,
    state.player1.id === playerId ? "player2" : ("player1" as const),
  ] as const;
}

function conditionIsPlayerTurn(state: GameState, playerId: Player["id"]) {
  const result = state.turn === playerId;
  if (!result) throw new Error(GAME_CONDITION_FAIL.NOT_YOUR_TURN);
}

function conditionCanPlayResource(state: GameState, playerId: Player["id"]) {
  const [player] = getPlayer(state, playerId);
  const result = player.hasPlayedResource;
  if (result) throw new Error(GAME_CONDITION_FAIL.HAS_PLAYED_RESOURCE);
}

function conditionHasHandCardSelected(
  state: GameState,
  playerId: Player["id"]
) {
  const [player] = getPlayer(state, playerId);
  const result =
    player.userSelection !== null || Array.isArray(player.userSelection);
  if (!result) throw new Error(GAME_CONDITION_FAIL.NO_CARD_SELECTED);
}

function conditionHasFieldCardsSelected(
  state: GameState,
  playerId: Player["id"]
) {
  const [player] = getPlayer(state, playerId);
  const result =
    Array.isArray(player.userSelection) && player.userSelection.length;
  if (!result) throw new Error(GAME_CONDITION_FAIL.NO_CARD_SELECTED);
}

function conditionCanPlayHandSelectedCard(
  state: GameState,
  playerId: Player["id"]
) {
  conditionHasHandCardSelected(state, playerId);
  const [player] = getPlayer(state, playerId);
  const selectedCard = player.userSelection as GameCard;
  const result =
    player.resource.length - player.resourceSpent >= selectedCard.cost;
  if (!result) throw new Error(GAME_CONDITION_FAIL.NOT_ENOUGH_RESOURCE);
}

function conditionOpponentHasNoProtection(
  state: GameState,
  playerId: Player["id"]
) {
  const opponent =
    state.player1.id === playerId ? state.player2 : state.player1;
  const result = !opponent.protection.length;
  if (!result) throw new Error(GAME_CONDITION_FAIL.OPPONENT_HAS_PROTECTION);
}

function conditionOpponentHasNoField(state: GameState, playerId: Player["id"]) {
  const opponent =
    state.player1.id === playerId ? state.player2 : state.player1;
  const result = !opponent.field.length;
  if (!result) throw new Error(GAME_CONDITION_FAIL.OPPONENT_HAS_FIELD);
}

function actionWin(state: GameState, playerId: Player["id"]): GameState {
  conditionIsPlayerTurn(state, playerId);
  conditionHasFieldCardsSelected(state, playerId);
  conditionOpponentHasNoProtection(state, playerId);
  conditionOpponentHasNoField(state, playerId);
  return {
    ...state,
    winner: playerId,
  };
}

function actionChangeTurn(
  state: GameState,
  rng: RNG,
  playerId: Player["id"]
): GameState {
  conditionIsPlayerTurn(state, playerId);
  const nextPlayer = state.turn === state.player1.id ? "player2" : "player1";
  const currentPlayer = state.turn === state.player1.id ? "player1" : "player2";
  const { drawn, remaining } = draw(state[nextPlayer].deck, 1, rng);
  return processTriggers(
    {
      ...state,
      turn: state[nextPlayer].id,
      turnTimer: GAME_TURN_TIME,
      [nextPlayer]: {
        ...state[nextPlayer],
        hasPlayedResource: false,
        resourceSpent: 0,
        attackedThisTurn: [],
        hand: state[nextPlayer].hand.concat(drawn),
        deck: remaining,
      },
      [currentPlayer]: {
        ...state[currentPlayer],
        userSelection: null,
      },
    },
    rng,
    state[nextPlayer].id,
    GAME_TRIGGER.CARD_DRAWN,
    GAME_MECHANIC
  );
}

function actionTurnTime(state: GameState, rng: RNG): GameState {
  if (state.turnTimer === 0) {
    return actionChangeTurn(
      state,
      rng,
      state.turn === state.player1.id ? state.player1.id : state.player2.id
    );
  }
  return {
    ...state,
    turnTimer: state.turnTimer - 1,
  };
}

function actionPlayResource(
  state: GameState,
  rng: RNG,
  playerId: Player["id"]
): GameState {
  conditionIsPlayerTurn(state, playerId);
  conditionHasHandCardSelected(state, playerId);
  conditionCanPlayResource(state, playerId);
  const [player, playerGameId] = getPlayer(state, playerId);
  const selectedCard = player.userSelection as GameCard;
  return processTriggers(
    {
      ...state,
      [playerGameId]: {
        ...player,
        hasPlayedResource: true,
        resource: player.resource.concat(selectedCard),
        hand: player.hand.filter((card) => card.id !== selectedCard.id),
        userSelection: null,
      },
    },
    rng,
    playerId,
    GAME_TRIGGER.PLAYED_RESOURCE,
    selectedCard.id
  );
}

function actionUserSelect(
  state: GameState,
  playerId: Player["id"],
  target?: GameCard["id"]
) {
  const [player, playerGameId] = getPlayer(state, playerId);
  if (!target) {
    return {
      ...state,
      [playerGameId]: {
        ...player,
        userSelection: null,
      },
    };
  }
  const targetLocation = (["hand", "field"] as const).find((loc) =>
    player[loc].some((card) => card.id === target)
  );
  if (!targetLocation) throw new Error(GAME_LOGIC_FAIL.CARD_NOT_FOUND);
  if (targetLocation === "field") {
    conditionIsPlayerTurn(state, playerId);
    if (player.attackedThisTurn.some((card) => card.id === target)) {
      throw new Error(GAME_CONDITION_FAIL.HAS_ATTACKED_ALREADY);
    }
    const newSelection: GameCard[] = Array.isArray(player.userSelection)
      ? player.userSelection.find((card) => card.id === target)
        ? player.userSelection.filter((card) => card.id !== target)
        : player.userSelection.concat(
            player.field.filter((card) => card.id === target)
          )
      : player.field.filter((card) => card.id === target);
    return {
      ...state,
      [playerGameId]: {
        ...player,
        userSelection: newSelection.length ? newSelection : null,
      },
    };
  }
  return {
    ...state,
    [playerGameId]: {
      ...player,
      userSelection: player.hand.find((card) => card.id === target) || null,
    },
  };
}

function actionPlayCard(
  state: GameState,
  rng: RNG,
  playerId: Player["id"],
  target?: GameCard["id"]
): GameState {
  conditionIsPlayerTurn(state, playerId);
  conditionHasHandCardSelected(state, playerId);
  conditionCanPlayHandSelectedCard(state, playerId);
  const [player, playerGameId] = getPlayer(state, playerId);
  const selectedCard = player.userSelection as GameCard;
  const { state: newState, triggers } = selectedCard.playEffect
    ? selectedCard.playEffect(state, playerGameId, selectedCard.id, rng, target)
    : { state };
  // Cascading triggers from effects.
  const newState2 =
    triggers?.reduce(
      (acc, cur) =>
        processTriggers(acc, rng, acc[cur.player].id, cur.trigger, cur.origin),
      newState
    ) || newState;
  const [newStatePlayer] = getPlayer(newState2, playerId);
  return processTriggers(
    {
      ...newState2,
      [playerGameId]: {
        ...newStatePlayer,
        hand: newStatePlayer.hand.filter((card) => card.id !== selectedCard.id),
        field: newStatePlayer.field.concat(selectedCard),
        resourceSpent: newStatePlayer.resourceSpent + selectedCard.cost,
        userSelection: null,
        attackedThisTurn: newStatePlayer.attackedThisTurn.concat(selectedCard),
      },
    },
    rng,
    playerId,
    GAME_TRIGGER.CARD_PLAYED,
    selectedCard.id
  );
}

function actionAttack(
  state: GameState,
  rng: RNG,
  playerId: Player["id"],
  target: GameCard["id"]
): GameState {
  conditionIsPlayerTurn(state, playerId);
  conditionHasFieldCardsSelected(state, playerId);
  const [player, playerGameId] = getPlayer(state, playerId);
  const [opponent, opponentGameId] = getOpponent(state, playerId);
  const targetCard = opponent.field.find((card) => card.id === target);
  if (!targetCard) throw new Error(GAME_LOGIC_FAIL.TARGET_NOT_FOUND);
  const selectedCards = player.userSelection as GameCard[];
  const selectedCardsPower = selectedCards.reduce(
    (acc, card) => acc + card.power,
    0
  );
  const dyingSelectedCards = selectedCards.filter(
    (card) => card.power <= targetCard.power
  );
  const dyingOpponentCards = opponent.field.filter(
    (card) => card.power <= selectedCardsPower
  );
  const newState = {
    ...state,
    [playerGameId]: {
      ...player,
      userSelection: null,
      field: player.field.filter((card) => !dyingSelectedCards.includes(card)),
      graveyard: player.graveyard.concat(
        dyingSelectedCards.filter((c) => !c.keywords?.includes("revived"))
      ),
      attackedThisTurn: player.attackedThisTurn.concat(selectedCards),
    },
    [opponentGameId]: {
      ...opponent,
      field:
        targetCard.power > selectedCardsPower
          ? opponent.field
          : opponent.field.filter((card) => card.id !== targetCard.id),
      graveyard: opponent.graveyard.concat(
        dyingOpponentCards.filter((c) => !c.keywords?.includes("revived"))
      ),
    },
  };
  const newState2 = selectedCards.reduce((acc, cur) => {
    return processTriggers(
      acc,
      rng,
      player.id,
      GAME_TRIGGER.CARD_ATTACKED,
      cur.id
    );
  }, newState);
  return [
    ...dyingSelectedCards.map((card) => ({ card, owner: player.id })),
    ...dyingOpponentCards.map((card) => ({ card, owner: opponent.id })),
  ].reduce(
    (acc, cur) =>
      processTriggers(acc, rng, cur.owner, GAME_TRIGGER.CARD_DIED, cur.card.id),
    newState2
  );
}

function actionAttackProtection(
  state: GameState,
  rng: RNG,
  playerId: Player["id"],
  target: GameCard["id"]
): GameState {
  conditionIsPlayerTurn(state, playerId);
  conditionHasFieldCardsSelected(state, playerId);
  conditionOpponentHasNoField(state, playerId);
  const [player, playerGameId] = getPlayer(state, playerId);
  const [opponent, opponentGameId] = getOpponent(state, playerId);
  const targetCard = opponent.protection.find((card) => card.id === target);
  if (!targetCard) throw new Error(GAME_LOGIC_FAIL.TARGET_NOT_FOUND);
  const selectedCards = player.userSelection as GameCard[];
  const selectedCardsPower = selectedCards.reduce(
    (acc, card) => acc + card.power,
    0
  );
  if (selectedCardsPower < GAME_PROTECTION_POWER) {
    throw new Error(GAME_CONDITION_FAIL.NOT_ENOUGH_POWER);
  }
  const newState = {
    ...state,
    [playerGameId]: {
      ...player,
      userSelection: null,
      attackedThisTurn: player.attackedThisTurn.concat(selectedCards),
    },
    [opponentGameId]: {
      ...opponent,
      hand: opponent.hand.concat(targetCard),
      protection: opponent.protection.filter(
        (card) => card.id !== targetCard.id
      ),
    },
  };
  const newState2 = selectedCards.reduce((acc, cur) => {
    return processTriggers(
      acc,
      rng,
      player.id,
      GAME_TRIGGER.CARD_ATTACKED,
      cur.id
    );
  }, newState);
  return processTriggers(
    newState2,
    rng,
    player.id,
    GAME_TRIGGER.PROTECTION_DESTROYED,
    targetCard.id
  );
}

function actionForfeit(state: GameState, playerId: Player["id"]) {
  return {
    ...state,
    winner: state.player1.id === playerId ? state.player2.id : state.player1.id,
  };
}

function handlePlayerAction(
  state: GameState,
  rng: RNG,
  action: (typeof GAME_ACTION)[keyof typeof GAME_ACTION],
  playerId: Player["id"],
  target?: GameCard["id"]
): GameState {
  switch (action) {
    case GAME_ACTION.PLAY_RESOURCE:
      return actionPlayResource(state, rng, playerId);
    case GAME_ACTION.PLAY_CARD:
      return actionPlayCard(state, rng, playerId, target);
    case GAME_ACTION.ATTACK:
      if (!target) throw new Error(GAME_LOGIC_FAIL.TARGET_NOT_FOUND);
      return actionAttack(state, rng, playerId, target);
    case GAME_ACTION.ATTACK_PROTECTION:
      if (!target) throw new Error(GAME_LOGIC_FAIL.TARGET_NOT_FOUND);
      return actionAttackProtection(state, rng, playerId, target);
    case GAME_ACTION.END_TURN:
      return actionChangeTurn(state, rng, playerId);
    case GAME_ACTION.USER_SELECT:
      return actionUserSelect(state, playerId, target);
    case GAME_ACTION.WIN:
      return actionWin(state, playerId);
    case GAME_ACTION.FORFEIT:
      return actionForfeit(state, playerId);
    default:
      return state;
  }
}

function init(player1: PlayerInfo, player2: PlayerInfo) {
  const seed = generateSeed();
  const rng = seededRng(seed);
  const { drawn: player1Hand, remaining: remaining1Step } = draw(
    player1.startingDeck.map((card) => ({ ...card, id: V4.uuid() })),
    5,
    rng
  );
  const { drawn: player1Protection, remaining: remaining1 } = draw(
    remaining1Step,
    5,
    rng
  );
  const { drawn: player2Hand, remaining: remaining2Step } = draw(
    player2.startingDeck.map((card) => ({ ...card, id: V4.uuid() })),
    5,
    rng
  );
  const { drawn: player2Protection, remaining: remaining2 } = draw(
    remaining2Step,
    5,
    rng
  );
  const startingPlayer = rng() > 0.5 ? player1 : player2;
  const pawnCard: GameCard = { ...pawn, id: V4.uuid() };
  let state: GameState = {
    seed,
    player1: {
      ...player1,
      deck: remaining1,
      hand: player1Hand,
      protection: player1Protection,
      resource: [],
      field: [...(startingPlayer.id === player1.id ? [] : [pawnCard])],
      graveyard: [],
      attackedThisTurn: [],
      hasPlayedResource: false,
      resourceSpent: 0,
      userSelection: null,
    },
    player2: {
      ...player2,
      deck: remaining2,
      hand: player2Hand,
      protection: player2Protection,
      resource: [],
      field: [...(startingPlayer.id === player2.id ? [] : [pawnCard])],
      graveyard: [],
      attackedThisTurn: [],
      hasPlayedResource: false,
      resourceSpent: 0,
      userSelection: null,
    },
    turn: startingPlayer.id,
    turnTimer: GAME_TURN_TIME,
    winner: null,
  };
  return [
    () => state,
    (ss: (s: GameState) => GameState) => {
      state = ss(state);
      [player1, player2].forEach((player) => {
        if (player.socket.readyState !== player.socket.OPEN) return;
        send({ message: "gameState", state }, player.socket);
      });
    },
    rng,
  ] as const;
}

export function startMatch(db: DB, player1: PlayerInfo, player2: PlayerInfo) {
  const [getState, setState, rng] = init(player1, player2);

  const detachers = [player1, player2].map((player) => {
    const messageHandler = (event: MessageEvent) => {
      const { action, target } = JSON.parse(event.data);
      try {
        setState((state) =>
          handlePlayerAction(state, rng, action, player.id, target)
        );
      } catch (error) {
        send(
          {
            message: "gameError",
            error: (error as Error)
              .message as (typeof GAME_CONDITION_FAIL)[keyof typeof GAME_CONDITION_FAIL],
          },
          player.socket
        );
      }
    };
    player.socket.addEventListener("message", messageHandler);

    const closeHandler = () => {
      setState((state) => actionForfeit(state, player.id));
    };
    player.socket.addEventListener("close", closeHandler);

    return () => {
      player.socket.removeEventListener("message", messageHandler);
      player.socket.removeEventListener("close", closeHandler);
    };
  });

  const gameloop = setInterval(() => {
    setState((state) => actionTurnTime(state, rng));
    if (getState().winner) {
      clearInterval(gameloop);
      detachers.forEach((detach) => detach());
    }
  }, 1000);
}

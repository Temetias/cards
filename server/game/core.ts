import {
  Card,
  GameActionDispatch,
  GameEffectDispatch,
  GameEffectDispatchArguments,
  GameEffectDispatchGetter,
  getCardDefinition,
  isCreature,
  isNonTargeted,
  isSpell,
  isTargeted,
} from "../../shared/cards/index.ts";
import {
  ClientMessage,
  GAME_PLAYER,
  GameTrigger,
  isGameLogicError,
  sendMessage,
} from "../../shared/communication.ts";
import {
  GAME_ACTION,
  GAME_CONDITION_FAILURE,
  GAME_LOGIC_ERROR,
  GAME_TRIGGER,
  GameAction,
  GameConditionFailure,
  GameLogicError,
} from "../../shared/communication.ts";
import { GAME_RULE } from "../../shared/constants.ts";
import {
  cardToResourceCard,
  creatureCardToFieldCreatureCard,
  FieldCreatureCard,
  fieldCreatureCardToCreatureCard,
  GameConditionAssert,
  GameState,
  Player,
  ResourceCard,
  Seed,
  conditionIsPlayerTurn,
  conditionHasHandCardSelected,
  conditionHasFieldCreaturesSelected,
  conditionHasNotPlayedResource,
  conditionIsUserSelectableTarget,
  conditionTargetIsInUserSelection,
  conditionHasEnoughResource,
  conditionOpponentHasNoFieldCreatures,
  isFieldCreature,
  isFieldCreatureSelection,
  getInactivePlayer,
  getActivePlayer,
  getFieldCreatures,
  GameLog,
} from "../../shared/game.ts";
import { User } from "../../shared/user.ts";
import { UUID } from "../../shared/utils.ts";
import { draw, generateSeed, rng, shuffle } from "../../shared/rng.ts";

function withConditions<P extends unknown[], C extends unknown[]>(
  conditions: GameConditionAssert<C>[],
  action: GameActionDispatch<P>,
): (conditionParams: C, actionParams: P) => GameEffectDispatch {
  return (conditionParams, actionParams) => (state: GameState) => {
    for (const condition of conditions) {
      // Variadic tuple parameters. It's complaining about extra params, they're fine on runtime.
      condition(state, ...conditionParams);
    }
    return action(state, ...actionParams);
  };
}
function getObservers(
  state: GameState,
  trigger: GameTrigger,
): { getDispatch: GameEffectDispatchGetter; self: Card["id"] }[] {
  const xs = getFieldCreatures(state)
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
  return [...xs, { getDispatch: loggerObserver, self: "logger" as any }];
}
const actionPlayResource = withConditions(
  [
    conditionIsPlayerTurn,
    conditionHasHandCardSelected,
    conditionHasNotPlayedResource,
  ],
  (state) => {
    const player = getActivePlayer(state);
    const selectedCard = player.userSelection as Card; // Asserted by condition, sad TypeScript noises
    const triggeredEffects = getObservers(
      state,
      GAME_TRIGGER.RESOURCE_PLAYED,
    ).map(({ getDispatch, self }) =>
      getDispatch({
        initiator: selectedCard.id,
        self,
        effectName: GAME_TRIGGER.RESOURCE_PLAYED,
      }),
    );
    const next = {
      ...state,
      players: {
        ...state.players,
        [player.id]: {
          ...player,
          hand: player.hand.filter((c) => c.id !== selectedCard.id),
          resource: [...player.resource, cardToResourceCard(selectedCard)],
          userSelection: null,
          hasPlayedResource: true,
        },
      },
    };
    return [
      next,
      triggeredEffects,
      {
        initiator: GAME_PLAYER,
        self: selectedCard.id,
        effectName: GAME_TRIGGER.RESOURCE_PLAYED,
      },
    ];
  },
);

const actionEndTurn = withConditions([conditionIsPlayerTurn], (state) => {
  const activePlayer = getActivePlayer(state);
  const inactivePlayer = getInactivePlayer(state);
  const [drawn, remaining] = draw(inactivePlayer.deck, 1);
  const next = {
    ...state,
    players: {
      [activePlayer.id]: {
        ...activePlayer,
        userSelection: null,
      },
      [inactivePlayer.id]: {
        ...inactivePlayer,
        hand: [...inactivePlayer.hand, ...drawn],
        deck: remaining,
        hasPlayedResource: false,
        field: inactivePlayer.field.map((fc) => ({ ...fc, attacked: false })),
        resource: inactivePlayer.resource.map((rc) => ({ ...rc, used: false })),
      },
    },
    activePlayer: inactivePlayer.id,
    inactivePlayer: activePlayer.id,
    turnCount: state.turnCount + 1,
    turnTimer: 0,
  };
  const triggeredTurnEndEffects = getObservers(
    state,
    GAME_TRIGGER.TURN_ENDED,
  ).map(({ getDispatch, self }) =>
    getDispatch({
      initiator: GAME_PLAYER,
      self,
      effectName: GAME_TRIGGER.TURN_ENDED,
    }),
  );

  const triggeredDrawEffects = getObservers(state, GAME_TRIGGER.CARD_DRAWN).map(
    ({ getDispatch, self }) =>
      getDispatch({
        initiator: GAME_PLAYER,
        self,
        effectName: GAME_TRIGGER.CARD_DRAWN,
      }),
  );
  return [
    next,
    [...triggeredTurnEndEffects, ...triggeredDrawEffects],
    {
      initiator: GAME_PLAYER,
      self: GAME_PLAYER,
      effectName: GAME_TRIGGER.TURN_ENDED,
    },
  ];
});

const actionUserSelect = withConditions(
  [conditionIsPlayerTurn, conditionIsUserSelectableTarget],
  (state, targetId: Card["id"]) => {
    const player = getActivePlayer(state);
    const targetCard = (player.hand.find((c) => c.id === targetId) ||
      player.field.find((c) => c.id === targetId)) as Card | FieldCreatureCard; // Asserted by condition, sad TypeScript noises
    const next = isFieldCreature(targetCard)
      ? {
          ...state,
          players: {
            ...state.players,
            [player.id]: {
              ...player,
              userSelection: isFieldCreatureSelection(player.userSelection)
                ? [...player.userSelection, targetCard]
                : [targetCard],
            },
          },
        }
      : {
          ...state,
          players: {
            ...state.players,
            [player.id]: {
              ...player,
              userSelection: targetCard,
            },
          },
        };
    return [
      next,
      [],
      {
        initiator: GAME_PLAYER,
        self: targetCard.id,
        effectName: GAME_ACTION.USER_SELECT,
      },
    ];
  },
);

const actionUserUnselect = withConditions(
  [conditionIsPlayerTurn, conditionTargetIsInUserSelection],
  (state, targetId: Card["id"]) => {
    const player = getActivePlayer(state);
    const userSelection = player.userSelection;
    const next = isFieldCreatureSelection(userSelection)
      ? {
          ...state,
          players: {
            ...state.players,
            [player.id]: {
              ...player,
              userSelection: userSelection.filter((c) => c.id !== targetId),
            },
          },
        }
      : {
          ...state,
          players: {
            ...state.players,
            [player.id]: {
              ...player,
              userSelection: null,
            },
          },
        };
    return [
      next,
      [],
      {
        initiator: GAME_PLAYER,
        self: targetId,
        effectName: GAME_ACTION.USER_UNSELECT,
      },
    ];
  },
);

const actionUserClearSelection = withConditions(
  [conditionIsPlayerTurn],
  (state) => {
    const player = getActivePlayer(state);
    const next = {
      ...state,
      players: {
        ...state.players,
        [player.id]: {
          ...player,
          userSelection: null,
        },
      },
    };
    return [
      next,
      [],
      {
        initiator: GAME_PLAYER,
        self: GAME_PLAYER,
        effectName: GAME_ACTION.USER_CLEAR_SELECTION,
      },
    ];
  },
);

const actionAttackProtection = withConditions(
  [
    conditionIsPlayerTurn,
    conditionHasFieldCreaturesSelected,
    conditionOpponentHasNoFieldCreatures,
  ],
  (state, targetId: Card["id"]) => {
    const opponent = getInactivePlayer(state);
    const player = getActivePlayer(state);
    const targetProtection = opponent.protection.find((c) => c.id === targetId);
    if (!targetProtection) {
      throw new Error(GAME_LOGIC_ERROR.CARD_NOT_FOUND);
    }
    const attackingCreatures = player.userSelection as FieldCreatureCard[]; // Asserted by condition, sad TypeScript noises
    const attackingCreaturesPower = attackingCreatures.reduce(
      (sum, c) => sum + c.power,
      0,
    );
    if (attackingCreaturesPower < GAME_RULE.PROTECTION_POWER) {
      throw new Error(GAME_CONDITION_FAILURE.NOT_ENOUGH_POWER);
    }
    const next = {
      ...state,
      players: {
        ...state.players,
        [player.id]: {
          ...player,
          userSelection: null,
          field: player.field.map((fc) =>
            attackingCreatures.find((ac) => ac.id === fc.id)
              ? { ...fc, attacked: true }
              : fc,
          ),
        },
        [opponent.id]: {
          ...opponent,
          protection: opponent.protection.filter((c) => c.id !== targetId),
          hand: [...opponent.hand, targetProtection],
        },
      },
    };
    const triggeredEffectsForProtectionDestroy = getObservers(
      state,
      GAME_TRIGGER.PROTECTION_DESTROYED,
    ).map(({ getDispatch, self }) =>
      getDispatch({
        initiator: targetProtection.id,
        self,
        effectName: GAME_TRIGGER.PROTECTION_DESTROYED,
      }),
    );

    // Every attacking creature triggers "creature got attacked" effects, thus flatMap
    const triggeredEffectsForAttackingCreatures = attackingCreatures.flatMap(
      (ac) =>
        getObservers(state, GAME_TRIGGER.CREATURE_GOT_ATTACKED).map(
          ({ getDispatch, self }) =>
            getDispatch({
              initiator: ac.id,
              self,
              effectName: GAME_TRIGGER.CREATURE_GOT_ATTACKED,
            }),
        ),
    );

    return [
      next,
      [
        ...triggeredEffectsForProtectionDestroy,
        ...triggeredEffectsForAttackingCreatures,
      ],
      {
        initiator: GAME_PLAYER,
        self: targetProtection.id,
        effectName: GAME_ACTION.ATTACK_PROTECTION,
      },
    ];
  },
);

const actionAttackCreature = withConditions(
  [conditionIsPlayerTurn, conditionHasFieldCreaturesSelected],
  (state, targetId: Card["id"]) => {
    const opponent = getInactivePlayer(state);
    const player = getActivePlayer(state);
    const targetCreature = opponent.field.find((c) => c.id === targetId);
    if (!targetCreature) {
      throw new Error(GAME_LOGIC_ERROR.CARD_NOT_FOUND);
    }
    const attackingCreatures = player.userSelection as FieldCreatureCard[]; // Asserted by condition, sad TypeScript noises
    const attackingCreaturesPower = attackingCreatures.reduce(
      (sum, c) => sum + c.power,
      0,
    );
    const survivingAttackers = attackingCreatures.filter(
      (ac) => ac.power > targetCreature.power,
    );
    const dyingAttackers = attackingCreatures.filter(
      (ac) => ac.power <= targetCreature.power,
    );
    const dyingTarget =
      targetCreature.power <= attackingCreaturesPower ? [targetCreature] : []; // Array is nicer to work with for triggered effects
    const attackEffects = attackingCreatures.flatMap((ac) =>
      getObservers(state, GAME_TRIGGER.CREATURE_ATTACKED).map(
        ({ getDispatch, self }) =>
          getDispatch({
            initiator: ac.id,
            self,
            effectName: GAME_TRIGGER.CREATURE_ATTACKED,
          }),
      ),
    );
    const attackedEffects = getObservers(
      state,
      GAME_TRIGGER.CREATURE_GOT_ATTACKED,
    ).map(({ getDispatch, self }) =>
      getDispatch({
        initiator: targetCreature.id,
        self,
        effectName: GAME_TRIGGER.CREATURE_GOT_ATTACKED,
      }),
    );
    const deathEffects = [...dyingAttackers, ...dyingTarget].flatMap((dc) =>
      getObservers(state, GAME_TRIGGER.CREATURE_DIED).map(
        ({ getDispatch, self }) =>
          getDispatch({
            initiator: dc.id,
            self,
            effectName: GAME_TRIGGER.CREATURE_DIED,
          }),
      ),
    );
    const next = {
      ...state,
      players: {
        [player.id]: {
          ...player,
          userSelection: null,
          field: player.field
            .map((fc) =>
              survivingAttackers.find((ac) => ac.id === fc.id)
                ? { ...fc, attacked: true }
                : fc,
            )
            .filter((fc) => !dyingAttackers.find((dc) => dc.id === fc.id)),
          graveyard: [
            ...player.graveyard,
            ...dyingAttackers.map(fieldCreatureCardToCreatureCard),
          ],
        },
        [opponent.id]: {
          ...opponent,
          field: opponent.field.filter(
            (c) => !dyingTarget.find((dc) => dc.id === c.id),
          ),
          graveyard: [
            ...opponent.graveyard,
            ...dyingTarget.map(fieldCreatureCardToCreatureCard),
          ],
        },
      },
    };
    return [
      next,
      [...attackEffects, ...attackedEffects, ...deathEffects],
      {
        initiator: GAME_PLAYER,
        self: targetCreature.id,
        effectName: GAME_ACTION.ATTACK_CREATURE,
      },
    ];
  },
);

function processOnPlayGameEffect(
  card: Card,
  targetId?: Card["id"],
): GameEffectDispatch | null {
  if (isTargeted(card.onPlay)) {
    if (!targetId) {
      throw new Error(GAME_CONDITION_FAILURE.TARGET_NOT_FOUND);
    }
    return card.onPlay.getDispatch({
      initiator: card.id,
      self: card.id,
      target: targetId,
      effectName: GAME_ACTION.PLAY_CARD,
    });
  } else if (isNonTargeted(card.onPlay)) {
    return card.onPlay.getDispatch({
      initiator: card.id,
      self: card.id,
      effectName: GAME_ACTION.PLAY_CARD,
    });
  } else return null;
}

/**
 * You should check for enough resources before calling this function
 */
function processResourceSpending(
  card: Card,
  resource: ResourceCard[],
): ResourceCard[] {
  const usedResource = resource.filter((r) => r.used);
  const availableResource = resource.filter((r) => !r.used);
  return [
    ...usedResource,
    ...availableResource.map((r, index) =>
      index < card.cost ? { ...r, used: true } : r,
    ),
  ];
}

const actionPlayCard = withConditions(
  [
    conditionIsPlayerTurn,
    conditionHasEnoughResource,
    conditionHasHandCardSelected,
  ],
  (state, targetId: Card["id"] | undefined) => {
    const player = getActivePlayer(state);
    const selectedCard = player.userSelection as Card; // Asserted by condition, sad TypeScript noises
    const triggeredEffectFromOnPlay = processOnPlayGameEffect(
      selectedCard,
      targetId,
    );
    const next = {
      ...state,
      players: {
        ...state.players,
        [player.id]: {
          ...player,
          hand: player.hand.filter((c) => c.id !== selectedCard.id),
          field: isCreature(selectedCard)
            ? [...player.field, creatureCardToFieldCreatureCard(selectedCard)]
            : player.field,
          discard: isSpell(selectedCard)
            ? [...player.discard, selectedCard]
            : player.discard,
          userSelection: null,
          resource: processResourceSpending(selectedCard, player.resource),
        },
      },
    };

    const triggeredEffects = getObservers(
      state,
      isCreature(selectedCard)
        ? GAME_TRIGGER.CREATURE_PLAYED
        : GAME_TRIGGER.SPELL_PLAYED,
    ).map(({ getDispatch, self }) =>
      getDispatch({
        initiator: selectedCard.id,
        self,
        effectName: isCreature(selectedCard)
          ? GAME_TRIGGER.CREATURE_PLAYED
          : GAME_TRIGGER.SPELL_PLAYED,
      }),
    );
    return [
      next,
      [
        ...(triggeredEffectFromOnPlay ? [triggeredEffectFromOnPlay] : []),
        ...triggeredEffects,
      ],
      {
        initiator: GAME_PLAYER,
        self: selectedCard.id,
        effectName: GAME_ACTION.PLAY_CARD,
      },
    ];
  },
);

const actionForfeit = withConditions([], (state, playerId) => {
  // Forfeiting can be done at any time, no conditions
  // assign winner to the other player
  const inactivePlayerId = Object.keys(state.players).find(
    (id) => id !== playerId,
  ) as UUID | undefined; // Dunno why typescript cant figure out it's UUID even though it's explicitly the key of state.players
  if (!inactivePlayerId) {
    throw new Error(GAME_LOGIC_ERROR.PLAYER_NOT_FOUND);
  }
  return [
    {
      ...state,
      winner: inactivePlayerId,
    },
    [],
    {
      initiator: GAME_PLAYER,
      self: GAME_PLAYER,
      effectName: GAME_ACTION.FORFEIT,
    },
  ];
});

function processTriggeredEffects(
  state: GameState,
  dispatches: GameEffectDispatch[],
  log: GameLog,
): [GameState, GameLog] {
  if (!dispatches.length) return [state, log];
  const [dispatch, ...restDispatches] = dispatches;
  const dispatchResult = dispatch(state);
  if (!dispatchResult)
    return processTriggeredEffects(state, restDispatches, log);
  const [nextState, nextDispatches, dispatchArgs] = dispatchResult;
  return processTriggeredEffects(
    nextState,
    [...restDispatches, ...nextDispatches],
    [...log, { ...dispatchArgs, state: nextState }],
  );
}

function handlePlayerAction(
  state: GameState,
  action: GameAction,
  playerId: Player["id"],
  targetId?: Card["id"],
): [GameState, GameLog] {
  const dispatch = (() => {
    switch (action) {
      case GAME_ACTION.END_TURN:
        return actionEndTurn([playerId], []);

      case GAME_ACTION.PLAY_RESOURCE:
        return actionPlayResource([playerId], []);

      case GAME_ACTION.USER_SELECT:
        if (!targetId) throw new Error(GAME_LOGIC_ERROR.NO_TARGET_DEFINED);
        return actionUserSelect([playerId, targetId], [targetId]);

      case GAME_ACTION.USER_UNSELECT:
        if (!targetId) throw new Error(GAME_LOGIC_ERROR.NO_TARGET_DEFINED);
        return actionUserUnselect([playerId, targetId], [targetId]);

      case GAME_ACTION.USER_CLEAR_SELECTION:
        return actionUserClearSelection([playerId], []);

      case GAME_ACTION.PLAY_CARD:
        return actionPlayCard([playerId], [targetId]);

      case GAME_ACTION.FORFEIT:
        return actionForfeit([playerId], [playerId]);

      case GAME_ACTION.ATTACK_PROTECTION:
        if (!targetId) throw new Error(GAME_LOGIC_ERROR.NO_TARGET_DEFINED);
        return actionAttackProtection([playerId], [targetId]);

      case GAME_ACTION.ATTACK_CREATURE:
        if (!targetId) throw new Error(GAME_LOGIC_ERROR.NO_TARGET_DEFINED);
        return actionAttackCreature([playerId], [targetId]);

      default:
        throw new Error(GAME_LOGIC_ERROR.UNKNOWN_ACTION);
    }
  })();
  return processTriggeredEffects(state, [dispatch], []);
}

function initPlayer(
  { activeDeck, id, name }: User,
  seed: Seed,
): [player: Player, seed: Seed] {
  const startingDeck = activeDeck.cards.map((c) => ({
    ...getCardDefinition(c.definitionId),
    id: c.id,
  }));
  const [shuffledDeck, nextSeed] = shuffle(startingDeck, seed);
  const [hand, tempDeck] = draw(shuffledDeck, 5);
  const [protection, deck] = draw(tempDeck, 5);
  return [
    {
      id,
      name,
      startingDeck,
      deck,
      hand,
      protection,
      resource: [],
      graveyard: [],
      discard: [],
      field: [],
      userSelection: null,
      hasPlayedResource: false,
    },
    nextSeed,
  ];
}

function init(
  user1: User,
  user2: User,
): [
  getState: () => GameState,
  setState: (action: (s: GameState) => [GameState, GameLog]) => void,
] {
  const initialSeed = generateSeed();
  const [player1, tempSeed1] = initPlayer(user1, initialSeed);
  const [player2, tempSeed2] = initPlayer(user2, tempSeed1);
  const [val, currentSeed] = rng(tempSeed2);
  const activePlayer = val < 0.5 ? player1.id : player2.id;
  const inactivePlayer = val < 0.5 ? player2.id : player1.id;
  let state: GameState = {
    rng: {
      initialSeed,
      currentSeed,
    },
    players: {
      [player1.id]: player1,
      [player2.id]: player2,
    },
    activePlayer,
    inactivePlayer,
    turnTimer: 0,
    turnCount: 0,
    winner: null,
  };
  let log: GameLog = [];
  return [
    () => state,
    (action) => {
      const [nextState, nextLog] = action(state);
      state = nextState;
      log = nextLog; // Client can build a complete log if they need.
      [user1, user2].forEach((user) => {
        if (user.socket.readyState !== WebSocket.OPEN) return;
        sendMessage({ message: "GAME_STATE_UPDATE", state, log }, user.socket);
      });
    },
  ];
}

export function startMatch(user1: User, user2: User) {
  const [getState, setState] = init(user1, user2);
  // Send initial game state to both players
  setState((s) => [s, []]);

  const detachers = [user1, user2].map((user) => {
    const messageHandler = (event: MessageEvent) => {
      const { action, targetId } = JSON.parse(event.data) as ClientMessage;
      try {
        setState((s) => handlePlayerAction(s, action, user.id, targetId));
      } catch (e) {
        const error = (e as Error).message as
          | GameLogicError
          | GameConditionFailure;
        if (isGameLogicError(error)) {
          console.error("Game logic error:", error);
          sendMessage(
            {
              message: "GAME_LOGIC_ERROR",
              error,
            },
            user.socket,
          );
        } else {
          sendMessage(
            {
              message: "GAME_CONDITION_FAILURE",
              error,
            },
            user.socket,
          );
        }
      }
    };
    user.socket.addEventListener("message", messageHandler);
    const closeHandler = () => {
      setState((s) => handlePlayerAction(s, GAME_ACTION.FORFEIT, user.id));
    };
    user.socket.addEventListener("close", closeHandler);
    return () => {
      user.socket.removeEventListener("message", messageHandler);
      user.socket.removeEventListener("close", closeHandler);
    };
  });
  // Todo game loop for turn timer.
}

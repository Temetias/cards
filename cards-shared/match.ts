import { Card, GameCard } from "./cards/types.ts";

export type PlayerInfo = {
  id: string;
  socket: WebSocket;
  startingDeck: Card[];
};

export type Player = PlayerInfo & {
  // cards
  deck: GameCard[];
  hand: GameCard[];
  protection: GameCard[];
  resource: GameCard[];
  field: GameCard[];
  graveyard: GameCard[];
  // state
  hasPlayedResource: boolean;
  resourceSpent: number;
  userSelection: GameCard | GameCard[] | null;
  attackedThisTurn: GameCard[];
};

export type GameState = {
  seed: number;
  player1: Player;
  player2: Player;
  turn: Player["id"];
  turnTimer: number;
  winner: Player["id"] | null;
};

export const GAME_MECHANIC = "gameMechanic";

export const GAME_ACTION = {
  PLAY_RESOURCE: "playResource",
  PLAY_CARD: "playCard",
  ATTACK: "attack",
  ATTACK_PROTECTION: "attackProtection",
  END_TURN: "endTurn",
  USER_SELECT: "userSelect",
  WIN: "win",
  FORFEIT: "forfeit",
} as const;

export const GAME_CONDITION_FAIL = {
  NOT_YOUR_TURN: "notYourTurn",
  NOT_ENOUGH_RESOURCE: "notEnoughResource",
  HAS_PLAYED_RESOURCE: "hasPlayedResource",
  NO_CARD_SELECTED: "noCardSelected",
  NOT_TARGETING_FIELD_CARD: "notTargetingFieldCard",
  NOT_ENOUGH_POWER: "notEnoughPower",
  OPPONENT_HAS_PROTECTION: "opponentHasProtection",
  OPPONENT_HAS_FIELD: "opponentHasField",
  HAS_ATTACKED_ALREADY: "hasAttackedAlready",
} as const;

export const GAME_TRIGGER = {
  PLAYED_RESOURCE: "playedResource",
  CARD_DIED: "cardDied",
  CARD_ATTACKED: "cardAttacked",
  CARD_PLAYED: "cardPlayed",
  CARD_DRAWN: "cardDrawn",
  REVIVED_CARD: "revivedCard",
  PROTECTION_DESTROYED: "protectionDestroyed",
} as const;

export type TriggerParams = {
  trigger: (typeof GAME_TRIGGER)[keyof typeof GAME_TRIGGER];
  player: "player1" | "player2";
  origin: GameCard["id"];
  self: GameCard["id"];
};

export type TriggerResult = {
  state: GameState;
  triggers: TriggerParams[];
};

export const GAME_LOGIC_FAIL = {
  PLAYER_NOT_FOUND: "playerNotFound",
  CARD_NOT_FOUND: "cardNotFound",
  TARGET_NOT_FOUND: "targetNotFound",
} as const;

export type ServerMessage =
  | {
      message: "gameState";
      state: GameState;
    }
  | {
      message: "gameError";
      error:
        | (typeof GAME_CONDITION_FAIL)[keyof typeof GAME_CONDITION_FAIL]
        | (typeof GAME_LOGIC_FAIL)[keyof typeof GAME_LOGIC_FAIL];
    };

export type ClientMessage = {
  action: (typeof GAME_ACTION)[keyof typeof GAME_ACTION];
  target?: GameCard["id"];
};

export function draw(
  cards: GameCard[],
  amount: number,
  rng: () => number
): { drawn: GameCard[]; remaining: GameCard[] } {
  const drawn: GameCard[] = [];
  const remaining = [...cards];
  for (let i = 0; i < amount; i++) {
    if (remaining.length === 0) {
      break;
    }
    const randomIndex = Math.floor(rng() * remaining.length);
    const [card] = remaining.splice(randomIndex, 1);
    drawn.push(card);
  }
  return { drawn, remaining };
}

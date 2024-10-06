import { Card, CreatureGameCard, GameCard } from "./cards/types.ts";
import { Hero } from "./heroes/types.ts";

export type PlayerInfo = {
  id: string;
  socket: WebSocket;
  startingDeck: Card[];
};

export type Player = PlayerInfo & {
  hero: Hero;
  deck: GameCard[];
  hand: GameCard[];
  protection: GameCard[];
  resource: GameCard[];
  heroCharges: number;
  field: CreatureGameCard[];
  graveyard: CreatureGameCard[];
  hasPlayedResource: boolean;
  hasChargedHero: boolean;
  resourceSpent: number;
  userSelection: GameCard | GameCard[] | null;
  attackedThisTurn: CreatureGameCard[];
};

export type GameState = {
  seed: number;
  player1: Player;
  player2: Player;
  turn: Player["id"];
  turnTimer: number;
  winner: Player["id"] | null;
  triggers: (TriggerParams & {
    /**
     * Used by the client to combine multiple triggers into one animation.
     */
    id: string;
  })[];
};

export const GAME_TURN_TIME = 90;
export const GAME_PROTECTION_POWER = 30;
export const HERO_CHARGE_COST = 2;

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
  HERO_CHARGE: "heroCharge",
  HERO_PLAY: "heroPlay",
} as const;

export const GAME_CONDITION_FAIL = {
  NOT_YOUR_TURN: "notYourTurn",
  NOT_ENOUGH_RESOURCE: "notEnoughResource",
  HAS_PLAYED_RESOURCE: "hasPlayedResource",
  HAS_CHARGED_HERO: "hasChargedHero",
  NOT_ENOUGH_CHARGES: "notEnoughCharges",
  NO_CARD_SELECTED: "noCardSelected",
  NOT_TARGETING_FIELD_CARD: "notTargetingFieldCard",
  NOT_ENOUGH_POWER: "notEnoughPower",
  OPPONENT_HAS_PROTECTION: "opponentHasProtection",
  OPPONENT_HAS_FIELD: "opponentHasField",
  HAS_ATTACKED_ALREADY: "hasAttackedAlready",
  BRAVE_PRIORITY: "bravePriority",
  COWARDLY_PRIORITY: "cowardlyPriority",
} as const;

export const GAME_TRIGGER = {
  PLAYED_RESOURCE: "playedResource",
  CARD_DIED: "cardDied",
  CARD_ATTACKED: "cardAttacked",
  CARD_WAS_ATTACKED: "cardWasAttacked",
  CARD_PLAYED: "cardPlayed",
  CARD_DRAWN: "cardDrawn",
  REVIVED_CARD: "revivedCard",
  PROTECTION_DESTROYED: "protectionDestroyed",
  HERO_CHARGED: "heroCharged",
  HERO_POWER_USED: "heroPowerUsed",
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
  ATTACK_WITH_SPELL: "attackWithSpell",
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

import {
  GAME_LOGIC_ERROR,
  GAME_MECHANIC,
  GAME_PLAYER,
  type GameAction,
  type GameTrigger,
} from "../communication.ts";
// circular dependency, dunno how to avoid it yet or if it's even a problem
import type { GameState } from "../game.ts";
import {
  brand,
  type Brand,
  type Identified,
  type Named,
  type Nullable,
  type Typed,
} from "../utils.ts";
import { ghoul } from "./ghoul.ts";
import { imp } from "./imp.ts";
import { reaper } from "./reaper.ts";

export type GameEffectDispatchArguments = {
  effectName: GameTrigger | GameAction;
  initiator: Card["id"] | typeof GAME_MECHANIC | typeof GAME_PLAYER;
  self: Card["id"] | typeof GAME_MECHANIC | typeof GAME_PLAYER;
  target?: Card["id"];
};

export type GameEffectDispatch = (
  state: GameState,
) =>
  | [
      state: GameState,
      triggeredEffects: GameEffectDispatch[],
      args: GameEffectDispatchArguments,
    ]
  | null;

export type GameActionDispatch<P extends unknown[] = []> = (
  state: GameState,
  ...params: P
) => [
  state: GameState,
  triggeredEffects: GameEffectDispatch[],
  args: GameEffectDispatchArguments,
];

export type GameEffectDispatchGetter = (
  args: GameEffectDispatchArguments,
) => GameEffectDispatch;

export type GameEffectNonTargeted = Typed<"NON_TARGETED"> & {
  getDispatch: GameEffectDispatchGetter;
};

export type GameEffectTargeted = Typed<"TARGETED"> & {
  getDispatch: GameEffectDispatchGetter;
};

export type GameEffect = GameEffectNonTargeted | GameEffectTargeted;
export function isTargeted(
  gameEffect: GameEffect | null,
): gameEffect is GameEffectTargeted {
  return gameEffect?.type === "TARGETED";
}
export function isNonTargeted(
  gameEffect: GameEffect | null,
): gameEffect is GameEffectNonTargeted {
  return gameEffect?.type === "NON_TARGETED";
}

export type CardDefinitionId = Brand<string, "CARD_DEFINITION_ID">;
export function cardDefinitionId(id: string): CardDefinitionId {
  return brand(id, "CARD_DEFINITION_ID");
}

type CommonKeyword = "";
type CreatureKeyword = CommonKeyword | "";
type SpellKeyword = CommonKeyword | "";

type CardInfo = Identified &
  Named & {
    definitionId: CardDefinitionId;
    description: string;
    cost: number;
    onPlay: Nullable<GameEffect>;
  };

export type CreatureCard = CardInfo &
  Typed<"CREATURE"> & {
    triggers: Partial<Record<GameTrigger, GameEffectNonTargeted>>;
    power: number;
    keywords: CreatureKeyword[];
  };

export type CreatureCardDefintion = Omit<CreatureCard, "id">;

export type SpellCard = CardInfo &
  Typed<"SPELL"> & {
    keywords: SpellKeyword[];
  };

export type SpellCardDefintion = Omit<SpellCard, "id">;

type CardDefinition = CreatureCardDefintion | SpellCardDefintion;

export type Card = CreatureCard | SpellCard;
export function isCreature(card: Card): card is CreatureCard {
  return card.type === "CREATURE";
}
export function isSpell(card: Card): card is SpellCard {
  return card.type === "SPELL";
}

export const CARD_DEFINITIONS: Record<CardDefinitionId, CardDefinition> = {
  [imp.definitionId]: imp,
  [ghoul.definitionId]: ghoul,
  [reaper.definitionId]: reaper,
} as const;

export function getCardDefinition(
  definitionId: CardDefinitionId,
): CardDefinition {
  if (!(definitionId in CARD_DEFINITIONS)) {
    throw new Error(GAME_LOGIC_ERROR.CARD_DEFINITION_NOT_FOUND);
  }
  return CARD_DEFINITIONS[definitionId];
}

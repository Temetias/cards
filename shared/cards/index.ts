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
import { leechingbat } from "./leechingbat.ts";
import { polarbear } from "./polarbear.ts";
import { bolster } from "./bolster.ts";
import { butcher } from "./butcher.ts";
import { chort } from "./chort.ts";
import { cosmosWalker } from "./cosmoswalker.ts";
import { doom } from "./doom.ts";
import { beasttamer } from "./beasttamer.ts";
import { farseer } from "./farseer.ts";
import { firelash } from "./firelash.ts";
import { ghoul } from "./ghoul.ts";
import { peskyimp } from "./peskyimp.ts";
import { pawn } from "./pawn.ts";
import { reaper } from "./reaper.ts";
import { summoner } from "./summoner.ts";
import { warg } from "./warg.ts";
import { FACTIONS } from "./factions.ts";
import { caverat } from "./caverat.ts";
import { fieryfiend } from "./fieryfiend.ts";
import { tundracat } from "./tundracat.ts";
import { emberwolf } from "./emberwolf.ts";
import { arachnid } from "./arachnid.ts";
import { spriggan } from "./spriggan.ts";
import { lonelyarcher } from "./lonelyarcher.ts";
import { spiritbunny } from "./spiritbunny.ts";
import { whitestag } from "./whitestag.ts";
import { royalknight } from "./royalknight.ts";
import { whitewolf } from "./whitewolf.ts";
import { stablemaster } from "./stablemaster.ts";
import { ravenousbear } from "./ravenousbear.ts";

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

export type Faction = (typeof FACTIONS)[keyof typeof FACTIONS];

type CardInfo = Identified &
  Named & {
    definitionId: CardDefinitionId;
    description: string[];
    cost: number;
    onPlay: Nullable<GameEffect>;
    faction: Faction;
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
  [peskyimp.definitionId]: peskyimp,
  [ghoul.definitionId]: ghoul,
  [reaper.definitionId]: reaper,
  [firelash.definitionId]: firelash,
  [butcher.definitionId]: butcher,
  [pawn.definitionId]: pawn,
  [cosmosWalker.definitionId]: cosmosWalker,
  [doom.definitionId]: doom,
  [bolster.definitionId]: bolster,
  [summoner.definitionId]: summoner,
  [chort.definitionId]: chort,
  [farseer.definitionId]: farseer,
  [leechingbat.definitionId]: leechingbat,
  [polarbear.definitionId]: polarbear,
  [warg.definitionId]: warg,
  [beasttamer.definitionId]: beasttamer,
  [caverat.definitionId]: caverat,
  [fieryfiend.definitionId]: fieryfiend,
  [tundracat.definitionId]: tundracat,
  [emberwolf.definitionId]: emberwolf,
  [arachnid.definitionId]: arachnid,
  [spriggan.definitionId]: spriggan,
  [lonelyarcher.definitionId]: lonelyarcher,
  [spiritbunny.definitionId]: spiritbunny,
  [whitestag.definitionId]: whitestag,
  [royalknight.definitionId]: royalknight,
  [whitewolf.definitionId]: whitewolf,
  [stablemaster.definitionId]: stablemaster,
  [ravenousbear.definitionId]: ravenousbear,
} as const;

export function getCardDefinition(
  definitionId: CardDefinitionId,
): CardDefinition {
  if (!(definitionId in CARD_DEFINITIONS)) {
    console.error(`Card definition not found for id: ${definitionId}`);
    throw new Error(GAME_LOGIC_ERROR.CARD_DEFINITION_NOT_FOUND);
  }
  return CARD_DEFINITIONS[definitionId];
}

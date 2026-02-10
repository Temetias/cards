import { createContext } from "react";
import type { GameState, Player } from "../../shared/game.ts";
import type { UUID } from "../../shared/utils.ts";
import type { AnimatedGameState } from "../hooks/useAnimationEngine.ts";
import type { CreatureCard } from "../../shared/cards/index.ts";

export const GameStateContext = createContext<{
  gameState: AnimatedGameState;
  playerUserSelection: Player["userSelection"];
  opponentUserSelection: Player["userSelection"];
}>(
  {} as {
    gameState: AnimatedGameState;
    playerUserSelection: Player["userSelection"];
    opponentUserSelection: Player["userSelection"];
  },
);

export function getOpponent(gs: AnimatedGameState, userId: UUID) {
  const playerIds: UUID[] = Object.keys(gs.players) as UUID[];
  const opponentId = playerIds.find((id) => id !== userId);
  if (!opponentId) throw new Error("Opponent not found");
  return gs.players[opponentId];
}

export function hasCreatureWithTargetedOnPlaySelected(
  userSelection: Player["userSelection"],
): userSelection is CreatureCard {
  if (userSelection === null) return false;
  if (Array.isArray(userSelection)) return false;
  return userSelection.onPlay?.type === "TARGETED";
}

export function getPlayer(gs: AnimatedGameState, userId: UUID) {
  const player = gs.players[userId];
  if (!player) throw new Error("Player not found");
  return player;
}

export function getAvailableResource(gs: AnimatedGameState, userId: UUID) {
  return getPlayer(gs, userId).resource.filter((r) => !r.used).length;
}

export function getUserSelectionType(selection: Player["userSelection"]) {
  if (selection === null) return null;
  if (Array.isArray(selection)) return "FIELD_CREATURES";
  return "HAND_CARD";
}

export function isUserSelected(
  selection: Player["userSelection"],
  cardId: UUID,
) {
  if (selection === null) return false;
  if (Array.isArray(selection)) {
    return selection.some((card) => card.id === cardId);
  }
  return selection.id === cardId;
}

export function isMyTurn(gs: AnimatedGameState | GameState, userId: UUID) {
  return gs.activePlayer === userId;
}

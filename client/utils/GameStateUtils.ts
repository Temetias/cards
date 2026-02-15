import { createContext } from "react";
import type {
  ClientGameState,
  ClientHandCard,
  ClientPlayer,
  GameState,
} from "../../shared/game.ts";
import type { UUID } from "../../shared/utils.ts";
import type { AnimatedGameState } from "../hooks/useAnimationEngine.ts";

export const GameStateContext = createContext<{
  gameState: AnimatedGameState;
  playerUserSelection: ClientPlayer["userSelection"];
  opponentUserSelection: ClientPlayer["userSelection"];
}>(
  {} as {
    gameState: AnimatedGameState;
    playerUserSelection: ClientPlayer["userSelection"];
    opponentUserSelection: ClientPlayer["userSelection"];
  },
);

export function getOpponent(gs: AnimatedGameState | GameState, userId: UUID) {
  const playerIds: UUID[] = Object.keys(gs.players) as UUID[];
  const opponentId = playerIds.find((id) => id !== userId);
  if (!opponentId) throw new Error("Opponent not found");
  return gs.players[opponentId];
}

export function hasCreatureWithTargetedOnPlaySelected(
  userSelection: ClientPlayer["userSelection"],
): userSelection is Omit<ClientHandCard, "type"> & { type: "CREATURE" } {
  if (userSelection === null) return false;
  if (Array.isArray(userSelection)) return false;
  return (
    userSelection.onPlay?.type === "TARGETED" &&
    userSelection.type === "CREATURE"
  );
}

export function getPlayer(gs: AnimatedGameState, userId: UUID) {
  const player = gs.players[userId];
  if (!player) throw new Error("Player not found");
  return player;
}

export function getAvailableResource(gs: AnimatedGameState, userId: UUID) {
  return getPlayer(gs, userId).resource.filter((r) => !r.used).length;
}

export function getUserSelectionType(selection: ClientPlayer["userSelection"]) {
  if (selection === null) return null;
  if (Array.isArray(selection)) return "FIELD_CREATURES";
  return "HAND_CARD";
}

export function isUserSelected(
  selection: ClientPlayer["userSelection"],
  cardId: UUID,
) {
  if (selection === null) return false;
  if (Array.isArray(selection)) {
    return selection.some((card) => card.id === cardId);
  }
  return selection.id === cardId;
}

export function isMyTurn(
  gs: AnimatedGameState | ClientGameState,
  userId: UUID,
) {
  return gs.activePlayer === userId;
}

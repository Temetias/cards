import { cloneElement, forwardRef, isValidElement, useEffect } from "react";
import { useUser } from "./login.tsx";
import "./game.css";
import { useAnimationEngine } from "../hooks/useAnimationEngine.ts";
import type { Card } from "../../shared/cards/index.ts";
import {
  GameStateContext,
  getAvailableResource,
  getOpponent,
  getPlayer,
  getUserSelectionType,
  isMyTurn,
  isUserSelected,
} from "../utils/GameStateUtils.ts";
import { PreviewDisplayer } from "../components/PreviewDisplayer/PreviewDisplayer.tsx";
import type { Nullable } from "../../shared/utils.ts";
import { CardDisplayer } from "../components/CardDisplayer/CardDisplayer.tsx";

function GameBoard({
  children,
  showFieldHighlight,
  showResourceHighlight,
  onFieldClick,
  onResourceClick,
  onEndTurnClick,
  inspectedCard,
  playerResource,
  opponentResource,
}: {
  children: React.ReactNode;
  showResourceHighlight: boolean;
  showFieldHighlight: boolean;
  onFieldClick: () => void;
  onResourceClick: () => void;
  onEndTurnClick: (() => void) | null;
  inspectedCard?: Nullable<Card>;
  playerResource: [available: number, total: number];
  opponentResource: [available: number, total: number];
}) {
  return (
    <div className="GameBoard">
      {showFieldHighlight && (
        <div className="GameBoard-Field" onClick={onFieldClick}>
          field
        </div>
      )}
      {showResourceHighlight && (
        <div className="GameBoard-Resource" onClick={onResourceClick}>
          resource
        </div>
      )}
      <div className="GameBoard-Resource-Indicator-Player">
        {playerResource[0]} / {playerResource[1]}
      </div>
      <div className="GameBoard-Resource-Indicator-Opponent">
        {opponentResource[0]} / {opponentResource[1]}
      </div>
      {children}

      {inspectedCard && (
        <div className="GameBoard-Inspector">
          <CardDisplayer
            showCost
            showPower
            showDetails
            showIcons
            card={inspectedCard}
          />
        </div>
      )}

      <button
        type="button"
        className="end-turn-button"
        disabled={onEndTurnClick === null}
        onClick={onEndTurnClick ?? undefined}
      >
        End turn
      </button>
    </div>
  );
}

export default function Game() {
  const user = useUser();
  if (!user) return <div>Unauthorized</div>;

  const [
    gameState,
    sendMessage,
    currentLogItem,
    playerUserSelection,
    opponentUserSelection,
  ] = useAnimationEngine(user.id);

  // Listen escape key to unselect
  useEffect(() => {
    function onEscKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        sendMessage({ action: "USER_CLEAR_SELECTION" });
      }
    }
    document.addEventListener("keydown", onEscKeyDown);
    return () => {
      document.removeEventListener("keydown", onEscKeyDown);
    };
  }, [sendMessage]);

  return gameState ? (
    <GameStateContext
      value={{ gameState, playerUserSelection, opponentUserSelection }}
    >
      <GameBoard
        playerResource={[
          getAvailableResource(gameState, user.id),
          getPlayer(gameState, user.id).resource.length,
        ]}
        opponentResource={[
          getAvailableResource(gameState, getOpponent(gameState, user.id).id),
          getOpponent(gameState, user.id).resource.length,
        ]}
        showResourceHighlight={
          currentLogItem === null &&
          getUserSelectionType(playerUserSelection) === "HAND_CARD" &&
          !getPlayer(gameState, user.id).hasPlayedResource
        }
        showFieldHighlight={
          currentLogItem === null &&
          getUserSelectionType(playerUserSelection) === "HAND_CARD" &&
          getPlayer(gameState, user.id).resource.filter(
            (res) => res.used === false,
          ).length >= (playerUserSelection as Card).cost
        }
        onFieldClick={() => sendMessage({ action: "PLAY_CARD" })}
        onResourceClick={() => sendMessage({ action: "PLAY_RESOURCE" })}
        onEndTurnClick={
          isMyTurn(gameState, user.id)
            ? () => sendMessage({ action: "END_TURN" })
            : null
        }
        inspectedCard={getOpponent(gameState, user.id).hand.find(
          (card) =>
            (currentLogItem?.effectName === "CREATURE_PLAYED" ||
              currentLogItem?.effectName === "SPELL_PLAYED") &&
            currentLogItem?.initiator === card.id,
        )}
      >
        {[
          ...getOpponent(gameState, user.id).startingDeck,
          ...getPlayer(gameState, user.id).startingDeck,
        ].map((card) => {
          const opponent = getOpponent(gameState, user.id);
          const player = getPlayer(gameState, user.id);
          switch (true) {
            case !!opponent.graveyard.find((c) => c.id === card.id):
              return (
                <Positioner
                  key={card.id}
                  {...opponentGraveyardPosition({
                    index: opponent.graveyard.findIndex(
                      (c) => c.id === card.id,
                    ),
                    total: opponent.graveyard.length,
                  })}
                >
                  <CardDisplayer
                    card={card}
                    fieldAnimations={{ death: true }}
                  />
                </Positioner>
              );
            case !!player.graveyard.find((c) => c.id === card.id):
              return (
                <Positioner
                  key={card.id}
                  {...playerGraveyardPosition({
                    index: player.graveyard.findIndex((c) => c.id === card.id),
                    total: player.graveyard.length,
                  })}
                >
                  <CardDisplayer
                    card={card}
                    fieldAnimations={{ death: true }}
                  />
                </Positioner>
              );
            case !!opponent.deck.find((c) => c.id === card.id):
              return (
                <Positioner
                  key={card.id}
                  {...opponentDeckPosition({
                    index: opponent.deck.findIndex((c) => c.id === card.id),
                    total: opponent.deck.length,
                  })}
                >
                  <CardDisplayer card={card} flipside />
                </Positioner>
              );
            case !!player.deck.find((c) => c.id === card.id):
              return (
                <Positioner
                  key={card.id}
                  {...playerDeckPosition({
                    index: player.deck.findIndex((c) => c.id === card.id),
                    total: player.deck.length,
                  })}
                >
                  <CardDisplayer card={card} flipside />
                </Positioner>
              );
            case !!opponent.protection.find((c) => c.id === card.id):
              return (
                <Positioner
                  key={card.id}
                  {...opponentProtectionPosition({
                    index: opponent.protection.findIndex(
                      (c) => c.id === card.id,
                    ),
                  })}
                >
                  <CardDisplayer
                    card={card}
                    flipside
                    onClick={() =>
                      sendMessage({
                        action: "ATTACK_PROTECTION",
                        targetId: card.id,
                      })
                    }
                  />
                </Positioner>
              );
            case !!player.protection.find((c) => c.id === card.id):
              return (
                <Positioner
                  key={card.id}
                  {...playerProtectionPosition({
                    index: player.protection.findIndex((c) => c.id === card.id),
                  })}
                >
                  <CardDisplayer card={card} flipside />
                </Positioner>
              );
            case !!opponent.resource.find((c) => c.id === card.id):
              return (
                <Positioner
                  key={card.id}
                  {...opponentResourcePosition({
                    index: opponent.resource.findIndex((c) => c.id === card.id),
                    total: opponent.resource.length,
                  })}
                >
                  <CardDisplayer card={card} />
                </Positioner>
              );
            case !!player.resource.find((c) => c.id === card.id):
              return (
                <Positioner
                  key={card.id}
                  {...playerResourcePosition({
                    index: player.resource.findIndex((c) => c.id === card.id),
                    total: player.resource.length,
                  })}
                >
                  <CardDisplayer card={card} />
                </Positioner>
              );
            case !!opponent.field.find((c) => c.id === card.id):
              return (
                <Positioner
                  key={card.id}
                  {...opponentFieldPosition({
                    index: opponent.field.findIndex((c) => c.id === card.id),
                    total: opponent.field.length,
                  })}
                >
                  <CardDisplayer
                    card={opponent.field.find((c) => c.id === card.id)!}
                    showIcons
                    showPower
                    fieldAnimations={{
                      trigger:
                        currentLogItem?.self === card.id &&
                        currentLogItem?.initiator !== "GAME_PLAYER",
                      attack:
                        currentLogItem?.initiator === card.id &&
                        currentLogItem?.effectName === "CREATURE_ATTACKED",
                      defend:
                        currentLogItem?.initiator === card.id &&
                        currentLogItem?.effectName === "CREATURE_GOT_ATTACKED",
                      death:
                        currentLogItem?.initiator === card.id &&
                        currentLogItem?.effectName === "CREATURE_DIED",
                    }}
                    selection={
                      isUserSelected(opponentUserSelection, card.id)
                        ? "OPPONENT"
                        : null
                    }
                    onClick={() =>
                      getUserSelectionType(playerUserSelection) === "HAND_CARD"
                        ? sendMessage({
                            action: "PLAY_CARD",
                            targetId: card.id,
                          })
                        : sendMessage({
                            action: "ATTACK_CREATURE",
                            targetId: card.id,
                          })
                    }
                  />
                </Positioner>
              );
            case !!player.field.find((c) => c.id === card.id):
              return (
                <Positioner
                  key={card.id}
                  {...playerFieldPosition({
                    index: player.field.findIndex((c) => c.id === card.id),
                    total: player.field.length,
                  })}
                >
                  <CardDisplayer
                    card={player.field.find((c) => c.id === card.id)!}
                    playable={
                      isMyTurn(gameState, user.id) &&
                      !playerUserSelection &&
                      !player.field.find((c) => c.id === card.id)?.attacked
                    }
                    showPower
                    showIcons
                    fieldAnimations={{
                      trigger:
                        currentLogItem?.self === card.id &&
                        currentLogItem?.initiator !== "GAME_PLAYER",
                      attack:
                        currentLogItem?.initiator === card.id &&
                        currentLogItem?.effectName === "CREATURE_ATTACKED",
                      defend:
                        currentLogItem?.initiator === card.id &&
                        currentLogItem?.effectName === "CREATURE_GOT_ATTACKED",
                      death:
                        currentLogItem?.initiator === card.id &&
                        currentLogItem?.effectName === "CREATURE_DIED",
                    }}
                    selection={
                      isUserSelected(playerUserSelection, card.id)
                        ? "PLAYER"
                        : null
                    }
                    onClick={() =>
                      sendMessage({
                        action: isUserSelected(playerUserSelection, card.id)
                          ? "USER_UNSELECT"
                          : "USER_SELECT",
                        targetId: card.id,
                      })
                    }
                  />
                </Positioner>
              );
            case !!opponent.hand.find((c) => c.id === card.id):
              return (
                <Positioner
                  key={card.id}
                  {...opponentHandPosition({
                    index: opponent.hand.findIndex((c) => c.id === card.id),
                    total: opponent.hand.length,
                  })}
                >
                  <CardDisplayer
                    card={card}
                    selection={
                      isUserSelected(opponentUserSelection, card.id)
                        ? "OPPONENT"
                        : null
                    }
                    flipside
                  />
                </Positioner>
              );
            case !!player.hand.find((c) => c.id === card.id):
              return (
                <Positioner
                  key={card.id}
                  {...playerHandPosition({
                    index: player.hand.findIndex((c) => c.id === card.id),
                    total: player.hand.length,
                  })}
                >
                  <CardDisplayer
                    handHover
                    showCost
                    showPower
                    showDetails
                    card={card}
                    playable={
                      isMyTurn(gameState, user.id) &&
                      !playerUserSelection &&
                      getAvailableResource(gameState, user.id) >= card.cost
                    }
                    selection={
                      isUserSelected(playerUserSelection, card.id)
                        ? "PLAYER"
                        : null
                    }
                    onClick={() =>
                      sendMessage({
                        action: isUserSelected(playerUserSelection, card.id)
                          ? "USER_UNSELECT"
                          : "USER_SELECT",
                        targetId: card.id,
                      })
                    }
                  />
                </Positioner>
              );

            default:
              return null;
          }
        })}
      </GameBoard>
    </GameStateContext>
  ) : (
    <div>matchmaking...</div>
  );
}

// TODO: line to cursor implementation
const Positioner = forwardRef<
  HTMLElement,
  {
    children: React.ReactElement<
      React.HTMLAttributes<HTMLElement> & { ref?: React.Ref<HTMLElement> }
    >;
    x: number;
    y: number;
    scale: number;
    rotate: number;
    zIndex?: number;
  }
>((props, ref) => {
  const { children, x, y, scale, rotate, zIndex } = props;
  if (!isValidElement(children)) {
    throw new Error("Positioner expects a single React element child");
  }
  return cloneElement(children, {
    ref,
    style: {
      position: "absolute",
      top: `${y}%`,
      left: `${x}%`,
      width: "7%",
      transition: "top 0.5s ease, left 0.5s ease , transform 0.5s ease",
      transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotate}deg)`,
      zIndex: zIndex ?? children.props.style?.zIndex,
      ...children.props.style,
    },
  });
});

const RESOURCE_SPACING = 2;

function opponentResourcePosition(props: { index: number; total: number }) {
  const { index } = props;
  const x = 25 - index * RESOURCE_SPACING;
  const y = 10;
  return { x, y, scale: 1, rotate: 90, zIndex: index + 1 };
}
function playerResourcePosition(props: { index: number; total: number }) {
  const { index } = props;
  const x = 25 - index * RESOURCE_SPACING;
  const y = 90;
  return { x, y, scale: 1, rotate: 90, zIndex: index + 1 };
}

const HAND_SPACING = 4;

function opponentHandPosition(props: { index: number; total: number }) {
  const { index } = props;
  // Push inner cards a bit further up
  const y = 0 - Math.abs(index - (props.total - 1) / 2);
  // Tigther the more cards there are
  const x = 40 + (index * HAND_SPACING * 5) / props.total;
  // Fan orientation
  const rotate = (index - (props.total - 1) / 2) * -8;
  return { x, y, scale: 1, rotate, zIndex: index * 10 };
}
function playerHandPosition(props: { index: number; total: number }) {
  const { index } = props;
  // Push inner cards a bit further up
  const y = 100 + Math.abs(index - (props.total - 1) / 2);
  const x = 40 + (index * HAND_SPACING * 5) / props.total;
  // Fan orientation
  const rotate = (index - (props.total - 1) / 2) * 8;
  return { x, y, scale: 1, rotate, zIndex: (index + 1) * 10 };
}

const PROTECTION_SPACING = 7.25;

function opponentProtectionPosition(props: { index: number }) {
  const { index } = props;
  const y = 20;
  const x = 40 + index * PROTECTION_SPACING;
  return { x, y, scale: 1, rotate: 0 };
}
function playerProtectionPosition(props: { index: number }) {
  const { index } = props;
  const y = 80;
  const x = 40 + index * PROTECTION_SPACING;
  return { x, y, scale: 1, rotate: 0 };
}

const FIELD_SPACING = 7.25;

function opponentFieldPosition(props: { index: number; total: number }) {
  const { index } = props;
  const y = 40;
  const x = 40 + index * FIELD_SPACING;
  return { x, y, scale: 1, rotate: 0 };
}
function playerFieldPosition(props: { index: number; total: number }) {
  const { index } = props;
  const y = 60;
  const x = 40 + index * FIELD_SPACING;
  {
    return { x, y, scale: 1, rotate: 0 };
  }
}

function opponentDeckPosition(props: { index: number; total: number }) {
  const { index } = props;
  const x = 90 + index * 0.025;
  const y = 15 - index * 0.025;
  return { x, y, scale: 1, rotate: 180, zIndex: index + 1 };
}
function playerDeckPosition(props: { index: number; total: number }) {
  const { index } = props;
  const x = 90 + index * 0.025;
  const y = 85 + index * 0.025;
  return { x, y, scale: 1, rotate: 180, zIndex: index + 1 };
}
function opponentGraveyardPosition(props: { index: number; total: number }) {
  const { index } = props;
  const x = 80 + index * 0.025;
  const y = 15 - index * 0.025;
  return { x, y, scale: 1, rotate: 0, zIndex: index + 1 };
}
function playerGraveyardPosition(props: { index: number; total: number }) {
  const { index } = props;
  const x = 80 + index * 0.025;
  const y = 85 + index * 0.025;
  return { x, y, scale: 1, rotate: 0, zIndex: index + 1 };
}

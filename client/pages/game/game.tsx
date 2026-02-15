import {
  cloneElement,
  forwardRef,
  isValidElement,
  useEffect,
  useState,
} from "react";
import { useUser } from "../../context/UserContext.tsx";
import "./game.css";
import { useAnimationEngine } from "../../hooks/useAnimationEngine.ts";
import type { Card } from "../../../shared/cards/index.ts";
import {
  GameStateContext,
  getAvailableResource,
  getOpponent,
  getPlayer,
  getUserSelectionType,
  hasCreatureWithTargetedOnPlaySelected,
  isMyTurn,
  isUserSelected,
} from "../../utils/GameStateUtils.ts";
import type { Nullable } from "../../../shared/utils.ts";
import { CardDisplayer } from "../../components/CardDisplayer/CardDisplayer.tsx";
import { useNavigate } from "react-router-dom";
import { LineFromChild } from "../../components/LineFromChild/LineFromChild.tsx";
import { Guide } from "../../components/Guide/Guide.tsx";
import type { ClientHandCard } from "../../../shared/game.ts";

function GameBoard({
  children,
  showFieldHighlight,
  showResourceHighlight,
  glowResourceHighlight,
  showWinHighlight,
  onFieldClick,
  onResourceClick,
  onEndTurnClick,
  onWinClick,
  inspectedCard,
  playerResource,
  opponentResource,
  gameMessage,
  resultMessage,
  playerName,
  opponentName,
}: {
  children: React.ReactNode;
  showResourceHighlight: boolean;
  glowResourceHighlight: boolean;
  showFieldHighlight: boolean;
  showWinHighlight: boolean;
  onFieldClick: () => void;
  onResourceClick: () => void;
  onWinClick: () => void;
  onEndTurnClick: (() => void) | null;
  inspectedCard?: Nullable<Card | ClientHandCard>;
  playerResource: [available: number, total: number];
  opponentResource: [available: number, total: number];
  gameMessage?: string;
  resultMessage?: string;
  playerName?: string;
  opponentName?: string;
}) {
  const [displayedMinorStatus, setDisplayedMinorStatus] = useState<
    string | null
  >(null);
  const [showGuide, setShowGuide] = useState(false);
  useEffect(() => {
    if (gameMessage) {
      setDisplayedMinorStatus(gameMessage);
      const timeout = setTimeout(() => {
        setDisplayedMinorStatus(null);
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [gameMessage]);

  const navigate = useNavigate();
  return (
    <div className="GameBoard-Wrap">
      <div className="GameBoard">
        {showFieldHighlight && (
          <div className="GameBoard-Field" onClick={onFieldClick}>
            {/** TODO: this being on cards prevents onplays that target own field */}
            Play card
          </div>
        )}
        {showResourceHighlight && (
          <div className="GameBoard-Resource" onClick={onResourceClick}>
            Add resource
          </div>
        )}
        {showWinHighlight && (
          <div className="GameBoard-Win" onClick={onWinClick}>
            Finish it!
          </div>
        )}
        <div
          className={
            "GameBoard-Resource-Indicator-Player" +
            (glowResourceHighlight ? " GameBoard-Resource-Glow" : "")
          }
        >
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
              card={inspectedCard}
            />
          </div>
        )}

        <button
          type="button"
          className="GameBoard-EndTurnButton"
          disabled={onEndTurnClick === null}
          onClick={onEndTurnClick ?? undefined}
        >
          End turn
        </button>
        {displayedMinorStatus && (
          <div className="GameBoard-Status-Minor">
            <div>{displayedMinorStatus}</div>
          </div>
        )}
        {resultMessage && (
          <div className="GameBoard-Status-Major">
            <div>
              <div>{resultMessage}</div>
              <button type="button" onClick={() => navigate("/")}>
                End game
              </button>
            </div>
          </div>
        )}
        <div className="GameBoard-Player GameBoard-Player-Opponent">
          {opponentName}
        </div>
        <div className="GameBoard-Player GameBoard-Player-Player">
          {playerName}
        </div>
      </div>
      {showGuide && <Guide onClose={() => setShowGuide(false)} />}
      <button
        className="GameBoard-Guide-Button"
        type="button"
        onClick={() => setShowGuide(true)}
      >
        Guide
      </button>
    </div>
  );
}

export default function Game() {
  const { user, loading } = useUser();
  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Unauthorized</div>;
  const navigate = useNavigate();

  const [
    gameState,
    sendMessage,
    currentLogItem,
    playerUserSelection,
    opponentUserSelection,
    currentErrorItem,
  ] = useAnimationEngine(user.id);

  const [hoveredFieldCardId, setHoveredFieldCardId] = useState<string | null>(
    null,
  );
  const [hoverInspectedCard, setHoverInspectedCard] =
    useState<Nullable<Card>>(null);
  const selectionType = getUserSelectionType(playerUserSelection);

  const [targetedCreatureCard, setTargetedCreatureCard] =
    useState<Nullable<ClientHandCard>>(null);

  useEffect(() => {
    if (selectionType === "FIELD_CREATURES") {
      setHoverInspectedCard(null);
      return;
    }
    if (!hoveredFieldCardId) {
      setHoverInspectedCard(null);
      return;
    }
    // If card died
    if (
      gameState &&
      !getPlayer(gameState, user.id).field.find(
        (c) => c.id === hoveredFieldCardId,
      ) &&
      !getOpponent(gameState, user.id).field.find(
        (c) => c.id === hoveredFieldCardId,
      )
    ) {
      setHoverInspectedCard(null);
      return;
    }

    const timeout = setTimeout(() => {
      if (!gameState) return;
      const hoveredCard = gameState.cardPool.find(
        (card) => card.id === hoveredFieldCardId,
      );
      setHoverInspectedCard(hoveredCard ?? null);
    }, 1000);
    return () => clearTimeout(timeout);
  }, [gameState, hoveredFieldCardId, selectionType]);

  useEffect(() => {
    if (
      targetedCreatureCard &&
      isUserSelected(playerUserSelection, targetedCreatureCard?.id)
    ) {
      return;
    }
    setTargetedCreatureCard(null);
  }, [playerUserSelection]);

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
        resultMessage={
          gameState.winner
            ? gameState.winner === user.id
              ? "You win!"
              : "You lose!"
            : undefined
        }
        gameMessage={currentErrorItem || undefined}
        playerName={user.name}
        opponentName={getOpponent(gameState, user.id).name}
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
        glowResourceHighlight={
          isMyTurn(gameState, user.id) &&
          getPlayer(gameState, user.id).hasPlayedResource === false
        }
        showFieldHighlight={
          currentLogItem === null &&
          getUserSelectionType(playerUserSelection) === "HAND_CARD" &&
          getPlayer(gameState, user.id).resource.filter(
            (res) => res.used === false,
          ).length >= (playerUserSelection as ClientHandCard).cost
        }
        showWinHighlight={
          currentLogItem === null &&
          getUserSelectionType(playerUserSelection) === "FIELD_CREATURES" &&
          getOpponent(gameState, user.id).field.length === 0 &&
          getOpponent(gameState, user.id).protection.length === 0
        }
        onFieldClick={() => {
          if (
            hasCreatureWithTargetedOnPlaySelected(playerUserSelection) &&
            playerUserSelection.onPlayTargetingCondition
          ) {
            setTargetedCreatureCard(playerUserSelection);
          } else {
            sendMessage({ action: "PLAY_CARD" });
          }
        }}
        onResourceClick={() => sendMessage({ action: "PLAY_RESOURCE" })}
        onEndTurnClick={
          isMyTurn(gameState, user.id)
            ? () => sendMessage({ action: "END_TURN" })
            : null
        }
        onWinClick={() => sendMessage({ action: "WIN" })}
        inspectedCard={
          hoverInspectedCard ??
          getOpponent(gameState, user.id).hand.find(
            (card) =>
              (currentLogItem?.effectName === "CREATURE_PLAYED" ||
                currentLogItem?.effectName === "SPELL_PLAYED") &&
              currentLogItem?.initiator === card.id,
          )
        }
      >
        {gameState.cardPool.map((card) => {
          const opponent = getOpponent(gameState, user.id);
          const player = getPlayer(gameState, user.id);
          switch (true) {
            case !!opponent.graveyard.find((c) => c.id === card.id): {
              const graveyardCard = opponent.graveyard.find(
                (c) => c.id === card.id,
              )!;
              return (
                <Positioner
                  key={graveyardCard.id}
                  {...opponentGraveyardPosition({
                    index: opponent.graveyard.findIndex(
                      (c) => c.id === graveyardCard.id,
                    ),
                    total: opponent.graveyard.length,
                  })}
                >
                  <CardDisplayer
                    card={graveyardCard}
                    fieldAnimations={{ death: true }}
                  />
                </Positioner>
              );
            }
            case !!player.graveyard.find((c) => c.id === card.id): {
              const graveyardCard = player.graveyard.find(
                (c) => c.id === card.id,
              )!;
              return (
                <Positioner
                  key={graveyardCard.id}
                  {...playerGraveyardPosition({
                    index: player.graveyard.findIndex(
                      (c) => c.id === graveyardCard.id,
                    ),
                    total: player.graveyard.length,
                  })}
                >
                  <CardDisplayer
                    card={graveyardCard}
                    fieldAnimations={{ death: true }}
                  />
                </Positioner>
              );
            }
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
            case !!opponent.protection.find((c) => c.id === card.id): {
              const protectionCard = opponent.protection.find(
                (c) => c.id === card.id,
              )!;
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
                    showShield
                    fieldAnimations={{
                      break:
                        currentLogItem?.initiator === protectionCard.id &&
                        currentLogItem?.effectName === "PROTECTION_DESTROYED",
                    }}
                    onClick={() =>
                      sendMessage({
                        action: "ATTACK_PROTECTION",
                        targetId: card.id,
                      })
                    }
                  />
                </Positioner>
              );
            }
            case !!player.protection.find((c) => c.id === card.id): {
              const protectionCard = player.protection.find(
                (c) => c.id === card.id,
              )!;
              return (
                <Positioner
                  key={card.id}
                  {...playerProtectionPosition({
                    index: player.protection.findIndex(
                      (c) => c.id === protectionCard.id,
                    ),
                  })}
                >
                  <CardDisplayer
                    card={protectionCard}
                    showShield
                    flipside
                    fieldAnimations={{
                      break:
                        currentLogItem?.initiator === protectionCard.id &&
                        currentLogItem?.effectName === "PROTECTION_DESTROYED",
                    }}
                  />
                </Positioner>
              );
            }
            case !!opponent.resource.find((c) => c.id === card.id):
              return (
                <Positioner
                  key={card.id}
                  {...opponentResourcePosition({
                    index: opponent.resource.findIndex((c) => c.id === card.id),
                    total: opponent.resource.length,
                  })}
                >
                  <CardDisplayer card={card} flipside />
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
                  <CardDisplayer card={card} flipside />
                </Positioner>
              );
            case !!opponent.field.find((c) => c.id === card.id): {
              const fieldCard = opponent.field.find((c) => c.id === card.id)!;
              return (
                <Positioner
                  key={fieldCard.id}
                  {...opponentFieldPosition({
                    index: opponent.field.findIndex(
                      (c) => c.id === fieldCard.id,
                    ),
                    total: opponent.field.length,
                  })}
                >
                  <CardDisplayer
                    card={fieldCard}
                    showIcons
                    showPower
                    fieldAnimations={{
                      trigger:
                        currentLogItem?.self === fieldCard.id &&
                        currentLogItem?.initiator !== "GAME_PLAYER",
                      attack:
                        currentLogItem?.initiator === fieldCard.id &&
                        currentLogItem?.effectName === "CREATURE_ATTACKED",
                      defend:
                        currentLogItem?.initiator === fieldCard.id &&
                        currentLogItem?.effectName === "CREATURE_GOT_ATTACKED",
                      death:
                        currentLogItem?.initiator === fieldCard.id &&
                        currentLogItem?.effectName === "CREATURE_DIED",
                    }}
                    selection={
                      isUserSelected(opponentUserSelection, fieldCard.id)
                        ? "OPPONENT"
                        : null
                    }
                    onClick={() => {
                      if (
                        getUserSelectionType(playerUserSelection) ===
                        "HAND_CARD"
                      ) {
                        sendMessage({
                          action: "PLAY_CARD",
                          targetId: card.id,
                        });
                      } else {
                        sendMessage({
                          action: "ATTACK_CREATURE",
                          targetId: card.id,
                        });
                      }
                    }}
                    onMouseEnter={() => setHoveredFieldCardId(card.id)}
                    onMouseLeave={() => setHoveredFieldCardId(null)}
                  />
                </Positioner>
              );
            }
            case !!player.field.find((c) => c.id === card.id): {
              const fieldCard = player.field.find((c) => c.id === card.id)!;
              return (
                <Positioner
                  key={fieldCard.id}
                  {...playerFieldPosition({
                    index: player.field.findIndex((c) => c.id === fieldCard.id),
                    total: player.field.length,
                  })}
                  showLine={
                    !gameState.winner &&
                    isUserSelected(playerUserSelection, fieldCard.id)
                  }
                >
                  <CardDisplayer
                    card={fieldCard}
                    playable={
                      isMyTurn(gameState, user.id) &&
                      !playerUserSelection &&
                      !fieldCard.attacked &&
                      !!fieldCard.power
                    }
                    showPower
                    showIcons
                    fieldAnimations={{
                      trigger:
                        currentLogItem?.self === fieldCard.id &&
                        currentLogItem?.initiator !== "GAME_PLAYER",
                      attack:
                        currentLogItem?.initiator === fieldCard.id &&
                        currentLogItem?.effectName === "CREATURE_ATTACKED",
                      defend:
                        currentLogItem?.initiator === fieldCard.id &&
                        currentLogItem?.effectName === "CREATURE_GOT_ATTACKED",
                      death:
                        currentLogItem?.initiator === fieldCard.id &&
                        currentLogItem?.effectName === "CREATURE_DIED",
                    }}
                    selection={
                      isUserSelected(playerUserSelection, fieldCard.id)
                        ? "PLAYER"
                        : null
                    }
                    onClick={() => {
                      if (
                        getUserSelectionType(playerUserSelection) ===
                        "HAND_CARD"
                      ) {
                        sendMessage({
                          action: "PLAY_CARD",
                          targetId: fieldCard.id,
                        });
                      } else {
                        sendMessage({
                          action: isUserSelected(
                            playerUserSelection,
                            fieldCard.id,
                          )
                            ? "USER_UNSELECT"
                            : "USER_SELECT",
                          targetId: fieldCard.id,
                        });
                      }
                    }}
                    onMouseEnter={() => setHoveredFieldCardId(fieldCard.id)}
                    onMouseLeave={() => setHoveredFieldCardId(null)}
                  />
                </Positioner>
              );
            }
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
            case !!player.hand.find((c) => c.id === card.id): {
              const handCard = player.hand.find((c) => c.id === card.id)!;
              return (
                <Positioner
                  key={handCard.id}
                  showLine={
                    !gameState.winner &&
                    isUserSelected(playerUserSelection, handCard.id) &&
                    handCard.onPlay?.type === "TARGETED" &&
                    (handCard.type !== "CREATURE" ||
                      targetedCreatureCard?.id === handCard.id)
                  }
                  {...(targetedCreatureCard?.id === handCard.id
                    ? playerFieldPosition({
                        index: player.field.length,
                        total: player.field.length + 1,
                      })
                    : playerHandPosition({
                        index: player.hand.findIndex(
                          (c) => c.id === handCard.id,
                        ),
                        total: player.hand.length,
                      }))}
                >
                  <CardDisplayer
                    handHover
                    showCost
                    showPower
                    showDetails
                    card={handCard}
                    playable={
                      isMyTurn(gameState, user.id) &&
                      !playerUserSelection &&
                      getAvailableResource(gameState, user.id) >= handCard.cost
                    }
                    selection={
                      isUserSelected(playerUserSelection, handCard.id)
                        ? "PLAYER"
                        : null
                    }
                    onClick={() => {
                      sendMessage({
                        action: isUserSelected(playerUserSelection, handCard.id)
                          ? "USER_UNSELECT"
                          : "USER_SELECT",
                        targetId: handCard.id,
                      });
                    }}
                  />
                </Positioner>
              );
            }
            case !![...opponent.discard, ...player.discard].find(
              (c) => c.id === card.id,
            ):
              return (
                <Positioner key={card.id} {...discardPosition()}>
                  <CardDisplayer card={card} showCost showPower showDetails />
                </Positioner>
              );

            default:
              return null;
          }
        })}
      </GameBoard>
    </GameStateContext>
  ) : (
    <div className="GameBoard-Status-Major">
      <div>
        <div>Finding opponent...</div>
        <button type="button" onClick={() => navigate("/")}>
          Back to menu
        </button>
      </div>
    </div>
  );
}

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
    showLine?: boolean;
    opacity?: number;
    pointerEvents?: React.CSSProperties["pointerEvents"];
  }
>((props, ref) => {
  const { children, x, y, scale, rotate, zIndex } = props;
  if (!isValidElement(children)) {
    throw new Error("Positioner expects a single React element child");
  }
  return (
    <LineFromChild show={props.showLine}>
      {cloneElement(children, {
        ref,
        style: {
          position: "absolute",
          top: `${y}%`,
          left: `${x}%`,
          width: "7%",
          opacity: props.opacity ?? 1,
          pointerEvents: props.pointerEvents ?? "auto",
          transition:
            "top 0.5s ease, left 0.5s ease , transform 0.5s ease, opacity 2s ease",
          transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotate}deg)`,
          zIndex: zIndex ?? children.props.style?.zIndex,
          ...children.props.style,
        },
      })}
    </LineFromChild>
  );
});

const RESOURCE_SPACING = 0.5;

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
  return { x, y, scale: 1, rotate, zIndex: (index + 1) * 10 };
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
function discardPosition() {
  return {
    x: 50,
    y: 50,
    scale: 2,
    zIndex: 100,
    opacity: 0,
    rotate: 0,
    pointerEvents: "none" as React.CSSProperties["pointerEvents"],
  };
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

import {
  cloneElement,
  ComponentPropsWithoutRef,
  createContext,
  forwardRef,
  HTMLAttributes,
  isValidElement,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ClientMessage } from "../../shared/communication.ts";
import type { UUID } from "../../shared/utils.ts";
import { type GameState } from "../../shared/game.ts";
import { isCreature } from "../../shared/cards/index.ts";
import { useUser } from "./login.tsx";
import { type Card } from "../../shared/cards/index.ts";
import "./game.css";
import { Fragment } from "react/jsx-runtime";
import { useAnimationEngine } from "../hooks/useAnimationEngine.ts";

const WsContext = createContext<{ sendMessage: (msg: ClientMessage) => void }>(
  {} as {
    sendMessage: (msg: ClientMessage) => void;
  },
);

const GameStateContext = createContext<{ gameState: GameState }>(
  {} as { gameState: GameState },
);

function CCard({
  card,
  ...native
}: { card: Card } & ComponentPropsWithoutRef<"div">) {
  const gameState = useContext(GameStateContext);
  return (
    <div {...native} className="card">
      <div>{card.name}</div>
      <div>{card.id.slice(0, 4)}</div>
      {isCreature(card) && <div>{card.power}</div>}
    </div>
  );
}

function getOpponent(gs: GameState, userId: UUID) {
  const playerIds: UUID[] = Object.keys(gs.players) as UUID[];
  const opponentId = playerIds.find((id) => id !== userId);
  if (!opponentId) throw new Error("Opponent not found");
  return gs.players[opponentId];
}

function getPlayer(gs: GameState, userId: UUID) {
  const player = gs.players[userId];
  if (!player) throw new Error("Player not found");
  return player;
}

function getPlayerSelection(gs: GameState, userId: UUID) {
  const player = getPlayer(gs, userId);
  return player.userSelection;
}

function getPlayerSelectionType(gs: GameState, userId: UUID) {
  const selection = getPlayerSelection(gs, userId);
  if (selection === null) return null;
  if (Array.isArray(selection)) return "FIELD_CREATURES";
  return "HAND_CARD";
}

function isSelected(gs: GameState, userId: UUID, cardId: UUID) {
  const selection = getPlayerSelection(gs, userId);
  if (selection === null) return false;
  if (Array.isArray(selection)) {
    return selection.some((card) => card.id === cardId);
  }
  return selection.id === cardId;
}

function isMyTurn(gs: GameState, userId: UUID) {
  return gs.activePlayer === userId;
}

function GameBoard({
  children,
  showHighlights,
  onFieldClick,
  onResourceClick,
  onEndTurnClick,
}: {
  children: React.ReactNode;
  showHighlights: boolean;
  onFieldClick: () => void;
  onResourceClick: () => void;
  onEndTurnClick: (() => void) | null;
}) {
  return (
    <div className="game">
      <div className="side"></div>
      <div className="side">
        {children}
        {showHighlights ? (
          <>
            <div className="highlight" onClick={onFieldClick}>
              field
            </div>
            <div className="highlight"></div>
            <div className="highlight" onClick={onResourceClick}>
              resource
            </div>
          </>
        ) : null}
      </div>
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

  const [gameState, sendMessage] = useAnimationEngine(user.id);

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
    <WsContext value={{ sendMessage }}>
      <GameStateContext value={{ gameState }}>
        <GameBoard
          showHighlights={
            getPlayerSelectionType(gameState, user.id) === "HAND_CARD"
          }
          onFieldClick={() => sendMessage({ action: "PLAY_CARD" })}
          onResourceClick={() => sendMessage({ action: "PLAY_RESOURCE" })}
          onEndTurnClick={
            isMyTurn(gameState, user.id)
              ? () => sendMessage({ action: "END_TURN" })
              : null
          }
        >
          {getOpponent(gameState, user.id).resource.map((card, index) => (
            <OpponentResourcePositioner
              key={card.id}
              index={index}
              total={getOpponent(gameState, user.id).resource.length}
            >
              <CCard card={card} />
            </OpponentResourcePositioner>
          ))}
          {getOpponent(gameState, user.id).hand.map((card, index) => (
            <OpponentHandPositioner
              key={card.id}
              index={index}
              total={getOpponent(gameState, user.id).hand.length}
            >
              <CCard card={card} />
            </OpponentHandPositioner>
          ))}
          {getOpponent(gameState, user.id).protection.map((card, index) => (
            <OpponentProtectionPositioner key={card.id} index={index}>
              <CCard
                key={card.id}
                card={card}
                onClick={() =>
                  sendMessage({
                    action: "ATTACK_PROTECTION",
                    targetId: card.id,
                  })
                }
              />
            </OpponentProtectionPositioner>
          ))}
          {getOpponent(gameState, user.id).field.map((card, index) => (
            <OpponentFieldPositioner
              key={card.id}
              index={index}
              total={getOpponent(gameState, user.id).field.length}
            >
              <CCard
                key={card.id}
                card={card}
                onClick={() =>
                  getPlayerSelectionType(gameState, user.id) === "HAND_CARD"
                    ? sendMessage({ action: "PLAY_CARD", targetId: card.id })
                    : sendMessage({
                        action: "ATTACK_CREATURE",
                        targetId: card.id,
                      })
                }
              />
            </OpponentFieldPositioner>
          ))}
          {/* ---------------------------------------------- */}
          {getPlayer(gameState, user.id).field.map((card, index) => (
            <PlayerFieldPositioner
              key={card.id}
              index={index}
              total={getPlayer(gameState, user.id).field.length}
              showLineToCursor={isSelected(gameState, user.id, card.id)}
            >
              <CCard
                key={card.id}
                card={card}
                onClick={() =>
                  sendMessage({
                    action: isSelected(gameState, user.id, card.id)
                      ? "USER_UNSELECT"
                      : "USER_SELECT",
                    targetId: card.id,
                  })
                }
              />
            </PlayerFieldPositioner>
          ))}
          {getPlayer(gameState, user.id).protection.map((card, index) => (
            <PlayerProtectionPositioner key={card.id} index={index}>
              <CCard key={card.id} card={card} />
            </PlayerProtectionPositioner>
          ))}
          {getPlayer(gameState, user.id).hand.map((card, index) => (
            <PlayerHandPositioner
              key={card.id}
              total={getPlayer(gameState, user.id).hand.length}
              index={index}
            >
              <CCard
                key={card.id}
                card={card}
                onClick={() =>
                  sendMessage({
                    action: isSelected(gameState, user.id, card.id)
                      ? "USER_UNSELECT"
                      : "USER_SELECT",
                    targetId: card.id,
                  })
                }
              />
            </PlayerHandPositioner>
          ))}
          {getPlayer(gameState, user.id).resource.map((card, index) => (
            <PlayerResourcePositioner
              key={card.id}
              index={index}
              total={getPlayer(gameState, user.id).resource.length}
            >
              <CCard key={card.id} card={card} />
            </PlayerResourcePositioner>
          ))}
        </GameBoard>
      </GameStateContext>
    </WsContext>
  ) : (
    <div>matchmaking...</div>
  );
}

type OriginProps<T extends HTMLElement> = {
  children: React.ReactElement<
    React.HTMLAttributes<T> & { ref?: React.Ref<T> }
  >;
};
const LineFromChildOrigin = forwardRef<HTMLElement, OriginProps<HTMLElement>>(
  ({ children }, ref) => cloneElement(children, { ref }),
);

function LineFromChild({
  children,
}: {
  children: React.ReactElement<
    HTMLAttributes<HTMLElement> & { ref?: React.Ref<HTMLElement> }
  >;
}) {
  const originRef = useRef<HTMLElement | null>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [origin, setOrigin] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const updateOrigin = () => {
      console.log(originRef.current);
      if (!originRef.current) return;
      const rect = originRef.current.getBoundingClientRect();
      setOrigin({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
    };
    updateOrigin();
    addEventListener("resize", updateOrigin);
    return () => removeEventListener("resize", updateOrigin);
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => setMouse({ x: e.clientX, y: e.clientY });
    addEventListener("mousemove", onMove);
    return () => removeEventListener("mousemove", onMove);
  }, []);

  const { length, angle } = useMemo(() => {
    const dx = mouse.x - origin.x;
    const dy = mouse.y - origin.y;
    return { length: Math.hypot(dx, dy), angle: Math.atan2(dy, dx) };
  }, [mouse, origin]);

  return (
    <>
      <LineFromChildOrigin ref={originRef}>{children}</LineFromChildOrigin>
      {!mouse.x && !mouse.y ? null : (
        <div
          style={{
            position: "fixed",
            left: origin.x,
            top: origin.y,
            height: 2,
            width: length,
            transform: `rotate(${angle}rad)`,
            transformOrigin: "0 50%",
            background: "black",
            pointerEvents: "none",
          }}
        />
      )}
    </>
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
  }
>((props, ref) => {
  const { children, x, y, scale, rotate } = props;
  if (!isValidElement(children)) {
    throw new Error("Positioner expects a single React element child");
  }
  return cloneElement(children, {
    ref,
    style: {
      top: `${y}%`,
      left: `${x}%`,
      transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotate}deg)`,
      ...children.props.style,
    },
  });
});

function OpponentResourcePositioner(props: {
  index: number;
  total: number;
  children: React.ReactElement<React.HTMLAttributes<HTMLElement>>;
}) {
  const { index, children } = props;
  const spacing = 2;
  const x = 10 + index * spacing;
  const y = 10;
  return (
    <Positioner x={x} y={y} scale={1} rotate={90}>
      {children}
    </Positioner>
  );
}
function PlayerResourcePositioner(props: {
  index: number;
  total: number;
  children: React.ReactElement<React.HTMLAttributes<HTMLElement>>;
}) {
  const { index, children } = props;
  const spacing = 2;
  const x = 10 + index * spacing;
  const y = 90;
  return (
    <Positioner x={x} y={y} scale={1} rotate={-90}>
      {children}
    </Positioner>
  );
}

function OpponentHandPositioner(props: {
  index: number;
  total: number;
  children: React.ReactElement<React.HTMLAttributes<HTMLElement>>;
}) {
  const { index, children } = props;
  const y = 0;
  const spacing = 6;
  const x = 40 + index * spacing;
  return (
    <Positioner x={x} y={y} scale={1} rotate={0}>
      {children}
    </Positioner>
  );
}
function PlayerHandPositioner(props: {
  index: number;
  total: number;
  children: React.ReactElement<React.HTMLAttributes<HTMLElement>>;
}) {
  const { index, children } = props;
  const y = 100;
  const spacing = 6;
  const x = 40 + index * spacing;
  return (
    <Positioner x={x} y={y} scale={1} rotate={0}>
      {children}
    </Positioner>
  );
}

function OpponentProtectionPositioner(props: {
  index: number;
  children: React.ReactElement<React.HTMLAttributes<HTMLElement>>;
}) {
  const { index, children } = props;
  const y = 20;
  const spacing = 6;
  const x = 40 + index * spacing;
  return (
    <Positioner x={x} y={y} scale={1} rotate={0}>
      {children}
    </Positioner>
  );
}
function PlayerProtectionPositioner(props: {
  index: number;
  children: React.ReactElement<React.HTMLAttributes<HTMLElement>>;
}) {
  const { index, children } = props;
  const y = 80;
  const spacing = 6;
  const x = 40 + index * spacing;
  return (
    <Positioner x={x} y={y} scale={1} rotate={0}>
      {children}
    </Positioner>
  );
}

function OpponentFieldPositioner(props: {
  index: number;
  total: number;
  children: React.ReactElement<React.HTMLAttributes<HTMLElement>>;
}) {
  const { index, children } = props;
  const y = 40;
  const spacing = 6;
  const x = 40 + index * spacing;
  return (
    <Positioner x={x} y={y} scale={1} rotate={0}>
      {children}
    </Positioner>
  );
}
function PlayerFieldPositioner(props: {
  index: number;
  total: number;
  children: React.ReactElement<React.HTMLAttributes<HTMLElement>>;
  showLineToCursor: boolean;
}) {
  const { index, children } = props;
  const y = 60;
  const spacing = 6;
  const x = 40 + index * spacing;
  const Wrapper = props.showLineToCursor ? LineFromChild : Fragment;
  return (
    <Wrapper>
      <Positioner x={x} y={y} scale={1} rotate={0}>
        {children}
      </Positioner>
    </Wrapper>
  );
}

import React, { useEffect, useMemo, useRef, useState } from "react";
import logo from "./logo.svg";
import { useUser } from "./Login";
import { useNavigate } from "react-router-dom";
import {
  GameCard,
  GameState,
  ServerMessage,
  ClientMessage,
} from "@cards/shared";
import "./Game.css";

function useWs(userId: string, onMessage: (data: ServerMessage) => void) {
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:8000/match/public/${userId}`);
    wsRef.current = ws;
    ws.onopen = () => {
      console.log("connected");
    };
    ws.onclose = () => {
      console.log("disconnected");
    };
    ws.onmessage = (event) => {
      onMessage(JSON.parse(event.data));
      console.log(JSON.parse(event.data));
    };
    return () => {
      if (
        ws.readyState === WebSocket.OPEN ||
        ws.readyState === WebSocket.CONNECTING
      ) {
        ws.close();
      }
    };
  }, [userId]);

  return [
    wsRef.current as Omit<WebSocket, "send">,
    (msg: ClientMessage) => wsRef.current?.send(JSON.stringify(msg)),
  ] as const;
}

function isSelected(
  card: GameCard,
  selection: GameState["player1" | "player2"]["userSelection"]
) {
  if (!selection) return false;
  if (Array.isArray(selection))
    return !!selection.find((c) => c.id === card.id);
  return selection.id === card.id;
}

function selectedCard(
  selection: GameState["player1" | "player2"]["userSelection"]
) {
  return !!selection && !Array.isArray(selection) && selection;
}

function selectedCreatures(
  selection: GameState["player1" | "player2"]["userSelection"]
) {
  return (Array.isArray(selection) && selection) || [];
}

function urlify(name: string) {
  return name.replace(/ /g, "-").toLowerCase();
}

function Power({ children }: { children: number }) {
  return <div className="Power">{children}</div>;
}

function Cost({ children }: { children: number }) {
  return <div className="Cost">{children}</div>;
}

function Subtitles({ card }: { card: GameCard }) {
  return (
    <div className="Subtitles">
      <div>{card.name}</div>
      <div>
        {card.keywords?.map((kw: string) => <b>{kw}</b>).join(", ")}
        {card.keywords?.length ? " " : ""}
        {card.description}
      </div>
    </div>
  );
}

function Card({
  card,
  selected,
  selectable,
  ...native
}: {
  card: GameCard;
  selected?: boolean;
  selectable?: boolean;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...native}
      className={
        "Card" +
        (selected ? " Selected" : "") +
        (selectable ? " Selectable" : "")
      }
      style={{
        ...native.style,
        backgroundImage: `url(/${urlify(card.name)}.png)`,
      }}
    >
      <Cost>{card.cost}</Cost>
      <Subtitles card={card} />
      <Power>{card.power}</Power>
    </div>
  );
}

function CardBack({
  card,
  selected,
  ...native
}: {
  card: GameCard;
  selected?: boolean;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...native}
      className="Card"
      style={{
        ...native.style,
        boxShadow: selected ? "0 0 10px red" : "none",
        backgroundImage: "url(cardback.png)",
      }}
    ></div>
  );
}

function HandCardBack({
  card,
  index,
  selected,
  ...native
}: {
  card: GameCard;
  index: number;
  selected?: boolean;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <CardBack
      {...native}
      card={card}
      selected={selected}
      style={
        {
          ...native.style,
          "--index": index,
          "--abs-index": Math.abs(index),
        } as React.CSSProperties
      }
    />
  );
}

function FieldCard({
  card,
  selected,
  selectable,
  ...native
}: {
  card: GameCard;
  selected?: boolean;
  selectable?: boolean;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...native}
      className={
        "Card FieldCard" +
        (selectable ? " Selectable" : "") +
        (selected ? " Selected" : "")
      }
      style={{
        ...native.style,
        backgroundImage: `url(/${urlify(card.name)}.png)`,
      }}
    >
      <Power>{card.power}</Power>
    </div>
  );
}

function HandCard({
  card,
  index,
  selected,
  selectable,
  ...native
}: {
  card: GameCard;
  index: number;
  selected?: boolean;
  selectable?: boolean;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <Card
      {...native}
      card={card}
      selected={selected}
      selectable={selectable}
      style={
        {
          ...native.style,
          "--index": index,
          "--abs-index": Math.abs(index),
        } as React.CSSProperties
      }
    />
  );
}

export function Game() {
  const { user } = useUser();
  const [gameState, setGameState] = React.useState<GameState | null>(null);
  const [hoveredCard, setHoveredCard] = React.useState<GameCard | null>(null);
  const [inspectedCard, setInspectedCard] = React.useState<GameCard | null>(
    null
  );

  useEffect(() => {
    const ti = setTimeout(() => {
      setInspectedCard(hoveredCard);
    }, 1000);
    return () => clearTimeout(ti);
  }, [hoveredCard]);

  const [ws, _send] = useWs(user.id, (data) => {
    if (data.message === "gameState") {
      setGameState(data.state);
    }
  });

  const send = useMemo(() => {
    return (msg: ClientMessage) => {
      setHoveredCard(null);
      setInspectedCard(null);
      return _send(msg);
    };
  }, [_send, setHoveredCard, setInspectedCard]);

  const player = useMemo(() => {
    if (!gameState) return null;
    return gameState.player1.id === user.id
      ? gameState.player1
      : gameState.player2;
  }, [gameState]);

  const opponent = useMemo(() => {
    if (!gameState) return null;
    return gameState.player1.id === user.id
      ? gameState.player2
      : gameState.player1;
  }, [gameState]);

  const isMyTurn = useMemo(() => {
    if (!gameState || !player) return false;
    return gameState.turn === player.id;
  }, [gameState, player]);

  // listen escape key
  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        send({ action: "userSelect", target: undefined });
      }
    };
    document.addEventListener("keydown", listener);
    return () => {
      document.removeEventListener("keydown", listener);
    };
  }, []);

  return (
    <div className="Game">
      <div className="Game-area">
        {gameState && player && opponent && ws ? (
          <>
            <div className="Upper-resource">
              {opponent.resource.map((card: GameCard) => (
                <Card key={card.id} card={card} />
              ))}
            </div>
            <div className="Upper-hand Hand Opponent">
              {opponent.hand.map((card: GameCard, i: number) => (
                <HandCardBack
                  index={opponent.hand.length / 2 - (i + 0.5)}
                  key={card.id}
                  card={card}
                  selected={isSelected(card, opponent.userSelection)}
                />
              ))}
            </div>
            <div className="Upper-protection">
              {opponent.protection.map((card: GameCard) => (
                <CardBack
                  key={card.id}
                  card={card}
                  onClick={() => {
                    send({ action: "attackProtection", target: card.id });
                  }}
                />
              ))}
            </div>
            <div className="Upper-stacks">
              <div className="Stack">
                {opponent.deck.map((card: GameCard) => (
                  <CardBack key={card.id} card={card} />
                ))}
              </div>
              <div className="Stack">
                {opponent.graveyard.map((card: GameCard) => (
                  <Card key={card.id} card={card} />
                ))}
              </div>
            </div>
            <div className="Control">
              <div>{gameState.turnTimer}</div>
              <button
                disabled={!isMyTurn}
                onClick={() => {
                  send({ action: "endTurn" });
                }}
              >
                {isMyTurn ? "End turn" : "Opponent's turn"}
              </button>
            </div>
            <div className="Upper-field">
              {opponent.field.map((card: GameCard) => (
                <FieldCard
                  key={card.id}
                  card={card}
                  onMouseEnter={() => setHoveredCard(card)}
                  onMouseLeave={() => {
                    setHoveredCard(null);
                    setInspectedCard(null);
                  }}
                  onClick={() => {
                    send({ action: "attack", target: card.id });
                  }}
                />
              ))}
            </div>

            <div
              className="Lower-field"
              onClick={() => {
                const card = selectedCard(player.userSelection);
                if (!card) return;
                send({ action: "playCard" });
              }}
            >
              {player.field.map((card: GameCard) => (
                <FieldCard
                  key={card.id}
                  card={card}
                  selected={isSelected(card, player.userSelection)}
                  onMouseEnter={() => setHoveredCard(card)}
                  onMouseLeave={() => {
                    setInspectedCard(null);
                    setHoveredCard(null);
                  }}
                  onClick={() => {
                    send({ action: "userSelect", target: card.id });
                  }}
                  selectable={
                    isMyTurn &&
                    (player.userSelection === null ||
                      Array.isArray(player.userSelection)) &&
                    !isSelected(card, player.userSelection) &&
                    !player.attackedThisTurn.find(
                      (c: GameCard) => c.id === card.id
                    )
                  }
                />
              ))}
            </div>
            <div className="Lower-stacks">
              <div className="Stack">
                {player.deck.map((card: GameCard) => (
                  <CardBack key={card.id} card={card} />
                ))}
              </div>
              <div className="Stack">
                {player.graveyard.map((card: GameCard) => (
                  <Card key={card.id} card={card} />
                ))}
              </div>
            </div>
            <div className="Lower-protection">
              {player.protection.map((card: GameCard) => (
                <CardBack key={card.id} card={card} />
              ))}
            </div>
            <div className="Lower-hand Hand">
              {player.hand.map((card: GameCard, i: number) => (
                <HandCard
                  key={card.id}
                  index={player.hand.length / 2 - (i + 0.5)}
                  card={card}
                  selected={isSelected(card, player.userSelection)}
                  selectable={
                    isMyTurn &&
                    player.resource.length - player.resourceSpent >=
                      card.cost &&
                    player.userSelection === null
                  }
                  onClick={() => {
                    send({ action: "userSelect", target: card.id });
                  }}
                />
              ))}
            </div>
            <div
              className="Lower-resource"
              onClick={() => {
                const card = selectedCard(player.userSelection);
                if (!card) return;
                send({ action: "playResource", target: card.id });
              }}
            >
              {player.resource.map((card: GameCard) => (
                <Card key={card.id} card={card} />
              ))}
            </div>
            <div className="Inspect">
              {inspectedCard && <Card card={inspectedCard} />}
            </div>
          </>
        ) : (
          "Matchmaking..."
        )}
      </div>
    </div>
  );
}

import type { DB } from "https://deno.land/x/sqlite@v3.9.0/mod.ts";
import type { Handler, Route } from "@std/http/unstable-route";
import { V4 } from "https://deno.land/x/uuid@v0.1.2/mod.ts";
import { CrudResponse } from "./crud.ts";
import { startMatch } from "./match.ts";
import { necromancer, zombie, siren, chort } from "@cards/shared";

type PendingMatch = {
  id: string;
  player1: string;
  player1Socket: WebSocket;
  pendingSince: number;
};

type MatchCache = {
  publicPending: Record<string, PendingMatch>;
  privatePending: Record<string, PendingMatch>;
};

const matchmakingCache: MatchCache = {
  publicPending: {},
  privatePending: {},
};

function matchMake(db: DB, socket: WebSocket, playerId: string) {
  socket.onopen = () => {
    const pendingMatch = Object.values(matchmakingCache["publicPending"]).sort(
      (a, b) => a.pendingSince - b.pendingSince
    )[0];
    if (pendingMatch) {
      delete matchmakingCache["publicPending"][pendingMatch.id];
      socket.send(
        JSON.stringify({
          message: "matchFound",
          matchId: pendingMatch.id,
          opponent: pendingMatch.player1,
        })
      );
      startMatch(
        db,
        {
          id: pendingMatch.player1,
          socket: pendingMatch.player1Socket,
          // todo: get actual deck
          startingDeck: [
            ...Array.from({ length: 10 }, () => zombie),
            ...Array.from({ length: 10 }, () => necromancer),
            ...Array.from({ length: 10 }, () => chort),
            ...Array.from({ length: 10 }, () => siren),
          ],
        },
        {
          id: playerId,
          socket,
          // todo: get actual deck
          startingDeck: [
            ...Array.from({ length: 10 }, () => zombie),
            ...Array.from({ length: 10 }, () => chort),
            ...Array.from({ length: 10 }, () => necromancer),
            ...Array.from({ length: 10 }, () => siren),
          ],
        }
      );
    } else {
      const id = V4.uuid();
      matchmakingCache["publicPending"][id] = {
        id,
        player1: playerId,
        player1Socket: socket,
        pendingSince: Date.now(),
      };
      socket.send(
        JSON.stringify({
          message: "matchPending",
          matchId: id,
        })
      );

      socket.onclose = () => {
        delete matchmakingCache["publicPending"][id];
      };
    }
  };
}

function pendGame(type: "public" | "private") {
  return (db: DB, socket: WebSocket, playerId: string) => {
    if (type === "public") {
      matchMake(db, socket, playerId);
    }
  };
}

function pendGameHandler(db: DB, fn: ReturnType<typeof pendGame>): Handler {
  return (req, _info, params) => {
    const id = params?.pathname.groups.id;
    if (!id) {
      return new CrudResponse("Missing parameter 'id'", { status: 400 });
    }
    if (req.headers.get("upgrade") !== "websocket") {
      return new CrudResponse(null, { status: 501 });
    }
    const { socket, response } = Deno.upgradeWebSocket(req);
    fn(db, socket, id);
    return response;
  };
}

export function getMatchmakingRoutes(db: DB): Route[] {
  return [
    {
      pattern: new URLPattern({ pathname: "/match/public/:id" }),
      method: "GET",
      handler: pendGameHandler(db, pendGame("public")),
    },
    {
      pattern: new URLPattern({ pathname: "/match/private/:id" }),
      method: "GET",
      handler: pendGameHandler(db, pendGame("private")),
    },
  ];
}

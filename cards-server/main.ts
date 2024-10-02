import { route, type Route } from "@std/http/unstable-route";
import { getUserRoutes } from "./user.ts";
import { DB } from "https://deno.land/x/sqlite@v3.9.0/mod.ts";
import { getMatchmakingRoutes } from "./matchmaking.ts";
import { CrudResponse } from "./crud.ts";

const db = new DB("db.db");

const routes: Route[] = [...getUserRoutes(db), ...getMatchmakingRoutes(db)];

function defaultHandler(_req: Request) {
  return new CrudResponse("Not found", { status: 404 });
}

const routeHandler = route(routes, defaultHandler);

Deno.serve((req, info) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
        "Access-Control-Allow-Headers": "Origin, Content-Type",
      },
    });
  }
  return routeHandler(req, info);
});

import { Application, Router } from "@oak/oak";
import { oakCors } from "@tajpouria/cors";
import routeStaticFilesFrom from "./util/routeStaticFilesFrom.ts";
import { matchMake } from "./matchmaking.ts";
import { AppState } from "./config.ts";
import { createUserMiddleware, initUserTables, userRoutes } from "./user.ts";
import { DatabaseSync } from "node:sqlite";

const app = new Application<AppState>();
const router = new Router<AppState>();
const db = new DatabaseSync(`${Deno.cwd()}/data/database.sqlite`);

initUserTables(db);

router.get("/api/game/matchmaking", (context) => {
  const user = context.state.user;
  if (!user) {
    context.response.status = 401;
    context.response.body = "Unauthorized: User not found.";
    return;
  }
  if (!context.isUpgradable) {
    context.response.status = 400;
    context.response.body = "WebSocket upgrade required.";
    return;
  }
  const socket = context.upgrade();
  matchMake({ ...user, socket });
});

userRoutes(router, db);

app.use(oakCors());
app.use(createUserMiddleware(db));
app.use(router.routes());
app.use(router.allowedMethods());
app.use(routeStaticFilesFrom([`${Deno.cwd()}/dist`, `${Deno.cwd()}/public`]));

if (import.meta.main) {
  console.log("Server listening on port http://localhost:8000");
  await app.listen({ port: 8000 });
}

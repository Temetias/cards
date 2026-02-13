import { Application, Router } from "@oak/oak";
import { oakCors } from "@tajpouria/cors";
import routeStaticFilesFrom from "./util/routeStaticFilesFrom.ts";
import { matchMake } from "./matchmaking.ts";
import { AppState } from "./config.ts";
import { createUserMiddleware, initUserTables, userRoutes } from "./user.ts";
import { DatabaseSync } from "node:sqlite";

const app = new Application<AppState>();
const router = new Router<AppState>();
const dataDirUrl = new URL("../data", import.meta.url);
const dbUrl = new URL("../data/database.sqlite", import.meta.url);
await Deno.mkdir(dataDirUrl, { recursive: true });
const db = new DatabaseSync(dbUrl.pathname);
db.exec("PRAGMA journal_mode = WAL");

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
const distUrl = new URL("../dist", import.meta.url);
const publicUrl = new URL("../public", import.meta.url);
app.use(routeStaticFilesFrom([distUrl.pathname, publicUrl.pathname]));

if (import.meta.main) {
  console.log("Server listening on port http://localhost:8000");
  await app.listen({ port: 8000 });
}

import { Application, Router } from "@oak/oak";
import { oakCors } from "@tajpouria/cors";
import routeStaticFilesFrom from "./util/routeStaticFilesFrom.ts";
import { matchMake } from "./matchmaking.ts";
import { UserData } from "../shared/user.ts";
import { AppState } from "./config.ts";
import { createUser, loginUser, userMiddleware } from "./user.ts";

export const app = new Application<AppState>();
const router = new Router<AppState>();

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

router.post("/api/user/register", async (context) => {
  if (!context.request.hasBody) {
    context.response.status = 400;
    context.response.body = "Bad Request: No data provided.";
    return;
  }
  const register: { name: string } = await context.request.body.json();
  if (!register.name || typeof register.name !== "string") {
    context.response.status = 400;
    context.response.body = "Bad Request: Invalid name.";
    return;
  }
  context.response.body = createUser(register.name);
});

router.post("/api/user/login", async (context) => {
  if (!context.request.hasBody) {
    context.response.status = 400;
    context.response.body = "Bad Request: No data provided.";
    return;
  }
  const user: UserData = await context.request.body.json();
  if (!user.id || typeof user.id !== "string") {
    context.response.status = 400;
    context.response.body = "Bad Request: Invalid user ID.";
    return;
  }
  loginUser(user);
  context.response.body = "Login successful.";
});

app.use(oakCors());
app.use(userMiddleware);
app.use(router.routes());
app.use(router.allowedMethods());
app.use(routeStaticFilesFrom([`${Deno.cwd()}/dist`, `${Deno.cwd()}/public`]));

if (import.meta.main) {
  console.log("Server listening on port http://localhost:8000");
  await app.listen({ port: 8000 });
}

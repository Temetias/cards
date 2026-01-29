import { Middleware } from "@oak/oak";
import { UserData } from "../shared/user.ts";
import { AppState } from "./config.ts";
import { uuid } from "../shared/utils.ts";
import { DEFAULT_DECK } from "../shared/constants.ts";

// This is all very placeholder prototype.

const userCache = new Map<string, UserData>();

export const userMiddleware: Middleware<AppState> = async (ctx, next) => {
  const userId = ctx.request.url.searchParams.get("userId");
  if (!userId) {
    await next();
    return;
  }
  const user = userCache.get(userId);
  if (!user) {
    await next();
    return;
  }
  console.log("Authenticated user:", user.id);
  ctx.state.user = user;
  await next();
};

export function loginUser(user: UserData) {
  console.log("Logging in user:", user.id);
  userCache.set(user.id, user);
}

export function createUser(name: string): UserData {
  const newUser: UserData = {
    id: uuid(),
    name,
    collection: [],
    credits: 100,
    decks: [],
    activeDeck: {
      id: uuid(),
      name: "Default Deck",
      cards: DEFAULT_DECK(),
    },
  };
  loginUser(newUser);
  return newUser;
}

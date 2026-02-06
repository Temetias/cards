import { UserData } from "../shared/user.ts";

export type AppState = {
  user?: UserData;
};

function getEnv(key: string, fallback: string) {
  return Deno.env.get(key) ?? fallback;
}

export const DISCORD_CLIENT_ID = getEnv(
  "DISCORD_CLIENT_ID",
  "DISCORD_CLIENT_ID_HERE",
);
export const DISCORD_CLIENT_SECRET = getEnv(
  "DISCORD_CLIENT_SECRET",
  "DISCORD_CLIENT_SECRET_HERE",
);
export const DISCORD_PUBLIC_KEY = getEnv(
  "DISCORD_PUBLIC_KEY",
  "DISCORD_PUBLIC_KEY_HERE",
);
export const DISCORD_REDIRECT_URI = getEnv(
  "DISCORD_REDIRECT_URI",
  "http://localhost:8000/api/user/login/discord/callback",
);
export const FRONTEND_ORIGIN = getEnv(
  "FRONTEND_ORIGIN",
  "http://localhost:3000",
);

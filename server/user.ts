import { Middleware, Router } from "@oak/oak";
import { UserData } from "../shared/user.ts";
import {
  AppState,
  DISCORD_CLIENT_ID,
  DISCORD_CLIENT_SECRET,
  DISCORD_REDIRECT_URI,
  FRONTEND_ORIGIN,
} from "./config.ts";
import { brand, uuid } from "../shared/utils.ts";
import { DEFAULT_DECK } from "../shared/constants.ts";
import { DatabaseSync } from "node:sqlite";

const LOCAL_PROVIDER = "local";
const DISCORD_PROVIDER = "discord";

type IdentityRow = {
  user_id: string;
  provider: string;
  provider_id: string;
  password_hash: string | null;
  password_salt: string | null;
  password_iterations: number | null;
};

type UserRow = {
  id: string;
  name: string;
  collection: string;
  credits: number;
  decks: string;
  active_deck: string;
};

type DiscordUser = {
  id: string;
  username: string;
  global_name: string | null;
};

const encoder = new TextEncoder();

function toBase64(buffer: ArrayBuffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function fromBase64(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function hashPassword(
  password: string,
  salt: Uint8Array,
  iterations: number,
) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const derived = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: salt as unknown as BufferSource,
      iterations,
    },
    key,
    256,
  );
  return toBase64(derived);
}

async function verifyPassword(
  password: string,
  saltBase64: string,
  hashBase64: string,
  iterations: number,
) {
  const salt = new Uint8Array(fromBase64(saltBase64));
  const candidate = await hashPassword(password, salt, iterations);
  return candidate === hashBase64;
}

function createUserRow(name: string): UserData {
  return {
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
}

function mapUserRow(row: UserRow): UserData {
  return {
    id: brand(row.id, "UUID"),
    name: row.name,
    collection: JSON.parse(row.collection),
    credits: row.credits,
    decks: JSON.parse(row.decks),
    activeDeck: JSON.parse(row.active_deck),
  };
}

function getUserById(db: DatabaseSync, userId: string): UserData | null {
  const stmt = db.prepare(
    "SELECT id, name, collection, credits, decks, active_deck FROM users WHERE id = ?",
  );
  const row = stmt.get(userId) as UserRow | undefined;
  return row ? mapUserRow(row) : null;
}

function getLocalIdentity(
  db: DatabaseSync,
  username: string,
): IdentityRow | null {
  const stmt = db.prepare(
    "SELECT user_id, provider, provider_id, password_hash, password_salt, password_iterations FROM identities WHERE provider = ? AND provider_id = ?",
  );
  const row = stmt.get(LOCAL_PROVIDER, username) as IdentityRow | undefined;
  return row ?? null;
}

function getIdentity(
  db: DatabaseSync,
  provider: string,
  providerId: string,
): IdentityRow | null {
  const stmt = db.prepare(
    "SELECT user_id, provider, provider_id, password_hash, password_salt, password_iterations FROM identities WHERE provider = ? AND provider_id = ?",
  );
  const row = stmt.get(provider, providerId) as IdentityRow | undefined;
  return row ?? null;
}

function insertUser(db: DatabaseSync, user: UserData) {
  const stmt = db.prepare(
    "INSERT INTO users (id, name, collection, credits, decks, active_deck, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
  );
  stmt.run(
    user.id,
    user.name,
    JSON.stringify(user.collection),
    user.credits,
    JSON.stringify(user.decks),
    JSON.stringify(user.activeDeck),
    Date.now(),
  );
}

function insertLocalIdentity(
  db: DatabaseSync,
  userId: string,
  username: string,
  passwordHash: string,
  passwordSalt: string,
  iterations: number,
) {
  const stmt = db.prepare(
    "INSERT INTO identities (user_id, provider, provider_id, password_hash, password_salt, password_iterations, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
  );
  stmt.run(
    userId,
    LOCAL_PROVIDER,
    username,
    passwordHash,
    passwordSalt,
    iterations,
    Date.now(),
  );
}

function insertIdentity(
  db: DatabaseSync,
  userId: string,
  provider: string,
  providerId: string,
) {
  const stmt = db.prepare(
    "INSERT INTO identities (user_id, provider, provider_id, password_hash, password_salt, password_iterations, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
  );
  stmt.run(userId, provider, providerId, null, null, null, Date.now());
}

function discordAuthorizeUrl() {
  const url = new URL("https://discord.com/api/oauth2/authorize");
  url.searchParams.set("client_id", DISCORD_CLIENT_ID);
  url.searchParams.set("redirect_uri", DISCORD_REDIRECT_URI);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "identify");
  return url.toString();
}

function discordLoginHtml(user: UserData) {
  const userJson = JSON.stringify(user).replaceAll("</", "<\\/");
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Signing in...</title>
  </head>
  <body>
    <p>Signing in...</p>
    <script>
      const user = ${userJson};
      const payload = btoa(unescape(encodeURIComponent(JSON.stringify(user))));
      window.location.href = "${FRONTEND_ORIGIN}/login#discord=" + encodeURIComponent(payload);
    </script>
  </body>
</html>`;
}

export function initUserTables(db: DatabaseSync) {
  db.exec(
    "CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, name TEXT NOT NULL, collection TEXT NOT NULL, credits INTEGER NOT NULL, decks TEXT NOT NULL, active_deck TEXT NOT NULL, created_at INTEGER NOT NULL)",
  );
  db.exec(
    "CREATE TABLE IF NOT EXISTS identities (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL, provider TEXT NOT NULL, provider_id TEXT NOT NULL, password_hash TEXT, password_salt TEXT, password_iterations INTEGER, created_at INTEGER NOT NULL, UNIQUE(provider, provider_id), FOREIGN KEY(user_id) REFERENCES users(id))",
  );
}

export function createUserMiddleware(db: DatabaseSync): Middleware<AppState> {
  return async (ctx, next) => {
    const userId = ctx.request.url.searchParams.get("userId");
    if (!userId) {
      await next();
      return;
    }
    const user = getUserById(db, userId);
    if (!user) {
      await next();
      return;
    }
    console.log("Authenticated user:", user.id);
    ctx.state.user = user;
    await next();
  };
}

export function userRoutes(router: Router<AppState>, db: DatabaseSync) {
  router.get("/api/user/login/discord/start", (context) => {
    context.response.redirect(discordAuthorizeUrl());
  });

  router.get("/api/user/login/discord/callback", async (context) => {
    const code = context.request.url.searchParams.get("code");
    if (!code) {
      context.response.status = 400;
      context.response.body = "Bad Request: Missing code.";
      return;
    }

    const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: DISCORD_REDIRECT_URI,
        scope: "identify",
      }),
    });

    if (!tokenResponse.ok) {
      context.response.status = 502;
      context.response.body = "Bad Gateway: Discord token exchange failed.";
      return;
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token as string | undefined;
    if (!accessToken) {
      context.response.status = 502;
      context.response.body = "Bad Gateway: Missing access token.";
      return;
    }

    const userResponse = await fetch("https://discord.com/api/users/@me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userResponse.ok) {
      context.response.status = 502;
      context.response.body = "Bad Gateway: Discord user fetch failed.";
      return;
    }

    const discordUser = (await userResponse.json()) as DiscordUser;
    const identity = getIdentity(db, DISCORD_PROVIDER, discordUser.id);
    let user = identity ? getUserById(db, identity.user_id) : null;

    if (!user) {
      const displayName = discordUser.global_name || discordUser.username;
      user = createUserRow(displayName);
      try {
        db.exec("BEGIN");
        insertUser(db, user);
        insertIdentity(db, user.id, DISCORD_PROVIDER, discordUser.id);
        db.exec("COMMIT");
      } catch (error) {
        db.exec("ROLLBACK");
        console.error("Failed to create Discord user:", error);
        context.response.status = 500;
        context.response.body = "Internal Server Error.";
        return;
      }
    }

    context.response.headers.set("Content-Type", "text/html");
    context.response.body = discordLoginHtml(user);
  });

  router.post("/api/user/register", async (context) => {
    if (!context.request.hasBody) {
      context.response.status = 400;
      context.response.body = "Bad Request: No data provided.";
      return;
    }
    const register: { username?: string; password?: string; name?: string } =
      await context.request.body.json();
    if (!register.username || typeof register.username !== "string") {
      context.response.status = 400;
      context.response.body = "Bad Request: Invalid username.";
      return;
    }
    if (!register.password || typeof register.password !== "string") {
      context.response.status = 400;
      context.response.body = "Bad Request: Invalid password.";
      return;
    }
    const username = register.username.trim();
    const password = register.password;
    const existingIdentity = getLocalIdentity(db, username);
    if (existingIdentity) {
      context.response.status = 409;
      context.response.body = "Conflict: Username already exists.";
      return;
    }

    const iterations = 310_000;
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const passwordHash = await hashPassword(password, salt, iterations);
    const user = createUserRow(register.name?.trim() || username);

    try {
      db.exec("BEGIN");
      insertUser(db, user);
      insertLocalIdentity(
        db,
        user.id,
        username,
        passwordHash,
        toBase64(salt.buffer),
        iterations,
      );
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      console.error("Failed to register user:", error);
      context.response.status = 500;
      context.response.body = "Internal Server Error.";
      return;
    }
    context.response.body = user;
  });

  router.post("/api/user/login", async (context) => {
    if (!context.request.hasBody) {
      context.response.status = 400;
      context.response.body = "Bad Request: No data provided.";
      return;
    }
    const login: { username?: string; password?: string } =
      await context.request.body.json();
    if (!login.username || typeof login.username !== "string") {
      context.response.status = 400;
      context.response.body = "Bad Request: Invalid username.";
      return;
    }
    if (!login.password || typeof login.password !== "string") {
      context.response.status = 400;
      context.response.body = "Bad Request: Invalid password.";
      return;
    }
    const identity = getLocalIdentity(db, login.username.trim());
    if (
      !identity ||
      !identity.password_hash ||
      !identity.password_salt ||
      !identity.password_iterations
    ) {
      context.response.status = 401;
      context.response.body = "Unauthorized: Invalid credentials.";
      return;
    }
    const ok = await verifyPassword(
      login.password,
      identity.password_salt,
      identity.password_hash,
      identity.password_iterations,
    );
    if (!ok) {
      context.response.status = 401;
      context.response.body = "Unauthorized: Invalid credentials.";
      return;
    }
    const user = getUserById(db, identity.user_id);
    if (!user) {
      context.response.status = 404;
      context.response.body = "Not Found: User missing.";
      return;
    }
    context.response.body = user;
  });
}

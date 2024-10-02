import type { Route } from "@std/http/unstable-route";
import type { DB } from "https://deno.land/x/sqlite@v3.9.0/mod.ts";
import {
  readHandler,
  readAllHandler,
  type CreateEntityFunction,
  type DeleteEntityFunction,
  type ReadAllEntityFunction,
  type ReadEntityFunction,
  type UpdateEntityFunction,
  createHandler,
  updateHandler,
  deleteHandler,
} from "./crud.ts";
import { V4 } from "https://deno.land/x/uuid@v0.1.2/mod.ts";
import { type User, type CollectionItem } from "@cards/shared";

function migration(db: DB) {
  db.query(/* sql */ `CREATE TABLE IF NOT EXISTS User (
    id TEXT PRIMARY KEY,
    name TEXT,
    tokens INTEGER DEFAULT 0,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);
  db.query(/* sql */ `CREATE TABLE IF NOT EXISTS UserCardCollection (
    userId TEXT NOT NULL,
    id TEXT NOT NULL,
    PRIMARY KEY (userId, id),
    FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
  )`);
}

const create: CreateEntityFunction<User> = (db, user) => {
  const v4 = V4.uuid();
  const [result] = db.query<[string, string, number, string, string]>(
    /* sql */ `INSERT INTO User (id, name) VALUES (?, ?) RETURNING id, name, tokens, createdAt, updatedAt`,
    [v4, user.name]
  );
  const [id, name, tokens, createdAt, updatedAt] = result;
  return { id, name, tokens, createdAt, updatedAt };
};

const read: ReadEntityFunction<User> = (db, idParam) => {
  const [result] = db.query<[string, string, number, string, string]>(
    /* sql */ `SELECT id, name, tokens, createdAt, updatedAt FROM User WHERE id = ?`,
    [idParam]
  );
  if (!result) return;
  const [id, name, tokens, createdAt, updatedAt] = result;
  return { id, name, tokens, createdAt, updatedAt };
};

const readAll: ReadAllEntityFunction<User> = (db) => {
  return db
    .query<[string, string, number, string, string]>(
      /* sql */ `SELECT id, name, tokens, createdAt, updatedAt FROM User`
    )
    .map(([id, name, tokens, createdAt, updatedAt]) => ({
      id,
      name,
      tokens,
      createdAt,
      updatedAt,
    }));
};

const update: UpdateEntityFunction<User> = (db, idParam, user) => {
  const now = new Date().toISOString();
  const [currentResult] = db.query<[string, string, number, string, string]>(
    /* sql */ `SELECT id, name, tokens, createdAt, updatedAt FROM User WHERE id = ?`,
    [idParam]
  );
  if (!currentResult) return;
  const [curId, curName, curTokens, curCreatedAt, curUpdatedAt] = currentResult;
  const current: User = {
    id: curId,
    name: curName,
    tokens: curTokens,
    createdAt: curCreatedAt,
    updatedAt: curUpdatedAt,
  };
  const merged = { ...current, ...user };
  const [result] = db.query<[string, string, number, string, string]>(
    /* sql */ `UPDATE User SET name = ?, tokens = ?, updatedAt = ? WHERE id = ? RETURNING id, name, tokens, createdAt, updatedAt
    `,
    [merged.name, merged.tokens, now, idParam]
  );
  if (!result) return;
  const [id, name, tokens, createdAt, updatedAt] = result;
  return { id, name, tokens, createdAt, updatedAt };
};

const del: DeleteEntityFunction<User> = (db, idParam) => {
  const [result] = db.query<[string, number, string, string]>(
    /* sql */ `DELETE FROM User WHERE id = ? RETURNING name, tokens, createdAt, updatedAt`,
    [idParam]
  );
  if (!result) return;
  const [name, tokens, createdAt, updatedAt] = result;
  return { name, tokens, createdAt, updatedAt };
};

function readCollection(db: DB, userId: string): CollectionItem[] {
  return db
    .query<[string, number]>(
      /* sql */ `SELECT id, amount FROM UserCardCollection WHERE userId = ?`,
      [userId]
    )
    .map(([id, amount]) => ({ id, amount }));
}

export function getUserRoutes(db: DB): Route[] {
  migration(db);
  return [
    {
      pattern: new URLPattern({ pathname: "/user" }),
      method: "POST",
      handler: createHandler(db, create),
    },
    {
      pattern: new URLPattern({ pathname: "/user" }),
      method: "GET",
      handler: readAllHandler(db, readAll),
    },
    {
      pattern: new URLPattern({ pathname: "/user/:id" }),
      method: "GET",
      handler: readHandler(db, read),
    },
    {
      pattern: new URLPattern({ pathname: "/user/:id" }),
      method: "PUT",
      handler: updateHandler(db, update),
    },
    {
      pattern: new URLPattern({ pathname: "/user/:id" }),
      method: "DELETE",
      handler: deleteHandler(db, del),
    },
    {
      pattern: new URLPattern({ pathname: "/collection/:id" }),
      method: "GET",
      handler: readHandler(db, readCollection as any),
    },
  ];
}

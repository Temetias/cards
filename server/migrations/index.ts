import { DatabaseSync } from "node:sqlite";
import { migration001 } from "./001_add_user_stats.ts";

type Migration = (db: DatabaseSync) => void;

const migrations: Migration[] = [migration001];

export function runMigrations(db: DatabaseSync) {
  for (const migration of migrations) {
    migration(db);
  }
}

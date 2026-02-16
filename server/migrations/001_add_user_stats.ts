import { DatabaseSync } from "node:sqlite";

export function migration001(db: DatabaseSync) {
  // Add wins, losses, and forfeits columns to users table
  try {
    db.exec("ALTER TABLE users ADD COLUMN wins INTEGER NOT NULL DEFAULT 0");
  } catch {
    // Column already exists
  }

  try {
    db.exec("ALTER TABLE users ADD COLUMN losses INTEGER NOT NULL DEFAULT 0");
  } catch {
    // Column already exists
  }

  try {
    db.exec("ALTER TABLE users ADD COLUMN forfeits INTEGER NOT NULL DEFAULT 0");
  } catch {
    // Column already exists
  }
}

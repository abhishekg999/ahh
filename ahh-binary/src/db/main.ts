import { Database } from "bun:sqlite";
import { type BunSQLiteDatabase, drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { resource } from "../utils/fs";
import { prepareMigrations } from "./migrations";
import * as schema from "./schema";

const DB_PATH = resource("db/ahh.db");

let _db: BunSQLiteDatabase<typeof schema> | null = null;

export function getDb(): BunSQLiteDatabase<typeof schema> {
  if (!_db) {
    const migrationsFolder = prepareMigrations();
    const sqlite = new Database(DB_PATH);
    sqlite.exec("PRAGMA journal_mode = WAL");
    sqlite.exec("PRAGMA busy_timeout = 5000");
    sqlite.exec("PRAGMA foreign_keys = ON");

    _db = drizzle(sqlite, { schema });
    migrate(_db, { migrationsFolder });
  }
  return _db;
}

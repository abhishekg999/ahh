import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { eq } from "drizzle-orm";
import { resource } from "../utils/fs";
import * as schema from "./schema";

const DB_PATH = resource("ahh.db");

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

function ensureSchema(sqlite: Database) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS tunnel_mappings (
      subdomain TEXT PRIMARY KEY,
      port INTEGER NOT NULL,
      pid INTEGER NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );
  `);
}

export function getDb() {
  if (!_db) {
    const sqlite = new Database(DB_PATH);
    sqlite.exec("PRAGMA journal_mode = WAL");
    ensureSchema(sqlite);
    _db = drizzle(sqlite, { schema });
  }
  return _db;
}

function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

export function pruneStaleMappings() {
  const db = getDb();
  const all = db.select().from(schema.tunnelMappings).all();
  for (const row of all) {
    if (!isProcessAlive(row.pid)) {
      db.delete(schema.tunnelMappings)
        .where(eq(schema.tunnelMappings.subdomain, row.subdomain))
        .run();
    }
  }
}

export function getActiveMappingCount(): number {
  const db = getDb();
  return db.select().from(schema.tunnelMappings).all().length;
}

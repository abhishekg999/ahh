import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { resource } from "../utils/fs";
import journal from "../../drizzle/meta/_journal.json";
import m0000 from "../../drizzle/0000_slow_natasha_romanoff.sql" with { type: "text" };

/**
 * Migration SQL indexed by tag from the journal.
 * When adding a new migration:
 *   1. Run `bunx drizzle-kit generate`
 *   2. Import the new .sql file above
 *   3. Add an entry here keyed by its tag
 */
const migrationSql: Record<string, string> = {
  "0000_slow_natasha_romanoff": m0000,
};

const MIGRATIONS_DIR = resource("db/migrations");
const JOURNAL_STR = JSON.stringify(journal);

function isUpToDate(): boolean {
  const journalPath = join(MIGRATIONS_DIR, "meta", "_journal.json");
  try {
    const disk = readFileSync(journalPath, "utf-8");
    return JSON.stringify(JSON.parse(disk)) === JOURNAL_STR;
  } catch {
    return false;
  }
}

/**
 * Write bundled migrations to ~/.ahh/db/migrations/ so drizzle's
 * standard migrate() can read them. Skips if already up to date.
 */
export function prepareMigrations(): string {
  if (isUpToDate()) return MIGRATIONS_DIR;

  const metaDir = join(MIGRATIONS_DIR, "meta");
  mkdirSync(metaDir, { recursive: true });

  writeFileSync(
    join(metaDir, "_journal.json"),
    JSON.stringify(journal, null, 2),
  );

  for (const entry of journal.entries) {
    const sql = migrationSql[entry.tag];
    if (!sql) {
      throw new Error(`Missing migration SQL for: ${entry.tag}`);
    }
    writeFileSync(join(MIGRATIONS_DIR, `${entry.tag}.sql`), sql);
  }

  return MIGRATIONS_DIR;
}

import { count, eq, inArray } from "drizzle-orm";
import { getDb } from "../../db/main";
import { tunnelMappings } from "../../db/schema";

export function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

export function pruneStaleMappings() {
  const db = getDb();
  const all = db.select().from(tunnelMappings).all();
  const stale = all
    .filter((row) => !isProcessAlive(row.pid))
    .map((row) => row.subdomain);

  if (stale.length > 0) {
    db.delete(tunnelMappings)
      .where(inArray(tunnelMappings.subdomain, stale))
      .run();
  }
}

export function getActiveMappingCount(): number {
  const db = getDb();
  const result = db.select({ count: count() }).from(tunnelMappings).get();
  return result?.count ?? 0;
}

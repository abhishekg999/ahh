import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const tunnelMappings = sqliteTable("tunnel_mappings", {
  subdomain: text("subdomain").primaryKey(),
  port: integer("port").notNull(),
  pid: integer("pid").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// Drizzle-kit config — schema and migrations live under server/database/.
// The app runs on Cloudflare D1 (sqlite); `wrangler d1 migrations apply` runs
// ./server/database/migrations (migrations_dir in wrangler.jsonc).
// To target another database later: add schema/<dialect>.ts, extend the map
// below, and set DB_DIALECT.
import { defineConfig } from "drizzle-kit";

type Dialect = "sqlite" | "postgresql" | "mysql";

const DIALECTS: Record<Dialect, { schema: string; out: string }> = {
  sqlite: { schema: "./server/database/schema/sqlite.ts", out: "./server/database/migrations" },
};

const dialect = (process.env.DB_DIALECT ?? "sqlite") as Dialect;
const selected = DIALECTS[dialect];
if (!selected) {
  throw new Error(
    `DB_DIALECT "${dialect}" is not set up — add server/database/schema/${dialect}.ts and a drizzle.config.ts entry first`,
  );
}

export default defineConfig({
  dialect,
  ...selected,
});

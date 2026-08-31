// Database access layer. Two consumers:
// - useDb(): raw D1 binding — legacy handlers run hand-written SQL on it
// - useDrizzle(): typed drizzle client — new code; schema in server/database/schema
//
// The app targets Cloudflare D1 (sqlite). Migration generation follows
// server/database/schema + drizzle.config.ts; other dialects are added there
// when actually needed.
import { drizzle } from "drizzle-orm/d1";
import type { H3Event } from "h3";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "../database/schema/sqlite";

// hand-rolled minimal D1 types — @cloudflare/workers-types as a devDependency
// types every handler transitively, these keep the surface we actually use
type D1Result<T> = { results: T[] };
type D1PreparedStatement = {
  bind: (...values: unknown[]) => D1PreparedStatement;
  all: <T = Record<string, unknown>>() => Promise<D1Result<T>>;
  first: <T = Record<string, unknown>>() => Promise<T | null>;
};
type D1Database = {
  prepare: (query: string) => D1PreparedStatement;
  batch: <T = Record<string, unknown>>(statements: D1PreparedStatement[]) => Promise<D1Result<T>[]>;
};

export type AppDrizzle = DrizzleD1Database<typeof schema>;

function cloudflareEnv(event: H3Event): Record<string, unknown> | undefined {
  // nitro only types cloudflare.env with the cloudflare-module preset
  return (event.context as { cloudflare?: { env?: Record<string, unknown> } }).cloudflare?.env;
}

export function useDb(event: H3Event): D1Database {
  const db = cloudflareEnv(event)?.DB as D1Database | undefined;
  if (!db) throw createError({ statusCode: 500, statusMessage: "D1 binding not available" });
  return db;
}

export function useDrizzle(event: H3Event): AppDrizzle {
  const env = cloudflareEnv(event);
  const dialect = (env?.DB_DIALECT as string | undefined) ?? "sqlite";
  if (dialect !== "sqlite") {
    throw createError({
      statusCode: 500,
      statusMessage: `DB_DIALECT "${dialect}" has no runtime driver wired — sqlite/D1 only (see server/utils/db.ts)`,
    });
  }
  const db = env?.DB as D1Database | undefined;
  if (!db) throw createError({ statusCode: 500, statusMessage: "D1 binding not available" });
  return drizzle(db, { schema });
}

export function parseTags(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw as string[];
  try {
    const parsed = JSON.parse((raw as string) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

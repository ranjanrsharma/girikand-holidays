import fs from "node:fs";
import path from "node:path";

export interface Db {
  query<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<T[]>;
}

const schemaPath = path.join(process.cwd(), "db", "schema.sql");

async function open(): Promise<Db> {
  const schema = fs.readFileSync(schemaPath, "utf8");
  const url = process.env.DATABASE_URL;

  if (url) {
    const { default: postgres } = await import("postgres");
    const sql = postgres(url, { max: 5 });
    await sql.unsafe(schema);
    const db: Db = {
      query: async <T,>(text: string, params: unknown[] = []) =>
        (await sql.unsafe(text, params as never[])) as unknown as T[],
    };
    if (process.env.SEED_DEMO === "1") {
      const { seedIfEmpty } = await import("../../db/seed-data");
      await seedIfEmpty(db);
    }
    return db;
  }

  const { PGlite } = await import("@electric-sql/pglite");
  const dir = process.env.PGLITE_DIR ?? path.join(process.cwd(), ".data", "pglite");
  if (dir !== "memory") fs.mkdirSync(dir, { recursive: true }); // PGlite does not create its folder
  const client = dir === "memory" ? new PGlite() : new PGlite(dir);
  await client.exec(schema);
  const db: Db = {
    query: async <T,>(text: string, params: unknown[] = []) =>
      (await client.query<T>(text, params)).rows,
  };
  if (process.env.NODE_ENV !== "production" || process.env.SEED_DEMO === "1") {
    const { seedIfEmpty } = await import("../../db/seed-data");
    await seedIfEmpty(db);
  }
  return db;
}

/** One shared connection per server process. Uses DATABASE_URL (Postgres) or an embedded local database. */
export function getDb(): Promise<Db> {
  const g = globalThis as unknown as { __holidayDb?: Promise<Db> };
  g.__holidayDb ??= open().catch((e) => {
    g.__holidayDb = undefined; // let the next request retry instead of caching the failure
    throw e;
  });
  return g.__holidayDb;
}

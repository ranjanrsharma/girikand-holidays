import { seedIfEmpty } from "./seed-data";
import { getDb } from "../src/lib/db";

// Opening the database already seeds an empty local database; this script is for an explicit run against DATABASE_URL.
process.env.SEED_DEMO = "1";
getDb().then(async (db) => { await seedIfEmpty(db); console.log("seed done"); process.exit(0); });

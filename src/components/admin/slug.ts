// Client-safe copy of slugify from src/lib/packages.ts (that module imports the database, so a client component cannot import it).
export function slugify(text: string): string {
  return text.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

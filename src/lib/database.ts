import "server-only";

export class DatabaseNotConfiguredError extends Error {
  constructor() {
    super("DATABASE_URL is not configured. Add it to your environment before using database-backed dashboard routes.");
    this.name = "DatabaseNotConfiguredError";
  }
}

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export function assertDatabaseConfigured() {
  if (!isDatabaseConfigured()) {
    throw new DatabaseNotConfiguredError();
  }
}

import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

let dbInstance: Database | null = null;

export async function getDb(): Promise<Database> {
  if (dbInstance) return dbInstance;

  const dbPath = path.resolve(process.cwd(), 'traceability.db');

  dbInstance = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  await dbInstance.exec('PRAGMA foreign_keys = ON;');

  await dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS batches (
      id TEXT PRIMARY KEY,
      productName TEXT NOT NULL,
      variety TEXT NOT NULL,
      farmName TEXT NOT NULL,
      origin TEXT NOT NULL,
      harvestDate TEXT NOT NULL,
      quantityKg REAL NOT NULL,
      ownerOrganization TEXT NOT NULL,
      status TEXT NOT NULL,
      verificationId TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS trace_events (
      id TEXT PRIMARY KEY,
      batchId TEXT NOT NULL,
      type TEXT NOT NULL,
      dateTime TEXT NOT NULL,
      actorOrganization TEXT NOT NULL,
      note TEXT,
      transactionId TEXT NOT NULL,
      FOREIGN KEY (batchId) REFERENCES batches(id) ON DELETE CASCADE
    );
  `);

  return dbInstance;
}
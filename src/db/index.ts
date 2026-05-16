import { Platform } from 'react-native';
import { createMemoryDB, MemoryDB } from './memoryDB';

export interface DBHandle {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, params?: any[]): Promise<{ lastInsertRowId: number; changes: number }>;
  getAllAsync<T = any>(sql: string, params?: any[]): Promise<T[]>;
}

let _db: DBHandle | null = null;

export async function getDB(): Promise<DBHandle> {
  if (_db) return _db;
  if (Platform.OS === 'web') {
    _db = createMemoryDB();
    await migrate(_db);
    return _db;
  }
  
  // 原生平台才引入真实 SQLite
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const SQLite = require('expo-sqlite');
  const actualDb = await SQLite.openDatabaseAsync('badminton.db');
  _db = actualDb;
  await migrate(actualDb);
  return actualDb;
}

async function migrate(db: DBHandle) {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS training_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      plan_id TEXT,
      duration_min INTEGER NOT NULL DEFAULT 0,
      categories TEXT NOT NULL DEFAULT '[]',
      intensity INTEGER NOT NULL DEFAULT 3,
      note TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pose_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      action_type TEXT NOT NULL,
      duration_sec INTEGER NOT NULL,
      score INTEGER,
      issues TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS replay_clips (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uri TEXT NOT NULL,
      title TEXT,
      tags TEXT,
      annotations TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      weekday INTEGER NOT NULL,
      hour INTEGER NOT NULL,
      minute INTEGER NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 1,
      notification_id TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_plans (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      data TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tutorial_favorites (
      tutorial_id TEXT PRIMARY KEY,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tutorial_views (
      tutorial_id TEXT PRIMARY KEY,
      viewed_at INTEGER NOT NULL
    );
  `);
}

export async function resetDB() {
  const db = await getDB();
  await db.execAsync(`
    DROP TABLE IF EXISTS training_logs;
    DROP TABLE IF EXISTS pose_sessions;
    DROP TABLE IF EXISTS replay_clips;
    DROP TABLE IF EXISTS schedules;
    DROP TABLE IF EXISTS user_plans;
    DROP TABLE IF EXISTS tutorial_favorites;
    DROP TABLE IF EXISTS tutorial_views;
  `);
  _db = null;
  await getDB();
}

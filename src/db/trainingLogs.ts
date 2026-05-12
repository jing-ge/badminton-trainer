import dayjs from 'dayjs';
import { getDB } from './index';

export type TrainingLog = {
  id: number;
  date: string;
  plan_id: string | null;
  duration_min: number;
  categories: string[];
  intensity: number;
  note: string | null;
  created_at: number;
};

export async function insertTrainingLog(input: {
  date?: string;
  plan_id?: string | null;
  duration_min: number;
  categories: string[];
  intensity?: number;
  note?: string;
}) {
  const db = await getDB();
  const date = input.date ?? dayjs().format('YYYY-MM-DD');
  await db.runAsync(
    `INSERT INTO training_logs (date, plan_id, duration_min, categories, intensity, note, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      date,
      input.plan_id ?? null,
      input.duration_min,
      JSON.stringify(input.categories),
      input.intensity ?? 3,
      input.note ?? null,
      Date.now(),
    ],
  );
}

export async function listTrainingLogs(limit = 60): Promise<TrainingLog[]> {
  const db = await getDB();
  const rows = await db.getAllAsync<any>(
    `SELECT * FROM training_logs ORDER BY date DESC, id DESC LIMIT ?`,
    [limit],
  );
  return rows.map((r) => ({
    ...r,
    categories: safeParse(r.categories, []),
  }));
}

export async function deleteTrainingLog(id: number) {
  const db = await getDB();
  await db.runAsync(`DELETE FROM training_logs WHERE id = ?`, [id]);
}

export async function getDailyMinutes(days = 14) {
  const db = await getDB();
  const since = dayjs().subtract(days - 1, 'day').format('YYYY-MM-DD');
  const rows = await db.getAllAsync<{ date: string; mins: number }>(
    `SELECT date, SUM(duration_min) as mins FROM training_logs
     WHERE date >= ? GROUP BY date ORDER BY date ASC`,
    [since],
  );
  const map = new Map(rows.map((r) => [r.date, r.mins]));
  const result: { date: string; mins: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
    result.push({ date: d, mins: map.get(d) ?? 0 });
  }
  return result;
}

export async function getStreak(): Promise<number> {
  const db = await getDB();
  const rows = await db.getAllAsync<{ date: string }>(
    `SELECT DISTINCT date FROM training_logs ORDER BY date DESC`,
  );
  const set = new Set(rows.map((r) => r.date));
  let streak = 0;
  let cursor = dayjs();
  if (!set.has(cursor.format('YYYY-MM-DD'))) {
    cursor = cursor.subtract(1, 'day');
  }
  while (set.has(cursor.format('YYYY-MM-DD'))) {
    streak++;
    cursor = cursor.subtract(1, 'day');
  }
  return streak;
}

function safeParse<T>(s: string | null, fallback: T): T {
  if (!s) return fallback;
  try {
    return JSON.parse(s);
  } catch {
    return fallback;
  }
}

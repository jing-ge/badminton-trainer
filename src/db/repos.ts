import dayjs from 'dayjs';
import { getDB } from './index';

export type Schedule = {
  id: number;
  title: string;
  weekday: number;
  hour: number;
  minute: number;
  enabled: number;
  notification_id: string | null;
  created_at: number;
};

export async function listSchedules(): Promise<Schedule[]> {
  const db = await getDB();
  return db.getAllAsync<Schedule>(
    `SELECT * FROM schedules ORDER BY weekday ASC, hour ASC`,
  );
}

export async function insertSchedule(s: {
  title: string;
  weekday: number;
  hour: number;
  minute: number;
  notification_id?: string | null;
}): Promise<number> {
  const db = await getDB();
  const r = await db.runAsync(
    `INSERT INTO schedules (title, weekday, hour, minute, enabled, notification_id, created_at)
     VALUES (?, ?, ?, ?, 1, ?, ?)`,
    [s.title, s.weekday, s.hour, s.minute, s.notification_id ?? null, Date.now()],
  );
  return r.lastInsertRowId as number;
}

export async function updateSchedule(
  id: number,
  patch: Partial<Pick<Schedule, 'enabled' | 'notification_id'>>,
) {
  const db = await getDB();
  if (patch.enabled !== undefined) {
    await db.runAsync(`UPDATE schedules SET enabled = ? WHERE id = ?`, [
      patch.enabled,
      id,
    ]);
  }
  if (patch.notification_id !== undefined) {
    await db.runAsync(
      `UPDATE schedules SET notification_id = ? WHERE id = ?`,
      [patch.notification_id, id],
    );
  }
}

export async function deleteSchedule(id: number) {
  const db = await getDB();
  await db.runAsync(`DELETE FROM schedules WHERE id = ?`, [id]);
}

export async function insertReplayClip(c: {
  uri: string;
  title?: string;
  tags?: string[];
}): Promise<number> {
  const db = await getDB();
  const r = await db.runAsync(
    `INSERT INTO replay_clips (uri, title, tags, annotations, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [
      c.uri,
      c.title ?? dayjs().format('YYYY-MM-DD HH:mm'),
      JSON.stringify(c.tags ?? []),
      JSON.stringify([]),
      Date.now(),
    ],
  );
  return r.lastInsertRowId as number;
}

export async function listReplayClips() {
  const db = await getDB();
  const rows = await db.getAllAsync<any>(
    `SELECT * FROM replay_clips ORDER BY id DESC`,
  );
  return rows.map((r) => ({
    ...r,
    tags: safeParse(r.tags, []),
    annotations: safeParse(r.annotations, []),
  }));
}

export async function deleteReplayClip(id: number) {
  const db = await getDB();
  await db.runAsync(`DELETE FROM replay_clips WHERE id = ?`, [id]);
}

export async function updateReplayAnnotations(id: number, annotations: any[]) {
  const db = await getDB();
  await db.runAsync(
    `UPDATE replay_clips SET annotations = ? WHERE id = ?`,
    [JSON.stringify(annotations), id],
  );
}

export async function insertPoseSession(s: {
  action_type: string;
  duration_sec: number;
  score?: number;
  issues?: string[];
}) {
  const db = await getDB();
  await db.runAsync(
    `INSERT INTO pose_sessions (date, action_type, duration_sec, score, issues, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      dayjs().format('YYYY-MM-DD'),
      s.action_type,
      s.duration_sec,
      s.score ?? null,
      JSON.stringify(s.issues ?? []),
      Date.now(),
    ],
  );
}

export async function listPoseSessions(limit = 30) {
  const db = await getDB();
  const rows = await db.getAllAsync<any>(
    `SELECT * FROM pose_sessions ORDER BY id DESC LIMIT ?`,
    [limit],
  );
  return rows.map((r) => ({ ...r, issues: safeParse(r.issues, []) }));
}

function safeParse<T>(s: string | null, fallback: T): T {
  if (!s) return fallback;
  try {
    return JSON.parse(s);
  } catch {
    return fallback;
  }
}

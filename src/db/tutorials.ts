/**
 * 教程收藏 + 浏览埋点持久层。
 * 任何失败都静默 console.warn，不抛、不弹——埋点失败不应阻断业务。
 */
import { getDB } from './index';

export async function isFavorite(id: string): Promise<boolean> {
  try {
    const db = await getDB();
    const rows = await db.getAllAsync<{ tutorial_id: string }>(
      `SELECT tutorial_id FROM tutorial_favorites WHERE tutorial_id = ?`,
      [id],
    );
    return rows.length > 0;
  } catch (e) {
    console.warn('[tutorials.isFavorite] failed', e);
    return false;
  }
}

/**
 * 切换收藏状态，返回切换后的状态（true = 已收藏）。
 */
export async function toggleFavorite(id: string): Promise<boolean> {
  try {
    const db = await getDB();
    const fav = await isFavorite(id);
    if (fav) {
      await db.runAsync(`DELETE FROM tutorial_favorites WHERE tutorial_id = ?`, [id]);
      return false;
    }
    await db.runAsync(
      `INSERT OR REPLACE INTO tutorial_favorites (tutorial_id, created_at) VALUES (?, ?)`,
      [id, Date.now()],
    );
    return true;
  } catch (e) {
    console.warn('[tutorials.toggleFavorite] failed', e);
    return false;
  }
}

export async function listFavoriteIds(): Promise<string[]> {
  try {
    const db = await getDB();
    const rows = await db.getAllAsync<{ tutorial_id: string }>(
      `SELECT tutorial_id FROM tutorial_favorites ORDER BY created_at DESC`,
    );
    return rows.map((r) => r.tutorial_id);
  } catch (e) {
    console.warn('[tutorials.listFavoriteIds] failed', e);
    return [];
  }
}

export async function recordView(id: string): Promise<void> {
  try {
    const db = await getDB();
    await db.runAsync(
      `INSERT OR REPLACE INTO tutorial_views (tutorial_id, viewed_at) VALUES (?, ?)`,
      [id, Date.now()],
    );
  } catch (e) {
    console.warn('[tutorials.recordView] failed', e);
  }
}

export async function listRecentViews(
  limit: number,
): Promise<{ id: string; viewedAt: number }[]> {
  try {
    const db = await getDB();
    const rows = await db.getAllAsync<{ tutorial_id: string; viewed_at: number }>(
      `SELECT tutorial_id, viewed_at FROM tutorial_views ORDER BY viewed_at DESC LIMIT ?`,
      [limit],
    );
    return rows.map((r) => ({ id: r.tutorial_id, viewedAt: r.viewed_at }));
  } catch (e) {
    console.warn('[tutorials.listRecentViews] failed', e);
    return [];
  }
}

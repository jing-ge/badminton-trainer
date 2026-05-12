import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDB } from './index';
import { defaultPlans, getDefaultPlan } from '@/data/presets';
import type { Plan } from '@/data/planTypes';

const ACTIVE_PLAN_KEY = 'badminton.activePlanId';

export async function listUserPlans(): Promise<Plan[]> {
  const db = await getDB();
  const rows = await db.getAllAsync<{ id: string; data: string }>(
    `SELECT id, data FROM user_plans ORDER BY updated_at DESC`,
  );
  return rows
    .map((r) => safeParse<Plan | null>(r.data, null))
    .filter((p): p is Plan => !!p);
}

export async function getPlanById(id: string): Promise<Plan | null> {
  const def = getDefaultPlan(id);
  if (def) return def;
  const db = await getDB();
  const rows = await db.getAllAsync<{ data: string }>(
    `SELECT data FROM user_plans WHERE id = ?`,
    [id],
  );
  if (!rows.length) return null;
  return safeParse<Plan | null>(rows[0].data, null);
}

export async function savePlan(plan: Plan): Promise<void> {
  if (plan.is_default) throw new Error('默认计划只读，请先复制');
  const db = await getDB();
  const now = Date.now();
  const data = JSON.stringify({ ...plan, updated_at: now });
  await db.runAsync(
    `INSERT OR REPLACE INTO user_plans (id, name, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
    [plan.id, plan.name, data, plan.created_at ?? now, now],
  );
}

export async function deletePlan(id: string): Promise<void> {
  const db = await getDB();
  await db.runAsync(`DELETE FROM user_plans WHERE id = ?`, [id]);
  const active = await getActivePlanId();
  if (active === id) await setActivePlanId(null);
}

export async function listAllPlans(): Promise<Plan[]> {
  const user = await listUserPlans();
  return [...user, ...defaultPlans];
}

export async function getActivePlanId(): Promise<string | null> {
  return AsyncStorage.getItem(ACTIVE_PLAN_KEY);
}

export async function setActivePlanId(id: string | null) {
  if (id) await AsyncStorage.setItem(ACTIVE_PLAN_KEY, id);
  else await AsyncStorage.removeItem(ACTIVE_PLAN_KEY);
}

export async function getActivePlan(): Promise<Plan> {
  const id = await getActivePlanId();
  if (id) {
    const p = await getPlanById(id);
    if (p) return p;
  }
  // 默认回到内置中级计划
  return defaultPlans[0];
}

/**
 * 复制一份默认计划（或任意计划）作为新的自定义计划
 */
export async function duplicatePlan(src: Plan, newName?: string): Promise<Plan> {
  const id = `plan-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const cloned: Plan = {
    ...JSON.parse(JSON.stringify(src)),
    id,
    name: newName ?? `${src.name} (副本)`,
    is_default: false,
    created_at: Date.now(),
    updated_at: Date.now(),
  };
  await savePlan(cloned);
  return cloned;
}

export async function createBlankPlan(name: string, mode: Plan['mode'] = 'weekly'): Promise<Plan> {
  const id = `plan-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const plan: Plan = {
    id,
    name,
    level: '自定义',
    mode,
    modules: [],
    is_default: false,
    created_at: Date.now(),
    updated_at: Date.now(),
  };
  await savePlan(plan);
  return plan;
}

function safeParse<T>(s: string, fallback: T): T {
  try {
    return JSON.parse(s);
  } catch {
    return fallback;
  }
}

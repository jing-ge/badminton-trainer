import dayjs from 'dayjs';
import type { Plan, TrainingModule } from './planTypes';

export type TodaySelection = {
  plan: Plan;
  modules: TrainingModule[];
  source: 'weekly' | 'random' | 'pool';
  /** 给随机模式用的"种子"（按日期），同一天调用结果一致 */
  seed?: number;
};

export function selectToday(plan: Plan, today: Date = new Date()): TodaySelection {
  if (plan.mode === 'weekly') {
    const wd = today.getDay();
    const matched = plan.modules.filter((m) => m.weekday === wd);
    return { plan, modules: matched, source: 'weekly' };
  }
  if (plan.mode === 'random') {
    const seed = Number(dayjs(today).format('YYYYMMDD'));
    const rnd = mulberry32(seed);
    const n = Math.max(1, plan.random_pick ?? 3);
    const picked = weightedSampleNoReplace(plan.modules, n, rnd);
    return { plan, modules: picked, source: 'random', seed };
  }
  // pool: 默认全部展示，让用户在详情页里挑
  return { plan, modules: plan.modules, source: 'pool' };
}

/**
 * 重新随机一次（跳过日期种子，立即生成新组合）
 */
export function reshuffleRandom(plan: Plan, n?: number): TrainingModule[] {
  const rnd = Math.random;
  return weightedSampleNoReplace(plan.modules, Math.max(1, n ?? plan.random_pick ?? 3), rnd);
}

function weightedSampleNoReplace(
  pool: TrainingModule[],
  n: number,
  rnd: () => number,
): TrainingModule[] {
  if (pool.length === 0 || n <= 0) return [];
  // 优先分类多样性：先按 category 抽，每个 category 至多两个
  const list = pool.slice();
  const result: TrainingModule[] = [];
  const usedCat = new Map<string, number>();

  while (result.length < n && list.length > 0) {
    const totalWeight = list.reduce((a, b) => a + (b.weight ?? 1), 0);
    let r = rnd() * totalWeight;
    let pickIdx = 0;
    for (let i = 0; i < list.length; i++) {
      r -= list[i].weight ?? 1;
      if (r <= 0) {
        pickIdx = i;
        break;
      }
    }
    const m = list[pickIdx];
    const c = m.category;
    if ((usedCat.get(c) ?? 0) >= 2 && list.some((x) => (usedCat.get(x.category) ?? 0) < 2)) {
      // 当前类别用满了且还有别的类别可选，跳过
      list.splice(pickIdx, 1);
      continue;
    }
    usedCat.set(c, (usedCat.get(c) ?? 0) + 1);
    result.push(m);
    list.splice(pickIdx, 1);
  }
  return result;
}

/** 简单可复现的伪随机数生成器 */
function mulberry32(seed: number) {
  let a = seed | 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

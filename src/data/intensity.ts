// 训练强度档位 1-5 的统一元信息
// 用途：stats Tab、log 详情页、log 录入页、首页最近训练 都从这里取
// 设计意图：替代历史上的 ★/☆ 五星显示，跨 Tab 设计语言一致
export type IntensityLevel = 1 | 2 | 3 | 4 | 5;

export type IntensityMeta = {
  emoji: string;
  label: string;   // 2 字短标签：图表/角标用
  desc: string;    // 私教口吻长描述：录入页副文案用
};

export const INTENSITY_META: Record<IntensityLevel, IntensityMeta> = {
  1: { emoji: '🌿', label: '放松', desc: '轻松散练' },
  2: { emoji: '🚶', label: '轻度', desc: '节奏适中' },
  3: { emoji: '🏃', label: '中等', desc: '标准训练' },
  4: { emoji: '🔥', label: '高强', desc: '高强度' },
  5: { emoji: '⚡', label: '极限', desc: '极限挑战' },
};

export function getIntensityMeta(n: number): IntensityMeta {
  const clamped = Math.max(1, Math.min(5, Math.round(n))) as IntensityLevel;
  return INTENSITY_META[clamped];
}

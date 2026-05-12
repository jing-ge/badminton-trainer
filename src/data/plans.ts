export type PlanItem = {
  id: string;
  name: string;
  duration_min: number;
  category: 'tech' | 'footwork' | 'fitness' | 'match' | 'recovery';
  notes?: string;
};

export type DailyPlan = {
  weekday: number;
  title: string;
  focus: string;
  items: PlanItem[];
};

export const intermediateWeeklyPlan: DailyPlan[] = [
  {
    weekday: 1,
    title: '周一 · 后场技术日',
    focus: '高远球、吊球、杀球',
    items: [
      { id: 'mon-warm', name: '动态热身（关节活动 + 慢跑）', duration_min: 10, category: 'recovery' },
      { id: 'mon-multi-1', name: '多球：正手高远球 5 组 × 30 球', duration_min: 25, category: 'tech', notes: '注意转体引拍、击球点高、收拍快' },
      { id: 'mon-multi-2', name: '多球：劈吊对角 4 组 × 20 球', duration_min: 20, category: 'tech', notes: '手腕外旋切球，落点压前场两角' },
      { id: 'mon-multi-3', name: '多球：杀球直线/斜线 4 组 × 15 球', duration_min: 20, category: 'tech', notes: '腰腹发力，落点近边线' },
      { id: 'mon-cool', name: '拉伸放松', duration_min: 10, category: 'recovery' },
    ],
  },
  {
    weekday: 2,
    title: '周二 · 步法 + 体能',
    focus: '六点步法、米字步、爆发力',
    items: [
      { id: 'tue-warm', name: '热身 + 跳绳 5 分钟', duration_min: 10, category: 'recovery' },
      { id: 'tue-fp1', name: '六点步法 5 组 × 30 秒', duration_min: 15, category: 'footwork', notes: '保持重心低，回中位要快' },
      { id: 'tue-fp2', name: '前后场启动步 4 组 × 10 次', duration_min: 15, category: 'footwork' },
      { id: 'tue-fit1', name: '波比跳 4 组 × 15 个', duration_min: 12, category: 'fitness' },
      { id: 'tue-fit2', name: '深蹲跳 4 组 × 20 个', duration_min: 12, category: 'fitness' },
      { id: 'tue-core', name: '核心：平板/俄罗斯转体 各 3 组', duration_min: 12, category: 'fitness' },
    ],
  },
  {
    weekday: 3,
    title: '周三 · 网前技术日',
    focus: '搓球、推球、挑球、勾球',
    items: [
      { id: 'wed-warm', name: '热身', duration_min: 10, category: 'recovery' },
      { id: 'wed-net1', name: '多球：正反手搓球 各 4 组 × 25 球', duration_min: 20, category: 'tech', notes: '拇指食指捻动，球过网即下坠' },
      { id: 'wed-net2', name: '多球：推后场 4 组 × 20 球', duration_min: 18, category: 'tech', notes: '小动作发力，落点贴边线' },
      { id: 'wed-net3', name: '多球：挑球 4 组 × 20 球', duration_min: 15, category: 'tech', notes: '挑高挑远，避免半场球' },
      { id: 'wed-net4', name: '勾对角练习 3 组 × 15 球', duration_min: 12, category: 'tech' },
      { id: 'wed-cool', name: '拉伸', duration_min: 10, category: 'recovery' },
    ],
  },
  {
    weekday: 4,
    title: '周四 · 主动休息',
    focus: '慢跑 / 拉伸 / 复盘',
    items: [
      { id: 'thu-jog', name: '慢跑 30 分钟', duration_min: 30, category: 'recovery' },
      { id: 'thu-stretch', name: '全身静态拉伸', duration_min: 20, category: 'recovery' },
      { id: 'thu-replay', name: '看比赛录像复盘 / 整理动作要点', duration_min: 30, category: 'recovery' },
    ],
  },
  {
    weekday: 5,
    title: '周五 · 综合练习日',
    focus: '前后场结合、攻守转换',
    items: [
      { id: 'fri-warm', name: '热身', duration_min: 10, category: 'recovery' },
      { id: 'fri-comb1', name: '高远 + 上网搓球 5 组 × 10 次', duration_min: 25, category: 'tech', notes: '回中后立刻上网，重心要稳' },
      { id: 'fri-comb2', name: '杀球 + 上网放网 5 组 × 10 次', duration_min: 25, category: 'tech' },
      { id: 'fri-comb3', name: '四方球 5 组 × 1 分钟', duration_min: 20, category: 'footwork' },
      { id: 'fri-cool', name: '拉伸', duration_min: 10, category: 'recovery' },
    ],
  },
  {
    weekday: 6,
    title: '周六 · 实战日',
    focus: '单打 / 双打对抗',
    items: [
      { id: 'sat-warm', name: '热身 + 对角斜线热身', duration_min: 15, category: 'recovery' },
      { id: 'sat-match', name: '21分制比赛 3-5 局', duration_min: 90, category: 'match', notes: '尝试用本周练习的技术，打完做录像复盘' },
      { id: 'sat-cool', name: '拉伸放松', duration_min: 15, category: 'recovery' },
    ],
  },
  {
    weekday: 0,
    title: '周日 · 休息',
    focus: '完全休息或轻度活动',
    items: [
      { id: 'sun-rest', name: '休息日：可做瑜伽/散步', duration_min: 30, category: 'recovery' },
    ],
  },
];

export function getTodayPlan(): DailyPlan {
  const w = new Date().getDay();
  return intermediateWeeklyPlan.find((p) => p.weekday === w) ?? intermediateWeeklyPlan[6];
}

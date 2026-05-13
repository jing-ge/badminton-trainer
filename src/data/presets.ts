import type { Plan, TrainingItem, TrainingModule } from './planTypes';

/**
 * 预置训练项库：用户在编辑计划时可以从这里快速选
 */
export const presetItems: TrainingItem[] = [
  // 后场技术
  { id: 'p-tech-clear', name: '多球：正手高远球 5×30 球', duration_min: 25, category: 'tech', source: 'preset', notes: '注意转体引拍、击球点高、收拍快', animationType: 'shuttle-clear' },
  { id: 'p-tech-drop', name: '多球：劈吊对角 4×20 球', duration_min: 20, category: 'tech', source: 'preset', notes: '手腕外旋切球，落点压前场两角', animationType: 'shuttle-drop' },
  { id: 'p-tech-smash', name: '多球：杀球直线/斜线 4×15 球', duration_min: 20, category: 'tech', source: 'preset', notes: '腰腹发力，落点近边线', animationType: 'shuttle-smash' },
  { id: 'p-tech-bh-clear', name: '反手高远球 4×20 球', duration_min: 18, category: 'tech', source: 'preset', notes: '反手发力顺序：脚→髋→肩→肘→腕', animationType: 'shuttle-clear' },
  // 前场技术
  { id: 'p-net-rub', name: '多球：正反手搓球 各 4×25 球', duration_min: 20, category: 'tech', source: 'preset', notes: '拇指食指捻动，球过网即下坠', animationType: 'shuttle-net' },
  { id: 'p-net-push', name: '多球：推后场 4×20 球', duration_min: 18, category: 'tech', source: 'preset', notes: '小动作发力，落点贴边线', animationType: 'shuttle-push' },
  { id: 'p-net-lift', name: '多球：挑球 4×20 球', duration_min: 15, category: 'tech', source: 'preset', notes: '挑高挑远，避免半场球', animationType: 'shuttle-lift' },
  { id: 'p-net-hook', name: '勾对角练习 3×15 球', duration_min: 12, category: 'tech', source: 'preset', animationType: 'shuttle-cross-net' },
  // 发球
  { id: 'p-serve-short', name: '反手发短球 5×20 球', duration_min: 15, category: 'tech', source: 'preset', notes: '球过网时刚好下坠，落点压 T 区', animationType: 'shuttle-serve' },
  { id: 'p-serve-long', name: '正手发后场高远球 4×20 球', duration_min: 15, category: 'tech', source: 'preset', animationType: 'shuttle-clear' },
  // 步法
  { id: 'p-fp-six', name: '六点步法 5×30 秒', duration_min: 15, category: 'footwork', source: 'preset', notes: '保持重心低，回中位要快', animationType: 'footwork-six' },
  { id: 'p-fp-launch', name: '前后场启动步 4×10 次', duration_min: 15, category: 'footwork', source: 'preset', animationType: 'footwork-launch' },
  { id: 'p-fp-rice', name: '米字步 5×1 分钟', duration_min: 15, category: 'footwork', source: 'preset', animationType: 'footwork-six' },
  { id: 'p-fp-cross', name: '交叉步退后场 4×20 次', duration_min: 12, category: 'footwork', source: 'preset', animationType: 'footwork-four' },
  { id: 'p-fp-four', name: '四方球步法 5×1 分钟', duration_min: 20, category: 'footwork', source: 'preset', animationType: 'footwork-four' },
  // 体能
  { id: 'p-fit-burpee', name: '波比跳 4×15 个', duration_min: 12, category: 'fitness', source: 'preset', animationType: 'fitness-explosive' },
  { id: 'p-fit-jumpsquat', name: '深蹲跳 4×20 个', duration_min: 12, category: 'fitness', source: 'preset', animationType: 'fitness-explosive' },
  { id: 'p-fit-core', name: '核心：平板/俄罗斯转体 各 3 组', duration_min: 12, category: 'fitness', source: 'preset', animationType: 'fitness-core' },
  { id: 'p-fit-rope', name: '跳绳 5×60 秒', duration_min: 10, category: 'fitness', source: 'preset', animationType: 'fitness-endurance' },
  { id: 'p-fit-lunge', name: '弓步跳 4×20 个', duration_min: 12, category: 'fitness', source: 'preset', animationType: 'fitness-explosive' },
  { id: 'p-fit-shuttle', name: '折返跑 6×30 秒', duration_min: 15, category: 'fitness', source: 'preset', animationType: 'fitness-endurance' },
  // 实战
  { id: 'p-match-21', name: '21 分制比赛 3-5 局', duration_min: 90, category: 'match', source: 'preset', notes: '用本周练习的技术，打完做录像复盘', animationType: 'tactics-single' },
  { id: 'p-match-half', name: '半场对练（仅后场/仅网前）', duration_min: 30, category: 'match', source: 'preset', animationType: 'tactics-single' },
  { id: 'p-match-double', name: '双打配合练习', duration_min: 45, category: 'match', source: 'preset' },
  // 恢复 / 热身
  { id: 'p-rec-warm', name: '动态热身（关节活动 + 慢跑）', duration_min: 10, category: 'recovery', source: 'preset', animationType: 'fitness-coordination' },
  { id: 'p-rec-cool', name: '拉伸放松', duration_min: 10, category: 'recovery', source: 'preset', animationType: 'fitness-coordination' },
  { id: 'p-rec-jog', name: '慢跑 30 分钟', duration_min: 30, category: 'recovery', source: 'preset', animationType: 'fitness-endurance' },
  { id: 'p-rec-stretch', name: '全身静态拉伸', duration_min: 20, category: 'recovery', source: 'preset', animationType: 'fitness-coordination' },
];

export function getPresetItem(id: string) {
  return presetItems.find((p) => p.id === id);
}

/**
 * 默认计划：业余中级 7 天周计划，作为推荐模板
 * 自定义计划可以"复制此计划再改"
 */
const M = (id: string, name: string, focus: string, category: TrainingModule['category'], weekday: number | null, itemIds: string[]): TrainingModule => ({
  id,
  name,
  focus,
  category,
  weekday,
  items: itemIds.map((iid) => {
    const it = presetItems.find((p) => p.id === iid);
    if (!it) throw new Error(`preset not found: ${iid}`);
    return { ...it };
  }),
});

export const defaultIntermediatePlan: Plan = {
  id: 'default-intermediate',
  name: '业余中级 7 天计划',
  level: '中级',
  mode: 'weekly',
  is_default: true,
  modules: [
    M('mod-mon', '周一 · 后场技术日', '高远球、吊球、杀球', 'tech', 1, [
      'p-rec-warm',
      'p-tech-clear',
      'p-tech-drop',
      'p-tech-smash',
      'p-rec-cool',
    ]),
    M('mod-tue', '周二 · 步法 + 体能', '六点步法、米字步、爆发力', 'footwork', 2, [
      'p-rec-warm',
      'p-fp-six',
      'p-fp-launch',
      'p-fit-burpee',
      'p-fit-jumpsquat',
      'p-fit-core',
    ]),
    M('mod-wed', '周三 · 网前技术日', '搓球、推球、挑球、勾球', 'tech', 3, [
      'p-rec-warm',
      'p-net-rub',
      'p-net-push',
      'p-net-lift',
      'p-net-hook',
      'p-rec-cool',
    ]),
    M('mod-thu', '周四 · 主动休息', '慢跑 / 拉伸 / 复盘', 'recovery', 4, [
      'p-rec-jog',
      'p-rec-stretch',
    ]),
    M('mod-fri', '周五 · 综合练习', '前后场结合、攻守转换', 'tech', 5, [
      'p-rec-warm',
      'p-tech-clear',
      'p-net-rub',
      'p-fp-four',
      'p-rec-cool',
    ]),
    M('mod-sat', '周六 · 实战日', '单打 / 双打对抗', 'match', 6, [
      'p-rec-warm',
      'p-match-21',
      'p-rec-cool',
    ]),
    M('mod-sun', '周日 · 休息', '完全休息或轻度活动', 'recovery', 0, [
      'p-rec-stretch',
    ]),
  ],
};

/**
 * 默认计划 2：随机训练模式示例
 */
export const defaultRandomPlan: Plan = {
  id: 'default-random',
  name: '随机训练模板（按需抽 3 块）',
  level: '中级',
  mode: 'random',
  random_pick: 3,
  is_default: true,
  modules: [
    M('rm-bc', '后场技术', '高远/吊/杀', 'tech', null, ['p-tech-clear', 'p-tech-drop', 'p-tech-smash']),
    M('rm-net', '前场技术', '搓/推/挑/勾', 'tech', null, ['p-net-rub', 'p-net-push', 'p-net-lift']),
    M('rm-fp', '步法专项', '六点 / 米字 / 四方', 'footwork', null, ['p-fp-six', 'p-fp-rice', 'p-fp-four']),
    M('rm-fit', '体能爆发', '波比 / 深蹲跳 / 跳绳', 'fitness', null, ['p-fit-burpee', 'p-fit-jumpsquat', 'p-fit-rope']),
    M('rm-core', '核心稳定', '平板 / 俄转 / 弓步', 'fitness', null, ['p-fit-core', 'p-fit-lunge']),
    M('rm-match', '实战对抗', '比赛 / 半场对练', 'match', null, ['p-match-21', 'p-match-half']),
    M('rm-warm', '热身 + 拉伸', '训练前后必做', 'recovery', null, ['p-rec-warm', 'p-rec-cool']),
  ],
};

export const defaultFitnessPlan: Plan = {
  id: 'default-fitness',
  name: '体能训练专项',
  level: '中级',
  mode: 'pool',
  is_default: true,
  modules: [
    M('fit-explosive', '爆发力训练', '下肢爆发、启动速度', 'fitness', null, [
      'p-fit-burpee',
      'p-fit-jumpsquat',
      'p-fit-lunge',
    ]),
    M('fit-core', '核心稳定', '腰腹力量、空中姿态', 'fitness', null, [
      'p-fit-core',
      'p-fit-core', // 可重复增加组数
    ]),
    M('fit-endurance', '耐力训练', '多拍对抗体能', 'fitness', null, [
      'p-fit-rope',
      'p-fit-shuttle',
    ]),
  ],
};

export const defaultPlans: Plan[] = [defaultIntermediatePlan, defaultRandomPlan, defaultFitnessPlan];

export function getDefaultPlan(id: string): Plan | undefined {
  return defaultPlans.find((p) => p.id === id);
}

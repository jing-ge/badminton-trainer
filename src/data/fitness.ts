export type FitnessExercise = {
  id: string;
  name: string;
  target: '爆发力' | '耐力' | '核心' | '柔韧' | '协调';
  sets: number;
  reps?: number;
  duration_sec?: number;
  rest_sec: number;
  description: string;
};

export const fitnessExercises: FitnessExercise[] = [
  {
    id: 'burpee',
    name: '波比跳',
    target: '爆发力',
    sets: 4,
    reps: 15,
    rest_sec: 45,
    description: '蹲下 → 撑地 → 俯卧撑 → 收腿 → 跳起，全程连贯',
  },
  {
    id: 'jump-squat',
    name: '深蹲跳',
    target: '爆发力',
    sets: 4,
    reps: 20,
    rest_sec: 45,
    description: '半蹲后立刻最大力跳起，落地缓冲',
  },
  {
    id: 'plank',
    name: '平板支撑',
    target: '核心',
    sets: 3,
    duration_sec: 60,
    rest_sec: 30,
    description: '肘撑地，身体一条直线，收紧腹部臀部',
  },
  {
    id: 'russian-twist',
    name: '俄罗斯转体',
    target: '核心',
    sets: 3,
    reps: 30,
    rest_sec: 30,
    description: '坐姿 V 形，左右转体触地，可负重',
  },
  {
    id: 'jump-rope',
    name: '跳绳',
    target: '耐力',
    sets: 5,
    duration_sec: 60,
    rest_sec: 30,
    description: '前脚掌发力，节奏均匀',
  },
  {
    id: 'lunge-jump',
    name: '弓步跳',
    target: '爆发力',
    sets: 4,
    reps: 20,
    rest_sec: 45,
    description: '弓步姿势跳跃换腿，模拟前后场启动',
  },
  {
    id: 'shuttle-run',
    name: '折返跑',
    target: '耐力',
    sets: 6,
    duration_sec: 30,
    rest_sec: 60,
    description: '5 米折返，模拟场上多拍移动',
  },
  {
    id: 'wrist-curl',
    name: '腕力训练（哑铃）',
    target: '协调',
    sets: 3,
    reps: 20,
    rest_sec: 30,
    description: '前臂放桌面，手腕做卷腕，强化击球手感',
  },
];

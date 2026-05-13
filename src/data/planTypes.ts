/**
 * 新的计划数据模型（支持自定义 + 模块 + 随机抽取）
 *
 *   Plan（一个训练计划）
 *     └── TrainingModule[]（训练模块，如"后场技术"）
 *            └── TrainingItem[]（训练项，如"正手高远球 5×30 球"）
 *
 *   PlanMode:
 *     weekly : 把模块按周一到周日分配，传统模式
 *     random : 每次随机抽选 N 个模块组成当日训练
 *     pool   : 用户每天手动从模块池挑选
 */

export type TrainingCategory = 'tech' | 'footwork' | 'fitness' | 'match' | 'recovery';

export type AnimationType = 
  | 'shuttle-clear' | 'shuttle-smash' | 'shuttle-drop' | 'shuttle-net' | 'shuttle-cross-net' | 'shuttle-lift' | 'shuttle-push' | 'shuttle-serve'
  | 'footwork-six' | 'footwork-four' | 'footwork-launch'
  | 'fitness-explosive' | 'fitness-core' | 'fitness-endurance' | 'fitness-coordination'
  | 'tactics-single';

export type TrainingItem = {
  id: string;
  name: string;
  duration_min: number;
  category: TrainingCategory;
  notes?: string;
  source?: 'preset' | 'custom';
  preset_id?: string;
  videoUri?: string;
  animationType?: AnimationType; // 支持纯代码渲染的教学动画
};

export type TrainingModule = {
  id: string;
  name: string;
  focus: string;
  category: TrainingCategory;
  items: TrainingItem[];
  /** 仅在 weekly 模式下生效：一周的第几天用这个模块（0-6，0=周日） */
  weekday?: number | null;
  /** 随机模式的权重，不设默认为 1 */
  weight?: number;
};

export type PlanMode = 'weekly' | 'random' | 'pool';

export type Plan = {
  id: string;
  name: string;
  level: '初学' | '中级' | '进阶' | '自定义';
  mode: PlanMode;
  /** 随机模式：每天抽几个模块 */
  random_pick?: number;
  modules: TrainingModule[];
  is_default?: boolean; // 内置只读
  created_at?: number;
  updated_at?: number;
};

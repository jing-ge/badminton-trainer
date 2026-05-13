import type { AnimationType } from './planTypes';

export type Tutorial = {
  id: string;
  title: string;
  category: '后场' | '前场' | '步法' | '发球' | '战术';
  level: '入门' | '中级' | '进阶';
  keyPoints: string[];
  commonMistakes: string[];
  checkpoints: string[];
  videoUri?: string; // 新增视频链接支持
  animationType?: AnimationType;
  gripType?: 'forehand' | 'backhand'; // 握拍法
};

export const tutorials: Tutorial[] = [
  {
    id: 'clear',
    title: '正手高远球',
    category: '后场',
    level: '中级',
    animationType: 'shuttle-clear',
    gripType: 'forehand',
    keyPoints: [
      '准备：侧身对网，左肩对球，右脚在后',
      '引拍：右肘抬起略高于肩，前臂外旋后拉',
      '击球：在身体右前上方最高点击球，手腕鞭打',
      '随挥：拍头自然向左下方挥出，跟随重心前移',
    ],
    commonMistakes: [
      '正面对网击球，没有侧身（最常见！）',
      '击球点过低，变成平推球',
      '只用胳膊抡，没有腰转、没有蹬地',
      '手腕没有内旋鞭打，球速软',
    ],
    checkpoints: [
      '击球瞬间左手是否指向来球方向?',
      '右脚是否充分蹬地转髋？',
      '前臂是否有「内旋鞭打」的动作？',
    ],
  },
  {
    id: 'smash',
    title: '正手杀球',
    category: '后场',
    level: '中级',
    animationType: 'shuttle-smash',
    gripType: 'forehand',
    keyPoints: [
      '起跳：左脚蹬地，身体腾空腾起',
      '引拍：拍面向下后方拉，肘部高于肩',
      '击球：在身体前上方击球，拍面下压',
      '腰腹收紧带动手臂下劈',
      '落地缓冲，立即回中位',
    ],
    commonMistakes: [
      '在头顶上方而非身体前方击球',
      '只甩手臂不用腰腹',
      '杀完不回中，等球反击',
      '杀球后重心向后倒',
    ],
    checkpoints: [
      '击球点是否在身体前上方？',
      '是否有明显的「鞭打」+「下压」动作？',
      '落地后是否立刻向前回中？',
    ],
  },
  {
    id: 'drop',
    title: '劈吊（劈杀斜线吊球）',
    category: '后场',
    level: '中级',
    animationType: 'shuttle-drop',
    keyPoints: [
      '动作与高远/杀球前段完全一致（隐蔽性）',
      '击球瞬间手腕外旋切削球托侧面',
      '触球时机略早于高远球',
      '落点压前场两个角',
    ],
    commonMistakes: [
      '动作和高远球不一致，被对手看穿',
      '切球太用力，变成半场球被反扑',
      '落点不靠网，给对方上网机会',
    ],
    checkpoints: [
      '引拍动作是否和高远球一致？',
      '是否有「切削」而非「推送」的感觉？',
      '球是否落在前发球线内？',
    ],
  },
  {
    id: 'netshot',
    title: '正手搓球',
    category: '前场',
    level: '中级',
    animationType: 'shuttle-net',
    gripType: 'forehand',
    keyPoints: [
      '上网最后一步用右脚跨出，膝盖弯曲',
      '手臂前伸，拍面接近水平',
      '拇指食指捻动拍柄，给球加旋转',
      '球过网即下坠，贴网而落',
    ],
    commonMistakes: [
      '用大臂发力推球，变成挑球',
      '拍面太立，球直接撞网',
      '上半身前倾过多，重心失衡',
    ],
    checkpoints: [
      '手指是否有「捻」的动作？',
      '球过网时是否非常接近网带？',
      '能否回身回中？',
    ],
  },
  {
    id: 'lift',
    title: '挑球',
    category: '前场',
    level: '入门',
    animationType: 'shuttle-lift',
    keyPoints: [
      '上网后下蹲降低重心',
      '小臂外旋发力，手腕鞭打向上',
      '挑高挑远，落点压底线两角',
    ],
    commonMistakes: [
      '挑到半场，对方直接杀球',
      '只用手臂，没有蹬地起身',
    ],
    checkpoints: ['球是否飞过对方头顶后场？', '挑完是否立刻退回中位？'],
  },
  {
    id: 'footwork-six',
    title: '六点步法',
    category: '步法',
    level: '中级',
    animationType: 'footwork-six',
    keyPoints: [
      '中位 → 前场两角 → 中位 → 中场两侧 → 中位 → 后场两角',
      '前场用右脚跨步（右手持拍）',
      '后场用并步 + 交叉步退',
      '每一点都要「触位 + 回中」',
    ],
    commonMistakes: [
      '不回中，被对手调动',
      '后场用交叉步直接出，没有先转身',
      '重心高，启动慢',
    ],
    checkpoints: [
      '是否每一点都回到了中位再出下一点？',
      '后场退步是否有侧身转髋？',
    ],
  },
  {
    id: 'serve-short',
    title: '反手发短球',
    category: '发球',
    level: '中级',
    animationType: 'shuttle-serve',
    gripType: 'backhand',
    keyPoints: [
      '握拍：拇指顶在宽面，反手握',
      '球托放在拍面正前方，接近网高',
      '小臂带动，手腕几乎不动',
      '球过网时刚好下坠，贴网而过',
    ],
    commonMistakes: [
      '发球过高，被对手扑死',
      '用手腕抖，球飘忽落点不稳',
      '球托离拍面太远，发力点不一致',
    ],
    checkpoints: ['球过网高度是否低于 15cm？', '落点是否在 T 区？'],
  },
  {
    id: 'tactics-single',
    title: '单打基本战术：拉吊突击',
    category: '战术',
    level: '中级',
    animationType: 'tactics-single',
    keyPoints: [
      '用高远 + 吊球四点调动对手',
      '发现对手回球弱（半场、高球）立即突击杀球',
      '杀完跟进上网控制前场',
      '保持「主动」节奏，避免被对手反控',
    ],
    commonMistakes: [
      '只拉不杀，节奏被对手破解',
      '一上来就连续杀球，体能崩盘',
      '杀完不上网，被对方放网',
    ],
    checkpoints: ['是否在对手失位时果断进攻？', '杀球后是否上网？'],
  },
];

export function findTutorial(id: string) {
  return tutorials.find((t) => t.id === id);
}

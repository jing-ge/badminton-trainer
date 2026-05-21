// 训练教练语音工具：纯函数 + 常量
// 从 app/training/run.tsx 抽出，便于复用与单测；不带 React state / Speech 副作用
// 副作用 (Speech.speak / Speech.stop / voice 选择) 仍由 run.tsx 内的 hook/ref 持有

const DIGIT_CHAR = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];

// 阿拉伯数字 → 汉字，防止 Android TTS 把 "3" 读成 "three" 或走调
// 覆盖 0-99（训练倒数最多到几十；> 99 罕见，原文兜底）
export function numToChinese(n: number): string {
  if (n < 0 || n > 99 || !Number.isInteger(n)) return String(n);
  if (n < 10) return DIGIT_CHAR[n];
  if (n === 10) return '十';
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  const tensPart = tens === 1 ? '十' : DIGIT_CHAR[tens] + '十';
  return ones === 0 ? tensPart : tensPart + DIGIT_CHAR[ones];
}

// 把句子里所有 0-99 的数字 token 替换成汉字
// 例：'3' → '三'；'15' → '十五'；'第 2 组' → '第 二 组'
export function toChinesePronunciation(text: string): string {
  return text.replace(/\d+/g, (m) => {
    const n = parseInt(m, 10);
    return n >= 0 && n <= 99 ? numToChinese(n) : m;
  });
}

// 普通话语音基础参数：pitch / rate 默认 1.0
// 用户在「我的→语音设置」自定义后会覆盖（运行时通过 ref 传入）
export const SPEECH_BASE_OPTIONS = { language: 'zh-CN' as const };

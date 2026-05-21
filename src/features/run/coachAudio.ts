// 训练教练高频短句的本地音频播放器
// 取代 Android 系统 TTS 在固定文案的发声：
//   - 8 个状态短句 (start / rest / end / next-set / keep-going / well-done / paused / rest-30)
//   - 数字 0-20 (覆盖 99% 的 rep 计数 + 倒数；> 20 自动 fallback TTS)
//
// 真因：Android 各厂商 TTS 引擎质量差异极大；EAS 换 keystore 也会清掉用户存的好 voice
// 解法：把这些最被用户感知的固定串换成本地 m4a（macOS Tingting 烘焙），其余 dynamic 文案仍走 Speech.speak
//
// 替换为真人录音：直接覆盖 assets/sounds/coach/*.m4a 同名文件即可，无需改代码

import { Audio } from 'expo-av';

export type CoachClipName =
  // 状态短句
  | 'start' | 'rest' | 'end'
  | 'next-set' | 'keep-going' | 'well-done' | 'paused' | 'rest-30'
  // 数字 0-20
  | 'n0' | 'n1' | 'n2' | 'n3' | 'n4' | 'n5' | 'n6' | 'n7' | 'n8' | 'n9'
  | 'n10' | 'n11' | 'n12' | 'n13' | 'n14' | 'n15'
  | 'n16' | 'n17' | 'n18' | 'n19' | 'n20';

const CLIP_REQUIRES: Record<CoachClipName, number> = {
  start: require('../../../assets/sounds/coach/start.m4a'),
  rest: require('../../../assets/sounds/coach/rest.m4a'),
  end: require('../../../assets/sounds/coach/end.m4a'),
  'next-set': require('../../../assets/sounds/coach/next-set.m4a'),
  'keep-going': require('../../../assets/sounds/coach/keep-going.m4a'),
  'well-done': require('../../../assets/sounds/coach/well-done.m4a'),
  paused: require('../../../assets/sounds/coach/paused.m4a'),
  'rest-30': require('../../../assets/sounds/coach/rest-30.m4a'),
  n0: require('../../../assets/sounds/coach/n0.m4a'),
  n1: require('../../../assets/sounds/coach/n1.m4a'),
  n2: require('../../../assets/sounds/coach/n2.m4a'),
  n3: require('../../../assets/sounds/coach/n3.m4a'),
  n4: require('../../../assets/sounds/coach/n4.m4a'),
  n5: require('../../../assets/sounds/coach/n5.m4a'),
  n6: require('../../../assets/sounds/coach/n6.m4a'),
  n7: require('../../../assets/sounds/coach/n7.m4a'),
  n8: require('../../../assets/sounds/coach/n8.m4a'),
  n9: require('../../../assets/sounds/coach/n9.m4a'),
  n10: require('../../../assets/sounds/coach/n10.m4a'),
  n11: require('../../../assets/sounds/coach/n11.m4a'),
  n12: require('../../../assets/sounds/coach/n12.m4a'),
  n13: require('../../../assets/sounds/coach/n13.m4a'),
  n14: require('../../../assets/sounds/coach/n14.m4a'),
  n15: require('../../../assets/sounds/coach/n15.m4a'),
  n16: require('../../../assets/sounds/coach/n16.m4a'),
  n17: require('../../../assets/sounds/coach/n17.m4a'),
  n18: require('../../../assets/sounds/coach/n18.m4a'),
  n19: require('../../../assets/sounds/coach/n19.m4a'),
  n20: require('../../../assets/sounds/coach/n20.m4a'),
};

// 数字 → clip 名（0-20 有本地音；超出返回 null，调用方 fallback 到 TTS）
export function digitToClip(n: number): CoachClipName | null {
  if (!Number.isInteger(n) || n < 0 || n > 20) return null;
  return `n${n}` as CoachClipName;
}

type ClipBank = Partial<Record<CoachClipName, Audio.Sound>>;

// 进程级单例：所有片段共 ~300KB，整组预加载常驻内存最简单
let bank: ClipBank = {};
let loadingPromise: Promise<void> | null = null;

async function ensureLoaded() {
  if (loadingPromise) return loadingPromise;
  loadingPromise = (async () => {
    const entries = Object.entries(CLIP_REQUIRES) as [CoachClipName, number][];
    await Promise.all(
      entries.map(async ([name, asset]) => {
        if (bank[name]) return;
        try {
          const { sound } = await Audio.Sound.createAsync(asset, {
            shouldPlay: false,
            volume: 1.0,
          });
          bank[name] = sound;
        } catch (e) {
          // 单条加载失败不阻塞其它，运行时 playClip 会再判 null fallback
          console.warn(`[coachAudio] load fail ${name}`, e);
        }
      }),
    );
  })();
  return loadingPromise;
}

// 播放一个 clip，不阻塞调用方；失败时返回 false 让上层 fallback 到 TTS
// 训练页 1Hz tick 可能在同一 clip 还在播时再触发,这里串行化:先 stop 再 seek+play,
// 避免 expo-av 在播放中并发 setPositionAsync 偶发抛错。
const playInflight: Partial<Record<CoachClipName, Promise<boolean>>> = {};

export async function playClip(name: CoachClipName): Promise<boolean> {
  const prev = playInflight[name];
  const run = (async () => {
    if (prev) await prev.catch(() => {});
    try {
      await ensureLoaded();
      const sound = bank[name];
      if (!sound) return false;
      await sound.stopAsync().catch(() => {});
      await sound.setPositionAsync(0);
      await sound.playAsync();
      return true;
    } catch (e) {
      console.warn(`[coachAudio] play fail ${name}`, e);
      return false;
    }
  })();
  playInflight[name] = run;
  try {
    return await run;
  } finally {
    if (playInflight[name] === run) delete playInflight[name];
  }
}

// 训练页 unmount 调一次，释放音频资源
export async function unloadCoachAudio() {
  // 先把还在飞的 ensureLoaded 等掉,否则它写入新建的 bank,导致泄漏
  if (loadingPromise) {
    await loadingPromise.catch(() => {});
  }
  const all = Object.values(bank).filter(Boolean) as Audio.Sound[];
  bank = {};
  loadingPromise = null;
  await Promise.all(
    all.map((s) => s.unloadAsync().catch(() => {})),
  );
}

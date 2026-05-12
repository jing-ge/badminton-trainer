import { useEffect, useRef, useState } from 'react';
import { Keypoint } from './keypoints';
import { mockFrame } from './mock';

export type PoseSource = {
  ready: boolean;
  mode: 'mediapipe' | 'mock';
  message?: string;
  frame: Keypoint[] | null;
};

/**
 * 姿态数据源：
 * - 优先尝试动态 require react-native-mediapipe（真机原生模块）
 * - 不可用时自动降级到 mock 帧（开发期/Expo Go 调试可用）
 *
 * 真机集成步骤（详见 README）：
 *   1. yarn add react-native-mediapipe react-native-vision-camera react-native-worklets-core
 *   2. expo prebuild
 *   3. expo run:ios / expo run:android
 *   4. 替换下方 tryLoadMediaPipe 内的占位 import 为真实的 hook
 */
export function usePoseSource(active: boolean): PoseSource {
  const [frame, setFrame] = useState<Keypoint[] | null>(null);
  const [mode, setMode] = useState<'mediapipe' | 'mock'>('mock');
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState<string | undefined>();
  const startedAt = useRef(Date.now());

  useEffect(() => {
    if (!active) return;
    let timer: ReturnType<typeof setInterval> | null = null;

    (async () => {
      const mp = await tryLoadMediaPipe();
      if (mp.available) {
        setMode('mediapipe');
        setReady(true);
        setMessage('MediaPipe 已加载');
        // 真实模块的接入点（占位）
      } else {
        setMode('mock');
        setReady(true);
        setMessage(mp.reason ?? '未检测到 MediaPipe，使用模拟骨架数据');
        timer = setInterval(() => {
          setFrame(mockFrame(Date.now() - startedAt.current));
        }, 33);
      }
    })();

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [active]);

  return { ready, mode, frame, message };
}

async function tryLoadMediaPipe(): Promise<{ available: boolean; reason?: string }> {
  try {
    // 真实接入时改为：
    // const mod = require('react-native-mediapipe');
    // return { available: !!mod };
    return { available: false, reason: '当前运行在 Expo Go / mock 模式' };
  } catch (e: any) {
    return { available: false, reason: e?.message ?? String(e) };
  }
}

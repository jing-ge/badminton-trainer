import { Keypoint, KP } from './keypoints';

/**
 * Mock 关键点生成器：当真机/模拟器没有 MediaPipe 时
 * 生成一个会动的人体骨架，用于在开发期跑通 UI 与分析逻辑
 */
export function mockFrame(t: number): Keypoint[] {
  const cx = 0.5;
  const cy = 0.5;
  const phase = (t / 1000) % (Math.PI * 2);
  const armUp = Math.sin(phase) * 0.15;

  const f: Keypoint[] = new Array(17).fill(null).map(() => ({ x: 0, y: 0, score: 0.9 }));

  f[KP.NOSE] = { x: cx, y: cy - 0.25, score: 0.95 };
  f[KP.LEFT_EYE] = { x: cx - 0.02, y: cy - 0.27, score: 0.9 };
  f[KP.RIGHT_EYE] = { x: cx + 0.02, y: cy - 0.27, score: 0.9 };
  f[KP.LEFT_EAR] = { x: cx - 0.04, y: cy - 0.26, score: 0.85 };
  f[KP.RIGHT_EAR] = { x: cx + 0.04, y: cy - 0.26, score: 0.85 };

  f[KP.LEFT_SHOULDER] = { x: cx - 0.08, y: cy - 0.18, score: 0.9 };
  f[KP.RIGHT_SHOULDER] = { x: cx + 0.08, y: cy - 0.18, score: 0.9 };

  // 右臂跟随相位上下抬动
  f[KP.RIGHT_ELBOW] = { x: cx + 0.18, y: cy - 0.18 - armUp, score: 0.88 };
  f[KP.RIGHT_WRIST] = { x: cx + 0.25, y: cy - 0.28 - armUp * 1.4, score: 0.85 };
  f[KP.LEFT_ELBOW] = { x: cx - 0.18, y: cy - 0.05, score: 0.88 };
  f[KP.LEFT_WRIST] = { x: cx - 0.22, y: cy + 0.05, score: 0.85 };

  f[KP.LEFT_HIP] = { x: cx - 0.06, y: cy + 0.05, score: 0.9 };
  f[KP.RIGHT_HIP] = { x: cx + 0.06, y: cy + 0.05, score: 0.9 };
  f[KP.LEFT_KNEE] = { x: cx - 0.07, y: cy + 0.22, score: 0.88 };
  f[KP.RIGHT_KNEE] = { x: cx + 0.07, y: cy + 0.22, score: 0.88 };
  f[KP.LEFT_ANKLE] = { x: cx - 0.08, y: cy + 0.4, score: 0.85 };
  f[KP.RIGHT_ANKLE] = { x: cx + 0.08, y: cy + 0.4, score: 0.85 };

  return f;
}

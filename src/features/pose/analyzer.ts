import { angle, dist, KP, Keypoint } from './keypoints';

export type ActionType = 'clear' | 'smash' | 'netshot' | 'footwork';

export type FeedbackIssue = {
  level: 'good' | 'warn' | 'error';
  code: string;
  message: string;
};

export type AnalysisResult = {
  score: number;
  issues: FeedbackIssue[];
  metrics: Record<string, number>;
};

type Frame = Keypoint[];

const MIN_SCORE = 0.3;

function valid(p?: Keypoint): p is Keypoint {
  return !!p && (p.score === undefined || p.score >= MIN_SCORE);
}

/**
 * 击球准备姿态分析（适用于后场技术：高远/吊/杀）
 * 输入：单帧关键点
 * 关注：是否侧身、引拍肘部高度、重心
 */
export function analyzeOverheadPrep(frame: Frame): AnalysisResult {
  const issues: FeedbackIssue[] = [];
  const metrics: Record<string, number> = {};
  let score = 100;

  const ls = frame[KP.LEFT_SHOULDER];
  const rs = frame[KP.RIGHT_SHOULDER];
  const re = frame[KP.RIGHT_ELBOW];
  const rw = frame[KP.RIGHT_WRIST];
  const lh = frame[KP.LEFT_HIP];
  const rh = frame[KP.RIGHT_HIP];

  if (!valid(ls) || !valid(rs) || !valid(re) || !valid(rw) || !valid(lh) || !valid(rh)) {
    return {
      score: 0,
      issues: [{ level: 'warn', code: 'NO_BODY', message: '人体未完整出现在画面中' }],
      metrics: {},
    };
  }

  // 1. 侧身度：肩线水平宽度 / 髋线水平宽度，越小说明越侧身
  const shoulderSpan = Math.abs(ls.x - rs.x);
  const hipSpan = Math.abs(lh.x - rh.x);
  const sideRatio = hipSpan > 0 ? shoulderSpan / hipSpan : 1;
  metrics.sideRatio = +sideRatio.toFixed(2);

  if (sideRatio > 0.85) {
    issues.push({
      level: 'error',
      code: 'NOT_SIDEWAYS',
      message: '没有侧身！正手击球必须左肩对网',
    });
    score -= 30;
  } else if (sideRatio > 0.65) {
    issues.push({
      level: 'warn',
      code: 'SIDE_NOT_ENOUGH',
      message: '侧身不够，再多转 30°',
    });
    score -= 10;
  } else {
    issues.push({ level: 'good', code: 'SIDE_OK', message: '侧身到位' });
  }

  // 2. 引拍肘部高度：右肘应高于右肩
  const elbowAboveShoulder = rs.y - re.y; // y 向下为正，所以这个值正表示肘高于肩
  metrics.elbowLift = +elbowAboveShoulder.toFixed(3);

  if (elbowAboveShoulder < -0.02) {
    issues.push({
      level: 'error',
      code: 'ELBOW_LOW',
      message: '引拍肘部太低，要抬到比肩高',
    });
    score -= 25;
  } else if (elbowAboveShoulder < 0.02) {
    issues.push({
      level: 'warn',
      code: 'ELBOW_MID',
      message: '肘部刚到肩高，可以再抬一点',
    });
    score -= 10;
  } else {
    issues.push({ level: 'good', code: 'ELBOW_OK', message: '肘部抬起到位' });
  }

  // 3. 手臂打开角度（肩-肘-腕）
  const armAngle = angle(rs, re, rw);
  metrics.armAngle = +armAngle.toFixed(1);
  if (armAngle < 80) {
    issues.push({
      level: 'warn',
      code: 'ARM_BENT',
      message: '手臂弯曲过度，引拍要更舒展',
    });
    score -= 10;
  }

  return { score: Math.max(0, score), issues, metrics };
}

/**
 * 击球瞬间分析（最高点判断）
 */
export function analyzeContactPoint(frame: Frame): AnalysisResult {
  const issues: FeedbackIssue[] = [];
  const metrics: Record<string, number> = {};
  let score = 100;

  const head = frame[KP.NOSE];
  const rw = frame[KP.RIGHT_WRIST];
  const rs = frame[KP.RIGHT_SHOULDER];

  if (!valid(head) || !valid(rw) || !valid(rs)) {
    return {
      score: 0,
      issues: [{ level: 'warn', code: 'NO_BODY', message: '关键点不足' }],
      metrics: {},
    };
  }

  // 击球点是否在头部上方
  const wristAboveHead = head.y - rw.y; // 正值说明手腕在头上方
  metrics.contactHeight = +wristAboveHead.toFixed(3);

  if (wristAboveHead < 0) {
    issues.push({
      level: 'error',
      code: 'CONTACT_LOW',
      message: '击球点低于头部，发力效率差',
    });
    score -= 35;
  } else if (wristAboveHead < 0.05) {
    issues.push({
      level: 'warn',
      code: 'CONTACT_MID',
      message: '击球点偏低，再向上伸展',
    });
    score -= 15;
  } else {
    issues.push({ level: 'good', code: 'CONTACT_HIGH', message: '高点击球到位' });
  }

  // 击球点是否在身体前方（手腕 x 应略偏前）
  const inFront = Math.abs(rw.x - rs.x);
  metrics.inFront = +inFront.toFixed(3);

  return { score: Math.max(0, score), issues, metrics };
}

/**
 * 步法分析（连续帧）：检测重心高度与回中频率
 */
export function analyzeFootwork(frames: Frame[]): AnalysisResult {
  const issues: FeedbackIssue[] = [];
  const metrics: Record<string, number> = {};
  let score = 100;

  if (frames.length < 10) {
    return { score: 0, issues: [{ level: 'warn', code: 'NEED_MORE', message: '需要更多帧数据' }], metrics };
  }

  // 重心高度（髋部到脚踝的相对距离，越小重心越低）
  const stances = frames
    .map((f) => {
      const rh = f[KP.RIGHT_HIP];
      const ra = f[KP.RIGHT_ANKLE];
      if (!valid(rh) || !valid(ra)) return null;
      return Math.abs(rh.y - ra.y);
    })
    .filter((x): x is number => x !== null);

  if (stances.length === 0) {
    return { score: 0, issues: [{ level: 'warn', code: 'NO_LEGS', message: '腿部关键点丢失' }], metrics };
  }

  const avgStance = stances.reduce((a, b) => a + b, 0) / stances.length;
  metrics.avgStance = +avgStance.toFixed(3);

  if (avgStance > 0.55) {
    issues.push({
      level: 'warn',
      code: 'HIGH_STANCE',
      message: '重心偏高，下蹲幅度不够',
    });
    score -= 20;
  } else {
    issues.push({ level: 'good', code: 'LOW_STANCE', message: '重心控制良好' });
  }

  // 移动幅度（髋部x方向的方差）
  const hipsX = frames
    .map((f) => f[KP.RIGHT_HIP])
    .filter(valid)
    .map((p) => p.x);
  if (hipsX.length > 5) {
    const mean = hipsX.reduce((a, b) => a + b, 0) / hipsX.length;
    const variance = hipsX.reduce((a, b) => a + (b - mean) ** 2, 0) / hipsX.length;
    metrics.movementRange = +Math.sqrt(variance).toFixed(3);
  }

  return { score: Math.max(0, score), issues, metrics };
}

export function analyzeFrame(action: ActionType, frame: Frame): AnalysisResult {
  switch (action) {
    case 'clear':
    case 'smash':
      return analyzeOverheadPrep(frame);
    case 'netshot':
      return analyzeContactPoint(frame);
    case 'footwork':
      return analyzeFootwork([frame]);
  }
}

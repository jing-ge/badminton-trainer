import { useEffect, useState } from 'react';
import { Alert, Dimensions, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
// 在 React Native (含 Expo 原生包) 里，直接 import 是安全的。
// 因为我们在 Web 里并不会强行渲染 <Camera>，就不会触发它底层的崩溃。
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';

import { Screen } from '@/components/Screen';
import { Button } from '@/components/Button';
import { colors, font, radius, spacing } from '@/theme/tokens';
import { ActionType, analyzeFrame, FeedbackIssue } from '@/features/pose/analyzer';
import { useMovenet } from '@/features/pose/tflite';
import { Keypoint } from '@/features/pose/keypoints';
import { SkeletonOverlay } from '@/features/pose/SkeletonOverlay';
import { insertPoseSession } from '@/db/repos';

const ACTIONS: { id: ActionType; label: string; emoji: string }[] = [
  { id: 'clear', label: '高远球', emoji: '🏸' },
  { id: 'smash', label: '杀球', emoji: '💥' },
  { id: 'netshot', label: '搓球', emoji: '🎯' },
  { id: 'footwork', label: '步法', emoji: '👟' },
];

export default function PoseScreen() {
  if (Platform.OS === 'web') {
    return (
      <Screen scroll={false}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 40, marginBottom: spacing.md }}>📷</Text>
          <Text style={{ color: colors.text, fontSize: font.h3, fontWeight: '700' }}>Web 暂不支持动作识别</Text>
          <Text style={{ color: colors.textDim, marginTop: spacing.sm, textAlign: 'center', lineHeight: 20 }}>
            请打出 APK 安装后在真机上体验原生摄像头 AI 姿态分析！
          </Text>
        </View>
      </Screen>
    );
  }
  return <PoseCameraView />;
}

function PoseCameraView() {
  const router = useRouter();
  const [action, setAction] = useState<ActionType>('clear');
  const [running, setRunning] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  
  // 用于存从 Worklet 传回来的真实坐标点
  const [frameData, setFrameData] = useState<Keypoint[] | null>(null);
  const [issues, setIssues] = useState<FeedbackIssue[]>([]);
  const [score, setScore] = useState<number | null>(null);

  const { width } = Dimensions.get('window');
  const camHeight = Math.round((width * 4) / 3);

  // 原生相机 Hook
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('front');
  
  // 原生 TFLite 模型 Hook，并传入回调接收坐标点
  const { model, frameProcessor } = useMovenet((kps) => {
    // 这个回调是在 React JS 线程里执行的，安全！
    if (running) {
      setFrameData(kps);
    }
  });

  useEffect(() => {
    if (!hasPermission) requestPermission();
  }, [hasPermission, requestPermission]);

  // 每当收到新的一帧坐标，就喂给分析器算分
  useEffect(() => {
    if (!frameData || !running) return;
    const result = analyzeFrame(action, frameData);
    setIssues(result.issues);
    setScore(result.score);
  }, [frameData, running, action]);

  async function stop() {
    if (!startedAt) {
      setRunning(false);
      return;
    }
    const dur = Math.round((Date.now() - startedAt) / 1000);
    setRunning(false);
    if (dur > 3) {
      await insertPoseSession({
        action_type: action,
        duration_sec: dur,
        score: score ?? undefined,
        issues: issues.filter((i) => i.level !== 'good').map((i) => i.message),
      });
      Alert.alert('训练结束', `本次 ${dur}s · 得分 ${score ?? 0}`, [{ text: '好' }]);
    }
    setStartedAt(null);
  }

  function start() {
    setIssues([]);
    setScore(null);
    setStartedAt(Date.now());
    setRunning(true);
  }

  return (
    <Screen scroll={false}>
      <View style={styles.actionRow}>
        {ACTIONS.map((a) => (
          <Pressable
            key={a.id}
            onPress={() => !running && setAction(a.id)}
            style={[
              styles.actionTab,
              action === a.id && { backgroundColor: colors.primary, borderColor: colors.primary },
            ]}
          >
            <Text style={{ color: action === a.id ? '#fff' : colors.text, fontWeight: '600' }}>
              {a.emoji} {a.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={[styles.cameraWrap, { height: camHeight }]}>
        {hasPermission && device ? (
          <Camera
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={running}
            frameProcessor={frameProcessor}
            pixelFormat="yuv"
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.permissionWrap]}>
            <Text style={styles.permissionText}>
              {hasPermission ? '未找到前置摄像头' : '需要摄像头权限以识别动作'}
            </Text>
            {!hasPermission && (
              <Button title="授权摄像头" onPress={requestPermission} style={{ marginTop: spacing.md }} />
            )}
          </View>
        )}

        <SkeletonOverlay frame={frameData} width={width} height={camHeight} mirrored />

        {/* 模型状态提示 */}
        <View style={styles.mockBadge}>
          <Text style={styles.mockText}>
            🧠 AI {model.state === 'loaded' ? '已就绪' : '加载中...'}
          </Text>
        </View>

        {score !== null && running && (
          <View style={styles.scoreBox}>
            <Text style={styles.scoreLabel}>得分</Text>
            <Text style={[styles.scoreVal, { color: scoreColor(score) }]}>{score}</Text>
          </View>
        )}
      </View>

      <View style={styles.feedback}>
        {issues.length === 0 ? (
          <Text style={styles.feedbackHint}>
            {running ? '识别中…保持完整身体在画面里' : '选择动作，点开始'}
          </Text>
        ) : (
          issues.slice(0, 4).map((it, i) => (
            <View key={i} style={styles.issue}>
              <Text style={[styles.issueIcon, { color: levelColor(it.level) }]}>
                {it.level === 'good' ? '✓' : it.level === 'warn' ? '⚠' : '✗'}
              </Text>
              <Text style={[styles.issueText, { color: levelColor(it.level) }]}>{it.message}</Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.controls}>
        {!running ? (
          <Button title="▶ 开始识别" onPress={start} style={{ flex: 1 }} />
        ) : (
          <Button title="⏹ 停止" variant="danger" onPress={stop} style={{ flex: 1 }} />
        )}
      </View>
    </Screen>
  );
}

function levelColor(l: FeedbackIssue['level']) {
  return l === 'good' ? colors.primary : l === 'warn' ? colors.warn : colors.danger;
}
function scoreColor(s: number) {
  if (s >= 80) return colors.primary;
  if (s >= 60) return colors.warn;
  return colors.danger;
}

const styles = StyleSheet.create({
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  actionTab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  cameraWrap: {
    width: '100%',
    backgroundColor: '#000',
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  permissionWrap: { alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  permissionText: { color: colors.text, textAlign: 'center' },
  mockBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  mockText: { color: colors.warn, fontSize: font.tiny },
  scoreBox: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: spacing.sm,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  scoreLabel: { color: colors.textDim, fontSize: font.tiny },
  scoreVal: { fontSize: 28, fontWeight: '800' },
  feedback: { minHeight: 100, marginBottom: spacing.md },
  feedbackHint: { color: colors.textDim, textAlign: 'center', paddingTop: spacing.lg },
  issue: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  issueIcon: { fontSize: 18, fontWeight: '800', width: 22 },
  issueText: { flex: 1, fontSize: font.body },
  controls: { flexDirection: 'row', gap: spacing.md },
});

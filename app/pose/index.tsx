import { useEffect, useState, useRef } from 'react';
import { Alert, Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Button } from '@/components/Button';
import { colors, font, radius, spacing } from '@/theme/tokens';
import { ActionType, analyzeFrame, FeedbackIssue } from '@/features/pose/analyzer';
import { mockFrame } from '@/features/pose/mock';
import { SkeletonOverlay } from '@/features/pose/SkeletonOverlay';
import { insertPoseSession } from '@/db/repos';
import { Keypoint } from '@/features/pose/keypoints';

const ACTIONS: { id: ActionType; label: string; emoji: string }[] = [
  { id: 'clear', label: '高远球', emoji: '🏸' },
  { id: 'smash', label: '杀球', emoji: '💥' },
  { id: 'netshot', label: '搓球', emoji: '🎯' },
  { id: 'footwork', label: '步法', emoji: '👟' },
];

export default function PoseScreen() {
  const router = useRouter();
  const [action, setAction] = useState<ActionType>('clear');
  const [running, setRunning] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  
  const [frameData, setFrameData] = useState<Keypoint[] | null>(null);
  const [issues, setIssues] = useState<FeedbackIssue[]>([]);
  const [score, setScore] = useState<number | null>(null);

  const { width } = Dimensions.get('window');
  const camHeight = Math.round((width * 4) / 3);

  // 纯 JS 模拟的数据源 (完全抛弃原生 Camera)
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!running) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    const start = Date.now();
    timerRef.current = setInterval(() => {
      const f = mockFrame(Date.now() - start);
      setFrameData(f);
      const result = analyzeFrame(action, f);
      setIssues(result.issues);
      setScore(result.score);
    }, 100); // 10fps 演示足矣
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [running, action]);

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
        {/* 纯黑背景代替摄像头 */}
        <View style={StyleSheet.absoluteFill} />

        <SkeletonOverlay frame={frameData} width={width} height={camHeight} mirrored />

        <View style={styles.mockBadge}>
          <Text style={styles.mockText}>
            📡 引擎演示模式
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
            {running ? '正在分析模拟数据...' : '选择动作，点开始查看算法演示'}
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
          <Button title="▶ 开启算法演示" onPress={start} style={{ flex: 1 }} />
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
  actionRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap', marginBottom: spacing.md },
  actionTab: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  cameraWrap: { width: '100%', backgroundColor: '#0B1220', borderRadius: radius.lg, overflow: 'hidden', marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  mockBadge: { position: 'absolute', top: spacing.sm, left: spacing.sm, backgroundColor: 'rgba(16, 185, 129, 0.2)', paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.primary },
  mockText: { color: colors.primary, fontSize: font.tiny, fontWeight: '700' },
  scoreBox: { position: 'absolute', top: spacing.sm, right: spacing.sm, backgroundColor: 'rgba(0,0,0,0.7)', padding: spacing.sm, borderRadius: radius.md, alignItems: 'center' },
  scoreLabel: { color: colors.textDim, fontSize: font.tiny },
  scoreVal: { fontSize: 28, fontWeight: '800' },
  feedback: { minHeight: 100, marginBottom: spacing.md },
  feedbackHint: { color: colors.textDim, textAlign: 'center', paddingTop: spacing.lg },
  issue: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  issueIcon: { fontSize: 18, fontWeight: '800', width: 22 },
  issueText: { flex: 1, fontSize: font.body },
  controls: { flexDirection: 'row', gap: spacing.md },
});

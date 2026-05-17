import { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { colors, font, radius, spacing } from '@/theme/tokens';
import { getStreakStats, insertTrainingLog } from '@/db/trainingLogs';
import { getActivePlan } from '@/db/plans';
import { vibrateSuccess } from '@/utils/haptics';

// v0.17.0 — 打卡分类视觉对齐 train.tsx 的 CATEGORY_META（不抽公共字典，inline 维护避免连带改其它文件）
const CAT_META: Record<string, { emoji: string; color: string }> = {
  后场: { emoji: '🏸', color: colors.primary },
  前场: { emoji: '🤚', color: colors.primary },
  步法: { emoji: '👟', color: colors.accent },
  体能: { emoji: '💪', color: colors.warn },
  实战: { emoji: '⚔️', color: colors.danger },
  发球: { emoji: '🎯', color: colors.primary },
};
const ALL_CATS = Object.keys(CAT_META);
const QUICK_MINS = [30, 60, 90, 120];

// 训练强度 1-5 私教语言
const INTENSITY_DESC = [
  { emoji: '😌', label: '轻松散练' },
  { emoji: '🙂', label: '节奏适中' },
  { emoji: '💪', label: '标准训练' },
  { emoji: '🔥', label: '高强度' },
  { emoji: '⚡', label: '极限挑战' },
];

const NOTE_MAX = 200;

export default function TrainingLogScreen() {
  const { plan_id, mins } = useLocalSearchParams<{ plan_id?: string; mins?: string }>();
  const router = useRouter();
  const [duration, setDuration] = useState(mins ?? '60');
  const [intensity, setIntensity] = useState(3);
  const [cats, setCats] = useState<string[]>([]);
  const [note, setNote] = useState('');

  const [opponent, setOpponent] = useState('');
  const [matchResult, setMatchResult] = useState<'win' | 'loss' | 'draw' | undefined>();

  // 来自 finished 跳转：mins 参数存在 → 展示「训练已完成」摘要卡
  const fromFinished = !!mins;
  const [planName, setPlanName] = useState<string | null>(null);

  useEffect(() => {
    if (!fromFinished) return;
    let cancelled = false;
    (async () => {
      try {
        const plan = await getActivePlan();
        if (!cancelled) setPlanName(plan.name);
      } catch {
        // 静默：fromFinished 摘要卡的 plan 名拿不到就不显示，主流程不受影响
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fromFinished]);

  const toggle = (c: string) =>
    setCats((arr) => (arr.includes(c) ? arr.filter((x) => x !== c) : [...arr, c]));

  async function save() {
    const min = parseInt(duration, 10);
    if (!min || min <= 0) {
      if (Platform.OS === 'web') window.alert('训练时长至少 1 分钟');
      else Alert.alert('请输入训练时长', '训练时长至少 1 分钟');
      return;
    }
    if (min > 480) {
      const ok = await confirmLongSession(min);
      if (!ok) return;
    }
    await insertTrainingLog({
      duration_min: min,
      categories: cats,
      intensity,
      note: note.trim() || undefined,
      opponent: opponent.trim() || undefined,
      match_result: matchResult,
      plan_id: plan_id ?? null,
    });

    vibrateSuccess();

    // 根据当前连击给出动态金句
    let cheer = '坚持训练，进步看得见 💪';
    try {
      const s = await getStreakStats();
      if (s.current >= 7) cheer = `🔥 已连续 ${s.current} 天，你太自律了！`;
      else if (s.current >= 3) cheer = `🔥 ${s.current} 天连击中，节奏感越来越稳`;
      else if (s.current >= 1) cheer = `好的开始，明天继续 💪`;
    } catch {
      // 静默：拿不到 streak 不影响打卡成功提示
    }

    if (Platform.OS === 'web') {
      window.alert(`打卡成功！\n${cheer}`);
      router.replace('/(tabs)/stats');
      return;
    }
    Alert.alert('打卡成功！', cheer, [
      { text: '好', onPress: () => router.replace('/(tabs)/stats') },
    ]);
  }

  function confirmLongSession(min: number): Promise<boolean> {
    return new Promise((resolve) => {
      const msg = `你录入的训练时长 ${min} 分钟超过 8 小时,确认无误吗?`;
      if (Platform.OS === 'web') {
        resolve(window.confirm(msg));
        return;
      }
      Alert.alert('时长偏长,请确认', msg, [
        { text: '取消', style: 'cancel', onPress: () => resolve(false) },
        { text: '确认保存', onPress: () => resolve(true) },
      ]);
    });
  }

  const intensityInfo = INTENSITY_DESC[intensity - 1];

  return (
    <Screen>
      <Text style={styles.title}>训练打卡</Text>

      {fromFinished && (
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryEmoji}>🏸</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.summaryTitle}>训练已完成</Text>
            <Text style={styles.summaryMeta}>
              {mins} 分钟{planName ? ` · 来自「${planName}」` : ''}
            </Text>
          </View>
        </Card>
      )}

      <Card style={{ marginTop: spacing.lg }}>
        <Text style={styles.label}>训练时长（分钟）</Text>
        <TextInput
          value={duration}
          onChangeText={setDuration}
          keyboardType="number-pad"
          style={styles.input}
          placeholder="60"
          placeholderTextColor={colors.textDim}
        />
        <View style={styles.quickRow}>
          {QUICK_MINS.map((n) => {
            const active = duration === String(n);
            return (
              <Pressable
                key={n}
                onPress={() => setDuration(String(n))}
                style={[styles.quickChip, active && { backgroundColor: colors.primary, borderColor: colors.primary }]}
              >
                <Text style={{ color: active ? '#fff' : colors.text, fontSize: font.small, fontWeight: '600' }}>{n} 分钟</Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card style={{ marginTop: spacing.md }}>
        <Text style={styles.label}>训练强度</Text>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Pressable key={n} onPress={() => setIntensity(n)}>
              <Text style={[styles.star, { color: n <= intensity ? colors.warn : colors.border }]}>
                ★
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.intensityDesc}>
          <Text style={{ fontSize: 18 }}>{intensityInfo.emoji}</Text>{'  '}
          <Text style={styles.intensityLabel}>{intensityInfo.label}</Text>
        </Text>
      </Card>

      <Card style={{ marginTop: spacing.md }}>
        <Text style={styles.label}>训练内容（多选）</Text>
        <View style={styles.tagWrap}>
          {ALL_CATS.map((c) => {
            const active = cats.includes(c);
            const meta = CAT_META[c];
            return (
              <Pressable
                key={c}
                onPress={() => toggle(c)}
                style={[
                  styles.tag,
                  active && { backgroundColor: meta.color, borderColor: meta.color },
                ]}
              >
                <Text style={{ color: active ? '#fff' : colors.textDim, fontWeight: active ? '600' : '400' }}>
                  {meta.emoji} {c}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      {cats.includes('实战') && (
        <Card style={{ marginTop: spacing.md }}>
          <Text style={styles.label}>对手是谁？(可选)</Text>
          <TextInput
            value={opponent}
            onChangeText={setOpponent}
            style={[styles.input, { marginBottom: spacing.md }]}
            placeholder="老王、陈总..."
            placeholderTextColor={colors.textDim}
          />
          <Text style={styles.label}>战绩</Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
            <Pressable onPress={() => setMatchResult('win')} style={[styles.tag, matchResult === 'win' && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
              <Text style={{ color: matchResult === 'win' ? '#fff' : colors.textDim, fontWeight: matchResult === 'win' ? '600' : '400' }}>🏆 赢了</Text>
            </Pressable>
            <Pressable onPress={() => setMatchResult('loss')} style={[styles.tag, matchResult === 'loss' && { backgroundColor: colors.textDim, borderColor: colors.textDim }]}>
              <Text style={{ color: matchResult === 'loss' ? '#fff' : colors.textDim, fontWeight: matchResult === 'loss' ? '600' : '400' }}>💔 输了</Text>
            </Pressable>
            <Pressable onPress={() => setMatchResult('draw')} style={[styles.tag, matchResult === 'draw' && { backgroundColor: colors.warn, borderColor: colors.warn }]}>
              <Text style={{ color: matchResult === 'draw' ? '#fff' : colors.textDim, fontWeight: matchResult === 'draw' ? '600' : '400' }}>🤝 平局</Text>
            </Pressable>
          </View>
        </Card>
      )}

      <Card style={{ marginTop: spacing.md }}>
        <View style={styles.noteHeader}>
          <Text style={styles.label}>📝 笔记 / 反思</Text>
          <Text style={styles.noteCount}>
            {note.length} / {NOTE_MAX}
          </Text>
        </View>
        <TextInput
          value={note}
          onChangeText={setNote}
          multiline
          maxLength={NOTE_MAX}
          style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
          placeholder="今天哪里做得好？哪里需要改进？"
          placeholderTextColor={colors.textDim}
        />
      </Card>

      <Button title="✅ 完成打卡" onPress={save} style={{ marginTop: spacing.lg }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: font.h1, fontWeight: '700' },
  label: { color: colors.textDim, fontSize: font.small, marginBottom: spacing.sm },
  input: {
    color: colors.text,
    fontSize: font.body,
    backgroundColor: colors.cardAlt,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  starsRow: { flexDirection: 'row', gap: spacing.md },
  star: { fontSize: 32 },
  intensityDesc: { marginTop: spacing.md, color: colors.textDim },
  intensityLabel: { color: colors.text, fontSize: font.body, fontWeight: '600' },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  quickChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardAlt,
  },
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tag: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  noteHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  noteCount: { color: colors.textDim, fontSize: font.tiny, marginBottom: spacing.sm },
  summaryCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, marginTop: spacing.lg, backgroundColor: colors.cardAlt, borderColor: colors.primary, borderWidth: 1 },
  summaryEmoji: { fontSize: 36 },
  summaryTitle: { color: colors.text, fontSize: font.h3, fontWeight: '700' },
  summaryMeta: { color: colors.textDim, fontSize: font.small, marginTop: 2 },
});

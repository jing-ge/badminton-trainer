import { useEffect, useMemo, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import dayjs from 'dayjs';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { Section } from '@/components/Section';
import { Button } from '@/components/Button';
import { colors, font, radius, spacing } from '@/theme/tokens';
import {
  TrainingLog,
  deleteTrainingLog,
  listTrainingLogs,
  updateTrainingLogNote,
} from '@/db/trainingLogs';
import { getPlanById } from '@/db/plans';
import { vibrateLight } from '@/utils/haptics';

// match_result -> 表情 & 文案；DB 实际值是 win/loss/draw（PRD 写了 lose 是笔误）
const RESULT_META: Record<NonNullable<TrainingLog['match_result']>, { emoji: string; label: string; color: string }> = {
  win: { emoji: '🏆', label: '胜', color: colors.primary },
  loss: { emoji: '💔', label: '负', color: colors.danger },
  draw: { emoji: '🤝', label: '平', color: colors.warn },
};

// 强度档位语义（1-5）
const INTENSITY_LABEL: Record<number, string> = {
  1: '放松活动',
  2: '轻度',
  3: '中等',
  4: '高强度',
  5: '极限',
};

// 「回顾」派生数据：纯文字小行
type ReviewLine = { key: string; text: string; color: string };

function buildReviewLines(current: TrainingLog, all: TrainingLog[]): ReviewLine[] {
  const lines: ReviewLine[] = [];
  const others = all.filter((l) => l.id !== current.id);

  // 1) vs 上次同类训练
  if (current.categories.length === 0) {
    lines.push({ key: 'vs', text: '📅 无同类训练可对比', color: colors.textDim });
  } else {
    const sameCat = others
      .filter((l) => l.date < current.date && l.categories.some((c) => current.categories.includes(c)))
      .sort((a, b) => (a.date < b.date ? 1 : -1)); // date desc
    const prev = sameCat[0];
    if (!prev) {
      lines.push({
        key: 'vs',
        text: `🌱 这是「${current.categories[0]}」的第一次记录`,
        color: colors.text,
      });
    } else {
      const sharedCat = prev.categories.find((c) => current.categories.includes(c)) ?? current.categories[0];
      const dur = current.duration_min - prev.duration_min;
      const inten = current.intensity - prev.intensity;
      const durPart =
        dur === 0 ? '时长持平' : dur > 0 ? `多练 ${dur} 分钟` : `少练 ${Math.abs(dur)} 分钟`;
      const intenPart =
        inten === 0 ? '强度持平' : inten > 0 ? `强度 +${inten}` : `强度 ${inten}`;
      const emoji = dur > 0 ? '📈' : dur < 0 ? '📉' : '➡️';
      lines.push({
        key: 'vs',
        text: `${emoji} 比上次（${prev.date}「${sharedCat}」）${durPart}，${intenPart}`,
        color: colors.text,
      });
    }
  }

  // 2) 本月累计（按 current.date 所在 YYYY-MM）
  const ym = current.date.slice(0, 7);
  const monthLogs = all.filter((l) => l.date.startsWith(ym));
  const monthMin = monthLogs.reduce((a, l) => a + l.duration_min, 0);
  lines.push({
    key: 'month',
    text: `📊 本月累计 ${monthLogs.length} 次 / ${monthMin} 分钟`,
    color: colors.text,
  });

  // 3) 强度分位（仅当历史 ≥3 条）
  if (others.length >= 3) {
    const sorted = [...others].map((l) => l.intensity).sort((a, b) => a - b);
    // 当前 intensity 在历史中排名分位：>80% / <20% / 中段
    const ltCount = sorted.filter((x) => x < current.intensity).length;
    const gtCount = sorted.filter((x) => x > current.intensity).length;
    const pctHigher = ltCount / sorted.length; // 当前比 pctHigher 比例的历史更高
    const pctLower = gtCount / sorted.length; // 当前比 pctLower 比例的历史更低
    if (pctHigher > 0.8) {
      lines.push({ key: 'pct', text: '🔥 强度高于历史 80% 的训练', color: colors.primary });
    } else if (pctLower > 0.8) {
      lines.push({ key: 'pct', text: '🛋 比平时温和', color: colors.textDim });
    } else {
      lines.push({ key: 'pct', text: '⚖️ 与平时持平', color: colors.text });
    }
  }

  return lines;
}

export default function TrainingLogDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const numericId = Number(id);

  const [log, setLog] = useState<TrainingLog | null>(null);
  const [allLogs, setAllLogs] = useState<TrainingLog[]>([]);
  const [planTitle, setPlanTitle] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  // 备注编辑态：editing=true 时显示 TextInput；draft 是输入草稿
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    (async () => {
      // 复用现有 list 接口，避免新增按 id 查询。200 条覆盖绝大多数本地用户
      const all = await listTrainingLogs(200);
      const hit = all.find((l) => l.id === numericId) ?? null;
      setLog(hit);
      setAllLogs(all);
      if (hit?.plan_id) {
        const p = await getPlanById(hit.plan_id).catch(() => null);
        setPlanTitle(p?.name ?? null);
      }
      setLoaded(true);
    })();
  }, [numericId]);

  // 回顾派生小行：纯客户端计算
  const reviewLines = useMemo(
    () => (log && allLogs.length > 1 ? buildReviewLines(log, allLogs) : []),
    [log, allLogs],
  );

  function confirmDelete() {
    const doDelete = async () => {
      await deleteTrainingLog(numericId);
      vibrateLight();
      router.back();
    };
    // 补上下文：分类前 2 项 + 对手（如有）
    let summary = '';
    if (log) {
      const parts: string[] = [log.date, `${log.duration_min} 分钟`];
      if (log.categories.length > 0) {
        parts.push(log.categories.slice(0, 2).join('/'));
      }
      if (log.opponent) {
        parts.push(`vs ${log.opponent}`);
      }
      summary = parts.join(' · ');
    }
    if (Platform.OS === 'web') {
      if (window.confirm(`删除这条训练记录？\n${summary}`)) doDelete();
      return;
    }
    Alert.alert('删除这条训练记录？', summary, [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: doDelete },
    ]);
  }

  function startEditNote() {
    setDraft(log?.note ?? '');
    setEditing(true);
  }

  async function saveNote() {
    if (!log) return;
    const trimmed = draft.trim();
    await updateTrainingLogNote(log.id, trimmed);
    setLog({ ...log, note: trimmed.length > 0 ? trimmed : null });
    setEditing(false);
    vibrateLight();
  }

  // 加载中 / 空态
  if (!loaded) {
    return (
      <Screen>
        <Stack.Screen options={{ title: '训练详情' }} />
        <Text style={{ color: colors.textDim }}>加载中…</Text>
      </Screen>
    );
  }

  if (!log) {
    return (
      <Screen>
        <Stack.Screen options={{ title: '训练详情' }} />
        <Card>
          <Text style={styles.emptyTitle}>这条记录可能已被删除</Text>
          <Text style={styles.emptyDesc}>找不到 id={String(id)} 的训练记录</Text>
          <Button title="← 返回" variant="ghost" onPress={() => router.back()} style={{ marginTop: spacing.md }} />
        </Card>
      </Screen>
    );
  }

  const result = log.match_result ? RESULT_META[log.match_result] : null;

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: '训练详情',
          headerRight: () => (
            <Pressable
              onPress={confirmDelete}
              hitSlop={12}
              style={({ pressed }) => [{ opacity: pressed ? 0.5 : 1, paddingHorizontal: spacing.sm }]}
            >
              <Text style={{ fontSize: 18 }}>🗑</Text>
            </Pressable>
          ),
        }}
      />

      {/* 顶部大日期 + 副标题 */}
      <Text style={styles.bigDate}>{dayjs(log.date).format('YYYY-MM-DD')}</Text>
      <Text style={styles.subtitle}>{dayjs(log.created_at).format('HH:mm 打卡')}</Text>

      {/* 核心指标：左 duration / 右 5 星强度 */}
      <Card style={{ marginTop: spacing.lg }}>
        <View style={styles.coreRow}>
          <View style={{ flex: 1, alignItems: 'flex-start' }}>
            <Text style={styles.coreValue}>{log.duration_min}</Text>
            <Text style={styles.coreLabel}>分钟</Text>
          </View>
          <View style={styles.divider} />
          <Pressable
            onPress={vibrateLight}
            style={({ pressed }) => [
              { flex: 1, alignItems: 'flex-end', opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <Text style={styles.coreStar}>
              {'★'.repeat(log.intensity)}
              <Text style={{ color: colors.border }}>{'☆'.repeat(5 - log.intensity)}</Text>
            </Text>
            <Text style={styles.coreLabel}>强度 {log.intensity}/5</Text>
          </Pressable>
        </View>
        <Text style={styles.intensityHint}>
          {log.intensity}={INTENSITY_LABEL[log.intensity] ?? '—'}
        </Text>
      </Card>

      {/* 回顾：派生小行；首次训练（only self）时不渲染 */}
      {reviewLines.length > 0 && (
        <Section title="回顾">
          <Card>
            {reviewLines.map((line, idx) => (
              <Text
                key={line.key}
                style={[
                  styles.reviewLine,
                  { color: line.color },
                  idx > 0 && { marginTop: spacing.sm },
                ]}
              >
                {line.text}
              </Text>
            ))}
          </Card>
        </Section>
      )}

      {/* 训练内容 */}
      <Section title="训练内容">
        <Card>
          {log.categories.length > 0 ? (
            <View style={styles.chipWrap}>
              {log.categories.map((c) => (
                <View key={c} style={styles.chip}>
                  <Text style={styles.chipText}>{c}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.dim}>未填写分类</Text>
          )}
          {log.plan_id ? (
            <Text style={[styles.dim, { marginTop: spacing.md }]}>
              🗓 来自计划：{planTitle ?? log.plan_id}
            </Text>
          ) : null}
        </Card>
      </Section>

      {/* 对手与战绩：仅有 opponent 时显示 */}
      {log.opponent ? (
        <Section title="对手与战绩">
          <Card>
            <View style={styles.matchRow}>
              <Text style={styles.matchOpp}>🥊 vs {log.opponent}</Text>
              {result ? (
                <Text style={[styles.matchResult, { color: result.color }]}>
                  {result.emoji} {result.label}
                </Text>
              ) : null}
            </View>
          </Card>
        </Section>
      ) : null}

      {/* 备注：就地编辑 */}
      <Section title="备注">
        <Card>
          {editing ? (
            <>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                maxLength={200}
                multiline
                autoFocus
                placeholder="复盘一下这次训练…"
                placeholderTextColor={colors.textDim}
                style={styles.input}
              />
              <View style={styles.editActions}>
                <Text style={styles.counter}>{draft.length} / 200</Text>
                <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                  <Button title="取消" variant="ghost" onPress={() => setEditing(false)} />
                  <Button title="保存" onPress={saveNote} />
                </View>
              </View>
            </>
          ) : log.note ? (
            <View style={styles.noteShow}>
              <Text style={styles.noteText}>{log.note}</Text>
              <Pressable
                onPress={startEditNote}
                hitSlop={8}
                style={({ pressed }) => [styles.editBtn, { opacity: pressed ? 0.5 : 1 }]}
              >
                <Text style={{ fontSize: 16 }}>✏️</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={startEditNote}
              style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
            >
              <Text style={styles.notePlaceholder}>📝 加一条复盘备注 →</Text>
            </Pressable>
          )}
        </Card>
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  bigDate: { color: colors.text, fontSize: font.h1, fontWeight: '800' },
  subtitle: { color: colors.textDim, fontSize: font.small, marginTop: 4 },

  coreRow: { flexDirection: 'row', alignItems: 'center' },
  coreValue: { color: colors.primary, fontSize: 40, fontWeight: '800', lineHeight: 44 },
  coreStar: { color: colors.warn, fontSize: 22, fontWeight: '700' },
  coreLabel: { color: colors.textDim, fontSize: font.small, marginTop: 4 },
  divider: { width: 1, height: 40, backgroundColor: colors.border, marginHorizontal: spacing.md },
  intensityHint: {
    color: colors.textDim,
    fontSize: font.tiny,
    marginTop: spacing.sm,
    textAlign: 'right',
  },

  reviewLine: { fontSize: font.small, lineHeight: 20 },

  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    backgroundColor: colors.cardAlt,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  chipText: { color: colors.text, fontSize: font.small, fontWeight: '600' },
  dim: { color: colors.textDim, fontSize: font.small },

  matchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  matchOpp: { color: colors.text, fontSize: font.body, fontWeight: '600' },
  matchResult: { fontSize: font.body, fontWeight: '700' },

  noteShow: { flexDirection: 'row', alignItems: 'flex-start' },
  noteText: { color: colors.text, fontSize: font.body, flex: 1, lineHeight: 22 },
  editBtn: { paddingHorizontal: spacing.sm, paddingVertical: 2, marginLeft: spacing.sm },
  notePlaceholder: { color: colors.primary, fontSize: font.body, fontWeight: '600' },

  input: {
    color: colors.text,
    backgroundColor: colors.cardAlt,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: font.body,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  counter: { color: colors.textDim, fontSize: font.tiny },

  emptyTitle: { color: colors.text, fontSize: font.h3, fontWeight: '700' },
  emptyDesc: { color: colors.textDim, fontSize: font.small, marginTop: spacing.sm },
});

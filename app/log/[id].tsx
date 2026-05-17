import { useEffect, useState } from 'react';
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

export default function TrainingLogDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const numericId = Number(id);

  const [log, setLog] = useState<TrainingLog | null>(null);
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
      if (hit?.plan_id) {
        const p = await getPlanById(hit.plan_id).catch(() => null);
        setPlanTitle(p?.name ?? null);
      }
      setLoaded(true);
    })();
  }, [numericId]);

  function confirmDelete() {
    const doDelete = async () => {
      await deleteTrainingLog(numericId);
      vibrateLight();
      router.back();
    };
    const summary = log ? `${log.date} · ${log.duration_min} 分钟` : '';
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
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Text style={styles.coreStar}>
              {'★'.repeat(log.intensity)}
              <Text style={{ color: colors.border }}>{'☆'.repeat(5 - log.intensity)}</Text>
            </Text>
            <Text style={styles.coreLabel}>强度 {log.intensity}/5</Text>
          </View>
        </View>
      </Card>

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

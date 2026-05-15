import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { colors, font, spacing } from '@/theme/tokens';
import { getActivePlan } from '@/db/plans';
import { selectToday, TodaySelection } from '@/data/selectToday';

const CATEGORY_META: Record<string, { label: string; color: string; emoji: string }> = {
  tech: { label: '技术', color: colors.primary, emoji: '🏸' },
  footwork: { label: '步法', color: colors.accent, emoji: '👟' },
  fitness: { label: '体能', color: colors.warn, emoji: '💪' },
  match: { label: '实战', color: colors.danger, emoji: '⚔️' },
  recovery: { label: '恢复', color: colors.textDim, emoji: '🧘' },
};

export default function TodayTrainingScreen() {
  const router = useRouter();
  const [today, setToday] = useState<TodaySelection | null>(null);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const plan = await getActivePlan();
        setToday(selectToday(plan));
      })();
    }, []),
  );

  if (!today) return <Screen><Text style={{ color: colors.textDim }}>加载中...</Text></Screen>;

  const totalMin = today.modules.reduce((a, m) => a + m.items.reduce((x, y) => x + y.duration_min, 0), 0);

  if (today.modules.length === 0) {
    return (
      <Screen>
        <Text style={styles.title}>今日无训练</Text>
        <Button title="去调整计划" onPress={() => router.push(`/plans/${today.plan.id}/edit`)} style={{ marginTop: spacing.xl }} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={styles.title}>今日训练内容</Text>
      <Text style={styles.meta}>来自：{today.plan.name} · 约 {totalMin} 分钟</Text>

      {today.modules.map((m, mi) => (
        <View key={m.id} style={{ marginTop: spacing.lg }}>
          <Text style={styles.modName}>{CATEGORY_META[m.category].emoji} 模块 {mi + 1}：{m.name}</Text>
          <Text style={styles.modFocus}>重点：{m.focus}</Text>
          
          <View style={{ marginTop: spacing.md }}>
            {m.items.map((it, i) => {
              const meta = CATEGORY_META[it.category];
              return (
                <Card key={it.id} style={{ marginBottom: spacing.sm, padding: spacing.md }}>
                  <View style={styles.row}>
                    <View style={[styles.idx, { backgroundColor: meta.color }]}><Text style={styles.idxText}>{i + 1}</Text></View>
                    <View style={{ flex: 1, marginLeft: spacing.md }}>
                      <Text style={styles.itemName}>{it.name}</Text>
                      {it.notes ? <Text style={styles.notes}>💡 {it.notes}</Text> : null}
                    </View>
                    <Text style={styles.dur}>{it.duration_min}'</Text>
                  </View>
                </Card>
              );
            })}
          </View>
        </View>
      ))}

      <Button
        title="▶ 开始跟练"
        onPress={() => router.push('/training/run')}
        style={{ marginTop: spacing.xl }}
      />
      <Pressable 
        onPress={() => router.push({ pathname: '/training/log', params: { plan_id: today.plan.id, mins: String(totalMin) } })}
        style={{ marginTop: spacing.lg, paddingVertical: spacing.md }}
      >
        <Text style={{ color: colors.textDim, textAlign: 'center' }}>我已在线下完成此训练 →</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: font.h1, fontWeight: '700' },
  meta: { color: colors.textDim, marginTop: 4, fontSize: font.small },
  modName: { color: colors.text, fontSize: font.h2, fontWeight: '700' },
  modFocus: { color: colors.primary, marginTop: 4, fontSize: font.small },
  row: { flexDirection: 'row', alignItems: 'center' },
  idx: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  idxText: { color: '#fff', fontWeight: '800', fontSize: font.small },
  itemName: { color: colors.text, fontWeight: '600', fontSize: font.body },
  notes: { color: colors.textDim, fontSize: font.small, marginTop: 4 },
  dur: { color: colors.primary, fontWeight: '700', fontSize: font.body, marginLeft: spacing.sm },
});

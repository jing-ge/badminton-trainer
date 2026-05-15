import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { colors, font, spacing } from '@/theme/tokens';
import { getActivePlan } from '@/db/plans';
import type { TrainingModule } from '@/data/planTypes';

const CATEGORY_META: Record<string, { label: string; color: string; emoji: string }> = {
  tech: { label: '技术', color: colors.primary, emoji: '🏸' },
  footwork: { label: '步法', color: colors.accent, emoji: '👟' },
  fitness: { label: '体能', color: colors.warn, emoji: '💪' },
  match: { label: '实战', color: colors.danger, emoji: '⚔️' },
  recovery: { label: '恢复', color: colors.textDim, emoji: '🧘' },
};

export default function ModuleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [mod, setMod] = useState<TrainingModule | null>(null);
  const [planId, setPlanId] = useState('');

  useEffect(() => {
    (async () => {
      const plan = await getActivePlan();
      setPlanId(plan.id);
      const m = plan.modules.find((x) => x.id === id);
      if (m) setMod(m);
    })();
  }, [id]);

  if (!mod) return <Screen><Text style={{ color: colors.textDim }}>加载中...</Text></Screen>;

  const totalMin = mod.items.reduce((a, b) => a + b.duration_min, 0);

  return (
    <Screen>
      <Text style={styles.title}>{CATEGORY_META[mod.category].emoji} {mod.name}</Text>
      <Text style={styles.focus}>模块重点：{mod.focus}</Text>
      <Text style={styles.meta}>共 {mod.items.length} 项 · 预计 {totalMin} 分钟</Text>

      <View style={{ marginTop: spacing.lg }}>
        {mod.items.map((it, i) => {
          const meta = CATEGORY_META[it.category];
          return (
            <Card key={it.id} style={{ marginBottom: spacing.md }}>
              <View style={styles.row}>
                <View style={[styles.idx, { backgroundColor: meta.color }]}>
                  <Text style={styles.idxText}>{i + 1}</Text>
                </View>
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

      <Button
        title="▶ 开始跟练此模块"
        onPress={() => router.push({ pathname: '/training/run', params: { mid: mod.id } })}
        style={{ marginTop: spacing.lg }}
      />
      <Pressable 
        onPress={() => router.push({ pathname: '/training/log', params: { plan_id: planId, mins: String(totalMin) } })}
        style={{ marginTop: spacing.md, paddingVertical: spacing.md }}
      >
        <Text style={{ color: colors.textDim, textAlign: 'center' }}>我已在线下完成此训练 →</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: font.h1, fontWeight: '700' },
  focus: { color: colors.primary, marginTop: 6 },
  meta: { color: colors.textDim, fontSize: font.small, marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center' },
  idx: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  idxText: { color: '#fff', fontWeight: '800' },
  itemName: { color: colors.text, fontWeight: '600', fontSize: font.body },
  notes: { color: colors.textDim, fontSize: font.small, marginTop: 4 },
  dur: { color: colors.primary, fontWeight: '700', fontSize: font.body, marginLeft: spacing.sm },
});

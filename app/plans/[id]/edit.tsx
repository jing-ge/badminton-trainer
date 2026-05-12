import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { colors, font, radius, spacing } from '@/theme/tokens';
import type { Plan, PlanMode, TrainingModule } from '@/data/planTypes';
import { getPlanById, savePlan } from '@/db/plans';

const WEEK_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

export default function PlanEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [plan, setPlan] = useState<Plan | null>(null);

  useEffect(() => {
    (async () => {
      const p = await getPlanById(id);
      if (p) {
        if (p.is_default) {
          Alert.alert('不能编辑默认计划', '请先复制一份再编辑');
          router.back();
        } else {
          setPlan(p);
        }
      }
    })();
  }, [id]);

  async function updatePlan(patch: Partial<Plan>) {
    if (!plan) return;
    const next = { ...plan, ...patch };
    setPlan(next);
    await savePlan(next);
  }

  function addModule() {
    if (!plan) return;
    const newMod: TrainingModule = {
      id: `mod-${Date.now()}`,
      name: '新建训练模块',
      focus: '填写重点',
      category: 'tech',
      items: [],
      weekday: plan.mode === 'weekly' ? 1 : null,
      weight: 1,
    };
    updatePlan({ modules: [...plan.modules, newMod] });
  }

  function removeModule(mid: string) {
    if (!plan) return;
    Alert.alert('删除模块', '确定要删除这个训练模块吗？', [
      { text: '取消' },
      { text: '删除', style: 'destructive', onPress: () => updatePlan({ modules: plan.modules.filter((m) => m.id !== mid) }) },
    ]);
  }

  if (!plan) return <Screen><Text style={{ color: colors.textDim }}>加载中...</Text></Screen>;

  return (
    <Screen scroll={false}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <Card style={{ marginBottom: spacing.md }}>
          <Text style={styles.label}>计划名称</Text>
          <TextInput
            value={plan.name}
            onChangeText={(v) => updatePlan({ name: v })}
            style={styles.input}
          />
          <Text style={[styles.label, { marginTop: spacing.md }]}>训练模式</Text>
          <View style={styles.modeRow}>
            {(['weekly', 'random', 'pool'] as PlanMode[]).map((m) => (
              <Pressable
                key={m}
                onPress={() => updatePlan({ mode: m })}
                style={[styles.modeBtn, plan.mode === m && { backgroundColor: colors.primary, borderColor: colors.primary }]}
              >
                <Text style={{ color: plan.mode === m ? '#fff' : colors.text, fontWeight: '600' }}>
                  {m === 'weekly' ? '周计划' : m === 'random' ? '随机' : '模块池'}
                </Text>
              </Pressable>
            ))}
          </View>
          {plan.mode === 'random' && (
            <View style={{ marginTop: spacing.md, flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.label}>每天随机抽取模块数：</Text>
              <TextInput
                value={String(plan.random_pick ?? 3)}
                onChangeText={(v) => updatePlan({ random_pick: parseInt(v, 10) || 3 })}
                style={[styles.input, { width: 60, marginLeft: spacing.sm, paddingVertical: 4 }]}
                keyboardType="number-pad"
              />
            </View>
          )}
        </Card>

        <View style={styles.headerRow}>
          <Text style={styles.sectionTitle}>包含的训练模块 ({plan.modules.length})</Text>
          <Button title="+ 添加模块" variant="ghost" onPress={addModule} />
        </View>

        {plan.modules.map((m, i) => (
          <Card key={m.id} style={{ marginBottom: spacing.sm }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                  <Text style={styles.modName}>{m.name}</Text>
                  {plan.mode === 'weekly' && m.weekday !== undefined && m.weekday !== null && (
                    <Text style={styles.modTag}>{WEEK_LABELS[m.weekday]}</Text>
                  )}
                  {plan.mode === 'random' && m.weight !== 1 && (
                    <Text style={styles.modTag}>权重 x{m.weight}</Text>
                  )}
                </View>
                <Text style={styles.modFocus}>{m.focus}</Text>
                <Text style={styles.modMeta}>{m.items.length} 个训练项</Text>
              </View>
            </View>
            <View style={styles.actions}>
              <Pressable style={styles.actBtn} onPress={() => router.push(`/plans/${plan.id}/module/${m.id}`)}>
                <Text style={styles.actText}>✏️ 编辑内容</Text>
              </Pressable>
              <Pressable style={styles.actBtn} onPress={() => removeModule(m.id)}>
                <Text style={[styles.actText, { color: colors.danger }]}>🗑 删除</Text>
              </Pressable>
            </View>
          </Card>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { color: colors.textDim, fontSize: font.small },
  input: {
    color: colors.text,
    backgroundColor: colors.cardAlt,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
    fontSize: font.body,
  },
  modeRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  modeBtn: { flex: 1, paddingVertical: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.lg, marginBottom: spacing.md },
  sectionTitle: { color: colors.textDim, fontSize: font.small },
  modName: { color: colors.text, fontSize: font.h3, fontWeight: '700' },
  modTag: { color: colors.primary, fontSize: font.tiny, paddingHorizontal: 6, paddingVertical: 2, backgroundColor: colors.cardAlt, borderRadius: 4 },
  modFocus: { color: colors.textDim, marginTop: 4 },
  modMeta: { color: colors.textDim, fontSize: font.small, marginTop: 4 },
  actions: { flexDirection: 'row', marginTop: spacing.md, gap: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md },
  actBtn: { flex: 1, alignItems: 'center' },
  actText: { color: colors.primary, fontWeight: '600' },
});

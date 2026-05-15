import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { colors, font, radius, spacing } from '@/theme/tokens';
import type { Plan, PlanMode, TrainingModule } from '@/data/planTypes';
import { getPlanById, savePlan } from '@/db/plans';
import { WeekOverviewCard, type DayStat } from '@/features/plans/WeekOverviewCard';

const WEEK_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const WEEK_SHORT = ['日', '一', '二', '三', '四', '五', '六'];

export default function PlanEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [selectedWeekday, setSelectedWeekday] = useState<number | null>(null);
  const scrollRef = useRef<ScrollView>(null);

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

  async function updateModule(mid: string, patch: Partial<TrainingModule>) {
    if (!plan) return;
    const next = { ...plan, modules: plan.modules.map((m) => (m.id === mid ? { ...m, ...patch } : m)) };
    setPlan(next);
    await savePlan(next);
  }

  function addModule() {
    if (!plan) return;
    let weekday: number | null = null;
    if (plan.mode === 'weekly') {
      weekday = selectedWeekday !== null ? selectedWeekday : 1;
    }
    const newMod: TrainingModule = {
      id: `mod-${Date.now()}`,
      name: '新建训练模块',
      focus: '填写重点',
      category: 'tech',
      items: [],
      weekday,
      weight: 1,
    };
    const nextModules = [...plan.modules, newMod];
    updatePlan({ modules: nextModules });
    // 滚到底,让用户看到刚添加的模块
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
  }

  function removeModule(mid: string) {
    if (!plan) return;
    Alert.alert('删除模块', '确定要删除这个训练模块吗？', [
      { text: '取消' },
      { text: '删除', style: 'destructive', onPress: () => updatePlan({ modules: plan.modules.filter((m) => m.id !== mid) }) },
    ]);
  }

  if (!plan) return <Screen><Text style={{ color: colors.textDim }}>加载中...</Text></Screen>;

  // weekly 模式 7 天统计（仅 weekly 用到，但 hook 顺序固定不能放条件里 → 用 plan.modules 直接派生）
  const dayStats: DayStat[] = (() => {
    const stats: DayStat[] = Array.from({ length: 7 }, () => ({ count: 0, mins: 0 }));
    for (const m of plan.modules) {
      if (m.weekday == null || m.weekday < 0 || m.weekday > 6) continue;
      stats[m.weekday].count += 1;
      stats[m.weekday].mins += m.items.reduce((s, it) => s + (it.duration_min || 0), 0);
    }
    return stats;
  })();
  const unassignedCount = plan.modules.filter((m) => m.weekday == null).length;

  const showOverview = plan.mode === 'weekly' && plan.modules.length > 0;
  const visibleModules =
    showOverview && selectedWeekday !== null
      ? plan.modules.filter((m) => m.weekday === selectedWeekday)
      : plan.modules;

  return (
    <Screen scroll={false}>
      <ScrollView ref={scrollRef} contentContainerStyle={{ paddingBottom: 100 }}>
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

        {showOverview && (
          <WeekOverviewCard
            dayStats={dayStats}
            unassignedCount={unassignedCount}
            selectedWeekday={selectedWeekday}
            onSelect={setSelectedWeekday}
          />
        )}

        <View style={styles.headerRow}>
          <Text style={styles.sectionTitle}>包含的训练模块 ({visibleModules.length})</Text>
          <Button title="+ 添加模块" variant="ghost" onPress={addModule} />
        </View>

        {showOverview && selectedWeekday !== null && (
          <View style={styles.filterBar}>
            <Text style={styles.filterText}>
              筛选：周{WEEK_SHORT[selectedWeekday]} · 显示 {visibleModules.length} 个模块
            </Text>
            <Pressable onPress={() => setSelectedWeekday(null)} hitSlop={8}>
              <Text style={styles.filterClear}>清除筛选 ×</Text>
            </Pressable>
          </View>
        )}

        {plan.modules.length === 0 ? (
          <Card style={{ borderStyle: 'dashed', borderColor: colors.border }}>
            <Text style={{ color: colors.text, fontWeight: '600', fontSize: font.body }}>📦 还没有训练模块</Text>
            <Text style={{ color: colors.textDim, fontSize: font.small, marginTop: 4 }}>
              点上方「+ 添加模块」开始构建你的训练内容,每个模块可以放多个训练项(如:正手高远 5 分钟 + 步法 3 分钟)
            </Text>
          </Card>
        ) : showOverview && selectedWeekday !== null && visibleModules.length === 0 ? (
          <Card style={{ borderStyle: 'dashed', borderColor: colors.border }}>
            <Text style={{ color: colors.text, fontWeight: '600', fontSize: font.body }}>
              周{WEEK_SHORT[selectedWeekday]} 还没排训练
            </Text>
            <Text style={{ color: colors.textDim, fontSize: font.small, marginTop: 4 }}>
              点下方『+ 添加模块』，新模块会自动排到周{WEEK_SHORT[selectedWeekday]}
            </Text>
            <View style={{ marginTop: spacing.md }}>
              <Button title={`为周${WEEK_SHORT[selectedWeekday]} 添加模块`} onPress={addModule} />
            </View>
          </Card>
        ) : (
          visibleModules.map((m) => (
            <Card key={m.id} style={{ marginBottom: spacing.sm }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                    <Text style={styles.modName}>{m.name}</Text>
                    {plan.mode === 'random' && m.weight !== 1 && (
                      <Text style={styles.modTag}>权重 x{m.weight}</Text>
                    )}
                  </View>
                  <Text style={styles.modFocus}>{m.focus}</Text>
                  <Text style={styles.modMeta}>{m.items.length} 个训练项</Text>
                </View>
              </View>
              {plan.mode === 'weekly' && (
                <View style={styles.weekdayRow}>
                  {WEEK_SHORT.map((w, idx) => {
                    const isActive = m.weekday === idx;
                    return (
                      <Pressable
                        key={idx}
                        onPress={() => updateModule(m.id, { weekday: idx })}
                        style={[styles.weekdayChip, isActive && styles.weekdayChipActive]}
                      >
                        <Text style={[styles.weekdayChipText, isActive && { color: '#fff' }]}>{w}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}
              <View style={styles.actions}>
                <Pressable style={styles.actBtn} onPress={() => router.push(`/plans/${plan.id}/module/${m.id}`)}>
                  <Text style={styles.actText}>✏️ 编辑内容</Text>
                </Pressable>
                <Pressable style={styles.actBtn} onPress={() => removeModule(m.id)}>
                  <Text style={[styles.actText, { color: colors.danger }]}>🗑 删除</Text>
                </Pressable>
              </View>
            </Card>
          ))
        )}
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
  weekdayRow: { flexDirection: 'row', gap: 4, marginTop: spacing.md, flexWrap: 'wrap' },
  weekdayChip: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cardAlt,
  },
  weekdayChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  weekdayChipText: { color: colors.text, fontWeight: '600', fontSize: font.small },
  actions: { flexDirection: 'row', marginTop: spacing.md, gap: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md },
  actBtn: { flex: 1, alignItems: 'center' },
  actText: { color: colors.primary, fontWeight: '600' },
  filterBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.cardAlt,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  filterText: { color: colors.text, fontSize: font.small },
  filterClear: { color: colors.primary, fontSize: font.small, fontWeight: '600' },
});

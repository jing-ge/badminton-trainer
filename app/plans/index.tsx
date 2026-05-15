import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { colors, font, radius, spacing } from '@/theme/tokens';
import type { Plan, PlanMode, TrainingCategory } from '@/data/planTypes';
import { defaultPlans } from '@/data/presets';
import {
  createBlankPlan,
  deletePlan,
  duplicatePlan,
  getActivePlanId,
  listUserPlans,
  setActivePlanId,
} from '@/db/plans';

// TODO: 后续抽公共字典（当前与 app/(tabs)/train.tsx 内副本保持一致）
const CATEGORY_META: Record<TrainingCategory, { label: string; color: string; emoji: string }> = {
  tech: { label: '技术', color: colors.primary, emoji: '🏸' },
  footwork: { label: '步法', color: colors.accent, emoji: '👟' },
  fitness: { label: '体能', color: colors.warn, emoji: '💪' },
  match: { label: '实战', color: colors.danger, emoji: '⚔️' },
  recovery: { label: '恢复', color: colors.textDim, emoji: '🧘' },
};

/** 聚合 plan.modules → 各 category 分钟数与占比，按占比降序 */
function computeCategoryStats(plan: Plan) {
  const minutesByCat: Record<TrainingCategory, number> = {
    tech: 0,
    footwork: 0,
    fitness: 0,
    match: 0,
    recovery: 0,
  };
  for (const m of plan.modules) {
    const cat: TrainingCategory = m.category ?? 'recovery';
    const sum = m.items.reduce((acc, it) => acc + it.duration_min, 0);
    minutesByCat[cat] += sum;
  }
  const total = Object.values(minutesByCat).reduce((a, b) => a + b, 0);
  const entries = (Object.keys(minutesByCat) as TrainingCategory[])
    .map((cat) => ({ cat, minutes: minutesByCat[cat], ratio: total > 0 ? minutesByCat[cat] / total : 0 }))
    .filter((e) => e.minutes > 0)
    .sort((a, b) => b.ratio - a.ratio);
  return { entries, total };
}

export default function PlanListScreen() {
  const router = useRouter();
  const [activeId, setActive] = useState<string | null>(null);
  const [userPlans, setUserPlans] = useState<Plan[]>([]);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('我的训练计划');
  const [newMode, setNewMode] = useState<PlanMode>('weekly');

  const reload = useCallback(async () => {
    setActive(await getActivePlanId());
    setUserPlans(await listUserPlans());
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  async function activate(id: string) {
    await setActivePlanId(id);
    await reload();
  }

  async function onDuplicate(p: Plan) {
    const copy = await duplicatePlan(p);
    await setActivePlanId(copy.id);
    await reload();
    router.push(`/plans/${copy.id}/edit`);
  }

  async function onDelete(p: Plan) {
    Alert.alert('删除计划？', `"${p.name}" 将被永久删除`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          await deletePlan(p.id);
          await reload();
        },
      },
    ]);
  }

  async function onCreate() {
    const trimmed = newName.trim();
    if (!trimmed) {
      Alert.alert('请输入计划名');
      return;
    }
    // 重名自动追加 (2)/(3)...
    const existing = new Set(userPlans.map((p) => p.name));
    let finalName = trimmed;
    if (existing.has(finalName)) {
      let i = 2;
      while (existing.has(`${trimmed} (${i})`)) i++;
      finalName = `${trimmed} (${i})`;
    }
    const p = await createBlankPlan(finalName, newMode);
    await setActivePlanId(p.id);
    setCreating(false);
    setNewName('我的训练计划');
    router.push(`/plans/${p.id}/edit`);
  }

  return (
    <Screen>
      <Text style={styles.title}>训练计划</Text>
      <Text style={styles.sub}>选一个作为当前计划，或者新建自己的</Text>

      <View style={styles.sectionHeader}>
        <View style={[styles.sectionDot, { backgroundColor: colors.primary }]} />
        <Text style={styles.sectionHeaderText}>我的计划（{userPlans.length}）</Text>
      </View>
      {userPlans.length > 0 ? (
        userPlans.map((p) => (
          <PlanCard
            key={p.id}
            plan={p}
            isActive={activeId === p.id}
            onActivate={() => activate(p.id)}
            onEdit={() => router.push(`/plans/${p.id}/edit`)}
            onDuplicate={() => onDuplicate(p)}
            onDelete={() => onDelete(p)}
          />
        ))
      ) : (
        <Card style={{ marginTop: spacing.sm, borderStyle: 'dashed', borderColor: colors.border }}>
          <Text style={{ color: colors.text, fontWeight: '600', fontSize: font.body }}>✨ 还没有自定义计划</Text>
          <Text style={{ color: colors.textDim, fontSize: font.small, marginTop: 4 }}>
            从下方"推荐模板"复制一份,或点底部「+ 空白新建计划」开始定制属于你的训练
          </Text>
        </Card>
      )}

      <View style={styles.sectionHeader}>
        <View style={[styles.sectionDot, { backgroundColor: colors.accent }]} />
        <Text style={styles.sectionHeaderText}>推荐模板</Text>
      </View>
      {defaultPlans.map((p) => (
        <PlanCard
          key={p.id}
          plan={p}
          isActive={activeId === p.id || (!activeId && p.id === 'default-intermediate')}
          onActivate={() => activate(p.id)}
          onDuplicate={() => onDuplicate(p)}
        />
      ))}

      {creating ? (
        <Card style={{ marginTop: spacing.lg }}>
          <Text style={styles.label}>计划名称</Text>
          <TextInput
            value={newName}
            onChangeText={setNewName}
            style={styles.input}
            placeholderTextColor={colors.textDim}
          />
          <Text style={[styles.label, { marginTop: spacing.md }]}>训练模式</Text>
          <View style={styles.modeRow}>
            {(['weekly', 'random', 'pool'] as PlanMode[]).map((m) => (
              <Pressable
                key={m}
                onPress={() => setNewMode(m)}
                style={[styles.modeBtn, newMode === m && { backgroundColor: colors.primary, borderColor: colors.primary }]}
              >
                <Text style={{ color: newMode === m ? '#fff' : colors.text, fontWeight: '600' }}>
                  {m === 'weekly' ? '周计划' : m === 'random' ? '随机' : '模块池'}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.modeDesc}>
            {newMode === 'weekly'
              ? '按周一到周日固定安排训练模块'
              : newMode === 'random'
                ? '从模块库每天随机抽几个组合训练'
                : '所有模块放在池里，训练当天自己挑'}
          </Text>
          <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg }}>
            <Button title="取消" variant="ghost" onPress={() => setCreating(false)} style={{ flex: 1 }} />
            <Button title="创建" onPress={onCreate} style={{ flex: 1 }} />
          </View>
        </Card>
      ) : (
        <Button
          title="+ 空白新建计划"
          variant="ghost"
          onPress={() => setCreating(true)}
          style={{ marginTop: spacing.lg }}
        />
      )}
    </Screen>
  );
}

function PlanCard({
  plan,
  isActive,
  onActivate,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  plan: Plan;
  isActive: boolean;
  onActivate: () => void;
  onEdit?: () => void;
  onDuplicate: () => void;
  onDelete?: () => void;
}) {
  const totalItems = plan.modules.reduce((a, m) => a + m.items.length, 0);
  const { entries, total: totalMin } = computeCategoryStats(plan);
  const isEmpty = plan.modules.length === 0;
  // 图例芯片：占比 >=8% 才展示，最多 4 个
  const legendChips = entries.filter((e) => e.ratio >= 0.08).slice(0, 4);

  return (
    <Card
      style={{
        marginTop: spacing.sm,
        borderColor: isActive ? colors.primary : colors.border,
        borderWidth: isActive ? 2 : 1,
        overflow: 'hidden',
      }}
    >
      {isActive && <View style={styles.activeAccent} />}
      <View style={styles.cardHead}>
        <View style={{ flex: 1, flexShrink: 1, minWidth: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Text style={styles.planName} numberOfLines={1}>
              {plan.name}
            </Text>
            {plan.is_default && <Badge text="推荐" color={colors.accent} />}
            {isActive && <Badge text="当前" color={colors.primary} />}
          </View>
          <Text style={styles.planMeta}>
            {plan.level} · {modeLabel(plan.mode)}
          </Text>
        </View>
        <Text style={styles.volume}>
          {totalItems} 项 / {totalMin} 分钟
        </Text>
      </View>

      {isEmpty ? (
        <View style={styles.previewWrap}>
          <View style={[styles.bar, { backgroundColor: colors.cardAlt }]} />
          <Text style={styles.emptyHint}>还没有训练模块，点编辑去添加 →</Text>
        </View>
      ) : (
        <View style={styles.previewWrap}>
          <View style={styles.bar}>
            {entries.map((e, idx) => (
              <View
                key={e.cat}
                style={{
                  width: `${e.ratio * 100}%`,
                  height: '100%',
                  backgroundColor: CATEGORY_META[e.cat].color,
                  marginLeft: idx === 0 ? 0 : 2,
                }}
              />
            ))}
          </View>
          {legendChips.length > 0 && (
            <View style={styles.legendRow}>
              {legendChips.map((e) => (
                <View key={e.cat} style={styles.legendChip}>
                  <View style={[styles.legendDot, { backgroundColor: CATEGORY_META[e.cat].color }]} />
                  <Text style={styles.legendText}>
                    {CATEGORY_META[e.cat].emoji} {CATEGORY_META[e.cat].label} {Math.round(e.ratio * 100)}%
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      <View style={styles.actions}>
        {!isActive && (
          <Pressable onPress={onActivate} style={styles.actBtn}>
            <Text style={[styles.actText, { color: colors.primary }]}>✓ 设为当前</Text>
          </Pressable>
        )}
        <Pressable onPress={onDuplicate} style={styles.actBtn}>
          <Text style={styles.actText}>📋 复制</Text>
        </Pressable>
        {onEdit && (
          <Pressable onPress={onEdit} style={styles.actBtn}>
            <Text style={styles.actText}>✏️ 编辑</Text>
          </Pressable>
        )}
        {onDelete && <View style={{ flex: 1 }} />}
        {onDelete && (
          <Pressable onPress={onDelete} hitSlop={8} style={[styles.actBtn, styles.dangerBtn]}>
            <Text style={[styles.actText, { color: colors.danger }]}>🗑 删除</Text>
          </Pressable>
        )}
      </View>
    </Card>
  );
}

function Badge({ text, color }: { text: string; color: string }) {
  return (
    <View style={{ backgroundColor: color + '30', paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.sm }}>
      <Text style={{ color, fontSize: font.tiny, fontWeight: '700' }}>{text}</Text>
    </View>
  );
}

function modeLabel(m: PlanMode) {
  return m === 'weekly' ? '周计划' : m === 'random' ? '随机' : '池';
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: font.h1, fontWeight: '700' },
  sub: { color: colors.textDim, marginTop: 4 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xxl,
    marginBottom: spacing.sm,
  },
  sectionDot: { width: 8, height: 8, borderRadius: 4 },
  sectionHeaderText: { color: colors.text, fontSize: font.small, fontWeight: '700' },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  planName: { color: colors.text, fontSize: font.h3, fontWeight: '700', flexShrink: 1 },
  planMeta: { color: colors.textDim, fontSize: font.small, marginTop: 4 },
  volume: { color: colors.text, fontSize: font.small, fontWeight: '600' },
  activeAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: colors.primary,
  },
  previewWrap: { marginTop: spacing.md },
  bar: {
    height: 8,
    borderRadius: radius.sm,
    overflow: 'hidden',
    flexDirection: 'row',
    backgroundColor: colors.cardAlt,
  },
  emptyHint: { color: colors.textDim, fontSize: font.tiny, marginTop: spacing.sm },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  legendChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 6, height: 6, borderRadius: 3 },
  legendText: { color: colors.textDim, fontSize: font.tiny },
  actions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.md, marginTop: spacing.md },
  actBtn: { paddingVertical: 6 },
  dangerBtn: { paddingLeft: spacing.md, borderLeftWidth: 1, borderLeftColor: colors.border },
  actText: { color: colors.text, fontWeight: '600', fontSize: font.small },
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
  modeBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  modeDesc: { color: colors.textDim, fontSize: font.small, marginTop: spacing.sm },
});

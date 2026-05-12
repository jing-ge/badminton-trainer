import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { colors, font, radius, spacing } from '@/theme/tokens';
import type { Plan, PlanMode } from '@/data/planTypes';
import { defaultPlans } from '@/data/presets';
import {
  createBlankPlan,
  deletePlan,
  duplicatePlan,
  getActivePlanId,
  listUserPlans,
  setActivePlanId,
} from '@/db/plans';

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
    if (!newName.trim()) {
      Alert.alert('请输入计划名');
      return;
    }
    const p = await createBlankPlan(newName.trim(), newMode);
    await setActivePlanId(p.id);
    setCreating(false);
    setNewName('我的训练计划');
    router.push(`/plans/${p.id}/edit`);
  }

  return (
    <Screen>
      <Text style={styles.title}>训练计划</Text>
      <Text style={styles.sub}>选一个作为当前计划，或者新建自己的</Text>

      {userPlans.length > 0 && (
        <>
          <Text style={styles.sectionHeader}>我的计划（{userPlans.length}）</Text>
          {userPlans.map((p) => (
            <PlanCard
              key={p.id}
              plan={p}
              isActive={activeId === p.id}
              onActivate={() => activate(p.id)}
              onEdit={() => router.push(`/plans/${p.id}/edit`)}
              onDuplicate={() => onDuplicate(p)}
              onDelete={() => onDelete(p)}
            />
          ))}
        </>
      )}

      <Text style={styles.sectionHeader}>推荐模板</Text>
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
  const totalMin = plan.modules.reduce(
    (a, m) => a + m.items.reduce((x, y) => x + y.duration_min, 0),
    0,
  );

  return (
    <Card
      style={{
        marginTop: spacing.sm,
        borderColor: isActive ? colors.primary : colors.border,
        borderWidth: isActive ? 2 : 1,
      }}
    >
      <View style={styles.cardHead}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Text style={styles.planName}>{plan.name}</Text>
            {plan.is_default && <Badge text="推荐" color={colors.accent} />}
            {isActive && <Badge text="当前" color={colors.primary} />}
          </View>
          <Text style={styles.planMeta}>
            {plan.level} · {modeLabel(plan.mode)} · {plan.modules.length} 模块 · {totalItems} 项 · {totalMin} 分钟
          </Text>
        </View>
      </View>

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
        {onDelete && (
          <Pressable onPress={onDelete} style={styles.actBtn}>
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
  sectionHeader: { color: colors.textDim, fontSize: font.small, marginTop: spacing.xl, marginBottom: spacing.sm },
  cardHead: { flexDirection: 'row' },
  planName: { color: colors.text, fontSize: font.h3, fontWeight: '700' },
  planMeta: { color: colors.textDim, fontSize: font.small, marginTop: 4 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.md },
  actBtn: { paddingVertical: 6 },
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

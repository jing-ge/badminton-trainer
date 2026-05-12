import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { Section } from '@/components/Section';
import { colors, font, radius, spacing } from '@/theme/tokens';
import type { Plan, TrainingModule } from '@/data/planTypes';
import { getActivePlan } from '@/db/plans';

const WEEK_LABELS = ['日', '一', '二', '三', '四', '五', '六'];

const CATEGORY_META: Record<TrainingModule['category'], { label: string; color: string; emoji: string }> = {
  tech: { label: '技术', color: colors.primary, emoji: '🏸' },
  footwork: { label: '步法', color: colors.accent, emoji: '👟' },
  fitness: { label: '体能', color: colors.warn, emoji: '💪' },
  match: { label: '实战', color: colors.danger, emoji: '⚔️' },
  recovery: { label: '恢复', color: colors.textDim, emoji: '🧘' },
};

export default function TrainScreen() {
  const router = useRouter();
  const [plan, setPlan] = useState<Plan | null>(null);
  const today = new Date().getDay();

  useFocusEffect(
    useCallback(() => {
      (async () => {
        setPlan(await getActivePlan());
      })();
    }, []),
  );

  if (!plan) {
    return (
      <Screen>
        <Text style={{ color: colors.textDim }}>加载中...</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{plan.name}</Text>
          <Text style={styles.sub}>
            {plan.level} · {modeLabel(plan.mode)} · {plan.modules.length} 个模块
          </Text>
        </View>
        <Pressable
          style={styles.switchBtn}
          onPress={() => router.push('/plans')}
        >
          <Text style={styles.switchBtnText}>⇄ 切换</Text>
        </Pressable>
      </View>

      {plan.mode === 'weekly' ? (
        <WeeklyView plan={plan} today={today} onTapModule={(m) => router.push(`/training/module/${m.id}`)} />
      ) : plan.mode === 'random' ? (
        <RandomView plan={plan} onTapModule={(m) => router.push(`/training/module/${m.id}`)} onGo={() => router.push('/training/today')} />
      ) : (
        <PoolView plan={plan} onTapModule={(m) => router.push(`/training/module/${m.id}`)} />
      )}

      {!plan.is_default && (
        <Pressable onPress={() => router.push(`/plans/${plan.id}/edit`)} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1, marginTop: spacing.md }]}>
          <Card>
            <Text style={styles.editBtn}>✏️ 编辑这个计划</Text>
          </Card>
        </Pressable>
      )}

      <Section title="其他">
        <Pressable
          onPress={() => router.push('/training/fitness')}
          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
        >
          <Card>
            <Text style={styles.planTitle}>💪 体能训练专项</Text>
            <Text style={styles.focus}>爆发力、核心、耐力 · 计时器辅助</Text>
          </Card>
        </Pressable>
        <Pressable
          onPress={() => router.push('/pose')}
          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1, marginTop: spacing.md }]}
        >
          <Card>
            <Text style={styles.planTitle}>🎥 动作识别 / 实时纠错</Text>
            <Text style={styles.focus}>对着摄像头练习，AI 给你打分</Text>
          </Card>
        </Pressable>
      </Section>
    </Screen>
  );
}

function WeeklyView({
  plan,
  today,
  onTapModule,
}: {
  plan: Plan;
  today: number;
  onTapModule: (m: TrainingModule) => void;
}) {
  return (
    <View style={{ marginTop: spacing.md }}>
      {[1, 2, 3, 4, 5, 6, 0].map((wd) => {
        const mods = plan.modules.filter((m) => m.weekday === wd);
        const isToday = wd === today;
        const total = mods.reduce((a, m) => a + m.items.reduce((x, y) => x + y.duration_min, 0), 0);
        return (
          <Card
            key={wd}
            style={{
              marginBottom: spacing.md,
              borderColor: isToday ? colors.primary : colors.border,
              borderWidth: isToday ? 2 : 1,
            }}
          >
            <View style={styles.row}>
              <View style={[styles.dayBadge, isToday && { backgroundColor: colors.primary }]}>
                <Text style={[styles.dayBadgeText, isToday && { color: '#fff' }]}>
                  {WEEK_LABELS[wd]}
                </Text>
              </View>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                {mods.length === 0 ? (
                  <Text style={styles.restDay}>休息 / 未安排</Text>
                ) : (
                  mods.map((m) => (
                    <Pressable key={m.id} onPress={() => onTapModule(m)}>
                      <Text style={styles.modName}>
                        {CATEGORY_META[m.category].emoji} {m.name}
                      </Text>
                      <Text style={styles.modFocus}>{m.focus}</Text>
                    </Pressable>
                  ))
                )}
                {mods.length > 0 && (
                  <Text style={styles.meta}>
                    {mods.reduce((a, m) => a + m.items.length, 0)} 项 · {total} 分钟
                  </Text>
                )}
              </View>
            </View>
          </Card>
        );
      })}
    </View>
  );
}

function RandomView({
  plan,
  onTapModule,
  onGo,
}: {
  plan: Plan;
  onTapModule: (m: TrainingModule) => void;
  onGo: () => void;
}) {
  return (
    <View style={{ marginTop: spacing.md }}>
      <Card style={{ marginBottom: spacing.md }}>
        <Text style={styles.randomHint}>
          🎲 每日随机抽 {plan.random_pick ?? 3} 个模块组合训练
        </Text>
        <Pressable onPress={onGo} style={styles.goBtn}>
          <Text style={styles.goBtnText}>查看今日组合 →</Text>
        </Pressable>
      </Card>
      <Text style={styles.sectionTitle}>模块库（{plan.modules.length}）</Text>
      {plan.modules.map((m) => (
        <Pressable key={m.id} onPress={() => onTapModule(m)}>
          <Card style={{ marginBottom: spacing.sm }}>
            <Text style={styles.modName}>
              {CATEGORY_META[m.category].emoji} {m.name}
            </Text>
            <Text style={styles.modFocus}>
              {m.focus} · {m.items.length} 项
            </Text>
          </Card>
        </Pressable>
      ))}
    </View>
  );
}

function PoolView({
  plan,
  onTapModule,
}: {
  plan: Plan;
  onTapModule: (m: TrainingModule) => void;
}) {
  return (
    <View style={{ marginTop: spacing.md }}>
      <Text style={styles.sectionTitle}>训练模块池（{plan.modules.length}）</Text>
      {plan.modules.map((m) => (
        <Pressable key={m.id} onPress={() => onTapModule(m)}>
          <Card style={{ marginBottom: spacing.sm }}>
            <Text style={styles.modName}>
              {CATEGORY_META[m.category].emoji} {m.name}
            </Text>
            <Text style={styles.modFocus}>
              {m.focus} · {m.items.length} 项
            </Text>
          </Card>
        </Pressable>
      ))}
    </View>
  );
}

function modeLabel(m: Plan['mode']) {
  return m === 'weekly' ? '周计划' : m === 'random' ? '随机训练' : '模块池';
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  title: { color: colors.text, fontSize: font.h1, fontWeight: '700' },
  sub: { color: colors.textDim, marginTop: 4 },
  switchBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  switchBtnText: { color: colors.primary, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  dayBadge: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBadgeText: { color: colors.text, fontWeight: '700', fontSize: font.h3 },
  restDay: { color: colors.textDim, fontSize: font.small },
  modName: { color: colors.text, fontWeight: '600', fontSize: font.body, marginBottom: 2 },
  modFocus: { color: colors.textDim, fontSize: font.small },
  meta: { color: colors.primary, fontSize: font.tiny, marginTop: 6 },
  sectionTitle: { color: colors.textDim, fontSize: font.small, marginBottom: spacing.sm, marginTop: spacing.md },
  planTitle: { color: colors.text, fontWeight: '700', fontSize: font.body },
  focus: { color: colors.textDim, fontSize: font.small, marginTop: 2 },
  randomHint: { color: colors.text, fontSize: font.body },
  goBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  goBtnText: { color: '#fff', fontWeight: '700' },
  editBtn: { color: colors.primary, textAlign: 'center', fontWeight: '600' },
});

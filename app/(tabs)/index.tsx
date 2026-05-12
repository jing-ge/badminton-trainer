import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import dayjs from 'dayjs';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { Section } from '@/components/Section';
import { Button } from '@/components/Button';
import { colors, font, radius, spacing } from '@/theme/tokens';
import { getStreak, listTrainingLogs, TrainingLog } from '@/db/trainingLogs';
import { getActivePlan } from '@/db/plans';
import { selectToday, TodaySelection } from '@/data/selectToday';

export default function HomeScreen() {
  const router = useRouter();
  const [today, setToday] = useState<TodaySelection | null>(null);
  const [streak, setStreak] = useState(0);
  const [recent, setRecent] = useState<TrainingLog[]>([]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const plan = await getActivePlan();
        setToday(selectToday(plan));
        setStreak(await getStreak());
        setRecent(await listTrainingLogs(3));
      })();
    }, []),
  );

  const totalMin = today
    ? today.modules.reduce((a, m) => a + m.items.reduce((x, y) => x + y.duration_min, 0), 0)
    : 0;
  const itemCount = today
    ? today.modules.reduce((a, m) => a + m.items.length, 0)
    : 0;

  return (
    <Screen>
      <View style={styles.hero}>
        <Text style={styles.greet}>{getGreeting()}，准备训练了吗？</Text>
        <Text style={styles.date}>{dayjs().format('YYYY 年 M 月 D 日 dddd')}</Text>
      </View>

      <Card style={{ marginBottom: spacing.lg }}>
        <View style={styles.streakRow}>
          <View>
            <Text style={styles.streakNum}>🔥 {streak}</Text>
            <Text style={styles.streakLabel}>连续训练天数</Text>
          </View>
          <Pressable
            style={styles.checkin}
            onPress={() => router.push('/training/log')}
          >
            <Text style={styles.checkinText}>+ 打卡</Text>
          </Pressable>
        </View>
      </Card>

      <Section
        title="今日训练"
        right={
          <Text style={styles.link} onPress={() => router.push('/plans')}>
            切换计划 →
          </Text>
        }
      >
        {today ? (
          today.modules.length === 0 ? (
            <Card>
              <Text style={styles.planTitle}>{today.plan.name}</Text>
              <Text style={styles.empty}>
                {today.source === 'weekly'
                  ? '今天没有安排训练，去添加一下吧'
                  : '当前计划还没有训练模块'}
              </Text>
              <Button
                title="编辑计划"
                onPress={() => router.push(`/plans/${today.plan.id}/edit`)}
                style={{ marginTop: spacing.md }}
              />
            </Card>
          ) : (
            <>
              <Card>
                <Text style={styles.planName}>{today.plan.name}</Text>
                <Text style={styles.planMode}>
                  {today.source === 'weekly'
                    ? '周计划'
                    : today.source === 'random'
                      ? `🎲 今日随机 ${today.modules.length} 模块`
                      : '模块池'}
                </Text>
                <Text style={styles.planMeta}>
                  {itemCount} 个训练项 · 约 {totalMin} 分钟
                </Text>
                {today.modules.slice(0, 3).map((m) => (
                  <Text key={m.id} style={styles.modItem} numberOfLines={1}>
                    · {m.name}
                  </Text>
                ))}
                {today.modules.length > 3 && (
                  <Text style={styles.modItem}>... 共 {today.modules.length} 个模块</Text>
                )}
                <Button
                  title="开始今日训练"
                  onPress={() => router.push('/training/today')}
                  style={{ marginTop: spacing.md }}
                />
              </Card>
            </>
          )
        ) : null}
      </Section>

      <Section title="快捷入口">
        <View style={styles.quickGrid}>
          <QuickCard
            label="训练计划"
            emoji="📋"
            desc="切换 / 新建 / 编辑"
            onPress={() => router.push('/plans')}
          />
          <QuickCard
            label="动作识别"
            emoji="🎥"
            desc="开摄像头实时纠错"
            onPress={() => router.push('/pose')}
          />
          <QuickCard
            label="体能训练"
            emoji="💪"
            desc="爆发力 / 核心"
            onPress={() => router.push('/training/fitness')}
          />
          <QuickCard
            label="录像复盘"
            emoji="📹"
            desc="标注比赛问题点"
            onPress={() => router.push('/replay')}
          />
        </View>
      </Section>

      {recent.length > 0 && (
        <Section title="最近训练">
          {recent.map((r) => (
            <Card key={r.id} style={{ marginBottom: spacing.sm }}>
              <View style={styles.recentRow}>
                <View>
                  <Text style={styles.recentDate}>{r.date}</Text>
                  <Text style={styles.recentMeta}>
                    {r.duration_min} 分钟 · {r.categories.join('、') || '综合'}
                  </Text>
                </View>
                <Text style={styles.intensity}>
                  {'★'.repeat(r.intensity)}
                  {'☆'.repeat(5 - r.intensity)}
                </Text>
              </View>
            </Card>
          ))}
        </Section>
      )}
    </Screen>
  );
}

function QuickCard({
  label,
  emoji,
  desc,
  onPress,
}: {
  label: string;
  emoji: string;
  desc: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.quick, { opacity: pressed ? 0.7 : 1 }]}>
      <Text style={{ fontSize: 28 }}>{emoji}</Text>
      <Text style={styles.quickLabel}>{label}</Text>
      <Text style={styles.quickDesc}>{desc}</Text>
    </Pressable>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 6) return '深夜好';
  if (h < 11) return '早上好';
  if (h < 14) return '中午好';
  if (h < 18) return '下午好';
  return '晚上好';
}

const styles = StyleSheet.create({
  hero: { marginBottom: spacing.lg },
  greet: { color: colors.text, fontSize: font.h1, fontWeight: '700' },
  date: { color: colors.textDim, marginTop: 4, fontSize: font.small },
  streakRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  streakNum: { color: colors.text, fontSize: 32, fontWeight: '800' },
  streakLabel: { color: colors.textDim, fontSize: font.small, marginTop: 4 },
  checkin: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: radius.pill,
  },
  checkinText: { color: '#fff', fontWeight: '700' },
  link: { color: colors.primary, fontSize: font.small },
  planTitle: { color: colors.text, fontSize: font.h3, fontWeight: '700' },
  planName: { color: colors.text, fontSize: font.h3, fontWeight: '700' },
  planMode: { color: colors.primary, marginTop: 4, fontSize: font.small },
  planMeta: { color: colors.textDim, marginTop: 4, fontSize: font.small },
  modItem: { color: colors.text, marginTop: spacing.sm, fontSize: font.small },
  empty: { color: colors.textDim, marginTop: spacing.sm },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  quick: {
    width: '47%',
    backgroundColor: colors.card,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickLabel: { color: colors.text, fontWeight: '700', fontSize: font.body, marginTop: spacing.sm },
  quickDesc: { color: colors.textDim, fontSize: font.small, marginTop: 2 },
  recentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recentDate: { color: colors.text, fontWeight: '600' },
  recentMeta: { color: colors.textDim, fontSize: font.small, marginTop: 2 },
  intensity: { color: colors.warn, fontSize: 14 },
});

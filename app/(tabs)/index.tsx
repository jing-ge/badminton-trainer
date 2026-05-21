import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import dayjs from 'dayjs';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { Section } from '@/components/Section';
import { Button } from '@/components/Button';
import { colors, font, radius, spacing } from '@/theme/tokens';
import {
  getStreakStats,
  listTrainingLogs,
  TrainingLog,
} from '@/db/trainingLogs';
import { getActivePlan } from '@/db/plans';
import { selectToday, TodaySelection } from '@/data/selectToday';
import { vibrateLight, vibrateHeavy } from '@/utils/haptics';
import { getIntensityMeta } from '@/data/intensity';
import { isOnboardingDone } from '../onboarding';
import {
  StreakBadgeCard,
  type StreakStats,
} from '@/features/streak/StreakBadgeCard';
import { MilestoneToast } from '@/features/streak/MilestoneToast';

// v0.19.0 — 模块 category emoji（与 PlanCard inline 字典语义对齐）
const MOD_EMOJI: Record<string, string> = {
  tech: '🏸',
  footwork: '👟',
  fitness: '💪',
  match: '⚔️',
  recovery: '🧘',
};

export default function HomeScreen() {
  const router = useRouter();
  const [today, setToday] = useState<TodaySelection | null>(null);
  const [streakStats, setStreakStats] = useState<StreakStats | null>(null);
  const [recent, setRecent] = useState<TrainingLog[]>([]);
  // -1 表示尚未训练过；0+ 表示距离最后一次训练的天数
  const [daysSinceLast, setDaysSinceLast] = useState(0);
  const [loaded, setLoaded] = useState(false);

  // 里程碑吐司：单 session 内同 fingerprint 只弹一次
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const shownToastFps = useRef<Set<string>>(new Set());
  // A 状态震动去抖
  const lastHapticFp = useRef<string | null>(null);
  // prevBest 缓存——首次 undefined 不触发吐司
  const prevBestRef = useRef<number | undefined>(undefined);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        // 首次进入应用：未完成 onboarding 直接跳走，不渲染首页
        const done = await isOnboardingDone();
        if (!done) {
          router.replace('/onboarding' as never);
          return;
        }
        const plan = await getActivePlan();
        setToday(selectToday(plan));
        const stats = await getStreakStats();
        setStreakStats(stats);
        const logs = await listTrainingLogs(3);
        setRecent(logs);

        if (logs.length > 0) {
          const lastDate = dayjs(logs[0].date);
          setDaysSinceLast(dayjs().diff(lastDate, 'day'));
        } else {
          setDaysSinceLast(-1);
        }
        setLoaded(true);

        // 破纪录震动（A 状态 + fingerprint 变化）
        const fp = `${stats.current}-${stats.best}-${stats.todayLogged}`;
        const isA = stats.current > stats.best && stats.todayLogged;
        if (isA && lastHapticFp.current !== fp) {
          vibrateHeavy();
          lastHapticFp.current = fp;
        }

        // 吐司：破纪录 / 整数里程碑
        const prevBest = prevBestRef.current;
        const milestoneSet = new Set([7, 14, 30, 50, 100]);
        let toastText: string | null = null;
        if (prevBest !== undefined && stats.current > prevBest) {
          toastText = `💎 个人新纪录 ${stats.current} 天！`;
        } else if (milestoneSet.has(stats.current)) {
          if (stats.current === 7) toastText = '🌱 一周连击达成';
          else if (stats.current === 14) toastText = '🌿 两周连击达成';
          else if (stats.current === 30) toastText = '🌳 一个月铁人';
          else if (stats.current === 50) toastText = '⚡ 50 天连击';
          else if (stats.current === 100) toastText = '👑 百日筑基';
        }
        if (toastText && !shownToastFps.current.has(fp)) {
          shownToastFps.current.add(fp);
          setToastMsg(toastText);
        }
        prevBestRef.current = stats.best;
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
      <MilestoneToast
        visible={toastMsg !== null}
        message={toastMsg ?? ''}
        onDismiss={() => setToastMsg(null)}
      />

      <View style={styles.hero}>
        <Text style={styles.greet}>{getGreeting()}，准备训练了吗？</Text>
        <Text style={styles.date}>{dayjs().format('YYYY 年 M 月 D 日 dddd')}</Text>
      </View>

      {streakStats && (
        <StreakBadgeCard
          stats={streakStats}
          onPressCta={() => router.push('/training/log')}
        />
      )}

      <Section
        title="今日训练"
        right={
          <Pressable
            hitSlop={8}
            onPressIn={vibrateLight}
            onPress={() => router.push('/plans')}
            style={({ pressed }) => [styles.switchChip, { opacity: pressed ? 0.75 : 1 }]}
          >
            <Text style={styles.switchChipText}>⇄ 切换计划</Text>
          </Pressable>
        }
      >
        {/* 首启新用户：欢迎卡（已加载、且从未训练过） */}
        {loaded && daysSinceLast === -1 && (
          <Card
            style={{
              marginBottom: spacing.md,
              backgroundColor: colors.cardAlt,
              borderColor: colors.primary,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 32, marginRight: spacing.sm }}>🎯</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: '700', fontSize: font.h3 }}>
                  欢迎，准备开启你的第一次训练
                </Text>
                <Text style={{ color: colors.textDim, fontSize: font.small, marginTop: 2 }}>
                  从今日推荐入手，跟着虚拟教练完成第一组动作。
                </Text>
              </View>
            </View>
            <Button
              title="开始第一次训练"
              onPress={() => router.push('/training/today')}
              style={{ marginTop: spacing.md }}
            />
          </Card>
        )}

        {/* 老用户回归提醒（至少有一条记录，且已 3+ 天没练） */}
        {loaded && daysSinceLast >= 3 && (
          <Card
            style={{
              marginBottom: spacing.md,
              backgroundColor: colors.accent + '20',
              borderColor: colors.accent,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 32, marginRight: spacing.sm }}>🧘</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.accent, fontWeight: '700', fontSize: font.h3 }}>
                  你已经 {daysSinceLast} 天没练啦！
                </Text>
                <Text style={{ color: colors.textDim, fontSize: font.small, marginTop: 2 }}>
                  今天不打球？做个 10 分钟的静力拉伸或者核心力量，把火苗续上吧！
                </Text>
              </View>
            </View>
            <Button
              title="去做个恢复训练"
              onPress={() => router.push('/training/fitness')}
              style={{ marginTop: spacing.md, backgroundColor: colors.accent }}
            />
          </Card>
        )}

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
                {/* v0.19 顶部 source 标签行 */}
                <View style={styles.sourceRow}>
                  <Text style={[styles.sourceLabel, sourceStyle(today.source)]}>
                    {sourceEmoji(today.source)} {sourceText(today.source, today.modules.length)}
                  </Text>
                </View>
                <Text style={styles.planName}>{today.plan.name}</Text>

                {/* v0.19 巨型双栏数字：本节练几项 / 共多少分钟 */}
                <View style={styles.statsRow}>
                  <View style={styles.statCol}>
                    <Text style={styles.statNum}>{itemCount}</Text>
                    <Text style={styles.statLabel}>训练项</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statCol}>
                    <Text style={styles.statNum}>{totalMin}</Text>
                    <Text style={styles.statLabel}>分钟</Text>
                  </View>
                </View>

                {/* v0.19 模块行：emoji + 名称 + 时长 */}
                <View style={{ marginTop: spacing.sm }}>
                  {today.modules.slice(0, 3).map((m) => {
                    const mins = m.items.reduce((a, b) => a + b.duration_min, 0);
                    const emoji = MOD_EMOJI[m.category] ?? '🎯';
                    return (
                      <View key={m.id} style={styles.modRow}>
                        <Text style={styles.modEmoji}>{emoji}</Text>
                        <Text style={styles.modName} numberOfLines={1}>{m.name}</Text>
                        <Text style={styles.modMins}>{mins} 分钟</Text>
                      </View>
                    );
                  })}
                  {today.modules.length > 3 && (
                    <Text style={styles.modMore}>... 共 {today.modules.length} 个模块</Text>
                  )}
                </View>

                <Button
                  title="🚀 开始今日训练"
                  onPress={() => router.push('/training/today')}
                  style={{ marginTop: spacing.md }}
                />
              </Card>
            </>
          )
        ) : null}
      </Section>

      <Section title="快捷入口">
        <Pressable
          onPress={() => router.push('/replay')}
          style={({ pressed }) => [styles.quickWide, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Text style={{ fontSize: 28 }}>📹</Text>
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <Text style={styles.quickLabel}>录像复盘</Text>
            <Text style={styles.quickDesc}>把比赛录像变成可复盘的训练资料</Text>
          </View>
          <Text style={{ color: colors.textDim, fontSize: 22 }}>›</Text>
        </Pressable>
        {recent.length > 0 && (
          <Pressable
            onPressIn={vibrateLight}
            onPress={() => router.push('/(tabs)/stats')}
            style={({ pressed }) => [
              styles.quickWide,
              { marginTop: spacing.sm, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Text style={{ fontSize: 28 }}>📒</Text>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={styles.quickLabel}>训练记录</Text>
              <Text style={styles.quickDesc}>查看全部历史训练日志与详情</Text>
            </View>
            <Text style={{ color: colors.textDim, fontSize: 22 }}>›</Text>
          </Pressable>
        )}
      </Section>

      {recent.length > 0 && (
        <Section title="最近训练">
          {recent.map((r, idx) => {
            const intensityMeta = getIntensityMeta(r.intensity);
            // 仅第一条、且与第二条非同日时显示"上次对照"
            let diffText: string | null = null;
            let diffColor: string = colors.textDim;
            if (idx === 0 && recent.length >= 2 && recent[0].date !== recent[1].date) {
              const n = Math.abs(
                Math.round(recent[0].duration_min - recent[1].duration_min),
              );
              if (n === 0) {
                diffText = '→ 与上次相同';
                diffColor = colors.textDim;
              } else if (recent[0].duration_min > recent[1].duration_min) {
                diffText = `↗ 比上次多 ${n} 分钟`;
                diffColor = colors.primary;
              } else {
                diffText = `↘ 比上次少 ${n} 分钟`;
                diffColor = colors.warn;
              }
            }
            return (
              <Pressable
                key={r.id}
                onPressIn={vibrateLight}
                onPress={() => router.push({ pathname: '/log/[id]', params: { id: String(r.id) } })}
                style={({ pressed }) => [
                  { marginBottom: spacing.sm, opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Card>
                  <View style={styles.recentRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.recentDate}>{r.date}</Text>
                      <Text style={styles.recentMeta}>
                        {r.duration_min} 分钟 · {r.categories.join('、') || '综合'}
                      </Text>
                      {diffText && (
                        <Text
                          numberOfLines={1}
                          style={{
                            color: diffColor,
                            fontSize: font.tiny,
                            marginTop: 2,
                          }}
                        >
                          {diffText}
                        </Text>
                      )}
                    </View>
                    <View style={styles.intensityCol}>
                      <Text style={styles.intensityEmoji}>{intensityMeta.emoji}</Text>
                      <Text style={styles.intensityLabel}>{intensityMeta.label}</Text>
                    </View>
                    <Text style={{ color: colors.textDim, fontSize: 22 }}>›</Text>
                  </View>
                </Card>
              </Pressable>
            );
          })}
        </Section>
      )}
    </Screen>
  );
}

// v0.19 source 标签：emoji / 文案 / 主色
function sourceEmoji(s: TodaySelection['source']) {
  return s === 'weekly' ? '🗓' : s === 'random' ? '🎲' : '🎯';
}
function sourceText(s: TodaySelection['source'], n: number) {
  return s === 'weekly' ? '周计划' : s === 'random' ? `今日随机 ${n} 模块` : '模块池';
}
function sourceStyle(s: TodaySelection['source']) {
  return {
    color: s === 'weekly' ? colors.primary : s === 'random' ? colors.accent : colors.warn,
  };
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
  switchChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  switchChipText: { color: colors.primary, fontSize: font.small, fontWeight: '600' },
  planTitle: { color: colors.text, fontSize: font.h3, fontWeight: '700' },
  planName: { color: colors.text, fontSize: font.h3, fontWeight: '700' },
  planMode: { color: colors.primary, marginTop: 4, fontSize: font.small },
  planMeta: { color: colors.textDim, marginTop: 4, fontSize: font.small },
  modItem: { color: colors.text, marginTop: spacing.sm, fontSize: font.small },
  empty: { color: colors.textDim, marginTop: spacing.sm },
  quickWide: {
    flexDirection: 'row',
    alignItems: 'center',
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
    alignItems: 'center',
    gap: spacing.sm,
  },
  recentDate: { color: colors.text, fontWeight: '600' },
  recentMeta: { color: colors.textDim, fontSize: font.small, marginTop: 2 },
  intensityCol: { alignItems: 'center', minWidth: 44 },
  intensityEmoji: { fontSize: 22 },
  intensityLabel: { color: colors.textDim, fontSize: font.tiny, marginTop: 2 },
  // v0.19 今日训练卡新样式
  sourceRow: { marginBottom: 6 },
  sourceLabel: { fontSize: font.small, fontWeight: '700' },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.cardAlt,
    borderRadius: radius.md,
  },
  statCol: { flex: 1, alignItems: 'center' },
  statNum: { color: colors.primary, fontSize: font.h2, fontWeight: '800' },
  statLabel: { color: colors.textDim, fontSize: font.tiny, marginTop: 2 },
  statDivider: { width: 1, height: 28, backgroundColor: colors.border },
  modRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm, gap: spacing.sm },
  modEmoji: { fontSize: 16 },
  modName: { flex: 1, color: colors.text, fontSize: font.small },
  modMins: { color: colors.textDim, fontSize: font.tiny },
  modMore: { color: colors.textDim, fontSize: font.tiny, marginTop: spacing.sm, fontStyle: 'italic' },
});

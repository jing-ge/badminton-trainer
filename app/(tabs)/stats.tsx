import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { useAnimatedProps, useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import dayjs from 'dayjs';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { Section } from '@/components/Section';
import { colors, font, radius, spacing } from '@/theme/tokens';
import {
  getStreak,
  listTrainingLogs,
  TrainingLog,
} from '@/db/trainingLogs';
import { vibrateLight } from '@/utils/haptics';

type PeriodMode = 'week' | 'month';

// reanimated 数字滚动:在 UI 线程把 SharedValue 写进 TextInput.text 属性,
// 避免 setState 高频 re-render。editable=false + pointerEvents='none' 让它看上去像文本。
const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

const HISTORY_INITIAL = 20;

// 主数值与上一期对比公式不分大类卡片;复用给"累计时长"格式化(分钟 -> 字符串)
function formatDurationLabel(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h < 10 && m >= 30) return `${h}.5h`;
  return `${h}h`;
}

// 周/月区间(YYYY-MM-DD 字符串闭区间)
function getPeriodRange(mode: PeriodMode): { curStart: string; curEnd: string; prevStart: string; prevEnd: string; prevLabel: string } {
  const today = dayjs();
  const todayStr = today.format('YYYY-MM-DD');
  if (mode === 'week') {
    // dayjs().day():0=周日,1=周一,...6=周六。需修正到周一起点
    const d = today.day();
    const diffFromMonday = d === 0 ? 6 : d - 1;
    const curStart = today.subtract(diffFromMonday, 'day').format('YYYY-MM-DD');
    const prevStart = today.subtract(diffFromMonday + 7, 'day').format('YYYY-MM-DD');
    const prevEnd = today.subtract(diffFromMonday + 1, 'day').format('YYYY-MM-DD');
    return { curStart, curEnd: todayStr, prevStart, prevEnd, prevLabel: '上周' };
  }
  // month
  const curStart = today.startOf('month').format('YYYY-MM-DD');
  const prevMonth = today.subtract(1, 'month');
  const prevStart = prevMonth.startOf('month').format('YYYY-MM-DD');
  const prevEnd = prevMonth.endOf('month').format('YYYY-MM-DD');
  return { curStart, curEnd: todayStr, prevStart, prevEnd, prevLabel: '上月' };
}

type PeriodStat = {
  days: number;
  mins: number;
  avgIntensity: number;
  hasData: boolean;
};

function summarizePeriod(logs: TrainingLog[], start: string, end: string): PeriodStat {
  const inRange = logs.filter((l) => l.date >= start && l.date <= end);
  if (inRange.length === 0) return { days: 0, mins: 0, avgIntensity: 0, hasData: false };
  const days = new Set(inRange.map((l) => l.date)).size;
  const mins = inRange.reduce((a, b) => a + b.duration_min, 0);
  const avgIntensity = inRange.reduce((a, b) => a + b.intensity, 0) / inRange.length;
  return { days, mins, avgIntensity, hasData: true };
}

export default function StatsScreen() {
  const [streak, setStreak] = useState(0);
  const [logs, setLogs] = useState<TrainingLog[]>([]);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [periodMode, setPeriodMode] = useState<PeriodMode>('week');

  useEffect(() => {
    (async () => {
      setStreak(await getStreak());
      setLogs(await listTrainingLogs(100)); // 拿多一点数据用于热力图
    })();
  }, []);

  // 时间舱:周/月当期 + 上一期统计
  const periodStats = useMemo(() => {
    const range = getPeriodRange(periodMode);
    const cur = summarizePeriod(logs, range.curStart, range.curEnd);
    const prev = summarizePeriod(logs, range.prevStart, range.prevEnd);
    return { ...range, cur, prev };
  }, [logs, periodMode]);

  // 计算热力图数据 (最近 90 天)
  const heatmapDays = 90;
  const heatData: { date: string, mins: number, level: number }[] = [];
  const logMap = new Map<string, number>();
  logs.forEach(l => {
    logMap.set(l.date, (logMap.get(l.date) || 0) + l.duration_min);
  });

  for (let i = heatmapDays - 1; i >= 0; i--) {
    const d = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
    const mins = logMap.get(d) || 0;
    let level = 0;
    if (mins > 0 && mins <= 20) level = 1;
    else if (mins > 20 && mins <= 60) level = 2;
    else if (mins > 60) level = 3;
    heatData.push({ date: d, mins, level });
  }

  // 把热力图切成 7 天/列
  const columns: typeof heatData[] = [];
  let currentCol: typeof heatData = [];
  heatData.forEach((item, index) => {
    currentCol.push(item);
    if (currentCol.length === 7 || index === heatData.length - 1) {
      columns.push(currentCol);
      currentCol = [];
    }
  });

  // A:C Ratio
  const acuteLoad = heatData.slice(-7).reduce((a, b) => a + b.mins, 0);
  const last28 = heatData.slice(-28);
  const chronicLoad = last28.reduce((a, b) => a + b.mins, 0) / 4;
  const last28Total = last28.reduce((a, b) => a + b.mins, 0);
  const last28Days = last28.filter((d) => d.mins > 0).length;
  const acReady = last28Total >= 60 && last28Days >= 3 && chronicLoad > 0;
  const acRatio = acReady ? (acuteLoad / chronicLoad).toFixed(2) : '—';
  const isHighRisk = acReady && Number(acRatio) > 1.5;

  // 最近 30 天训练类别分布
  const categoryStats = useMemo(() => {
    const cutoff = dayjs().subtract(30, 'day').format('YYYY-MM-DD');
    const counter = new Map<string, number>();
    let totalLogs = 0;
    logs.forEach((l) => {
      if (l.date < cutoff) return;
      totalLogs++;
      const cats = l.categories.length > 0 ? l.categories : ['综合'];
      cats.forEach((c) => counter.set(c, (counter.get(c) ?? 0) + 1));
    });
    const ranked = [...counter.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
    const max = ranked[0]?.count ?? 0;
    return { ranked, totalLogs, max };
  }, [logs]);

  const visibleLogs = showAllHistory ? logs : logs.slice(0, HISTORY_INITIAL);

  return (
    <Screen>
      <Text style={styles.title}>训练记录</Text>

      {/* P0-1: 时间舱(周/月切换) + 连续天数 inline */}
      <View style={styles.periodBar}>
        <View style={styles.periodPills}>
          {(['week', 'month'] as const).map((m) => {
            const active = periodMode === m;
            return (
              <Pressable
                key={m}
                onPress={() => {
                  if (periodMode === m) return;
                  vibrateLight();
                  setPeriodMode(m);
                }}
                style={[
                  styles.periodPill,
                  active && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}
              >
                <Text style={{ color: active ? '#fff' : colors.textDim, fontWeight: '600', fontSize: font.small }}>
                  {m === 'week' ? '本周' : '本月'}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.streakInline}>🔥 连续 {streak} 天</Text>
      </View>

      <View style={styles.kpiRow}>
        <PeriodKPI
          label="打卡天数"
          unit="天"
          current={periodStats.cur.hasData ? periodStats.cur.days : null}
          previous={periodStats.prev.hasData ? periodStats.prev.days : null}
          prevLabel={periodStats.prevLabel}
          mode={periodMode}
          format={(v) => `${Math.round(v)}`}
        />
        <PeriodKPI
          label="累计时长"
          current={periodStats.cur.hasData ? periodStats.cur.mins : null}
          previous={periodStats.prev.hasData ? periodStats.prev.mins : null}
          prevLabel={periodStats.prevLabel}
          mode={periodMode}
          format={(v) => formatDurationLabel(Math.round(v))}
          // 时长用整数比较(分钟)
        />
        <PeriodKPI
          label="平均强度"
          prefix="★ "
          current={periodStats.cur.hasData ? periodStats.cur.avgIntensity : null}
          previous={periodStats.prev.hasData ? periodStats.prev.avgIntensity : null}
          prevLabel={periodStats.prevLabel}
          mode={periodMode}
          format={(v) => v.toFixed(1)}
          decimals={1}
        />
      </View>

      <Card style={{ marginBottom: spacing.lg, borderColor: isHighRisk ? colors.danger : colors.border }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1, paddingRight: spacing.md }}>
            <Text style={{ color: colors.text, fontWeight: '700', fontSize: font.h3 }}>运动伤病预警 (A:C 比值)</Text>
            <Text style={{ color: colors.textDim, fontSize: font.small, marginTop: 4 }}>
              {acReady
                ? '近7天负荷 / 近28天平均负荷 (安全区间 0.8-1.3)'
                : '数据样本不足，至少累计 3 天 / 60 分钟训练后开始监测'}
            </Text>
          </View>
          <Text
            style={{
              color: !acReady ? colors.textDim : isHighRisk ? colors.danger : colors.primary,
              fontSize: 32,
              fontWeight: '800',
            }}
          >
            {acRatio}
          </Text>
        </View>
        {isHighRisk && (
          <Text style={{ color: colors.danger, fontSize: font.small, marginTop: spacing.md }}>
            ⚠️ 警告：你最近一周的训练量增加过快，拉伤或劳损的风险极高！建议这周加入更多"恢复"项。
          </Text>
        )}
      </Card>

      <Section title="最近 30 天训练分布">
        <Card>
          {categoryStats.totalLogs === 0 ? (
            <Text style={styles.empty}>近 30 天还没有打卡记录</Text>
          ) : (
            categoryStats.ranked.map((c) => (
              <View key={c.name} style={styles.barRow}>
                <Text style={styles.barName}>{c.name}</Text>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${categoryStats.max > 0 ? (c.count / categoryStats.max) * 100 : 0}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.barCount}>{c.count}</Text>
              </View>
            ))
          )}
        </Card>
      </Section>

      <Section title="最近 90 天训练热力图">
        <Card style={{ padding: spacing.md }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: 4 }}>
              {columns.map((col, cIdx) => (
                <View key={cIdx} style={{ gap: 4 }}>
                  {col.map((cell) => {
                    const bg = cell.level === 0 ? colors.cardAlt :
                               cell.level === 1 ? '#044D29' :
                               cell.level === 2 ? '#1E824C' : '#2ECC71';
                    return (
                      <View
                        key={cell.date}
                        style={[styles.heatCell, { backgroundColor: bg }]}
                      />
                    );
                  })}
                </View>
              ))}
            </View>
          </ScrollView>
          <View style={styles.heatLegend}>
            <Text style={styles.heatLegendText}>少</Text>
            <View style={[styles.heatCell, { backgroundColor: colors.cardAlt }]} />
            <View style={[styles.heatCell, { backgroundColor: '#044D29' }]} />
            <View style={[styles.heatCell, { backgroundColor: '#1E824C' }]} />
            <View style={[styles.heatCell, { backgroundColor: '#2ECC71' }]} />
            <Text style={styles.heatLegendText}>多</Text>
          </View>
        </Card>
      </Section>

      <Section title="历史记录">
        {logs.length === 0 ? (
          <Card>
            <Text style={styles.empty}>暂无记录</Text>
          </Card>
        ) : (
          <>
            {visibleLogs.map((l) => (
              <Card key={l.id} style={{ marginBottom: spacing.sm }}>
                <View style={styles.logRow}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.logDate}>{l.date}</Text>
                      {l.match_result === 'win' && <Text style={{ fontSize: 12 }}>🏆</Text>}
                      {l.match_result === 'loss' && <Text style={{ fontSize: 12 }}>💔</Text>}
                    </View>
                    <Text style={styles.logCat}>
                      {l.categories.join('、') || '综合'}
                      {l.opponent ? ` (vs ${l.opponent})` : ''}
                    </Text>
                    {l.note ? <Text style={styles.logNote}>📝 {l.note}</Text> : null}
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.logMins}>{l.duration_min} 分钟</Text>
                    <Text style={styles.logStar}>
                      {'★'.repeat(l.intensity)}
                      {'☆'.repeat(5 - l.intensity)}
                    </Text>
                  </View>
                </View>
              </Card>
            ))}
            {logs.length > HISTORY_INITIAL && (
              <Pressable
                onPress={() => setShowAllHistory((v) => !v)}
                style={({ pressed }) => [styles.expandBtn, { opacity: pressed ? 0.7 : 1 }]}
              >
                <Text style={styles.expandText}>
                  {showAllHistory ? '收起' : `查看全部 ${logs.length} 条 →`}
                </Text>
              </Pressable>
            )}
          </>
        )}
      </Section>
    </Screen>
  );
}

function PeriodKPI({
  label,
  prefix,
  unit,
  current,
  previous,
  prevLabel,
  mode,
  format,
  decimals = 0,
}: {
  label: string;
  prefix?: string;
  unit?: string;
  /** null = 当期无数据 */
  current: number | null;
  /** null = 上一期无记录 */
  previous: number | null;
  prevLabel: string;
  mode: PeriodMode;
  format: (v: number) => string;
  decimals?: number;
}) {
  const hasCurrent = current !== null;

  // 同比箭头:仅在 prev 有效且非零、且 current 不等 prev 时显示
  let trend: 'up' | 'down' | null = null;
  if (hasCurrent && previous !== null && previous > 0) {
    if (current! > previous) trend = 'up';
    else if (current! < previous) trend = 'down';
  }

  // 副行
  let subline: string;
  if (previous === null) {
    subline = mode === 'week' ? '上周无记录' : '上月无记录';
  } else {
    subline = `${prevLabel} ${format(previous)}${unit ?? ''}`;
  }
  if (!hasCurrent) {
    subline = mode === 'week' ? '本周尚未打卡' : '本月尚未打卡';
  }

  return (
    <Card style={styles.kpi}>
      <View style={styles.kpiValueRow}>
        {hasCurrent ? (
          <AnimatedNumber
            value={current!}
            format={format}
            prefix={prefix}
            decimals={decimals}
            style={styles.kpiValue}
          />
        ) : (
          <Text style={[styles.kpiValue, { color: colors.textDim }]}>—</Text>
        )}
        {hasCurrent && unit ? <Text style={styles.kpiUnit}>{unit}</Text> : null}
        {trend && (
          <Text
            style={[
              styles.kpiTrend,
              { color: trend === 'up' ? colors.primary : colors.danger },
            ]}
          >
            {trend === 'up' ? '▲' : '▼'}
          </Text>
        )}
      </View>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={styles.kpiSub}>{subline}</Text>
    </Card>
  );
}

/**
 * 主数值跳数动画:reanimated SharedValue 走 withTiming 400ms,
 * UI 线程把 .text 写进 AnimatedTextInput,避免 setState 高频 re-render。
 */
function AnimatedNumber({
  value,
  format,
  prefix,
  decimals,
  style,
}: {
  value: number;
  format: (v: number) => string;
  prefix?: string;
  decimals: number;
  style: object;
}) {
  const sv = useSharedValue(value);
  useEffect(() => {
    sv.value = withTiming(value, { duration: 400, easing: Easing.out(Easing.cubic) });
    // 仅 value 变化时触发;sv 引用稳定,无需进 deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const animatedProps = useAnimatedProps(() => {
    const v = decimals > 0 ? sv.value : Math.round(sv.value);
    return { text: `${prefix ?? ''}${format(v)}`, defaultValue: `${prefix ?? ''}${format(v)}` } as Partial<{ text: string; defaultValue: string }>;
  });

  return (
    <AnimatedTextInput
      editable={false}
      // 关闭可交互,使其在视觉上等同于 <Text>
      underlineColorAndroid="transparent"
      value={undefined}
      defaultValue={`${prefix ?? ''}${format(decimals > 0 ? value : Math.round(value))}`}
      style={[styles.kpiValueInput, style]}
      animatedProps={animatedProps}
    />
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: font.h1, fontWeight: '700', marginBottom: spacing.lg },
  // 时间舱:Pill 切换条 + 右侧 streak 小字
  periodBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  periodPills: { flexDirection: 'row', gap: spacing.sm },
  periodPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  streakInline: { color: colors.warn, fontSize: font.small, fontWeight: '600' },
  kpiRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  kpi: { flex: 1, alignItems: 'center', padding: spacing.md },
  kpiValue: { color: colors.text, fontSize: font.h2, fontWeight: '800' },
  // 主数值 + 单位 + 三角 同一行
  kpiValueRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  // AnimatedTextInput 默认有 padding,需要清零让它视觉对齐 <Text>
  kpiValueInput: { padding: 0, margin: 0, textAlign: 'center', minWidth: 32 },
  kpiUnit: { color: colors.textDim, fontSize: font.small, marginLeft: 1 },
  // 三角箭头:12px,主数值右侧
  kpiTrend: { fontSize: 12, marginLeft: 4, fontWeight: '700' },
  kpiLabel: { color: colors.textDim, fontSize: font.tiny, marginTop: 4 },
  kpiSub: { color: colors.textDim, fontSize: font.tiny, marginTop: 2, opacity: 0.85 },
  empty: { color: colors.textDim, textAlign: 'center', paddingVertical: spacing.lg },
  logRow: { flexDirection: 'row', alignItems: 'center' },
  logDate: { color: colors.text, fontWeight: '600' },
  logCat: { color: colors.textDim, fontSize: font.small, marginTop: 2 },
  logNote: { color: colors.textDim, fontSize: font.small, marginTop: 4 },
  logMins: { color: colors.primary, fontWeight: '700', fontSize: font.body },
  logStar: { color: colors.warn, fontSize: font.small, marginTop: 2 },
  heatCell: { width: 14, height: 14, borderRadius: 3 },
  heatLegend: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 4, marginTop: spacing.md },
  heatLegendText: { color: colors.textDim, fontSize: font.tiny, marginHorizontal: 4 },
  // 类别分布横条图
  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, gap: spacing.sm },
  barName: { color: colors.text, fontSize: font.small, fontWeight: '600', width: 56 },
  barTrack: { flex: 1, height: 8, backgroundColor: colors.cardAlt, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 4 },
  barCount: { color: colors.textDim, fontSize: font.small, width: 28, textAlign: 'right' },
  // 历史记录展开按钮
  expandBtn: { paddingVertical: spacing.md, alignItems: 'center' },
  expandText: { color: colors.primary, fontSize: font.small, fontWeight: '600' },
});

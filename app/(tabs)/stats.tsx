import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { useAnimatedProps, useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import dayjs from 'dayjs';
import { router } from 'expo-router';
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

// 历史区筛选 Pill 类型
type HistoryFilter = 'all' | 'training' | 'match' | 'high' | 'note';

import { getIntensityMeta } from '@/data/intensity';

const WEEK_CN = ['日', '一', '二', '三', '四', '五', '六'];

// 月份分组 key -> 用于显示的标题(当年只显示 "M 月",跨年显示 "YYYY 年 M 月")
function formatMonthTitle(key: string): string {
  // key: YYYY-MM
  const d = dayjs(key + '-01');
  if (d.year() === dayjs().year()) return `${d.month() + 1} 月`;
  return `${d.year()} 年 ${d.month() + 1} 月`;
}

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
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('all');

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
  const acRatioNum = acReady ? Number(acRatio) : null;
  const isHighRisk = acReady && Number(acRatio) > 1.5;

  // v0.18.0 — 私教信号灯：4 档语义 + 副标题动态文案 + 数值色
  // 不足 < 0.8 / 理想 0.8-1.3 / 偏高 1.3-1.5 / 高危 > 1.5
  const acZone: 'low' | 'ok' | 'high' | 'danger' | 'pending' = !acReady
    ? 'pending'
    : acRatioNum! < 0.8
    ? 'low'
    : acRatioNum! <= 1.3
    ? 'ok'
    : acRatioNum! <= 1.5
    ? 'high'
    : 'danger';
  const acHint =
    acZone === 'pending'
      ? '累计 3 天 / 60 分钟训练后，开始为你监测受伤风险'
      : acZone === 'low'
      ? '最近练得偏少，状态可能有点凉'
      : acZone === 'ok'
      ? '节奏稳定，处于最佳训练区间'
      : acZone === 'high'
      ? '训练强度上来了，注意收着练'
      : '训练量激增，拉伤/劳损风险极高';
  const acValueColor =
    acZone === 'pending'
      ? colors.textDim
      : acZone === 'low'
      ? colors.textDim
      : acZone === 'ok'
      ? colors.primary
      : acZone === 'high'
      ? colors.warn
      : colors.danger;
  // 信号灯条：游标位置 = min(ratio, 2.0) / 2.0；4 段宽度 35/30/20/15
  const acCursorPct = acRatioNum !== null ? Math.min(Math.max(acRatioNum, 0), 2.0) / 2.0 : 0;

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

  // 历史区筛选(只影响历史区,不影响 KPI/信号灯/分布/热力图)
  const filteredLogs = useMemo(() => {
    switch (historyFilter) {
      case 'training':
        return logs.filter((l) => !l.match_result);
      case 'match':
        return logs.filter((l) => !!l.match_result);
      case 'high':
        return logs.filter((l) => l.intensity >= 4);
      case 'note':
        return logs.filter((l) => l.note != null && l.note.trim().length > 0);
      case 'all':
      default:
        return logs;
    }
  }, [logs, historyFilter]);

  const visibleLogs = showAllHistory ? filteredLogs : filteredLogs.slice(0, HISTORY_INITIAL);

  // 按 YYYY-MM 分组 visibleLogs;保留时序(logs 已按 date desc),组内仍 desc
  const groupedHistory = useMemo(() => {
    const groups: { key: string; items: TrainingLog[]; mins: number }[] = [];
    const indexMap = new Map<string, number>();
    visibleLogs.forEach((l) => {
      const key = dayjs(l.date).format('YYYY-MM');
      let idx = indexMap.get(key);
      if (idx === undefined) {
        idx = groups.length;
        indexMap.set(key, idx);
        groups.push({ key, items: [], mins: 0 });
      }
      groups[idx].items.push(l);
      groups[idx].mins += l.duration_min;
    });
    return groups;
  }, [visibleLogs]);

  // 切换筛选时重置展开状态
  const onSwitchFilter = (f: HistoryFilter) => {
    if (historyFilter === f) return;
    vibrateLight();
    setHistoryFilter(f);
    setShowAllHistory(false);
  };

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
          prefix="🔥 "
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
            <Text style={{ color: colors.text, fontWeight: '700', fontSize: font.h3 }}>🚦 训练负荷信号灯</Text>
            <Text style={{ color: colors.textDim, fontSize: font.small, marginTop: 4 }}>
              {acHint}
            </Text>
          </View>
          <Text
            style={{
              color: acValueColor,
              fontSize: 32,
              fontWeight: '800',
            }}
          >
            {acRatio}
          </Text>
        </View>

        {/* v0.18 信号灯条：4 段语义色 + 游标三角 */}
        <View style={{ marginTop: spacing.md, opacity: acZone === 'pending' ? 0.3 : 1 }}>
          {acZone !== 'pending' && (
            <View style={{ height: 10, position: 'relative', marginBottom: 2 }}>
              <Text
                style={{
                  position: 'absolute',
                  left: `${acCursorPct * 100}%`,
                  marginLeft: -6,
                  color: colors.text,
                  fontSize: 10,
                  lineHeight: 10,
                }}
              >
                ▼
              </Text>
            </View>
          )}
          <View style={{ flexDirection: 'row', height: 6, borderRadius: 3, overflow: 'hidden' }}>
            <View style={{ flex: 35, backgroundColor: colors.textDim }} />
            <View style={{ flex: 30, backgroundColor: colors.primary }} />
            <View style={{ flex: 20, backgroundColor: colors.warn }} />
            <View style={{ flex: 15, backgroundColor: colors.danger }} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
            <Text style={{ color: colors.textDim, fontSize: font.tiny }}>0</Text>
            <Text style={{ color: colors.textDim, fontSize: font.tiny }}>0.8</Text>
            <Text style={{ color: colors.textDim, fontSize: font.tiny }}>1.3</Text>
            <Text style={{ color: colors.textDim, fontSize: font.tiny }}>1.5</Text>
            <Text style={{ color: colors.textDim, fontSize: font.tiny }}>2.0+</Text>
          </View>
        </View>

        {isHighRisk && (
          <Text style={{ color: colors.danger, fontSize: font.small, marginTop: spacing.md }}>
            🔥 建议本周减量并增加恢复项，给身体一个缓冲。
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
            {/* 轻量筛选条:横向 Pill,复用 periodPill 样式 */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRow}
            >
              {(
                [
                  { key: 'all', label: '全部' },
                  { key: 'training', label: '🏸 训练' },
                  { key: 'match', label: '⚔️ 实战' },
                  { key: 'high', label: '🔥 高强度' },
                  { key: 'note', label: '📝 有笔记' },
                ] as { key: HistoryFilter; label: string }[]
              ).map((f) => {
                const active = historyFilter === f.key;
                return (
                  <Pressable
                    key={f.key}
                    onPress={() => onSwitchFilter(f.key)}
                    style={[
                      styles.periodPill,
                      active && { backgroundColor: colors.primary, borderColor: colors.primary },
                    ]}
                  >
                    <Text
                      style={{
                        color: active ? '#fff' : colors.textDim,
                        fontWeight: '600',
                        fontSize: font.small,
                      }}
                    >
                      {f.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {filteredLogs.length === 0 ? (
              <View style={styles.filterEmpty}>
                <Text style={styles.filterEmptyMain}>筛选后没有匹配的训练记录</Text>
                <Text style={styles.filterEmptySub}>点上面 "全部" 重置筛选</Text>
              </View>
            ) : (
              <>
                {groupedHistory.map((group) => (
                  <View key={group.key}>
                    {/* 月份子标题(非 Card) */}
                    <View style={styles.monthHeader}>
                      <Text style={styles.monthTitle}>{formatMonthTitle(group.key)}</Text>
                      <Text style={styles.monthStat}>
                        {group.items.length} 次 · {formatDurationLabel(group.mins)}
                      </Text>
                    </View>
                    <View style={styles.monthDivider} />
                    {group.items.map((l) => {
                      const md = dayjs(l.date).format('MM-DD');
                      const weekday = WEEK_CN[dayjs(l.date).day()];
                      const cats = l.categories.length > 0 ? l.categories : ['综合'];
                      const visibleCats = cats.slice(0, 3);
                      const overflowCats = cats.length - visibleCats.length;
                      const hasMatch = !!l.match_result;
                      const hasOpponent = !!l.opponent;
                      const matchEmoji =
                        l.match_result === 'win'
                          ? '🏆'
                          : l.match_result === 'loss'
                          ? '💔'
                          : l.match_result === 'draw'
                          ? '🤝'
                          : '';
                      const intensityMeta = getIntensityMeta(l.intensity);
                      return (
                        <Pressable
                          key={l.id}
                          onPress={() => {
                            vibrateLight();
                            router.push({ pathname: '/log/[id]', params: { id: String(l.id) } });
                          }}
                          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                        >
                          <Card style={{ marginBottom: spacing.sm }}>
                            <View style={styles.logRow}>
                              <View style={{ flex: 1 }}>
                                {/* 第 1 行:日期 + 周X */}
                                <View style={styles.logHeadRow}>
                                  <Text style={styles.logDate}>{md}</Text>
                                  <Text style={styles.logWeekday}>周{weekday}</Text>
                                </View>
                                {/* 第 2 行:分类 chip */}
                                <View style={styles.chipRow}>
                                  {visibleCats.map((c) => (
                                    <View key={c} style={styles.chip}>
                                      <Text style={styles.chipText}>{c}</Text>
                                    </View>
                                  ))}
                                  {overflowCats > 0 && (
                                    <View style={styles.chip}>
                                      <Text style={styles.chipText}>+{overflowCats}</Text>
                                    </View>
                                  )}
                                </View>
                                {/* 第 3 行:对手/结果(条件) */}
                                {(hasMatch || hasOpponent) && (
                                  <Text style={styles.logMeta}>
                                    ⚔️ vs {l.opponent ?? ''}
                                    {matchEmoji ? ` ${matchEmoji}` : ''}
                                  </Text>
                                )}
                                {/* 第 4 行:note(条件,单行截断) */}
                                {l.note ? (
                                  <Text style={styles.logMeta} numberOfLines={1}>
                                    📝 {l.note}
                                  </Text>
                                ) : null}
                              </View>
                              {/* 右侧指标区 */}
                              <View style={{ alignItems: 'flex-end' }}>
                                <Text style={styles.logMins}>{l.duration_min} 分钟</Text>
                                <View style={styles.dotRow}>
                                  {[1, 2, 3, 4, 5].map((i) => (
                                    <View
                                      key={i}
                                      style={[
                                        styles.dot,
                                        {
                                          backgroundColor:
                                            i <= l.intensity ? colors.primary : colors.cardAlt,
                                        },
                                      ]}
                                    />
                                  ))}
                                </View>
                                <Text style={styles.intensityLabel}>
                                  {intensityMeta.emoji} {intensityMeta.label}
                                </Text>
                              </View>
                            </View>
                          </Card>
                        </Pressable>
                      );
                    })}
                  </View>
                ))}
                {filteredLogs.length > HISTORY_INITIAL && (
                  <Pressable
                    onPress={() => setShowAllHistory((v) => !v)}
                    style={({ pressed }) => [styles.expandBtn, { opacity: pressed ? 0.7 : 1 }]}
                  >
                    <Text style={styles.expandText}>
                      {showAllHistory ? '收起' : `查看全部 ${filteredLogs.length} 条 →`}
                    </Text>
                  </Pressable>
                )}
              </>
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
  logHeadRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  logDate: { color: colors.text, fontSize: font.body, fontWeight: '700' },
  logWeekday: { color: colors.textDim, fontSize: font.tiny },
  logMeta: { color: colors.textDim, fontSize: font.tiny, marginTop: 4 },
  logMins: { color: colors.primary, fontWeight: '700', fontSize: font.body },
  // 分类 chip 平铺
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  chip: {
    backgroundColor: colors.cardAlt,
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  chipText: { color: colors.textDim, fontSize: font.tiny },
  // 5 段强度 dot
  dotRow: { flexDirection: 'row', gap: 3, marginTop: 4 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  intensityLabel: { color: colors.textDim, fontSize: font.tiny, marginTop: 2 },
  // 月份子标题(非 Card)
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  monthTitle: { color: colors.text, fontSize: font.small, fontWeight: '700' },
  monthStat: { color: colors.textDim, fontSize: font.tiny },
  monthDivider: { height: 1, backgroundColor: colors.border, marginTop: spacing.xs, marginBottom: spacing.sm },
  // 历史筛选条
  filterRow: { flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.xs, paddingRight: spacing.md },
  filterEmpty: { paddingVertical: spacing.lg, alignItems: 'center' },
  filterEmptyMain: { color: colors.text, fontSize: font.small, fontWeight: '600' },
  filterEmptySub: { color: colors.textDim, fontSize: font.tiny, marginTop: 4 },
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

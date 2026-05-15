/**
 * 周计划 7 天总览卡（v0.15.0）
 * - 7 列等宽，顺序 0..6（日一二三四五六）与 WEEK_SHORT 对齐
 * - 点格筛选；再点同一格取消
 * - 数据派生由父组件传入 dayStats，本组件保持纯展示
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/Card';
import { colors, font, radius, spacing } from '@/theme/tokens';
import { vibrateLight } from '@/utils/haptics';

const WEEK_SHORT = ['日', '一', '二', '三', '四', '五', '六'];

export type DayStat = {
  count: number;
  mins: number;
};

type Props = {
  /** 长度固定 7，索引 0..6 对应日..六 */
  dayStats: DayStat[];
  /** 未分配 weekday 的模块数量 */
  unassignedCount: number;
  selectedWeekday: number | null;
  onSelect: (wd: number | null) => void;
};

function fmtCount(n: number): string {
  return n >= 10 ? '9+项' : `${n}项`;
}

function fmtMins(m: number): string {
  return m >= 100 ? '99m+' : `${m}m`;
}

function intensityColor(mins: number): string {
  if (mins >= 120) return colors.danger;
  if (mins >= 60) return colors.warn;
  return colors.primary;
}

export function WeekOverviewCard({ dayStats, unassignedCount, selectedWeekday, onSelect }: Props) {
  const maxMins = Math.max(1, ...dayStats.map((d) => d.mins));

  return (
    <Card style={{ marginBottom: spacing.md }}>
      <View style={styles.row}>
        {dayStats.map((stat, idx) => {
          const isSelected = selectedWeekday === idx;
          const isEmpty = stat.count === 0;
          const barPct = stat.mins > 0 ? Math.max(4, (stat.mins / maxMins) * 100) : 0;
          return (
            <Pressable
              key={idx}
              onPress={() => {
                vibrateLight();
                onSelect(isSelected ? null : idx);
              }}
              style={[
                styles.cell,
                isSelected && styles.cellSelected,
                isEmpty && { opacity: 0.4 },
              ]}
            >
              <Text style={styles.label}>{WEEK_SHORT[idx]}</Text>
              {isEmpty ? (
                <Text style={styles.body}>—</Text>
              ) : (
                <Text style={styles.body} numberOfLines={1}>
                  {fmtCount(stat.count)}·{fmtMins(stat.mins)}
                </Text>
              )}
              <View style={styles.barTrack}>
                {stat.mins > 0 && (
                  <View
                    style={[
                      styles.barFill,
                      { width: `${barPct}%`, backgroundColor: intensityColor(stat.mins) },
                    ]}
                  />
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
      {unassignedCount > 0 && (
        <Text style={styles.warnLine}>⚠ {unassignedCount} 个模块未分配星期，本周不会出现</Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 4 },
  cell: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: 2,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: 'transparent',
    alignItems: 'center',
    gap: 4,
  },
  cellSelected: {
    backgroundColor: colors.cardAlt,
    borderColor: colors.primary,
  },
  label: { color: colors.textDim, fontSize: font.small },
  body: { color: colors.text, fontSize: font.small },
  barTrack: {
    width: '100%',
    height: 1,
    borderRadius: 0.5,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  barFill: { height: 1, borderRadius: 0.5 },
  warnLine: {
    color: colors.warn,
    fontSize: font.tiny,
    marginTop: spacing.sm,
  },
});

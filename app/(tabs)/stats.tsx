import { useEffect, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import dayjs from 'dayjs';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { Section } from '@/components/Section';
import { colors, font, spacing, radius } from '@/theme/tokens';
import {
  getStreak,
  listTrainingLogs,
  TrainingLog,
} from '@/db/trainingLogs';

export default function StatsScreen() {
  const [streak, setStreak] = useState(0);
  const [logs, setLogs] = useState<TrainingLog[]>([]);

  useEffect(() => {
    (async () => {
      setStreak(await getStreak());
      setLogs(await listTrainingLogs(100)); // 拿多一点数据用于热力图
    })();
  }, []);

  const trainedDays = new Set(logs.map(l => l.date)).size;
  const totalMins = logs.reduce((a, b) => a + b.duration_min, 0);

  // 计算热力图数据 (最近 90 天)
  const heatmapDays = 90;
  const heatData: { date: string, mins: number, level: number }[] = [];
  const logMap = new Map();
  logs.forEach(l => {
    logMap.set(l.date, (logMap.get(l.date) || 0) + l.duration_min);
  });

  for (let i = heatmapDays - 1; i >= 0; i--) {
    const d = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
    const mins = logMap.get(d) || 0;
    let level = 0; // 0: 没练
    if (mins > 0 && mins <= 20) level = 1;      // 浅绿
    else if (mins > 20 && mins <= 60) level = 2; // 中绿
    else if (mins > 60) level = 3;               // 深绿
    heatData.push({ date: d, mins, level });
  }

  // 把热力图切成 7 行一列的形式 (按星期)
  const columns: typeof heatData[] = [];
  let currentCol: typeof heatData = [];
  
  heatData.forEach((item, index) => {
    // 简单按每 7 天一切列
    currentCol.push(item);
    if (currentCol.length === 7 || index === heatData.length - 1) {
      columns.push(currentCol);
      currentCol = [];
    }
  });

  // 计算 A:C Ratio (Acute:Chronic Workload Ratio)
  // 急性负荷: 最近 7 天时长总和
  const acuteLoad = heatData.slice(-7).reduce((a, b) => a + b.mins, 0);
  // 慢性负荷: 最近 28 天日均时长 * 7
  const last28 = heatData.slice(-28);
  const chronicLoad = last28.reduce((a, b) => a + b.mins, 0) / 4;
  const last28Total = last28.reduce((a, b) => a + b.mins, 0);
  const last28Days = last28.filter((d) => d.mins > 0).length;
  // 样本不足：累计 < 60 分钟 或 训练 < 3 天，不做监测（避免新用户被误报"高风险"）
  const acReady = last28Total >= 60 && last28Days >= 3 && chronicLoad > 0;
  const acRatio = acReady ? (acuteLoad / chronicLoad).toFixed(2) : '—';
  const isHighRisk = acReady && Number(acRatio) > 1.5;

  return (
    <Screen>
      <Text style={styles.title}>训练记录</Text>

      <View style={styles.kpiRow}>
        <KPI value={`${streak}`} label="🔥 连续天数" />
        <KPI value={`${trainedDays}`} label="累计打卡(天)" />
        <KPI value={`${Math.floor(totalMins / 60)}h`} label="累计时长" />
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
          logs.slice(0, 10).map((l) => (
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
          ))
        )}
      </Section>
    </Screen>
  );
}

function KPI({ value, label }: { value: string; label: string }) {
  return (
    <Card style={styles.kpi}>
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: font.h1, fontWeight: '700', marginBottom: spacing.lg },
  kpiRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  kpi: { flex: 1, alignItems: 'center', padding: spacing.md },
  kpiValue: { color: colors.text, fontSize: font.h2, fontWeight: '800' },
  kpiLabel: { color: colors.textDim, fontSize: font.tiny, marginTop: 4 },
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
});

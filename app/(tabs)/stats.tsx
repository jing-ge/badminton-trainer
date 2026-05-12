import { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { Section } from '@/components/Section';
import { colors, font, spacing } from '@/theme/tokens';
import {
  getDailyMinutes,
  getStreak,
  listTrainingLogs,
  TrainingLog,
} from '@/db/trainingLogs';

export default function StatsScreen() {
  const [daily, setDaily] = useState<{ date: string; mins: number }[]>([]);
  const [streak, setStreak] = useState(0);
  const [logs, setLogs] = useState<TrainingLog[]>([]);

  useEffect(() => {
    (async () => {
      setDaily(await getDailyMinutes(14));
      setStreak(await getStreak());
      setLogs(await listTrainingLogs(20));
    })();
  }, []);

  const total14 = daily.reduce((a, b) => a + b.mins, 0);
  const trainedDays = daily.filter((d) => d.mins > 0).length;
  const w = Dimensions.get('window').width - spacing.lg * 2;

  const labels = daily.map((d, i) => (i % 2 === 0 ? d.date.slice(5) : ''));
  const data = daily.map((d) => d.mins);

  return (
    <Screen>
      <Text style={styles.title}>训练记录</Text>

      <View style={styles.kpiRow}>
        <KPI value={`${streak}`} label="🔥 连续天数" />
        <KPI value={`${trainedDays}`} label="近 14 天训练" />
        <KPI value={`${total14}`} label="近 14 天分钟" />
      </View>

      <Section title="近 14 天训练时长">
        <Card>
          {data.some((d) => d > 0) ? (
            <LineChart
              data={{ labels, datasets: [{ data }] }}
              width={w - spacing.lg * 2}
              height={200}
              yAxisSuffix="m"
              chartConfig={{
                backgroundGradientFrom: colors.card,
                backgroundGradientTo: colors.card,
                decimalPlaces: 0,
                color: (o = 1) => `rgba(16, 185, 129, ${o})`,
                labelColor: () => colors.textDim,
                propsForDots: { r: '3', strokeWidth: '1', stroke: colors.primary },
              }}
              bezier
              style={{ marginVertical: 4, borderRadius: 8 }}
            />
          ) : (
            <Text style={styles.empty}>还没有训练记录，去打卡吧</Text>
          )}
        </Card>
      </Section>

      <Section title="历史记录">
        {logs.length === 0 ? (
          <Card>
            <Text style={styles.empty}>暂无记录</Text>
          </Card>
        ) : (
          logs.map((l) => (
            <Card key={l.id} style={{ marginBottom: spacing.sm }}>
              <View style={styles.logRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.logDate}>{l.date}</Text>
                  <Text style={styles.logCat}>{l.categories.join('、') || '综合'}</Text>
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
});

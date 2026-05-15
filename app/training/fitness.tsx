import { StyleSheet, Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { colors, font, spacing } from '@/theme/tokens';
import { defaultFitnessPlan } from '@/data/presets';

export default function FitnessScreen() {
  const router = useRouter();
  const plan = defaultFitnessPlan;

  return (
    <Screen>
      <Text style={styles.title}>💪 体能训练专项</Text>
      <Text style={styles.sub}>
        选择你想练的专项，直接进入沉浸式语音跟练。
      </Text>

      <View style={{ marginTop: spacing.lg }}>
        {plan.modules.map((m) => {
          const totalMin = m.items.reduce((a, b) => a + b.duration_min, 0);
          return (
            <Pressable
              key={m.id}
              onPress={() => {
                // 通过传 plan_id + mid 让 run.tsx 从默认体能计划里加载该模块
                router.push({ pathname: '/training/run', params: { plan_id: plan.id, mid: m.id } });
              }}
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            >
              <Card style={{ marginBottom: spacing.md }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modName}>{m.name}</Text>
                    <Text style={styles.modFocus}>{m.focus}</Text>
                    <Text style={styles.modMeta}>
                      包含 {m.items.length} 组动作 · 共 {totalMin} 分钟
                    </Text>
                  </View>
                  <Text style={{ color: colors.primary, fontSize: 32 }}>▶</Text>
                </View>
              </Card>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: font.h1, fontWeight: '700' },
  sub: { color: colors.textDim, marginTop: 4, fontSize: font.body },
  modName: { color: colors.text, fontSize: font.h3, fontWeight: '700' },
  modFocus: { color: colors.textDim, fontSize: font.small, marginTop: 4 },
  modMeta: { color: colors.primary, fontSize: font.small, marginTop: 8 },
});

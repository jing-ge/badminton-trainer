import { StyleSheet, Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { colors, font, spacing, radius } from '@/theme/tokens';
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
                // 点击后直接带着这个模块的 ID，进入我们写的沉浸式训练器 run.tsx
                // 注意：为了让 run.tsx 能从 plan.modules 里找到，我们需要传 plan_id 和 module_id 进去，
                // 但 run.tsx 现在默认从 activePlan 找 module，所以我们需要把 activePlan 暂时存一下或者把 item 直接传过去。
                // 为了简单，因为 defaultFitnessPlan 也是 defaultPlans 之一，可以在 run.tsx 里做支持。
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

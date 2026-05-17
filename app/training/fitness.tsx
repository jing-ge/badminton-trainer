import { StyleSheet, Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import dayjs from 'dayjs';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { colors, font, spacing } from '@/theme/tokens';
import { defaultFitnessPlan } from '@/data/presets';
import { vibrateLight } from '@/utils/haptics';
import type { TrainingItem, TrainingModule } from '@/data/planTypes';

const WEEKDAY_NAMES = ['日', '一', '二', '三', '四', '五', '六'] as const;

// intensity 字段当前 TrainingItem 上不存在，预留软读取，将来加上即可生效
function intensityOf(it: TrainingItem): number {
  return (it as TrainingItem & { intensity?: number }).intensity ?? 1;
}

function difficultyLevel(m: TrainingModule): 1 | 2 | 3 {
  const score = m.items.reduce((s, it) => s + it.duration_min * intensityOf(it), 0);
  if (score > 30) return 3;
  if (score >= 15) return 2;
  return 1;
}

function difficultyColor(level: 1 | 2 | 3): string {
  if (level === 3) return colors.danger;
  if (level === 2) return colors.warn;
  return colors.primary;
}

export default function FitnessScreen() {
  const router = useRouter();
  const plan = defaultFitnessPlan;
  const modules = plan.modules;

  const showHero = modules.length >= 2;
  const recommended = showHero ? modules[dayjs().day() % modules.length] : null;

  const openModule = (mid: string) => {
    router.push({ pathname: '/training/run', params: { plan_id: plan.id, mid } });
  };

  return (
    <Screen>
      <Text style={styles.title}>💪 体能训练专项</Text>
      <Text style={styles.sub}>
        {showHero ? '🎯 今日推荐已点亮，也可自由挑一项' : '选择你想练的专项，直接进入沉浸式语音跟练。'}
      </Text>

      {recommended && (
        <Pressable
          onPress={() => {
            vibrateLight();
            openModule(recommended.id);
          }}
          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1, marginTop: spacing.lg }]}
        >
          <Card style={{ borderColor: colors.accent }}>
            <Text style={styles.heroTitle}>🎯 今日推荐</Text>
            <Text style={styles.heroSub}>
              根据星期{WEEKDAY_NAMES[dayjs().day()]}，今天建议练 {recommended.name}
            </Text>
          </Card>
        </Pressable>
      )}

      <View style={{ marginTop: spacing.lg }}>
        {modules.map((m) => {
          const totalMin = m.items.reduce((a, b) => a + b.duration_min, 0);
          const empty = m.items.length === 0;
          const level = empty ? 1 : difficultyLevel(m);
          const dColor = difficultyColor(level);

          return (
            <Pressable
              key={m.id}
              disabled={empty}
              onPress={() => {
                vibrateLight();
                openModule(m.id);
              }}
              style={({ pressed }) => [{ opacity: empty ? 0.5 : pressed ? 0.7 : 1 }]}
            >
              <Card style={{ marginBottom: spacing.md, borderColor: empty ? colors.border : dColor }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {/* 左：难度徽章列 */}
                  <View style={styles.badgeCol}>
                    {Array.from({ length: level }).map((_, i) => (
                      <Text key={i} style={[styles.badge, { color: dColor }]}>🔥</Text>
                    ))}
                  </View>

                  {/* 中：主信息 */}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modName}>{m.name}</Text>
                    <Text style={styles.modFocus}>{m.focus}</Text>
                    {empty ? (
                      <Text style={styles.modWarn}>⚠️ 模块未配置动作</Text>
                    ) : (
                      <Text style={styles.modMeta}>📦 {m.items.length} 组 · ⏱ {totalMin} 分钟</Text>
                    )}
                  </View>

                  {/* 右：箭头 */}
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
  heroTitle: { color: colors.text, fontSize: font.h2, fontWeight: '700' },
  heroSub: { color: colors.textDim, fontSize: font.small, marginTop: 6 },
  badgeCol: { width: 28, marginRight: spacing.md, alignItems: 'center' },
  badge: { fontSize: 14, lineHeight: 18 },
  modName: { color: colors.text, fontSize: font.h3, fontWeight: '700' },
  modFocus: { color: colors.textDim, fontSize: font.small, marginTop: 4 },
  modMeta: { color: colors.primary, fontSize: font.small, marginTop: 8 },
  modWarn: { color: colors.warn, fontSize: font.small, marginTop: 8 },
});

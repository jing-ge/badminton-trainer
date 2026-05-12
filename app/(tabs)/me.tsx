import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { colors, font, spacing } from '@/theme/tokens';
import { resetDB } from '@/db';

export default function MeScreen() {
  const router = useRouter();

  const items: { label: string; emoji: string; onPress: () => void; danger?: boolean }[] = [
    { label: '训练日程提醒', emoji: '🔔', onPress: () => router.push('/schedule') },
    { label: '动作识别', emoji: '🎥', onPress: () => router.push('/pose') },
    { label: '录像复盘', emoji: '📹', onPress: () => router.push('/replay') },
    { label: '体能训练', emoji: '💪', onPress: () => router.push('/training/fitness') },
    {
      label: '清空所有数据',
      emoji: '⚠️',
      danger: true,
      onPress: () => {
        Alert.alert('确认清空', '所有训练记录、复盘视频、日程将被删除', [
          { text: '取消', style: 'cancel' },
          {
            text: '清空',
            style: 'destructive',
            onPress: async () => {
              await resetDB();
              Alert.alert('已清空');
            },
          },
        ]);
      },
    },
  ];

  return (
    <Screen>
      <View style={styles.profile}>
        <View style={styles.avatar}>
          <Text style={{ fontSize: 36 }}>🏸</Text>
        </View>
        <Text style={styles.name}>羽毛球训练者</Text>
        <Text style={styles.level}>业余中级</Text>
      </View>

      <View style={{ marginTop: spacing.xl }}>
        {items.map((it) => (
          <Pressable
            key={it.label}
            onPress={it.onPress}
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
          >
            <Card style={{ marginBottom: spacing.sm }}>
              <View style={styles.row}>
                <Text style={{ fontSize: 22 }}>{it.emoji}</Text>
                <Text
                  style={[
                    styles.label,
                    it.danger && { color: colors.danger },
                  ]}
                >
                  {it.label}
                </Text>
                <Text style={{ color: colors.textDim, fontSize: 22 }}>›</Text>
              </View>
            </Card>
          </Pressable>
        ))}
      </View>

      <Text style={styles.foot}>v0.1.0 · 本地存储 · 无网络上传</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  profile: { alignItems: 'center', marginTop: spacing.lg },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  name: { color: colors.text, fontSize: font.h2, fontWeight: '700', marginTop: spacing.md },
  level: { color: colors.primary, marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  label: { color: colors.text, fontSize: font.body, flex: 1 },
  foot: {
    color: colors.textDim,
    fontSize: font.tiny,
    textAlign: 'center',
    marginTop: spacing.xxl,
  },
});

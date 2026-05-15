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
    {
      label: '关于本应用',
      emoji: 'ℹ️',
      onPress: () =>
        Alert.alert(
          '羽毛球私教 v0.1.0',
          [
            '• 完全本地存储，无任何网络上传',
            '• 基于 Expo SDK 52 + React Native 0.76',
            '• 离线可用，地下球馆也能跑',
          ].join('\n'),
        ),
    },
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
        <Pressable
          hitSlop={6}
          onPress={() =>
            Alert.alert('等级设置', '等级编辑功能开发中，敬请期待 ✏️')
          }
          style={({ pressed }) => [styles.levelBadge, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Text style={styles.levelText}>业余中级 ›</Text>
        </Pressable>
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
  levelBadge: {
    marginTop: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  levelText: { color: colors.primary, fontSize: font.small, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  label: { color: colors.text, fontSize: font.body, flex: 1 },
  foot: {
    color: colors.textDim,
    fontSize: font.tiny,
    textAlign: 'center',
    marginTop: spacing.xxl,
  },
});

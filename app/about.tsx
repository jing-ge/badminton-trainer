import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { colors, font, radius, spacing } from '@/theme/tokens';

// v0.30.0：实页化「关于」。技术栈版本号硬编码自 package.json，
// 升级依赖时手动同步即可（频率极低，YAGNI 不做自动读取）。
const EXPO_SDK = '52';
const RN_VERSION = '0.76';

const PRIVACY = [
  '🔒 完全本地 SQLite 存储，0 字节上传',
  '📡 训练时也能离线运行，地下球馆友好',
  '🗑 一键清空数据随时退出，无云端残留',
];

export default function AboutScreen() {
  const router = useRouter();
  const version = Constants.expoConfig?.version ?? '—';

  return (
    <Screen>
      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroEmoji}>🏸</Text>
        <Text style={styles.heroTitle}>沉浸式羽毛球私教</Text>
        <View style={styles.versionRow}>
          <View style={styles.dot} />
          <Text style={styles.version}>v{version}</Text>
        </View>
      </View>

      {/* 隐私承诺 */}
      <Card style={{ marginTop: spacing.xl }}>
        <Text style={styles.cardTitle}>隐私承诺</Text>
        {PRIVACY.map((line) => (
          <Text key={line} style={styles.bullet}>{line}</Text>
        ))}
      </Card>

      {/* 技术栈 */}
      <Card style={{ marginTop: spacing.md }}>
        <Text style={styles.cardTitle}>技术栈</Text>
        <Row label="Expo SDK" value={EXPO_SDK} />
        <Row label="React Native" value={RN_VERSION} />
        <Row label="本应用版本" value={version} />
      </Card>

      {/* 底部 */}
      <Text style={styles.foot}>Made with 🏸 for badminton players</Text>

      <Pressable
        onPress={() => router.back()}
        style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.7 : 1 }]}
      >
        <Text style={styles.backText}>返回</Text>
      </Pressable>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  heroEmoji: { fontSize: 56 },
  heroTitle: {
    color: colors.text,
    fontSize: font.h2,
    fontWeight: '700',
    marginTop: spacing.md,
  },
  versionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  version: {
    color: colors.primary,
    fontSize: font.h1,
    fontWeight: '800',
  },

  cardTitle: {
    color: colors.text,
    fontSize: font.h3,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  bullet: {
    color: colors.text,
    fontSize: font.body,
    lineHeight: 22,
    marginTop: spacing.xs,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  rowLabel: { color: colors.textDim, fontSize: font.body },
  rowValue: { color: colors.text, fontSize: font.body, fontWeight: '600' },

  foot: {
    color: colors.textDim,
    fontSize: font.small,
    textAlign: 'center',
    marginTop: spacing.xxl,
  },
  backBtn: {
    marginTop: spacing.lg,
    alignSelf: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  backText: { color: colors.text, fontSize: font.body, fontWeight: '600' },
});

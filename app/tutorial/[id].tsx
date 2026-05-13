import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { colors, font, spacing } from '@/theme/tokens';
import { findTutorial } from '@/data/tutorials';
import { FootworkAnimation } from '@/components/animations/FootworkAnimation';
import { ShuttlecockAnimation } from '@/components/animations/ShuttlecockAnimation';
import { FitnessAnimation } from '@/components/animations/FitnessAnimation';
import { TacticsAnimation } from '@/components/animations/TacticsAnimation';
import { GripGuide } from '@/components/animations/GripGuide';

export default function TutorialDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const t = id ? findTutorial(id) : undefined;

  if (!t) {
    return (
      <Screen>
        <Text style={{ color: colors.text }}>动作不存在</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={styles.title}>{t.title}</Text>
      <Text style={styles.sub}>
        {t.category} · {t.level}
      </Text>

      {t.animationType?.startsWith('footwork') && (
        <View style={styles.videoContainer}>
          <FootworkAnimation type={t.animationType} />
        </View>
      )}
      {t.animationType?.startsWith('shuttle') && (
        <View style={styles.videoContainer}>
          <ShuttlecockAnimation type={t.animationType} />
        </View>
      )}
      {t.animationType?.startsWith('fitness') && (
        <View style={styles.videoContainer}>
          <FitnessAnimation type={t.animationType} name={t.title} />
        </View>
      )}
      {t.animationType?.startsWith('tactics') && (
        <View style={styles.videoContainer}>
          <TacticsAnimation />
        </View>
      )}
      {t.videoUri ? (
        <View style={styles.videoContainer}>
          <Video
            source={{ uri: t.videoUri }}
            style={styles.video}
            resizeMode={ResizeMode.COVER}
            shouldPlay
            isLooping
            isMuted
            useNativeControls
          />
        </View>
      ) : null}

      {/* 新增：持拍法图解 */}
      {t.gripType && (
        <View style={{ marginTop: spacing.lg }}>
          <Text style={styles.section}>🏸 关键持拍法</Text>
          <GripGuide type={t.gripType} />
        </View>
      )}

      <Card style={{ marginTop: spacing.lg }}>
        <Text style={styles.section}>✅ 动作要点</Text>
        {t.keyPoints.map((p, i) => (
          <View key={i} style={styles.row}>
            <Text style={styles.dot}>{i + 1}</Text>
            <Text style={styles.text}>{p}</Text>
          </View>
        ))}
      </Card>

      <Card style={{ marginTop: spacing.md }}>
        <Text style={[styles.section, { color: colors.danger }]}>⚠️ 常见错误</Text>
        {t.commonMistakes.map((m, i) => (
          <View key={i} style={styles.row}>
            <Text style={[styles.dot, { color: colors.danger }]}>×</Text>
            <Text style={styles.text}>{m}</Text>
          </View>
        ))}
      </Card>

      <Card style={{ marginTop: spacing.md }}>
        <Text style={[styles.section, { color: colors.accent }]}>🔍 自检要点</Text>
        {t.checkpoints.map((c, i) => (
          <View key={i} style={styles.row}>
            <Text style={[styles.dot, { color: colors.accent }]}>?</Text>
            <Text style={styles.text}>{c}</Text>
          </View>
        ))}
      </Card>

      <Pressable
        onPress={() => router.push('/pose')}
        style={({ pressed }) => [
          styles.cta,
          { opacity: pressed ? 0.8 : 1 },
        ]}
      >
        <Text style={styles.ctaText}>📷 用动作识别检查我的{t.title}</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: font.h1, fontWeight: '700' },
  sub: { color: colors.textDim, marginTop: 4 },
  section: { color: colors.primary, fontWeight: '700', fontSize: font.h3, marginBottom: spacing.md },
  row: { flexDirection: 'row', marginBottom: spacing.md, gap: spacing.md },
  dot: { color: colors.primary, fontWeight: '800', fontSize: font.body, width: 20 },
  text: { color: colors.text, flex: 1, fontSize: font.body, lineHeight: 22 },
  cta: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    padding: spacing.lg,
    borderRadius: 14,
    alignItems: 'center',
  },
  ctaText: { color: '#fff', fontWeight: '700', fontSize: font.body },
  videoContainer: {
    marginTop: spacing.md,
    width: '100%',
    height: 320,
    backgroundColor: '#0B1220',
    borderRadius: 12,
    overflow: 'hidden',
  },
  video: {
    width: '100%',
    height: '100%',
  },
});

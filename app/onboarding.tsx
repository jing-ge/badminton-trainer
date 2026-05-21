import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { colors, font, radius, spacing } from '@/theme/tokens';
import { vibrateLight, vibrateMedium, vibrateHeavy } from '@/utils/haptics';

const ONBOARDING_KEY = 'prefs.onboardingDone';

const PREVIEW_TEXT = '准备开始训练。五。四。三。二。一。开始';

type Step = 0 | 1 | 2;

const TOTAL_STEPS = 3;

export default function OnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(0);
  const [voicePreviewed, setVoicePreviewed] = useState(false);
  const [hapticTried, setHapticTried] = useState(false);

  function previewVoice() {
    vibrateLight();
    Speech.stop();
    Speech.speak(PREVIEW_TEXT, { language: 'zh-CN', rate: 1.0, pitch: 1.0 });
    setVoicePreviewed(true);
  }

  function tryHaptic(level: 'light' | 'medium' | 'heavy') {
    if (level === 'light') vibrateLight();
    else if (level === 'medium') vibrateMedium();
    else vibrateHeavy();
    setHapticTried(true);
  }

  async function finish() {
    vibrateMedium();
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, '1');
    } catch {
      // 静默：写入失败也别卡住用户，下次再问一次
    }
    router.replace('/');
  }

  function next() {
    vibrateLight();
    if (step < TOTAL_STEPS - 1) setStep(((step + 1) as Step));
    else finish();
  }

  return (
    <Screen scroll={false}>
      <View style={styles.progressRow}>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={[
              styles.progressDot,
              i <= step && { backgroundColor: colors.primary },
            ]}
          />
        ))}
      </View>

      <View style={styles.body}>
        {step === 0 && <WelcomeStep />}
        {step === 1 && (
          <VoiceStep
            previewed={voicePreviewed}
            onPreview={previewVoice}
            onPickAdvanced={() => router.push('/settings/voice')}
          />
        )}
        {step === 2 && (
          <HapticStep tried={hapticTried} onTry={tryHaptic} />
        )}
      </View>

      <View style={styles.bottom}>
        {step > 0 && (
          <Pressable
            onPress={() => {
              vibrateLight();
              setStep(((step - 1) as Step));
            }}
            style={({ pressed }) => [styles.skipBtn, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Text style={styles.skipText}>← 上一步</Text>
          </Pressable>
        )}
        <Pressable
          onPress={next}
          style={({ pressed }) => [styles.nextBtn, { opacity: pressed ? 0.85 : 1 }]}
        >
          <Text style={styles.nextText}>
            {step === TOTAL_STEPS - 1 ? '🚀 开始第一次训练' : '下一步 →'}
          </Text>
        </Pressable>
        <Pressable onPress={finish} hitSlop={8}>
          <Text style={styles.skipAll}>跳过引导</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

function WelcomeStep() {
  return (
    <Card style={styles.card}>
      <Text style={styles.emoji}>🏸</Text>
      <Text style={styles.title}>欢迎来到沉浸式羽毛球私教</Text>
      <Text style={styles.sub}>
        全程离线、地下二层球馆也能用。下面 30 秒，带你跑通三件最重要的事。
      </Text>
      <View style={styles.bullets}>
        <Text style={styles.bulletLine}>🎧  挑一个不机械的中文教练声音</Text>
        <Text style={styles.bulletLine}>📳  让震动陪着节奏给你信号</Text>
        <Text style={styles.bulletLine}>🚀  完成第一次训练打卡</Text>
      </View>
    </Card>
  );
}

function VoiceStep({
  previewed,
  onPreview,
  onPickAdvanced,
}: {
  previewed: boolean;
  onPreview: () => void;
  onPickAdvanced: () => void;
}) {
  return (
    <Card style={styles.card}>
      <Text style={styles.emoji}>🎧</Text>
      <Text style={styles.title}>挑一个顺耳的中文声音</Text>
      <Text style={styles.sub}>
        训练里教练会喊「五、四、三...」帮你踩点。Android 系统默认 TTS 经常很机械，先试听一遍。
      </Text>

      <Pressable
        onPress={onPreview}
        style={({ pressed }) => [styles.bigActionBtn, { opacity: pressed ? 0.8 : 1 }]}
      >
        <Text style={styles.bigActionText}>
          {previewed ? '🔁 再听一次' : '▶️ 试听一段倒数'}
        </Text>
      </Pressable>

      <Pressable onPress={onPickAdvanced} hitSlop={8} style={{ marginTop: spacing.md }}>
        <Text style={styles.secondaryLink}>声音不顺耳？挑一个别的 →</Text>
      </Pressable>

      {Platform.OS === 'web' && (
        <Text style={styles.webHint}>
          Web 端浏览器可能拦截 TTS 试听，真机体验更准。
        </Text>
      )}
    </Card>
  );
}

function HapticStep({
  tried,
  onTry,
}: {
  tried: boolean;
  onTry: (level: 'light' | 'medium' | 'heavy') => void;
}) {
  return (
    <Card style={styles.card}>
      <Text style={styles.emoji}>📳</Text>
      <Text style={styles.title}>试一下震动手感</Text>
      <Text style={styles.sub}>
        训练中每个组结束、每个里程碑、每次切换状态，都会有不同强度的震动跟你确认。
      </Text>

      <View style={styles.hapticRow}>
        <Pressable
          onPress={() => onTry('light')}
          style={({ pressed }) => [styles.hapticBtn, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Text style={styles.hapticEmoji}>·</Text>
          <Text style={styles.hapticLabel}>轻</Text>
        </Pressable>
        <Pressable
          onPress={() => onTry('medium')}
          style={({ pressed }) => [styles.hapticBtn, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Text style={styles.hapticEmoji}>··</Text>
          <Text style={styles.hapticLabel}>中</Text>
        </Pressable>
        <Pressable
          onPress={() => onTry('heavy')}
          style={({ pressed }) => [styles.hapticBtn, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Text style={styles.hapticEmoji}>···</Text>
          <Text style={styles.hapticLabel}>重</Text>
        </Pressable>
      </View>

      {tried && (
        <Text style={styles.successHint}>✅ 震动正常，节奏给你提示更准</Text>
      )}

      {Platform.OS === 'web' && !tried && (
        <Text style={styles.webHint}>Web 端无震动，真机体验更准。</Text>
      )}
    </Card>
  );
}

export async function isOnboardingDone(): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(ONBOARDING_KEY);
    return v === '1';
  } catch {
    return false;
  }
}

const styles = StyleSheet.create({
  progressRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  progressDot: {
    width: 28,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  body: { flex: 1, justifyContent: 'center' },
  card: { paddingVertical: spacing.xl, alignItems: 'center' },
  emoji: { fontSize: 60, marginBottom: spacing.md },
  title: {
    color: colors.text,
    fontSize: font.h2,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  sub: {
    color: colors.textDim,
    fontSize: font.small,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing.md,
  },
  bullets: { marginTop: spacing.lg, gap: spacing.sm, alignSelf: 'stretch', paddingHorizontal: spacing.md },
  bulletLine: { color: colors.text, fontSize: font.body },
  bigActionBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
  },
  bigActionText: { color: '#fff', fontSize: font.body, fontWeight: '700' },
  secondaryLink: { color: colors.primary, fontSize: font.small, fontWeight: '600' },
  webHint: { color: colors.textDim, fontSize: font.tiny, marginTop: spacing.md, textAlign: 'center' },
  hapticRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  hapticBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardAlt,
    alignItems: 'center',
    minWidth: 72,
  },
  hapticEmoji: { color: colors.primary, fontSize: font.h3, fontWeight: '800' },
  hapticLabel: { color: colors.textDim, fontSize: font.tiny, marginTop: 4 },
  successHint: { color: colors.primary, fontSize: font.small, marginTop: spacing.md, fontWeight: '600' },
  bottom: { paddingVertical: spacing.lg, alignItems: 'center', gap: spacing.md },
  nextBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  nextText: { color: '#fff', fontSize: font.h3, fontWeight: '800' },
  skipBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  skipText: { color: colors.textDim, fontSize: font.small },
  skipAll: { color: colors.textDim, fontSize: font.tiny, textDecorationLine: 'underline' },
});

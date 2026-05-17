import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { colors, font, spacing } from '@/theme/tokens';
import { findTutorial } from '@/data/tutorials';
import { TutorialMedia } from '@/components/animations/TutorialMedia';
import { GripGuide } from '@/components/animations/GripGuide';
import { isFavorite, recordView, toggleFavorite } from '@/db/tutorials';
import { vibrateLight, vibrateMedium } from '@/utils/haptics';

export default function TutorialDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const t = id ? findTutorial(id) : undefined;

  const [fav, setFav] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  // 首屏：异步埋点 + 拉收藏状态。fire-and-forget，不阻塞渲染。
  useEffect(() => {
    if (!t) return;
    recordView(t.id);
    isFavorite(t.id).then((v) => {
      setFav(v);
      setLoaded(true);
    });
  }, [t]);

  const onToggleFav = async () => {
    if (!t) return;
    const next = await toggleFavorite(t.id);
    setFav(next);
    if (next) vibrateMedium();
    else vibrateLight();
    scale.value = withSequence(withTiming(1.3, { duration: 100 }), withTiming(1.0, { duration: 100 }));
  };

  if (!t) {
    return (
      <Screen>
        <Text style={{ color: colors.text }}>动作不存在</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.titleRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{t.title}</Text>
          <Text style={styles.sub}>
            {t.category} · {t.level}
          </Text>
        </View>
        <Pressable
          onPress={onToggleFav}
          hitSlop={10}
          style={styles.favBtn}
          accessibilityLabel={fav ? '取消收藏' : '收藏'}
        >
          <Animated.Text
            style={[
              styles.favIcon,
              { color: fav ? colors.warn : colors.textDim, opacity: loaded ? 1 : 0 },
              animStyle,
            ]}
          >
            {fav ? '★' : '☆'}
          </Animated.Text>
        </Pressable>
      </View>

      <TutorialMedia
        animationType={t.animationType}
        name={t.title}
        height={320}
        style={{ marginTop: spacing.md }}
      />
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

      {/* 持拍法图解：与上方 TutorialMedia 视觉成组，加副文案给出上下文 */}
      {t.gripType && (
        <View style={{ marginTop: spacing.md }}>
          <Text style={[styles.section, { marginBottom: 0 }]}>🏸 关键持拍法</Text>
          <Text style={styles.gripHint}>{t.title} 全程保持此持拍，发力前再快速切换</Text>
          <GripGuide type={t.gripType} />
        </View>
      )}

      {/* Section 顺序：错误 → 要点 → 自检（先纠错，再正向，再自查） */}
      {renderSection('⚠️', '常见错误', colors.danger, '×', t.commonMistakes, spacing.lg)}
      {renderSection('✅', '动作要点', colors.primary, undefined, t.keyPoints, spacing.md)}
      {renderSection('🔍', '自检要点', colors.accent, '?', t.checkpoints, spacing.md)}

      <Pressable
        onPress={() => {
          vibrateMedium();
          router.push('/train');
        }}
        style={({ pressed }) => [styles.cta, { opacity: pressed ? 0.8 : 1 }]}
      >
        <Text style={styles.ctaText}>🚀 开练 · 去训练 Tab</Text>
      </Pressable>
      <Pressable
        onPress={() => {
          vibrateLight();
          router.push('/training/log');
        }}
        hitSlop={8}
        style={styles.secondaryLinkWrap}
      >
        <Text style={styles.secondaryLink}>📝 直接打个卡 →</Text>
      </Pressable>
    </Screen>
  );
}

/** 单个 Section 卡片：标题 "<emoji> <name>  · N 条" 单行，N 用 tabular-nums 小字。
 *  抽出来是因为三个 Section 结构完全一致，三遍 JSX 噪音太大。 */
function renderSection(
  emoji: string,
  name: string,
  color: string,
  dotOverride: string | undefined,
  items: string[],
  marginTop: number,
) {
  return (
    <Card style={{ marginTop }}>
      <Text style={[styles.section, { color }]}>
        {emoji} {name}
        <Text style={[styles.sectionCount, { color }]}>{`  · ${items.length} 条`}</Text>
      </Text>
      {items.map((it, i) => (
        <View key={i} style={styles.row}>
          <Text style={[styles.dot, { color }]}>{dotOverride ?? i + 1}</Text>
          <Text style={styles.text}>{it}</Text>
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'flex-start' },
  title: { color: colors.text, fontSize: font.h1, fontWeight: '700' },
  sub: { color: colors.textDim, marginTop: 4 },
  favBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favIcon: { fontSize: 28, fontWeight: '700' },
  section: { color: colors.primary, fontWeight: '700', fontSize: font.h3, marginBottom: spacing.md },
  sectionCount: { fontSize: font.small, fontWeight: '600', fontVariant: ['tabular-nums'] },
  gripHint: { color: colors.textDim, fontSize: font.small, marginTop: 2, marginBottom: spacing.md },
  secondaryLinkWrap: { alignSelf: 'center', marginTop: spacing.md, paddingVertical: spacing.sm },
  secondaryLink: {
    color: colors.textDim,
    fontSize: font.small,
    textDecorationLine: 'underline',
  },
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

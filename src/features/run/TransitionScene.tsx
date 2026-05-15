import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { colors, font, radius, spacing } from '@/theme/tokens';
import type { TrainingItem, TrainingCategory } from '@/data/planTypes';
import { TutorialMedia } from '@/components/animations/TutorialMedia';

/**
 * v0.10.0：两个训练项之间的 5 秒「Next Up + 深呼吸」过渡场景。
 * 由 run.tsx 在进入 'transitioning' 状态时渲染，倒计时与 startItem 调度仍在 run.tsx。
 * 元素：✅ 顶部进度徽章 / 深呼吸圆 / 倒数 / Next Up 卡 / 跳过按钮
 */

const CATEGORY_EMOJI: Record<TrainingCategory, string> = {
  tech: '🏸',
  footwork: '👟',
  fitness: '💪',
  match: '🎯',
  recovery: '🎯',
};

const CATEGORY_LABEL: Record<TrainingCategory, string> = {
  tech: '技术',
  footwork: '步法',
  fitness: '体能',
  match: '对抗',
  recovery: '恢复',
};

export function TransitionScene({
  currentIndex,
  totalItems,
  nextItem,
  scaledMin,
  secondsLeft,
  onSkip,
}: {
  currentIndex: number;
  totalItems: number;
  nextItem: TrainingItem;
  scaledMin: number;
  secondsLeft: number;
  onSkip: () => void;
}) {
  // 呼吸：4 秒一个周期，前半「吸气」scale 0.85→1.15，后半「呼气」1.15→0.85
  const scale = useSharedValue(0.85);
  useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.15, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [scale]);

  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // 判断当前呼吸阶段：scale > 1.0 偏吸气末尾或呼气初；用 shared 实时同步到 JS 太麻烦，
  // 简化为按时间窗口推断：周期 4s，secondsLeft 是从 5 倒数到 1，每秒切一次。
  // 这里用 secondsLeft 奇偶/段位映射到吸/呼，体感与圆的缩放对齐：
  //   5,4 -> 吸气段；3,2 -> 呼气段；1 -> 吸气段
  const phaseText = secondsLeft >= 4 || secondsLeft === 1 ? '吸气' : '呼气';

  const emoji = CATEGORY_EMOJI[nextItem.category] ?? '🎯';
  const categoryLabel = CATEGORY_LABEL[nextItem.category] ?? '训练';

  return (
    <View style={styles.wrap}>
      {/* 1. 顶部进度徽章 */}
      <View style={styles.badge}>
        <Text style={styles.badgeText}>✅ 已完成 {currentIndex + 1}/{totalItems}</Text>
      </View>

      {/* 2. 深呼吸圆 + 3. 倒数 */}
      <View style={styles.breathArea}>
        <Animated.View style={[styles.breathCircle, circleStyle]}>
          <Text style={styles.breathText}>{phaseText}</Text>
        </Animated.View>
        <Text style={styles.countdown}>{secondsLeft} 秒后开始</Text>
      </View>

      {/* 4. Next Up 卡片 */}
      <View style={styles.nextCard}>
        <View style={styles.miniDemo}>
          {nextItem.animationType ? (
            <TutorialMedia
              animationType={nextItem.animationType}
              name={nextItem.name}
              height={56}
              style={styles.miniDemoMedia}
            />
          ) : (
            <Text style={styles.miniDemoEmoji}>{emoji}</Text>
          )}
        </View>
        <View style={styles.nextInfo}>
          <Text style={styles.nextTitle} numberOfLines={2}>
            下一个 · {nextItem.name}
          </Text>
          <Text style={styles.nextMeta}>
            {scaledMin} 分钟 · {categoryLabel}
          </Text>
          {nextItem.notes ? (
            <Text style={styles.nextNotes} numberOfLines={2}>💡 {nextItem.notes}</Text>
          ) : null}
        </View>
      </View>

      {/* 5. 跳过按钮 */}
      <Pressable onPress={onSkip} style={styles.skipBtn}>
        <Text style={styles.skipText}>⏭ 直接开始 →</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    zIndex: 1,
  },
  badge: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  badgeText: {
    color: colors.primary,
    fontSize: font.small,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  breathArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  breathCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: colors.bg,
    borderWidth: 2,
    borderColor: 'rgba(16, 185, 129, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  breathText: {
    color: colors.text,
    fontSize: font.h2,
    fontWeight: '700',
    letterSpacing: 4,
  },
  countdown: {
    marginTop: spacing.xl,
    color: colors.textDim,
    fontSize: font.h2,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  nextCard: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: colors.cardAlt,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  miniDemo: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginRight: spacing.md,
  },
  miniDemoMedia: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
  },
  miniDemoEmoji: {
    fontSize: 32,
  },
  nextInfo: {
    flex: 1,
  },
  nextTitle: {
    color: colors.text,
    fontSize: font.h3,
    fontWeight: '700',
  },
  nextMeta: {
    color: colors.textDim,
    fontSize: font.small,
    marginTop: 2,
  },
  nextNotes: {
    color: colors.warn,
    fontSize: font.small,
    marginTop: 4,
  },
  skipBtn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  skipText: {
    color: colors.text,
    fontSize: font.body,
    fontWeight: '600',
  },
});

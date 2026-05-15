import { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolateColor,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { Card } from '@/components/Card';
import { colors, font, radius, spacing } from '@/theme/tokens';
import { vibrateLight, vibrateMedium } from '@/utils/haptics';

export type StreakStats = {
  current: number;
  best: number;
  todayLogged: boolean;
  firstLogDate: string | null;
};

export type StreakStatus = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

export type StreakView = {
  status: StreakStatus;
  title: string;
  subtitle: string;
  mainColor: string;
  /** 0..1，>=1 触发呼吸；<0 表示不渲染进度条 */
  progress: number;
  /** 进度条下方小字（如 “今日 0/1”），可空 */
  progressLabel: string | null;
  ctaLabel: string;
  ctaColor: string;
  ctaVibrate: () => void;
};

/**
 * 把 stats 翻译成 5 状态视图。按 PRD 优先级 A > B > C > D > E > F 命中即止。
 * 抽成纯函数便于单测、也方便首页同时拿到 status 决定吐司逻辑（虽然本次不写单测）。
 */
export function deriveStreakView(stats: StreakStats): StreakView {
  const { current, best, todayLogged, firstLogDate } = stats;

  // A 破纪录中
  if (current > best && todayLogged) {
    return {
      status: 'A',
      title: `🏆 第 ${current} 天 · 新纪录！`,
      subtitle: `超越了你过去最长的 ${best} 天连击`,
      mainColor: colors.primary,
      progress: -1, // 不画进度条，用金边动画
      progressLabel: null,
      ctaLabel: '+ 打卡',
      ctaColor: colors.primary,
      ctaVibrate: vibrateLight,
    };
  }

  // B 平纪录
  if (current === best && current > 0 && todayLogged) {
    return {
      status: 'B',
      title: `🔥 第 ${current} 天 · 追平纪录`,
      subtitle: '今天就是历史最长，明天继续就破',
      mainColor: colors.warn,
      progress: 1,
      progressLabel: null,
      ctaLabel: '+ 打卡',
      ctaColor: colors.primary,
      ctaVibrate: vibrateLight,
    };
  }

  // C 冲击纪录
  if (
    current >= Math.max(3, best - 2) &&
    current < best &&
    todayLogged
  ) {
    return {
      status: 'C',
      title: `🔥 第 ${current} 天 · 还差 ${best - current} 天破纪录`,
      subtitle: '离你的最长连击只剩一步',
      mainColor: colors.warn,
      progress: best > 0 ? current / best : 0,
      progressLabel: null,
      ctaLabel: '+ 打卡',
      ctaColor: colors.primary,
      ctaVibrate: vibrateLight,
    };
  }

  // D 火苗将熄
  if (current >= 1 && !todayLogged) {
    return {
      status: 'D',
      title: `🪔 第 ${current} 天 · 今天还没打卡`,
      subtitle: '今天再练一次就能续上火苗',
      mainColor: colors.warn,
      progress: 0, // 灰底进度条
      progressLabel: '今日 0/1',
      ctaLabel: '+ 续火苗',
      ctaColor: colors.warn,
      ctaVibrate: vibrateMedium,
    };
  }

  // E 普通连击
  if (current >= 1 && todayLogged) {
    const denom = Math.max(best, 7);
    let subtitle: string;
    if (current === 1) subtitle = '好的开始，明天继续';
    else if (current <= 6) subtitle = '坚持得不错，目标 7 天小成';
    else if (current <= 13) subtitle = '已经一周了，节奏很稳';
    else subtitle = `了不起的自律 · 历史最佳 ${best} 天`;
    return {
      status: 'E',
      title: `🔥 第 ${current} 天`,
      subtitle,
      mainColor: colors.primary,
      progress: denom > 0 ? current / denom : 0,
      progressLabel: null,
      ctaLabel: '+ 打卡',
      ctaColor: colors.primary,
      ctaVibrate: vibrateLight,
    };
  }

  // F 无连击
  const subtitle =
    firstLogDate === null
      ? '点击右侧 + 打卡，记录第一笔训练'
      : `上一段连击 ${best} 天 · 今天重新启程`;
  return {
    status: 'F',
    title: '还没开始连击',
    subtitle,
    mainColor: colors.textDim,
    progress: -1,
    progressLabel: null,
    ctaLabel: '+ 打卡',
    ctaColor: colors.primary,
    ctaVibrate: vibrateLight,
  };
}

/** 卡片本体。点击 CTA 走 onPressCta（首页传跳 /training/log）。 */
export function StreakBadgeCard({
  stats,
  onPressCta,
}: {
  stats: StreakStats;
  onPressCta: () => void;
}) {
  const view = useMemo(() => deriveStreakView(stats), [stats]);

  // A 状态金边脉动
  const borderPulse = useSharedValue(0);
  useEffect(() => {
    if (view.status === 'A') {
      borderPulse.value = 0;
      borderPulse.value = withRepeat(
        withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    } else {
      cancelAnimation(borderPulse);
      borderPulse.value = 0;
    }
    return () => {
      cancelAnimation(borderPulse);
    };
  }, [view.status, borderPulse]);

  const animatedCardStyle = useAnimatedStyle(() => {
    if (view.status !== 'A') return {};
    const borderColor = interpolateColor(
      borderPulse.value,
      [0, 1],
      [colors.primary, colors.warn],
    );
    return {
      borderColor,
      borderWidth: 2,
    };
  }, [view.status]);

  return (
    <Animated.View style={[styles.cardWrap, animatedCardStyle]}>
      <Card style={styles.card}>
        <View style={styles.row}>
          <View style={styles.textCol}>
            <Text
              style={[styles.title, { color: view.mainColor }]}
              numberOfLines={1}
            >
              {view.title}
            </Text>
            <Text style={styles.subtitle} numberOfLines={2}>
              {view.subtitle}
            </Text>
          </View>
          <Pressable
            hitSlop={8}
            onPressIn={view.ctaVibrate}
            onPress={onPressCta}
            style={({ pressed }) => [
              styles.cta,
              { backgroundColor: view.ctaColor, opacity: pressed ? 0.75 : 1 },
            ]}
          >
            <Text style={styles.ctaText}>{view.ctaLabel}</Text>
          </Pressable>
        </View>

        {view.progress >= 0 && (
          <View style={styles.progressBlock}>
            <ProgressBar
              progress={view.progress}
              color={view.mainColor}
              dim={view.status === 'D'}
            />
            {view.progressLabel && (
              <Text style={styles.progressLabel}>{view.progressLabel}</Text>
            )}
          </View>
        )}
      </Card>
    </Animated.View>
  );
}

function ProgressBar({
  progress,
  color,
  dim,
}: {
  progress: number;
  color: string;
  dim: boolean;
}) {
  const breath = useSharedValue(1);
  const full = progress >= 1;

  useEffect(() => {
    if (full) {
      breath.value = 0.7;
      breath.value = withRepeat(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    } else {
      cancelAnimation(breath);
      breath.value = 1;
    }
    return () => {
      cancelAnimation(breath);
    };
  }, [full, breath]);

  const innerStyle = useAnimatedStyle(() => {
    return { opacity: full ? breath.value : 1 };
  }, [full]);

  const pct = Math.max(0, Math.min(1, progress));

  return (
    <View style={styles.barBg}>
      <Animated.View
        style={[
          styles.barFill,
          {
            width: `${pct * 100}%`,
            backgroundColor: dim ? colors.textDim : color,
          },
          innerStyle,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  cardWrap: {
    marginBottom: spacing.lg,
    borderRadius: radius.lg,
  },
  card: {
    // Card 自带 border，A 状态由 wrapper 覆盖；其它状态保持默认
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textCol: { flex: 1, marginRight: spacing.md },
  title: { fontSize: font.h3, fontWeight: '800' },
  subtitle: {
    color: colors.textDim,
    fontSize: font.small,
    marginTop: 4,
  },
  cta: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: radius.pill,
  },
  ctaText: { color: '#fff', fontWeight: '700' },
  progressBlock: { marginTop: spacing.md },
  barBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressLabel: {
    color: colors.textDim,
    fontSize: font.tiny,
    marginTop: 4,
  },
});

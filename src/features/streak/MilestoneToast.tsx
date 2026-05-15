import { useEffect } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { colors, font, radius, spacing } from '@/theme/tokens';

/**
 * 顶部里程碑吐司。父组件控制 visible+message，自动 2.4s 后回调 onDismiss。
 * 不使用 SafeAreaInsets，统一用 top:24（PRD 要求）。
 */
export function MilestoneToast({
  visible,
  message,
  onDismiss,
}: {
  visible: boolean;
  message: string;
  onDismiss: () => void;
}) {
  const translateY = useSharedValue(-60);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = -60;
      opacity.value = 0;
      // 进入 400ms → 停 2400ms → 退 300ms → onDismiss
      translateY.value = withTiming(0, {
        duration: 400,
        easing: Easing.out(Easing.cubic),
      });
      opacity.value = withSequence(
        withTiming(1, { duration: 400 }),
        withDelay(
          2400,
          withTiming(0, { duration: 300 }, (finished) => {
            if (finished) runOnJS(onDismiss)();
          }),
        ),
      );
    }
    // visible 变 false 时不主动复位：父侧应通过卸载或重置 message 控制
  }, [visible, translateY, opacity, onDismiss]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View pointerEvents="box-none" style={[styles.wrap, style]}>
      <Pressable onPress={onDismiss} style={styles.toast}>
        <Text style={styles.text}>{message}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  toast: {
    width: '90%',
    backgroundColor: colors.cardAlt,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  text: {
    color: colors.text,
    fontSize: font.body,
    fontWeight: '700',
    textAlign: 'center',
  },
});

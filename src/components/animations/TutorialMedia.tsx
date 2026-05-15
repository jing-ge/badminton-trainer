import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, font, radius } from '@/theme/tokens';
import type { AnimationType } from '@/data/planTypes';
import { FootworkAnimation } from './FootworkAnimation';
import { ShuttlecockAnimation } from './ShuttlecockAnimation';
import { FitnessAnimation } from './FitnessAnimation';
import { TacticsAnimation } from './TacticsAnimation';

/**
 * 统一的训练/教程演示动画分发组件。
 * 把原本散落在 tutorial/[id].tsx 与 training/run.tsx 中的 4 套 if 链
 * 收敛为一个 switch,容器样式也统一在此处。
 */
export function TutorialMedia({
  animationType,
  name,
  height = 320,
  style,
  fallback,
}: {
  animationType?: AnimationType;
  name?: string;
  height?: number;
  style?: ViewStyle;
  fallback?: React.ReactNode;
}) {
  const inner = (() => {
    if (!animationType) return null;
    if (animationType.startsWith('footwork')) {
      return <FootworkAnimation type={animationType} />;
    }
    if (animationType.startsWith('shuttle')) {
      return <ShuttlecockAnimation type={animationType} />;
    }
    if (animationType.startsWith('fitness')) {
      return <FitnessAnimation type={animationType} name={name ?? ''} />;
    }
    if (animationType.startsWith('tactics')) {
      return <TacticsAnimation />;
    }
    return null;
  })();

  if (!inner) {
    if (fallback) return <>{fallback}</>;
    return null;
  }

  return <View style={[styles.container, { height }, style]}>{inner}</View>;
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
});

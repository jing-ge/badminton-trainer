import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Rect, Line, Circle, Path } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withTiming, Easing, withRepeat, withSequence } from 'react-native-reanimated';
import { colors } from '@/theme/tokens';

const AnimatedPath = Animated.createAnimatedComponent(Path);

export function TacticsAnimation() {
  const progress = useSharedValue(0);

  useEffect(() => {
    // 模拟拉吊突击的四次路线: 
    // 1. 发高远 (0->1) 
    // 2. 对手回后场 (1->2)
    // 3. 吊网前 (2->3)
    // 4. 突击杀球 (3->4)
    progress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000 }),
        withTiming(2, { duration: 1000 }),
        withTiming(3, { duration: 1000 }),
        withTiming(4, { duration: 800 }),
        withTiming(0, { duration: 500 })
      ),
      -1,
      false
    );
  }, []);

  const arrow1Props = useAnimatedProps(() => ({
    strokeDashoffset: progress.value >= 1 ? 0 : (1 - progress.value) * 200,
    opacity: progress.value < 1 ? progress.value : 1 - (progress.value - 1),
  }));

  const arrow2Props = useAnimatedProps(() => ({
    strokeDashoffset: progress.value >= 2 ? 0 : progress.value > 1 ? (2 - progress.value) * 200 : 200,
    opacity: progress.value < 1 ? 0 : progress.value < 2 ? (progress.value - 1) : 1 - (progress.value - 2),
  }));

  const arrow3Props = useAnimatedProps(() => ({
    strokeDashoffset: progress.value >= 3 ? 0 : progress.value > 2 ? (3 - progress.value) * 200 : 200,
    opacity: progress.value < 2 ? 0 : progress.value < 3 ? (progress.value - 2) : 1 - (progress.value - 3),
  }));

  const arrow4Props = useAnimatedProps(() => ({
    strokeDashoffset: progress.value >= 4 ? 0 : progress.value > 3 ? (4 - progress.value) * 200 : 200,
    opacity: progress.value < 3 ? 0 : progress.value < 4 ? (progress.value - 3) : 1 - (progress.value - 4),
  }));

  const renderNet = () => (
    <React.Fragment>
      <Line x1="10" y1="200" x2="10" y2="170" stroke="#bdc3c7" strokeWidth="2.5" />
      <Line x1="190" y1="200" x2="190" y2="170" stroke="#bdc3c7" strokeWidth="2.5" />
      <Rect x="10" y="170" width="180" height="30" fill="#fff" opacity="0.15" />
      {[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18].map(i => (
        <Line key={`v${i}`} x1={10 + i * 10} y1="170" x2={10 + i * 10} y2="200" stroke="#fff" strokeWidth="0.5" opacity="0.4" />
      ))}
      {[0,1,2,3].map(i => (
        <Line key={`h${i}`} x1="10" y1={170 + i * 10} x2="190" y2={170 + i * 10} stroke="#fff" strokeWidth="0.5" opacity="0.4" />
      ))}
      <Line x1="10" y1="170" x2="190" y2="170" stroke="#fff" strokeWidth="2.5" />
      <Line x1="10" y1="200" x2="190" y2="200" stroke="#FF4136" strokeWidth="3" />
    </React.Fragment>
  );

  return (
    <View style={styles.container}>
      <View style={styles.isometricWrapper}>
        <Svg width="100%" height="100%" viewBox="-50 0 300 400" preserveAspectRatio="xMidYMid meet">
          <Rect x="10" y="20" width="180" height="360" fill="#1E824C" />
          <Rect x="20" y="20" width="160" height="360" fill="none" stroke="#fff" strokeWidth="1" />
          <Line x1="20" y1="140" x2="180" y2="140" stroke="#fff" strokeWidth="1" />
          <Line x1="20" y1="260" x2="180" y2="260" stroke="#fff" strokeWidth="1" />

          {/* 对手 (上) -> 被网挡住 */}
          <Circle cx="100" cy="100" r="6" fill={colors.danger} />

          {renderNet()}

          {/* 我方 (下) */}
          <Circle cx="100" cy="300" r="6" fill={colors.primary} />

          {/* 路线1: 高远 */}
          <AnimatedPath d="M 100 300 Q 150 150 160 40" fill="none" stroke="#fff" strokeWidth="2" strokeDasharray="200" animatedProps={arrow1Props} />
          {/* 路线2: 对手回高远 */}
          <AnimatedPath d="M 160 40 Q 50 200 40 350" fill="none" stroke={colors.warn} strokeWidth="2" strokeDasharray="200" animatedProps={arrow2Props} />
          {/* 路线3: 我方吊网前 */}
          <AnimatedPath d="M 40 350 Q 80 260 60 160" fill="none" stroke="#fff" strokeWidth="2" strokeDasharray="200" animatedProps={arrow3Props} />
          {/* 路线4: 突击杀直线 */}
          <AnimatedPath d="M 100 280 L 160 160" fill="none" stroke={colors.accent} strokeWidth="3" strokeDasharray="200" animatedProps={arrow4Props} />
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B1220', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  isometricWrapper: {
    width: '100%',
    height: '100%',
    transform: [
      { rotateX: '55deg' },
      { rotateZ: '-30deg' },
      { scale: 1.3 }
    ]
  }
});
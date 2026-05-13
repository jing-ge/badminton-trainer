import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Rect, Line, Circle } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withTiming, Easing } from 'react-native-reanimated';
import { colors } from '@/theme/tokens';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function FootworkAnimation({ type = 'footwork-six' }: { type?: string }) {
  const cx = useSharedValue(100);
  const cy = useSharedValue(200);

  useEffect(() => {
    let points = [
      { x: 30, y: 60 },   // 左前网
      { x: 170, y: 60 },  // 右前网
      { x: 20, y: 200 },  // 左两侧
      { x: 180, y: 200 }, // 右两侧
      { x: 30, y: 360 },  // 左后退
      { x: 170, y: 360 }, // 右后退
    ];

    if (type === 'footwork-four') {
      points = [{ x: 30, y: 60 }, { x: 170, y: 60 }, { x: 30, y: 360 }, { x: 170, y: 360 }];
    } else if (type === 'footwork-launch') {
      points = [{ x: 100, y: 150 }, { x: 100, y: 250 }]; // 前后小幅启动
    }

    let step = 0;
    let returning = false;

    const interval = setInterval(() => {
      if (returning) {
        cx.value = withTiming(100, { duration: 350, easing: Easing.out(Easing.quad) });
        cy.value = withTiming(200, { duration: 350, easing: Easing.out(Easing.quad) });
        returning = false;
        step = (step + 1) % points.length;
      } else {
        cx.value = withTiming(points[step].x, { duration: 400, easing: Easing.inOut(Easing.quad) });
        cy.value = withTiming(points[step].y, { duration: 400, easing: Easing.inOut(Easing.quad) });
        returning = true;
      }
    }, 800);

    return () => clearInterval(interval);
  }, [type]);

  const animatedProps = useAnimatedProps(() => ({
    cx: cx.value,
    cy: cy.value,
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
          {/* 羽毛球场绿底 */}
          <Rect x="10" y="20" width="180" height="360" fill="#1E824C" stroke="#fff" strokeWidth="2" />
          
          {/* 前发球线 */}
          <Line x1="10" y1="140" x2="190" y2="140" stroke="#fff" strokeWidth="1.5" />
          <Line x1="10" y1="260" x2="190" y2="260" stroke="#fff" strokeWidth="1.5" />
          
          {/* 中线 */}
          <Line x1="100" y1="20" x2="100" y2="140" stroke="#fff" strokeWidth="1.5" />
          <Line x1="100" y1="260" x2="100" y2="380" stroke="#fff" strokeWidth="1.5" />
          
          {/* 双打后发球线 */}
          <Line x1="10" y1="50" x2="190" y2="50" stroke="#fff" strokeWidth="1" />
          <Line x1="10" y1="350" x2="190" y2="350" stroke="#fff" strokeWidth="1" />

          {/* 单打边线 */}
          <Line x1="25" y1="20" x2="25" y2="380" stroke="#fff" strokeWidth="1" />
          <Line x1="175" y1="20" x2="175" y2="380" stroke="#fff" strokeWidth="1" />

          {renderNet()}

          {/* 动态的运动员 (小红点 + 阴影) 在下半场，挡住球网 */}
          <AnimatedCircle animatedProps={animatedProps} r="12" fill={colors.danger} opacity="0.4" />
          <AnimatedCircle animatedProps={animatedProps} r="6" fill={colors.danger} />
          
          {/* 中心固定点 */}
          <Circle cx="100" cy="200" r="4" fill="#F8E71C" />
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
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop, Line, Ellipse, Path, Rect } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withTiming, Easing, withRepeat, withSequence, useDerivedValue } from 'react-native-reanimated';
import { colors } from '@/theme/tokens';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedLine = Animated.createAnimatedComponent(Line);
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);
const AnimatedPath = Animated.createAnimatedComponent(Path);

export function FitnessAnimation({ type = 'fitness-core', name = '' }: { type?: string; name?: string }) {
  const progress = useSharedValue(0);

  // 根据动作名称选择具体的子类型
  const subType = 
    name.includes('波比') ? 'burpee' :
    name.includes('深蹲') ? 'squat' :
    name.includes('弓步') ? 'lunge' :
    name.includes('跳绳') ? 'rope' :
    name.includes('平板') || name.includes('核心') ? 'plank' :
    name.includes('折返') ? 'shuttle-run' :
    name.includes('俄罗斯') ? 'twist' :
    type.includes('explosive') ? 'squat' :
    type.includes('endurance') ? 'rope' :
    type.includes('core') ? 'plank' :
    'pulse'; // 兜底光环

  useEffect(() => {
    const duration = subType === 'plank' ? 2500 :
                     subType === 'shuttle-run' ? 1500 :
                     subType === 'rope' ? 400 :
                     subType === 'twist' ? 700 :
                     800;

    progress.value = withRepeat(
      withSequence(
        withTiming(1, { duration, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [subType]);

  const baseColor = type.includes('explosive') ? colors.danger :
                    type.includes('core') ? colors.accent :
                    type.includes('endurance') ? colors.warn : colors.primary;

  // 各种 derived values，用于不同子类型的动画
  // ===== 波比跳 (burpee) =====
  // t=0: 站立, t=0.33: 蹲下, t=0.66: 撑地俯卧, t=1: 跳起
  const burpeeBodyProps = useAnimatedProps(() => {
    const t = progress.value;
    let cy = 110, ry = 30; // 站立
    if (t < 0.33) {
      const k = t / 0.33;
      cy = 110 + 30 * k; ry = 30 - 10 * k;
    } else if (t < 0.66) {
      const k = (t - 0.33) / 0.33;
      cy = 140; ry = 20 - 10 * k;
    } else {
      const k = (t - 0.66) / 0.34;
      cy = 130 - 30 * k; ry = 10 + 20 * k;
    }
    return { cy, ry };
  });
  const burpeeHeadProps = useAnimatedProps(() => {
    const t = progress.value;
    let cy = 70;
    if (t < 0.33) cy = 70 + 50 * (t / 0.33);
    else if (t < 0.66) cy = 130;
    else cy = 130 - 80 * ((t - 0.66) / 0.34);
    return { cy };
  });

  // ===== 深蹲跳 (squat) =====
  // t=0: 半蹲下, t=1: 腾空跳起
  const squatBodyY = useDerivedValue(() => 130 - 40 * progress.value);
  const squatHeadProps = useAnimatedProps(() => ({ cy: squatBodyY.value - 30 }));
  const squatTorsoProps = useAnimatedProps(() => ({ cy: squatBodyY.value }));
  const squatLegLProps = useAnimatedProps(() => ({
    x1: 92, y1: squatBodyY.value + 8,
    x2: 80, y2: squatBodyY.value + 40 - 10 * progress.value,
  }));
  const squatLegRProps = useAnimatedProps(() => ({
    x1: 108, y1: squatBodyY.value + 8,
    x2: 120, y2: squatBodyY.value + 40 - 10 * progress.value,
  }));

  // ===== 弓步跳 (lunge) =====
  // 左右腿交替前弓
  const lungeBodyY = useDerivedValue(() => 130 - 25 * Math.sin(progress.value * Math.PI));
  const lungeFront = useDerivedValue(() => progress.value < 0.5 ? 1 : -1);
  const lungeHeadProps = useAnimatedProps(() => ({ cy: lungeBodyY.value - 30 }));
  const lungeTorsoProps = useAnimatedProps(() => ({ cy: lungeBodyY.value }));
  const lungeLegFProps = useAnimatedProps(() => ({
    x1: 100, y1: lungeBodyY.value + 8,
    x2: 100 + 25 * lungeFront.value, y2: lungeBodyY.value + 40,
  }));
  const lungeLegBProps = useAnimatedProps(() => ({
    x1: 100, y1: lungeBodyY.value + 8,
    x2: 100 - 20 * lungeFront.value, y2: lungeBodyY.value + 45,
  }));

  // ===== 跳绳 (rope) =====
  // 小幅上下跳，绳子转一圈
  const ropeBodyY = useDerivedValue(() => 110 - 15 * Math.abs(Math.sin(progress.value * Math.PI)));
  const ropeHeadProps = useAnimatedProps(() => ({ cy: ropeBodyY.value - 30 }));
  const ropeTorsoProps = useAnimatedProps(() => ({ cy: ropeBodyY.value }));
  const ropeLegLProps = useAnimatedProps(() => ({
    x1: 92, y1: ropeBodyY.value + 8, x2: 90, y2: ropeBodyY.value + 35,
  }));
  const ropeLegRProps = useAnimatedProps(() => ({
    x1: 108, y1: ropeBodyY.value + 8, x2: 110, y2: ropeBodyY.value + 35,
  }));
  // 绳子 path: 用一个椭圆弧线模拟绳子上半圈/下半圈
  const ropePathProps = useAnimatedProps(() => {
    const t = progress.value;
    // 上下交替挥动绳子
    const swing = Math.sin(t * Math.PI * 2);
    // 绳子高度从头顶 (-30) 到脚下 (+45)
    const cy = ropeBodyY.value + swing * 40;
    return { d: `M 80 ${ropeBodyY.value + 5} Q 100 ${cy}, 120 ${ropeBodyY.value + 5}` };
  });

  // ===== 平板支撑 (plank) =====
  // 身体水平，配呼吸光环
  const plankAura = useAnimatedProps(() => ({
    r: 60 + progress.value * 25,
    opacity: 0.3 - progress.value * 0.2,
  }));

  // ===== 折返跑 (shuttle-run) =====
  // 在 X 轴上左右奔跑
  const runX = useDerivedValue(() => 50 + 100 * progress.value);
  const runHeadProps = useAnimatedProps(() => ({ cx: runX.value }));
  const runTorsoProps = useAnimatedProps(() => ({ cx: runX.value }));
  const runLegLProps = useAnimatedProps(() => {
    // 模拟跑步腿部摆动
    const phase = Math.sin(progress.value * Math.PI * 8);
    return {
      x1: runX.value, y1: 118,
      x2: runX.value - 10 - phase * 8, y2: 145,
    };
  });
  const runLegRProps = useAnimatedProps(() => {
    const phase = -Math.sin(progress.value * Math.PI * 8);
    return {
      x1: runX.value, y1: 118,
      x2: runX.value + 10 + phase * 8, y2: 145,
    };
  });

  // ===== 俄罗斯转体 (twist) =====
  // 坐姿 V 形，身体左右转
  const twistAngle = useDerivedValue(() => Math.sin(progress.value * Math.PI * 2) * 30);
  const twistArmProps = useAnimatedProps(() => {
    const rad = (twistAngle.value * Math.PI) / 180;
    return {
      x1: 100, y1: 120,
      x2: 100 + 35 * Math.cos(rad), y2: 120 + 5 * Math.sin(rad),
    };
  });

  // ===== 兜底光环 (pulse) =====
  const pulseProps1 = useAnimatedProps(() => ({
    r: 40 + progress.value * 30,
    opacity: 1 - progress.value * 0.5,
  }));
  const pulseProps2 = useAnimatedProps(() => ({
    r: 60 + progress.value * 60,
    opacity: 0.5 - progress.value * 0.5,
  }));

  return (
    <View style={styles.container}>
      <Svg width="100%" height="100%" viewBox="0 0 200 200">
        <Defs>
          <RadialGradient id="glow" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0%" stopColor={baseColor} stopOpacity="1" />
            <Stop offset="100%" stopColor={baseColor} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        {/* 地面阴影 */}
        <Ellipse cx="100" cy="170" rx="40" ry="4" fill="#000" opacity="0.3" />

        {subType === 'burpee' && (
          <>
            {/* 头 */}
            <AnimatedCircle cx={100} animatedProps={burpeeHeadProps} r="10" fill="#fff" />
            {/* 身体（椭圆，会变形成卧姿） */}
            <AnimatedEllipse cx={100} animatedProps={burpeeBodyProps} rx="14" fill={baseColor} />
          </>
        )}

        {subType === 'squat' && (
          <>
            <AnimatedCircle cx={100} animatedProps={squatHeadProps} r="10" fill="#fff" />
            <AnimatedEllipse cx={100} animatedProps={squatTorsoProps} rx="14" ry="20" fill={baseColor} />
            <AnimatedLine animatedProps={squatLegLProps} stroke={baseColor} strokeWidth="5" strokeLinecap="round" />
            <AnimatedLine animatedProps={squatLegRProps} stroke={baseColor} strokeWidth="5" strokeLinecap="round" />
          </>
        )}

        {subType === 'lunge' && (
          <>
            <AnimatedCircle cx={100} animatedProps={lungeHeadProps} r="10" fill="#fff" />
            <AnimatedEllipse cx={100} animatedProps={lungeTorsoProps} rx="14" ry="20" fill={baseColor} />
            <AnimatedLine animatedProps={lungeLegFProps} stroke={baseColor} strokeWidth="5" strokeLinecap="round" />
            <AnimatedLine animatedProps={lungeLegBProps} stroke={baseColor} strokeWidth="5" strokeLinecap="round" />
          </>
        )}

        {subType === 'rope' && (
          <>
            {/* 跳绳 */}
            <AnimatedPath animatedProps={ropePathProps} stroke="#fff" strokeWidth="1.5" fill="none" />
            <AnimatedCircle cx={100} animatedProps={ropeHeadProps} r="10" fill="#fff" />
            <AnimatedEllipse cx={100} animatedProps={ropeTorsoProps} rx="12" ry="18" fill={baseColor} />
            <AnimatedLine animatedProps={ropeLegLProps} stroke={baseColor} strokeWidth="5" strokeLinecap="round" />
            <AnimatedLine animatedProps={ropeLegRProps} stroke={baseColor} strokeWidth="5" strokeLinecap="round" />
          </>
        )}

        {subType === 'plank' && (
          <>
            <AnimatedCircle cx={100} cy={120} animatedProps={plankAura} fill="url(#glow)" />
            {/* 平板支撑横躺 */}
            <Ellipse cx="100" cy="120" rx="40" ry="10" fill={baseColor} />
            <Circle cx="60" cy="120" r="8" fill="#fff" />
            {/* 撑地的胳膊 */}
            <Line x1="60" y1="125" x2="55" y2="145" stroke={baseColor} strokeWidth="4" strokeLinecap="round" />
            {/* 双腿 */}
            <Line x1="138" y1="120" x2="155" y2="145" stroke={baseColor} strokeWidth="4" strokeLinecap="round" />
            <Line x1="138" y1="125" x2="148" y2="145" stroke={baseColor} strokeWidth="4" strokeLinecap="round" />
          </>
        )}

        {subType === 'shuttle-run' && (
          <>
            <AnimatedCircle animatedProps={runHeadProps} cy={90} r="9" fill="#fff" />
            <AnimatedEllipse animatedProps={runTorsoProps} cy={115} rx="11" ry="16" fill={baseColor} />
            <AnimatedLine animatedProps={runLegLProps} stroke={baseColor} strokeWidth="5" strokeLinecap="round" />
            <AnimatedLine animatedProps={runLegRProps} stroke={baseColor} strokeWidth="5" strokeLinecap="round" />
            {/* 端点标记 */}
            <Line x1="50" y1="160" x2="50" y2="170" stroke="#fff" strokeWidth="2" />
            <Line x1="150" y1="160" x2="150" y2="170" stroke="#fff" strokeWidth="2" />
          </>
        )}

        {subType === 'twist' && (
          <>
            {/* 坐姿（V 形）：头 + 上身 + 双腿 */}
            <Circle cx="100" cy="80" r="10" fill="#fff" />
            <Ellipse cx="100" cy="105" rx="12" ry="15" fill={baseColor} />
            {/* 双腿抬起 */}
            <Line x1="100" y1="115" x2="135" y2="100" stroke={baseColor} strokeWidth="5" strokeLinecap="round" />
            <Line x1="100" y1="115" x2="135" y2="110" stroke={baseColor} strokeWidth="5" strokeLinecap="round" />
            {/* 双手抱球，左右转 */}
            <AnimatedLine animatedProps={twistArmProps} stroke="#fff" strokeWidth="3" strokeLinecap="round" />
          </>
        )}

        {subType === 'pulse' && (
          <>
            <AnimatedCircle cx="100" cy="100" animatedProps={pulseProps2} fill="url(#glow)" />
            <AnimatedCircle cx="100" cy="100" animatedProps={pulseProps1} fill={baseColor} />
            <Circle cx="100" cy="100" r="30" fill="#fff" opacity="0.9" />
          </>
        )}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B1220', alignItems: 'center', justifyContent: 'center' },
});
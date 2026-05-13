import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Line, Rect } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withTiming, Easing, withRepeat, withSequence, withDelay, useAnimatedReaction } from 'react-native-reanimated';
import { colors } from '@/theme/tokens';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedLine = Animated.createAnimatedComponent(Line);

// 场地尺寸 200 x 400, 中心 (100, 200) 为球网
// 上半场 (0-200) 为对方，下半场 (200-400) 为我方
export function ShuttlecockAnimation({ type = 'shuttle-clear' }: { type?: string }) {
  const progress = useSharedValue(0);
  
  // 增加随机偏移量，模拟多球训练的不同位置
  const randomOffsetX = useSharedValue(0);
  const randomEndOffsetX = useSharedValue(0);

  // 配置各种球路的 起点(下半场) 和 终点(上半场) 以及 Z轴最大高度
  const getTrajectory = () => {
    switch (type) {
      case 'shuttle-smash': // 杀球：我方中后场 -> 对方两腰，直线极速，高度低
        return { startX: 100, startY: 320, endX: 40, endY: 120, maxZ: 30 };
      case 'shuttle-drop': // 吊球：我方后场 -> 对方网前对角线，速度中等，高度一般
        return { startX: 160, startY: 360, endX: 40, endY: 180, maxZ: 50 };
      case 'shuttle-cross-net': // 勾对角：我方左网前 -> 对方右网前，沿网带斜飞
        return { startX: 40, startY: 220, endX: 160, endY: 180, maxZ: 25 };
      case 'shuttle-net': // 直线搓球：贴网过
        return { startX: 70, startY: 220, endX: 70, endY: 180, maxZ: 15 };
      case 'shuttle-lift': // 挑球：我方网前 -> 对方底线，高度极高
        return { startX: 50, startY: 230, endX: 160, endY: 20, maxZ: 100 };
      case 'shuttle-push': // 推后场：我方网前 -> 对方中后场，弧度小，飞行平直
        return { startX: 70, startY: 220, endX: 160, endY: 70, maxZ: 30 };
      case 'shuttle-serve': // 发短球：我方发球线附近 -> 对方T区
        return { startX: 80, startY: 250, endX: 110, endY: 150, maxZ: 20 };
      case 'shuttle-clear': // 高远球：我方底线 -> 对方底线，高度很高
      default:
        return { startX: 140, startY: 380, endX: 140, endY: 20, maxZ: 100 };
    }
  };

  const traj = getTrajectory();

  // 监听动画进度，当一轮结束(退回0)时，重新生成随机落点
  useAnimatedReaction(
    () => progress.value,
    (currentValue, previousValue) => {
      if (previousValue !== null && previousValue > 0.5 && currentValue === 0) {
        const isNet = type.includes('net') || type.includes('serve');
        if (isNet) {
          // 网前球: 小范围的随机抖动
          randomOffsetX.value = Math.random() * 30 - 15;
          randomEndOffsetX.value = Math.random() * 30 - 15;
        } else {
          // 后场球: 在两个明确的底角之间随机选择
          // 50% 选反手底角 (左侧)，50% 选正手底角 (右侧)
          const isMyBackhand = Math.random() < 0.5;
          const isOppBackhand = Math.random() < 0.5;
          
          // 反手底角 X = 50, 正手底角 X = 150
          randomOffsetX.value = isMyBackhand ? (50 - traj.startX) : (150 - traj.startX);
          randomEndOffsetX.value = isOppBackhand ? (50 - traj.endX) : (150 - traj.endX);
        }
      }
    }
  );

  useEffect(() => {
    progress.value = 0;
    // 飞行时间
    const duration = type.includes('smash') ? 500 : 
                     type.includes('push') ? 700 : // 推球比挑球快，比杀球慢，平推
                     type.includes('cross') ? 1000 :
                     type.includes('net') ? 800 :
                     type.includes('drop') ? 900 : 1400;
    progress.value = withRepeat(
      withSequence(
        withTiming(1, { duration, easing: type.includes('smash') ? Easing.in(Easing.quad) : Easing.out(Easing.cubic) }),
        withDelay(600, withTiming(0, { duration: 0 }))
      ),
      -1,
      false
    );
  }, [type]);

  // 阴影坐标：纯 2D 投影
  const shadowProps = useAnimatedProps(() => {
    const t = progress.value;
    const actualStartX = traj.startX + randomOffsetX.value;
    const actualEndX = traj.endX + randomEndOffsetX.value;

    const x = actualStartX + (actualEndX - actualStartX) * t;
    const y = traj.startY + (traj.endY - traj.startY) * t;
    return { cx: x, cy: y };
  });

  // 球的坐标：加入 Z 轴带来的视觉偏差
  const ballProps = useAnimatedProps(() => {
    const t = progress.value;
    const actualStartX = traj.startX + randomOffsetX.value;
    const actualEndX = traj.endX + randomEndOffsetX.value;

    const shadowX = actualStartX + (actualEndX - actualStartX) * t;
    const shadowY = traj.startY + (traj.endY - traj.startY) * t;
    
    const z = traj.maxZ * (4 * t * (1 - t));
    const ballY = shadowY - z;
    const radius = 4 + z * 0.05;

    return { cx: shadowX, cy: ballY, r: radius };
  });

  // 连接球和阴影的垂线
  const zLineProps = useAnimatedProps(() => {
    const t = progress.value;
    const actualStartX = traj.startX + randomOffsetX.value;
    const actualEndX = traj.endX + randomEndOffsetX.value;

    const x = actualStartX + (actualEndX - actualStartX) * t;
    const y = traj.startY + (traj.endY - traj.startY) * t;
    const z = traj.maxZ * (4 * t * (1 - t));
    return { x1: x, y1: y, x2: x, y2: y - z, opacity: z > 5 ? 0.3 : 0 };
  });

  // 我方球拍 (拍杆 line) 起止点
  const myRacketLineProps = useAnimatedProps(() => {
    const t = progress.value;
    const cx = traj.startX + randomOffsetX.value;
    const cy = traj.startY;
    const deg = t < 0.2 ? -60 + t * 5 * 105 : 45;
    const angleRad = deg * Math.PI / 180;
    const rx = cx + 15 * Math.cos(angleRad);
    const ry = cy - 8 - 15 * Math.sin(angleRad);
    return { x1: cx, y1: cy - 8, x2: rx, y2: ry };
  });

  // 我方球拍 (拍面 circle)
  const myRacketHeadProps = useAnimatedProps(() => {
    const t = progress.value;
    const cx = traj.startX + randomOffsetX.value;
    const cy = traj.startY;
    const deg = t < 0.2 ? -60 + t * 5 * 105 : 45;
    const angleRad = deg * Math.PI / 180;
    const rx = cx + 20 * Math.cos(angleRad);
    const ry = cy - 8 - 20 * Math.sin(angleRad);
    return { cx: rx, cy: ry };
  });

  // 对方球拍
  const oppRacketLineProps = useAnimatedProps(() => {
    const t = progress.value;
    const cx = traj.endX + randomEndOffsetX.value;
    const cy = traj.endY;
    const deg = t > 0.8 ? 45 - (t - 0.8) * 5 * 105 : 45;
    const angleRad = deg * Math.PI / 180;
    const rx = cx + 15 * Math.cos(angleRad);
    const ry = cy - 8 - 15 * Math.sin(angleRad);
    return { x1: cx, y1: cy - 8, x2: rx, y2: ry };
  });

  const oppRacketHeadProps = useAnimatedProps(() => {
    const t = progress.value;
    const cx = traj.endX + randomEndOffsetX.value;
    const cy = traj.endY;
    const deg = t > 0.8 ? 45 - (t - 0.8) * 5 * 105 : 45;
    const angleRad = deg * Math.PI / 180;
    const rx = cx + 20 * Math.cos(angleRad);
    const ry = cy - 8 - 20 * Math.sin(angleRad);
    return { cx: rx, cy: ry };
  });

  // 头部、躯干等的 cy 值需要不同的偏移
  const myBodyProps = useAnimatedProps(() => ({
    cx: traj.startX + randomOffsetX.value,
  }));
  const oppBodyProps = useAnimatedProps(() => ({
    cx: traj.endX + randomEndOffsetX.value,
  }));

  // 人物占位符坐标 (基准 X 坐标)
  const playerProps = useAnimatedProps(() => {
    return { cx: traj.startX + randomOffsetX.value };
  });
  
  const opponentProps = useAnimatedProps(() => {
    return { cx: traj.endX + randomEndOffsetX.value };
  });

  const pathProps = useAnimatedProps(() => {
    const sx = traj.startX + randomOffsetX.value;
    const ex = traj.endX + randomEndOffsetX.value;
    return { x1: sx, x2: ex };
  });

  const renderNet = () => (
    <React.Fragment>
      {/* 左右侧网柱 */}
      <Line x1="10" y1="200" x2="10" y2="170" stroke="#bdc3c7" strokeWidth="2.5" />
      <Line x1="190" y1="200" x2="190" y2="170" stroke="#bdc3c7" strokeWidth="2.5" />
      {/* 网格半透明背景 */}
      <Rect x="10" y="170" width="180" height="30" fill="#fff" opacity="0.15" />
      {/* 竖向网格线 */}
      {[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18].map(i => (
        <Line key={`v${i}`} x1={10 + i * 10} y1="170" x2={10 + i * 10} y2="200" stroke="#fff" strokeWidth="0.5" opacity="0.4" />
      ))}
      {/* 横向网格线 */}
      {[0,1,2,3].map(i => (
        <Line key={`h${i}`} x1="10" y1={170 + i * 10} x2="190" y2={170 + i * 10} stroke="#fff" strokeWidth="0.5" opacity="0.4" />
      ))}
      {/* 网上沿白边 */}
      <Line x1="10" y1="170" x2="190" y2="170" stroke="#fff" strokeWidth="2.5" />
      {/* 中场红线 (网底线) */}
      <Line x1="10" y1="200" x2="190" y2="200" stroke="#FF4136" strokeWidth="3" />
    </React.Fragment>
  );

  return (
    <View style={styles.container}>
      <View style={styles.isometricWrapper}>
        <Svg width="100%" height="100%" viewBox="-50 0 300 400" preserveAspectRatio="xMidYMid meet">
          {/* 全场绿底 */}
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

                    {/* 对手 (上半场) */}
          <AnimatedCircle animatedProps={oppBodyProps} cy={traj.endY} r="8" fill="#000" opacity="0.3" />
          <AnimatedCircle animatedProps={oppBodyProps} cy={traj.endY - 6} r="6" fill={colors.danger} />
          <AnimatedCircle animatedProps={oppBodyProps} cy={traj.endY - 14} r="4" fill="#fff" />
          <AnimatedLine animatedProps={oppRacketLineProps} stroke="#fff" strokeWidth="1.5" />
          <AnimatedCircle animatedProps={oppRacketHeadProps} r="4" fill="none" stroke="#fff" strokeWidth="1" />
          
          {/* 立体球网 */}
          {renderNet()}

          {/* 我方 (下半场) */}
          <AnimatedCircle animatedProps={myBodyProps} cy={traj.startY} r="8" fill="#000" opacity="0.3" />
          <AnimatedCircle animatedProps={myBodyProps} cy={traj.startY - 6} r="6" fill={colors.primary} />
          <AnimatedCircle animatedProps={myBodyProps} cy={traj.startY - 14} r="4" fill="#fff" />
          <AnimatedLine animatedProps={myRacketLineProps} stroke="#fff" strokeWidth="1.5" />
          <AnimatedCircle animatedProps={myRacketHeadProps} r="4" fill="none" stroke="#fff" strokeWidth="1" />
          
          {/* 球击打的辅助虚线 */}
          <AnimatedLine animatedProps={pathProps} y1={traj.startY} y2={traj.endY} stroke="#fff" strokeWidth="1" strokeDasharray="4,4" opacity="0.3" />

          {/* 阴影 */}
          <AnimatedCircle animatedProps={shadowProps} r="4" fill="#000" opacity="0.5" />
          
          {/* 阴影到球的连线 (营造 3D 立体空间感) */}
          <AnimatedLine animatedProps={zLineProps} stroke="#fff" strokeWidth="1" strokeDasharray="2,2" />
          
          {/* 真正的羽毛球实体 (在最高层级，飞跃球网) */}
          <AnimatedCircle animatedProps={ballProps} fill="#fff" />
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B1220', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  // 通过 3D 变换把原本扁平的俯视图斜面化
  isometricWrapper: {
    width: '100%',
    height: '100%',
    transform: [
      { rotateX: '55deg' },  // 把场地推倒
      { rotateZ: '-30deg' }, // 斜着看
      { scale: 1.3 }         // 放大弥补推倒后的视觉缩小
    ]
  }
});
import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { Polygon, Circle, Text as SvgText, Line } from 'react-native-svg';
import { colors, font, spacing } from '@/theme/tokens';

export function GripGuide({ type }: { type: 'forehand' | 'backhand' | 'pan' }) {
  // 球拍八边形截面的顶点坐标 (中心点为 100, 100)
  // 宽面(上下), 窄面(左右), 斜面(四个角)
  const octagon = "70,40 130,40 150,60 150,140 130,160 70,160 50,140 50,60";

  // 根据握拍类型确定手指位置
  // cx, cy: 坐标
  // r: 接触面积大小
  const getFingers = () => {
    switch (type) {
      case 'forehand':
        return [
          { name: '拇指', cx: 55, cy: 120, r: 12, desc: '轻贴斜棱 (虎口对准窄棱)' },
          { name: '食指', cx: 145, cy: 80, r: 14, desc: '扣住对面斜棱 (像握手)' },
        ];
      case 'backhand':
        return [
          { name: '拇指', cx: 100, cy: 40, r: 16, desc: '顶住宽面 (发力点)' },
          { name: '食指', cx: 140, cy: 100, r: 10, desc: '轻靠窄面辅助' },
        ];
      case 'pan': // 苍蝇拍 (错误示范)
        return [
          { name: '拇指', cx: 50, cy: 100, r: 14, desc: '错误: 贴在窄面' },
          { name: '食指', cx: 150, cy: 100, r: 14, desc: '错误: 贴在对面窄面' },
        ];
    }
  };

  const fingers = getFingers();

  return (
    <View style={styles.container}>
      <Svg width="100%" height="200" viewBox="0 0 200 200">
        {/* 球拍柄 8 边形剖面 */}
        <Polygon points={octagon} fill={colors.cardAlt} stroke={colors.border} strokeWidth="3" />
        
        {/* 宽面/窄面说明辅助线 */}
        <SvgText x="100" y="25" fill={colors.textDim} fontSize="10" textAnchor="middle">宽面</SvgText>
        <SvgText x="25" y="104" fill={colors.textDim} fontSize="10" textAnchor="middle">窄面</SvgText>
        
        {/* 虎口 V 字标示线 (仅正手显示) */}
        {type === 'forehand' && (
          <Line x1="100" y1="100" x2="50" y2="60" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeDasharray="4,4" />
        )}

        {/* 手指接触点 */}
        {fingers.map((f, i) => (
          <React.Fragment key={i}>
            {/* 发光模糊背板 */}
            <Circle cx={f.cx} cy={f.cy} r={f.r + 6} fill={i === 0 ? colors.primary : colors.accent} opacity="0.3" />
            <Circle cx={f.cx} cy={f.cy} r={f.r} fill={i === 0 ? colors.primary : colors.accent} />
            <SvgText x={f.cx} y={f.cy + 4} fill="#fff" fontSize="12" fontWeight="bold" textAnchor="middle">
              {f.name}
            </SvgText>
          </React.Fragment>
        ))}
      </Svg>

      <View style={styles.legend}>
        <Text style={styles.legendTitle}>
          {type === 'forehand' ? '✅ 正手基础握拍' : type === 'backhand' ? '✅ 反手基础握拍' : '❌ 苍蝇拍 (错误)'}
        </Text>
        {fingers.map((f, i) => (
          <Text key={i} style={styles.legendDesc}>
            <Text style={{ color: i === 0 ? colors.primary : colors.accent, fontWeight: 'bold' }}>● {f.name}</Text>: {f.desc}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0B1220',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginTop: spacing.md,
  },
  legend: {
    padding: spacing.md,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  legendTitle: {
    color: colors.text,
    fontSize: font.body,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  legendDesc: {
    color: colors.textDim,
    fontSize: font.small,
    marginTop: 4,
  }
});
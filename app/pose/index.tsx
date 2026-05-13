import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { colors, font, spacing, radius } from '@/theme/tokens';
import { Card } from '@/components/Card';

export default function PoseScreen() {
  return (
    <Screen scroll={false}>
      <View style={styles.container}>
        <View style={styles.iconWrap}>
          <Text style={{ fontSize: 72 }}>🤖</Text>
        </View>
        <Text style={styles.title}>AI 私教实验室</Text>
        <Text style={styles.subTitle}>即将到来</Text>
        
        <Card style={styles.card}>
          <Text style={styles.featureTitle}>✨ 正在研发中的黑科技：</Text>
          
          <View style={styles.row}>
            <Text style={styles.check}>✓</Text>
            <Text style={styles.desc}>基于手机摄像头的 33 点骨骼追踪</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.check}>✓</Text>
            <Text style={styles.desc}>正手高远球：自动检测引拍肘部高度、侧身角度</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.check}>✓</Text>
            <Text style={styles.desc}>网前球：自动判断击球点是否在身前最高点</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.check}>✓</Text>
            <Text style={styles.desc}>步法分析：计算全场跑动重心与回中效率</Text>
          </View>
        </Card>
        
        <Text style={styles.footerText}>
          由于最新移动端 C++ 模型推理库仍在适配新架构，为了保证您的流畅体验，此功能暂时封印。
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: spacing.xxl,
  },
  iconWrap: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    borderWidth: 4,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
  },
  title: {
    color: colors.text,
    fontSize: font.h1,
    fontWeight: '800',
  },
  subTitle: {
    color: colors.primary,
    fontSize: font.h3,
    fontWeight: '700',
    marginTop: spacing.sm,
    letterSpacing: 4,
  },
  card: {
    marginTop: spacing.xxl,
    width: '100%',
    padding: spacing.lg,
    backgroundColor: colors.card,
  },
  featureTitle: {
    color: colors.text,
    fontSize: font.h3,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  check: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: '900',
    marginRight: spacing.sm,
  },
  desc: {
    color: colors.textDim,
    fontSize: font.body,
    flex: 1,
    lineHeight: 22,
  },
  footerText: {
    color: colors.border,
    fontSize: font.small,
    textAlign: 'center',
    marginTop: 'auto',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
  }
});

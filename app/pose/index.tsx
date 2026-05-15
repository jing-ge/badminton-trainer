import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { colors, font, radius, spacing } from '@/theme/tokens';
import { Card } from '@/components/Card';
import { findTutorial } from '@/data/tutorials';

export default function PoseScreen() {
  const { tutorial } = useLocalSearchParams<{ tutorial?: string }>();
  const router = useRouter();
  const fromTutorial = tutorial ? findTutorial(tutorial) : undefined;

  return (
    <Screen scroll={false}>
      <View style={styles.container}>
        {fromTutorial && (
          <View style={styles.fromBar}>
            <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={18} color={colors.text} />
              <Text style={styles.backText}>返回 {fromTutorial.title}</Text>
            </Pressable>
          </View>
        )}

        <View style={styles.iconWrap}>
          <Text style={{ fontSize: 72 }}>🤖</Text>
        </View>
        <Text style={styles.title}>AI 私教实验室</Text>
        <Text style={styles.subTitle}>即将到来</Text>

        {fromTutorial && (
          <View style={styles.targetCard}>
            <Text style={styles.targetLabel}>你将要检测的动作</Text>
            <Text style={styles.targetTitle}>{fromTutorial.title}</Text>
            <Text style={styles.targetMeta}>{fromTutorial.category} · {fromTutorial.level}</Text>
          </View>
        )}

        <Card style={styles.card}>
          <Text style={styles.featureTitle}>✨ 正在研发中的黑科技：</Text>

          <View style={styles.row}>
            <Text style={styles.check}>✓</Text>
            <Text style={styles.desc}>基于手机摄像头的 33 点全身骨骼追踪</Text>
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
          这个功能需要在手机端做实时姿态识别,目前仍在打磨中。我们承诺不会用一个半成品的"识别"骗你,所以暂时把它放在实验室里。下次大版本更新见！
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', paddingTop: spacing.xxl },
  fromBar: { width: '100%', alignItems: 'flex-start', marginBottom: spacing.md, position: 'absolute', top: 0, left: 0, paddingHorizontal: spacing.md, paddingVertical: spacing.md },
  backBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cardAlt, paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.pill, gap: 2 },
  backText: { color: colors.text, fontSize: font.small, fontWeight: '600' },
  iconWrap: { width: 140, height: 140, borderRadius: 70, backgroundColor: colors.cardAlt, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg, borderWidth: 4, borderColor: colors.primary, shadowColor: colors.primary, shadowOpacity: 0.5, shadowRadius: 20, shadowOffset: { width: 0, height: 0 } },
  title: { color: colors.text, fontSize: font.h1, fontWeight: '800' },
  subTitle: { color: colors.primary, fontSize: font.h3, fontWeight: '700', marginTop: spacing.sm, letterSpacing: 4 },
  targetCard: {
    marginTop: spacing.lg,
    width: '100%',
    padding: spacing.md,
    backgroundColor: colors.cardAlt,
    borderRadius: radius.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  targetLabel: { color: colors.textDim, fontSize: font.tiny },
  targetTitle: { color: colors.text, fontSize: font.h3, fontWeight: '700', marginTop: 2 },
  targetMeta: { color: colors.primary, fontSize: font.small, marginTop: 2 },
  card: { marginTop: spacing.xxl, width: '100%', padding: spacing.lg, backgroundColor: colors.card },
  featureTitle: { color: colors.text, fontSize: font.h3, fontWeight: '700', marginBottom: spacing.md },
  row: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.md },
  check: { color: colors.primary, fontSize: 20, fontWeight: '900', marginRight: spacing.sm },
  desc: { color: colors.textDim, fontSize: font.body, flex: 1, lineHeight: 22 },
  footerText: { color: colors.border, fontSize: font.small, textAlign: 'center', marginTop: 'auto', marginBottom: spacing.xl, paddingHorizontal: spacing.xl }
});

import { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '@/theme/tokens';

export function Screen({
  children,
  scroll = true,
  transparent = false,
  topEdge = false,
}: {
  children: ReactNode;
  scroll?: boolean;
  transparent?: boolean;
  /** 仅当本屏没有 Stack/Tabs header 时设 true，让 SafeAreaView 自己处理 top 安全区。
   * 默认 false：导航器 header 已经吃掉 top inset，再加一遍会出现 ~80px 空白带。 */
  topEdge?: boolean;
}) {
  const edges = topEdge ? (['top', 'bottom'] as const) : (['bottom'] as const);
  return (
    <SafeAreaView style={[styles.safe, transparent && { backgroundColor: 'transparent' }]} edges={edges}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, { flex: 1 }]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
});

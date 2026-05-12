import { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { colors, radius, spacing } from '@/theme/tokens';

export function Card({
  children,
  style,
  alt,
}: {
  children: ReactNode;
  style?: ViewStyle;
  alt?: boolean;
}) {
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: alt ? colors.cardAlt : colors.card },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
});

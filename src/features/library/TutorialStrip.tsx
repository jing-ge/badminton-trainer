import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, font, radius, spacing } from '@/theme/tokens';
import type { Tutorial } from '@/data/tutorials';

export type TutorialWithBadge = Tutorial & { badge?: string };

const CATEGORY_EMOJI: Record<Tutorial['category'], string> = {
  后场: '🏸',
  前场: '🤚',
  步法: '👣',
  发球: '🎯',
  战术: '🧠',
};

/**
 * 横滑教程带（用于 Library 顶部"我的收藏"/"最近浏览"）。
 * items 为空时整个组件不渲染，避免父级出现空洞。
 */
export function TutorialStrip({
  title,
  items,
}: {
  title: string;
  items: TutorialWithBadge[];
}) {
  const router = useRouter();
  if (items.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {items.map((it) => (
          <Pressable
            key={it.id}
            onPress={() => router.push(`/tutorial/${it.id}`)}
            style={({ pressed }) => [styles.card, { opacity: pressed ? 0.7 : 1 }]}
          >
            {it.badge ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{it.badge}</Text>
              </View>
            ) : null}
            <Text style={styles.emoji}>{CATEGORY_EMOJI[it.category]}</Text>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {it.title}
            </Text>
            <View style={styles.tag}>
              <Text style={styles.tagText}>{it.level}</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: spacing.md },
  title: { color: colors.primary, fontSize: font.h3, fontWeight: '700', marginBottom: spacing.sm },
  scroll: { gap: spacing.md, paddingRight: spacing.md },
  card: {
    width: 140,
    backgroundColor: colors.cardAlt,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  emoji: { fontSize: 28 },
  cardTitle: { color: colors.text, fontSize: font.body, fontWeight: '700' },
  tag: {
    alignSelf: 'flex-start',
    backgroundColor: colors.card,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
    marginTop: spacing.xs,
  },
  tagText: { color: colors.primary, fontSize: font.tiny, fontWeight: '700' },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: colors.card,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
    zIndex: 1,
  },
  badgeText: { color: colors.textDim, fontSize: font.tiny, fontWeight: '600' },
});

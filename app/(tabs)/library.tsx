import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { colors, font, radius, spacing } from '@/theme/tokens';
import { tutorials, Tutorial } from '@/data/tutorials';

const CATEGORIES = ['全部', '后场', '前场', '步法', '发球', '战术'] as const;

export default function LibraryScreen() {
  const router = useRouter();
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>('全部');

  const filtered = cat === '全部' ? tutorials : tutorials.filter((t) => t.category === cat);

  return (
    <Screen>
      <Text style={styles.title}>技术动作教程</Text>
      <Text style={styles.sub}>共 {tutorials.length} 个要点 · 业余中级适用</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabs}
      >
        {CATEGORIES.map((c) => (
          <Pressable
            key={c}
            onPress={() => setCat(c)}
            style={[
              styles.tab,
              cat === c && { backgroundColor: colors.primary, borderColor: colors.primary },
            ]}
          >
            <Text style={{ color: cat === c ? '#fff' : colors.textDim, fontWeight: '600' }}>{c}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={{ marginTop: spacing.md }}>
        {filtered.map((t) => (
          <TutorialCard key={t.id} t={t} onPress={() => router.push(`/tutorial/${t.id}`)} />
        ))}
      </View>
    </Screen>
  );
}

function TutorialCard({ t, onPress }: { t: Tutorial; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
      <Card style={{ marginBottom: spacing.md }}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{t.title}</Text>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{t.level}</Text>
          </View>
        </View>
        <Text style={styles.cardCat}>{t.category}</Text>
        <View style={styles.points}>
          {t.keyPoints.slice(0, 2).map((p, i) => (
            <Text key={i} style={styles.point} numberOfLines={1}>
              · {p}
            </Text>
          ))}
        </View>
        <Text style={styles.more}>查看全部 {t.keyPoints.length} 个要点 →</Text>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: font.h1, fontWeight: '700' },
  sub: { color: colors.textDim, marginTop: 4 },
  tabs: { gap: spacing.sm, paddingVertical: spacing.md },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { color: colors.text, fontSize: font.h3, fontWeight: '700' },
  tag: {
    backgroundColor: colors.cardAlt,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  tagText: { color: colors.primary, fontSize: font.tiny, fontWeight: '700' },
  cardCat: { color: colors.textDim, fontSize: font.small, marginTop: 4 },
  points: { marginTop: spacing.md, gap: 4 },
  point: { color: colors.text, fontSize: font.small },
  more: { color: colors.primary, fontSize: font.small, marginTop: spacing.md },
});

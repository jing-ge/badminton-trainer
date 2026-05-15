import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import dayjs from 'dayjs';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { colors, font, radius, spacing } from '@/theme/tokens';
import { tutorials, Tutorial, findTutorial } from '@/data/tutorials';
import { listFavoriteIds, listRecentViews } from '@/db/tutorials';
import { TutorialStrip, TutorialWithBadge } from '@/features/library/TutorialStrip';

const CATEGORIES = ['全部', '后场', '前场', '步法', '发球', '战术'] as const;

function humanizeAgo(viewedAt: number): string {
  const days = dayjs().startOf('day').diff(dayjs(viewedAt).startOf('day'), 'day');
  if (days <= 0) return '今天';
  if (days === 1) return '昨天';
  if (days < 7) return `${days} 天前`;
  return dayjs(viewedAt).format('M/D');
}

export default function LibraryScreen() {
  const router = useRouter();
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>('全部');
  const [query, setQuery] = useState('');
  const [favorites, setFavorites] = useState<TutorialWithBadge[]>([]);
  const [recents, setRecents] = useState<TutorialWithBadge[]>([]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const favIds = await listFavoriteIds();
        const favs = favIds
          .map((id) => findTutorial(id))
          .filter((t): t is Tutorial => Boolean(t));
        setFavorites(favs);

        const views = await listRecentViews(6);
        const recs: TutorialWithBadge[] = [];
        for (const v of views) {
          const t = findTutorial(v.id);
          if (t) recs.push({ ...t, badge: humanizeAgo(v.viewedAt) });
        }
        setRecents(recs);
      })();
    }, []),
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tutorials.filter((t) => {
      if (cat !== '全部' && t.category !== cat) return false;
      if (!q) return true;
      if (t.title.toLowerCase().includes(q)) return true;
      if (t.keyPoints.some((p) => p.toLowerCase().includes(q))) return true;
      return false;
    });
  }, [cat, query]);

  return (
    <Screen>
      <Text style={styles.title}>技术动作教程</Text>
      <Text style={styles.sub}>共 {tutorials.length} 个要点 · 业余中级适用</Text>

      <TutorialStrip title="⭐ 我的收藏" items={favorites} />
      <TutorialStrip title="⏱ 最近浏览" items={recents} />

      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="搜索动作名或要点..."
          placeholderTextColor={colors.textDim}
          style={styles.searchInput}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <Pressable hitSlop={8} onPress={() => setQuery('')}>
            <Text style={styles.clearBtn}>✕</Text>
          </Pressable>
        )}
      </View>

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
        {filtered.length === 0 ? (
          <Card>
            <Text style={styles.empty}>没有匹配到动作要点</Text>
            <Text style={styles.emptyHint}>试试换个关键词,或清除分类筛选</Text>
          </Card>
        ) : (
          filtered.map((t) => (
            <TutorialCard key={t.id} t={t} onPress={() => router.push(`/tutorial/${t.id}`)} />
          ))
        )}
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
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardAlt,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  searchIcon: { fontSize: font.body },
  searchInput: { flex: 1, color: colors.text, fontSize: font.body, padding: 0 },
  clearBtn: { color: colors.textDim, fontSize: font.body, paddingHorizontal: 4 },
  empty: { color: colors.text, textAlign: 'center', fontSize: font.body, paddingVertical: spacing.md },
  emptyHint: { color: colors.textDim, textAlign: 'center', fontSize: font.small, marginTop: 4 },
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

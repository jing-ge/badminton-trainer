import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { colors, font, radius, spacing } from '@/theme/tokens';
import { deleteReplayClip, insertReplayClip, listReplayClips } from '@/db/repos';
import { vibrateLight } from '@/utils/haptics';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

// 本文件首次引入 relativeTime / zh-cn locale（grep 全仓未见 extend），安全直接 extend
dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

type FilterKey = 'all' | 'pending' | 'annotated';

export default function ReplayList() {
  const router = useRouter();
  const [clips, setClips] = useState<any[]>([]);
  const [filter, setFilter] = useState<FilterKey>('all');

  async function reload() {
    setClips(await listReplayClips());
  }

  useEffect(() => {
    reload();
  }, []);

  async function pickVideo() {
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: false,
      quality: 1,
    });
    if (r.canceled) return;
    const v = r.assets[0];
    await insertReplayClip({ uri: v.uri, title: dayjs().format('YYYY-MM-DD HH:mm') + ' 录像' });
    await reload();
  }

  async function del(id: number) {
    Alert.alert('删除录像？', '本地视频文件不会被删除', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          await deleteReplayClip(id);
          await reload();
        },
      },
    ]);
  }

  const totalAnnos = clips.reduce((a, c) => a + (c.annotations?.length ?? 0), 0);

  // 三个桶计数 + 过滤后的列表（Hero 累计统计仍用原 clips）
  const counts = useMemo(() => {
    let pending = 0;
    let annotated = 0;
    for (const c of clips) {
      if ((c.annotations?.length ?? 0) === 0) pending++;
      else annotated++;
    }
    return { all: clips.length, pending, annotated };
  }, [clips]);

  const filteredClips = useMemo(() => {
    if (filter === 'pending') return clips.filter((c) => (c.annotations?.length ?? 0) === 0);
    if (filter === 'annotated') return clips.filter((c) => (c.annotations?.length ?? 0) > 0);
    return clips;
  }, [clips, filter]);

  const FILTER_DEFS: { key: FilterKey; label: string; count: number }[] = [
    { key: 'all', label: '全部', count: counts.all },
    { key: 'pending', label: '待标注', count: counts.pending },
    { key: 'annotated', label: '已标注', count: counts.annotated },
  ];

  return (
    <Screen>
      <Text style={styles.title}>对战录像复盘</Text>
      <Text style={styles.sub}>导入本地比赛视频，逐段标注问题点</Text>

      {/* v0.21 hero 引导条 */}
      <Card style={styles.heroCard}>
        {clips.length === 0 ? (
          <>
            <Text style={styles.heroEmoji}>📹</Text>
            <Text style={styles.heroTitle}>把比赛录像变成可复盘的训练资料</Text>
            <Text style={styles.heroSub}>导入视频后，可以暂停标注每个关键点</Text>
          </>
        ) : (
          <Text style={styles.heroStat}>
            共 <Text style={styles.heroStatNum}>{clips.length}</Text> 段录像 · 累计{' '}
            <Text style={styles.heroStatNum}>{totalAnnos}</Text> 条标注
          </Text>
        )}
      </Card>

      {/* v0.36 过滤 chip 行 */}
      {clips.length > 0 && (
        <View style={styles.chipRow}>
          {FILTER_DEFS.map((f) => {
            const active = filter === f.key;
            return (
              <Pressable
                key={f.key}
                onPress={() => {
                  vibrateLight();
                  setFilter(f.key);
                }}
                style={({ pressed }) => [
                  styles.chip,
                  active && { backgroundColor: colors.primary, borderColor: colors.primary },
                  { opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Text style={{ color: active ? '#fff' : colors.textDim, fontWeight: '600' }}>
                  {f.label} {f.count}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      <Button title="+ 从相册导入视频" onPress={pickVideo} style={{ marginTop: spacing.md }} />

      <View style={{ marginTop: spacing.lg }}>
        {clips.length === 0 ? (
          <Card>
            <Text style={styles.empty}>🎥 还没导入录像，点上方按钮从相册添加</Text>
          </Card>
        ) : filteredClips.length === 0 ? (
          <Card>
            <Text style={styles.empty}>
              {filter === 'annotated'
                ? '🎯 太棒了，所有录像都已标注完'
                : '📝 还没有待标注的录像'}
            </Text>
          </Card>
        ) : (
          filteredClips.map((c) => {
            const annoCount: number = c.annotations?.length ?? 0;
            const annotated = annoCount > 0;
            // 最近一条 = time_ms 最大的那条
            const latest = annotated
              ? c.annotations.reduce(
                  (a: any, b: any) => (a.time_ms >= b.time_ms ? a : b),
                  c.annotations[0],
                )
              : null;
            const createdAt = c.created_at as number | undefined;
            const relative = createdAt ? dayjs(createdAt).fromNow() : '';
            const dateStr = createdAt ? dayjs(createdAt).format('YYYY-MM-DD') : '';

            return (
              // 外层容器：让 trash 按钮与跳转 Pressable 同级（绝对定位的同胞）
              <View key={c.id} style={styles.clipWrap}>
                <Pressable
                  onPress={() => router.push(`/replay/${c.id}`)}
                  onLongPress={() => del(c.id)}
                  style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                >
                  <Card
                    style={{
                      ...styles.clipCard,
                      borderColor: annotated ? colors.primary : colors.border,
                      borderWidth: 1,
                    }}
                  >
                    <View style={styles.row}>
                      <Text style={{ fontSize: 32 }}>{annotated ? '✍️' : '🎬'}</Text>
                      <View style={{ flex: 1, marginLeft: spacing.md }}>
                        <View style={styles.titleRow}>
                          <Text style={styles.clipTitle} numberOfLines={1}>
                            {c.title}
                          </Text>
                          {relative ? <Text style={styles.relTime}>{relative}</Text> : null}
                        </View>
                        <Text style={annotated ? styles.metaLine : styles.metaLinePending}>
                          {dateStr ? `📅 ${dateStr}` : ''}
                          {dateStr ? ' · ' : ''}
                          {annotated ? `📝 ${annoCount} 条标注` : '📝 待标注'}
                        </Text>
                        {annotated && latest ? (
                          <Text style={styles.latestLine} numberOfLines={1}>
                            🏷 {latest.tag}
                            {latest.note ? ` · ${String(latest.note).slice(0, 16)}` : ''}
                          </Text>
                        ) : null}
                      </View>
                      <Text style={{ color: colors.textDim, fontSize: 22 }}>›</Text>
                    </View>
                  </Card>
                </Pressable>
                {/* 独立的删除按钮（与跳转 Pressable 同级） */}
                <Pressable
                  hitSlop={8}
                  onPress={() => del(c.id)}
                  style={styles.trashBtn}
                >
                  <Text style={styles.trashText}>🗑</Text>
                </Pressable>
              </View>
            );
          })
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: font.h1, fontWeight: '700' },
  sub: { color: colors.textDim, marginTop: 4 },
  empty: { color: colors.textDim, textAlign: 'center', padding: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center' },
  clipWrap: { position: 'relative', marginBottom: spacing.md },
  clipCard: { position: 'relative' },
  titleRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: spacing.sm },
  clipTitle: { color: colors.text, fontWeight: '600', flex: 1 },
  relTime: { color: colors.textDim, fontSize: font.tiny },
  metaLine: { color: colors.textDim, fontSize: font.small, marginTop: 2 },
  metaLinePending: { color: colors.textDim, fontSize: font.small, marginTop: 2 },
  latestLine: { color: colors.textDim, fontSize: font.small, marginTop: 2 },
  // v0.36 chip 行：参考 library.tsx CATEGORIES
  chipRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  // 右下角独立 trash 按钮
  trashBtn: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    padding: 4,
    opacity: 0.6,
  },
  trashText: { color: colors.textDim, fontSize: font.body },
  // v0.21 hero
  heroCard: { marginTop: spacing.lg, backgroundColor: colors.cardAlt, alignItems: 'center' },
  heroEmoji: { fontSize: 36, marginBottom: spacing.sm },
  heroTitle: { color: colors.text, fontSize: font.body, fontWeight: '700', textAlign: 'center' },
  heroSub: { color: colors.textDim, fontSize: font.small, marginTop: 4, textAlign: 'center' },
  heroStat: { color: colors.textDim, fontSize: font.body, textAlign: 'center' },
  heroStatNum: { color: colors.primary, fontWeight: '800' },
});

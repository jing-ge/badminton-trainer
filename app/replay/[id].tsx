import { useEffect, useRef, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { colors, font, radius, spacing } from '@/theme/tokens';
import { listReplayClips, updateReplayAnnotations } from '@/db/repos';
import { vibrateLight } from '@/utils/haptics';

type Annotation = { time_ms: number; tag: string; note: string };

// 7 个高频标签，覆盖步法/技术/战术/正向反馈
const PRESET_TAGS = ['步法慢', '击球点低', '回中慢', '判断错', '发力错', '站位偏', '好球✨'];

export default function ReplayDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const videoRef = useRef<Video>(null);
  const [clip, setClip] = useState<any>(null);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [tag, setTag] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    (async () => {
      const all = await listReplayClips();
      const c = all.find((x: any) => x.id === Number(id));
      if (c) {
        setClip(c);
        setAnnotations(c.annotations);
      }
    })();
  }, [id]);

  function onStatus(s: AVPlaybackStatus) {
    if ('positionMillis' in s) {
      setPosition(s.positionMillis ?? 0);
      if (s.durationMillis) setDuration(s.durationMillis);
    }
  }

  // 任何"标注意图"动作触发：用可选链兜底，无视频时静默跳过
  async function pauseVideo() {
    await videoRef.current?.pauseAsync().catch(() => {});
  }

  function pickTag(t: string) {
    setTag(t);
    pauseVideo();
    vibrateLight();
  }

  async function nudge(deltaMs: number) {
    // clamp：下界 0；上界优先 duration，未知时用 position+delta 自身（避免锁死）
    const upper = duration > 0 ? duration : position + Math.abs(deltaMs);
    const next = Math.max(0, Math.min(upper, position + deltaMs));
    setPosition(next);
    await videoRef.current?.setPositionAsync(next).catch(() => {});
  }

  async function addAnnotation() {
    if (!tag.trim()) {
      Alert.alert('请输入标签');
      return;
    }
    const next = [...annotations, { time_ms: position, tag: tag.trim(), note: note.trim() }].sort(
      (a, b) => a.time_ms - b.time_ms,
    );
    setAnnotations(next);
    setTag('');
    setNote('');
    vibrateLight();
    await updateReplayAnnotations(Number(id), next);
  }

  async function jumpTo(ms: number) {
    await videoRef.current?.setPositionAsync(ms);
  }

  // 删除前二次确认，对齐 schedule/index.tsx 范式
  function confirmRemove(idx: number) {
    const a = annotations[idx];
    const summary = `#${String(idx + 1).padStart(2, '0')} ${fmt(a.time_ms)} · ${a.tag}`;
    const doRemove = async () => {
      const next = annotations.filter((_, i) => i !== idx);
      setAnnotations(next);
      await updateReplayAnnotations(Number(id), next);
    };
    if (Platform.OS === 'web') {
      if (window.confirm(`删除这条标注?\n${summary}`)) doRemove();
      return;
    }
    Alert.alert('删除这条标注?', summary, [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: doRemove },
    ]);
  }

  if (!clip) {
    return (
      <Screen>
        <Text style={{ color: colors.text }}>加载中…</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={styles.title}>{clip.title}</Text>

      <View style={styles.video}>
        <Video
          ref={videoRef}
          source={{ uri: clip.uri }}
          style={{ width: '100%', height: 240 }}
          resizeMode={ResizeMode.CONTAIN}
          useNativeControls
          onPlaybackStatusUpdate={onStatus}
        />
      </View>

      {/* 时间微调胶囊：左退 / 当前 / 右进，方便对齐关键帧 */}
      <View style={styles.timePill}>
        <Pressable onPress={() => nudge(-3000)} style={({ pressed }) => [styles.nudgeBtn, pressed && { opacity: 0.6 }]}>
          <Text style={styles.nudgeText}>◀ -3s</Text>
        </Pressable>
        <Text style={styles.timeNow}>{fmt(position)}</Text>
        <Pressable onPress={() => nudge(3000)} style={({ pressed }) => [styles.nudgeBtn, pressed && { opacity: 0.6 }]}>
          <Text style={styles.nudgeText}>+3s ▶</Text>
        </Pressable>
      </View>

      <Card style={{ marginTop: spacing.md }}>
        <Text style={styles.label}>问题标签</Text>
        {/* 横滑 chip：点击=填入 tag + 暂停视频，方便边看边标 */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: spacing.sm }}
          contentContainerStyle={{ paddingRight: spacing.md }}
        >
          {PRESET_TAGS.map((t) => {
            const active = tag === t;
            return (
              <Pressable
                key={t}
                onPress={() => pickTag(t)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{t}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
        <TextInput
          value={tag}
          onChangeText={setTag}
          onFocus={pauseVideo}
          placeholder="或自定义一句话标签"
          placeholderTextColor={colors.textDim}
          style={styles.input}
        />
        <Text style={[styles.label, { marginTop: spacing.md }]}>详细说明（可选）</Text>
        <TextInput
          value={note}
          onChangeText={setNote}
          onFocus={pauseVideo}
          placeholder="为什么这球丢了？"
          placeholderTextColor={colors.textDim}
          style={[styles.input, { height: 60 }]}
          multiline
        />
        <Button
          title={`📍 在 ${fmt(position)} 标注`}
          onPress={addAnnotation}
          style={{ marginTop: spacing.md }}
        />
      </Card>

      <View style={styles.listHeader}>
        <Text style={styles.label}>已添加 {annotations.length} 条标注</Text>
        {annotations.length > 0 && (
          <Text style={styles.hint}>轻点跳转 · 长按删除</Text>
        )}
      </View>

      <ScrollView style={{ marginTop: spacing.sm }}>
        {annotations.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>✍️ 还没标注</Text>
            <Text style={styles.emptyDesc}>
              边看边点上方标签,把这段录像变成你的私教笔记
            </Text>
          </Card>
        ) : (
          annotations.map((a, i) => (
            <Pressable
              key={i}
              onPress={() => jumpTo(a.time_ms)}
              onLongPress={() => confirmRemove(i)}
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            >
              <Card style={{ marginBottom: spacing.sm }}>
                <View style={styles.annoRow}>
                  <Text style={styles.annoIdx}>#{String(i + 1).padStart(2, '0')}</Text>
                  <Text style={styles.annoTime}>{fmt(a.time_ms)}</Text>
                  <View style={{ flex: 1, marginLeft: spacing.md }}>
                    <Text style={styles.annoTag}>{a.tag}</Text>
                    {a.note ? <Text style={styles.annoNote}>{a.note}</Text> : null}
                  </View>
                </View>
              </Card>
            </Pressable>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

function fmt(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: font.h2, fontWeight: '700' },
  video: { marginTop: spacing.md, backgroundColor: '#000', borderRadius: radius.lg, overflow: 'hidden' },
  timePill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    backgroundColor: colors.cardAlt,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  nudgeBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  nudgeText: { color: colors.textDim, fontWeight: '600', fontSize: font.small },
  timeNow: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: font.body,
    fontVariant: ['tabular-nums'],
  },
  label: { color: colors.textDim, fontSize: font.small },
  hint: { color: colors.textDim, fontSize: font.tiny },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.cardAlt,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipActive: { borderColor: colors.primary },
  chipText: { color: colors.textDim, fontSize: font.small, fontWeight: '600' },
  chipTextActive: { color: colors.primary },
  input: {
    color: colors.text,
    backgroundColor: colors.cardAlt,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
    fontSize: font.body,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  emptyCard: {
    borderStyle: 'dashed',
    borderColor: colors.border,
    marginTop: spacing.sm,
  },
  emptyTitle: { color: colors.text, fontWeight: '600', fontSize: font.body },
  emptyDesc: { color: colors.textDim, fontSize: font.small, marginTop: 4 },
  annoRow: { flexDirection: 'row', alignItems: 'center' },
  annoIdx: {
    color: colors.textDim,
    fontSize: font.small,
    fontVariant: ['tabular-nums'],
    marginRight: spacing.sm,
  },
  annoTime: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: font.body,
    fontVariant: ['tabular-nums'],
  },
  annoTag: { color: colors.text, fontWeight: '600' },
  annoNote: { color: colors.textDim, fontSize: font.small, marginTop: 2 },
});

import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { colors, font, radius, spacing } from '@/theme/tokens';
import { listReplayClips, updateReplayAnnotations } from '@/db/repos';

type Annotation = { time_ms: number; tag: string; note: string };

export default function ReplayDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const videoRef = useRef<Video>(null);
  const [clip, setClip] = useState<any>(null);
  const [position, setPosition] = useState(0);
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
    if ('positionMillis' in s) setPosition(s.positionMillis ?? 0);
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
    await updateReplayAnnotations(Number(id), next);
  }

  async function jumpTo(ms: number) {
    await videoRef.current?.setPositionAsync(ms);
  }

  async function remove(idx: number) {
    const next = annotations.filter((_, i) => i !== idx);
    setAnnotations(next);
    await updateReplayAnnotations(Number(id), next);
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

      <Text style={styles.timestamp}>当前位置：{fmt(position)}</Text>

      <Card style={{ marginTop: spacing.md }}>
        <Text style={styles.label}>问题标签（如：步法慢、击球点低）</Text>
        <TextInput
          value={tag}
          onChangeText={setTag}
          placeholder="一句话标签"
          placeholderTextColor={colors.textDim}
          style={styles.input}
        />
        <Text style={[styles.label, { marginTop: spacing.md }]}>详细说明（可选）</Text>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="为什么这球丢了？"
          placeholderTextColor={colors.textDim}
          style={[styles.input, { height: 60 }]}
          multiline
        />
        <Button title={`+ 在 ${fmt(position)} 添加标注`} onPress={addAnnotation} style={{ marginTop: spacing.md }} />
      </Card>

      <Text style={[styles.label, { marginTop: spacing.lg }]}>
        已添加 {annotations.length} 条标注
      </Text>
      <ScrollView style={{ marginTop: spacing.sm }}>
        {annotations.map((a, i) => (
          <Pressable
            key={i}
            onPress={() => jumpTo(a.time_ms)}
            onLongPress={() => remove(i)}
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
          >
            <Card style={{ marginBottom: spacing.sm }}>
              <View style={styles.annoRow}>
                <Text style={styles.annoTime}>{fmt(a.time_ms)}</Text>
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Text style={styles.annoTag}>{a.tag}</Text>
                  {a.note ? <Text style={styles.annoNote}>{a.note}</Text> : null}
                </View>
              </View>
            </Card>
          </Pressable>
        ))}
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
  timestamp: { color: colors.primary, marginTop: spacing.sm, fontWeight: '600' },
  label: { color: colors.textDim, fontSize: font.small },
  input: {
    color: colors.text,
    backgroundColor: colors.cardAlt,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
    fontSize: font.body,
  },
  annoRow: { flexDirection: 'row', alignItems: 'center' },
  annoTime: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: font.body,
    fontVariant: ['tabular-nums'],
  },
  annoTag: { color: colors.text, fontWeight: '600' },
  annoNote: { color: colors.textDim, fontSize: font.small, marginTop: 2 },
});

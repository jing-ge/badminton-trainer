import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { colors, font, spacing } from '@/theme/tokens';
import { deleteReplayClip, insertReplayClip, listReplayClips } from '@/db/repos';
import dayjs from 'dayjs';

export default function ReplayList() {
  const router = useRouter();
  const [clips, setClips] = useState<any[]>([]);

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

  return (
    <Screen>
      <Text style={styles.title}>对战录像复盘</Text>
      <Text style={styles.sub}>导入本地比赛视频，逐段标注问题点</Text>

      <Button title="+ 从相册导入视频" onPress={pickVideo} style={{ marginTop: spacing.lg }} />

      <View style={{ marginTop: spacing.lg }}>
        {clips.length === 0 ? (
          <Card>
            <Text style={styles.empty}>还没有录像，先去录一段比赛吧</Text>
          </Card>
        ) : (
          clips.map((c) => (
            <Pressable
              key={c.id}
              onPress={() => router.push(`/replay/${c.id}`)}
              onLongPress={() => del(c.id)}
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            >
              <Card style={{ marginBottom: spacing.md }}>
                <View style={styles.row}>
                  <Text style={{ fontSize: 32 }}>🎬</Text>
                  <View style={{ flex: 1, marginLeft: spacing.md }}>
                    <Text style={styles.clipTitle}>{c.title}</Text>
                    <Text style={styles.clipMeta}>
                      {c.annotations?.length ?? 0} 条标注 · 长按删除
                    </Text>
                  </View>
                  <Text style={{ color: colors.textDim, fontSize: 22 }}>›</Text>
                </View>
              </Card>
            </Pressable>
          ))
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
  clipTitle: { color: colors.text, fontWeight: '600' },
  clipMeta: { color: colors.textDim, fontSize: font.small, marginTop: 2 },
});

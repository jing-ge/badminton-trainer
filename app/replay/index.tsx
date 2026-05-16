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

  const totalAnnos = clips.reduce((a, c) => a + (c.annotations?.length ?? 0), 0);

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

      <Button title="+ 从相册导入视频" onPress={pickVideo} style={{ marginTop: spacing.md }} />

      <View style={{ marginTop: spacing.lg }}>
        {clips.length === 0 ? (
          <Card>
            <Text style={styles.empty}>🎥 还没导入录像，点上方按钮从相册添加</Text>
          </Card>
        ) : (
          clips.map((c) => {
            const annoCount = c.annotations?.length ?? 0;
            const annotated = annoCount > 0;
            return (
              <Pressable
                key={c.id}
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
                      <Text style={styles.clipTitle}>{c.title}</Text>
                      {annotated ? (
                        <Text style={styles.clipMetaActive}>
                          <Text style={styles.clipAnnoBig}>{annoCount}</Text> 条标注
                        </Text>
                      ) : (
                        <Text style={styles.clipMeta}>待标注</Text>
                      )}
                    </View>
                    <Text style={{ color: colors.textDim, fontSize: 22 }}>›</Text>
                  </View>
                  <Text style={styles.deleteHint}>⌫ 长按删除</Text>
                </Card>
              </Pressable>
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
  clipCard: { marginBottom: spacing.md, position: 'relative' },
  clipTitle: { color: colors.text, fontWeight: '600' },
  clipMeta: { color: colors.textDim, fontSize: font.small, marginTop: 2 },
  clipMetaActive: { color: colors.primary, fontSize: font.small, marginTop: 2 },
  clipAnnoBig: { color: colors.primary, fontWeight: '800', fontSize: font.h3 },
  deleteHint: { position: 'absolute', top: 6, right: 8, color: colors.textDim, fontSize: font.tiny },
  // v0.21 hero
  heroCard: { marginTop: spacing.lg, backgroundColor: colors.cardAlt, alignItems: 'center' },
  heroEmoji: { fontSize: 36, marginBottom: spacing.sm },
  heroTitle: { color: colors.text, fontSize: font.body, fontWeight: '700', textAlign: 'center' },
  heroSub: { color: colors.textDim, fontSize: font.small, marginTop: 4, textAlign: 'center' },
  heroStat: { color: colors.textDim, fontSize: font.body, textAlign: 'center' },
  heroStatNum: { color: colors.primary, fontWeight: '800' },
});

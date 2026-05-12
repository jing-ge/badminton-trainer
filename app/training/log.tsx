import { useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { colors, font, radius, spacing } from '@/theme/tokens';
import { insertTrainingLog } from '@/db/trainingLogs';

const ALL_CATS = ['后场', '前场', '步法', '体能', '实战', '发球'];

export default function TrainingLogScreen() {
  const { plan_id, mins } = useLocalSearchParams<{ plan_id?: string; mins?: string }>();
  const router = useRouter();
  const [duration, setDuration] = useState(mins ?? '60');
  const [intensity, setIntensity] = useState(3);
  const [cats, setCats] = useState<string[]>([]);
  const [note, setNote] = useState('');

  const toggle = (c: string) =>
    setCats((arr) => (arr.includes(c) ? arr.filter((x) => x !== c) : [...arr, c]));

  async function save() {
    const min = parseInt(duration, 10);
    if (!min || min <= 0) {
      Alert.alert('请输入训练时长');
      return;
    }
    await insertTrainingLog({
      duration_min: min,
      categories: cats,
      intensity,
      note: note.trim() || undefined,
      plan_id: plan_id ?? null,
    });
    
    if (Platform.OS === 'web') {
      window.alert('打卡成功！坚持训练，进步看得见 💪');
      router.replace('/stats');
      return;
    }

    Alert.alert('打卡成功！', '坚持训练，进步看得见 💪', [
      { text: '好', onPress: () => router.replace('/stats') },
    ]);
  }

  return (
    <Screen>
      <Text style={styles.title}>训练打卡</Text>

      <Card style={{ marginTop: spacing.lg }}>
        <Text style={styles.label}>训练时长（分钟）</Text>
        <TextInput
          value={duration}
          onChangeText={setDuration}
          keyboardType="number-pad"
          style={styles.input}
          placeholder="60"
          placeholderTextColor={colors.textDim}
        />
      </Card>

      <Card style={{ marginTop: spacing.md }}>
        <Text style={styles.label}>训练强度</Text>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Pressable key={n} onPress={() => setIntensity(n)}>
              <Text style={[styles.star, { color: n <= intensity ? colors.warn : colors.border }]}>
                ★
              </Text>
            </Pressable>
          ))}
        </View>
      </Card>

      <Card style={{ marginTop: spacing.md }}>
        <Text style={styles.label}>训练内容（多选）</Text>
        <View style={styles.tagWrap}>
          {ALL_CATS.map((c) => (
            <Pressable
              key={c}
              onPress={() => toggle(c)}
              style={[
                styles.tag,
                cats.includes(c) && { backgroundColor: colors.primary, borderColor: colors.primary },
              ]}
            >
              <Text style={{ color: cats.includes(c) ? '#fff' : colors.textDim }}>{c}</Text>
            </Pressable>
          ))}
        </View>
      </Card>

      <Card style={{ marginTop: spacing.md }}>
        <Text style={styles.label}>笔记 / 反思</Text>
        <TextInput
          value={note}
          onChangeText={setNote}
          multiline
          style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
          placeholder="今天哪里做得好，哪里需要改进..."
          placeholderTextColor={colors.textDim}
        />
      </Card>

      <Button title="保存" onPress={save} style={{ marginTop: spacing.lg }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: font.h1, fontWeight: '700' },
  label: { color: colors.textDim, fontSize: font.small, marginBottom: spacing.sm },
  input: {
    color: colors.text,
    fontSize: font.body,
    backgroundColor: colors.cardAlt,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  starsRow: { flexDirection: 'row', gap: spacing.md },
  star: { fontSize: 32 },
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tag: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
});

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
  
  const [opponent, setOpponent] = useState('');
  const [matchResult, setMatchResult] = useState<'win' | 'loss' | 'draw' | undefined>();

  const toggle = (c: string) =>
    setCats((arr) => (arr.includes(c) ? arr.filter((x) => x !== c) : [...arr, c]));

  async function save() {
    const min = parseInt(duration, 10);
    if (!min || min <= 0) {
      if (Platform.OS === 'web') window.alert('训练时长至少 1 分钟');
      else Alert.alert('请输入训练时长', '训练时长至少 1 分钟');
      return;
    }
    if (min > 480) {
      // 超过 8 小时,确认一次而非直接拦
      const ok = await confirmLongSession(min);
      if (!ok) return;
    }
    await insertTrainingLog({
      duration_min: min,
      categories: cats,
      intensity,
      note: note.trim() || undefined,
      opponent: opponent.trim() || undefined,
      match_result: matchResult,
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

  function confirmLongSession(min: number): Promise<boolean> {
    return new Promise((resolve) => {
      const msg = `你录入的训练时长 ${min} 分钟超过 8 小时,确认无误吗?`;
      if (Platform.OS === 'web') {
        resolve(window.confirm(msg));
        return;
      }
      Alert.alert('时长偏长,请确认', msg, [
        { text: '取消', style: 'cancel', onPress: () => resolve(false) },
        { text: '确认保存', onPress: () => resolve(true) },
      ]);
    });
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

      {cats.includes('实战') && (
        <Card style={{ marginTop: spacing.md }}>
          <Text style={styles.label}>对手是谁？(可选)</Text>
          <TextInput
            value={opponent}
            onChangeText={setOpponent}
            style={[styles.input, { marginBottom: spacing.md }]}
            placeholder="老王、陈总..."
            placeholderTextColor={colors.textDim}
          />
          <Text style={styles.label}>战绩</Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
            <Pressable onPress={() => setMatchResult('win')} style={[styles.tag, matchResult === 'win' && { backgroundColor: colors.danger, borderColor: colors.danger }]}>
              <Text style={{ color: matchResult === 'win' ? '#fff' : colors.textDim }}>🏆 赢了</Text>
            </Pressable>
            <Pressable onPress={() => setMatchResult('loss')} style={[styles.tag, matchResult === 'loss' && { backgroundColor: colors.border, borderColor: colors.border }]}>
              <Text style={{ color: matchResult === 'loss' ? '#fff' : colors.textDim }}>💔 输了</Text>
            </Pressable>
            <Pressable onPress={() => setMatchResult('draw')} style={[styles.tag, matchResult === 'draw' && { backgroundColor: colors.accent, borderColor: colors.accent }]}>
              <Text style={{ color: matchResult === 'draw' ? '#fff' : colors.textDim }}>🤝 平局</Text>
            </Pressable>
          </View>
        </Card>
      )}

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

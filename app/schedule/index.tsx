import { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { colors, font, radius, spacing } from '@/theme/tokens';
import {
  deleteSchedule,
  insertSchedule,
  listSchedules,
  Schedule,
  updateSchedule,
} from '@/db/repos';
import { cancelReminder, ensureNotificationPermission, scheduleWeeklyReminder } from '@/utils/notifications';

const WEEK = ['日', '一', '二', '三', '四', '五', '六'];
const DEFAULT_TITLE = '训练时间到';
const DEFAULT_WEEKDAY = 1;
const DEFAULT_TIME = '19:00';

export default function ScheduleScreen() {
  const [items, setItems] = useState<Schedule[]>([]);
  const [title, setTitle] = useState(DEFAULT_TITLE);
  const [weekday, setWeekday] = useState(DEFAULT_WEEKDAY);
  const [time, setTime] = useState(DEFAULT_TIME);

  async function reload() {
    setItems(await listSchedules());
  }

  useEffect(() => {
    reload();
  }, []);

  function resetForm() {
    setTitle(DEFAULT_TITLE);
    setWeekday(DEFAULT_WEEKDAY);
    setTime(DEFAULT_TIME);
  }

  async function add() {
    const [hStr, mStr] = time.split(':');
    const h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) {
      Alert.alert('时间格式错误', '请用 HH:MM 格式，如 19:00');
      return;
    }
    const ok = await ensureNotificationPermission();
    if (!ok) {
      Alert.alert('未授予通知权限', '请到系统设置开启通知');
      return;
    }
    let nid: string | null = null;
    try {
      nid = await scheduleWeeklyReminder({ title, weekday, hour: h, minute: m });
    } catch (e: any) {
      Alert.alert('设置失败', e?.message ?? String(e));
      return;
    }
    await insertSchedule({ title, weekday, hour: h, minute: m, notification_id: nid });
    await reload();
    resetForm();
  }

  async function toggle(s: Schedule) {
    if (s.enabled) {
      if (s.notification_id) await cancelReminder(s.notification_id);
      await updateSchedule(s.id, { enabled: 0, notification_id: null });
    } else {
      const nid = await scheduleWeeklyReminder({
        title: s.title,
        weekday: s.weekday,
        hour: s.hour,
        minute: s.minute,
      });
      await updateSchedule(s.id, { enabled: 1, notification_id: nid });
    }
    await reload();
  }

  async function remove(s: Schedule) {
    const summary = `${s.title} · 每周${WEEK[s.weekday]} ${String(s.hour).padStart(2, '0')}:${String(s.minute).padStart(2, '0')}`;
    const doRemove = async () => {
      if (s.notification_id) await cancelReminder(s.notification_id);
      await deleteSchedule(s.id);
      await reload();
    };
    if (Platform.OS === 'web') {
      if (window.confirm(`确认删除提醒?\n${summary}`)) await doRemove();
      return;
    }
    Alert.alert('删除提醒?', summary, [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: doRemove },
    ]);
  }

  return (
    <Screen>
      <Text style={styles.title}>训练日程</Text>
      <Text style={styles.sub}>设置每周训练提醒</Text>

      <Card style={{ marginTop: spacing.lg }}>
        <Text style={styles.label}>提醒标题</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          style={styles.input}
          placeholderTextColor={colors.textDim}
        />

        <Text style={[styles.label, { marginTop: spacing.md }]}>星期几</Text>
        <View style={styles.weekRow}>
          {WEEK.map((w, i) => (
            <Pressable
              key={i}
              onPress={() => setWeekday(i)}
              style={[
                styles.weekItem,
                weekday === i && { backgroundColor: colors.primary, borderColor: colors.primary },
              ]}
            >
              <Text style={{ color: weekday === i ? '#fff' : colors.text, fontWeight: '600' }}>
                {w}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.label, { marginTop: spacing.md }]}>时间（HH:MM）</Text>
        <TextInput
          value={time}
          onChangeText={setTime}
          style={styles.input}
          placeholder="19:00"
          placeholderTextColor={colors.textDim}
        />

        <Button title="+ 添加提醒" onPress={add} style={{ marginTop: spacing.md }} />
      </Card>

      <Text style={[styles.label, { marginTop: spacing.lg }]}>已设置（{items.length}）</Text>
      <View style={{ marginTop: spacing.sm }}>
        {items.length === 0 ? (
          <Card>
            <Text style={{ color: colors.textDim, textAlign: 'center' }}>暂无提醒</Text>
          </Card>
        ) : (
          items.map((s) => (
            <Card key={s.id} style={{ marginBottom: spacing.sm }}>
              <View style={styles.itemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle}>{s.title}</Text>
                  <Text style={styles.itemMeta}>
                    每周{WEEK[s.weekday]} {String(s.hour).padStart(2, '0')}:
                    {String(s.minute).padStart(2, '0')}
                  </Text>
                </View>
                <Switch value={!!s.enabled} onValueChange={() => toggle(s)} />
                <Pressable onPress={() => remove(s)} style={{ marginLeft: spacing.sm }}>
                  <Text style={{ color: colors.danger, fontSize: 18 }}>×</Text>
                </Pressable>
              </View>
            </Card>
          ))
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: font.h1, fontWeight: '700' },
  sub: { color: colors.textDim, marginTop: 4 },
  label: { color: colors.textDim, fontSize: font.small },
  input: {
    color: colors.text,
    backgroundColor: colors.cardAlt,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
    fontSize: font.body,
  },
  weekRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm, flexWrap: 'wrap' },
  weekItem: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  itemRow: { flexDirection: 'row', alignItems: 'center' },
  itemTitle: { color: colors.text, fontWeight: '600' },
  itemMeta: { color: colors.textDim, fontSize: font.small, marginTop: 2 },
});

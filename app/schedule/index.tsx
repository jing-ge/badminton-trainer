import { useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import dayjs from 'dayjs';
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
import {
  cancelReminder,
  ensureNotificationPermission,
  scheduleWeeklyReminder,
  sendTestNotification,
} from '@/utils/notifications';
import { vibrateLight } from '@/utils/haptics';

// DB schema 不动：weekday 0=Sun ... 6=Sat。
// UI 侧统一走 weekdayLabel + UI_WEEK 序列，把周一摆首格。
const UI_WEEK: { label: string; weekday: number }[] = [
  { label: '一', weekday: 1 },
  { label: '二', weekday: 2 },
  { label: '三', weekday: 3 },
  { label: '四', weekday: 4 },
  { label: '五', weekday: 5 },
  { label: '六', weekday: 6 },
  { label: '日', weekday: 0 },
];

function weekdayLabel(weekday: number): string {
  return UI_WEEK.find((w) => w.weekday === weekday)?.label ?? '?';
}

const HOURS = Array.from({ length: 18 }, (_, i) => i + 6); // 6..23
const MINUTES = [0, 15, 30, 45];

const DEFAULT_TITLE = '训练时间到';
const DEFAULT_WEEKDAY = 1;
const DEFAULT_TIME = '19:00';

type Preset = { title: string; weekday: number; time: string };
const PRESETS: Preset[] = [
  { title: '下班训练', weekday: 2, time: '19:00' },
  { title: '周末加练', weekday: 6, time: '09:00' },
  { title: '周日复盘', weekday: 0, time: '18:00' },
];

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

// 计算从「现在」起，到下一次 (weekday/h/m) 触发的剩余文本。
// 用 dayjs 计算未来 0..7 天里最近一次目标时刻。
function nextOccurrenceText(weekday: number, hour: number, minute: number): string {
  const now = dayjs();
  let target = now.day(weekday).hour(hour).minute(minute).second(0).millisecond(0);
  if (!target.isAfter(now)) target = target.add(7, 'day');
  const diffMin = target.diff(now, 'minute');
  const days = Math.floor(diffMin / 60 / 24);
  const hours = Math.floor((diffMin / 60) % 24);
  const mins = diffMin % 60;

  const timeStr = `${pad2(hour)}:${pad2(minute)}`;
  let head: string;
  if (target.isSame(now, 'day')) {
    head = `今天 ${timeStr}`;
  } else if (target.diff(now.startOf('day'), 'day') === 1) {
    head = `明天 ${timeStr}`;
  } else {
    head = `周${weekdayLabel(weekday)} ${timeStr}`;
  }

  let tail: string;
  if (days > 0) {
    tail = `还有 ${days} 天 ${hours} 小时`;
  } else if (hours > 0) {
    tail = `还有 ${hours} 小时 ${mins} 分`;
  } else {
    tail = `还有 ${Math.max(mins, 1)} 分`;
  }
  return `下次：${head}（${tail}）`;
}

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

  // 落库前查重：同 weekday+hour+minute 且 enabled 的视作冲突。
  function findDuplicate(wd: number, h: number, m: number): Schedule | undefined {
    return items.find(
      (s) => s.enabled && s.weekday === wd && s.hour === h && s.minute === m,
    );
  }

  async function addWith(opts: { title: string; weekday: number; hour: number; minute: number }) {
    const dup = findDuplicate(opts.weekday, opts.hour, opts.minute);
    if (dup) {
      Alert.alert('已有同时段提醒', `该时段已有提醒：${dup.title}`);
      return;
    }
    const ok = await ensureNotificationPermission();
    if (!ok) {
      Alert.alert('未授予通知权限', '请到系统设置开启通知');
      return;
    }
    let nid: string | null = null;
    try {
      nid = await scheduleWeeklyReminder(opts);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      Alert.alert('设置失败', msg);
      return;
    }
    await insertSchedule({ ...opts, notification_id: nid });
    await reload();
  }

  async function add() {
    const [hStr, mStr] = time.split(':');
    const h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) {
      Alert.alert('时间格式错误', '请用 HH:MM 格式，如 19:00');
      return;
    }
    await addWith({ title, weekday, hour: h, minute: m });
    resetForm();
  }

  async function applyPreset(p: Preset) {
    vibrateLight();
    const [hStr, mStr] = p.time.split(':');
    await addWith({
      title: p.title,
      weekday: p.weekday,
      hour: parseInt(hStr, 10),
      minute: parseInt(mStr, 10),
    });
  }

  async function onTest() {
    if (Platform.OS === 'web') {
      Alert.alert('Web 预览不支持', '请在真机/模拟器上测试通知');
      return;
    }
    try {
      await sendTestNotification();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes('权限')) {
        Alert.alert('未授予通知权限', '请到系统设置开启通知');
      } else {
        Alert.alert('发送失败', msg);
      }
    }
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
    const summary = `${s.title} · 每周${weekdayLabel(s.weekday)} ${pad2(s.hour)}:${pad2(s.minute)}`;
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

  // 解析当前 time 输入用于 chip 高亮
  const [curH, curM] = (() => {
    const [hs, ms] = time.split(':');
    return [parseInt(hs, 10), parseInt(ms, 10)];
  })();

  function setHour(h: number) {
    vibrateLight();
    const mm = isNaN(curM) ? 0 : curM;
    setTime(`${pad2(h)}:${pad2(mm)}`);
  }
  function setMinute(m: number) {
    vibrateLight();
    const hh = isNaN(curH) ? 19 : curH;
    setTime(`${pad2(hh)}:${pad2(m)}`);
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
          {UI_WEEK.map((w) => (
            <Pressable
              key={w.weekday}
              onPress={() => {
                vibrateLight();
                setWeekday(w.weekday);
              }}
              style={[
                styles.weekItem,
                weekday === w.weekday && {
                  backgroundColor: colors.primary,
                  borderColor: colors.primary,
                },
              ]}
            >
              <Text style={{ color: weekday === w.weekday ? '#fff' : colors.text, fontWeight: '600' }}>
                {w.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.label, { marginTop: spacing.md }]}>时间</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {HOURS.map((h) => {
            const active = h === curH;
            return (
              <Pressable
                key={`h${h}`}
                onPress={() => setHour(h)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{pad2(h)}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {MINUTES.map((m) => {
            const active = m === curM;
            return (
              <Pressable
                key={`m${m}`}
                onPress={() => setMinute(m)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{pad2(m)}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Text style={[styles.label, { marginTop: spacing.sm }]}>或手动输入（HH:MM）</Text>
        <TextInput
          value={time}
          onChangeText={setTime}
          style={styles.input}
          placeholder="19:00"
          placeholderTextColor={colors.textDim}
        />

        <View style={styles.actionRow}>
          <Button title="+ 添加提醒" onPress={add} style={{ flex: 1 }} />
          <Button
            title="🔔 发一条测试通知"
            variant="ghost"
            onPress={onTest}
            style={{ flex: 1 }}
          />
        </View>
      </Card>

      <Text style={[styles.label, { marginTop: spacing.lg }]}>已设置（{items.length}）</Text>
      <View style={{ marginTop: spacing.sm }}>
        {items.length === 0 ? (
          <Card>
            <Text style={styles.emptyEmoji}>🔔</Text>
            <Text style={styles.emptyTitle}>设个提醒，私教比你还自律</Text>
            <View style={styles.presetRow}>
              {PRESETS.map((p) => (
                <Pressable
                  key={`${p.weekday}-${p.time}`}
                  onPress={() => applyPreset(p)}
                  style={styles.presetChip}
                >
                  <Text style={styles.presetText}>
                    周{weekdayLabel(p.weekday)} {p.time} · {p.title}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Card>
        ) : (
          items.map((s) => {
            const dimmed = !s.enabled;
            return (
              <Card key={s.id} style={{ marginBottom: spacing.sm }}>
                <View style={styles.itemRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemTitle}>{s.title}</Text>
                    <Text style={[styles.itemMeta, dimmed && { opacity: 0.5 }]}>
                      每周{weekdayLabel(s.weekday)} {pad2(s.hour)}:{pad2(s.minute)}
                    </Text>
                    <Text style={[styles.itemCountdown, dimmed && { opacity: 0.5 }]}>
                      {s.enabled
                        ? nextOccurrenceText(s.weekday, s.hour, s.minute)
                        : '已暂停'}
                    </Text>
                  </View>
                  <Switch value={!!s.enabled} onValueChange={() => toggle(s)} />
                  <Pressable onPress={() => remove(s)} style={{ marginLeft: spacing.sm }}>
                    <Text style={{ color: colors.danger, fontSize: 18 }}>×</Text>
                  </Pressable>
                </View>
              </Card>
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
  chipRow: {
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingRight: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    minWidth: 48,
    alignItems: 'center',
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: { color: colors.text, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  itemRow: { flexDirection: 'row', alignItems: 'center' },
  itemTitle: { color: colors.text, fontWeight: '600' },
  itemMeta: { color: colors.textDim, fontSize: font.small, marginTop: 2 },
  itemCountdown: { color: colors.textDim, fontSize: font.tiny, marginTop: 2 },
  emptyEmoji: { fontSize: 32, textAlign: 'center' },
  emptyTitle: {
    color: colors.text,
    fontSize: font.h3,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
    justifyContent: 'center',
  },
  presetChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardAlt,
  },
  presetText: { color: colors.text, fontSize: font.small, fontWeight: '600' },
});

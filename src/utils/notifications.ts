import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

const isWeb = Platform.OS === 'web';

if (!isWeb) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function ensureNotificationPermission(): Promise<boolean> {
  if (isWeb) return false;
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: '训练提醒',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }
  return req.granted;
}

export async function scheduleWeeklyReminder(opts: {
  title: string;
  weekday: number; // 0-6, 0=Sunday
  hour: number;
  minute: number;
}): Promise<string> {
  if (isWeb) throw new Error('Web 预览不支持本地推送');
  const ok = await ensureNotificationPermission();
  if (!ok) throw new Error('未授予通知权限');
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: '羽毛球训练提醒',
      body: opts.title,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: opts.weekday + 1,
      hour: opts.hour,
      minute: opts.minute,
    },
  });
  return id;
}

export async function cancelReminder(id: string) {
  if (isWeb) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {}
}

// 2 秒后弹一条本地测试通知，用于自检通知权限/通道是否生效。
// 不写入 schedules 表，调用方自行处理 Web 降级与权限失败提示。
export async function sendTestNotification(): Promise<void> {
  if (isWeb) throw new Error('Web 预览不支持本地推送');
  const ok = await ensureNotificationPermission();
  if (!ok) throw new Error('未授予通知权限');
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '羽毛球训练 · 测试通知',
      body: '收到这条说明设置已生效',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 2,
    },
  });
}

/**
 * v0.35.0：清空数据独立确认页。
 * 设计目标：把破坏性操作从 me Tab 行内 Alert 抽离到独立页面，
 * 让用户明确感知「即将丢失哪些数据」，二次确认 + 触觉反馈。
 */
import { useCallback, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { colors, font, radius, spacing } from '@/theme/tokens';
import { resetDB } from '@/db';
import { listTrainingLogs } from '@/db/trainingLogs';
import { listSchedules } from '@/db/repos';
import { listUserPlans } from '@/db/plans';
import { listFavoriteIds } from '@/db/tutorials';
import { vibrateMedium, vibrateSuccess } from '@/utils/haptics';

// v0.35.0：新增 AsyncStorage key 时务必同步此列表
const PREFS_KEYS = [
  'prefs.nickname',
  'prefs.level',
  'prefs.ttsVoice',
  'prefs.ttsRate',
  'prefs.ttsPitch',
  'prefs.lastCondition',
] as const;

// 用 null 表示「加载中或失败」，渲染时显示 `—`，避免 0 误导
type Counts = {
  trainingLogs: number | null;
  schedules: number | null;
  userPlans: number | null;
  favorites: number | null;
  prefs: number | null;
};

const INITIAL_COUNTS: Counts = {
  trainingLogs: null,
  schedules: null,
  userPlans: null,
  favorites: null,
  prefs: null,
};

export default function ResetScreen() {
  const router = useRouter();
  const [counts, setCounts] = useState<Counts>(INITIAL_COUNTS);
  const [busy, setBusy] = useState(false);

  // 所有 5 项都加载成功 → 允许点「全部清空」
  const allLoaded =
    counts.trainingLogs !== null &&
    counts.schedules !== null &&
    counts.userPlans !== null &&
    counts.favorites !== null &&
    counts.prefs !== null;

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      // 各项独立 catch：一个查询挂了不连累其他行，失败的留 null
      const safe = async (fn: () => Promise<number>): Promise<number | null> => {
        try {
          return await fn();
        } catch {
          return null;
        }
      };
      (async () => {
        const [logs, schs, plans, favs, prefs] = await Promise.all([
          safe(async () => (await listTrainingLogs(9999)).length),
          safe(async () => (await listSchedules()).length),
          safe(async () => (await listUserPlans()).length),
          safe(async () => (await listFavoriteIds()).length),
          safe(async () => {
            const entries = await AsyncStorage.multiGet(PREFS_KEYS as unknown as string[]);
            return entries.filter(([, v]) => v != null).length;
          }),
        ]);
        if (cancelled) return;
        setCounts({
          trainingLogs: logs,
          schedules: schs,
          userPlans: plans,
          favorites: favs,
          prefs,
        });
      })();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  function onPressReset() {
    if (!allLoaded || busy) return;
    vibrateMedium();
    const title = '确认清空全部数据？';
    const message = '该操作不可撤销，所有训练记录、计划、收藏、个人偏好都会被删除。';
    if (Platform.OS === 'web') {
      // Web 没有原生 Alert，用 confirm 兜底
      const ok = typeof window !== 'undefined' && window.confirm(`${title}\n\n${message}`);
      if (ok) doReset();
      return;
    }
    Alert.alert(title, message, [
      { text: '取消', style: 'cancel' },
      { text: '全部清空', style: 'destructive', onPress: doReset },
    ]);
  }

  async function doReset() {
    setBusy(true);
    try {
      await resetDB();
      await AsyncStorage.multiRemove(PREFS_KEYS as unknown as string[]);
      vibrateSuccess();
      router.replace('/(tabs)');
      // 跳转后再弹提示，避免遮挡 replace 动画；Web 没原生 Alert 时降级 console
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') window.alert('全部已清空，欢迎重新开始 🏸');
      } else {
        Alert.alert('已清空', '全部已清空，欢迎重新开始 🏸');
      }
    } catch (e) {
      setBusy(false);
      const msg = e instanceof Error ? e.message : '未知错误';
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') window.alert(`清空失败：${msg}`);
      } else {
        Alert.alert('清空失败', msg);
      }
    }
  }

  return (
    <Screen>
      {/* ===== 红色警示 Hero ===== */}
      <Card style={styles.heroCard}>
        <Text style={styles.heroEmoji}>⚠️</Text>
        <Text style={styles.heroTitle}>清空所有数据</Text>
        <Text style={styles.heroSub}>该操作不可撤销</Text>
      </Card>

      {/* ===== 「将被清空」清单 ===== */}
      <View style={{ marginTop: spacing.xxl }}>
        <Card>
          <Text style={styles.listTitle}>将被清空</Text>
          <ItemRow emoji="🏋️" label="训练记录" count={counts.trainingLogs} />
          <ItemRow emoji="🔔" label="日程提醒" count={counts.schedules} />
          <ItemRow emoji="📋" label="自定义周计划" count={counts.userPlans} />
          <ItemRow emoji="⭐" label="教程收藏" count={counts.favorites} />
          <ItemRow emoji="👤" label="个人偏好" count={counts.prefs} />
        </Card>
      </View>

      {/* ===== 按钮组 ===== */}
      <View style={{ marginTop: spacing.xxl }}>
        {/* 返回（Ghost）放上面，鼓励退路 */}
        <Pressable
          onPress={() => router.back()}
          disabled={busy}
          style={({ pressed }) => [styles.backBtn, { opacity: pressed || busy ? 0.6 : 1 }]}
        >
          <Text style={styles.backText}>返回</Text>
        </Pressable>

        <Pressable
          onPress={onPressReset}
          disabled={!allLoaded || busy}
          style={({ pressed }) => [
            styles.dangerBtn,
            { opacity: !allLoaded || busy ? 0.5 : pressed ? 0.85 : 1 },
          ]}
        >
          <Text style={styles.dangerText}>{busy ? '清空中…' : '🗑 全部清空'}</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

function ItemRow({
  emoji,
  label,
  count,
}: {
  emoji: string;
  label: string;
  count: number | null;
}) {
  return (
    <View style={styles.itemRow}>
      <Text style={styles.itemEmoji}>{emoji}</Text>
      <Text style={styles.itemLabel}>{label}</Text>
      <Text style={styles.itemCount}>{count === null ? '—' : count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    alignItems: 'center',
    borderColor: colors.danger,
    borderWidth: 1,
    paddingVertical: spacing.xl,
  },
  heroEmoji: { fontSize: 48 },
  heroTitle: {
    color: colors.danger,
    fontSize: font.h2,
    fontWeight: '800',
    marginTop: spacing.md,
  },
  heroSub: {
    color: colors.textDim,
    fontSize: font.small,
    marginTop: spacing.xs,
  },

  listTitle: {
    color: colors.text,
    fontSize: font.h3,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  itemEmoji: { fontSize: 20, width: 28 },
  itemLabel: { color: colors.text, fontSize: font.body, flex: 1 },
  itemCount: {
    color: colors.text,
    fontSize: font.body,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },

  dangerBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.danger,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  dangerText: {
    color: '#FFFFFF',
    fontSize: font.body,
    fontWeight: '700',
  },
  backBtn: {
    alignSelf: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  backText: { color: colors.textDim, fontSize: font.body, fontWeight: '600' },
});

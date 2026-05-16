import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import dayjs from 'dayjs';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { Section } from '@/components/Section';
import { colors, font, radius, spacing } from '@/theme/tokens';
import { resetDB } from '@/db';
import { getStreakStats, listTrainingLogs, type TrainingLog } from '@/db/trainingLogs';
import { getActivePlan } from '@/db/plans';
import { vibrateLight } from '@/utils/haptics';
import type { Plan } from '@/data/planTypes';

// v0.13.0：集中维护 App 版本号，从 app.json 拉
const APP_VERSION = Constants.expoConfig?.version ?? '0.13.0';

const NICKNAME_KEY = 'prefs.nickname';
const LEVEL_KEY = 'prefs.level';
const DEFAULT_NICKNAME = '羽毛球训练者';
const DEFAULT_LEVEL = '业余中级';
const LEVELS = ['业余初级', '业余中级', '业余高级'] as const;
type Level = (typeof LEVELS)[number];

type ProfileStats = {
  best: number;
  firstLogDate: string | null;
  trainedDays: number;
  totalMins: number;
  plan: Plan;
};

export default function MeScreen() {
  const router = useRouter();

  // ===== 私教档案头：昵称 / 等级 =====
  const [nickname, setNickname] = useState(DEFAULT_NICKNAME);
  const [nicknameDraft, setNicknameDraft] = useState(DEFAULT_NICKNAME);
  const [editingName, setEditingName] = useState(false);

  const [level, setLevel] = useState<Level>(DEFAULT_LEVEL);
  const [levelExpanded, setLevelExpanded] = useState(false);

  // ===== 成就墙数据 =====
  const [stats, setStats] = useState<ProfileStats | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        const [nick, lvl] = await Promise.all([
          AsyncStorage.getItem(NICKNAME_KEY),
          AsyncStorage.getItem(LEVEL_KEY),
        ]);
        if (cancelled) return;
        const nv = nick && nick.trim() ? nick : DEFAULT_NICKNAME;
        setNickname(nv);
        setNicknameDraft(nv);
        if (lvl && (LEVELS as readonly string[]).includes(lvl)) {
          setLevel(lvl as Level);
        }

        const [streak, logs, plan] = await Promise.all([
          getStreakStats(),
          listTrainingLogs(100),
          getActivePlan(),
        ]);
        if (cancelled) return;
        const trainedDays = new Set(logs.map((l: TrainingLog) => l.date)).size;
        const totalMins = logs.reduce((a, b) => a + b.duration_min, 0);
        setStats({
          best: streak.best,
          firstLogDate: streak.firstLogDate,
          trainedDays,
          totalMins,
          plan,
        });
      })();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  function commitNickname() {
    const trimmed = nicknameDraft.trim();
    const next = trimmed.length === 0 ? DEFAULT_NICKNAME : trimmed;
    setNickname(next);
    setNicknameDraft(next);
    setEditingName(false);
    AsyncStorage.setItem(NICKNAME_KEY, next).catch(() => {});
  }

  function enterEditName() {
    vibrateLight();
    setNicknameDraft(nickname);
    setEditingName(true);
  }

  function pickLevel(next: Level) {
    setLevel(next);
    setLevelExpanded(false);
    AsyncStorage.setItem(LEVEL_KEY, next).catch(() => {});
  }

  const careerLabel = formatCareerDays(stats?.firstLogDate ?? null);
  const totalDurationLabel = stats ? formatDuration(stats.totalMins) : '';

  const items: { label: string; emoji: string; onPress: () => void; danger?: boolean }[] = [
    { label: '训练日程提醒', emoji: '🔔', onPress: () => router.push('/schedule') },
    { label: '语音设置', emoji: '🔊', onPress: () => router.push('/settings/voice' as never) },
    {
      label: '关于本应用',
      emoji: 'ℹ️',
      onPress: () =>
        Alert.alert(
          `羽毛球私教 v${APP_VERSION}`,
          [
            '• 完全本地存储，无任何网络上传',
            '• 基于 Expo SDK 52 + React Native 0.76',
            '• 离线可用，地下球馆也能跑',
          ].join('\n'),
        ),
    },
    {
      label: '清空所有数据',
      emoji: '⚠️',
      danger: true,
      onPress: () => {
        Alert.alert('确认清空', '所有训练记录、复盘视频、日程将被删除', [
          { text: '取消', style: 'cancel' },
          {
            text: '清空',
            style: 'destructive',
            onPress: async () => {
              await resetDB();
              Alert.alert('已清空');
            },
          },
        ]);
      },
    },
  ];

  return (
    <Screen>
      {/* ===== 私教档案头 ===== */}
      <View style={styles.profile}>
        <View style={styles.avatar}>
          <Text style={{ fontSize: 36 }}>🏸</Text>
        </View>

        {editingName ? (
          <TextInput
            value={nicknameDraft}
            onChangeText={setNicknameDraft}
            onBlur={commitNickname}
            onSubmitEditing={commitNickname}
            maxLength={12}
            autoFocus
            selectTextOnFocus
            returnKeyType="done"
            style={styles.nameInput}
            placeholderTextColor={colors.textDim}
          />
        ) : (
          <Pressable hitSlop={6} onPress={enterEditName}>
            <Text style={styles.name}>{nickname}</Text>
          </Pressable>
        )}

        {/* 等级 chip：未展开时单 chip；展开时 3 选 1 */}
        {levelExpanded ? (
          <View style={styles.levelRow}>
            {LEVELS.map((lv) => {
              const active = lv === level;
              return (
                <Pressable
                  key={lv}
                  hitSlop={4}
                  onPress={() => pickLevel(lv)}
                  style={({ pressed }) => [
                    styles.levelBadge,
                    styles.levelBadgeInRow,
                    active && styles.levelBadgeActive,
                    { opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <Text style={[styles.levelText, active && styles.levelTextActive]}>{lv}</Text>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <Pressable
            hitSlop={6}
            onPress={() => setLevelExpanded(true)}
            style={({ pressed }) => [styles.levelBadge, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Text style={styles.levelText}>{level} ›</Text>
          </Pressable>
        )}

        <Text style={styles.career}>{careerLabel}</Text>
      </View>

      {/* ===== 成就墙三连卡 ===== */}
      <View style={{ marginTop: spacing.xl }}>
        <Section title="📊 我的私教档案">
          <View style={styles.statsRow}>
            {stats ? (
              <>
                {/* 卡 A · 历史最佳（不可点击） */}
                <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                  {stats.best === 0 ? (
                    <>
                      <Text style={styles.statBigDim}>—</Text>
                      <Text style={styles.statSub}>尚无记录</Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.statBig}>{stats.best} 天</Text>
                      <Text style={styles.statSub}>最长连击 🔥</Text>
                    </>
                  )}
                </View>

                {/* 卡 B · 累计资产（不可点击） */}
                <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                  <Text style={styles.statLine1} numberOfLines={1}>
                    {stats.trainedDays} 天
                  </Text>
                  <Text style={styles.statLine2} numberOfLines={1}>
                    {totalDurationLabel}
                  </Text>
                  <Text style={styles.statSub}>累计训练</Text>
                </View>

                {/* 卡 C · 当前计划（可点击） */}
                <Pressable
                  onPress={() => router.push('/plans')}
                  style={({ pressed }) => [
                    styles.statCard,
                    { backgroundColor: colors.card, opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <Text style={styles.statLine1} numberOfLines={1}>
                    {stats.plan.name}
                  </Text>
                  <Text style={styles.statLine2} numberOfLines={1}>
                    {stats.plan.modules.length} 个模块
                  </Text>
                  <Text style={styles.statSub}>执行中 ✓</Text>
                </Pressable>
              </>
            ) : (
              // skeleton：3 张 92px cardAlt 占位
              <>
                <View style={styles.statSkeleton} />
                <View style={styles.statSkeleton} />
                <View style={styles.statSkeleton} />
              </>
            )}
          </View>
        </Section>
      </View>

      {/* ===== 既有 3 个列表项（不动） ===== */}
      <View>
        {items.map((it) => (
          <Pressable
            key={it.label}
            onPress={it.onPress}
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
          >
            <Card style={{ marginBottom: spacing.sm }}>
              <View style={styles.row}>
                <Text style={{ fontSize: 22 }}>{it.emoji}</Text>
                <Text
                  style={[
                    styles.label,
                    it.danger && { color: colors.danger },
                  ]}
                >
                  {it.label}
                </Text>
                <Text style={{ color: colors.textDim, fontSize: 22 }}>›</Text>
              </View>
            </Card>
          </Pressable>
        ))}
      </View>

      <Text style={styles.foot}>v{APP_VERSION} · 本地存储 · 无网络上传</Text>
    </Screen>
  );
}

// ===== 辅助 =====

function formatCareerDays(firstLogDate: string | null): string {
  if (!firstLogDate) return '私教生涯 · 即将开启';
  const start = dayjs(firstLogDate).startOf('day');
  const today = dayjs().startOf('day');
  const n = today.diff(start, 'day') + 1;
  return `私教生涯 第 ${n} 天`;
}

// 与 stats.tsx totalDurationLabel 同公式
function formatDuration(totalMins: number): string {
  if (totalMins < 60) return `${totalMins}m`;
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  if (h < 10 && m >= 30) return `${h}.5h`;
  return `${h}h`;
}

const styles = StyleSheet.create({
  profile: { alignItems: 'center', marginTop: spacing.lg },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  name: { color: colors.text, fontSize: font.h2, fontWeight: '700', marginTop: spacing.md },
  nameInput: {
    color: colors.text,
    fontSize: font.h2,
    fontWeight: '700',
    marginTop: spacing.md,
    textAlign: 'center',
    minWidth: 160,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary,
    paddingVertical: 2,
  },
  career: {
    color: colors.textDim,
    fontSize: font.small,
    marginTop: 6,
  },
  levelRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: 6,
  },
  levelBadge: {
    marginTop: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  levelBadgeInRow: {
    // 展开态时去掉 levelBadge 自带的 marginTop，因为 levelRow 已有 marginTop
    marginTop: 0,
  },
  levelBadgeActive: {
    backgroundColor: colors.primary,
  },
  levelText: { color: colors.primary, fontSize: font.small, fontWeight: '600' },
  levelTextActive: { color: '#FFFFFF' },

  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    minHeight: 92,
    borderRadius: radius.md,
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  statSkeleton: {
    flex: 1,
    minHeight: 92,
    borderRadius: radius.md,
    backgroundColor: colors.cardAlt,
  },
  statBig: {
    color: colors.primary,
    fontSize: font.h1,
    fontWeight: '800',
  },
  statBigDim: {
    color: colors.textDim,
    fontSize: font.h1,
    fontWeight: '800',
  },
  statLine1: {
    color: colors.text,
    fontSize: font.h3,
    fontWeight: '700',
  },
  statLine2: {
    color: colors.textDim,
    fontSize: font.small,
    marginTop: 2,
  },
  statSub: {
    color: colors.textDim,
    fontSize: font.tiny,
    marginTop: 4,
  },

  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  label: { color: colors.text, fontSize: font.body, flex: 1 },
  foot: {
    color: colors.textDim,
    fontSize: font.tiny,
    textAlign: 'center',
    marginTop: spacing.xxl,
  },
});

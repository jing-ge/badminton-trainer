/**
 * v0.45 备份与恢复：导出全量本地数据为 JSON / 从 JSON 粘贴恢复。
 *
 * 真因：Android keystore 一变（EAS 切账号、重装），AsyncStorage 和 app 私有目录里的
 * SQLite 一起被系统清掉；用户的训练记录、计划、偏好全没。这里给用户一份「自己保管」
 * 的退路：导出 → 复制/分享到笔记或网盘；下次进 app 粘回来覆盖恢复。
 *
 * 范围：
 *   - AsyncStorage 9 个 key（昵称、等级、TTS 三件套、教练音开关、上次状态、引导、活动 planId）
 *   - SQLite 5 张表：training_logs / schedules / user_plans / tutorial_favorites / tutorial_views
 *
 * 恢复策略：全覆盖，不是合并 —— 用户场景就是「从零空 app 恢复」，merge 在这没意义还易冲突。
 */
import { useCallback, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import dayjs from 'dayjs';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { colors, font, radius, spacing } from '@/theme/tokens';
import { getDB } from '@/db';
import { vibrateLight, vibrateMedium, vibrateSuccess } from '@/utils/haptics';

const PREFS_KEYS = [
  'prefs.nickname',
  'prefs.level',
  'prefs.ttsVoice',
  'prefs.ttsRate',
  'prefs.ttsPitch',
  'prefs.useCoachAudio',
  'prefs.lastCondition',
  'prefs.onboardingDone',
  'badminton.activePlanId',
] as const;

const BACKUP_TABLES = [
  'training_logs',
  'schedules',
  'user_plans',
  'tutorial_favorites',
  'tutorial_views',
] as const;

type TableName = (typeof BACKUP_TABLES)[number];

// SQLite 列名安全字符集：字母数字下划线,首字符非数字
const SAFE_IDENT = /^[A-Za-z_][A-Za-z0-9_]*$/;

// 把 JSON 反序列化后的任意值收敛成 expo-sqlite runAsync 能 bind 的 string|number|null
// (boolean → 0/1, object/array → JSON 字符串, undefined → null)
function sqliteBind(v: unknown): string | number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === 'string' || typeof v === 'number') return v;
  if (typeof v === 'boolean') return v ? 1 : 0;
  if (typeof v === 'object') {
    try {
      return JSON.stringify(v);
    } catch {
      return null;
    }
  }
  return String(v);
}

type BackupV1 = {
  v: 1;
  ts: number;
  app: string;
  prefs: Record<string, string | null>;
  tables: Record<TableName, Record<string, unknown>[]>;
};

type Counts = {
  prefs: number;
  training_logs: number;
  schedules: number;
  user_plans: number;
  tutorial_favorites: number;
  tutorial_views: number;
};

const ZERO_COUNTS: Counts = {
  prefs: 0,
  training_logs: 0,
  schedules: 0,
  user_plans: 0,
  tutorial_favorites: 0,
  tutorial_views: 0,
};

export default function BackupScreen() {
  const [counts, setCounts] = useState<Counts | null>(null);
  const [exportText, setExportText] = useState('');
  const [importText, setImportText] = useState('');
  const [busy, setBusy] = useState<null | 'export' | 'import'>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          const c = await readCounts();
          if (!cancelled) setCounts(c);
        } catch {
          if (!cancelled) setCounts(ZERO_COUNTS);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  async function onExport() {
    if (busy) return;
    setBusy('export');
    vibrateLight();
    try {
      const payload = await buildBackup();
      const text = JSON.stringify(payload);
      setExportText(text);
      vibrateSuccess();
    } catch (e) {
      showError('导出失败', e);
    } finally {
      setBusy(null);
    }
  }

  async function onShare() {
    if (!exportText) return;
    try {
      await Share.share({ message: exportText });
    } catch {
      // 用户取消 share 不当错误
    }
  }

  function onImport() {
    if (busy) return;
    const text = importText.trim();
    if (!text) {
      Alert.alert('请先粘贴备份', '把之前导出的 JSON 粘贴到下方输入框');
      return;
    }
    let parsed: BackupV1;
    try {
      parsed = parseBackup(text);
    } catch (e) {
      showError('解析失败', e);
      return;
    }
    const summary = describeBackup(parsed);
    vibrateMedium();
    const msg = `将用这份备份覆盖当前数据：\n\n${summary}\n\n该操作不可撤销。`;
    if (Platform.OS === 'web') {
      const ok = typeof window !== 'undefined' && window.confirm(`确认恢复？\n\n${msg}`);
      if (ok) doImport(parsed);
      return;
    }
    Alert.alert('确认恢复？', msg, [
      { text: '取消', style: 'cancel' },
      { text: '覆盖恢复', style: 'destructive', onPress: () => doImport(parsed) },
    ]);
  }

  async function doImport(payload: BackupV1) {
    setBusy('import');
    try {
      await restoreBackup(payload);
      const c = await readCounts();
      setCounts(c);
      vibrateSuccess();
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') window.alert('恢复成功 ✓');
      } else {
        Alert.alert('恢复成功 ✓', '回到首页即可看到老记录');
      }
      setImportText('');
    } catch (e) {
      showError('恢复失败', e);
    } finally {
      setBusy(null);
    }
  }

  return (
    <Screen>
      <Text style={styles.title}>💾 备份与恢复</Text>
      <Text style={styles.sub}>
        重装 / 换设备 / 系统清数据后，用导出的 JSON 一键恢复
      </Text>

      {/* 当前状态 */}
      <Card style={{ marginTop: spacing.lg }}>
        <Text style={styles.sectionLabel}>当前数据</Text>
        <CountRow label="训练记录" count={counts?.training_logs} />
        <CountRow label="日程提醒" count={counts?.schedules} />
        <CountRow label="自定义周计划" count={counts?.user_plans} />
        <CountRow label="教程收藏" count={counts?.tutorial_favorites} />
        <CountRow label="教程浏览" count={counts?.tutorial_views} />
        <CountRow label="个人偏好" count={counts?.prefs} />
      </Card>

      {/* 导出 */}
      <Card style={{ marginTop: spacing.lg }}>
        <Text style={styles.sectionTitle}>1️⃣ 导出</Text>
        <Text style={styles.sectionHint}>
          生成 JSON 文本 → 长按下方文本框「全选 → 复制」，或点「分享」发到微信收藏 / 邮件 / 备忘录
        </Text>
        <Pressable
          onPress={onExport}
          disabled={busy !== null}
          style={({ pressed }) => [
            styles.primaryBtn,
            { opacity: busy !== null ? 0.5 : pressed ? 0.85 : 1 },
          ]}
        >
          <Text style={styles.primaryBtnText}>
            {busy === 'export' ? '生成中…' : '📦 生成备份'}
          </Text>
        </Pressable>

        {!!exportText && (
          <>
            <TextInput
              value={exportText}
              multiline
              editable={false}
              selectTextOnFocus
              scrollEnabled
              style={styles.textArea}
            />
            <View style={styles.metaRow}>
              <Text style={styles.metaText}>
                {exportText.length.toLocaleString()} 字符
              </Text>
              <Pressable
                onPress={onShare}
                style={({ pressed }) => [
                  styles.shareBtn,
                  { opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <Text style={styles.shareBtnText}>↗ 分享</Text>
              </Pressable>
            </View>
          </>
        )}
      </Card>

      {/* 导入 */}
      <Card style={{ marginTop: spacing.lg }}>
        <Text style={styles.sectionTitle}>2️⃣ 恢复</Text>
        <Text style={styles.sectionHint}>
          把之前导出的 JSON 粘贴进来 → 点「覆盖恢复」。当前数据会被替换，操作不可撤销。
        </Text>
        <TextInput
          value={importText}
          onChangeText={setImportText}
          placeholder="在这里粘贴备份 JSON…"
          placeholderTextColor={colors.textDim}
          multiline
          scrollEnabled
          style={styles.textArea}
        />
        <Pressable
          onPress={onImport}
          disabled={busy !== null}
          style={({ pressed }) => [
            styles.dangerBtn,
            { opacity: busy !== null ? 0.5 : pressed ? 0.85 : 1 },
          ]}
        >
          <Text style={styles.dangerBtnText}>
            {busy === 'import' ? '恢复中…' : '⚠️ 覆盖恢复'}
          </Text>
        </Pressable>
      </Card>

      <Text style={styles.footTip}>
        备份内容仅在本机生成与解析，从不上传任何服务器。
      </Text>
    </Screen>
  );
}

function CountRow({ label, count }: { label: string; count: number | undefined }) {
  return (
    <View style={styles.countRow}>
      <Text style={styles.countLabel}>{label}</Text>
      <Text style={styles.countValue}>{count === undefined ? '—' : count}</Text>
    </View>
  );
}

// ============= 数据层 =============

async function readCounts(): Promise<Counts> {
  const db = await getDB();
  const tableCounts: Record<TableName, number> = {} as Record<TableName, number>;
  for (const t of BACKUP_TABLES) {
    try {
      const rows = await db.getAllAsync<{ n: number }>(`SELECT COUNT(*) as n FROM ${t}`);
      tableCounts[t] = rows[0]?.n ?? 0;
    } catch {
      tableCounts[t] = 0;
    }
  }
  let prefsN = 0;
  try {
    const entries = await AsyncStorage.multiGet([...PREFS_KEYS]);
    prefsN = entries.filter(([, v]) => v != null).length;
  } catch {
    prefsN = 0;
  }
  return {
    prefs: prefsN,
    training_logs: tableCounts.training_logs,
    schedules: tableCounts.schedules,
    user_plans: tableCounts.user_plans,
    tutorial_favorites: tableCounts.tutorial_favorites,
    tutorial_views: tableCounts.tutorial_views,
  };
}

async function buildBackup(): Promise<BackupV1> {
  const db = await getDB();
  const prefsEntries = await AsyncStorage.multiGet([...PREFS_KEYS]);
  const prefs: Record<string, string | null> = {};
  for (const [k, v] of prefsEntries) prefs[k] = v;

  const tables = {} as Record<TableName, Record<string, unknown>[]>;
  for (const t of BACKUP_TABLES) {
    try {
      tables[t] = await db.getAllAsync<Record<string, unknown>>(`SELECT * FROM ${t}`);
    } catch {
      tables[t] = [];
    }
  }
  return { v: 1, ts: Date.now(), app: 'badminton', prefs, tables };
}

function parseBackup(text: string): BackupV1 {
  const obj = JSON.parse(text);
  if (!obj || typeof obj !== 'object') throw new Error('不是合法 JSON');
  if (obj.v !== 1) throw new Error(`备份版本不支持：v=${obj.v ?? '?'}`);
  if (!obj.prefs || !obj.tables) throw new Error('结构缺失 prefs/tables');
  // 表字段做温和归一：缺失的表填空数组，不报错
  const tables = {} as Record<TableName, Record<string, unknown>[]>;
  for (const t of BACKUP_TABLES) {
    const arr = obj.tables[t];
    tables[t] = Array.isArray(arr) ? arr : [];
  }
  return {
    v: 1,
    ts: typeof obj.ts === 'number' ? obj.ts : Date.now(),
    app: typeof obj.app === 'string' ? obj.app : 'badminton',
    prefs: obj.prefs as Record<string, string | null>,
    tables,
  };
}

function describeBackup(b: BackupV1): string {
  const date = dayjs(b.ts).format('YYYY-MM-DD HH:mm');
  const lines = [
    `备份时间：${date}`,
    `训练记录：${b.tables.training_logs.length}`,
    `日程提醒：${b.tables.schedules.length}`,
    `自定义周计划：${b.tables.user_plans.length}`,
    `教程收藏：${b.tables.tutorial_favorites.length}`,
    `个人偏好：${Object.values(b.prefs).filter((v) => v != null).length}`,
  ];
  return lines.join('\n');
}

async function restoreBackup(b: BackupV1) {
  const db = await getDB();

  // 先把每张表真实列名拉出来：用作白名单，杜绝从 JSON key 拼到 SQL 的注入
  // (列名是 ` 反引号包不住的, 用双引号 + 白名单二重防护)
  const tableCols: Record<TableName, Set<string>> = {} as Record<TableName, Set<string>>;
  for (const t of BACKUP_TABLES) {
    try {
      const info = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${t})`);
      tableCols[t] = new Set(info.map((r) => r.name));
    } catch {
      tableCols[t] = new Set();
    }
  }

  // 整个恢复包在一个事务里：任意一步失败 ROLLBACK,用户看到的 DB 状态要么全是新备份要么全是老数据
  await db.execAsync('BEGIN');
  try {
    for (const t of BACKUP_TABLES) {
      await db.execAsync(`DELETE FROM ${t}`);
    }

    for (const t of BACKUP_TABLES) {
      const rows = b.tables[t];
      const allowedCols = tableCols[t];
      if (rows.length === 0 || allowedCols.size === 0) continue;
      for (const row of rows) {
        // 只保留真实存在 + 合法标识符 + 在白名单内的列；既挡 SQL 注入也挡跨版本字段漂移
        const keys = Object.keys(row).filter(
          (k) => SAFE_IDENT.test(k) && allowedCols.has(k),
        );
        if (keys.length === 0) continue;
        const placeholders = keys.map(() => '?').join(',');
        const cols = keys.map((k) => `"${k}"`).join(',');
        const values = keys.map((k) => sqliteBind(row[k]));
        await db.runAsync(
          `INSERT OR REPLACE INTO ${t} (${cols}) VALUES (${placeholders})`,
          values,
        );
      }
    }

    await db.execAsync('COMMIT');
  } catch (e) {
    try {
      await db.execAsync('ROLLBACK');
    } catch {
      // 已经在崩溃路径,roll 不动也只能放
    }
    throw e;
  }

  // 3) 写回 prefs：仅写白名单内的 key，避免被注入恶意 key
  const writes: [string, string][] = [];
  const removes: string[] = [];
  for (const k of PREFS_KEYS) {
    const v = b.prefs[k];
    if (typeof v === 'string') writes.push([k, v]);
    else removes.push(k);
  }
  if (writes.length > 0) await AsyncStorage.multiSet(writes);
  if (removes.length > 0) await AsyncStorage.multiRemove(removes);
}

function showError(title: string, e: unknown) {
  const msg = e instanceof Error ? e.message : String(e);
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.alert(`${title}：${msg}`);
  } else {
    Alert.alert(title, msg);
  }
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: font.h1, fontWeight: '700' },
  sub: { color: colors.textDim, marginTop: 4, fontSize: font.small, lineHeight: 20 },

  sectionLabel: {
    color: colors.textDim,
    fontSize: font.tiny,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: font.h3,
    fontWeight: '700',
  },
  sectionHint: {
    color: colors.textDim,
    fontSize: font.small,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
    lineHeight: 20,
  },

  countRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  countLabel: { color: colors.text, fontSize: font.body },
  countValue: {
    color: colors.primary,
    fontSize: font.body,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },

  primaryBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: font.body, fontWeight: '700' },

  dangerBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.danger,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  dangerBtnText: { color: '#FFFFFF', fontSize: font.body, fontWeight: '700' },

  textArea: {
    marginTop: spacing.md,
    minHeight: 120,
    maxHeight: 200,
    color: colors.text,
    fontSize: font.tiny,
    backgroundColor: colors.cardAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    textAlignVertical: 'top',
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  metaText: { color: colors.textDim, fontSize: font.tiny },
  shareBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  shareBtnText: { color: colors.primary, fontSize: font.small, fontWeight: '700' },

  footTip: {
    color: colors.textDim,
    fontSize: font.tiny,
    textAlign: 'center',
    marginTop: spacing.xxl,
    lineHeight: 18,
  },
});

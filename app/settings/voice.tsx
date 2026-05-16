import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { colors, font, radius, spacing } from '@/theme/tokens';
import { vibrateLight } from '@/utils/haptics';

// v0.25 试听文本：连贯句 + 训练实际倒数（单字断句）— 让设置页所听即训练所得
const PREVIEW_TEXT = '准备开始训练。五。四。三。二。一。开始';

type VoiceItem = {
  id: string;
  name: string;
  language: string;
  quality?: string;
};

export default function VoiceSettings() {
  const [voices, setVoices] = useState<VoiceItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rate, setRate] = useState<number>(1.0);
  const [pitch, setPitch] = useState<number>(1.0);
  const [loaded, setLoaded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          const all = await Speech.getAvailableVoicesAsync();
          if (cancelled) return;
          // 只列中文 voice + 不含 zh-TW / zh-HK；附加 zh-Hans / cmn 等变体
          const zhVoices: VoiceItem[] = all
            .filter((v) => {
              const l = (v.language || '').toLowerCase();
              if (!l.startsWith('zh') && !l.startsWith('cmn')) return false;
              if (l.includes('tw') || l.includes('hk')) return false;
              return true;
            })
            .map((v) => ({
              id: v.identifier,
              name: v.name || v.identifier,
              language: v.language || '',
              quality: (v as { quality?: string }).quality,
            }));
          setVoices(zhVoices);

          const [savedId, savedRate, savedPitch] = await Promise.all([
            AsyncStorage.getItem('prefs.ttsVoice'),
            AsyncStorage.getItem('prefs.ttsRate'),
            AsyncStorage.getItem('prefs.ttsPitch'),
          ]);
          if (cancelled) return;
          setSelectedId(savedId);
          if (savedRate) setRate(parseFloat(savedRate));
          if (savedPitch) setPitch(parseFloat(savedPitch));
          setLoaded(true);
        } catch {
          if (!cancelled) setLoaded(true);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  function previewVoice(id: string | null) {
    Speech.stop();
    vibrateLight();
    const opts: Speech.SpeechOptions = { language: 'zh-CN', rate, pitch };
    if (id) opts.voice = id;
    Speech.speak(PREVIEW_TEXT, opts);
  }

  function selectVoice(id: string | null) {
    setSelectedId(id);
    vibrateLight();
    if (id) {
      AsyncStorage.setItem('prefs.ttsVoice', id).catch(() => {});
    } else {
      AsyncStorage.removeItem('prefs.ttsVoice').catch(() => {});
    }
    previewVoice(id);
  }

  function adjustRate(delta: number) {
    const next = Math.max(0.5, Math.min(2.0, Math.round((rate + delta) * 10) / 10));
    setRate(next);
    vibrateLight();
    AsyncStorage.setItem('prefs.ttsRate', String(next)).catch(() => {});
    // 自动试听新参数
    Speech.stop();
    const opts: Speech.SpeechOptions = { language: 'zh-CN', rate: next, pitch };
    if (selectedId) opts.voice = selectedId;
    Speech.speak('五。四。三。二。一', opts);
  }

  function adjustPitch(delta: number) {
    const next = Math.max(0.5, Math.min(2.0, Math.round((pitch + delta) * 10) / 10));
    setPitch(next);
    vibrateLight();
    AsyncStorage.setItem('prefs.ttsPitch', String(next)).catch(() => {});
    Speech.stop();
    const opts: Speech.SpeechOptions = { language: 'zh-CN', rate, pitch: next };
    if (selectedId) opts.voice = selectedId;
    Speech.speak('五。四。三。二。一', opts);
  }

  return (
    <Screen>
      <Text style={styles.title}>🔊 语音设置</Text>
      <Text style={styles.sub}>挑一个最自然的声音；点试听对比效果</Text>

      <Card style={styles.paramCard}>
        <View style={styles.paramRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.paramLabel}>语速</Text>
            <Text style={styles.paramValue}>{rate.toFixed(1)}x</Text>
          </View>
          <Pressable onPress={() => adjustRate(-0.1)} style={styles.adjBtn}>
            <Text style={styles.adjBtnText}>−</Text>
          </Pressable>
          <Pressable onPress={() => adjustRate(0.1)} style={styles.adjBtn}>
            <Text style={styles.adjBtnText}>＋</Text>
          </Pressable>
        </View>
        <View style={[styles.paramRow, { marginTop: spacing.md }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.paramLabel}>音调</Text>
            <Text style={styles.paramValue}>{pitch.toFixed(1)}x</Text>
          </View>
          <Pressable onPress={() => adjustPitch(-0.1)} style={styles.adjBtn}>
            <Text style={styles.adjBtnText}>−</Text>
          </Pressable>
          <Pressable onPress={() => adjustPitch(0.1)} style={styles.adjBtn}>
            <Text style={styles.adjBtnText}>＋</Text>
          </Pressable>
        </View>
        <Text style={styles.paramHint}>调整后会自动试听</Text>
      </Card>

      <View style={{ marginTop: spacing.md }}>
        <Text style={styles.sectionLabel}>可用普通话语音（{voices.length}）</Text>

        {/* 系统默认（清除选择） */}
        <VoiceRow
          name="系统默认"
          subtitle="跟随手机当前 TTS 引擎"
          selected={selectedId === null}
          onSelect={() => selectVoice(null)}
          onPreview={() => previewVoice(null)}
        />

        {loaded && voices.length === 0 && (
          <Card style={{ marginTop: spacing.sm }}>
            <Text style={styles.empty}>
              没找到普通话语音。请进入：手机系统设置 → 通用 / 语言和输入法 → 文本转语音输出 → 安装"中文（中国）"语音包后回来。
            </Text>
          </Card>
        )}

        {voices.map((v) => (
          <VoiceRow
            key={v.id}
            name={voiceDisplayName(v)}
            subtitle={`${v.language}${v.quality ? ` · ${v.quality}` : ''}`}
            selected={selectedId === v.id}
            onSelect={() => selectVoice(v.id)}
            onPreview={() => previewVoice(v.id)}
          />
        ))}
      </View>

      <Card style={{ marginTop: spacing.lg, backgroundColor: colors.cardAlt }}>
        <Text style={styles.tipTitle}>💡 听起来还是机器人感？</Text>
        <Text style={styles.tipBody}>
          系统 TTS 引擎本身决定上限。Android 用户可以：
        </Text>
        <Text style={styles.tipBody}>1. 安装「Google 文字转语音」或厂商 TTS 引擎</Text>
        <Text style={styles.tipBody}>2. 系统设置里下载普通话「高质量/增强」语音包</Text>
        <Text style={styles.tipBody}>3. 在「文本转语音输出」里切到该引擎</Text>
        <Text style={styles.tipBody}>装好后回到这里，会出现更多可选语音。</Text>
      </Card>
    </Screen>
  );
}

function VoiceRow({
  name,
  subtitle,
  selected,
  onSelect,
  onPreview,
}: {
  name: string;
  subtitle: string;
  selected: boolean;
  onSelect: () => void;
  onPreview: () => void;
}) {
  return (
    <Pressable
      onPress={onSelect}
      style={({ pressed }) => [
        styles.voiceRow,
        selected && { borderColor: colors.primary, borderWidth: 2 },
        { opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.voiceName}>
          {selected && '✓ '}
          {name}
        </Text>
        <Text style={styles.voiceSub} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      <Pressable hitSlop={10} onPress={onPreview} style={styles.previewBtn}>
        <Text style={styles.previewBtnText}>🔊 试听</Text>
      </Pressable>
    </Pressable>
  );
}

function voiceDisplayName(v: VoiceItem): string {
  // 识别一些常见的高品质 voice 名加注释
  const id = v.id.toLowerCase();
  if (id.includes('tingting')) return `${v.name} · 婷婷（女声）`;
  if (id.includes('siri') && id.includes('female')) return `${v.name} · Siri 女声`;
  if (id.includes('siri') && id.includes('male')) return `${v.name} · Siri 男声`;
  if (id.includes('enhanced')) return `${v.name} · 增强版`;
  if (id.includes('premium')) return `${v.name} · 高质量`;
  return v.name;
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: font.h1, fontWeight: '700' },
  sub: { color: colors.textDim, marginTop: 4, fontSize: font.small },
  sectionLabel: { color: colors.textDim, fontSize: font.small, marginBottom: spacing.sm, marginTop: spacing.md },
  paramCard: { marginTop: spacing.lg },
  paramRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  paramLabel: { color: colors.textDim, fontSize: font.small },
  paramValue: { color: colors.text, fontSize: font.h2, fontWeight: '800', marginTop: 2 },
  paramHint: { color: colors.textDim, fontSize: font.tiny, marginTop: spacing.md, textAlign: 'center' },
  adjBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  adjBtnText: { color: colors.primary, fontSize: 24, fontWeight: '800', lineHeight: 28 },
  voiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  voiceName: { color: colors.text, fontSize: font.body, fontWeight: '600' },
  voiceSub: { color: colors.textDim, fontSize: font.tiny, marginTop: 2 },
  previewBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  previewBtnText: { color: colors.primary, fontSize: font.small, fontWeight: '600' },
  empty: { color: colors.textDim, padding: spacing.md, lineHeight: 20 },
  tipTitle: { color: colors.text, fontSize: font.body, fontWeight: '700', marginBottom: spacing.sm },
  tipBody: { color: colors.textDim, fontSize: font.small, lineHeight: 22 },
});

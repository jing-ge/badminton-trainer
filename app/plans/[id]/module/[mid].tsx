import { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { colors, font, radius, spacing } from '@/theme/tokens';
import type { Plan, TrainingCategory, TrainingItem, TrainingModule } from '@/data/planTypes';
import { getPlanById, savePlan } from '@/db/plans';
import { presetItems } from '@/data/presets';

const CATS: { id: TrainingCategory; label: string }[] = [
  { id: 'tech', label: '技术' },
  { id: 'footwork', label: '步法' },
  { id: 'fitness', label: '体能' },
  { id: 'match', label: '实战' },
  { id: 'recovery', label: '恢复' },
];

export default function ModuleEditScreen() {
  const { id, mid } = useLocalSearchParams<{ id: string; mid: string }>();
  const router = useRouter();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [mod, setMod] = useState<TrainingModule | null>(null);

  const [showPreset, setShowPreset] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [customItem, setCustomItem] = useState<Partial<TrainingItem>>({ category: 'tech', duration_min: 15 });

  useEffect(() => {
    (async () => {
      const p = await getPlanById(id);
      if (p) {
        setPlan(p);
        setMod(p.modules.find((m) => m.id === mid) || null);
      }
    })();
  }, [id, mid]);

  async function updateMod(patch: Partial<TrainingModule>) {
    if (!plan || !mod) return;
    const nextMod = { ...mod, ...patch };
    const nextPlan = {
      ...plan,
      modules: plan.modules.map((m) => (m.id === mid ? nextMod : m)),
    };
    setMod(nextMod);
    setPlan(nextPlan);
    await savePlan(nextPlan);
  }

  function remove(itemId: string) {
    if (!mod) return;
    updateMod({ items: mod.items.filter((i) => i.id !== itemId) });
  }

  function move(idx: number, dir: -1 | 1) {
    if (!mod) return;
    const items = [...mod.items];
    if (idx + dir < 0 || idx + dir >= items.length) return;
    const temp = items[idx];
    items[idx] = items[idx + dir];
    items[idx + dir] = temp;
    updateMod({ items });
  }

  function addPreset(p: TrainingItem) {
    if (!mod) return;
    updateMod({ items: [...mod.items, { ...p, id: `it-${Date.now()}-${Math.random()}` }] });
    setShowPreset(false);
  }

  function saveCustom() {
    if (!mod) return;
    if (!customItem.name?.trim()) {
      Alert.alert('请输入训练名称');
      return;
    }
    updateMod({
      items: [
        ...mod.items,
        {
          id: `it-${Date.now()}`,
          name: customItem.name.trim(),
          duration_min: customItem.duration_min || 10,
          category: customItem.category || 'tech',
          notes: customItem.notes?.trim(),
          source: 'custom',
        },
      ],
    });
    setShowCustom(false);
    setCustomItem({ category: 'tech', duration_min: 15 });
  }

  if (!plan || !mod) return <Screen><Text style={{ color: colors.textDim }}>加载中...</Text></Screen>;

  return (
    <Screen scroll={false}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <Card style={{ marginBottom: spacing.md }}>
          <Text style={styles.label}>模块名称</Text>
          <TextInput value={mod.name} onChangeText={(v) => updateMod({ name: v })} style={styles.input} />
          
          <Text style={[styles.label, { marginTop: spacing.md }]}>重点目标</Text>
          <TextInput value={mod.focus} onChangeText={(v) => updateMod({ focus: v })} style={styles.input} />

          <Text style={[styles.label, { marginTop: spacing.md }]}>主要分类</Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm, flexWrap: 'wrap' }}>
            {CATS.map((c) => (
              <Pressable
                key={c.id}
                onPress={() => updateMod({ category: c.id })}
                style={[styles.catBtn, mod.category === c.id && { backgroundColor: colors.primary, borderColor: colors.primary }]}
              >
                <Text style={{ color: mod.category === c.id ? '#fff' : colors.textDim }}>{c.label}</Text>
              </Pressable>
            ))}
          </View>

          {plan.mode === 'weekly' && (
            <>
              <Text style={[styles.label, { marginTop: spacing.md }]}>安排在星期几</Text>
              <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm, flexWrap: 'wrap' }}>
                {[1, 2, 3, 4, 5, 6, 0].map((wd) => (
                  <Pressable
                    key={wd}
                    onPress={() => updateMod({ weekday: wd })}
                    style={[styles.catBtn, mod.weekday === wd && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                  >
                    <Text style={{ color: mod.weekday === wd ? '#fff' : colors.textDim }}>
                      {['日', '一', '二', '三', '四', '五', '六'][wd]}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}

          {plan.mode === 'random' && (
            <>
              <Text style={[styles.label, { marginTop: spacing.md }]}>随机抽取权重 (1-10，越大越容易被抽中)</Text>
              <TextInput
                value={String(mod.weight ?? 1)}
                onChangeText={(v) => updateMod({ weight: Math.max(1, Math.min(10, parseInt(v) || 1)) })}
                style={styles.input}
                keyboardType="number-pad"
              />
            </>
          )}
        </Card>

        <Text style={styles.sectionTitle}>训练项（{mod.items.length}）</Text>
        
        {mod.items.map((it, i) => (
          <Card key={it.id} style={{ marginBottom: spacing.sm, padding: spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flexDirection: 'column', gap: 4, marginRight: spacing.md }}>
                <Pressable onPress={() => move(i, -1)} disabled={i === 0}>
                  <Text style={{ color: i === 0 ? colors.border : colors.text, fontSize: 20 }}>▲</Text>
                </Pressable>
                <Pressable onPress={() => move(i, 1)} disabled={i === mod.items.length - 1}>
                  <Text style={{ color: i === mod.items.length - 1 ? colors.border : colors.text, fontSize: 20 }}>▼</Text>
                </Pressable>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: '700', fontSize: font.body }}>{it.name}</Text>
                <Text style={{ color: colors.textDim, fontSize: font.small, marginTop: 4 }}>
                  {it.duration_min} 分钟 · {CATS.find(c=>c.id===it.category)?.label}
                </Text>
                {it.notes && <Text style={{ color: colors.primary, fontSize: font.small, marginTop: 2 }}>{it.notes}</Text>}
              </View>
              <Pressable onPress={() => remove(it.id)} style={{ padding: spacing.sm }}>
                <Text style={{ color: colors.danger, fontSize: 20 }}>×</Text>
              </Pressable>
            </View>
          </Card>
        ))}

        <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.md }}>
          <Button title="从预置库选" onPress={() => setShowPreset(true)} style={{ flex: 1 }} />
          <Button title="手写输入" variant="ghost" onPress={() => setShowCustom(true)} style={{ flex: 1 }} />
        </View>
      </ScrollView>

      {/* 预置库选择 Modal */}
      <Modal visible={showPreset} animationType="slide" presentationStyle="formSheet">
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>从预置库添加</Text>
            <Pressable onPress={() => setShowPreset(false)}><Text style={{ color: colors.primary, fontSize: 16 }}>关闭</Text></Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
            {presetItems.map(p => (
              <Pressable key={p.id} onPress={() => addPreset(p)}>
                <Card style={{ marginBottom: spacing.sm }}>
                  <Text style={{ color: colors.text, fontWeight: '700' }}>{p.name}</Text>
                  <Text style={{ color: colors.textDim, fontSize: font.small, marginTop: 4 }}>
                    {p.duration_min} 分钟 · {CATS.find(c=>c.id===p.category)?.label}
                  </Text>
                </Card>
              </Pressable>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* 手写输入 Modal */}
      <Modal visible={showCustom} animationType="fade" transparent>
        <View style={styles.overlay}>
          <View style={styles.dialog}>
            <Text style={styles.modalTitle}>自定义训练项</Text>
            <Text style={[styles.label, { marginTop: spacing.md }]}>名称</Text>
            <TextInput value={customItem.name} onChangeText={v => setCustomItem(prev => ({...prev, name: v}))} style={styles.input} placeholder="如：挥拍练习 100次" />
            <Text style={[styles.label, { marginTop: spacing.md }]}>时长 (分钟)</Text>
            <TextInput value={String(customItem.duration_min || '')} onChangeText={v => setCustomItem(prev => ({...prev, duration_min: parseInt(v)||0}))} style={styles.input} keyboardType="number-pad" />
            <Text style={[styles.label, { marginTop: spacing.md }]}>类别</Text>
            <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm, flexWrap: 'wrap' }}>
              {CATS.map((c) => (
                <Pressable
                  key={c.id}
                  onPress={() => setCustomItem(prev => ({...prev, category: c.id}))}
                  style={[styles.catBtn, customItem.category === c.id && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                >
                  <Text style={{ color: customItem.category === c.id ? '#fff' : colors.textDim }}>{c.label}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={[styles.label, { marginTop: spacing.md }]}>要求/备注 (可选)</Text>
            <TextInput value={customItem.notes} onChangeText={v => setCustomItem(prev => ({...prev, notes: v}))} style={styles.input} />
            
            <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl }}>
              <Button title="取消" variant="ghost" onPress={() => setShowCustom(false)} style={{ flex: 1 }} />
              <Button title="确定添加" onPress={saveCustom} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { color: colors.textDim, fontSize: font.small },
  input: { color: colors.text, backgroundColor: colors.cardAlt, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.sm, fontSize: font.body },
  catBtn: { paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border },
  sectionTitle: { color: colors.textDim, fontSize: font.small, marginTop: spacing.xl, marginBottom: spacing.md },
  modalSafe: { flex: 1, backgroundColor: colors.bg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle: { color: colors.text, fontSize: font.h3, fontWeight: '700' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: spacing.lg },
  dialog: { backgroundColor: colors.card, padding: spacing.lg, borderRadius: radius.lg },
});

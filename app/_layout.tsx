import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as SystemUI from 'expo-system-ui';
import { getDB } from '@/db';
import { colors } from '@/theme/tokens';

export default function RootLayout() {
  useEffect(() => {
    getDB().catch((e) => console.warn('DB init failed', e));
    
    // 强制将系统背景（包括下拉回弹和底部安全区）设为深蓝色，防止出现白边
    SystemUI.setBackgroundColorAsync(colors.bg).catch(()=>{});
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.bg },
            headerTintColor: colors.text,
            headerTitleStyle: { fontWeight: '700' },
            contentStyle: { backgroundColor: colors.bg },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="pose/index" options={{ title: '动作识别' }} />
          <Stack.Screen name="training/[id]" options={{ title: '训练详情' }} />
          <Stack.Screen name="training/today" options={{ title: '今日训练' }} />
          <Stack.Screen name="training/run" options={{ title: '训练中', headerShown: false, presentation: 'fullScreenModal' }} />
          <Stack.Screen name="training/module/[id]" options={{ title: '训练模块' }} />
          <Stack.Screen name="training/log" options={{ title: '训练打卡', presentation: 'modal' }} />
          <Stack.Screen name="training/fitness" options={{ title: '体能训练' }} />
          <Stack.Screen name="plans/index" options={{ title: '训练计划' }} />
          <Stack.Screen name="plans/[id]/edit" options={{ title: '编辑计划' }} />
          <Stack.Screen name="plans/[id]/module/[mid]" options={{ title: '编辑模块' }} />
          <Stack.Screen name="tutorial/[id]" options={{ title: '动作要点' }} />
          <Stack.Screen name="replay/index" options={{ title: '录像复盘' }} />
          <Stack.Screen name="replay/[id]" options={{ title: '复盘详情' }} />
          <Stack.Screen name="schedule/index" options={{ title: '训练日程' }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

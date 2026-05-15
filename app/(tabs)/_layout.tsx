import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';
import { colors } from '@/theme/tokens';

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  // emoji 自带颜色,无法响应 tintColor;改为 emoji 下方加一根高亮条作为激活态
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 18 }}>{label}</Text>
      <View
        style={{
          width: 18,
          height: 3,
          marginTop: 4,
          borderRadius: 2,
          backgroundColor: focused ? colors.primary : 'transparent',
        }}
      />
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '700' },
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textDim,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '首页',
          tabBarIcon: ({ focused }) => <TabIcon label="🏠" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="train"
        options={{
          title: '训练',
          tabBarIcon: ({ focused }) => <TabIcon label="🏸" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: '记录',
          tabBarIcon: ({ focused }) => <TabIcon label="📊" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: '教程',
          tabBarIcon: ({ focused }) => <TabIcon label="📖" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="me"
        options={{
          title: '我的',
          tabBarIcon: ({ focused }) => <TabIcon label="👤" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

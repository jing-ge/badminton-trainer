# 羽毛球训练 App

一个面向**业余中级球友**的 React Native 训练辅助应用，集成训练计划、动作识别、技术教程、体能训练、录像复盘和提醒功能。**数据完全本地存储**，无需注册、无网络上传。

## 功能一览

| 模块 | 说明 |
|------|------|
| 🏠 首页 | 今日训练计划、连续打卡天数、快捷入口 |
| 🏸 训练 | 业余中级 7 天周计划，每日 5-7 个训练项 |
| 📊 记录 | 训练时长趋势图、强度评分、历史回顾 |
| 📖 教程 | 8 个核心技术动作的要点 / 错误 / 自检表 |
| 🎥 动作识别 | 摄像头实时姿态分析，针对高远/杀/搓/步法的即时反馈 |
| 💪 体能训练 | 8 个针对羽毛球的体能动作，自动计时换组 |
| 🎬 录像复盘 | 导入比赛视频，时间戳标注问题点 |
| 🔔 训练日程 | 每周定时本地推送提醒 |

## 项目结构

```
.
├── app/                    # Expo Router 路由
│   ├── (tabs)/             # 底部 5 个 Tab
│   ├── pose/               # 动作识别
│   ├── training/           # 训练详情、打卡、体能
│   ├── tutorial/           # 教程详情
│   ├── replay/             # 录像复盘
│   └── schedule/           # 提醒
├── src/
│   ├── components/         # Screen / Card / Button / Section
│   ├── data/               # 训练计划、教程、体能动作（静态数据）
│   ├── db/                 # SQLite 表与仓储
│   ├── features/pose/      # 姿态识别与分析引擎
│   ├── theme/              # 颜色、间距、字号
│   └── utils/              # 通知工具
└── app.json, package.json, ...
```

## 运行

### 准备环境

```bash
node -v   # 建议 >= 18
npm -v
```

如果还没装 Expo CLI：
```bash
npm i -g expo
```

### 安装依赖

```bash
npm install
# 或者
yarn install
```

### 启动开发服务

```bash
npm run start
```

扫码用 **Expo Go** 即可打开（动作识别页摄像头与本地通知在 Expo Go 中受限，建议构建 dev client）。

### 完整功能（含真实摄像头/通知）

`react-native-vision-camera` 和 `expo-notifications` 需要原生模块，必须 **prebuild + 构建 dev client**：

```bash
npm run prebuild
npm run ios     # 或 npm run android
```

## 动作识别说明

代码内置了一个**姿态分析引擎**（`src/features/pose/analyzer.ts`），针对以下动作做实时检查：

- **正手高远 / 杀球准备**：是否侧身、引拍肘部高度、手臂打开角度
- **击球点高度**：手腕是否在头部上方
- **步法重心**：站姿高低、移动幅度

### 默认模式：Mock

为了让你打开 App **立刻能看到效果**，姿态数据源默认走 Mock（`src/features/pose/source.ts`）：会生成一个会动的人体骨架，UI 与分析逻辑可完整跑通。

### 真机接入 MediaPipe

要用真实摄像头识别，按以下步骤接入 `react-native-mediapipe`：

```bash
npm i react-native-mediapipe react-native-worklets-core
npm run prebuild
```

修改 `src/features/pose/source.ts` 的 `tryLoadMediaPipe` 函数，将占位实现替换为：

```ts
import { useTensorflowModel } from 'react-native-mediapipe';
// 或 useMediaPipePose() hook，根据库版本
// 把检测到的 33 个关键点映射为 17 点 COCO 顺序（或修改 keypoints.ts 的索引）
```

> ⚠️ react-native-mediapipe 是社区项目，API 在不同版本间会变；推荐查阅其 README 对接最新 hook。

## 训练计划个性化

业余中级模板写在 `src/data/plans.ts`，按周一-周日 7 天分配：
- 周一/三：技术日（后场/前场）
- 周二：步法+体能
- 周四：主动休息
- 周五：综合
- 周六：实战
- 周日：完全休息

你可以直接改 `intermediateWeeklyPlan` 数组来调整。

## 数据隐私

- 全部数据存在手机本地 SQLite (`badminton.db`)
- 录像保留在原相册位置，App 只存路径引用
- 没有任何网络请求

## License

MIT

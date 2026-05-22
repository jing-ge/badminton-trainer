# 🏸 Badminton Trainer (羽毛球私教)

![Version](https://img.shields.io/badge/version-0.48.0-blue.svg)
![React Native](https://img.shields.io/badge/React_Native-0.76-61DAFB?logo=react&logoColor=black)
![Expo](https://img.shields.io/badge/Expo-SDK_52-000020?logo=expo&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green.svg)

一个专为 **业余中级及以上球友** 打造的纯本地羽毛球私教 App。把 **沉浸式跟练计时、2.5D 鹰眼演示、随机报点、A:C 运动负荷预警** 装进口袋，地下二层球馆没信号也能用。

> 🔋 **离线优先**：训练日志、连击、收藏、计划、备份全部存本地 SQLite + AsyncStorage，0 联网、0 上传、0 账号。

---

## 📸 功能一览 (Screens & Features)

> 以下截图位于 [`docs/screenshots/`](./docs/screenshots/)。命名规范见 [`docs/screenshots/README.md`](./docs/screenshots/README.md)。

### 🏠 首页 · 私教任务卡

![home](./docs/screenshots/home.png)

- **今日训练任务卡**：source 标签（🗓 周计划 / 🎲 随机 / 🎯 自由池）+ 巨型双栏（项数 / 分钟）+ 模块行（emoji + 时长）+ 「🚀 开始今日训练」CTA。
- **连击勋章卡 (StreakBadgeCard)**：5 状态分级（A 满格金边脉动 / B 进行中 / C 接近达成 / D 回归提示 / F 还没开始），新用户首屏直接隐藏。
- **空窗期回归卡**：连续 3+ 天没练自动温柔召回，给一条恢复型推荐计划。
- **里程碑吐司**：破纪录、整数天连击会从顶部弹一次 Toast，同 session 不重复。
- **最近训练**：可点击跳详情页，第二条带「比上次 ±N 分钟」对比小字。

### 🏸 训练 Tab · 三种模式

![train-weekly](./docs/screenshots/train-weekly.png)

- **WeeklyView 周历**：按周一~周日 7 天总览，今日卡 cardAlt 高亮 + `今天 · 周X` primary 徽章 + ▶ 箭头 + 「🚀 开始练 →」CTA；休息日按工作日/周末区分文案（⏸ / 🏖）。
- **RandomView 随机**：每天从模块池里抽 K 个练，hero 卡 accent 描边 `🎲 今日随机`。
- **PoolView 自由池**：点哪个练哪个，hero 卡 warn 描边 `🎯 自由模块池`。
- **「⇄ 切换」chip**：vibrateLight + hitSlop，无误触。

### 🎬 训练执行页 · 沉浸式跟练

![run-idle](./docs/screenshots/run-idle.png)

- **idle 状态卡**：💪满血 / ⚡一般 / 🪫疲惫 三档，单击实时换算预计总耗时；状态记忆到 AsyncStorage，下次开打默认上次值。
- **2.5D 球场背景**：本地资源 `assets/images/court_bg.jpg`，避免远程拉图卡顿。
- **教练真人音 (29 条)**：macOS `say -v Tingting` 烘焙的本地 mp3——准备倒数 5/4/3/2/1、数字 0~20、5 句高频金句（"准备下一组" / "做得很好，继续保持" / "训练已暂停" 等），不再受 Android 系统 TTS 引擎质量限制。
- **运行中**：顶部 3px 全局进度条、双层倒计时（项内 / 项间）、`Next Up + 深呼吸` 5 秒过渡场景、暂停遮罩 + 「跳过此项 / 结束训练」双 CTA。
- **背景 BGM**：3 套无版权短 Loop（动感电子 / 史诗激昂 / 轻松纯音）下拉切换，挥拍木质击球音 + 步法球鞋摩擦音叠加。
- **冠军时刻结算页**：🏆 入场动画 + 实际时长 / 完成项数 / 完成率 3 列 KPI + 三档动态金句（按 conditionScale）+ 连击打卡预告 + 「再来一组」次级 CTA + 「📅 安排下一次训练 →」留存入口；带 inline note 输入框 (140 字)，点完成态把 note 直接 query 带到打卡表单。

### 📊 记录 Tab · 职业级数据

![stats-period](./docs/screenshots/stats-period.png)
![stats-history](./docs/screenshots/stats-history.png)

- **顶部时间舱 PeriodKPI**：本周 / 本月切换 + 同比箭头（▲▼）+ Reanimated 驱动的 AnimatedNumber 跳数动画（UI 线程，不堵 JS）。
- **🚦 训练负荷信号灯 (A:C Ratio)**：4 档 zone（不足 / 理想 / 偏高 / 高危） + 6px 横向信号灯条 + 游标 ▼ 指示当前位置；近 28 天 < 60 分钟或训练 < 3 天显示 `—` 不误报。
- **类别分布横条图**：近 30 天按训练分类聚合，max 归一化宽度。
- **GitHub 风格 90 天热力图**：连续打卡可视化，3 天空窗触发回归推荐。
- **历史区按月分组**：YYYY-MM 倒序 + 当年省略年份 + 顶部 5 个筛选 Pill（全部 / 训练 / 实战 / 高强度 / 有笔记）；卡片左 `MM-DD 周X` + 分类 chip + `⚔️ vs 对手` + note 截断，右侧分钟 + 5 段 dot + intensity emoji。
- **详情页 (`/log/[id]`)**：可点击进入，回顾 Section（vs 上次同类 / 本月累计 / 强度分位）+ 备注就地编辑（空 / 展示 / 编辑三态）+ 跨端二次确认删除。

### 📖 教程 Tab · 私教手册

![library](./docs/screenshots/library.png)
![tutorial-detail](./docs/screenshots/tutorial-detail.png)

- **顶部双横滑带**：⭐ 我的收藏 + ⏱ 最近浏览（每打开一次自动埋点）。
- **分类过滤**：全部 / 后场 / 前场 / 步法 / 战术 / **⭐ 收藏**；副标题动态显示 `已收藏 N`，tabular-nums 字体变体。
- **搜索框**：title + keyPoints 模糊匹配，与 category AND 叠加。
- **TutorialCard 徽章**：收藏的卡片 level 旁追加 ⭐。
- **详情页**：标题 + 数字角标（`错误 · N 条`）+ Section 顺序（错误 → 要点 → 自检）+ GripGuide 八边形握拍透视 + 鹰眼 2.5D 动态演示（`react-native-reanimated` 纯代码绘制 + 物理抛物线）+ 主 CTA「去训练 →」+ 次 CTA「去打卡 →」。

### 👤 我的 Tab · 私教档案

![me](./docs/screenshots/me.png)

- **顶部档案头**：内联编辑昵称（maxLength + trim 兜底）+ 3 选 1 级别芯片（业余 / 进阶 / 准专业）。
- **三连成就卡**：最长连击 / 累计训练时长 / 当前执行计划。
- **配置入口**：🗓 日程提醒 / 🔊 语音设置 / 💾 备份与恢复 / 🛡 数据隐私 / ℹ️ 关于本应用。

### 🔊 语音设置

![voice](./docs/screenshots/voice.png)

- 列出系统所有 zh-* voice（排除 zh-TW / zh-HK）+ 单选持久化 (`prefs.ttsVoice`) + 试听。
- 教练真人音 toggle (`prefs.useCoachAudio`)：直观对比真人音 vs 系统 TTS。
- 语速 / 音调 ± 微调（0.5 ~ 2.0，step 0.1），改动后自动试听。
- 试听文本 `"准备开始训练。五。四。三。二。一。开始"`——句号断开模拟训练真实节奏，所听即所得。

### 💾 备份与恢复

![backup](./docs/screenshots/backup.png)

- 一键打 JSON：9 个 prefs + 5 张 SQLite 表（training_logs / schedules / user_plans / tutorial_favorites / tutorial_views）。
- 分享到微信收藏 / 邮件 / 任意系统分享面板。
- 重装 / 换机时粘贴 JSON 覆盖恢复——**直接对冲 Android 换 keystore 全部清光的根本风险**。

### 🗓 日程提醒

![schedule](./docs/screenshots/schedule.png)

- 倒计时三态（今天 / 明天 / 周X），暂停时降饱和度 + 「已暂停」文案。
- 周序号以周一起头（底库保持 0=Sun 不变）。
- 快捷时间 chip + 同时段 (weekday+hour+minute) 去重拦截。
- 空态卡 3 个 preset 引导。

---

## 🛠 技术架构

| 层 | 选型 |
|----|------|
| **核心底座** | [Expo SDK 52](https://expo.dev/) + [React Native 0.76](https://reactnative.dev/)（新架构 Fabric/TurboModule） |
| **路由** | Expo Router 4（文件系统 + typedRoutes） |
| **本地存储** | `expo-sqlite` 7 张表 + `@react-native-async-storage` 偏好；Web 端无缝降级 MemoryDB |
| **动画** | `react-native-reanimated` v3 + `react-native-svg`（60fps 硬件加速） |
| **多媒体** | `expo-av` + `expo-speech` + `expo-haptics`；29 条本地烘焙教练音 mp3 |
| **沉浸式** | `expo-system-ui` + `expo-navigation-bar`（抹平 Android 全面屏底栏白边） |
| **类型** | TypeScript strict（无 `as any` / `@ts-ignore`） |
| **打包** | EAS Build cloud（preview profile，Android APK ~20MB） |

> 💡 **架构彩蛋**：项目埋下了 `react-native-fast-tflite` + `vision-camera` 的底层管道伏笔。未来解除注释即可加载 Google MoveNet 模型，开启实时摄像头 33 点骨骼追踪打分。

---

## 🚀 本地运行与构建

### 1. 准备环境
```bash
node -v   # 推荐 v18+
npm i -g expo-cli eas-cli
```

### 2. 克隆与安装
```bash
git clone https://github.com/YourUsername/badminton-trainer.git
cd badminton-trainer
npm install
```

### 3. 开发预览
```bash
npx expo start --web   # 浏览器调试核心逻辑
npx expo start         # 真机扫码（Expo Go）
```
> 注：纯 Web 模式下，物理震动与背景音频会因浏览器安全策略被自动降级或拦截。

### 4. 真机 APK 打包（推荐）
```bash
EXPO_TOKEN=xxx npx eas-cli build -p android --profile preview
```
项目已配置 `largeHeap=true` + 防 OOM 优化，preview profile 出 APK 而非 AAB，方便侧载。

---

## 🤝 参与贡献

如果你既是羽毛球重度爱好者又是开发者，欢迎 PR——更燃的短音频 Loop、新的步法训练模块、更炫的战术板动画都收。本仓库已经过 5 轮 ralph 协作迭代（产品 → 开发 → 测试），协作规则见 [`AGENTS.md`](./AGENTS.md)。

## 📄 开源协议

本项目采用 [MIT License](LICENSE) 协议进行开源。

---

## 📝 迭代日志

完整迭代日志（v0.2 → 当前）已迁移至 **[CHANGELOG.md](./CHANGELOG.md)**。

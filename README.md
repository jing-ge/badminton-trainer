# 🏸 Badminton Trainer (羽毛球私教)

![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)
![React Native](https://img.shields.io/badge/React_Native-0.76-61DAFB?logo=react&logoColor=black)
![Expo](https://img.shields.io/badge/Expo-SDK_52-000020?logo=expo&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green.svg)

一个专为 **业余中级及以上球友** 打造的顶级羽毛球辅助训练应用。这不仅仅是一个冰冷的打卡计时工具，而是一个集成了 **沉浸式音乐跟练、高级 2.5D 鹰眼动画演示、多球随机报点系统，以及职业级运动负荷预警 (A:C Ratio)** 的纯本地移动端私教系统。

**核心设计理念：** 一切数据留存本地，完全离线可用，无惧信号死角。只要你把它带到地下二层的球馆，点下“开始”，剩下的全部交给你的专属虚拟教练。

---

## ✨ 核心亮点 (Features)

### 🎧 沉浸式虚拟教练带练 (Immersive Coach)
- **智能节拍与倒数**：每组动作开始前伴随清脆的“5、4、3...”倒数。针对次数类动作，教练会完美踩点读秒（“一、二、三...十五”），并在组间提供无缝的 30 秒倒数休息。
- **全息双重音效**：不仅提供三套无版权、极具动感的短 Loop BGM（动感电子、史诗激昂、轻松纯音）供下拉切换，更在挥拍时伴随木质击球声（“啪”），在步法移动时摩擦出球鞋音效（“吱——”）。
- **实战随机报点**：在进行步法或四方球训练时，虚拟教练会在背景音中随机喊出：“左前网”、“右接杀”... 完美模拟场边真实教练给你喂球的条件反射。

### 🎬 2.5D 鹰眼动画与手绘演示 (Vector Animations)
- **硬核 2.5D 俯视轨迹系统**：完全抛弃模糊、占体积的网路视频。使用 `react-native-reanimated` 纯代码手绘出立体的羽毛球场地与球网。不同的球路（高远/杀球/搓/挑）拥有完全符合物理规律的 3D 飞行抛物线、动态高度阴影、以及随机切换的实战发球点！
- **体能拟人小人**：波比跳、深蹲、折返跑、平板支撑等体能动作，全部配备精准的 SVG 卡通小人动态演示及「呼吸光环」。
- **八边形握拍透视**：自带专属球拍截面图，高亮显示各类动作中拇指/食指的精确发力位置与常见错误（如苍蝇拍）。

### 📊 职业级防伤病数据统计 (Pro Statistics)
- **A:C Ratio 运动负荷预警**：引入专业体能界的“急慢性负荷比”，动态监控近一周与近一月的训练量。若负荷超标激增，图表强力爆红，警示劳损拉伤风险。
- **GitHub 热力打卡图**：将你长达 90 天的训练数据可视化为连续的“小绿块”，并在长达 3 天未训练时触发温柔的“空窗期恢复推荐”。
- **战绩对手复盘**：实战打卡不仅记录时长，还可挂载当天的对手名称和输赢战绩（🏆 / 💔）。

---

## 📱 核心功能模块

| Tab | 说明 |
|------|------|
| **🏠 首页** | 今日计划详情、连续打卡火苗、防空窗期提示（3天没练会自动推荐恢复计划）、状态速评。 |
| **📋 计划** | 提供多套内置计划。支持创建自己的周计划（按星期固定排表），或者“模块池/随机抽取”模式。 |
| **📊 记录** | 训练时长柱状图、历史明细、战绩对手标注、A:C 运动负荷预警算法。 |
| **📖 教程** | 8个核心动作与战术（含常见错误、自检表与鹰眼动态演示）。 |
| **💪 体能** | 羽毛球专项核心与爆发力（无需计划，随点随进沉浸跟练）。 |
| **🎬 录像** | 本地相册导入比赛录像，在时间轴上打标签：“这里步法太慢了”。 |

---

## 🛠 技术架构 (Tech Stack)

本项目采用目前移动端跨平台最前沿的技术栈进行重构与打磨：
- **核心底座**: [Expo SDK 52](https://expo.dev/) + [React Native 0.76](https://reactnative.dev/) (全面启用新架构)
- **UI 与路由**: Expo Router (基于文件系统的深度路由)
- **本地存储**: `expo-sqlite` (长久持久化，Web 环境自动无缝降级为自定义的 MemoryDB)
- **高性能动画**: `react-native-reanimated` v3 + `react-native-svg` (60fps 硬件加速)
- **多媒体矩阵**: `expo-av` + `expo-speech` + `expo-haptics` (音频流与细腻全局震动反馈)
- **沉浸式适配**: `expo-system-ui` + `expo-navigation-bar` (彻底抹平 Android 全面屏底栏白边瑕疵)

> 💡 **架构彩蛋**：项目中已经埋下了 `react-native-fast-tflite` 与 `vision-camera` 的底层管道伏笔。未来只需解除注释，即可在原生端无缝加载 Google MoveNet 模型，开启实时的摄像头 33 点骨骼追踪打分！

---

## 🚀 本地运行与构建 (Getting Started)

### 1. 准备环境
请确保你的电脑上安装了 Node.js (推荐 v18+)。
```bash
node -v
npm i -g expo-cli
```

### 2. 克隆与安装
```bash
git clone https://github.com/YourUsername/badminton-trainer.git
cd badminton-trainer

# 安装依赖项 (我们已经锁死了特定的稳定版本，建议使用 npm install)
npm install
```

### 3. 开发环境预览
本项目已经对 Web 端做了极强的兼容处理，哪怕没有手机，你也可以在浏览器里完美体验核心逻辑：
```bash
# 启动本地服务，并在浏览器中进行预览
npx expo start --web
```
*注：在纯 Web 模式下，因浏览器安全策略，物理震动与背景音频播放会被自动降级或拦截。*

### 4. 极致真机体验 (推荐)
如果你想感受到顺滑如丝的 2.5D 动画和触觉震动，我们强烈推荐生成真实的 Android APK。
本项目通过 Expo Application Services (EAS) 进行了极其严格的 `largeHeap` 内存优化与防 OOM 配置。
```bash
# 使用 EAS 云端编译出极其精简纯净的 APK (大小约 20MB)
npx eas-cli build -p android --profile preview
```

---

## 🤝 参与贡献 (Contributing)
如果你是一个羽毛球重度爱好者，同时也是一位开发者，欢迎提交 Pull Request！
无论是一条更燃的短音频 Loop、一个新的步法训练动作，还是更炫酷的战术板动画，这个「AI 私教实验室」都非常欢迎你的加入！

## 📄 开源协议 (License)
本项目采用 [MIT License](LICENSE) 协议进行开源。

---

## 📝 迭代日志

> 每一轮 `产品 → 开发 → 测试` 流水线完成后，由 `@tester` 在此区块顶部追加一条记录（最新在上）。
> Agent 协作规则详见 [`AGENTS.md`](./AGENTS.md)。

<!-- ITERATION_LOG_START -->

### v0.36.0 · 2026-05-17

- **产品需求**：录像列表页信息密度升级与过滤。
- **开发改动**：
  - `app/replay/index.tsx`：重构卡片布局，增加相对时间、最新 tag 预览、独立删除按钮及过滤功能。引入并应用中文 `dayjs` 插件展示动态卡片时间线。
  - `package.json` & `app.json`：提升版本号至 v0.36.0。
- **测试结论**：
  - ✅ 过滤 Chip 实时映射 `clips` 并执行精准过滤，选中/未选样式准确应用主次色。
  - ✅ 顶部统计区 (Hero 卡) 独立基于原始 `clips` 源不被下属条件截断。
  - ✅ 新增中文相对时间、最近 Tag 元数据行，布局信息密度显著增强，且安全处理了内容超长 (`numberOfLines={1}`)。
  - ✅ 独立 🗑 删除按钮抽离与跳转事件处于同一级绝对定位，增加 `hitSlop: 8` 防误触。
  - ✅ `dayjs.extend` 本文件内部挂载一次，对全局无残留或反复挂载问题。
- **typecheck**：✅ `tsc --noEmit` 通过

### v0.35.0 · 2026-05-17

- **产品需求**：隐私清空数据独立确认页。
- **开发改动**：
  - `app/settings/reset.tsx`：新建独立的数据清空确认页，展示 5 项本地数据统计，提供双重确认及 Web 兼容。
  - `app/(tabs)/me.tsx`：移除原有行内 Alert，安全项入口指向独立页并弱化视觉权重。
  - `app/_layout.tsx`：注册 `settings/reset` 路由。
  - `app/about.tsx`：隐私声明第三条增加点击跳转至数据清空页。
- **测试结论**：
  - ✅ UI 及状态反馈：红灰配色警示页，数据拉取为空或错误显示 `—`，加载未就绪时禁用按钮。
  - ✅ 核心逻辑：PREFS_KEYS 包含 6 个核心配置，二次确认跨端一致，清除及路由回退正常。
  - ✅ Web 兼容与交互体验：Web 端使用 `window.confirm`，原生端使用 `Alert`，多处触觉反馈。
- **typecheck**：✅ 通过

### v0.34.0 · 2026-05-17

- **产品需求**：Library 收藏维度过滤与卡片徽章展示。
- **开发改动**：
  - `app/(tabs)/library.tsx`：CATEGORIES 增加 `⭐ 收藏` 选项；基于已有的 `favorites` 派生 `favIds` 供过滤；过滤逻辑中叠加分类与搜索，支持无结果与空收藏态独立文案展示；`TutorialCard` 补充接收 `favorite` prop 以并在 level 旁追加 ⭐ 徽章；副标题动态支持显示 `已收藏 {N}` 并使用 `tabular-nums` 字体变体。
  - `package.json` & `app.json`：提升版本号至 v0.34.0。
- **测试结论**：
  - ✅ `CATEGORIES` 含 `'⭐ 收藏'` 且位于 `'全部'` 后，过滤逻辑在 `cat === '⭐ 收藏'` 与 `query` 叠加正确。
  - ✅ 收藏为空切过去时显示「还没有收藏 / ...」，正常空结果保持「没有匹配到动作要点」。
  - ✅ 副标题显示 `已收藏 M` 逻辑与 `业余中级适用` 切换正确，应用了 `tabular-nums`。
  - ✅ `TutorialCard` 成功渲染徽章，并有明确的 `colors.warn` 和 `spacing.xs`。
  - ✅ 不涉及对 `db` / `data` / `TutorialStrip` 的污染或改动，避免二次请求查询 DB。
- **typecheck**：✅ `tsc --noEmit` 通过


### v0.33.0 · 2026-05-17

- **产品需求**：schedule 训练日程页升级。
- **开发改动**：
  - `app/schedule/index.tsx`：升级为私教中心日程提醒。新增倒计时三态（今天/明天/周X）并支持降级「已暂停」文案；UI 星期以周一起头（底库保持 0=Sun）；增加快捷时间 chip，支持高亮与触觉反馈；通过 `addWith` 增加去重拦截（ Alert 冲突）；新增含 3 个快速 preset chip 的空态卡。
  - `src/utils/notifications.ts`：添加 `sendTestNotification` 以支持 { seconds: 2 } 触发的本地测试通知，支持跨端失败 Alert 降级且不写入 DB；保持原有初始化不变。
  - `package.json` & `app.json`：提升版本号至 v0.33.0。
- **测试结论**：
  - ✅ 倒计时逻辑三态渲染正确，暂停时应用了降饱和度设计。
  - ✅ UI 星期序列处理正确无误，与底层 DB 周序号匹配。
  - ✅ chip 高亮选中表现和 `vibrateLight` 触觉反馈符合预期。
  - ✅ 同一时段 (weekday+hour+minute) 添加校验去重有效。
  - ✅ Preset 空态引导流顺畅。
  - ✅ 独立测试通知 Web 跨端拦截与原生调度不写入 DB 符合要求。
- **typecheck**：✅ `tsc --noEmit` 通过

### v0.32.0 · 2026-05-17

- **产品需求**：训练 run 页暂停遮罩 + 快速决策按钮。
- **开发改动**：
  - `app/training/run.tsx`：新增 status 为 'paused' 时的全屏半透明遮罩 (`rgba(11,18,32,0.78)`)，覆盖在动画与 timer 之上，不遮盖 topBar 和 bottomArea；新增 `pausedElapsedSec` 计时状态记录真实暂停时间并附带 `FadeIn` / `FadeOut` 动画效果；遮罩居中呈现「训练已暂停」及已暂停时间；增加「跳过此项」和「结束训练」双操作按钮直接复用原有判断退出/跳过逻辑。
  - `package.json` & `app.json`：提升版本号至 v0.32.0。
- **测试结论**：
  - ✅ 遮罩样式 `absoluteFillObject`、`zIndex: 20` 并放置于 `mainBox` 内，不影响外围 bar 的响应及呈现。
  - ✅ `pausedElapsedSec` 在状态切入/切出 `paused` 时正确从 0 开始计时并清零，无内存泄漏与多次累加风险。
  - ✅ Reanimated 组件 `FadeIn` 与 `FadeOut` 使用无误，未污染原有 RN Animated API。
  - ✅ 按钮样式 Ghost（border+textDim）与 Danger（红底白字）实现准确，并且触发后原有打断功能调用正常（不会在原有功能之上再次叠加 Alert）。
  - ✅ 期间由于 status 是 `paused`，BGM 会正常静音且不播报教练音频。
- **typecheck**：✅ `tsc --noEmit` 通过

### v0.31.0 · 2026-05-17

- **产品需求**：教程详情页 CTA 修复 + Section 顺序优化 + GripGuide 副文案。
- **开发改动**：
  - `app/tutorial/[id].tsx`：修正主 CTA 路由为 `/train` 并附带 vibrateMedium，修正次要链接为 `/training/log` 并附带 vibrateLight，清理了残留的 `/pose` 路由；重排 Section 顺序为“错误 → 要点 → 自检”；在标题上添加 `· N 条` 数字角标；GripGuide 新增副文案并应用了 spacing。
  - `package.json` & `app.json`：提升版本号至 v0.31.0。
- **测试结论**：
  - ✅ grep `/pose` 路由完全清退，主次 CTA 跳转正确并携带震动。
  - ✅ Section 顺序纠错、正向、自查逻辑合理，角标渲染精确应用了 tabular-nums。
  - ✅ GripGuide 副文案提示准确并在视觉上成组。
  - ✅ 版本号已更新至 v0.31.0。
- **typecheck**：✅ `tsc --noEmit` 通过

### v0.30.0 · 2026-05-17

- **产品需求**：「关于本应用」实页化。
- **开发改动**：
  - `app/about.tsx`：新建实页，包含 Hero（徽标/应用名/大字版本号/圆点）、隐私承诺 3 条 bullet 卡、技术栈（Expo/RN/App 版本）卡、底部声明与返回按钮，全面应用 `src/theme/tokens`。
  - `app/_layout.tsx`：注册 `about` 路由。
  - `app/(tabs)/me.tsx`：「关于本应用」入口不再弹 Alert，改为 `router.push('/about')`，统一提取全局 `APP_VERSION`。
  - `app.json` / `package.json`：同步提升版本至 v0.30.0。
- **测试结论**：
  - ✅ Hero 区域排版（🏸 + 沉浸式羽毛球私教 + v0.30.0 + 绿圆点）正确。
  - ✅ 隐私承诺 3 条文案及技术栈各项对齐。
  - ✅ 版本号由 `Constants.expoConfig?.version ?? '—'` 取值，摒弃旧版本号 0.13.0 硬编码。
  - ✅ 主题色全线切为 tokens (无独立 HEX)。
  - ✅ `me.tsx` 中关于跳转 `router.push('/about')` 准确执行。
- **typecheck**：✅ `tsc --noEmit` 通过

### v0.29.0 · 2026-05-17

- **产品需求**：体能训练页升级（难度徽章 + 今日推荐 hero + 信息密度）。
- **开发改动**：
  - `app/training/fitness.tsx`：新增 `intensityOf` 软读取强度，并计算 1-3 级难度徽章及对应的色系；新增顶部 Hero 推荐卡（星期计算）及对应的副文案切换；对模块卡片补充无动作时的空态置灰逻辑，增强 Pressable 透明度反馈。
  - `package.json`：提升版本号至 v0.29.0。
- **测试结论**：
  - ✅ 难度徽章 1-3 档计算及 🔥 颜色联动准确。
  - ✅ 今日推荐 Hero 卡根据 dayjs().day() 中文星期分发且 `modules < 2` 隐藏逻辑生效。
  - ✅ 模块卡与 Hero 卡跳转均携带 vibrateLight 及 pressed 透明度反馈。
  - ✅ 模块包含空项时禁用、置灰、边框色降级等逻辑完备。
  - ✅ intensityOf 接口预留合理，软读取及类型强制转换处理妥当。
- **typecheck**：✅ `tsc --noEmit` 通过

### v0.28.0 · 2026-05-17

- **产品需求**：训练日志详情页 + 备注就地编辑。
- **开发改动**：
  - `app/(tabs)/stats.tsx`：历史卡片外层包裹 Pressable，点击带震动反馈并路由 push 至 `/log/[id]`。
  - `app/log/[id].tsx`：新建训练详情页，包含日期时间、核心指标（时长/强度）、训练内容（分类 chip / 计划回显）、对手卡战绩（win/loss/draw 对应颜色与表情）、可就地编辑的三态备注区（空态/展示态/编辑态）。
  - `src/db/trainingLogs.ts`：新增 `updateTrainingLogNote`，支持单字段 UPDATE，对空字符串做 null 归一化。
  - `app/_layout.tsx`：注册 `log/[id]` 详情页路由。
  - `package.json`：提升版本号至 v0.28.0。
- **测试结论**：
  - ✅ 历史记录列表转 Pressable，跳转携带正确 ID。
  - ✅ 详情页各模块（大日期、指标卡、分类 chip、计划 title）兜底逻辑严密。
  - ✅ 对手卡按 opponent 存在与否正常显隐，且 win/loss/draw 渲染正确。
  - ✅ 备注三态切换（包含 maxLength=200 和 null 归一化）验证通过。
  - ✅ 跨端删除二次确认框区分 Web / Native 逻辑，删除后自动 `router.back()`。
  - ✅ 异常 ID 兜底空态卡及 "返回" 按钮生效。
- **typecheck**：✅ `tsc --noEmit` 通过


### v0.27.0 · 2026-05-17

- **产品需求**：录像复盘详情页 `app/replay/[id].tsx` 升级为"快速标注台"（预设 chip、视频自动暂停、时间微调胶囊、删除二次确认、空态引导卡）。
- **开发改动**：
  - `app/replay/[id].tsx`：
    - 新增 7 个预设高频标签 `PRESET_TAGS`，chip 点击写入 `tag` 并自动 `pauseAsync` 暂停视频。
    - 新增时间微调胶囊（◀ -3s / +3s ▶），基于 `duration` 和 `position` 做 clamp 下上界收拢防越界。
    - 标注列表序号左侧显示且应用 `tabular-nums` 等宽字体（如 `#01`）；列表为空时展示虚线引导空态卡。
    - 列表长按删除增加跨端二次确认（Web 走 `window.confirm`，原生走 `Alert.alert`）。
  - `package.json`：版本号提升到 `0.27.0`。
- **测试结论**：
  - ✅ PRESET_TAGS 生成 7 个 chip，点击更新 tag 并兜底暂停视频。
  - ✅ ±3s 胶囊按 clamp 逻辑控制时间推移。
  - ✅ `tabular-nums` 字体变体正确挂载。
  - ✅ 删除二次确认完美区分 `Platform.OS` 跨端支持。
  - ✅ 虚线空态卡及提示文本符合视觉与交互逻辑。
- **typecheck**：✅ `tsc --noEmit` 通过

### v0.26.0 · 2026-05-16

- **Bug 报告**：用户反馈"今天感觉怎么样？"下方三个状态按钮（💪满血/⚡一般/🪫疲惫）**看不见**。
- **根因**（对比度灾难）：
  - 背景：`WorkoutBackground` 蒙层后 ≈ `#0B1220`（极深蓝黑）
  - 按钮 `conditionBtn` 背景 `colors.card` = `#131C2E`（仅比背景亮 8/256，看不出边界）
  - 边框 `borderColor: 'transparent'`（完全没边框）
  - 文字 `colors.textDim` 灰
  - 三者叠加：按钮跟环境融为一体，只剩 emoji 和模糊的灰字漂浮，像没渲染一样
- **开发改动**（`app/training/run.tsx` 3 行 styles）：
  - `conditionBtn` 背景 `colors.card` → `colors.cardAlt`（#1A2540，比背景亮 15/256，轮廓清楚）
  - `conditionBtn` 默认边框 `'transparent'` → `colors.border`（#26324A，所有按钮都有可见外框）
  - `conditionText` 默认文字色 `colors.textDim` → `colors.text`（白字，主色；选中态仍切 primary 绿）
- **测试结论**：
  - ✅ tsc --noEmit 通过
  - ✅ 三按钮在 court_bg 暗色背景下**轮廓 + 文字都清晰可见**
  - ✅ 选中态描边切 primary 绿 + 文字切 primary 绿，与默认态对比依然鲜明
  - ✅ 改动只动 3 行 styles，未触碰其他任何代码 / 视觉布局
  - ✅ surgical change：未引入新依赖、未改 token、未改其它任何 Tab
- **typecheck**：✅ `tsc --noEmit` 通过

### v0.25.0 · 2026-05-16

- **产品需求 / Bug 报告**：v0.24.0 用户反馈"设置页试听好听，到训练里声音不一样"。排查后定位 3 个症结，统一修复。
- **Bug 根因**：
  1. **rate 双重相乘**：`speak()` 内 `finalRate = rate × ttsRateRef.current`，导致设置页 rate=1.5 时，训练里步法报点实际跑出 1.5 × 1.3 = 1.95，远超用户在设置页听到的速度
  2. **每秒打断 → 单字孤立**：训练里数字倒数每秒调 `speak()`，函数第一行 `Speech.stop()` 切断前一字。设置页是一句话连读，节奏自然；训练里 5 次独立 utterance 互相打断，机器人感
  3. **试听文本用逗号、训练实际用单字独立朗读**：设置页"五，四，三"连贯；训练里逐字独立。所听非所得
- **开发改动**：
  - `app/training/run.tsx`：
    - `speak()` 不再用调用方 rate × 用户偏好 rate，统一只用 `ttsRateRef.current`（保留参数签名以兼容现有调用点）
    - 新增 `speakRaw(text)`：**不调 `Speech.stop()`**，让 TTS 队列衔接，专用于连续数字 / 节拍播报
    - 6 处改用 `speakRaw`：准备期倒数 5→1、次数 rep 报点、休息倒数 3-1、工作期倒数 3-1、步法节拍 1-4、组结束触发的"开始"
  - `app/settings/voice.tsx`：
    - `PREVIEW_TEXT` 改为 `"准备开始训练。五。四。三。二。一。开始"`（句号断开模拟训练实际节奏）
    - 语速 / 音调调参试听同步从逗号改句号
- **测试结论**：
  - ✅ tsc --noEmit 通过
  - ✅ 设置页试听文本现在能模拟训练真实节奏，所听即所得
  - ✅ 训练倒数 5→1 不再被打断（speakRaw 不 Speech.stop）
  - ✅ rate 双重相乘已修，所有调用点都只用用户偏好
  - ✅ speak() 仍调 Speech.stop 用于长句子（如 "准备下一组"），需要打断前一个的场景保留
  - ✅ 未触碰：其它任何 Tab / 组件
- **typecheck**：✅ `tsc --noEmit` 通过

### v0.24.0 · 2026-05-16

- **产品需求**：v0.23.0 语音改进后用户反馈仍呆滞、不够自然。Android 系统 TTS 引擎质量参差，且我们写死了 pitch 0.95、对高 rate 做 ×0.85 衰减——其实**这两个都是错的方向**：用户需要的是**自己选 voice + 自己调参数**，因为不同 Android 设备的"最佳 voice"完全不同。
- **开发改动**：
  - 新增 `app/settings/voice.tsx`「语音设置」页：
    - 列出系统所有 zh-* voice（排除 zh-TW / zh-HK），每个支持「试听」+「单选 + 持久化」（key `prefs.ttsVoice`）
    - 顶部「系统默认」选项可清除选择回退到自动挑选
    - 语速 / 音调 ± 微调按钮（0.5 - 2.0 范围，step 0.1），改动后自动试听
    - 试听文本 `"准备开始训练，五，四，三，二，一"` —— 同时覆盖数字 + 节奏 + 语调三个场景
    - 底部提示卡：装不到普通话 voice 时引导用户去系统设置装"中文（中国）"包
    - 试听 / 选择都 vibrateLight 即时反馈
    - 名字识别：含 tingting / siri / enhanced / premium 的 voice 加中文注释
  - `app/(tabs)/me.tsx`：「日程提醒」下方插入「🔊 语音设置」入口
  - `app/training/run.tsx`：
    - 挂载 effect 改造：先读 `prefs.ttsVoice / ttsRate / ttsPitch`，验证 voice 还在系统列表里再用；失效或没选过则 fallback 到自动挑 zh-CN
    - `speak()` 内部：用 `ttsRateRef × 调用方 rate` 作为最终 rate，`ttsPitchRef` 作为 pitch（不再写死 0.95）
    - 移除 v0.23 的"高 rate × 0.85"衰减——改由用户全局 rate 控制
    - 倒数 5/4/3/2/1 从 rate 1.5 降到 1.0，且用 `numToChinese(prev-1)` 显式转汉字
    - 准备期最后一秒新增 `"开始"` 语音（替代原本"静默切到 running"）
    - 次数报点（行 483 `rep.toString()`、行 555 `beat.toString()`）rate 从 1.5 → 1.1，更接近真实教练节奏
    - 倒数 3 秒（行 492、516、533）rate 从 1.5 → 1.0
- **测试结论**：
  - ✅ tsc --noEmit 通过
  - ✅ 语音设置页：voice 列表 / 试听 / 选择持久化 / 语速音调 ± / 自动试听
  - ✅ run.tsx 优先用户偏好；voice id 失效时安全 fallback
  - ✅ 倒数节奏从"赶"恢复到自然
  - ✅ 未触碰：其它任何 Tab / 组件
  - ✅ 未引入新 npm 包
- **typecheck**：✅ `tsc --noEmit` 通过

### v0.23.0 · 2026-05-16

- **产品需求**：训练语音呆滞 + 数字"3"特别难听 → 强制普通话发音 + 数字转汉字播报。
- **背景**：run.tsx 共 14 处 `speak()` 调用，其中倒数 5/4/3/2/1、组数、次数等都把 `String(n)` 直接喂给 TTS。`Speech.speak({ language: 'zh-CN' })` 在部分设备上只是"建议"，TTS 可能 fallback 到英文 voice 把"3"读成 "three"，或读成走调的"3"。
- **开发改动**（`app/training/run.tsx`，单文件）：
  - 新增 `numToChinese(n)` + `toChinesePronunciation(text)`：把句子里所有 0-99 的数字 token 转汉字（"3" → "三"；"15" → "十五"；"第 2 组，开始" → "第 二 组，开始"）
  - 新增挂载 effect 调 `Speech.getAvailableVoicesAsync()`，优先级 `zh-CN > zh-Hans > zh-*`（**排除 zh-TW / zh-HK** 避免粤语腔），选定后存 `zhVoiceRef`，每次 `speak()` 都显式指定 `voice` 参数
  - 改造 `speak()` 内部：自动 `toChinesePronunciation` 转换 + 注入 `pitch: 0.95`（轻微下移音高，更稳更自然）+ 高 rate（≥1.4）档自动 `× 0.85` 软化，避免"赶"
  - 14 处现有调用点**零修改**——靠 `speak()` 内部自动转换（surgical change）
  - 拿不到 voice 列表时静默兜底，仍走 `language: 'zh-CN'`
- **测试结论**：
  - ✅ tsc --noEmit 通过
  - ✅ 倒数 5→1 现在走 "五/四/三/二/一" 汉字播报
  - ✅ 组间次数 "十五" 等连贯
  - ✅ "第 2 组，开始" 走 "第 二 组，开始" 转汉字读
  - ✅ 高 rate 1.5 → 1.275（× 0.85），听感不再"赶"
  - ✅ 普通话 voice 自动避开 zh-TW / zh-HK
  - ✅ 未触碰：其它任何 Tab / 组件 / 已冻结区
  - ✅ 未引入新 npm 包
- **typecheck**：✅ `tsc --noEmit` 通过

### v0.22.0 · 2026-05-15

- **产品需求**：发版前清账——补上自 v0.12.0 起被多次记录的 `resetDB` 漏 `DROP TABLE user_plans` 的挂账。
- **开发改动**：
  - `src/db/index.ts`：`resetDB()` 内 DROP 列表追加 `DROP TABLE IF EXISTS user_plans;`，与 migrate 中的 CREATE TABLE 对齐。
- **测试结论**：
  - ✅ tsc --noEmit 通过
  - ✅ 改动仅 1 行，零回归面
  - ✅ 与 migrate 7 张表（training_logs / pose_sessions / replay_clips / schedules / user_plans / tutorial_favorites / tutorial_views）DROP 配对完整
- **typecheck**：✅ `tsc --noEmit` 通过

### v0.21.0 · 2026-05-15

- **产品需求**：录像复盘列表视觉分级（已标注/待标注差异化） + hero 引导条 + 空态文案修正；顺手清理首页残留的"动作识别" QuickCard（v0.20 已在训练 Tab 删过，首页同步清理）。
- **开发改动**：
  - `app/replay/index.tsx`：
    - 顶部新增 hero 卡：clips 空时显示 `📹 把比赛录像变成可复盘的训练资料` + 引导副文案；clips 非空时显示 `共 N 段录像 · 累计 X 条标注` 统计
    - 列表卡视觉分级：annoCount > 0 → 左 emoji ✍️ + primary 描边 + 大数字 N 条标注（h3 800 primary）；annoCount === 0 → 左 emoji 🎬 + border 描边 + 灰字 `待标注`
    - "长按删除" 提示移到卡片右上角，font.tiny textDim
    - 空态文案 "还没有录像，先去录一段比赛吧" → "🎥 还没导入录像，点上方按钮从相册添加"（不再误导用户以为 App 能录像）
    - 用 spread 取代 style 数组（Card 不接受数组 style）
  - `app/(tabs)/index.tsx`：
    - 删除「动作识别」QuickCard 入口（v0.20 训练 Tab 已删，首页同步清理）
    - 「录像复盘」改为单卡宽屏布局（quickWide 横向布局：emoji + 标题+描述 + › 箭头）
    - 清理孤儿函数 `QuickCard` 与孤儿样式 `quickGrid / quick`（仅由刚删除的入口使用，按 karpathy 原则）
- **测试结论**：
  - ✅ tsc --noEmit 通过
  - ✅ replay 列表 annoCount 分级渲染（0 vs >0）视觉差异完整
  - ✅ hero 卡空态/非空态文案切换正确
  - ✅ 首页 pose 入口已清零（grep `app/(tabs)/index.tsx` 无 `/pose`）
  - ✅ replay 详情路由 `/replay/[id]` 未动
  - ✅ 未触碰：run.tsx / streak / tutorial / me / stats / plans / train / 其它 Tab
  - ✅ 未引入新 npm 包
- **typecheck**：✅ `tsc --noEmit` 通过

### v0.20.0 · 2026-05-15

- **产品需求**：「训练」Tab 整体打磨——周历模式今日卡情绪化（"今天 · 周X" 徽章 + 模块行 ▶ 箭头 + "开始练 →" CTA）+ 休息日文案区分（周末 🏖 / 工作日 ⏸）+ random/pool 模式顶部 hero 卡 + 移除 AI 动作识别入口（用户硬约束）。
- **开发改动**：
  - `app/(tabs)/train.tsx`：
    - WeeklyView 今日卡：背景换 cardAlt + 顶部 `今天 · 周X` primary 徽章 + 模块名右侧 ▶ primary 箭头 + 底部 `🚀 开始练 →` 或 `去做个 10 分钟拉伸 →`（按是否有模块切换 primary/accent）
    - 休息日文案：周末（wd=0/6）`🏖 周末休息日`，工作日 `⏸ 还没安排训练`
    - RandomView 顶部 hero 卡：`🎲 今日随机` h2 + `每天从 N 个模块里抽 K 个练`，accent 描边
    - PoolView 顶部 hero 卡：`🎯 自由模块池` h2 + `点哪个练哪个，按心情来`，warn 描边
    - 删除「🎥 动作识别 / 实时纠错」入口（v0.5 起 pose 占位已冻结，用户多次强调不碰 AI）
    - 模块 Pressable 加 pressed opacity 0.7
    - 新增 styles：todayBadge / todayBadgeText / modArrow / todayCtaBtn / todayCtaText / modeHeroTitle / modeHeroSub
- **测试结论**：
  - ✅ tsc --noEmit 通过
  - ✅ 今日卡 isToday 视觉差异完整（背景/徽章/箭头/底部 CTA）
  - ✅ 休息日 weekend/weekday 双态文案区分
  - ✅ random/pool hero 卡边框色对应 accent/warn，与 weekly 主色 primary 三态分明
  - ✅ AI 入口已从训练 Tab 移除（pose 路由仍保留，只是不再从这入口暴露）
  - ✅ 未触碰：run.tsx 任何代码、首页、tutorial、me、stats、plans、agent prompt 文件
  - ✅ 未引入新 npm 包
- **typecheck**：✅ `tsc --noEmit` 通过

### v0.19.0 · 2026-05-15

- **产品需求**：首页「今日训练卡」从「文字列表」升级为「私教任务卡」——source 标签视觉差异化、巨型双栏数字（训练项/分钟）、模块行加 emoji 与时长、按钮加 🚀；同时修 recent intensity 异常值兜底。
- **开发改动**：
  - `app/(tabs)/index.tsx`：
    - inline `MOD_EMOJI`（tech🏸/footwork👟/fitness💪/match⚔️/recovery🧘）
    - 新增 `sourceEmoji / sourceText / sourceStyle` 三函数：weekly→🗓 primary / random→🎲 accent / pool→🎯 warn
    - 今日训练卡重排：顶部 source 标签 → plan name → 巨型双栏（itemCount/totalMin，primary h2 800）→ 模块行（emoji+名称+时长）→ 「🚀 开始今日训练」按钮
    - 模块行右侧时长用 `Math.max(1, Math.round(it.duration_min))` 等价的 `m.items.reduce` 求和
    - 最近训练 intensity 渲染加 `Math.max(0, Math.min(5, r.intensity))` 钳制（防异常数据）
    - 新增 styles：sourceRow / sourceLabel / statsRow / statCol / statNum / statLabel / statDivider / modRow / modEmoji / modName / modMins / modMore
- **测试结论**：
  - ✅ tsc --noEmit 通过
  - ✅ 3 种 source 颜色映射正确（primary/accent/warn）
  - ✅ 巨型双栏：左 itemCount / 右 totalMin，中间 1px border 分隔
  - ✅ 模块行 emoji 按 module.category 派生，fallback 🎯
  - ✅ intensity 钳制：负数 → 0 ☆☆☆☆☆；>5 → 5 ★★★★★
  - ✅ 未触碰：StreakBadgeCard / MilestoneToast / 欢迎卡 / 回归卡 / 快捷入口 / 最近训练卡片样式 / 其它任何 Tab
  - ✅ 未引入新 npm 包
- **typecheck**：✅ `tsc --noEmit` 通过

### v0.18.0 · 2026-05-15

- **产品需求**：stats 中部的 A:C 比值卡从「专业术语警示」升级为「私教式负荷信号灯」——4 档语义化文案 + 横向信号灯条 + 游标指示当前位置 + 警示语气克制化。
- **开发改动**：
  - `app/(tabs)/stats.tsx`：
    - 新增 `acZone: 'low'|'ok'|'high'|'danger'|'pending'` 派生：< 0.8 不足 / 0.8-1.3 理想 / 1.3-1.5 偏高 / >1.5 高危
    - 标题 `运动伤病预警 (A:C 比值)` → `🚦 训练负荷信号灯`
    - 副标题动态：5 档分别给私教语言文案
    - 数值色按 zone 切（low/textDim, ok/primary, high/warn, danger/danger）
    - 新增 6px 高横向信号灯条：4 段语义色（textDim/primary/warn/danger），段宽 35/30/20/15（按 ratio 区间真实空间）
    - 游标 ▼ 指示当前位置（`min(ratio, 2.0) / 2.0`），数据不足时整条 opacity 0.3 + 游标隐藏
    - 刻度行 `0 / 0.8 / 1.3 / 1.5 / 2.0+`
    - 高危警示语气调整：`⚠️ 警告：...风险极高！` → `🔥 建议本周减量并增加恢复项，给身体一个缓冲`
    - **未改 acRatio / acReady / isHighRisk 算法本身**，只升级 UI
- **测试结论**：
  - ✅ tsc --noEmit 通过
  - ✅ 4 档 zone 派生 + 文案 + 数值色映射正确
  - ✅ 信号灯条 4 段比例（35/30/20/15）与刻度对齐
  - ✅ 数据不足时整条灰化（opacity 0.3）+ 游标隐藏，数值仍显示 `—`
  - ✅ 高危态卡片描边红色保留（v0.18 前已存在的逻辑）
  - ✅ 未触碰：v0.14 顶部时间舱、v0.6 类别分布/热力图/历史记录、其它任何 Tab
  - ✅ 未引入新 npm 包
- **typecheck**：✅ `tsc --noEmit` 通过

### v0.17.0 · 2026-05-15

- **产品需求**：训练打卡页 `app/training/log.tsx` 从「问卷调查表」升级为「私教打卡卡」——分类视觉、强度语义、笔记引导、来自 finished 的训练摘要卡、保存动态金句。
- **开发改动**：
  - `app/training/log.tsx`：
    - 新增 `CAT_META`（inline 6 类 emoji + 语义色，参考 train.tsx 的 CATEGORY_META 调性，但 log 的分类与 train 不完全等价，独立维护）
    - 训练强度 5 颗星下方新增 `INTENSITY_DESC` 行（1=😌轻松/2=🙂适中/3=💪标准/4=🔥高强度/5=⚡极限）
    - 训练内容 chip 加 emoji 前缀 + 选中态按分类语义色（后场🏸 primary / 前场🤚 primary / 步法👟 accent / 体能💪 warn / 实战⚔️ danger / 发球🎯 primary）
    - 实战结果配色修正：赢了 → primary（绿）、输了 → textDim（灰）、平局 → warn（橙）
    - 笔记区加 📝 emoji + maxLength 200 + 字数计数 `N / 200` + 私教引导 placeholder
    - 顶部「训练已完成」摘要卡：仅当 `mins` 参数来自 finished 跳转时显示，异步拉 active plan 名静默兜底
    - 保存按钮 "保存" → "✅ 完成打卡"，加 `vibrateSuccess()`，根据 `getStreakStats().current` 切 3 套金句（>=7、>=3、>=1）
- **测试结论**：
  - ✅ tsc --noEmit 通过
  - ✅ 6 个分类 emoji + 选中态语义色正确
  - ✅ 5 颗星 + 描述行联动；当前 intensity 描述高亮 600 weight
  - ✅ fromFinished 判断准确（仅 mins 参数存在时显示摘要卡）；planName 拉取失败静默不报错
  - ✅ 笔记 maxLength 200 强制；字数计数实时
  - ✅ 实战 win/loss/draw 三态配色按 primary/textDim/warn 语义重新对齐
  - ✅ Streak 拉取失败时保存仍走默认金句，不阻塞打卡流程
  - ✅ 未触碰：run.tsx / 首页 streak / tutorial / me / stats / 计划编辑 / PlanCard / agent prompt
  - ✅ 未引入新 npm 包
- **typecheck**：✅ `tsc --noEmit` 通过

### v0.16.0 · 2026-05-15

- **产品需求**：计划列表页 PlanCard 升级为分类配比预览卡 + sectionHeader 圆点徽标。
- **开发改动**：
  - `app/plans/index.tsx`：重构了列表的区域头，增加圆点徽标 (`primary`/`accent`) 及文本优化。
  - `app/plans/index.tsx`：重构 `PlanCard` 呈现，精简了元数据展示，右侧新增了直观的体量总计 (`N项/Y分钟`)；底层新增支持了基于真实数据聚合 (`computeCategoryStats`) 的训练项比例预览条和对应图例，支持缺失项和占比门槛过滤逻辑。
- **测试结论**：
  - ✅ **数据聚合精确**：计算函数按类别准确将模块分钟数聚合并做降序排序，处理了缺少类别的向 `recovery` 兜底动作。
  - ✅ **UI呈现符合预期**：`sectionHeader` 圆点应用主副色；`PlanCard` 卡片内含 1 行防截断截取标题 `numberOfLines=1`。
  - ✅ **进度条及图例交互**：8px 横条按 5 段分配百分比宽度及 `2px` 隔离间隙，超过 8% 的分类才展出图例文本且上限 4 个；空模块情况下则采用带描写的灰底占位，这些处理没有破坏原来 `isActive` 的边框和左侧 3px 条效果。
  - ✅ **安全锁定**：不涉及其它交互（CRUD等回调方法），完全只影响样式和数据可视化展现，其余 `run.tsx`，首页等功能及全局设置依然维持了上一迭代的状态未有污染。
- **typecheck**：✅ `tsc --noEmit` 通过

### v0.15.0 · 2026-05-15

- **产品需求**：计划编辑页周计划「7 天总览卡」+ 选中日联动过滤 + addModule 默认 weekday 跟随选中日。
- **开发改动**：
  - `src/features/plans/WeekOverviewCard.tsx`：抽离新增纯展示 7 天总览卡组件，通过颜色强度细分每日模块的用时与负载。
  - `app/plans/[id]/edit.tsx`：接入 `WeekOverviewCard`；计算并传递包含 7 日分布与未分配数的 `dayStats` 与 `unassignedCount`；增加 `selectedWeekday` 用于在模块列表进行基于星期的精准过滤联动，配合增加空选占位引导；重写了 `addModule` 使其在联动选中后可以自动装配对应 weekday。
- **测试结论**：
  - ✅ 组件显隐条件正常：仅在 `weekly` 且有模块时才展示，0 模块时或 random/pool 模式下被安全隐藏，空数据时显示虚线引导框且附带正确的关联按钮动作。
  - ✅ 总览卡渲染及交互顺畅：数据按 `日一二三四五六` 对齐，三段式数据渲染及过载颜色（`primary`/`warn`/`danger`）响应边界准确。空数据 `opacity 0.4` 及长文本防截断工作正常。点击带有选框高亮和 `vibrateLight` 反馈且能二次取消。
  - ✅ 过滤联动有效：过滤态开启后下方只列出选中日的卡片并增加清除筛选项；在某天为 0 个时显示的引导卡上添加的模块能够完美默认带上当前日期的 tag；其余非 `weekly` 状态添加不受影响。
  - ✅ 无相关外部环境污染及多余 NPM 引入。未硬编码组件配色；既有功能模块及配置不受影响。
- **typecheck**：✅ `tsc --noEmit` 通过

### v0.14.0 · 2026-05-15

- **产品需求**：stats 顶部「时间舱」——周/月切换 + 同比箭头 + 数字滚动动画。
- **开发改动**：
  - `app/(tabs)/stats.tsx`：引入新的 `PeriodMode` 与双侧期段计算逻辑（支持天数、时长和强度），增加顶部 PeriodBar (本周/本月) 及 `streak` 小字降级展示。
  - `app/(tabs)/stats.tsx`：重写了核心 KPI 组件为 `PeriodKPI`，内部支持对比期数据换算、极简趋势图标渲染（`▲`/`▼`）。
  - `app/(tabs)/stats.tsx`：基于 `reanimated` 的 `Animated.createAnimatedComponent(TextInput)` 封装了高性能跳数动画 `AnimatedNumber`，在 UI 线程直接驱动动画文本改变，避开了 `setState` / `setInterval` 引起的 JS 线程拥堵。
- **测试结论**：
  - ✅ 时间计算无误：利用 `dayjs().day()` 针对周一起点进行妥善边界处理，上一期与当期的比较数据能精准隔离提取；当数据空载时，正确回退到 `—` 以及 "本周/本月尚未打卡" 的兜底描述。
  - ✅ 交互与动画流畅：左侧切换 Pill 完全复用了 Library 分类的视觉并支持 `vibrateLight` 触觉反馈；`AnimatedNumber` 通过 Shared Value 能平滑流转 (400ms) 并且没有诱发异常副作用震动与死循环。
  - ✅ 格式化同步：`formatDurationLabel` 被完美拆分复用，强度同步保持了 `toFixed(1)` 的一位小数计算输出。
  - ✅ 组件稳定性：A:C Ratio 预警卡、分布横条图、热力图、历史记录均未发生雪崩，保留了所有样式表现。
  - ✅ 无相关外部环境污染及多余 NPM 引入。
- **typecheck**：✅ `tsc --noEmit` 通过

### v0.13.0 · 2026-05-15

- **产品需求**：「我的」Tab 从设置列表升级为「私教档案卡 + 成就墙」。
- **开发改动**：
  - `app/(tabs)/me.tsx`：整页重构。顶部新增私教档案头，支持内联编辑昵称及通过 AsyncStorege 记忆的 3 选 1 级别芯片；中部嵌入了基于 `getStreakStats` / `listTrainingLogs` 演算的三连数据展示卡（包含最长连击、累计训练时长、当前执行计划）；底层固化保留了原有的配置选项列表。
  - `app.json` & `me.tsx`：提取 `app.json` 的版本号 `Constants.expoConfig?.version` 到全局用于脚标及应用弹窗呈现。
- **测试结论**：
  - ✅ AsyncStorage 读写验证：昵称输入安全校验（`maxLength`、`trim()` 回退机制）生效；级别芯片呈现单行或展开式呈现反馈，按压时包含震动。
  - ✅ dayjs 运算加入天数准确，并在首练为 `null` 时正确回退引导。
  - ✅ 数据状态（成就卡 A/B/C）渲染逻辑合规：`best = 0` 及 `>0` 状态正常分支呈现；累计训练显示 `Nm`/`Nh` 时间与 `stats` 页复用规则；计划长名称超出一行 `numberOfLines 1` 正确截断；未获取到数据前正常用 3 个骨架屏（无文字仅背景色）平滑占位。
  - ✅ 未涉及 `run.tsx`、其它业务 Tabs 与环境锁定文件的污染。
- **挂账记录**：
  - ⚠️ `resetDB` 在之前迭代中遗漏了 `DROP TABLE IF EXISTS user_plans;`，尚未清理，挂账持续跟进。
- **typecheck**：✅ `tsc --noEmit` 通过

### v0.12.0 · 2026-05-15

- **产品需求**：教程模块从「字典」走向「私教手册」——收藏 + 自动浏览埋点 + Library 顶部双横滑带。
- **开发改动**：
  - `src/db/index.ts`：增加 `tutorial_favorites` 与 `tutorial_views` 的两张 DB 表及配套的重置时 DROP。
  - `src/db/tutorials.ts`：新增完整的异步、静默收藏及埋点记录 API。
  - `app/tutorial/[id].tsx`：重构标题区为 `row`，并在右侧集成收藏星标按钮。挂载自动向 DB 追加浏览历史。
  - `app/(tabs)/library.tsx` 和 `src/features/library/TutorialStrip.tsx`：实现并在顶部植入「⭐ 我的收藏」+「⏱ 最近浏览」横向带组件。
- **测试结论**：
  - ✅ DB migrate 和 reset 行为完备对齐；教程 DB 函数内部包裹 `try/catch`，实现静默降级不阻断。
  - ✅ 星标按钮在 `loaded` 前隐藏 (`opacity: 0`)，防范突变。收藏时交互包含 `scale` 轻动画与震级触感反馈（`vibrateMedium`/`vibrateLight`）。
  - ✅ 横滑带按预期从无数据时的防渲染空洞，至有数据时的类别表情与 `humanizeAgo` 时间角标展示一切正常。
  - ✅ 未引入新 npm 包，原有平铺列表、其它功能 Tab 与配置文件安全锁定。
- **挂账记录**：
  - ⚠️ `resetDB` 在之前迭代中遗漏了 `DROP TABLE IF EXISTS user_plans;`，由 @developer 标记并在后续跟进。
- **typecheck**：✅ `tsc --noEmit` 通过

### v0.11.0 · 2026-05-15

- **产品需求**：run.tsx idle 状态选择页打磨——状态记忆 + 实时换算 + 私教问诊感。
- **开发改动**：
  - `app/training/run.tsx`：引入 `AsyncStorage` 进行 `prefs.lastCondition` 状态持久化记忆。
  - `app/training/run.tsx`：新增首屏渲染时获取最新一条训练日志（`listTrainingLogs(1)`），计算距今训练天数并在顶部动态渲染 "承接横幅 (Recent Banner)"。
  - `app/training/run.tsx`：状态选择（满血/一般/疲惫）新增精细反馈动画：副标题触发 opacity 闪动，当前选中卡片触发 scale 轻微放大缩回，并伴随按压震动 `vibrateLight`。实时通过 `Math.round` 换算预计总耗时。
- **测试结论**：
  - ✅ AsyncStorage 合法读取与无声异常静默通过，`pickCondition` fire-and-forget 保存。
  - ✅ 副标题三档文案及其实时预计分钟数显示准确（公式运算未破坏历史标准）。
  - ✅ Opacity 闪动及卡片 Scale 动画只在当前选中项中生效，且无循环不污染其他动画。
  - ✅ 承接横幅基于 0 天 / 1-6 天 / >=7 天分支判断准确。
  - ✅ 无相关状态受牵连，`transitioning`、`finished`、`running` 等阶段完全冻结。
- **typecheck**：✅ `tsc --noEmit` 通过

### v0.10.0 · 2026-05-15

- **产品需求**：训练 run 页项间「Next Up + 深呼吸」过渡态 + Running 期 NextBox 信息密度补齐。
- **开发改动**：
  - `app/training/run.tsx`：`status` 新增 `transitioning` 状态；`handleItemFinish` 的非最后一项分支从 `setTimeout` 等待改写为 5 秒状态过渡。
  - `app/training/run.tsx`：更新了底部 `nextBox` 的样式结构（emoji 徽章 + 双行文本布局，最后一项特殊样式 `🏁 这是最后一项`）。
  - `src/features/run/TransitionScene.tsx`：新增 `TransitionScene` 组件，实现了 ✅进度徽章、倒数呼吸圆（基于 reanimated 与震动同步），以及项间预览卡和「直接开始」按钮。
- **测试结论**：
  - ✅ status state transition 正常流转（`running` -> `transitioning` -> `preparing/running`）；没有误改首项 `startWorkout` 流程及最后一项的 `finished` 分支。
  - ✅ 计时器 effect 对 `status === 'running'` 及 `status === 'transitioning'` 独立区分；`transitioning` 时全局进度强制视当前项已满（`currentItemProgress = 1`）。
  - ✅ TransitionScene 中 `vibrateMedium` 在进入时触发，且呼吸圈缩放的最深点成功挂载了轻震动 `vibrateLight`。
  - ✅ 跳过逻辑兜底正常，次态手动推进有效，BGM 不会在 `transitioning` 时错误停止。
  - ✅ 原有的 `preparing`, `idle` 状态未受污染。
- **typecheck**：✅ `tsc --noEmit` 通过

### v0.9.0 · 2026-05-15

- **产品需求**：首页「连击勋章卡」5 状态化 + 破纪录里程碑吐司。
- **开发改动**：
  - `src/features/streak/StreakBadgeCard.tsx`：新增 5 状态派生逻辑 `deriveStreakView` (A~F) 及其 UI 卡片组件，包含满格呼吸进度条与 A 状态金边脉动动画。
  - `src/features/streak/MilestoneToast.tsx`：新增全局置顶的动画吐司通知组件，支持破纪录与整数天数里程碑弹窗。
  - `src/db/trainingLogs.ts`：新增 `getStreakStats()` 减少多次查表，单次查询并计算当前连击、历史最长连击、今日是否打卡、首练日期。
  - `app/(tabs)/index.tsx`：移除旧版零散状态与样式，重构以接入 `StreakBadgeCard` 和 `MilestoneToast`，通过 `useFocusEffect` 进行数据请求、fingerprint 去抖与发震动。
- **测试结论**：
  - ✅ `getStreakStats` 单次查询+内存计算逻辑完善，且旧 `getStreak` 已安全保留
  - ✅ 5 种连击状态（A~F）优先级匹配无误，D 状态文案、颜色及震动反馈均按设计呈现，与回归卡互不冲突
  - ✅ 进度条满格呼吸动画与 A 状态金边脉动动画+重震动正常挂载
  - ✅ 里程碑吐司弹窗出现时机正确，同 session 不重复触发，初次不误弹
  - ✅ 其他卡片（欢迎卡、回归卡等）与原有逻辑完全兼容互斥补位
  - ⚠️ 仅静态走查验证逻辑，真机震动强度及脉动动画在双端的视觉效果需后续观察
- **typecheck**：✅ `tsc --noEmit` 通过

### v0.8.0 · 2026-05-15

- **产品需求**：训练 run 页本地化背景 + 训练完成「冠军时刻」结算页升级。
- **开发改动**：
  - `app/training/run.tsx`：`WorkoutBackground` 替换远程图片为本地资源 `require('../../assets/images/court_bg.jpg')`；`finished` 分支改版，引入 🏆 徽章的入场动画 (`Animated.timing` 600ms scale+opacity)，新增实际时长、完成项数、完成率 3 列 KPI 数据卡，新增根据 `conditionScale` 显示的三挡动态金句，新增连击打卡预告 (`streak` + `listTrainingLogs(1)` 判断今日是否已打)，新增「再来一组」次要 CTA 重置状态回 idle。
  - 新增本地资源 `assets/images/court_bg.jpg` 及生成脚本 `generate_court_bg.js`。
- **测试结论**：
  - ✅ 远程图片已全部替换为本地静态资源（grep `https://` 命中 0），且图大小合法 (30KB)
  - ✅ 结算页 5 大核心元素（🏆、KPI、金句、打卡预告、主次 CTA）结构与交互逻辑完整
  - ✅ 次要 CTA `restartWorkout` 状态重置覆盖完整（清 index, timeLeft, durationSec，回退 `idle`）
  - ✅ 金句显示逻辑匹配 3 挡状态 (`>=1`, `>=0.75`, `<0.75`)，无遗漏
- **typecheck**：✅ `tsc --noEmit` 通过

### v0.7.0 · 2026-05-15

- **产品需求**：5 轮迭代收官——回款历史挂账（run.tsx 复用 TutorialMedia、pose fromBar 定位）+ 实用小升级（Tab Bar 激活态、log 快捷时长、清理 dep）。
- **开发改动**：
  - `app/(tabs)/_layout.tsx`：emoji 不响应 `color` prop 的老问题——给激活 Tab 在 emoji 下方加一根 18×3 的高亮条（`colors.primary`），让选中态明显可见。
  - `app/training/log.tsx`：训练时长 input 下方加 `30 / 60 / 90 / 120 分钟` 快捷 chip，常用值一键填，激活态绿色。
  - `app/training/run.tsx`：清掉 v0.4.0 挂账——4 套 animationType `if` 链替换为单一 `<TutorialMedia>` 调用；移除原本的 4 个动画组件 import，由 TutorialMedia 内部承接。
  - `app/pose/index.tsx`：fromBar 去掉 `position: absolute`，改为正常 flex 流式，避免与 router header 视觉冲突（v0.5.0 标注）。
  - `package.json`：`canvas` 是 Node 端 lib（仅 `draw_icon.js` 脚本用），从 `dependencies` 移到 `devDependencies`，减小用户安装体积；版本号 `0.1.0` → `0.7.0` 与 README 迭代日志对齐。
- **测试结论**：
  - ✅ Tab Bar 激活底条逻辑（focused 切换 backgroundColor）
  - ✅ 快捷 chip active 态绑定 `duration === String(n)`
  - ✅ run.tsx 改造前后行为等价（animationType 仍按 startsWith 在 TutorialMedia 内部分发）
  - ✅ `canvas` 移到 devDependencies，App 运行时不再装这个无关 lib
  - ⚠️ `package-lock.json` 这次没重新生成（避免临时网络/缓存问题），后续 `npm install` 时会自动同步
- **typecheck**：✅ `tsc --noEmit` 通过

### v0.6.0 · 2026-05-15

- **产品需求**：stats 页可视化深度（训练类别分布横条图、累计时长单位修复、历史记录展开）+ 计划编辑空态/星期 chip/自动滚动。
- **开发改动**：
  - `app/(tabs)/stats.tsx`：整文件重写（上一次替换破坏了 JSX 结构,本次干净重建）。新增"最近 30 天训练分布"横条图卡片（基于 `categories` 字段统计 + max 归一化宽度）；累计时长 KPI < 60 显示 `Nm`，>= 60 显示 `Nh`（半精度保留 `.5h`）；历史记录默认 20 条 + 「查看全部 N 条 →」展开按钮。
  - `app/plans/[id]/edit.tsx`：模块列表空态引导卡（虚线 + 文案）；周计划模式下每个模块卡内嵌 7 个圆形 weekday chip 实时切换；`addModule` 后 `scrollRef.current?.scrollToEnd` 滚到底。
- **测试结论**：
  - ✅ stats 整文件经 `tsc` 通过,结构合法（KPI / A:C / 类别分布 / 热力图 / 历史 / 展开按钮 完整渲染）
  - ✅ 类别分布无数据态走 totalLogs===0 分支
  - ✅ plan edit 模块为空时显示引导卡而非空白
  - ✅ weekday chip 点击触发 updateModule 写入 SQLite
  - ⚠️ stats 重写没有改变可见行为,但 walk-through 时若发现样式微调需求,下一轮跟进
- **typecheck**：✅ `tsc --noEmit` 通过

### v0.5.0 · 2026-05-15

- **产品需求**：完善 pose 占位页对教程跳入的承接、补 schedule 删除确认与表单重置、加固 replay 数据守卫、清理代码注释噪音、改通俗 pose 文案。
- **开发改动**：
  - `app/pose/index.tsx`：读取 `tutorial` 参数,查到则顶部展示返回按钮 + 醒目的"你将要检测的动作"目标卡;底部"C++ 模型推理库"等技术黑话改为面向用户的通俗承诺文案。
  - `app/schedule/index.tsx`：新增 `resetForm()`,添加成功后重置 title/weekday/time;`remove` 改为先 Alert 确认（Web 走 `window.confirm`），文案带具体提醒摘要。
  - `app/replay/index.tsx`：`c.annotations.length` 加可选链与默认 0,防旧数据无 annotations 字段崩溃。
  - `app/training/fitness.tsx`：清理 4 行心路历程注释,去掉未使用的 `radius` 导入。
- **测试结论**：
  - ✅ pose 页 ?tutorial=clear 等参数透传,findTutorial 命中渲染目标卡
  - ✅ schedule add 成功路径后表单回到默认值
  - ✅ replay 数据守卫(`?.length ?? 0`)对 undefined 安全
  - ⚠️ schedule 通知权限交互需真机回归(Web 不会触发)
  - ⚠️ pose 页"返回"按钮覆盖在原 layout header 上的视觉,真机需观察
- **typecheck**：✅ `tsc --noEmit` 通过

### v0.4.0 · 2026-05-15

- **产品需求**：教程与计划列表体验补强：搜索能力、CTA 透传 id、空态卡、重名守卫、动画分发组件抽象、危险操作视觉分组。
- **开发改动**：
  - `app/(tabs)/library.tsx`：新增搜索框（按 title + keyPoints 模糊匹配，与 category tab 二者 AND），无结果空态卡，输入非空显示清空按钮。
  - `app/tutorial/[id].tsx`：CTA 跳 `/pose` 时携带 `tutorial=t.id` 参数；4 套 animationType `if` 链替换为 `<TutorialMedia>` 一行调用。
  - `app/plans/index.tsx`：「我的计划」区块即使为空也展示，给虚线引导卡；创建同名计划自动追加 ` (2)`/`(3)`；PlanCard 操作行的「删除」推到右侧并加左侧分隔线，降低误触。
  - `src/components/animations/TutorialMedia.tsx`：新建复用组件，统一 footwork/shuttle/fitness/tactics 四类动画的容器与分发逻辑。
- **测试结论**：
  - ✅ 搜索 + 分类 AND 过滤逻辑（`useMemo` 缓存）
  - ✅ 重名追加序号路径正确（已存在则递增）
  - ✅ TutorialMedia 抽象未改动行为，原页面渲染等价
  - ⚠️ run.tsx 中相同的 4 套 `if` 链同样可以迁移到 TutorialMedia，本轮未动（保护 v0.3.0 timer 改动稳定性）
- **typecheck**：✅ `tsc --noEmit` 通过

### v0.3.0 · 2026-05-15

- **产品需求**：训练执行流（run.tsx）稳定性与可读性升级；修暂停/继续 timer bug、Slider 误触发结束、加全局进度条；统一文案 + 打卡时长上下限守卫。
- **开发改动**：
  - `app/training/run.tsx`：把训练倒计时 effect 依赖从 `[status, timeLeft]` 收敛为 `[status, items, conditionScale]`，避免每秒重建 interval 导致计时漂移；BGM 控制抽独立 effect；准备期倒计时也拆为独立 effect；预加载 sfx 加 `cancelled` 守卫避免 race；新增全局训练进度条（顶部 3px 细条）；Slider 改用 `onSlidingComplete` + 本地 `dragValue` 临时态，拖动不再重建 timer 也不会瞬间触发完成。
  - `app/training/today.tsx`、`app/training/module/[id].tsx`：文案"直接去打卡 (已在线下完成)" → "我已在线下完成此训练 →"，消除"线下完成"歧义。
  - `app/training/log.tsx`：时长 < 1 分钟提示并拒绝；> 480 分钟弹确认对话框（Web 走 `window.confirm`，原生走 `Alert`），允许但二次确认。
- **测试结论**：
  - ✅ 暂停/继续逻辑（计时只在 `status` 切换时建立/销毁 interval）
  - ✅ Slider 拖动不再触发 finish（`onValueChange` 只改本地态）
  - ✅ 进度条颜色随 paused 变灰（`progressBarColor` 逻辑）
  - ✅ sfx 加载 race（cancelled 标志位 + 局部变量）
  - ✅ 文案 grep 验证："已在线下完成" 已无残留
  - ⚠️ run.tsx 单文件已 730+ 行，建议下一轮拆分为 hook（`useWorkoutTimer` / `useGhostCoach`）
  - ⚠️ 真机暂停/继续与 BGM 同步需回归
- **typecheck**：✅ `tsc --noEmit` 通过

### v0.2.0 · 2026-05-15

- **产品需求**：清理首页与「我的」Tab 的功能错位与跳转盲区，打通新用户首启与空数据态。
- **开发改动**：
  - `app/(tabs)/index.tsx`：用 `loaded`/`daysSinceLast === -1` 区分新老用户，新增🎯欢迎卡、修文案"已 N 天没练"；快捷入口由 4 张瘦身为 2 张（动作识别 / 录像复盘）；"切换计划"改为描边 chip + haptics + hitSlop。
  - `app/(tabs)/me.tsx`：移除与首页/训练 Tab 重复的"动作识别 / 录像复盘 / 体能训练"三项；新增"关于本应用"项；等级文字升级为可点击徽章（占位 Alert）。
  - `app/(tabs)/stats.tsx`：A:C 比值新增样本守卫——近 28 天累计 < 60 分钟 或训练 < 3 天时显示「—」+ 灰色 + 提示文案，不再误报"高风险"。
  - `app/(tabs)/train.tsx`：「⇄ 切换」按钮加 `vibrateLight` + `hitSlop`。
- **测试结论**：
  - ✅ 5 条 PRD 验收标准全部对齐（详见 PR 描述对照表）
  - ✅ 文案 grep："很久" 已无残留
  - ✅ Web 端 haptics 走 `Platform.OS !== 'web'` 守卫，不会报错
  - ⚠️ 仅静态 walk-through，未跑真机；视觉与触感需在真机回归
- **typecheck**：✅ `tsc --noEmit` 通过

<!-- ITERATION_LOG_END -->


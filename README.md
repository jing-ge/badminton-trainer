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


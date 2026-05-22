# 📸 截图素材

README 引用的截图都是真实渲染产物——通过 `npx expo start --web` 起 dev server，再用 Chrome headless + CDP 自动注入 `prefs.onboardingDone` 跳过引导后批量截图，414×896 viewport @2x DPR（828×1792 PNG），深色主题。

复现脚本：`scripts/capture-screenshots.mjs`（基础 8 张）+ `scripts/capture-extra.mjs`（带 scroll/深路径 3 张）。

## 文件清单

| 文件 | 来源屏 | 说明 |
|------|--------|------|
| `home.png` | `app/(tabs)/index.tsx` | 首页：今日训练任务卡 + 双栏 KPI + 🚀 开始今日训练 + 录像复盘快捷入口 |
| `train-weekly.png` | `app/(tabs)/train.tsx` WeeklyView | 训练 Tab：周一~周日 7 天总览，今日（周五）卡片绿框高亮 + ▶ + 🚀 开始练 → |
| `run-idle.png` | `app/training/run.tsx` idle | 训练执行：球场网格背景 + 「本次训练共 5 项」hero + 满血/一般/疲惫 三档 + 「▶ 开始跟练」 |
| `stats-period.png` | `app/(tabs)/stats.tsx` 顶部 | 记录 Tab：本周/本月切换 + 三 KPI + 🚦 训练负荷信号灯 + 30 天分布 + 90 天热力图 |
| `stats-history.png` | `app/(tabs)/stats.tsx` 滚到底 | 记录 Tab：信号灯 + 热力图 + 历史记录区 |
| `library.png` | `app/(tabs)/library.tsx` | 教程 Tab：分类 chip（含 ⭐ 收藏）+ 中级徽章 + 卡片要点预览 |
| `tutorial-detail.png` | `app/tutorial/[id].tsx` | 教程详情：标题 + 2.5D 鹰眼场地动画 + 八边形握拍透视图 + 拇指/食指标注 |
| `me.png` | `app/(tabs)/me.tsx` | 我的：🏸 头像圈 + 业余中级芯片 + 三连成就卡 + 5 项配置入口 |
| `voice.png` | `app/settings/voice.tsx` | 语音设置：教练真人音 toggle + 语速/音调 ± + 12 个普通话 voice 列表 |
| `backup.png` | `app/settings/backup.tsx` | 备份与恢复：当前数据 6 项统计 + 1️⃣ 导出 + 2️⃣ 恢复（红色覆盖按钮） |
| `schedule.png` | `app/schedule/index.tsx` | 日程提醒：星期 / 时间 chip + 19:00 输入 + 添加+测试通知 + 空态预设引导 |
| `onboarding.png` | `app/onboarding.tsx` | 首启引导：🏸 球拍 hero + 「30 秒带你跑通三件最重要的事」+ 进度点 1/3 |

## 重新生成

```bash
# 1. 先确保 expo web dev server 在跑
npx expo start --web   # 默认 http://localhost:8081

# 2. 另开终端跑两个 capture 脚本
node scripts/capture-screenshots.mjs   # 8 张基础
node scripts/capture-extra.mjs         # 3 张需 scroll / 深路径
```

脚本依赖 macOS Chrome.app 路径（`/Applications/Google Chrome.app/...`），在其它系统改 `CHROME` 常量即可。

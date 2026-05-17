import re
from datetime import datetime

with open('README.md', 'r') as f:
    content = f.read()

log_entry = """### v0.29.0 · 2026-05-17

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

"""

new_content = content.replace("<!-- ITERATION_LOG_START -->\n\n", "<!-- ITERATION_LOG_START -->\n\n" + log_entry)

with open('README.md', 'w') as f:
    f.write(new_content)

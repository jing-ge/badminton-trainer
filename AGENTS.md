# Badminton Trainer · Agents 协作手册

本仓库使用 **opencode** 的 subagent 机制，配置了 3 个专职角色按「产品 → 开发 → 测试」的流水线推进迭代。

## 角色与模型

| Agent | 角色 | 主模型 | Fallback 顺序（限流时手动切换） |
|---|---|---|---|
| `@product` | 产品经理：发掘问题、定义需求、把控 UI/UX 风格 | `jdcloud-anthropic/Claude-Opus-4.7` | DeepSeek-V4-Pro → GPT-5.4 → Gemini-3.1-Pro-Preview |
| `@developer` | 开发工程师：按 PRD 落地，保证架构清晰、类型严谨、60fps | `jdcloud-anthropic/Claude-Opus-4.7` | DeepSeek-V4-Pro → GPT-5.4 |
| `@tester` | 测试工程师：验收 + 写 README 迭代日志 + git commit | `jdcloud-gemini/Gemini-3.1-Pro-Preview` | Claude-Opus-4.7 → DeepSeek-V4-Pro |

Prompt 文件位于 `.opencode/agent/{product,developer,tester}.md`，配置注册在 `opencode.json`。

## 标准迭代流程

```
用户提需求/痛点
    ↓
orchestrator → @product   产出 PRD（仅文字，含验收标准）
    ↓
orchestrator → @developer 实现代码 + 自跑 npm run typecheck
    ↓
orchestrator → @tester    验收 + 写 README 迭代日志 + git commit
    ↓
orchestrator 汇总结果给用户
```

每一轮迭代结束，README 末尾的 `## 📝 迭代日志` 区块都会新增一条记录，且对应一个独立的 `iter(vX.Y.Z): ...` 提交。

## 限流（Rate Limit）应对策略

当 agent 运行触发 `token rate limit exceeded` / `429` / `Too Many Requests` 等：

1. **第一层：自动重试**
   每个 agent 的 prompt 中都已写入：等待 5s 后重试当前操作，最多 2 次。

2. **第二层：上报主对话**
   连续 2 次失败 → agent 在返回里标注「⚠️ 触发限流，建议切换模型重试」，**不要硬撑**。

3. **第三层：手动切换模型**
   主对话（orchestrator）收到限流上报后，按上表 fallback 顺序临时编辑 `opencode.json` 中对应 agent 的 `model` 字段，然后重新唤起该 agent 续做。
   完成本轮后可改回原模型。

   ```bash
   # 例：把 @developer 临时切到 DeepSeek
   # 编辑 opencode.json，把 developer.model 改成 "jdcloud/DeepSeek-V4-Pro"
   # 跑完后再改回 "jdcloud-anthropic/Claude-Opus-4.7"
   ```

4. **第四层：拆细任务**
   如果限流是因为单次请求体过大（长文件 + 大 diff），主对话应把任务再拆一层后再交给 agent。

## 调用方式（在 opencode 主对话里）

- 提需求："`@product` 帮我看看「计划」Tab 有没有可用性问题，给一版 PRD"
- 让 dev 干活："把上面 PRD 交给 `@developer` 实现"
- 收尾："`@tester` 验收并写日志"

也可以让 orchestrator（主对话）一次串起来：「按标准流程跑一轮迭代，主题：xxx」。

## 边界与禁令

- `@product` **只读**，不写代码、不改 README、不 commit
- `@developer` **写代码**，不写 README 迭代日志、不 commit
- `@tester` **不改业务逻辑**，只跑 typecheck、写 README 日志、做 commit
- 三个 agent 都 **绝不**：`git push --force`、`git commit --amend`（除非用户明确要求）、`rm -rf` 项目文件、提交 `.env` 等密钥文件

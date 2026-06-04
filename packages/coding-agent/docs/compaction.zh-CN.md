# 压缩与分支摘要

LLM 有有限的上下文窗口。当对话过长时，pi 使用压缩来摘要较旧的内容，同时保留近期工作。

## 概览

Pi 有两种摘要机制：

| 机制 | 触发条件 | 用途 |
|-----------|---------|---------|
| 压缩 | 上下文超出阈值，或 `/compact` | 摘要旧消息以释放上下文 |
| 分支摘要 | `/tree` 导航 | 在切换分支时保留上下文 |

## 压缩

### 触发时机

当 `contextTokens > contextWindow - reserveTokens` 时触发自动压缩。默认 `reserveTokens` 为 16384 token。

也可通过 `/compact [instructions]` 手动触发。

### 工作方式

1. **找切割点**：从最新消息向后遍历，累积 token 估算直到达到 `keepRecentTokens`（默认 20k）
2. **提取消息**：收集从上次保留边界到切割点的消息
3. **生成摘要**：调用 LLM 摘要，使用结构化格式
4. **追加条目**：保存包含摘要和 `firstKeptEntryId` 的 `CompactionEntry`
5. **重载**：会话重载，使用摘要 + 从 `firstKeptEntryId` 开始的消息

### 切割点规则

有效切割点：User 消息、Assistant 消息、BashExecution 消息、Custom 消息。永不切割工具结果。

## 分支摘要

### 触发时机

使用 `/tree` 导航到不同分支时，pi 提供摘要正在离开的工作的选项。

### 工作方式

1. 找共同祖先
2. 收集从旧叶节点回到共同祖先的条目
3. 准备预算内的消息
4. 调用 LLM 生成结构化摘要
5. 在导航点保存 `BranchSummaryEntry`

## 累计文件追踪

压缩和分支摘要都累计追踪文件操作。生成摘要时 pi 从被摘要消息中的工具调用和之前的压缩/分支摘要 `details` 中提取文件操作。

## 摘要格式

使用结构化 Markdown 格式：Goal、Constraints、Progress、Key Decisions、Next Steps、Critical Context，以及 `<read-files>` 和 `<modified-files>` 标记。

## 通过扩展的自定义摘要

扩展可拦截和自定义压缩及分支摘要。

### session_before_compact

在自动压缩或 `/compact` 前触发。可取消或提供自定义摘要。使用 `serializeConversation` 和 `convertToLlm` 将消息转换为文本，发送给自己的模型进行摘要。

### session_before_tree

在 `/tree` 导航前触发。始终触发，无论用户是否选择摘要。可取消导航或提供自定义摘要。

## 设置

在 `settings.json` 中配置压缩：

```json
{
  "compaction": {
    "enabled": true,
    "reserveTokens": 16384,
    "keepRecentTokens": 20000
  }
}
```

设为 `"enabled": false` 禁用自动压缩。仍可通过 `/compact` 手动压缩。

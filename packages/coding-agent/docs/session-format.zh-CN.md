# 会话文件格式

会话以 JSONL 格式存储。每行是一个带 `type` 字段的 JSON 对象。会话条目通过 `id`/`parentId` 字段形成树形结构，支持就地分支而无需创建新文件。

## 文件位置

```
~/.pi/agent/sessions/--<path>--/<timestamp>_<uuid>.jsonl
```

其中 `<path>` 是工作目录，`/` 替换为 `-`。

## 删除会话

可通过删除 `~/.pi/agent/sessions/` 下的 `.jsonl` 文件删除会话。也可从 `/resume` 交互式删除（选择会话并按 `Ctrl+D`）。可用时 pi 使用 `trash` CLI 避免永久删除。

## 会话版本

- **Version 1**：线性条目序列（旧版，加载时自动迁移）
- **Version 2**：带 `id`/`parentId` 链接的树形结构
- **Version 3**：将 `hookMessage` 角色重命名为 `custom`

现有会话在加载时自动迁移到当前版本（v3）。

## 源文件

- `packages/coding-agent/src/core/session-manager.ts` - 会话条目类型和 SessionManager
- `packages/coding-agent/src/core/messages.ts` - 扩展消息类型
- `packages/ai/src/types.ts` - 基础消息类型

## 消息类型

### 内容块
- `TextContent`：`{ type: "text", text: string }`
- `ImageContent`：`{ type: "image", data: string, mimeType: string }`
- `ThinkingContent`：`{ type: "thinking", thinking: string }`
- `ToolCall`：`{ type: "toolCall", id, name, arguments }`

### 基础消息类型
- `UserMessage`：`role: "user"`，含 `content` 和 `timestamp`
- `AssistantMessage`：`role: "assistant"`，含 `content[]`、`usage`、`stopReason`
- `ToolResultMessage`：`role: "toolResult"`，含 `toolCallId`、`content`、`isError`

### 扩展消息类型
- `BashExecutionMessage`：`role: "bashExecution"`（用户 `!` 命令）
- `CustomMessage`：`role: "custom"`（扩展注入的消息）
- `BranchSummaryMessage`：`role: "branchSummary"`（分支摘要）
- `CompactionSummaryMessage`：`role: "compactionSummary"`（压缩摘要）

## 条目基础

除 `SessionHeader` 外所有条目扩展 `SessionEntryBase`：`type`、`id`（8 位十六进制）、`parentId`、`timestamp`。

## 条目类型

- **SessionHeader**：文件第一行，元数据，不参与树
- **SessionMessageEntry**：对话中的消息
- **ModelChangeEntry**：会话中切换模型时发出
- **ThinkingLevelChangeEntry**：更改思考级别时发出
- **CompactionEntry**：上下文压缩时创建，存储前期消息摘要
- **BranchSummaryEntry**：通过 `/tree` 切换分支时创建
- **CustomEntry**：扩展状态持久化（不参与 LLM 上下文）
- **CustomMessageEntry**：扩展注入的消息（参与 LLM 上下文）
- **LabelEntry**：条目上的用户定义书签/标记
- **SessionInfoEntry**：会话元数据（如显示名称）

## 树形结构

条目形成树：第一个条目 `parentId: null`，后续条目通过 `parentId` 链向父条目，分支从早期条目创建新子节点，叶节点是树的当前位置。

## 上下文构建

`buildSessionContext()` 从当前叶节点走到根节点，生成 LLM 的消息列表。如果路径上有 `CompactionEntry`，先发出摘要，然后从 `firstKeptEntryId` 开始的消息，压缩点之后的消息。

## 解析示例

读取 JSONL 文件的各行，根据 `entry.type` 处理不同类型。

## SessionManager API

### 静态创建方法
- `SessionManager.create(cwd, sessionDir?)` - 新会话
- `SessionManager.open(path, sessionDir?)` - 打开已有
- `SessionManager.continueRecent(cwd, sessionDir?)` - 继续最近的或新建
- `SessionManager.inMemory(cwd?)` - 无文件持久化
- `SessionManager.forkFrom(sourcePath, targetCwd, sessionDir?)` - 跨项目分叉

### 静态列表方法
- `SessionManager.list(cwd, sessionDir?, onProgress?)` - 列出目录会话
- `SessionManager.listAll(onProgress?)` - 列出所有会话

### 实例方法 - 会话管理
`newSession()`、`setSessionFile()`、`createBranchedSession()`

### 实例方法 - 追加（均返回条目 ID）
`appendMessage()`、`appendThinkingLevelChange()`、`appendModelChange()`、`appendCompaction()`、`appendCustomEntry()`、`appendSessionInfo()`、`appendCustomMessageEntry()`、`appendLabelChange()`

### 实例方法 - 树形导航
`getLeafId()`、`getLeafEntry()`、`getEntry()`、`getBranch()`、`getTree()`、`getChildren()`、`getLabel()`、`branch()`、`resetLeaf()`、`branchWithSummary()`

### 实例方法 - 上下文与信息
`buildSessionContext()`、`getEntries()`、`getHeader()`、`getSessionName()`、`getCwd()`、`getSessionDir()`、`getSessionId()`、`getSessionFile()`、`isPersisted()`

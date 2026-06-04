# JSON 事件流模式

```bash
pi --mode json "你的prompt"
```

将所有会话事件作为 JSON 行输出到 stdout。用于将 pi 集成到其他工具或自定义 UI 中。

## 事件类型

事件定义在 [`AgentSessionEvent`](https://github.com/earendil-works/pi-mono/blob/main/packages/coding-agent/src/core/agent-session.ts#L102)：

```typescript
type AgentSessionEvent =
  | AgentEvent
  | { type: "queue_update"; steering: readonly string[]; followUp: readonly string[] }
  | { type: "compaction_start"; reason: "manual" | "threshold" | "overflow" }
  | { type: "compaction_end"; reason: "manual" | "threshold" | "overflow"; result: CompactionResult | undefined; aborted: boolean; willRetry: boolean; errorMessage?: string }
  | { type: "auto_retry_start"; attempt: number; maxAttempts: number; delayMs: number; errorMessage: string }
  | { type: "auto_retry_end"; success: boolean; attempt: number; finalError?: string };
```

基础事件来自 [`AgentEvent`](https://github.com/earendil-works/pi-mono/blob/main/packages/agent/src/types.ts#L179)：

- `agent_start` / `agent_end` - Agent 生命周期
- `turn_start` / `turn_end` - 轮生命周期
- `message_start` / `message_update` / `message_end` - 消息生命周期
- `tool_execution_start` / `tool_execution_update` / `tool_execution_end` - 工具执行

## 消息类型

- `UserMessage`、`AssistantMessage`、`ToolResultMessage`（来自 `packages/ai/src/types.ts`）
- `BashExecutionMessage`、`CustomMessage`、`BranchSummaryMessage`、`CompactionSummaryMessage`（来自 `packages/coding-agent/src/core/messages.ts`）

## 输出格式

每行一个 JSON 对象。第一行是会话头：

```json
{"type":"session","version":3,"id":"uuid","timestamp":"...","cwd":"/path"}
```

之后是事件：

```json
{"type":"agent_start"}
{"type":"turn_start"}
{"type":"message_start","message":{"role":"assistant","content":[],...}}
{"type":"message_update","message":{...},"assistantMessageEvent":{"type":"text_delta","delta":"Hello",...}}
{"type":"message_end","message":{...}}
{"type":"turn_end","message":{...},"toolResults":[]}
{"type":"agent_end","messages":[...]}
```

## 示例

```bash
pi --mode json "List files" 2>/dev/null | jq -c 'select(.type == "message_end")'
```

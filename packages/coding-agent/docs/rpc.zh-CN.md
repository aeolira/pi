# RPC 模式

RPC 模式通过 stdin/stdout 上的 JSON 协议实现 agent 的无头操作。用于在其他应用、IDE 或自定义 UI 中嵌入 agent。

启动 RPC 模式：

```bash
pi --mode rpc [options]
```

## 协议概览

- **命令**：发送到 stdin 的 JSON 对象，每行一个
- **响应**：带 `type: "response"` 的 JSON 对象，指示命令成功/失败
- **事件**：Agent 事件作为 JSON 行流式传输到 stdout

RPC 模式使用严格的 JSONL 语义，仅 LF（`\n`）作为记录分隔符。

## 命令

### Prompt 类
- **prompt**：发送用户 prompt，支持 `images` 和 `streamingBehavior`
- **steer**：agent 运行时排队引导消息
- **follow_up**：排队跟进消息
- **abort**：中止当前操作
- **new_session**：开始新会话（可被扩展取消）

### 状态类
- **get_state**：获取当前会话状态
- **get_messages**：获取所有对话消息

### 模型类
- **set_model**：切换到特定模型
- **cycle_model**：循环到下一个可用模型
- **get_available_models**：列出所有已配置模型

### 思考类
- **set_thinking_level**：设置思考级别
- **cycle_thinking_level**：循环可用思考级别

### 队列模式
- **set_steering_mode**：控制引导消息投递（`all` 或 `one-at-a-time`）
- **set_follow_up_mode**：控制跟进消息投递

### 压缩/重试/Bash
- **compact**：手动压缩，可带自定义指令
- **set_auto_compaction**：启用/禁用自动压缩
- **set_auto_retry**：启用/禁用自动重试
- **abort_retry**：中止进行中的重试
- **bash**：执行 shell 命令
- **abort_bash**：中止运行中的 bash 命令

### 会话类
- **get_session_stats**：获取 token/费用统计
- **export_html**：导出会话为 HTML
- **switch_session**：加载不同会话文件
- **fork**：从之前用户消息分叉
- **clone**：复制当前活跃分支到新会话
- **get_fork_messages**：获取可用的分叉消息
- **get_last_assistant_text**：获取最后 assistant 消息文本
- **set_session_name**：设置会话显示名称
- **get_commands**：获取可用命令（扩展命令、提示模板和 skills）

## 事件

流式事件类型：`agent_start`、`agent_end`、`turn_start/end`、`message_start/update/end`、`tool_execution_start/update/end`、`queue_update`、`compaction_start/end`、`auto_retry_start/end`、`extension_error`。

## 扩展 UI 协议

扩展通过 `ctx.ui.select()`、`ctx.ui.confirm()` 等请求用户交互。在 RPC 模式下翻译为请求/响应子协议：
- **对话框方法**发出 `extension_ui_request` 并阻塞直到客户端返回 `extension_ui_response`
- **即发即弃方法**发出 `extension_ui_request` 但不期望响应

支持的对话框方法：`select`、`confirm`、`input`、`editor`。即发即弃方法：`notify`、`setStatus`、`setWidget`、`setTitle`、`set_editor_text`。

## 类型

消息类型包括：`UserMessage`、`AssistantMessage`、`ToolResultMessage`、`BashExecutionMessage`。Assistant 消息的 stop reasons：`stop`、`length`、`toolUse`、`error`、`aborted`。

## 示例

文档包含 Python 客户端（使用 subprocess）和 Node.js 客户端（使用 spawn + JSONL 读取器）的完整示例。

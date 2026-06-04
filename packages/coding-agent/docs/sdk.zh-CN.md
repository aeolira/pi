> pi 可以帮助你使用 SDK。告诉它你的用例，让它帮你构建集成。

# SDK

SDK 提供了对 pi agent 能力的编程访问。用它来在其他应用中嵌入 pi、构建自定义界面或集成自动化工作流。

## 快速开始

```typescript
import { AuthStorage, createAgentSession, ModelRegistry, SessionManager } from "@earendil-works/pi-coding-agent";

const authStorage = AuthStorage.create();
const modelRegistry = ModelRegistry.create(authStorage);

const { session } = await createAgentSession({
  sessionManager: SessionManager.inMemory(),
  authStorage,
  modelRegistry,
});

session.subscribe((event) => {
  if (event.type === "message_update" && event.assistantMessageEvent.type === "text_delta") {
    process.stdout.write(event.assistantMessageEvent.delta);
  }
});

await session.prompt("当前目录有哪些文件？");
```

## 安装

```bash
npm install @earendil-works/pi-coding-agent
```

SDK 包含在主包中，无需单独安装。

## 核心概念

### createAgentSession()

单个 `AgentSession` 的主工厂函数。使用 `ResourceLoader` 提供扩展、skills、提示模板、主题和上下文文件。不提供时使用 `DefaultResourceLoader` 和标准发现。

### AgentSession

管理 agent 生命周期、消息历史、模型状态、压缩和事件流。

主要方法：`prompt()`（发送 prompt）、`steer()` / `followUp()`（流式期间排队消息）、`subscribe()`（订阅事件）、`setModel()` / `setThinkingLevel()` / `cycleModel()` / `cycleThinkingLevel()`（模型控制）、`navigateTree()`（树内导航）、`compact()`（压缩）、`abort()`（中止）、`dispose()`（清理）。

### createAgentSessionRuntime() 和 AgentSessionRuntime

在需要替换活动会话并重建 cwd 绑定运行时状态时使用运行时 API。这与内置交互模式、print 模式和 RPC 模式使用的层级相同。

### Prompt 和消息排队

`PromptOptions` 控制 prompt 展开、流式期间的排队行为以及 prompt 预飞行通知。`preflightResult` 在每次 `prompt()` 调用时调用一次。

### Agent 和 AgentState

通过 `session.agent` 访问 `Agent` 类（来自 `@earendil-works/pi-agent-core`）。提供对 `state.messages`、`state.model`、`state.tools` 等的访问。

### 事件

订阅事件以接收流式输出和生命周期通知。事件类型包括：`message_update`、`tool_execution_start/update/end`、`message_start/end`、`agent_start/end`、`turn_start/end`、`queue_update`、`compaction_start/end`、`auto_retry_start/end`。

## 选项参考

### 目录
- `cwd`：当前工作目录（用于 DefaultResourceLoader 发现）
- `agentDir`：全局配置目录（默认 `~/.pi/agent`）

### 模型
使用 `getModel()` 或 `modelRegistry.find()` 查找模型。`modelRegistry.getAvailable()` 仅返回配置了有效 API key 的模型。可通过 `scopedModels` 设置循环切换模型。

### API Keys 和 OAuth
API key 解析优先级：运行时覆盖 → `auth.json` → 环境变量 → 回退解析器。`AuthStorage` 处理凭据，`ModelRegistry` 管理模型列表。

### System Prompt
通过 `ResourceLoader` 的 `systemPromptOverride` 覆盖 system prompt。

### 工具
内置工具名：`read`、`bash`、`edit`、`write`、`grep`、`find`、`ls`。默认启用 `read`、`bash`、`edit`、`write`。`noTools: "all"` 禁用所有工具，`noTools: "builtin"` 仅禁用内置工具。`excludeTools` 禁用特定工具。

### 自定义工具
通过 `defineTool()` 创建内联自定义工具，通过 `customTools` 传入。

### 扩展
扩展由 `ResourceLoader` 加载。可传递 `additionalExtensionPaths` 和 `extensionFactories`。扩展可通过 `pi.events` 通信。

### Skills / 上下文文件 / 斜杠命令
均可通过重写方法（`skillsOverride`、`agentsFilesOverride`、`promptsOverride`）自定义。

### 会话管理
会话使用树形结构。支持 `SessionManager.inMemory()`、`create()`、`continueRecent()`、`open()`。SessionManager tree API 提供条目遍历、标签和分支功能。

### 设置管理
`SettingsManager.create()` 从文件加载，`.inMemory()` 无文件 I/O。设置合并全局和项目设置。

## ResourceLoader

使用 `DefaultResourceLoader` 发现扩展、skills、提示、主题和上下文文件。

## 返回值

`createAgentSession()` 返回 `{ session, extensionsResult, modelFallbackMessage? }`。

## Run 模式

SDK 导出运行模式工具：`InteractiveMode`（完整 TUI）、`runPrintMode`（单次模式）、`runRpcMode`（JSON-RPC）。

## 导出

主入口点导出：`createAgentSession`、`createAgentSessionRuntime`、`AuthStorage`、`ModelRegistry`、`DefaultResourceLoader`、`SessionManager`、`SettingsManager`、`defineTool`、各种工具工厂和类型。

> pi 可以创建扩展。直接告诉它你的使用场景，让它帮你构建。

# 扩展

扩展是扩展 pi 行为的 TypeScript 模块。它们可以订阅生命周期事件、注册 LLM 可调用的自定义工具、添加命令等。

> **/reload 的放置位置：** 将扩展放在 `~/.pi/agent/extensions/`（全局）或 `.pi/extensions/`（项目本地）以便自动发现。仅用于快速测试时使用 `pi -e ./path.ts`。自动发现位置的扩展可通过 `/reload` 热重载。

**关键能力：**
- **自定义工具** - 通过 `pi.registerTool()` 注册 LLM 可调用的工具
- **事件拦截** - 阻止或修改工具调用、注入上下文、自定义压缩
- **用户交互** - 通过 `ctx.ui` 提示用户（选择、确认、输入、通知）
- **自定义 UI 组件** - 通过 `ctx.ui.custom()` 实现完整的 TUI 组件和键盘输入
- **自定义命令** - 通过 `pi.registerCommand()` 注册如 `/mycommand` 的命令
- **会话持久化** - 通过 `pi.appendEntry()` 存储跨重启的状态
- **自定义渲染** - 控制在 TUI 中工具调用/结果和消息的显示方式

**示例用例：**
- 权限门控（在 `rm -rf`、`sudo` 等之前确认）
- Git 检查点（每轮回合 stash，在分支上恢复）
- 路径保护（阻止写入 `.env`、`node_modules/`）
- 自定义压缩（按你的方式摘要对话）
- 对话摘要（参见 `summarize.ts` 示例）
- 交互式工具（提问、向导、自定义对话框）
- 有状态工具（待办列表、连接池）
- 外部集成（文件监视器、webhooks、CI 触发器）
- 等待时游戏（参见 `snake.ts` 示例）

参见 [examples/extensions/](../examples/extensions/) 获取工作实现。

## 目录

- [快速开始](#快速开始)
- [扩展位置](#扩展位置)
- [可用导入](#可用导入)
- [编写扩展](#编写扩展)
  - [扩展风格](#扩展风格)
- [事件](#事件)
  - [生命周期概览](#生命周期概览)
  - [资源事件](#资源事件)
  - [会话事件](#会话事件)
  - [Agent 事件](#agent-事件)
  - [模型事件](#模型事件)
  - [工具事件](#工具事件)
- [ExtensionContext](#extensioncontext)
- [ExtensionCommandContext](#extensioncommandcontext)
- [ExtensionAPI 方法](#extensionapi-方法)
- [状态管理](#状态管理)
- [自定义工具](#自定义工具)
- [自定义 UI](#自定义-ui)
- [错误处理](#错误处理)
- [模式行为](#模式行为)
- [示例参考](#示例参考)

## 快速开始

创建 `~/.pi/agent/extensions/my-extension.ts`：

```typescript
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

export default function (pi: ExtensionAPI) {
  // 响应事件
  pi.on("session_start", async (_event, ctx) => {
    ctx.ui.notify("扩展已加载！", "info");
  });

  pi.on("tool_call", async (event, ctx) => {
    if (event.toolName === "bash" && event.input.command?.includes("rm -rf")) {
      const ok = await ctx.ui.confirm("危险！", "允许 rm -rf？");
      if (!ok) return { block: true, reason: "被用户阻止" };
    }
  });

  // 注册自定义工具
  pi.registerTool({
    name: "greet",
    label: "Greet",
    description: "Enter someone by name",
    parameters: Type.Object({
      name: Type.String({ description: "Name to greet" }),
    }),
    async execute(toolCallId, params, signal, onUpdate, ctx) {
      return {
        content: [{ type: "text", text: `Hello, ${params.name}!` }],
        details: {},
      };
    },
  });

  // 注册命令
  pi.registerCommand("hello", {
    description: "说你好",
    handler: async (args, ctx) => {
      ctx.ui.notify(`Hello ${args || "world"}!`, "info");
    },
  });
}
```

使用 `--extension`（或 `-e`）标志测试：

```bash
pi -e ./my-extension.ts
```

## 扩展位置

> **安全：** 扩展以你的完整系统权限运行，可执行任意代码。仅从可信来源安装。

扩展从以下位置自动发现：

| 位置 | 作用域 |
|----------|-------|
| `~/.pi/agent/extensions/*.ts` | 全局（所有项目） |
| `~/.pi/agent/extensions/*/index.ts` | 全局（子目录） |
| `.pi/extensions/*.ts` | 项目本地 |
| `.pi/extensions/*/index.ts` | 项目本地（子目录） |

通过 `settings.json` 添加额外路径：

```json
{
  "packages": [
    "npm:@foo/bar@1.0.0",
    "git:github.com/user/repo@v1"
  ],
  "extensions": [
    "/path/to/local/extension.ts",
    "/path/to/local/extension/dir"
  ]
}
```

通过 npm 或 git 作为 pi 包分享扩展，参见 [packages.md](packages.md)。

## 可用导入

| 包 | 用途 |
|---------|---------|
| `@earendil-works/pi-coding-agent` | 扩展类型（`ExtensionAPI`、`ExtensionContext`、事件） |
| `typebox` | 工具参数的 Schema 定义 |
| `@earendil-works/pi-ai` | AI 工具（`StringEnum` 用于 Google 兼容枚举） |
| `@earendil-works/pi-tui` | 用于自定义渲染的 TUI 组件 |

npm 依赖也可用。在扩展旁边（或父目录中）添加 `package.json`，运行 `npm install`，来自 `node_modules/` 的导入会自动解析。

对于通过 `pi install`（npm 或 git）分发的 pi 包，运行时依赖必须在 `dependencies` 中。包安装默认使用生产安装（`npm install --omit=dev`），因此 `devDependencies` 在运行时不可用。

Node.js 内置模块（`node:fs`、`node:path` 等）也可用。

## 编写扩展

扩展导出一个接收 `ExtensionAPI` 的默认工厂函数。工厂可以是同步或异步的：

```typescript
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  // 订阅事件
  pi.on("event_name", async (event, ctx) => {
    // ctx.ui 用于用户交互
    const ok = await ctx.ui.confirm("标题", "你确定吗？");
    ctx.ui.notify("完成！", "info");
    ctx.ui.setStatus("my-ext", "处理中...");  // 底部状态
    ctx.ui.setWidget("my-ext", ["Line 1", "Line 2"]);  // 编辑器上方组件（默认）
  });

  // 注册工具、命令、快捷键、标志
  pi.registerTool({ ... });
  pi.registerCommand("name", { ... });
  pi.registerShortcut("ctrl+x", { ... });
  pi.registerFlag("my-flag", { ... });
}
```

扩展通过 [jiti](https://github.com/unjs/jiti) 加载，因此 TypeScript 无需编译即可工作。

如果工厂返回 `Promise`，pi 会等待它完成再继续启动。这意味着异步初始化在 `session_start`、`resources_discover` 和通过 `pi.registerProvider()` 排队的提供商注册之前完成。

### 异步工厂函数

使用 async 工厂进行一次性启动工作，如获取远程配置或动态发现可用模型。

```typescript
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default async function (pi: ExtensionAPI) {
  const response = await fetch("http://localhost:1234/v1/models");
  const payload = (await response.json()) as {
    data: Array<{
      id: string;
      name?: string;
      context_window?: number;
      max_tokens?: number;
    }>;
  };

  pi.registerProvider("local-openai", {
    baseUrl: "http://localhost:1234/v1",
    apiKey: "$LOCAL_OPENAI_API_KEY",
    api: "openai-completions",
    models: payload.data.map((model) => ({
      id: model.id,
      name: model.name ?? model.id,
      reasoning: false,
      input: ["text"],
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      contextWindow: model.context_window ?? 128000,
      maxTokens: model.max_tokens ?? 4096,
    })),
  });
}
```

此模式使得在正常启动和 `pi --list-models` 中获取的模型均可用。

### 扩展风格

**单文件** - 最简单，适用于小型扩展：

```
~/.pi/agent/extensions/
└── my-extension.ts
```

**带 index.ts 的目录** - 适用于多文件扩展：

```
~/.pi/agent/extensions/
└── my-extension/
    ├── index.ts        # 入口点（导出默认函数）
    ├── tools.ts        # 辅助模块
    └── utils.ts        # 辅助模块
```

**带依赖的包** - 适用于需要 npm 包的扩展：

```
~/.pi/agent/extensions/
└── my-extension/
    ├── package.json    # 声明依赖和入口点
    ├── package-lock.json
    ├── node_modules/   # npm install 之后
    └── src/
        └── index.ts
```

## 事件

### 生命周期概览

```
pi starts
  │
  ├─► session_start { reason: "startup" }
  └─► resources_discover { reason: "startup" }
      │
      ▼
user sends prompt ─────────────────────────────────────────┐
  │                                                        │
  ├─► (extension commands checked first, bypass if found)  │
  ├─► input (can intercept, transform, or handle)          │
  ├─► (skill/template expansion if not handled)            │
  ├─► before_agent_start (can inject message, modify system prompt)
  ├─► agent_start                                          │
  ├─► message_start / message_update / message_end         │
  │                                                        │
  │   ┌─── turn (repeats while LLM calls tools) ───┐       │
  │   │                                            │       │
  │   ├─► turn_start                               │       │
  │   ├─► context (can modify messages)            │       │
  │   ├─► before_provider_request                  │       │
  │   ├─► after_provider_response                  │       │
  │   │                                            │       │
  │   │   LLM responds, may call tools:            │       │
  │   │     ├─► tool_execution_start               │       │
  │   │     ├─► tool_call (can block)              │       │
  │   │     ├─► tool_execution_update              │       │
  │   │     ├─► tool_result (can modify)           │       │
  │   │     └─► tool_execution_end                 │       │
  │   │                                            │       │
  │   └─► turn_end                                 │       │
  │                                                        │
  └─► agent_end                                            │
                                                            │
user sends another prompt ◄────────────────────────────────┘
```

### 资源事件

#### resources_discover

在 `session_start` 之后触发，扩展可贡献额外的 skill、prompt 和 theme 路径。启动路径使用 `reason: "startup"`，重载使用 `reason: "reload"`。

### 会话事件

#### session_start

会话启动、加载或重载时触发。`event.reason` 可能为 `"startup"`、`"reload"`、`"new"`、`"resume"`、`"fork"`。

#### session_before_switch

在开始新会话（`/new`）或切换会话（`/resume`）之前触发。可返回 `{ cancel: true }` 取消。

#### session_before_fork

通过 `/fork` 分叉或 `/clone` 克隆时触发。可返回 `{ cancel: true }` 取消。

#### session_before_compact / session_compact

压缩时触发。详见 [compaction.md](compaction.md)。

#### session_before_tree / session_tree

`/tree` 导航时触发。详见 [Sessions](sessions.md)。

#### session_shutdown

扩展运行时被销毁前触发。用于清理、保存状态等。

### Agent 事件

#### before_agent_start

用户提交 prompt 后、agent 循环前触发。可注入消息和/或修改 system prompt。

返回 `{ message, systemPrompt }` 注入持久化消息或替换本轮 system prompt。`systemPromptOptions` 字段让扩展可访问 Pi 用于构建 system prompt 的相同结构化数据。

#### agent_start / agent_end

每次用户 prompt 触发一次。

#### turn_start / turn_end

每轮回合（一次 LLM 响应 + 工具调用）触发一次。

#### message_start / message_update / message_end

消息生命周期更新。`message_end` 处理器可返回 `{ message }` 替换最终化的消息（必须保持相同 `role`）。

#### tool_execution_start / tool_execution_update / tool_execution_end

工具执行生命周期更新。并行工具模式下，`tool_execution_start` 按 assistant 源顺序在预飞行阶段发出，`tool_execution_update` 事件可能跨工具交织，`tool_execution_end` 按工具完成顺序发出。

#### context

每次 LLM 调用前触发。可非破坏性修改消息。

#### before_provider_request / after_provider_response

提供商特定 payload 构建后、请求发送前触发。可用于调试提供商序列化和缓存行为。

### 模型事件

#### model_select

通过 `/model`、模型循环（`Ctrl+P`）或会话恢复更改模型时触发。

#### thinking_level_select

思考级别更改时触发（仅通知）。

### 工具事件

#### tool_call

在 `tool_execution_start` 之后、工具执行之前触发。**可阻止。** `event.input` 可修改以在执​​行前修补工具参数。

使用 `isToolCallEventType` 缩小类型并获取带类型的输入。

#### tool_result

工具执行完成后、`tool_execution_end` 和最终工具结果消息事件之前触发。**可修改结果。** 处理器像中间件一样链式调用。

### User Bash 事件

#### user_bash

用户执行 `!` 或 `!!` 命令时触发。**可拦截。** 可提供自定义操作、包装 pi 的内置本地 bash 后端，或直接返回全量替换结果。

### Input 事件

#### input

用户输入接收后触发（在检查扩展命令之后，但在 skill 和模板展开之前）。处理顺序：
1. 先检查扩展命令（`/cmd`）
2. `input` 事件触发
3. 如未处理：skill 命令（`/skill:name`）展开
4. 如未处理：提示模板（`/template`）展开
5. Agent 处理开始

返回值：`continue`（继续）、`transform`（修改后继续）、`handled`（跳过 agent）。

## ExtensionContext

所有处理器接收 `ctx: ExtensionContext`。

### ctx.ui

用户交互的 UI 方法。

### ctx.hasUI

在 print 模式（`-p`）和 JSON 模式下为 `false`。交互模式和 RPC 模式下为 `true`。

### ctx.cwd

当前工作目录。

### ctx.sessionManager

会话状态的只读访问。

### ctx.modelRegistry / ctx.model

访问模型和 API keys。

### ctx.signal

当前 agent abort 信号，无活跃 agent turn 时为 `undefined`。

### ctx.isIdle() / ctx.abort() / ctx.hasPendingMessages()

控制流辅助方法。

### ctx.shutdown()

请求 pi 优雅关闭。

### ctx.getContextUsage()

返回活动模型的当前上下文用量。

### ctx.compact()

触发压缩而不等待完成。

### ctx.getSystemPrompt()

返回 Pi 的当前 system prompt 字符串。

## ExtensionCommandContext

命令处理器接收 `ExtensionCommandContext`，扩展了 `ExtensionContext` 并增加了会话控制方法。

### ctx.waitForIdle()

等待 agent 完成流式传输。

### ctx.newSession(options?)

创建新会话。

### ctx.fork(entryId, options?)

从特定条目分叉，创建新会话文件。`position` 选项：`"before"`（默认，在选定的用户消息之前分叉）或 `"at"`（复制通过选定条目的活动路径）。

### ctx.navigateTree(targetId, options?)

导航到会话树中的不同点。

### ctx.switchSession(sessionPath, options?)

切换到不同的会话文件。

### ctx.reload()

运行与 `/reload` 相同的重载流程。

## ExtensionAPI 方法

### pi.on(event, handler)

订阅事件。

### pi.registerTool(definition)

注册 LLM 可调用的自定义工具。在扩展加载期间和启动后均可使用。

### pi.sendMessage(message, options?)

向会话注入自定义消息。`deliverAs` 选项：`"steer"`（默认）、`"followUp"`、`"nextTurn"`。`triggerTurn: true` 在 agent 空闲时立即触发 LLM 响应。

### pi.sendUserMessage(content, options?)

向 agent 发送用户消息，与 `sendMessage()` 不同，它发送的是看起来像用户输入的真正用户消息。始终触发 turn。

### pi.appendEntry(customType, data?)

持久化扩展状态（不参与 LLM 上下文）。

### pi.setSessionName(name) / pi.getSessionName()

设置/获取会话显示名称。

### pi.setLabel(entryId, label)

在条目上设置或清除标签。

### pi.registerCommand(name, options)

注册命令。如果多个扩展注册相同命令名，pi 保留所有并分配数字调用后缀。

### pi.getCommands()

获取当前会话中可通过 `prompt` 调用的斜杠命令。

### pi.registerMessageRenderer(customType, renderer)

为你的 `customType` 注册自定义 TUI 渲染器。

### pi.registerShortcut(shortcut, options)

注册键盘快捷键。

### pi.registerFlag(name, options)

注册 CLI 标志。

### pi.exec(command, args, options?)

执行 shell 命令。

### pi.getActiveTools() / pi.getAllTools() / pi.setActiveTools(names)

管理活动工具。适用于内置工具和动态注册的工具。

### pi.setModel(model)

设置当前模型。如果模型没有 API key 则返回 `false`。

### pi.getThinkingLevel() / pi.setThinkingLevel(level)

获取或设置思考级别。级别受模型能力钳制。

### pi.events

扩展间通信的共享事件总线。

### pi.registerProvider(name, config)

注册或覆盖模型提供商。用于代理、自定义端点或团队级模型配置。

### pi.unregisterProvider(name)

移除先前注册的提供商及其模型。

## 状态管理

有状态的扩展应将状态存储在工具结果的 `details` 中，以获得正确的分支支持。在 `session_start` 中从会话重建状态。

## 自定义工具

通过 `pi.registerTool()` 注册 LLM 可调用的工具。工具出现在 system prompt 中，可自定义渲染。

使用 `promptSnippet` 在默认 system prompt 的 `Available tools` 部分包含简短的单行条目。如省略，自定义工具不会出现在该部分。

使用 `promptGuidelines` 向默认 system prompt 的 `Guidelines` 部分添加工具特定的条目。这些条目仅在工具激活时包含。

**重要：** `promptGuidelines` 条目无工具名前缀或分组地追加到 `Guidelines` 部分。每个条目必须指明其引用的工具。例如使用 "Use my_tool when..." 而非 "Use this tool when..."。

如果你的自定义工具修改文件，使用 `withFileMutationQueue()` 使其参与与内置 `edit` 和 `write` 相同的按文件队列。

### 工具定义

```typescript
import { Type } from "typebox";
import { StringEnum } from "@earendil-works/pi-ai";

pi.registerTool({
  name: "my_tool",
  label: "My Tool",
  description: "工具的功能（显示给 LLM）",
  promptSnippet: "List or add items in the project todo list",
  promptGuidelines: [
    "Use my_tool for todo planning instead of direct file edits when the user asks for a task list."
  ],
  parameters: Type.Object({
    action: StringEnum(["list", "add"] as const),
    text: Type.Optional(Type.String()),
  }),
  prepareArguments(args) {
    // 可选的兼容性 shim。在 schema 验证之前运行。
    // 返回当前 schema 形状，用于折叠旧字段到现代参数对象中。
    return args;
  },
  async execute(toolCallId, params, signal, onUpdate, ctx) {
    // 流式进度更新
    onUpdate?.({ content: [{ type: "text", text: "Working..." }] });

    return {
      content: [{ type: "text", text: "Done" }],
      details: { result: "..." },
      terminate: true,  // 可选：跳过后续 LLM 调用
    };
  },
  renderCall(args, theme, context) { ... },
  renderResult(result, options, theme, context) { ... },
});
```

**错误信号：** 从 `execute` 中抛出错误标记工具执行为失败。返回值不会设置错误标志。

**重要：** 对字符串枚举使用 `@earendil-works/pi-ai` 的 `StringEnum`。`Type.Union`/`Type.Literal` 不兼容 Google 的 API。

**参数准备：** `prepareArguments(args)` 是可选的。如果定义，在 schema 验证之前和 `execute()` 之前运行。用于模拟旧的输入形状。

### 覆盖内置工具

扩展可以通过注册同名工具来覆盖内置工具（`read`、`bash`、`edit`、`write`、`grep`、`find`、`ls`）。交互模式会显示警告。

渲染继承按槽位解析。执行覆盖和渲染覆盖是独立的。省略 `renderCall` 时使用内置 `renderCall`，省略 `renderResult` 时使用内置 `renderResult`。

### 远程执行

内置工具支持可插拔的操作接口，用于委派到远程系统（SSH、容器等）。bash 工具还支持 spawn hook 来在执行前调整命令、cwd 或 env。

### 输出截断

**工具必须截断其输出**以避免淹没 LLM 上下文。内置限制为 **50KB**（约 10k token）和 **2000 行**，以先达到的为准。

使用 `truncateHead`（用于文件读取、搜索结果）、`truncateTail`（用于日志、命令输出）、`truncateLine` 和 `formatSize`。

### 多工具

一个扩展可以注册多个共享状态的工具。

### 自定义渲染

工具可以提供 `renderCall` 和 `renderResult` 用于自定义 TUI 显示。

`renderShell: "self"` 用于工具自行渲染外壳而非默认的 Box。

使用 `keyHint()` 显示尊重活动快捷键配置的快捷键提示。使用命名空间的 keybinding id（`app.*` 和 `tui.*` 命名空间）。

最佳实践：使用 `(0, 0)` padding 的 `Text`、处理 `isPartial` 用于流式进度、支持 `expanded` 用于按需详情、仅当默认外壳碍事时才使用 `renderShell: "self"`。

## 自定义 UI

扩展可通过 `ctx.ui` 方法与用户交互并自定义消息/工具的渲染。

### 对话框

```typescript
const choice = await ctx.ui.select("选择一个：", ["A", "B", "C"]);
const ok = await ctx.ui.confirm("删除？", "此操作不可撤销");
const name = await ctx.ui.input("名称：", "占位符");
const text = await ctx.ui.editor("编辑：", "预填文本");
ctx.ui.notify("完成！", "info");  // "info" | "warning" | "error"
```

对话框支持 `timeout` 选项和 `AbortSignal`。

### Widgets、Status 和 Footer

- `ctx.ui.setStatus(id, text)` — 底部状态
- `ctx.ui.setWorkingMessage(text)` / `setWorkingVisible(show)` / `setWorkingIndicator(config)` — 工作加载器
- `ctx.ui.setWidget(id, content, options?)` — 编辑器上方/下方组件
- `ctx.ui.setFooter(factory)` — 自定义底部栏
- `ctx.ui.setTitle(text)` — 终端标题
- `ctx.ui.setEditorText(text)` / `getEditorText()` — 编辑器文本
- `ctx.ui.pasteToEditor(content)` — 粘贴到编辑器
- `ctx.ui.setTheme(name)` / `getTheme(name)` — 主题管理
- `ctx.ui.getToolsExpanded()` / `setToolsExpanded(expanded)` — 工具输出展开
- `ctx.ui.setEditorComponent(factory)` — 自定义编辑器
- `ctx.ui.addAutocompleteProvider(provider)` — 自动补全提供者

### 自定义组件

对于复杂 UI，使用 `ctx.ui.custom()`。这会临时用你的组件替换编辑器。支持叠加模式（`{ overlay: true }`）。

### 消息渲染

注册自定义消息类型的渲染器。使用 `pi.sendMessage()` 发送这些消息。

### 主题颜色

所有渲染函数接收 `theme` 对象，提供前景色、文本样式和语法高亮功能。

## 错误处理

- 扩展错误被记录，agent 继续运行
- `tool_call` 错误阻止工具（fail-safe）
- 工具 `execute` 错误必须通过抛出信号化；捕获的错误报告给 LLM，`isError: true`

## 模式行为

| 模式 | UI 方法 | 说明 |
|------|-----------|-------|
| Interactive | 完整 TUI | 正常操作 |
| RPC (`--mode rpc`) | JSON 协议 | 主机处理 UI，详见 [rpc.md](rpc.md) |
| JSON (`--mode json`) | 无操作 | 事件流到 stdout，详见 [json.md](json.md) |
| Print (`-p`) | 无操作 | 扩展运行但不能提示 |

在非交互模式下，使用 UI 方法前检查 `ctx.hasUI`。

## 示例参考

所有示例在 [examples/extensions/](../examples/extensions/)。

| 示例 | 描述 | 关键 API |
|---------|-------------|----------|
| **工具** |||
| `hello.ts` | 最小工具注册 | `registerTool` |
| `question.ts` | 带用户交互的工具 | `registerTool`、`ui.select` |
| `questionnaire.ts` | 多步骤向导工具 | `registerTool`、`ui.custom` |
| `todo.ts` | 带持久化的有状态工具 | `registerTool`、`appendEntry`、`renderResult`、session events |
| `dynamic-tools.ts` | 启动后和命令期间注册工具 | `registerTool`、`session_start`、`registerCommand` |
| `structured-output.ts` | 带 `terminate: true` 的最终结构化输出工具 | `registerTool`、terminating tool results |
| `truncated-tool.ts` | 输出截断示例 | `registerTool`、`truncateHead` |
| `tool-override.ts` | 覆盖内置 read 工具 | `registerTool`（与内置同名） |
| **命令** |||
| `pirate.ts` | 按轮修改 system prompt | `registerCommand`、`before_agent_start` |
| `summarize.ts` | 对话摘要命令 | `registerCommand`、`ui.custom` |
| `handoff.ts` | 跨提供商模型切换 | `registerCommand`、`ui.editor`、`ui.custom` |
| `qna.ts` | 自定义 UI 问答 | `registerCommand`、`ui.custom`、`setEditorText` |
| `send-user-message.ts` | 注入用户消息 | `registerCommand`、`sendUserMessage` |
| `reload-runtime.ts` | 重载命令和 LLM 工具切换 | `registerCommand`、`ctx.reload()`、`sendUserMessage` |
| `shutdown-command.ts` | 优雅关闭命令 | `registerCommand`、`shutdown()` |
| **事件与门控** |||
| `permission-gate.ts` | 阻止危险命令 | `on("tool_call")`、`ui.confirm` |
| `protected-paths.ts` | 阻止写入特定路径 | `on("tool_call")` |
| `confirm-destructive.ts` | 确认会话更改 | `on("session_before_switch")`、`on("session_before_fork")` |
| `dirty-repo-guard.ts` | 脏 git 仓库警告 | `on("session_before_*")`、`exec` |
| `input-transform.ts` | 转换用户输入 | `on("input")` |
| `input-transform-streaming.ts` | 流式感知输入转换 | `on("input")`、`streamingBehavior` |
| `model-status.ts` | 响应模型更改 | `on("model_select")`、`setStatus` |
| `provider-payload.ts` | 检查 payload 和提供商响应头 | `on("before_provider_request")`、`on("after_provider_response")` |
| `claude-rules.ts` | 从文件加载规则 | `on("session_start")`、`on("before_agent_start")` |
| `prompt-customizer.ts` | 使用 `systemPromptOptions` 添加上下文感知的工具指导 | `on("before_agent_start")`、`BuildSystemPromptOptions` |
| **压缩与会话** |||
| `custom-compaction.ts` | 自定义压缩摘要 | `on("session_before_compact")` |
| `trigger-compact.ts` | 手动触发压缩 | `compact()` |
| `git-checkpoint.ts` | 每轮回合 Git stash | `on("turn_start")`、`on("session_before_fork")`、`exec` |
| `git-merge-and-resolve.ts` | 获取、合并和解决冲突 | `on("agent_end")`、`exec`、`sendUserMessage` |
| `auto-commit-on-exit.ts` | 关闭时提交 | `on("session_shutdown")`、`exec` |
| **UI 组件** |||
| `status-line.ts` | 底部状态指示器 | `setStatus`、session events |
| `working-indicator.ts` | 自定义流式工作指示器 | `setWorkingIndicator`、`registerCommand` |
| `github-issue-autocomplete.ts` | 在内置自动补全之上添加 `#1234` issue 补全 | `addAutocompleteProvider`、`on("session_start")`、`exec` |
| `custom-footer.ts` | 完全替换底部栏 | `registerCommand`、`setFooter` |
| `custom-header.ts` | 替换启动头部 | `on("session_start")`、`setHeader` |
| `modal-editor.ts` | Vim 风格的模态编辑器 | `setEditorComponent`、`CustomEditor` |
| `widget-placement.ts` | 编辑器上方/下方组件 | `setWidget` |
| `timed-confirm.ts` | 带超时的对话框 | `ui.confirm`（timeout/signal） |
| `mac-system-theme.ts` | 自动切换主题 | `setTheme`、`exec` |
| **复杂扩展** |||
| `plan-mode/` | 完整 plan 模式实现 | 所有事件类型、`registerCommand`、`registerShortcut`、`registerFlag`、`setStatus`、`setWidget`、`sendMessage`、`setActiveTools` |
| `preset.ts` | 可保存的预设 | `registerCommand`、`registerShortcut`、`registerFlag`、`setModel`、`setActiveTools`、`setThinkingLevel`、`appendEntry` |
| **远程与沙箱** |||
| `ssh.ts` | SSH 远程执行 | `registerFlag`、`on("user_bash")`、`on("before_agent_start")`、tool operations |
| `sandbox/` | 沙箱化工具执行 | Tool operations |
| `subagent/` | 生成子 agent | `registerTool`、`exec` |
| **游戏** |||
| `snake.ts` | 贪吃蛇 | `registerCommand`、`ui.custom`、keyboard handling |
| `space-invaders.ts` | 太空入侵者 | `registerCommand`、`ui.custom` |
| **提供商** |||
| `custom-provider-anthropic/` | 自定义 Anthropic 代理 | `registerProvider` |
| `custom-provider-gitlab-duo/` | GitLab Duo 集成 | `registerProvider`（OAuth） |
| **消息与通信** |||
| `message-renderer.ts` | 自定义消息渲染 | `registerMessageRenderer`、`sendMessage` |
| `event-bus.ts` | 扩展间事件 | `pi.events` |
| **会话元数据** |||
| `session-name.ts` | 为选择器命名会话 | `setSessionName`、`getSessionName` |
| `bookmark.ts` | 为 /tree 书签条目 | `setLabel` |

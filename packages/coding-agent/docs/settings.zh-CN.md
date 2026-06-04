# 设置

Pi 使用 JSON 设置文件，项目设置覆盖全局设置。

| 位置 | 作用域 |
|----------|-------|
| `~/.pi/agent/settings.json` | 全局（所有项目） |
| `.pi/settings.json` | 项目（当前目录） |

可直接编辑或使用 `/settings` 设置常用选项。

## 所有设置

### 模型与思考

| 设置 | 类型 | 默认值 | 描述 |
|---------|------|---------|-------------|
| `defaultProvider` | string | - | 默认提供商（如 `"anthropic"`、`"openai"`） |
| `defaultModel` | string | - | 默认模型 ID |
| `defaultThinkingLevel` | string | - | `"off"`、`"minimal"`、`"low"`、`"medium"`、`"high"`、`"xhigh"` |
| `hideThinkingBlock` | boolean | `false` | 在输出中隐藏思考块 |
| `thinkingBudgets` | object | - | 每个思考级别的自定义 token 预算 |

#### thinkingBudgets

```json
{
  "thinkingBudgets": {
    "minimal": 1024,
    "low": 4096,
    "medium": 10240,
    "high": 32768
  }
}
```

### UI 与显示

| 设置 | 类型 | 默认值 | 描述 |
|---------|------|---------|-------------|
| `theme` | string | `"dark"` | 主题名称（`"dark"`、`"light"` 或自定义） |
| `quietStartup` | boolean | `false` | 隐藏启动头部 |
| `collapseChangelog` | boolean | `false` | 更新后显示简略 changelog |
| `enableInstallTelemetry` | boolean | `true` | 首次安装或检测到 changelog 更新后发送匿名安装/更新版本 ping。此设置不控制更新检查 |
| `doubleEscapeAction` | string | `"tree"` | 双 Esc 操作：`"tree"`、`"fork"` 或 `"none"` |
| `treeFilterMode` | string | `"default"` | `/tree` 的默认过滤器：`"default"`、`"no-tools"`、`"user-only"`、`"labeled-only"`、`"all"` |
| `editorPaddingX` | number | `0` | 输入编辑器的水平内边距（0-3） |
| `autocompleteMaxVisible` | number | `5` | 自动补全下拉框最大可见项数（3-20） |
| `showHardwareCursor` | boolean | `false` | 在 TUI 定位光标时显示终端光标以支持输入法 |

### 遥测和更新检查

`enableInstallTelemetry` 仅控制发往 `https://pi.dev/api/report-install` 的匿名安装/更新 ping。退出遥测不禁用更新检查；Pi 仍可请求 `https://pi.dev/api/latest-version` 来查找最新版本。

设置 `PI_SKIP_VERSION_CHECK=1` 禁用 Pi 版本更新检查。使用 `--offline` 或 `PI_OFFLINE=1` 禁用此处描述的所有启动时网络操作，包括更新检查、包更新检查和安装/更新遥测。

### 警告

| 设置 | 类型 | 默认值 | 描述 |
|---------|------|---------|-------------|
| `warnings.anthropicExtraUsage` | boolean | `true` | 当 Anthropic 订阅认证可能使用付费额外用量时显示警告 |

```json
{
  "warnings": {
    "anthropicExtraUsage": false
  }
}
```

### 上下文压缩

| 设置 | 类型 | 默认值 | 描述 |
|---------|------|---------|-------------|
| `compaction.enabled` | boolean | `true` | 启用自动上下文压缩 |
| `compaction.reserveTokens` | number | `16384` | 为 LLM 回复保留的 token 数 |
| `compaction.keepRecentTokens` | number | `20000` | 保留的近期 token 数（不被摘要） |

```json
{
  "compaction": {
    "enabled": true,
    "reserveTokens": 16384,
    "keepRecentTokens": 20000
  }
}
```

### 分支摘要

| 设置 | 类型 | 默认值 | 描述 |
|---------|------|---------|-------------|
| `branchSummary.reserveTokens` | number | `16384` | 为分支摘要保留的 token 数 |
| `branchSummary.skipPrompt` | boolean | `false` | 跳过 `/tree` 导航时的 "Summarize branch?" 提示（默认不摘要） |

### 重试

| 设置 | 类型 | 默认值 | 描述 |
|---------|------|---------|-------------|
| `retry.enabled` | boolean | `true` | 在瞬时错误时启用 agent 级别的自动重试 |
| `retry.maxRetries` | number | `3` | agent 级别的最大重试次数 |
| `retry.baseDelayMs` | number | `2000` | agent 级别指数退避的基础延迟（2s、4s、8s） |
| `retry.provider.timeoutMs` | number | SDK 默认 | 提供商/SDK 请求超时时间（毫秒） |
| `retry.provider.maxRetries` | number | `0` | 提供商/SDK 重试次数 |
| `retry.provider.maxRetryDelayMs` | number | `60000` | 服务器请求延迟的最大等待时间（60s） |

当提供商请求的重试延迟超过 `retry.provider.maxRetryDelayMs`（例如 Google 的"配额将在 5 小时后重置"），请求立即失败并显示信息性错误，而非静默等待。设为 `0` 禁用此上限。

将 `retry.provider.maxRetries` 保持为 `0`，除非明确需要提供商级别的重试。设为大于 `0` 可能导致 SDK/提供商重试在 Pi 察觉到之前处理超出使用限制的错误，在某些情况下可能阻塞 agent 直到提供商配额重置。

```json
{
  "retry": {
    "enabled": true,
    "maxRetries": 3,
    "baseDelayMs": 2000,
    "provider": {
      "timeoutMs": 3600000,
      "maxRetries": 0,
      "maxRetryDelayMs": 60000
    }
  }
}
```

### 消息投递

| 设置 | 类型 | 默认值 | 描述 |
|---------|------|---------|-------------|
| `steeringMode` | string | `"one-at-a-time"` | 引导消息的发送方式：`"all"` 或 `"one-at-a-time"` |
| `followUpMode` | string | `"one-at-a-time"` | 跟进消息的发送方式：`"all"` 或 `"one-at-a-time"` |
| `transport` | string | `"auto"` | 支持多种传输方式的提供商的首选传输：`"sse"`、`"websocket"`、`"websocket-cached"` 或 `"auto"` |
| `httpIdleTimeoutMs` | number | `300000` | HTTP header/body 空闲超时时间（毫秒），也用于具有显式流空闲超时的提供商。设为 `0` 禁用。 |
| `websocketConnectTimeoutMs` | number | `15000` | 支持 WebSocket 传输的提供商的 WebSocket 连接/打开握手超时时间（毫秒）。设为 `0` 禁用。 |

### 终端与图片

| 设置 | 类型 | 默认值 | 描述 |
|---------|------|---------|-------------|
| `terminal.showImages` | boolean | `true` | 在终端中显示图片（如果支持） |
| `terminal.imageWidthCells` | number | `60` | 终端内图片的首选宽度（以终端单元格计） |
| `terminal.clearOnShrink` | boolean | `false` | 当内容缩小时清除空行（可能导致闪烁） |
| `images.autoResize` | boolean | `true` | 将图片缩放至最大 2000x2000 |
| `images.blockImages` | boolean | `false` | 阻止所有图片发送给 LLM |

### Shell

| 设置 | 类型 | 默认值 | 描述 |
|---------|------|---------|-------------|
| `shellPath` | string | - | 自定义 Shell 路径（例如 Windows 上的 Cygwin） |
| `shellCommandPrefix` | string | - | 每个 bash 命令的前缀（如 `"shopt -s expand_aliases"`） |
| `npmCommand` | string[] | - | 用于 npm 包查找/安装操作的命令 argv（如 `["mise", "exec", "node@20", "--", "npm"]`） |

```json
{
  "npmCommand": ["mise", "exec", "node@20", "--", "npm"]
}
```

`npmCommand` 用于所有 npm 包管理操作，包括安装、卸载和 git 包内的依赖安装。用户作用域的 npm 包安装在 `~/.pi/agent/npm/` 下；项目作用域的 npm 包安装在 `.pi/npm/` 下。使用 argv 风格的条目，完全按照进程启动的方式。当配置了 `npmCommand` 时，git 包依赖安装使用纯 `install` 以避免包装器或替代包管理器中的 npm 特定标志。

### 会话

| 设置 | 类型 | 默认值 | 描述 |
|---------|------|---------|-------------|
| `sessionDir` | string | - | 会话文件存储目录。支持绝对或相对路径，以及 `~`。 |

```json
{ "sessionDir": ".pi/sessions" }
```

当多个来源指定会话目录时，优先级为 `--session-dir`、`PI_CODING_AGENT_SESSION_DIR`，然后是 settings.json 中的 `sessionDir`。

### 模型循环

| 设置 | 类型 | 默认值 | 描述 |
|---------|------|---------|-------------|
| `enabledModels` | string[] | - | Ctrl+P 循环切换的模型模式（与 `--models` CLI 选项格式相同） |

```json
{
  "enabledModels": ["claude-*", "gpt-4o", "gemini-2*"]
}
```

### Markdown

| 设置 | 类型 | 默认值 | 描述 |
|---------|------|---------|-------------|
| `markdown.codeBlockIndent` | string | `"  "` | 代码块的缩进 |

### 资源

这些设置定义从哪里加载扩展、Skills、提示和主题。

`~/.pi/agent/settings.json` 中的路径相对 `~/.pi/agent` 解析。`.pi/settings.json` 中的路径相对 `.pi` 解析。支持绝对路径和 `~`。

| 设置 | 类型 | 默认值 | 描述 |
|---------|------|---------|-------------|
| `packages` | array | `[]` | 从 npm/git 包中加载资源 |
| `extensions` | string[] | `[]` | 本地扩展文件路径或目录 |
| `skills` | string[] | `[]` | 本地 Skill 文件路径或目录 |
| `prompts` | string[] | `[]` | 本地提示模板路径或目录 |
| `themes` | string[] | `[]` | 本地主题文件路径或目录 |
| `enableSkillCommands` | boolean | `true` | 将 Skills 注册为 `/skill:name` 命令 |

数组支持 glob 模式和排除。使用 `!pattern` 排除。使用 `+path` 强制包含精确路径，`-path` 强制排除精确路径。

#### packages

字符串形式从包中加载所有资源：

```json
{
  "packages": ["pi-skills", "@org/my-extension"]
}
```

对象形式筛选要加载的资源：

```json
{
  "packages": [
    {
      "source": "pi-skills",
      "skills": ["brave-search", "transcribe"],
      "extensions": []
    }
  ]
}
```

包管理详情参见 [packages.md](packages.md)。

## 示例

```json
{
  "defaultProvider": "anthropic",
  "defaultModel": "claude-sonnet-4-20250514",
  "defaultThinkingLevel": "medium",
  "theme": "dark",
  "compaction": {
    "enabled": true,
    "reserveTokens": 16384,
    "keepRecentTokens": 20000
  },
  "retry": {
    "enabled": true,
    "maxRetries": 3
  },
  "enabledModels": ["claude-*", "gpt-4o"],
  "warnings": {
    "anthropicExtraUsage": true
  },
  "packages": ["pi-skills"]
}
```

## 项目覆盖

项目设置（`.pi/settings.json`）覆盖全局设置。嵌套对象会合并：

```json
// ~/.pi/agent/settings.json（全局）
{
  "theme": "dark",
  "compaction": { "enabled": true, "reserveTokens": 16384 }
}

// .pi/settings.json（项目）
{
  "compaction": { "reserveTokens": 8192 }
}

// 结果
{
  "theme": "dark",
  "compaction": { "enabled": true, "reserveTokens": 8192 }
}
```

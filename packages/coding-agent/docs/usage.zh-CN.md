# 使用 Pi

本页收集不适合放在快速开始页面中的日常使用细节。

## 交互模式

<p align="center"><img src="images/interactive-mode.png" alt="交互模式" width="600"></p>

界面有四个主要区域：

- **启动头部** - 快捷键、已加载的上下文文件、提示模板、Skills 和扩展
- **消息区** - 用户消息、助手回复、工具调用、工具结果、通知、错误以及扩展 UI
- **编辑器** - 输入区域；边框颜色表示当前思考深度
- **底部栏** - 工作目录、会话名称、token/缓存使用量、费用、上下文使用量和当前模型

编辑器可被内置 UI（如 `/settings`）或自定义扩展 UI 临时替换。

### 编辑器功能

| 功能 | 操作方式 |
|---------|-----|
| 文件引用 | 输入 `@` 模糊搜索项目文件 |
| 路径补全 | 按 Tab 补全路径 |
| 多行输入 | Shift+Enter，在 Windows Terminal 上为 Ctrl+Enter |
| 图片 | 按 Ctrl+V 粘贴（Windows 上为 Alt+V），或拖入终端 |
| Shell 命令 | `!command` 运行命令并将输出发送给模型 |
| 隐藏 Shell 命令 | `!!command` 运行命令但不将输出发送给模型 |
| 外部编辑器 | Ctrl+G 打开 `$VISUAL` 或 `$EDITOR` |

所有快捷键和自定义参见[快捷键](keybindings.zh-CN.md)。

## 斜杠命令

在编辑器中输入 `/` 打开命令补全。扩展可以注册自定义命令，Skills 可通过 `/skill:name` 使用，提示模板可通过 `/模板名` 展开。

| 命令 | 描述 |
|---------|-------------|
| `/login`、`/logout` | 管理 OAuth 或 API key 凭据 |
| `/model` | 切换模型 |
| `/scoped-models` | 启用/禁用 Ctrl+P 循环切换的模型 |
| `/settings` | 思考深度、主题、消息投递、传输方式 |
| `/resume` | 从之前的会话中选择 |
| `/new` | 开始新会话 |
| `/name <name>` | 设置会话显示名称 |
| `/session` | 显示会话文件、ID、消息数、token 和费用 |
| `/tree` | 跳转到会话中的任意节点并从那里继续 |
| `/fork` | 从之前的用户消息分叉出新会话 |
| `/clone` | 将当前活跃分支复制到新会话文件 |
| `/compact [prompt]` | 手动压缩上下文，可选附带自定义指令 |
| `/copy` | 将最后一条助手消息复制到剪贴板 |
| `/export [file]` | 将会话导出为 HTML |
| `/share` | 上传为私有 GitHub gist 并提供可分享的 HTML 链接 |
| `/reload` | 重新加载快捷键、扩展、Skills、提示和上下文文件 |
| `/hotkeys` | 显示所有键盘快捷键 |
| `/changelog` | 显示版本历史 |
| `/quit` | 退出 pi |

## 消息队列

你可以在 agent 仍在工作时提交消息：

- **Enter** 将消息排入引导队列，在当前助手回合完成工具调用后投递。
- **Alt+Enter** 将消息排入跟进队列，在 agent 完成所有工作后投递。
- **Escape** 中止并恢复队列中的消息到编辑器。
- **Alt+Up** 将队列中的消息取回编辑器。

在 Windows Terminal 上，Alt+Enter 默认为全屏。如需 pi 接收该快捷键，请按[终端设置](terminal-setup.md)中的说明重新映射。

在[设置](settings.zh-CN.md)中通过 `steeringMode` 和 `followUpMode` 配置投递方式。

## 会话

会话自动保存到 `~/.pi/agent/sessions/`，按工作目录组织。

```bash
pi -c                  # 继续最近的会话
pi -r                  # 浏览并选择会话
pi --no-session        # 临时模式；不保存
pi --name "my task"    # 在启动时设置会话显示名称
pi --session <path|id> # 使用特定会话文件或会话 ID
pi --fork <path|id>    # 将会话分叉到新会话文件
```

有用的会话命令：

- `/session` 显示当前会话文件和 ID。
- `/tree` 导航文件内会话树并可摘要废弃分支。
- `/fork` 从之前的用户消息创建新会话。
- `/clone` 将当前活跃分支复制到新会话文件。
- `/compact` 摘要较旧消息以释放上下文空间。

详见[会话](sessions.md)和[上下文压缩](compaction.md)。

## 上下文文件

Pi 在启动时从以下位置加载 `AGENTS.md` 或 `CLAUDE.md`：

- `~/.pi/agent/AGENTS.md` 作为全局说明
- 从当前工作目录向上的父目录
- 当前目录

使用上下文文件来定义项目规范、命令、安全规则和偏好。使用 `--no-context-files` 或 `-nc` 禁用加载。

### System Prompt 文件

替换默认 system prompt：

- `.pi/SYSTEM.md` 用于项目
- `~/.pi/agent/SYSTEM.md` 全局

在上述任一位置使用 `APPEND_SYSTEM.md` 可在不替换默认 prompt 的情况下追加内容。

## 导出和分享会话

使用 `/export [file]` 将会话写入 HTML 文件。

使用 `/share` 上传私有 GitHub gist 并提供可分享的 HTML 链接。

如果你将 pi 用于开源工作，并希望发布会话供模型、prompt、工具和评估研究使用，参见 [`badlogic/pi-share-hf`](https://github.com/badlogic/pi-share-hf)。它会将会话发布到 Hugging Face 数据集。

## CLI 参考

```bash
pi [options] [@files...] [messages...]
```

### 包命令

```bash
pi install <source> [-l]     # 安装包，-l 用于项目本地安装
pi remove <source> [-l]      # 移除包
pi uninstall <source> [-l]   # remove 的别名
pi update [source|self|pi]   # 更新 pi 和包；同步固定的 git refs
pi update --extensions       # 仅更新包；同步固定的 git refs
pi update --self             # 仅更新 pi
pi update --extension <src>  # 更新单个包
pi list                      # 列出已安装的包
pi config                    # 启用/禁用包资源
```

这些命令管理 pi 包，而非 pi CLI 的安装。卸载 pi 自身参见[快速开始](quickstart.zh-CN.md#卸载)。

详见 [Pi 包](packages.md)了解包来源和安全注意事项。

### 模式

| 选项 | 描述 |
|------|-------------|
| 默认 | 交互模式 |
| `-p`、`--print` | 输出回复后退出 |
| `--mode json` | 将所有事件作为 JSON 行输出；参见 [JSON 模式](json.md) |
| `--mode rpc` | 通过 stdin/stdout 的 RPC 模式；参见 [RPC 模式](rpc.md) |
| `--export <in> [out]` | 将会话导出为 HTML |

在 print 模式下，pi 也会读取管道 stdin 并将其合并到初始 prompt 中：

```bash
cat README.md | pi -p "总结这段文字"
```

### 模型选项

| 选项 | 描述 |
|--------|-------------|
| `--provider <name>` | 提供商，如 `anthropic`、`openai` 或 `google` |
| `--model <pattern>` | 模型模式或 ID；支持 `provider/id` 和可选的 `:<thinking>` |
| `--api-key <key>` | API key，覆盖环境变量 |
| `--thinking <level>` | `off`、`minimal`、`low`、`medium`、`high`、`xhigh` |
| `--models <patterns>` | 逗号分隔的模式，用于 Ctrl+P 循环切换 |
| `--list-models [search]` | 列出可用模型 |

### 会话选项

| 选项 | 描述 |
|--------|-------------|
| `-c`、`--continue` | 继续最近的会话 |
| `-r`、`--resume` | 浏览并选择会话 |
| `--session <path\|id>` | 使用特定会话文件或部分 UUID |
| `--fork <path\|id>` | 将会话文件或部分 UUID 分叉到新会话 |
| `--session-dir <dir>` | 自定义会话存储目录 |
| `--no-session` | 临时模式；不保存 |
| `--name <name>`、`-n <name>` | 在启动时设置会话显示名称 |

### 工具选项

| 选项 | 描述 |
|--------|-------------|
| `--tools <list>`、`-t <list>` | 允许列表指定内置、扩展和自定义工具 |
| `--exclude-tools <list>`、`-xt <list>` | 禁用特定内置、扩展和自定义工具 |
| `--no-builtin-tools`、`-nbt` | 禁用内置工具但保留扩展/自定义工具可用 |
| `--no-tools`、`-nt` | 禁用所有工具 |

内置工具：`read`、`bash`、`edit`、`write`、`grep`、`find`、`ls`。

### 资源选项

| 选项 | 描述 |
|--------|-------------|
| `-e`、`--extension <source>` | 从路径、npm 或 git 加载扩展；可多次使用 |
| `--no-extensions` | 禁用扩展发现 |
| `--skill <path>` | 加载 Skill；可多次使用 |
| `--no-skills` | 禁用 Skill 发现 |
| `--prompt-template <path>` | 加载提示模板；可多次使用 |
| `--no-prompt-templates` | 禁用提示模板发现 |
| `--theme <path>` | 加载主题；可多次使用 |
| `--no-themes` | 禁用主题发现 |
| `--no-context-files`、`-nc` | 禁用 `AGENTS.md` 和 `CLAUDE.md` 发现 |

将 `--no-*` 与显式选项结合使用，可忽略设置中定义的资源，仅加载精确指定的内容。示例：

```bash
pi --no-extensions -e ./my-extension.ts
```

### 其他选项

| 选项 | 描述 |
|--------|-------------|
| `--system-prompt <text>` | 替换默认 prompt；上下文文件和 Skills 仍会追加 |
| `--append-system-prompt <text>` | 追加到 system prompt |
| `--verbose` | 强制显示详细启动信息 |
| `-h`、`--help` | 显示帮助 |
| `-v`、`--version` | 显示版本 |

### 文件参数

使用 `@` 前缀将文件包含在消息中：

```bash
pi @prompt.md "回答这个"
pi -p @screenshot.png "这张图片里有什么？"
pi @code.ts @test.ts "审查这些文件"
```

### 示例

```bash
# 带初始 prompt 的交互模式
pi "列出 src/ 中所有 .ts 文件"

# 非交互模式
pi -p "总结这个代码库"

# 带管道 stdin 的非交互模式
cat README.md | pi -p "总结这段文字"

# 命名单次会话
pi --name "release audit" -p "审查这个仓库"

# 使用不同模型
pi --provider openai --model gpt-4o "帮我重构"

# 使用提供商前缀指定模型
pi --model openai/gpt-4o "帮我重构"

# 使用思考深度简写指定模型
pi --model sonnet:high "解决这个复杂问题"

# 限制模型循环范围
pi --models "claude-*,gpt-4o"

# 只读模式
pi --tools read,grep,find,ls -p "审查代码"

# 禁用某一个扩展或内置工具，保留其余可用
pi --exclude-tools ask_question
```

### 环境变量

| 变量 | 描述 |
|----------|-------------|
| `PI_CODING_AGENT_DIR` | 覆盖配置目录；默认为 `~/.pi/agent` |
| `PI_CODING_AGENT_SESSION_DIR` | 覆盖会话存储目录；可被 `--session-dir` 覆盖 |
| `PI_PACKAGE_DIR` | 覆盖包目录，适用于 Nix/Guix 存储路径 |
| `PI_OFFLINE` | 禁用启动时的网络操作，包括更新检查、包更新检查和安装/更新遥测 |
| `PI_SKIP_VERSION_CHECK` | 跳过启动时的 Pi 版本更新检查。阻止 `pi.dev` 最新版本请求 |
| `PI_TELEMETRY` | 覆盖安装/更新遥测：`1`/`true`/`yes` 或 `0`/`false`/`no`。此设置不控制更新检查 |
| `PI_CACHE_RETENTION` | 设置为 `long` 以在支持的平台上使用扩展 prompt 缓存 |
| `VISUAL`、`EDITOR` | Ctrl+G 使用的外部编辑器 |

## 设计原则

Pi 保持核心精简，将工作流相关行为推送到扩展、Skills、提示模板和包中。

它有意不包含内置的 MCP、子 agent、权限弹窗、plan 模式、待办列表或后台 bash。你可以将这些工作流构建或安装为扩展或包，或使用外部工具如容器和 tmux。

完整的设计理由阅读[博客文章](https://mariozechner.at/posts/2025-11-30-pi-coding-agent/)。

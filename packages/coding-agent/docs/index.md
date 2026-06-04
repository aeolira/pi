# Pi Documentation

Pi is a minimal terminal coding harness. It is designed to stay small at the core while being extended through TypeScript extensions, skills, prompt templates, themes, and pi packages.

## Quick start

Install Pi with npm:

```bash
npm install -g --ignore-scripts @earendil-works/pi-coding-agent
```

`--ignore-scripts` disables dependency lifecycle scripts during install. Pi does not require install scripts for normal npm installs.

On Linux or macOS, you can also use the installer:

```bash
curl -fsSL https://pi.dev/install.sh | sh
```

To uninstall pi itself, use npm for curl and npm installs:

```bash
npm uninstall -g @earendil-works/pi-coding-agent
```

For pnpm, Yarn, or Bun installs, use the matching global remove command: `pnpm remove -g @earendil-works/pi-coding-agent`, `yarn global remove @earendil-works/pi-coding-agent`, or `bun uninstall -g @earendil-works/pi-coding-agent`.

Then run it in a project directory:

```bash
pi
```

Authenticate with `/login` for subscription providers, or set an API key such as `ANTHROPIC_API_KEY` before starting pi.

For the full first-run flow, see [Quickstart](quickstart.md).

## Start here

- [Quickstart](quickstart.md) - install, authenticate, and run a first session.
- [Using Pi](usage.md) - interactive mode, slash commands, context files, and CLI reference.
- [Providers](providers.md) - subscription and API-key setup for built-in providers.
- [Containerization](containerization.md) - sandbox pi with OpenShell, Gondolin, or Docker.
- [Settings](settings.md) - global and project settings.
- [Keybindings](keybindings.md) - default shortcuts and custom keybindings.
- [Sessions](sessions.md) - session management, branching, and tree navigation.
- [Compaction](compaction.md) - context compaction and branch summarization.

## Customization

- [Extensions](extensions.md) - TypeScript modules for tools, commands, events, and custom UI.
- [Skills](skills.md) - Agent Skills for reusable on-demand capabilities.
- [Prompt templates](prompt-templates.md) - reusable prompts that expand from slash commands.
- [Themes](themes.md) - built-in and custom terminal themes.
- [Pi packages](packages.md) - bundle and share extensions, skills, prompts, and themes.
- [Custom models](models.md) - add model entries for supported provider APIs.
- [Custom providers](custom-provider.md) - implement custom APIs and OAuth flows.

## Programmatic usage

- [SDK](sdk.md) - embed pi in Node.js applications.
- [RPC mode](rpc.md) - integrate over stdin/stdout JSONL.
- [JSON event stream mode](json.md) - print mode with structured events.
- [TUI components](tui.md) - build custom terminal UI for extensions.

## Reference

- [Session format](session-format.md) - JSONL session file format, entry types, and SessionManager API.

## Platform setup

- [Windows](windows.md)
- [Termux on Android](termux.md)
- [tmux](tmux.md)
- [Terminal setup](terminal-setup.md)
- [Shell aliases](shell-aliases.md)

## Development

- [Development](development.md) - local setup, project structure, and debugging.

## 中文文档

- [快速开始](quickstart.zh-CN.md) - 安装、认证并运行首次会话。
- [使用 Pi](usage.zh-CN.md) - 交互模式、斜杠命令、上下文文件以及 CLI 参考。
- [提供商](providers.zh-CN.md) - 内置提供商的订阅和 API key 配置。
- [设置](settings.zh-CN.md) - 全局和项目设置。
- [快捷键](keybindings.zh-CN.md) - 默认快捷键和自定义键绑定。

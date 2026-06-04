# Pi 文档

Pi 是一个极简的终端编程助手。核心保持精简，通过 TypeScript 扩展、Skills、提示模板、主题和 pi 包进行功能扩展。

## 快速开始

使用 npm 安装 Pi：

```bash
npm install -g --ignore-scripts @earendil-works/pi-coding-agent
```

`--ignore-scripts` 会在安装期间禁用依赖的生命周期脚本。Pi 在正常 npm 安装中不需要安装脚本。

在 Linux 或 macOS 上，也可以使用安装脚本：

```bash
curl -fsSL https://pi.dev/install.sh | sh
```

卸载 pi 本身，对于 curl 和 npm 安装使用 npm：

```bash
npm uninstall -g @earendil-works/pi-coding-agent
```

对于 pnpm、Yarn 或 Bun 安装，使用对应的全局移除命令：`pnpm remove -g @earendil-works/pi-coding-agent`、`yarn global remove @earendil-works/pi-coding-agent` 或 `bun uninstall -g @earendil-works/pi-coding-agent`。

然后在项目目录中运行：

```bash
pi
```

订阅类提供商使用 `/login` 认证，或者设置 API key 如 `ANTHROPIC_API_KEY` 后再启动 pi。

完整首次运行流程，参见[快速开始](quickstart.zh-CN.md)。

## 从这里开始

- [快速开始](quickstart.zh-CN.md) - 安装、认证并运行首次会话。
- [使用 Pi](usage.zh-CN.md) - 交互模式、斜杠命令、上下文文件以及 CLI 参考。
- [提供商](providers.zh-CN.md) - 内置提供商的订阅和 API key 配置。
- [设置](settings.zh-CN.md) - 全局和项目设置。
- [快捷键](keybindings.zh-CN.md) - 默认快捷键和自定义键绑定。
- [会话](sessions.md) - 会话管理、分支和树形导航。
- [上下文压缩](compaction.md) - 上下文压缩和分支摘要。

## 定制化

- [扩展](extensions.md) - 用于工具、命令、事件和自定义 UI 的 TypeScript 模块。
- [Skills](skills.md) - 可复用的按需能力模块。
- [提示模板](prompt-templates.md) - 通过斜杠命令展开的可复用提示。
- [主题](themes.md) - 内置和自定义终端主题。
- [Pi 包](packages.md) - 打包和分享扩展、Skills、提示和主题。
- [自定义模型](models.md) - 为已有提供商 API 添加模型条目。
- [自定义提供商](custom-provider.md) - 实现自定义 API 和 OAuth 流程。

## 程序化使用

- [SDK](sdk.md) - 在 Node.js 应用中嵌入 pi。
- [RPC 模式](rpc.md) - 通过 stdin/stdout JSONL 集成。
- [JSON 事件流模式](json.md) - 输出结构化事件。
- [TUI 组件](tui.md) - 为扩展构建自定义终端 UI。

## 参考

- [会话格式](session-format.md) - JSONL 会话文件格式、条目类型以及 SessionManager API。

## 平台设置

- [Windows](windows.md)
- [Termux on Android](termux.md)
- [tmux](tmux.md)
- [终端设置](terminal-setup.md)
- [Shell 别名](shell-aliases.md)

## 开发

- [开发指南](development.md) - 本地搭建、项目结构和调试。

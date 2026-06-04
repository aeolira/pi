# 快速开始

本页帮助你从安装到完成首次有用的 pi 会话。

## 安装

Pi 作为 npm 包发布：

```bash
npm install -g --ignore-scripts @earendil-works/pi-coding-agent
```

`--ignore-scripts` 会在安装期间禁用依赖的生命周期脚本。Pi 在正常 npm 安装中不需要安装脚本。

### 卸载

使用当初安装 pi 的包管理器卸载。curl 安装脚本使用 npm 全局安装，因此 curl 和 npm 安装均使用 npm 卸载：

```bash
# curl 安装脚本或 npm install -g
npm uninstall -g @earendil-works/pi-coding-agent

# pnpm
pnpm remove -g @earendil-works/pi-coding-agent

# Yarn
yarn global remove @earendil-works/pi-coding-agent

# Bun
bun uninstall -g @earendil-works/pi-coding-agent
```

卸载 pi 会保留 `~/.pi/agent/` 中的设置、凭据、会话和已安装的 pi 包。

然后在希望工作的项目目录中启动 pi：

```bash
cd /path/to/project
pi
```

## 认证

Pi 可以通过 `/login` 使用订阅提供商，或通过环境变量或 auth 文件使用 API key 提供商。

### 方式一：订阅登录

启动 pi 并运行：

```text
/login
```

然后选择提供商。内置订阅登录包括 Claude Pro/Max、ChatGPT Plus/Pro (Codex) 和 GitHub Copilot。

### 方式二：API key

在启动 pi 前设置 API key：

```bash
export ANTHROPIC_API_KEY=sk-ant-...
pi
```

也可以运行 `/login` 并选择 API key 提供商，将 key 存储在 `~/.pi/agent/auth.json` 中。

所有支持的提供商、环境变量和云提供商设置参见[提供商](providers.zh-CN.md)。

## 首次会话

pi 启动后，输入请求并按 Enter：

```text
总结一下这个仓库并告诉我如何运行检查。
```

默认情况下，pi 给模型提供四个工具：

- `read` - 读取文件
- `write` - 创建或覆盖文件
- `edit` - 精确修改文件
- `bash` - 执行 Shell 命令

额外内置的只读工具（`grep`、`find`、`ls`）可通过工具选项启用。Pi 在当前工作目录中运行并可以修改其中文件。如果需要方便回滚，请使用 git 或其他快照工作流。

## 向 pi 提供项目说明

Pi 在启动时加载上下文文件。添加 `AGENTS.md` 文件来告诉它如何在项目中工作：

```markdown
# 项目说明

- 代码变更后运行 `npm run check`。
- 不要本地运行生产环境数据库迁移。
- 回复保持简洁。
```

Pi 加载：

- `~/.pi/agent/AGENTS.md` 作为全局说明
- 父目录和当前目录中的 `AGENTS.md` 或 `CLAUDE.md`

修改上下文文件后，重启 pi 或运行 `/reload`。

## 常见尝试

### 引用文件

在编辑器中输入 `@` 可模糊搜索文件，或在命令行中传入文件：

```bash
pi @README.md "总结这段内容"
pi @src/app.ts @src/app.test.ts "一起审查这些文件"
```

图片可通过 Ctrl+V（Windows 上为 Alt+V）粘贴，或拖入支持的终端。

### 运行 Shell 命令

在交互模式下：

```text
!npm run lint
```

命令输出将发送给模型。使用 `!!command` 运行命令但不将输出添加到模型上下文中。

### 切换模型

使用 `/model` 或 Ctrl+L 选择模型。使用 Shift+Tab 循环切换思考深度。使用 Ctrl+P / Shift+Ctrl+P 循环切换限定范围内的模型。

### 稍后继续

会话会自动保存：

```bash
pi -c                  # 继续最近的会话
pi -r                  # 浏览之前的会话
pi --name "my task"    # 在启动时设置会话显示名称
pi --session <path|id> # 打开特定会话
```

在 pi 内部，使用 `/resume`、`/new`、`/tree`、`/fork` 和 `/clone` 管理会话。

### 非交互模式

单次提问：

```bash
pi -p "总结这个代码库"
cat README.md | pi -p "总结这段文字"
pi -p @screenshot.png "这张图片里有什么？"
```

使用 `--mode json` 获取 JSON 事件输出，或 `--mode rpc` 进行进程集成。

## 下一步

- [使用 Pi](usage.zh-CN.md) - 交互模式、斜杠命令、会话、上下文文件和 CLI 参考。
- [提供商](providers.zh-CN.md) - 认证和模型设置。
- [设置](settings.zh-CN.md) - 全局和项目配置。
- [快捷键](keybindings.zh-CN.md) - 快捷键和自定义。
- [Pi 包](packages.md) - 安装共享扩展、Skills、提示和主题。

平台说明：[Windows](windows.md)、[Termux](termux.md)、[tmux](tmux.md)、[终端设置](terminal-setup.md)、[Shell 别名](shell-aliases.md)。

<p align="center">
  <a href="https://pi.dev">
    <img alt="pi logo" src="https://pi.dev/logo-auto.svg" width="128">
  </a>
</p>
<p align="center">
  <a href="https://discord.com/invite/3cU7Bz4UPx"><img alt="Discord" src="https://img.shields.io/badge/discord-community-5865F2?style=flat-square&logo=discord&logoColor=white" /></a>
</p>
<p align="center">
  <a href="https://pi.dev">pi.dev</a> 域名由以下机构慷慨捐赠：
  <br /><br />
  <a href="https://exe.dev"><img src="packages/coding-agent/docs/images/exy.png" alt="Exy mascot" width="48" /><br />exe.dev</a>
</p>

> 新贡献者的 issue 和 PR 默认自动关闭。维护者每日审查自动关闭的 issue。详见 [CONTRIBUTING.md](CONTRIBUTING.md)。

---

# Pi Agent Harness Mono Repo

这是 pi agent harness 项目的家园，包括我们的自扩展编程 agent。

* **[@earendil-works/pi-coding-agent](packages/coding-agent)**：交互式编程 agent CLI
* **[@earendil-works/pi-agent-core](packages/agent)**：支持工具调用和状态管理的 Agent 运行时
* **[@earendil-works/pi-ai](packages/ai)**：统一多提供商 LLM API（OpenAI、Anthropic、Google 等）

了解更多关于 pi：

* [访问 pi.dev](https://pi.dev)，项目网站及演示
* [阅读文档](https://pi.dev/docs/latest)，也可以直接问 agent 让它自我解释

## 分享你的开源编程 agent 会话

如果你使用 pi 或其他编程 agent 进行开源工作，请分享你的会话。

公开的 OSS 会话数据有助于通过真实任务、工具使用、失败和修复来改进编程 agent，而非玩具基准测试。

完整说明参见 [这篇 X 帖子](https://x.com/badlogicgames/status/2037811643774652911)。

要发布会话，使用 [`badlogic/pi-share-hf`](https://github.com/badlogic/pi-share-hf)。阅读其 README.md 获取设置说明。你只需要 Hugging Face 账号、Hugging Face CLI 和 `pi-share-hf`。

也可以观看[这个视频](https://x.com/badlogicgames/status/2041151967695634619)，其中展示了如何发布 `pi-mono` 会话。

作者定期在此发布 `pi-mono` 工作会话：

- [badlogicgames/pi-mono on Hugging Face](https://huggingface.co/datasets/badlogicgames/pi-mono)

## 所有包

| 包 | 描述 |
|---------|-------------|
| **[@earendil-works/pi-ai](packages/ai)** | 统一多提供商 LLM API（OpenAI、Anthropic、Google 等） |
| **[@earendil-works/pi-agent-core](packages/agent)** | 支持工具调用和状态管理的 Agent 运行时 |
| **[@earendil-works/pi-coding-agent](packages/coding-agent)** | 交互式编程 agent CLI |
| **[@earendil-works/pi-tui](packages/tui)** | 支持差分渲染的终端 UI 库 |

Slack/聊天自动化和工作流参见 [earendil-works/pi-chat](https://github.com/earendil-works/pi-chat)。

## 参与贡献

参见 [CONTRIBUTING.md](CONTRIBUTING.md) 贡献指南，[AGENTS.md](AGENTS.md) 项目规则（面向开发者和 agent）。

## 开发

```bash
npm install --ignore-scripts  # 安装所有依赖，不运行生命周期脚本
npm run build        # 构建所有包
npm run check        # Lint、格式化和类型检查
./test.sh            # 运行测试（无 API key 时跳过 LLM 相关测试）
./pi-test.sh         # 从源码运行 pi（可从任何目录运行）
```

## 供应链加固

- 外部直接依赖固定到精确版本。内部工作区包保持版本范围。
- `.npmrc` 设置 `save-exact=true` 和 `min-release-age=2` 以避免同天依赖发布。
- `package-lock.json` 是依赖的真相源。pre-commit 阻止意外锁文件提交。
- `npm run check` 验证固定直接依赖、原生 TypeScript 导入兼容性和生成的编程 agent shrinkwrap。
- 发布 CLI 包包含 `packages/coding-agent/npm-shrinkwrap.json` 为 npm 用户固定传递依赖。
- 发布冒烟测试使用 `npm run release:local` 在标记发布前在仓库外构建、打包和创建隔离的 npm 和 Bun 安装。
- 本地发布安装、文档化 npm 安装和 `pi update --self` 在支持时使用 `--ignore-scripts`。
- CI 使用 `npm ci --ignore-scripts` 安装。

## 许可证

MIT

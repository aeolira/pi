> pi 可以创建 Skills。直接告诉它你的使用场景，让它帮你构建。

# Skills

Skills 是独立的、可复用的能力包，agent 按需加载。一个 Skill 为特定任务提供专门的工作流、设置说明、辅助脚本和参考文档。

Pi 实现了 [Agent Skills 标准](https://agentskills.io/specification)，对大多数违规给出警告但仍保持宽容。Pi 允许 Skill 名称与父目录不同，即使标准不允许；该规则对于跨多个 agent 工具共用的 Skill 目录来说并不理想。

## 目录

- [位置](#位置)
- [Skills 如何工作](#skills-如何工作)
- [Skill 命令](#skill-命令)
- [Skill 结构](#skill-结构)
- [Frontmatter](#frontmatter)
- [验证](#验证)
- [示例](#示例)
- [Skill 仓库](#skill-仓库)

## 位置

> **安全：** Skills 可以指示模型执行任何操作，并且可能包含模型调用的可执行代码。使用前请审查 Skill 内容。

Pi 从以下位置加载 Skills：

- 全局：
  - `~/.pi/agent/skills/`
  - `~/.agents/skills/`
- 项目：
  - `.pi/skills/`
  - `cwd` 及祖先目录中的 `.agents/skills/`（直至 git 仓库根目录，不在仓库中时直至文件系统根目录）
- 包：`package.json` 中的 `skills/` 目录或 `pi.skills` 条目
- 设置：`skills` 数组，包含文件或目录
- CLI：`--skill <path>`（可多次使用，即使配合 `--no-skills` 也会加载）

发现规则：
- 在 `~/.pi/agent/skills/` 和 `.pi/skills/` 中，根目录的 `.md` 文件被作为独立 Skill 发现
- 在所有 Skill 位置中，包含 `SKILL.md` 的目录会被递归发现
- 在 `~/.agents/skills/` 和项目 `.agents/skills/` 中，根目录的 `.md` 文件被忽略

使用 `--no-skills` 禁用发现（显式指定的 `--skill` 路径仍会加载）。

### 使用其他工具的 Skills

要使用 Claude Code 或 OpenAI Codex 的 Skills，将其目录添加到设置中：

```json
{
  "skills": [
    "~/.claude/skills",
    "~/.codex/skills"
  ]
}
```

对于项目级别的 Claude Code Skills，添加到 `.pi/settings.json`：

```json
{
  "skills": ["../.claude/skills"]
}
```

## Skills 如何工作

1. 启动时，pi 扫描 Skill 位置并提取名称和描述
2. System prompt 中按[规范](https://agentskills.io/integrate-skills)包含可用的 Skills（XML 格式）
3. 当任务匹配时，agent 使用 `read` 加载完整的 SKILL.md（模型不总这样做；使用提示或 `/skill:name` 强制加载）
4. Agent 按照说明操作，使用相对路径引用脚本和资源

这是渐进式信息披露：只有描述始终在上下文中，完整说明按需加载。

## Skill 命令

Skills 注册为 `/skill:name` 命令：

```bash
/skill:brave-search           # 加载并执行 Skill
/skill:pdf-tools extract      # 带参数加载 Skill
```

命令后的参数会作为 `User: <args>` 追加到 Skill 内容中。

在交互模式下通过 `/settings` 或在 `settings.json` 中切换 Skill 命令：

```json
{
  "enableSkillCommands": true
}
```

## Skill 结构

一个 Skill 是包含 `SKILL.md` 文件的目录。其他内容完全自由。

```
my-skill/
├── SKILL.md              # 必需：frontmatter + 指令
├── scripts/              # 辅助脚本
│   └── process.sh
├── references/           # 按需加载的详细文档
│   └── api-reference.md
└── assets/
    └── template.json
```

### SKILL.md 格式

````markdown
---
name: my-skill
description: 该 Skill 的功能和使用场景。请具体描述。
---

# My Skill

## 设置

首次使用前运行一次：
```bash
cd /path/to/skill && npm install
```

## 用法

```bash
./scripts/process.sh <input>
```
````

使用相对路径（相对于 Skill 目录）：

```markdown
详见 [参考指南](references/REFERENCE.md)。
```

## Frontmatter

根据 [Agent Skills 规范](https://agentskills.io/specification#frontmatter-required)：

| 字段 | 必需 | 描述 |
|-------|----------|-------------|
| `name` | 是 | 最多 64 字符。小写 a-z、0-9、连字符。与标准不同，Pi 不要求此字段与父目录匹配，因为该标准要求对共用 Skill 目录来说并不理想。 |
| `description` | 是 | 最多 1024 字符。描述 Skill 的功能和使用场景。 |
| `license` | 否 | 许可证名称或对打包文件的引用。 |
| `compatibility` | 否 | 最多 500 字符。环境要求。 |
| `metadata` | 否 | 任意键值映射。 |
| `allowed-tools` | 否 | 空格分隔的预批准工具列表（实验性）。 |
| `disable-model-invocation` | 否 | 设为 `true` 时，Skill 在 system prompt 中隐藏。用户必须使用 `/skill:name`。 |

### 名称规则

- 1-64 字符
- 仅小写字母、数字、连字符
- 不能以连字符开头或结尾
- 无连续连字符
Pi 不要求名称与父目录匹配。Agent Skills 标准要求匹配，但该要求对跨多个工具使用的共用 Skill 目录来说并不理想。

有效：`pdf-processing`、`data-analysis`、`code-review`
无效：`PDF-Processing`、`-pdf`、`pdf--processing`

### 描述最佳实践

描述决定 agent 何时加载 Skill。请具体。

好的：
```yaml
description: 从 PDF 文件中提取文本和表格，填写 PDF 表单，合并多个 PDF。处理 PDF 文档时使用。
```

差的：
```yaml
description: 帮助处理 PDF。
```

## 验证

Pi 根据 Agent Skills 标准验证 Skills。大多数问题产生警告但仍加载 Skill：

- 名称超过 64 字符或包含无效字符
- 名称以连字符开头/结尾或有连续连字符
- 描述超过 1024 字符

未知的 frontmatter 字段被忽略。

**例外：** 缺少描述的 Skills 不会加载。

名称冲突（不同位置的同名 Skill）会警告并保留找到的第一个 Skill。

## 示例

```
brave-search/
├── SKILL.md
├── search.js
└── content.js
```

**SKILL.md:**
````markdown
---
name: brave-search
description: 通过 Brave Search API 进行网络搜索和内容提取。用于搜索文档、事实或任何网络内容。
---

# Brave Search

## 设置

```bash
cd /path/to/brave-search && npm install
```

## 搜索

```bash
./search.js "query"              # 基本搜索
./search.js "query" --content    # 包含页面内容
```

## 提取页面内容

```bash
./content.js https://example.com
```
````

## Skill 仓库

- [Anthropic Skills](https://github.com/anthropics/skills) - 文档处理（docx、pdf、pptx、xlsx）、Web 开发
- [Pi Skills](https://github.com/badlogic/pi-skills) - 网络搜索、浏览器自动化、Google API、转录

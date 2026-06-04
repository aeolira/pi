> pi 可以创建提示模板。告诉它你的工作流，让它帮你构建。

# 提示模板

提示模板是展开为完整 Prompt 的 Markdown 片段。在编辑器中输入 `/name` 调用模板，其中 `name` 是不含 `.md` 的文件名。

## 位置

Pi 从以下位置加载提示模板：

- 全局：`~/.pi/agent/prompts/*.md`
- 项目：`.pi/prompts/*.md`
- 包：`package.json` 中的 `prompts/` 目录或 `pi.prompts` 条目
- 设置：`prompts` 数组，包含文件或目录
- CLI：`--prompt-template <path>`（可多次使用）

使用 `--no-prompt-templates` 禁用发现。

## 格式

```markdown
---
description: 审查已暂存的 git 变更
---
审查暂存的变更（`git diff --cached`）。关注：
- Bug 和逻辑错误
- 安全问题
- 错误处理缺陷
```

- 文件名即为命令名。`review.md` 对应 `/review`。
- `description` 可选。缺失时使用第一个非空行。
- `argument-hint` 可选。设置后在自动补全下拉框的描述前显示提示。

### 参数提示

在 frontmatter 中使用 `argument-hint` 在自动补全中显示预期参数。用 `<尖括号>` 表示必需参数，`[方括号]` 表示可选参数：

```markdown
---
description: 通过 URL 审查 PR，包含结构化 issue 和代码分析
argument-hint: "<PR-URL>"
---
```

在自动补全下拉框中呈现为：

```
→ pr   <PR-URL>       — Review PRs from URLs with structured issue and code analysis
  is   <issue>        — Analyze GitHub issues (bugs or feature requests)
  wr   [instructions] — Finish the current task end-to-end
  cl   — Audit changelog entries before release
```

## 用法

在编辑器中输入 `/` 后跟模板名称。自动补全会显示带有描述的可用模板。

```
/review                           # 展开 review.md
/component Button                 # 带参数展开
/component Button "click handler" # 多个参数
```

## 参数

模板支持位置参数和简单切片：

- `$1`、`$2` 等为位置参数
- `$@` 或 `$ARGUMENTS` 为所有参数连接
- `${@:N}` 为从第 N 个位置开始的参数（1 索引）
- `${@:N:L}` 为从 N 开始的 L 个参数

示例：

```markdown
---
description: 创建一个组件
---
创建一个名为 $1 的 React 组件，功能：$@
```

用法：`/component Button "onClick handler" "disabled support"`

## 加载规则

- `prompts/` 中的模板发现是非递归的。
- 如需子目录中的模板，通过 `prompts` 设置或包 manifest 显式添加。

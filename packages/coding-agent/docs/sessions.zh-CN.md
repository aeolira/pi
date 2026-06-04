# 会话

Pi 将对话保存为会话，方便你继续工作、从早期轮次分支以及重新访问之前的路径。

## 会话存储

会话自动保存到 `~/.pi/agent/sessions/`，按工作目录组织。每个会话是一个具有树形结构的 JSONL 文件。

```bash
pi -c                  # 继续最近的会话
pi -r                  # 浏览并选择历史会话
pi --no-session        # 临时模式；不保存
pi --name "my task"    # 在启动时设置会话显示名称
pi --session <path|id> # 使用特定会话文件或部分会话 ID
pi --fork <path|id>    # 将会话文件或部分会话 ID 分叉到新会话
```

在交互模式下使用 `/session` 查看当前会话文件、会话 ID、消息数、token 和费用。

JSONL 文件格式和 SessionManager API 参见[会话格式](session-format.md)。

## 会话命令

| 命令 | 描述 |
|---------|-------------|
| `/resume` | 浏览并选择之前的会话 |
| `/new` | 开始新会话 |
| `/name <name>` | 设置当前会话显示名称 |
| `/session` | 显示会话信息 |
| `/tree` | 导航当前会话树 |
| `/fork` | 从之前的用户消息创建新会话 |
| `/clone` | 将当前活跃分支复制到新会话 |
| `/compact [prompt]` | 摘要旧上下文；参见[压缩](compaction.md) |
| `/export [file]` | 将会话导出为 HTML |
| `/share` | 上传为私有 GitHub gist 并提供可分享的 HTML 链接 |

## 恢复和删除会话

`/resume` 为当前项目打开交互式会话选择器。`pi -r` 在启动时打开相同的选择器。

在选择器中可以搜索、切换路径显示（Ctrl+P）、切换排序（Ctrl+S）、过滤已命名会话（Ctrl+N）、重命名（Ctrl+R）、删除（Ctrl+D 后确认）。可用时 pi 使用 `trash` CLI 而非永久删除。

## 命名会话

使用 `/name <name>` 设置人类可读的会话名称，或使用 `--name` / `-n` 在启动时设置。

## 使用 `/tree` 分支

会话存储为树形结构。每个条目有 `id` 和 `parentId`，当前位置是活跃叶节点。`/tree` 允许你跳到之前的任何点继续，无需创建新文件。

### Tree 控件

| 键 | 操作 |
|-----|--------|
| ↑/↓ | 导航可见条目 |
| ←/→ | 翻页 |
| Ctrl+←/Ctrl+→（或 Alt+←/Alt+→） | 折叠/展开或跳转分支段 |
| Shift+L | 设置或清除条目标签 |
| Shift+T | 切换标签时间戳 |
| Enter | 选择条目 |
| Escape/Ctrl+C | 取消 |
| Ctrl+O | 循环切换过滤模式 |

过滤模式：default、no-tools、user-only、labeled-only、all。通过 `treeFilterMode` 配置默认值。

## `/tree`、`/fork` 和 `/clone`

| 功能 | `/tree` | `/fork` | `/clone` |
|---------|---------|---------|----------|
| 输出 | 同一会话文件 | 新会话文件 | 新会话文件 |
| 视图 | 完整树 | 用户消息选择器 | 当前活跃分支 |
| 典型用途 | 原地探索替代方案 | 从早期 prompt 开始新会话 | 在继续前复制当前工作 |

## 分支摘要

当 `/tree` 从一个分支切换到另一个时，pi 可摘要被放弃的分支并将摘要附加到新位置。这保留了离开路径的重要上下文而无需重放整个分支。

## 会话格式

会话文件为 JSONL 格式，包含消息条目、模型变更、思考级别变更、标签、压缩、分支摘要和扩展条目。详见[会话格式](session-format.md)。

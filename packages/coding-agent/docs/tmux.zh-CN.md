# tmux 配置

Pi 可在 tmux 中运行，但 tmux 默认会剥离某些键的修饰符信息。不配置的话，`Shift+Enter` 和 `Ctrl+Enter` 通常与普通 `Enter` 无法区分。

## 推荐配置

添加到 `~/.tmux.conf`：

```tmux
set -g extended-keys on
set -g extended-keys-format csi-u
```

然后完整重启 tmux：

```bash
tmux kill-server
tmux
```

当 Kitty 键盘协议不可用时，pi 会自动请求扩展按键报告。使用 `extended-keys-format csi-u`，tmux 以 CSI-u 格式转发修饰键，这是最可靠的配置。

## 这修复了什么

没有 tmux 扩展键时，修饰的 Enter 键会退化为旧序列。tmux 3.2 或更高版本 + 支持扩展键的终端模拟器（Ghostty、Kitty、iTerm2、WezTerm、Windows Terminal）即可使用。

可以运行 `tmux -V` 检查 tmux 版本。

| 键 | 无 extkeys | 使用 `csi-u` |
|-----|-----------------|--------------|
| Enter | `\r` | `\r` |
| Shift+Enter | `\r` | `\x1b[13;2u` |
| Ctrl+Enter | `\r` | `\x1b[13;5u` |
| Alt/Option+Enter | `\x1b\r` | `\x1b[13;3u` |

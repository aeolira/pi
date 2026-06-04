# 终端设置

Pi 使用 [Kitty 键盘协议](https://sw.kovidgoyal.net/kitty/keyboard-protocol/) 实现可靠的修饰键检测。大多数现代终端支持此协议，但部分需要配置。

## Kitty、iTerm2

开箱即用。

## Apple Terminal

可用时 pi 启用增强键报告。如果 Terminal.app 仍对 `Shift+Enter` 发送普通 Return，pi 使用本地 macOS 修饰符回退将该 Return 视为 `Shift+Enter`。此回退仅在 pi 与 Terminal.app 在同一 Mac 上运行时有效，无法通过远程 SSH 检测本地键盘。

## Ghostty

添加到 Ghostty 配置（macOS：`~/Library/Application Support/com.mitchellh.ghostty/config`，Linux：`~/.config/ghostty/config`）：

```
keybind = alt+backspace=text:\x1b\x7f
```

如果你有旧的 `keybind = shift+enter=text:\n` 映射，该映射发送原始换行字符，在 pi 中与 `Ctrl+J` 无法区分。如果只是因为旧版 Claude Code 添加的，可以移除。如果需要在 tmux 中保持 `Shift+Enter` 工作，将 `ctrl+j` 添加到 `~/.pi/agent/keybindings.json` 中的 `newLine` 键绑定：

```json
{
  "newLine": ["shift+enter", "ctrl+j"]
}
```

## WezTerm

创建 `~/.wezterm.lua`：

```lua
local wezterm = require 'wezterm'
local config = wezterm.config_builder()
config.enable_kitty_keyboard = true
return config
```

在 WSL 上，WezTerm 可能需要可见的硬件光标用于输入法候选窗口定位。如果 CJK 输入法候选不跟随文本光标，设置 `PI_HARDWARE_CURSOR=1` 或在设置中将 `showHardwareCursor` 设为 `true`。

## VS Code（集成终端）

在 `keybindings.json` 中添加以启用 `Shift+Enter` 多行输入：

```json
{
  "key": "shift+enter",
  "command": "workbench.action.terminal.sendSequence",
  "args": { "text": "\u001b[13;2u" },
  "when": "terminalFocus"
}
```

## Windows Terminal

在 `settings.json` 中添加（Ctrl+Shift+, 或 设置 → 打开 JSON 文件）以转发 pi 使用的修饰 Enter 键：

```json
{
  "actions": [
    {
      "command": { "action": "sendInput", "input": "\u001b[13;2u" },
      "keys": "shift+enter"
    },
    {
      "command": { "action": "sendInput", "input": "\u001b[13;3u" },
      "keys": "alt+enter"
    }
  ]
}
```

- `Shift+Enter` 插入新行。
- Windows Terminal 默认将 `Alt+Enter` 绑定到全屏，这会阻止 pi 接收 `Alt+Enter` 用于跟进队列。
- 将 `Alt+Enter` 重新映射到 `sendInput` 会将真正的键组合转发给 pi。

## xfce4-terminal、terminator

这些终端的转义序列支持有限。修饰 Enter 键如 `Ctrl+Enter` 和 `Shift+Enter` 无法与普通 `Enter` 区分。

为获得最佳体验，使用支持 Kitty 键盘协议的终端：
- [Kitty](https://sw.kovidgoyal.net/kitty/)
- [Ghostty](https://ghostty.org/)
- [WezTerm](https://wezfurlong.org/wezterm/)
- [iTerm2](https://iterm2.com/)
- [Alacritty](https://github.com/alacritty/alacritty)（需要编译以支持 Kitty 协议）

## IntelliJ IDEA（集成终端）

内置终端的转义序列支持有限。在 IntelliJ 的终端中 Shift+Enter 无法与 Enter 区分。如需可见硬件光标，设置 `PI_HARDWARE_CURSOR=1`。为获得最佳体验建议使用专用终端模拟器。

> pi 可以创建 TUI 组件。告诉它你的用途，让它帮你构建。

# TUI 组件

扩展和自定义工具可以渲染自定义 TUI 组件用于交互式用户界面。

**源码：** [`@earendil-works/pi-tui`](https://github.com/earendil-works/pi-mono/tree/main/packages/tui)

## Component 接口

所有组件实现 `render(width)`、`handleInput?(data)`、`invalidate()`。

TUI 在每个渲染行末尾附加完整的 SGR 重置和 OSC 8 重置。样式不会跨行传递。

## Focusable 接口（IME 支持）

显示文本光标并需要输入法支持的组件应实现 `Focusable` 接口。使用 `CURSOR_MARKER` 标记光标位置。当容器组件包含 `Input` 或 `Editor` 子元素时必须实现 `Focusable` 并将焦点传播到子元素。

## 使用组件

在扩展中通过 `ctx.ui.custom()` 使用，在自定义工具中通过 `pi.ui.custom()` 使用。

## 叠加层

叠加层在不清理屏幕的情况下将组件渲染在现有内容之上。支持定位（9 个锚点）、百分比/像素大小、边距和响应式可见性。

## 内置组件

从 `@earendil-works/pi-tui` 导入：`Text`、`Box`、`Container`、`Spacer`、`Markdown`、`Image`。

## 键盘输入

使用 `matchesKey()` 检测按键。支持 `Key.up`、`Key.enter` 等基本键和 `Key.ctrl("c")`、`Key.shift("tab")` 等修饰键。

## 行宽

每行不超过 `width` 参数。使用 `visibleWidth()`、`truncateToWidth()`、`wrapTextWithAnsi()` 工具函数。

## 主题

使用 `theme.fg(color, text)` 设置前景色，`theme.bg(color, text)` 设置背景色。对于 Markdown 使用 `getMarkdownTheme()`。完整颜色 token 列表参见[主题](themes.md)。

## 调试日志

设置 `PI_TUI_WRITE_LOG` 捕获写入 stdout 的原始 ANSI 流。

## 性能

在可能时缓存渲染输出。状态变更时调用 `invalidate()`，然后调用 `handle.requestRender()` 触发重渲染。

## 失效与主题变更

主题变更时 TUI 调用所有组件的 `invalidate()`。预烘焙主题颜色的组件必须重建内容。在构造函数中存储数据，在 `invalidate()` 中调用 `super.invalidate()` 后重建 UI。

## 常见模式

### Pattern 1：选择对话框（SelectList）
使用 `SelectList` 和 `DynamicBorder` 让用户从选项列表中选择。

### Pattern 2：带取消的异步操作（BorderedLoader）
使用 `BorderedLoader` 显示旋转器并处理 Escape 取消。

### Pattern 3：设置/开关（SettingsList）
使用 `SettingsList` 和 `getSettingsListTheme()` 切换多个设置。

### Pattern 4：持久状态指示器
使用 `ctx.ui.setStatus()` 在底部栏显示跨渲染持久的状态。

### Pattern 4b：工作指示器自定义
使用 `ctx.ui.setWorkingIndicator()` 自定义流式响应期间的内联工作指示器。

### Pattern 5：编辑器上方/下方组件
使用 `ctx.ui.setWidget()` 在输入编辑器上方或下方显示持久内容。

### Pattern 6：自定义底部栏
使用 `ctx.ui.setFooter()` 替换底部栏。

### Pattern 7：自定义编辑器（vim 模式等）
扩展 `CustomEditor` 并调用 `super.handleInput(data)` 处理未处理的按键。

## 关键规则

1. **始终使用回调中的 theme** - 不直接导入 theme
2. **始终类型化 DynamicBorder 的颜色参数**
3. **状态变更后调用 tui.requestRender()**
4. **返回三方法对象** - 自定义组件需要 `{ render, invalidate, handleInput }`
5. **使用现有组件** - `SelectList`、`SettingsList`、`BorderedLoader` 覆盖 90% 的场景

# Termux（Android）配置

Pi 可通过 [Termux](https://termux.dev/) 在 Android 上运行，Termux 是 Android 的终端模拟器和 Linux 环境。

## 前置条件

1. 从 GitHub 或 F-Droid 安装 [Termux](https://github.com/termux/termux-app#installation)（不要从 Google Play 安装，该版本已弃用）
2. 从 GitHub 或 F-Droid 安装 [Termux:API](https://github.com/termux/termux-api#installation) 用于剪贴板和其他设备集成

## 安装

```bash
# 更新软件包
pkg update && pkg upgrade

# 安装依赖
pkg install nodejs termux-api git

# 安装 pi
npm install -g --ignore-scripts @earendil-works/pi-coding-agent

# 创建配置目录
mkdir -p ~/.pi/agent

# 运行 pi
pi
```

## 剪贴板支持

在 Termux 中运行时剪贴板操作使用 `termux-clipboard-set` 和 `termux-clipboard-get`。必须安装 Termux:API 应用才能使用这些功能。

Termux 不支持图片剪贴板（`ctrl+v` 图片粘贴功能不可用）。

## 限制

- **无图片剪贴板**：Termux 剪贴板 API 仅支持文本
- **无原生二进制文件**：某些可选的原生依赖在 Android ARM64 上不可用，安装时跳过
- **存储访问**：要访问 `/storage/emulated/0`（下载等）中的文件，运行一次 `termux-setup-storage` 授予权限

## 故障排除

### 剪贴板不工作

确保两个应用都已安装：
1. Termux（来自 GitHub 或 F-Droid）
2. Termux:API（来自 GitHub 或 F-Droid）

然后安装 CLI 工具：
```bash
pkg install termux-api
```

### 共享存储权限被拒绝

运行一次以授予存储权限：
```bash
termux-setup-storage
```

### Node.js 安装问题

如果 npm 失败，尝试清除缓存：
```bash
npm cache clean --force
```

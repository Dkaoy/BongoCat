# BongoCat 本地调试指南

## 📋 环境要求

- **操作系统**: macOS / Windows / Linux
- **Node.js**: >= 16.0
- **Rust**: >= 1.70
- **包管理器**: pnpm (推荐) 或 npm

## 🛠 环境安装

### 1. 安装 Rust 工具链

```bash
# 安装 Rust (使用官方安装脚本)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# 重新加载环境变量
source ~/.cargo/env

# 验证安装
rustc --version
cargo --version
```

### 2. 安装 Tauri CLI

```bash
# 安装 Tauri CLI v2.x
cargo install tauri-cli --version "^2.0"

# 验证安装
tauri --version
```

### 3. 检查 Node.js 环境

```bash
# 检查 Node.js 版本
node --version  # 应该 >= 16.0

# 检查 npm 版本
npm --version

# 安装 pnpm (如果还没有)
npm install -g pnpm

# 验证 pnpm
pnpm --version
```

## 🚀 项目启动

### 1. 克隆项目并进入目录

```bash
git clone https://github.com/ayangweb/BongoCat.git
cd BongoCat
```

### 2. 安装项目依赖

```bash
# 安装前端依赖
pnpm install

# 如果使用 npm
npm install
```

### 3. 启动开发模式

```bash
# 一键启动开发模式 (推荐)
pnpm tauri dev

# 或者分步启动
# 终端1: 启动前端开发服务器
pnpm dev:vite

# 终端2: 启动 Tauri 应用
pnpm tauri dev
```

## 🔧 开发命令

### 基础命令

```bash
# 开发模式（热重载）
pnpm tauri dev

# 仅启动前端开发服务器
pnpm dev:vite

# 构建生产版本
pnpm build

# 构建图标资源
pnpm build:icon

# 代码检查和格式化
pnpm lint

# 预览构建结果
pnpm preview
```

### Tauri 专用命令

```bash
# 初始化 Tauri 项目（如果需要）
pnpm tauri init

# 构建 Tauri 应用
pnpm tauri build

# 添加 Tauri 插件
pnpm tauri add [plugin-name]

# 查看 Tauri 信息
pnpm tauri info
```

## 🛠 调试方式

### 前端调试

1. **浏览器开发者工具**

   ```bash
   # 应用启动后按 F12 或 Cmd+Option+I (macOS)
   ```

2. **网络访问**

   ```
   http://localhost:1420
   ```

3. **Vue DevTools**

   - 安装浏览器扩展
   - 在开发者工具中查看 Vue 组件状态

4. **热重载**
   - 保存文件自动刷新
   - Vite HMR 支持

### 后端调试

1. **Rust 日志输出**

   ```rust
   // 在 Rust 代码中添加日志
   println!("调试信息: {}", value);
   log::info!("信息日志");
   log::error!("错误日志");
   ```

2. **Tauri API 调试**

   ```javascript
   // 在前端调用后端 API
   import { invoke } from '@tauri-apps/api/tauri'

   // 调用后端命令
   const result = await invoke('your_command', { param: value })
   console.log('后端返回:', result)
   ```

3. **控制台输出**
   ```javascript
   // 前端 console 输出会显示在开发者工具中
   console.log('调试信息')
   console.error('错误信息')
   ```

## 📁 项目结构

```
BongoCat/
├── src/                    # Vue.js 前端源码
│   ├── pages/main/         # 主窗口页面
│   ├── pages/preference/   # 偏好设置页面
│   ├── components/         # Vue 组件
│   ├── stores/             # Pinia 状态管理
│   ├── composables/        # Vue 组合式 API
│   └── utils/              # 工具函数
├── src-tauri/              # Rust 后端源码
│   ├── src/                # Rust 源文件
│   ├── assets/             # 静态资源
│   ├── icons/              # 应用图标
│   └── tauri.conf.json     # Tauri 配置
├── public/                 # 静态文件
├── scripts/                # 构建脚本
└── package.json            # 前端依赖配置
```

## ⚙️ 配置文件说明

### 主要配置文件

- `src-tauri/tauri.conf.json` - Tauri 应用主配置
- `src-tauri/tauri.macos.conf.json` - macOS 特定配置
- `src-tauri/tauri.windows.conf.json` - Windows 特定配置
- `src-tauri/tauri.linux.conf.json` - Linux 特定配置
- `package.json` - 前端依赖和脚本配置
- `Cargo.toml` - Rust 依赖配置
- `vite.config.ts` - Vite 构建配置

### 重要配置项

```json
// src-tauri/tauri.conf.json
{
  "build": {
    "beforeDevCommand": "pnpm dev", // 开发前置命令
    "devUrl": "http://localhost:1420", // 开发服务器地址
    "beforeBuildCommand": "pnpm build", // 构建前置命令
    "frontendDist": "../dist" // 前端构建输出目录
  }
}
```

## 🎮 应用功能

### 核心功能

- **Live2D 猫咪动画** - 根据键盘鼠标操作实时响应
- **透明窗口** - 实现桌面宠物效果
- **多平台支持** - macOS、Windows、Linux
- **系统托盘** - 后台运行和快捷操作
- **偏好设置** - 自定义配置选项
- **自动启动** - 系统启动时自动运行

### 技术栈

- **前端**: Vue 3 + TypeScript + Vite + Ant Design Vue
- **后端**: Rust + Tauri 2.x
- **动画**: Live2D + PixiJS
- **状态管理**: Pinia
- **构建工具**: Vite + Cargo

## 🐛 常见问题

### 编译错误

1. **Rust 编译失败**

   ```bash
   # 更新 Rust 工具链
   rustup update

   # 清理缓存重新编译
   cargo clean
   pnpm tauri dev
   ```

2. **依赖安装失败**

   ```bash
   # 清理 node_modules 重新安装
   rm -rf node_modules pnpm-lock.yaml
   pnpm install
   ```

3. **端口被占用**

   ```bash
   # 检查端口占用
   lsof -i :1420

   # 杀死占用进程
   kill -9 <PID>
   ```

### 权限问题 (macOS)

1. **无障碍权限**

   - 系统偏好设置 → 安全性与隐私 → 辅助功能
   - 添加 BongoCat 应用

2. **屏幕录制权限**
   - 系统偏好设置 → 安全性与隐私 → 屏幕录制
   - 添加 BongoCat 应用

### 性能优化

1. **开发模式优化**

   ```bash
   # 使用 release 模式编译（更快）
   pnpm tauri dev --release
   ```

2. **减少编译时间**
   ```bash
   # 仅编译变更部分
   cargo build --incremental
   ```

## 📝 开发注意事项

1. **首次编译时间较长** - Rust 依赖编译需要 5-15 分钟
2. **热重载支持** - 前端代码保存即时更新，后端需重启
3. **跨平台测试** - 不同平台可能有差异，需要分别测试
4. **权限配置** - macOS 需要手动授予相关权限
5. **资源路径** - 使用相对路径避免平台差异

## 🔗 相关链接

- [Tauri 官方文档](https://tauri.app/)
- [Vue 3 文档](https://vuejs.org/)
- [Rust 官方文档](https://doc.rust-lang.org/)
- [项目原作者](https://github.com/ayangweb/BongoCat)

---

**最后更新**: 2025年5月26日
**适用版本**: BongoCat v0.4.0

#!/bin/bash

echo "🚀 安装依赖（跳过 Electron）..."

# 设置环境变量跳过 Electron 下载
export ELECTRON_SKIP_BINARY_DOWNLOAD=1

# 清理并重新安装
echo "🧹 清理缓存..."
pnpm store prune

echo "📦 安装依赖..."
pnpm install --no-frozen-lockfile

echo "✅ 依赖安装完成！"

echo ""
echo "🎯 下一步："
echo "1. 构建客户端: pnpm client:build"
echo "2. 构建服务端: pnpm server:build"
echo "3. 启动服务: pnpm server:start"

echo ""
echo "📝 注意: 已跳过 Electron 安装，只能使用 Web 版本"
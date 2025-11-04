#!/bin/bash

# 自定义 Trilium Docker 镜像构建脚本
# 包含 markdown note type 功能

set -e

echo "🚀 开始构建自定义 Trilium Docker 镜像..."

# 1. 安装依赖
echo "📦 安装依赖..."
pnpm install

# 2. 构建客户端
echo "🔨 构建客户端..."
pnpm client:build

# 3. 构建服务端
echo "🔨 构建服务端..."
pnpm server:build

# 4. 进入服务端目录
cd apps/server

# 5. 构建 Docker 镜像
echo "🐳 构建 Docker 镜像..."
IMAGE_NAME="trilium-markdown"
IMAGE_TAG="latest"

# 选择 Dockerfile（可以根据需要修改）
DOCKERFILE="Dockerfile.alpine"

echo "使用 $DOCKERFILE 构建镜像 $IMAGE_NAME:$IMAGE_TAG"
docker build . -t "$IMAGE_NAME:$IMAGE_TAG" -f "$DOCKERFILE"

echo "✅ Docker 镜像构建完成！"
echo "📋 镜像信息："
docker images | grep "$IMAGE_NAME"

echo ""
echo "🚀 启动容器命令："
echo "docker run -d -p 8080:8080 -v trilium-data:/home/node/trilium-data $IMAGE_NAME:$IMAGE_TAG"

echo ""
echo "🐳 或使用 docker-compose："
echo "修改 docker-compose.yml 中的 image 为: $IMAGE_NAME:$IMAGE_TAG"
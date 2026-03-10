#!/bin/bash
# GLP-1 Pipeline Tracker - Cloudflare Pages Deploy Script

echo "🚀 GLP-1 Pipeline Tracker - 部署脚本"
echo "===================================="

# 检查目录
echo "📁 检查项目目录..."
if [ ! -f "index.html" ]; then
    echo "❌ 错误: index.html 不存在"
    exit 1
fi

if [ ! -f "data/pipeline.json" ]; then
    echo "❌ 错误: data/pipeline.json 不存在"
    exit 1
fi

echo "✅ 项目文件检查通过"

# 统计信息
echo ""
echo "📊 数据统计:"
TOTAL=$(cat data/pipeline.json | grep -c '"id":')
CHINA=$(cat data/pipeline.json | grep -c '"country": "CN"')
MULTI=$(cat data/pipeline.json | grep -c '双靶点\|三靶点')
echo "  总产品数: $TOTAL"
echo "  中国产品: $CHINA"
echo "  多靶点产品: $MULTI"

# 文件大小
echo ""
echo "📦 文件大小:"
du -sh .
du -sh data/pipeline.json

# 部署方式选择
echo ""
echo "📤 请选择部署方式:"
echo "1) 推送到 GitHub (自动部署到 Cloudflare Pages)"
echo "2) 生成 ZIP 压缩包 (手动上传)"
echo "3) 仅验证项目结构"
read -p "请输入选项 (1/2/3): " choice

case $choice in
    1)
        echo ""
        echo "📌 GitHub 部署步骤:"
        echo "1. 在 GitHub 创建新仓库 (如: glp1-pipeline)"
        echo "2. 运行以下命令:"
        echo ""
        echo "   git init"
        echo "   git add ."
        echo "   git commit -m 'Initial commit'"
        echo "   git branch -M main"
        echo "   git remote add origin https://github.com/YOUR_USERNAME/glp1-pipeline.git"
        echo "   git push -u origin main"
        echo ""
        echo "3. 在 Cloudflare Pages 连接 GitHub 仓库"
        echo "   https://dash.cloudflare.com → Pages → Create project"
        ;;
    
    2)
        echo ""
        echo "📦 生成 ZIP 压缩包..."
        cd ..
        zip -r glp1-pipeline-deploy.zip glp1-pipeline/
        echo "✅ 已生成: glp1-pipeline-deploy.zip"
        echo ""
        echo "📤 手动上传步骤:"
        echo "1. 访问 https://dash.cloudflare.com"
        echo "2. 进入 Pages → Create project"
        echo "3. 选择 'Upload assets'"
        echo "4. 上传 glp1-pipeline-deploy.zip"
        ;;
    
    3)
        echo ""
        echo "✅ 项目验证完成"
        echo "项目可正常部署"
        ;;
    
    *)
        echo "❌ 无效选项"
        exit 1
        ;;
esac

echo ""
echo "🌐 部署完成后访问:"
echo "   https://YOUR_PROJECT.pages.dev"
echo ""
echo "🎉 完成!"
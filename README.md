# GLP-1 管线全景图谱

全球GLP-1靶点药物研发进展追踪平台 - 多靶点创新 · 中国突破

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Data](https://img.shields.io/badge/data-57%20products-green.svg)
![China](https://img.shields.io/badge/China-25%20products-red.svg)
![Multi-target](https://img.shields.io/badge/Multi--target-26%20products-purple.svg)

## 🌐 在线访问

**部署地址**: `https://glp1-pipeline.pages.dev` (部署后生效)

## 📊 数据覆盖

| 指标 | 数值 |
|------|------|
| 总产品数 | 57 |
| 中国产品 | 25 |
| 全球产品 | 32 |
| 多靶点产品 | 26 |
| GCG靶点产品 | 14 |
| 已上市 | 7 |
| III期临床 | 18 |
| NDA申报中 | 11 |

### 🎯 多靶点产品亮点

| 产品 | 公司 | 靶点 | 阶段 | 最佳数据 |
|------|------|------|------|----------|
| Retatrutide | 礼来 | **GLP-1/GIP/GCG三靶点** | III期 | 48周 24.2% |
| 玛仕度肽 | 信达生物 | **GLP-1/GCG双靶点** | 已上市 | 48周 15.4% |
| Tirzepatide | 礼来 | GLP-1/GIP双靶点 | 已上市 | 52周 22.5% |
| UBT251 | 联邦制药 | **GLP-1/GIP/GCG三靶点** | III期 | - |

### 🇨🇳 中国突破

- **信达生物 玛仕度肽**: 全球首个获批的GLP-1/GCG双靶点激动剂
- **甘李药业 GZR18**: 全球首个GLP-1双周制剂
- **司美格鲁肽仿制药**: 10家企业已申报上市，预计2026年Q3-Q4获批

## 🚀 Cloudflare Pages 部署指南

### 方法一：Git 部署（推荐）

1. **创建 GitHub 仓库**
   ```bash
   cd /workspace/projects/workspace/glp1-pipeline
   git init
   git add .
   git commit -m "Initial commit: GLP-1 Pipeline Tracker"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/glp1-pipeline.git
   git push -u origin main
   ```

2. **连接 Cloudflare Pages**
   - 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
   - 进入 **Pages** → **Create a project**
   - 选择 **Connect to Git**
   - 授权 GitHub 并选择 `glp1-pipeline` 仓库
   - 构建设置:
     - Build command: (留空，纯静态)
     - Build output directory: `/`
   - 点击 **Save and Deploy**

3. **自定义域名**（可选）
   - 在 Pages 设置中添加自定义域名
   - 按照 Cloudflare 指引配置 DNS

### 方法二：直接上传

1. 压缩项目文件:
   ```bash
   cd /workspace/projects/workspace
   zip -r glp1-pipeline.zip glp1-pipeline/
   ```

2. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com) → **Pages**

3. 点击 **Create a project** → **Upload assets**

4. 拖拽上传压缩包或解压后的文件夹

5. 项目自动部署完成

## 📁 项目结构

```
glp1-pipeline/
├── index.html          # 主页面
├── css/
│   └── style.css       # 样式文件
├── js/
│   └── app.js          # 交互逻辑
├── data/
│   ├── pipeline.json   # 主数据文件
│   ├── china_companies.json    # 中国详细数据
│   ├── global_companies.json   # 全球详细数据
│   └── report_summary.md       # 数据摘要
└── README.md
```

## 🔄 数据更新

### 更新频率建议
- **月度更新**: 检查新产品、临床进展
- **季度更新**: 全面数据审查、重大里程碑
- **年度更新**: 架构优化、功能升级

### 更新步骤
1. 编辑 `data/pipeline.json`
2. 修改 `last_updated` 字段
3. 提交并推送至 GitHub
4. Cloudflare Pages 自动重新部署

## 🛠️ 本地开发

```bash
# 进入项目目录
cd glp1-pipeline

# 启动本地服务器（Python）
python3 -m http.server 8080

# 或使用 Node.js
npx serve .

# 访问 http://localhost:8080
```

## 🎯 功能特性

- ✅ 产品数据库（57款GLP-1产品）
- ✅ 交互式表格（排序、搜索、筛选）
- ✅ 多靶点产品标识（GCG三靶点⭐）
- ✅ 中国专区（红色高亮）
- ✅ 分周期减重数据对比
- ✅ 临床信息链接（NCT/CTR）
- ✅ 响应式设计（移动端适配）
- ✅ 数据可视化图表
- ✅ 产品对比功能
- ✅ 最新动态时间线

## 📊 数据来源

- [ClinicalTrials.gov](https://clinicaltrials.gov)
- [CDE官网](https://www.cde.org.cn)
- [中国临床试验登记平台](https://www.chinadrugtrials.org.cn)
- 各公司官方公告/年报
- 权威医药媒体报道

## 📝 数据字段说明

| 字段 | 说明 |
|------|------|
| `molecule_type` | 分子类型（单靶点/双靶点/三靶点） |
| `stage` | 管线阶段（已上市/NDA/临床I-III期） |
| `efficacy_data.weight_loss` | 减重数据（按周期） |
| `efficacy_data.nash` | NASH/脂肪肝相关数据 |
| `clinical_trials` | 临床试验信息（NCT/CTR） |
| `latest_update` | 最新里程碑节点 |

## 🤝 贡献

欢迎通过以下方式参与：
1. 提交 Issue 报告数据错误
2. 提交 PR 补充新产品信息
3. 建议新功能或改进

## 📄 许可

MIT License - 自由使用和修改

## 📧 联系

如有问题或建议，请通过 GitHub Issues 联系。

---

**数据截止日期**: 2025年3月10日  
**司美格鲁肽中国专利到期**: 2026年3月20日
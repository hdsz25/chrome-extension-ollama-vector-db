# Ollama Vector Database Extension

一个功能强大的 Chrome 浏览器扩展，用于捕获网页内容，通过本地 Ollama API 进行向量化，并存储到 ChromaDB 向量数据库中。支持语义搜索、内容管理和多服务器配置。

## ✨ 功能特性

- 📄 **网页内容捕获** - 一键捕获当前页面的完整内容
- 🔍 **语义搜索** - 基于向量相似度的智能搜索
- 🗂️ **集合管理** - 创建、重命名、删除 ChromaDB 集合
- 🌐 **多服务器支持** - 支持多个 ChromaDB 服务器
- 🤖 **模型选择** - 支持多种 Ollama 嵌入模型
- 📊 **内容管理** - 查看、删除已捕获的内容
- ⚙️ **灵活配置** - 可自定义服务器地址和模型参数
- 🎨 **现代化 UI** - 直观的用户界面和交互体验

## 📋 系统要求

### 必需服务

1. **Ollama** - 本地嵌入模型服务
   - 下载地址: https://ollama.ai
   - 默认端口: `11434`

2. **ChromaDB** - 向量数据库服务
   - 默认端口: `8000`
   - 支持 Docker 或 Python 安装

### 浏览器要求

- Chrome 88+ 或基于 Chromium 的浏览器（Edge、Brave 等）
- 支持 Manifest V3

## 🚀 快速开始

### 1. 安装 Ollama

```bash
# 下载并安装 Ollama
# 访问 https://ollama.ai 下载适合您操作系统的版本

# 启动 Ollama 服务
ollama serve

# 拉取嵌入模型（推荐）
ollama pull nomic-embed-text

# 其他可选模型
# ollama pull all-minilm
# ollama pull mxbai-embed-large
```

### 2. 启动 ChromaDB

#### 使用 Docker（推荐）

```bash
docker run -p 8000:8000 chromadb/chroma
```

#### 使用 Python

```bash
pip install chromadb
chroma run --host localhost --port 8000
```

### 3. 安装扩展

1. 下载或克隆项目代码
2. 打开 Chrome 浏览器，访问 `chrome://extensions/`
3. 启用"开发者模式"（右上角开关）
4. 点击"加载已解压的扩展程序"
5. 选择项目文件夹中的 `src` 目录
6. 扩展安装完成！

### 4. 配置扩展

1. 点击浏览器工具栏中的扩展图标
2. 进入"设置"标签页
3. 配置 Ollama 服务器地址（默认: `http://localhost:11434`）
4. 配置 ChromaDB 服务器地址（默认: `http://localhost:8000`）
5. 选择嵌入模型（默认: `nomic-embed-text`）
6. 点击"测试连接"确保服务正常运行

## 📖 使用指南

### 捕获网页内容

1. 打开想要捕获的网页
2. 点击扩展图标，选择"捕获"标签
3. 选择目标集合和服务器
4. 点击"捕获当前页面"按钮
5. 等待处理完成，内容将自动向量化并存储

### 搜索相似内容

1. 点击扩展图标，选择"搜索"标签
2. 选择要搜索的集合和服务器
3. 在搜索框中输入查询文本
4. 点击"搜索"或按 Enter 键
5. 查看按相关性排序的搜索结果

### 管理集合

1. 点击扩展图标，选择"管理"标签
2. 选择服务器后点击"刷新集合列表"
3. 可以执行以下操作：
   - 创建新集合
   - 重命名集合
   - 删除集合
   - 查看集合内容
   - 删除文档

### 配置设置

1. 点击扩展图标，选择"设置"标签
2. 配置以下选项：
   - **Ollama 服务器地址**: 嵌入模型服务地址
   - **ChromaDB 服务器**: 向量数据库地址
   - **嵌入模型**: 选择或自定义模型
   - **服务器管理**: 添加/删除 ChromaDB 服务器
3. 点击"保存设置"应用更改

## 🏗️ 项目结构

```
chrome-extension-ollama-vector-db/
├── src/
│   ├── manifest.json              # 扩展配置文件
│   ├── popup/                     # 弹出窗口
│   │   ├── popup.html            # HTML 结构
│   │   ├── popup.css             # 样式文件
│   │   └── popup.js              # 主逻辑
│   ├── content-scripts/           # 内容脚本
│   │   └── content-script.js     # 页面内容提取
│   ├── background/                # 后台服务
│   │   └── background.js         # Service Worker
│   ├── utils/                     # 工具函数
│   │   ├── ollama-client.js      # Ollama API 客户端
│   │   ├── chromadb-client.js    # ChromaDB API 客户端
│   │   ├── html-cleaner.js       # HTML 清理工具
│   │   └── storage.js            # Chrome Storage 封装
│   └── icons/                     # 图标资源
│       ├── icon16.png
│       ├── icon48.png
│       └── icon128.png
├── docs/                          # 文档目录
├── api/                           # API 文档
└── README.md                      # 项目说明
```

## 🔧 技术架构

### 核心组件

1. **Content Script** (`content-script.js`)
   - 提取页面 HTML 内容
   - 清理和处理文本
   - 提取元数据（标题、URL、时间戳）

2. **Background Service** (`background.js`)
   - 消息传递协调
   - 状态管理
   - API 调用调度

3. **Popup Interface** (`popup.js`)
   - 用户交互逻辑
   - 数据展示
   - 表单处理

4. **Utility Modules**
   - `ollama-client.js`: Ollama API 封装
   - `chromadb-client.js`: ChromaDB API 封装
   - `html-cleaner.js`: HTML 清理和转换
   - `storage.js`: Chrome Storage 管理

### 数据流程

```
用户操作
  ↓
Popup 界面
  ↓
Content Script (提取内容)
  ↓
HTML Cleaner (清理文本)
  ↓
Ollama Client (生成向量)
  ↓
ChromaDB Client (存储向量)
  ↓
完成/返回结果
```

## 🎯 API 参考

### Ollama API

#### 生成嵌入向量

```javascript
const embedding = await OllamaClient.generateEmbedding(
  'http://localhost:11434',
  '要向量化的文本',
  'nomic-embed-text'
);
```

#### 获取模型列表

```javascript
const models = await OllamaClient.getModels('http://localhost:11434');
```

#### 测试连接

```javascript
const status = await OllamaClient.testConnection('http://localhost:11434');
```

### ChromaDB API

#### 添加文档

```javascript
await ChromaDBClient.addDocument(
  'http://localhost:8000',
  'collection_name',
  {
    id: 'doc_id',
    content: '文档内容',
    embedding: [0.1, 0.2, ...],
    metadata: { title: '标题', url: 'http://...' }
  }
);
```

#### 查询文档

```javascript
const results = await ChromaDBClient.queryDocuments(
  'http://localhost:8000',
  'collection_name',
  {
    queryEmbeddings: [0.1, 0.2, ...],
    nResults: 5
  }
);
```

#### 获取集合列表

```javascript
const collections = await ChromaDBClient.getCollections('http://localhost:8000');
```

## 🔍 故障排除

### Ollama 连接失败

**问题**: 无法连接到 Ollama 服务器

**解决方案**:
```bash
# 检查 Ollama 是否运行
curl http://localhost:11434/api/tags

# 启动 Ollama 服务
ollama serve

# 检查模型是否安装
ollama list

# 安装所需模型
ollama pull nomic-embed-text
```

### ChromaDB 连接失败

**问题**: 无法连接到 ChromaDB 服务器

**解决方案**:
```bash
# 检查 ChromaDB 是否运行
curl http://localhost:8000/api/v2/heartbeat

# 使用 Docker 启动
docker run -p 8000:8000 chromadb/chroma

# 或使用 Python
chroma run --host localhost --port 8000
```

### 模型不可用

**问题**: 选择的模型无法使用

**解决方案**:
```bash
# 查看已安装的模型
ollama list

# 安装推荐的模型
ollama pull nomic-embed-text
ollama pull all-minilm
ollama pull mxbai-embed-large

# 检查模型详情
ollama show nomic-embed-text
```

### CORS 错误

**问题**: 跨域请求被阻止

**解决方案**:
```bash
# 启动 ChromaDB 时允许所有来源
chroma run --host 0.0.0.0 --port 8000

# 或使用 Docker 添加环境变量
docker run -p 8000:8000 \
  -e ALLOW_RESET=TRUE \
  chromadb/chroma
```

## 🎨 自定义配置

### 修改默认设置

编辑 `src/popup/popup.js` 中的 `currentSettings` 对象：

```javascript
let currentSettings = {
    ollamaUrl: 'http://localhost:11434',
    chromaUrl: 'http://localhost:8000',
    embeddingModel: 'nomic-embed-text',
    customModel: '',
    collectionName: 'webpages'
};
```

### 添加新的嵌入模型

1. 在 Ollama 中安装新模型：`ollama pull your-model`
2. 在扩展设置中点击"加载模型"
3. 从下拉列表中选择新模型

### 自定义 HTML 清理规则

编辑 `src/utils/html-cleaner.js` 中的清理函数：

```javascript
function cleanHTML(html) {
    // 添加自定义清理逻辑
    // ...
}
```

## 📊 性能优化

### 大型页面处理

- 扩展会自动分块处理大型页面
- 每个块独立向量化
- 支持进度显示

### 批量操作

- 支持批量添加文档
- 支持批量删除文档
- 自动延迟以避免服务器过载

### 缓存机制

- 集合 ID 缓存
- 模型列表缓存
- 减少重复请求

## 🔒 安全性

- 所有数据存储在本地
- 不发送数据到外部服务器
- 支持 CORS 配置
- 不存储敏感信息

## 🤝 贡献指南

欢迎贡献代码、报告问题或提出建议！

### 开发流程

1. Fork 项目
2. 创建特性分支：`git checkout -b feature/your-feature`
3. 提交更改：`git commit -m 'Add some feature'`
4. 推送到分支：`git push origin feature/your-feature`
5. 提交 Pull Request

### 代码规范

- 使用 ES6+ 语法
- 遵循现有代码风格
- 添加必要的注释
- 确保代码可读性

## 📝 更新日志

### v1.0.0 (当前版本)

- ✅ 初始版本发布
- ✅ 网页内容捕获功能
- ✅ 语义搜索功能
- ✅ 集合管理功能
- ✅ 多服务器支持
- ✅ 模型选择功能
- ✅ 内容管理功能
- ✅ 现代化 UI 设计

## 📄 许可证

MIT License - 详见 LICENSE 文件

## 🙏 致谢

- [Ollama](https://ollama.ai) - 本地 AI 模型服务
- [ChromaDB](https://www.trychroma.com) - 向量数据库
- [Chrome Extension API](https://developer.chrome.com/docs/extensions/) - 浏览器扩展框架

## 📧 联系方式

如有问题或建议，请通过以下方式联系：

- 提交 Issue
- 发送邮件
- 加入讨论区

## 🌟 支持

如果这个项目对你有帮助，请给一个 ⭐️ Star！

---

**Happy Coding! 🚀**
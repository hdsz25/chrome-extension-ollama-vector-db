# Ollama Vector Database Extension

一个功能完整的 Chrome 浏览器扩展，将**本地 Ollama 嵌入模型**与 **ChromaDB 向量数据库**结合，实现网页内容捕获、本地文件上传、语义搜索与集合管理，全程无需云服务，数据完全本地化。

---

## ✨ 功能概览

| 标签页 | 功能 |
|------|------|
| **捕获** | 一键抓取当前页面或选中文字，向量化后存入多个集合 |
| **搜索** | 向量语义搜索，结果附带可点击链接和内容摘要片段 |
| **上传** | 拖拽或多选本地文件批量嵌入，支持 PDF / TXT / MD / CSV / JSON / HTML |
| **管理** | 集合创建、重命名、删除，文档管理，一键去重 |
| **设置** | 多 ChromaDB 服务器、Ollama 地址、嵌入模型配置 |

**亮点特性**

- 🔁 **重复检测** — 捕获/上传前自动检测已有内容，提示覆盖或跳过
- 🗂️ **多集合** — 捕获和搜索均支持同时选择多个集合
- 📄 **PDF 支持** — 内置 PDF.js，逐页提取文本并自动分块嵌入
- 🖱️ **拖拽上传** — 直接将文件拖入上传区域，支持批量队列管理
- 🔍 **摘要控制** — 搜索结果显示内容片段，可自定义字数（默认 300 字）
- 🌐 **多服务器** — 可添加任意数量的 ChromaDB 服务器并随时切换
- 🧹 **去重清理** — 管理界面一键扫描并删除集合中的重复文档

---

## 📋 依赖服务

### 1. Ollama（本地嵌入模型）

```bash
# 访问 https://ollama.ai 下载安装

# ⚠️ 必须在启动前设置此变量，Chrome 扩展才能访问（CORS）
# Linux / macOS (手动启动)
export OLLAMA_ORIGINS=*
ollama serve

# Windows PowerShell
$env:OLLAMA_ORIGINS="*"; ollama serve

# Windows CMD
set OLLAMA_ORIGINS=* && ollama serve

# 拉取推荐的嵌入模型
ollama pull nomic-embed-text
```

**Linux / WSL (Systemd 后台服务运行时的跨域修复)**:
如果你在 Linux 或是 Windows WSL 中使用自动安装脚本安装，Ollama 会作为 systemd 后台服务运行。你需要修改 service 环境变量：

1. 执行 `sudo systemctl edit ollama.service`
2. 在 `### Anything between here and the comment below...` 提示语下方添加：
   ```ini
   [Service]
   Environment="OLLAMA_ORIGINS=*"
   ```
3. 保存后重启服务：
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl restart ollama
   ```

> 如果不设置 `OLLAMA_ORIGINS=*`，扩展连接 Ollama 进行嵌入向量 (`/api/embeddings`) 时会出现 `403 Forbidden` 的 CORS 错误，并且插件会报错提示“模型无法使用”。

### 2. ChromaDB（向量数据库）

```bash
# Docker（推荐）
docker run -p 8000:8000 chromadb/chroma

# 或 Python
pip install chromadb
chroma run --host localhost --port 8000
```

---

## 🚀 安装扩展

1. 克隆或下载本项目
2. 打开 Chrome，访问 `chrome://extensions/`
3. 启用右上角**开发者模式**
4. 点击**加载已解压的扩展程序**，选择项目的 `src/` 目录
5. 工具栏出现扩展图标即安装成功

---

## ⚙️ 首次配置

1. 点击扩展图标 → **设置**标签页
2. 输入 Ollama 地址（默认 `http://localhost:11434`），点击**测试**
3. 点击**加载模型**，从下拉列表中选择嵌入模型（推荐 `nomic-embed-text`）
4. 添加 ChromaDB 服务器地址（默认 `http://localhost:8000`），点击**测试**
5. 点击**保存设置**

> **ChromaDB 路径说明**：扩展固定使用 `default_tenant` / `default_database`，对应 API 路径 `api/v2/tenants/default_tenant/databases/default_database/...`。如需修改请编辑 `src/utils/chromadb-client.js`。

---

## 📖 使用指南

### 捕获网页

1. 打开目标页面
2. 点击扩展图标 → **捕获**标签
3. 选择服务器和集合（支持多选）
4. 点击**捕获当前页面**或**捕获选中内容**
5. 若该页面已存在，将弹窗询问是否覆盖更新

### 语义搜索

1. **搜索**标签 → 选择服务器和集合
2. 输入自然语言查询，按 Enter 或点击搜索
3. 结果按向量距离排序，网页 URL 可直接点击打开
4. 可在"摘要字数"输入框调整每条结果显示的内容长度

### 上传本地文件

1. **上传**标签 → 选择服务器和集合
2. 将文件**拖入拖放区**，或点击区域选择文件（支持多选）
3. 支持格式：`.pdf` `.txt` `.md` `.csv` `.json` `.html`
4. 确认文件队列后点击**上传并嵌入**
5. 大文件自动分块处理（每块 4000 字符，重叠 200 字符）；PDF 逐页提取文本

### 集合管理

- **管理**标签 → 选择服务器 → **刷新集合列表**
- **创建** / **重命名** / **删除**集合
- 选择集合后可查看所有文档，支持单条删除或**清空所有**
- 点击**删除重复**：自动扫描同来源的重复文档，保留最新版本并删除旧版本

---

## 🏗️ 项目结构

```
chrome-extension-ollama-vector-db/
├── src/
│   ├── manifest.json
│   ├── popup/
│   │   ├── popup.html          # UI 结构（5个标签页）
│   │   ├── popup.css           # 样式
│   │   └── popup.js            # 全部交互逻辑
│   ├── content-scripts/
│   │   └── content-script.js   # 页面内容提取
│   ├── background/
│   │   └── background.js       # Service Worker
│   ├── utils/
│   │   ├── ollama-client.js    # Ollama REST API 封装
│   │   ├── chromadb-client.js  # ChromaDB REST API 封装
│   │   ├── html-cleaner.js     # HTML → 纯文本清理
│   │   ├── storage.js          # Chrome Storage 封装
│   │   ├── pdf-reader.js       # PDF 文本提取（基于 PDF.js）
│   │   ├── pdf.min.mjs         # PDF.js 库（pdfjs-dist 5.6）
│   │   └── pdf.worker.min.mjs  # PDF.js Worker
│   └── icons/
│       ├── icon16.png
│       ├── icon48.png
│       └── icon128.png
├── docs/
├── api/
└── README.md
```

---

## 🔧 核心模块说明

### `chromadb-client.js`

| 方法 | 说明 |
|------|------|
| `getCollections(url)` | 获取集合列表 |
| `createCollection(url, name)` | 创建集合 |
| `deleteCollection(url, name)` | 删除集合 |
| `addDocument(url, col, doc)` | 添加文档（含嵌入向量） |
| `upsertDocument(url, col, doc)` | 更新或插入文档 |
| `checkDocumentExists(url, col, id)` | 检查文档是否存在 |
| `queryDocuments(url, col, query)` | 向量相似度查询 |
| `getDocuments(url, col, opts)` | 获取集合内文档列表 |
| `deleteDocument(url, col, id)` | 删除单条文档 |
| `findDuplicates(url, col)` | 按来源分组查找重复文档 |

### `pdf-reader.js`

懒加载 PDF.js（`pdf.min.mjs`），首次处理 PDF 时动态 `import()`，后续复用同一实例。提取时保留页码标注和换行信息。

---

## 🔍 常见问题

### 无法连接 Ollama
```
错误: CORS policy / Connection refused
```
- 确认已设置 `OLLAMA_ORIGINS=*` **后再**运行 `ollama serve`
- 检查 Ollama 是否运行：`curl http://localhost:11434/api/tags`
- 检查模型是否安装：`ollama list`

### 无法连接 ChromaDB
```
错误: Failed to fetch / HTTP 404
```
- 确认服务正在运行：`curl http://localhost:8000/api/v2/heartbeat`
- Docker 用户确认端口映射：`docker ps`

### PDF 上传失败
- 确认扩展已重新加载（`chrome://extensions/` → 刷新）
- 检查 PDF 是否为扫描件（纯图片 PDF 无可提取文字）
- 查看浏览器控制台（F12）中的详细错误

### 搜索结果为空
- 确认已选择正确的集合和服务器
- 确认嵌入模型与捕获时使用的模型一致
- 先到**管理**标签确认集合中有内容

---

## 🛡️ 隐私说明

- 所有数据处理**完全在本地完成**，不发送任何内容到外部服务器
- 网页内容存储在您自己的 ChromaDB 实例中
- 嵌入向量由本地 Ollama 模型生成

---

## 📄 许可证

MIT License


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

# ⚠️ 重要：配置环境变量以允许 Chrome 扩展访问
# 在启动 Ollama 之前，必须设置 OLLAMA_ORIGINS=* 环境变量
# 这将解决 Chrome 扩展的 CORS（跨域资源共享）问题

# Linux/macOS
export OLLAMA_ORIGINS=*
ollama serve

# Windows PowerShell
$env:OLLAMA_ORIGINS="*"
ollama serve

# Windows CMD
set OLLAMA_ORIGINS=*
ollama serve

# 拉取嵌入模型（推荐）
ollama pull nomic-embed-text

# 其他可选模型
# ollama pull all-minilm
# ollama pull mxbai-embed-large
```

**⚠️ 注意事项**：
- 必须在启动 `ollama serve` 之前设置 `OLLAMA_ORIGINS=*` 环境变量
- 如果不设置此变量，Chrome 扩展将无法连接到 Ollama 服务
- `*` 表示允许所有来源访问，仅在本地开发环境中使用
- 生产环境中建议限制为特定的扩展 ID

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

**⚠️ ChromaDB 配置说明**：
为了方便langchain 使用，扩展默认使用 `default_tenant` 作为 tenant 名称和 `default_database` 作为 database 名称。
- 扩展默认使用 `default_tenant` 作为 tenant 名称
- 扩展默认使用 `default_database` 作为 database 名称
- 如果您的 ChromaDB 使用不同的 tenant/database 名称，请修改 `src/utils/chromadb-client.js` 文件中的配置
- 所有 API 调用都使用 `api/v2/tenants/default_tenant/databases/default_database/...` 路径

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

**📊 搜索结果说明**：
- 搜索结果按余弦距离排序，距离越小表示越相似
- 余弦距离范围通常在 0-2 之间：
  - 0 表示完全相同
  - 1 表示不相关
  - 2 表示完全相反
- 每个结果显示：标题、URL、所属集合、余弦距离

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

**⚠️ 重要配置**：
- 所有 API 调用默认使用 `default_tenant` 作为 tenant
- 所有 API 调用默认使用 `default_database` 作为 database
- API 路径格式：`api/v2/tenants/default_tenant/databases/default_database/...`
- 如需修改，请编辑 `src/utils/chromadb-client.js` 文件

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
# 1. 检查 Ollama 是否运行
curl http://localhost:11434/api/tags

# 2. ⚠️ 检查是否设置了 OLLAMA_ORIGINS 环境变量
# 这是 Chrome 扩展连接 Ollama 的关键配置
# Linux/macOS
echo $OLLAMA_ORIGINS

# Windows PowerShell
echo $env:OLLAMA_ORIGINS

# Windows CMD
echo %OLLAMA_ORIGINS%

# 3. 如果未设置或设置不正确，重新启动 Ollama
# 先停止当前运行的 Ollama 服务（Ctrl+C）

# Linux/macOS
export OLLAMA_ORIGINS=*
ollama serve

# Windows PowerShell
$env:OLLAMA_ORIGINS="*"
ollama serve

# Windows CMD
set OLLAMA_ORIGINS=*
ollama serve

# 4. 检查模型是否安装
ollama list

# 5. 安装所需模型
ollama pull nomic-embed-text
```

**常见错误**：
- `CORS policy error` - 未设置 `OLLAMA_ORIGINS=*`
- `Connection refused` - Ollama 服务未运行
- `Model not found` - 模型未安装

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

#### Ollama CORS 配置

```bash
# ⚠️ Chrome 扩展连接 Ollama 必须设置此环境变量
export OLLAMA_ORIGINS=*
ollama serve

# 验证配置是否生效
curl -H "Origin: chrome-extension://test" http://localhost:11434/api/tags
```

#### ChromaDB CORS 配置

```bash
# 启动 ChromaDB 时允许所有来源
chroma run --host 0.0.0.0 --port 8000

# 或使用 Docker 添加环境变量
docker run -p 8000:8000 \
  -e ALLOW_RESET=TRUE \
  chromadb/chroma
```

**说明**：
- `OLLAMA_ORIGINS=*` 是必需的，Chrome 扩展无法连接到未配置此选项的 Ollama 服务
- `*` 表示允许所有来源，仅用于本地开发
- 生产环境建议限制为特定的扩展 ID

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

### 修改 ChromaDB Tenant 和 Database

如果您的 ChromaDB 使用不同的 tenant 或 database 名称，需要修改 `src/utils/chromadb-client.js` 文件：

```javascript
// 将所有的：
api/v2/tenants/default/databases/default/collections

// 替换为：
api/v2/tenants/your_tenant/databases/your_database/collections
```

例如，使用 `my_tenant` 和 `my_database`：
```javascript
const endpoint = `${url}api/v2/tenants/my_tenant/databases/my_database/collections`;
```

**⚠️ 注意**：
- 需要替换文件中所有出现 `tenants/default/databases/default` 的地方
- 共有 12 处需要修改
- 修改后重新加载扩展

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

**⚠️ 重要安全提醒**：
- `OLLAMA_ORIGINS=*` 环境变量允许所有来源访问 Ollama 服务
- 仅在受信任的本地开发环境中使用此配置
- 生产环境应限制为特定的扩展 ID，例如：
  ```bash
  export OLLAMA_ORIGINS="chrome-extension://your-extension-id"
  ```
- 确保 Ollama 和 ChromaDB 服务仅在内网运行
- 定期更新 Ollama 和 ChromaDB 到最新版本

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

### 最新改进

- ✅ 修复切换服务器后集合下拉框残留旧选项的问题
- ✅ 修复删除集合后所有页面下拉框不自动刷新的问题
- ✅ 修复删除服务器后集合下拉框不自动刷新的问题
- ✅ 搜索结果显示余弦距离而非百分比相似度
- ✅ 配置 ChromaDB 使用 `default_tenant` 和 `default_database`
- ✅ 添加 OLLAMA_ORIGINS 环境变量配置说明
- ✅ 优化集合选择逻辑，自动过滤无效选项
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
- 发送邮件 hdsz25@qq.com

## 🌟 支持

如果这个项目对你有帮助，请给一个 ⭐️ Star！

---

**Happy Coding! 🚀**
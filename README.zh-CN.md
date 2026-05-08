# SiYuan MCP Server

[SiYuan Note](https://b3log.org/siyuan/) 的 Model Context Protocol (MCP) 服务器。

让 AI 助手直接创建、读取、更新和管理你的思源笔记。

[English](README.md) | 简体中文

## 功能特性

- **笔记本管理** — 创建、重命名、打开/关闭和组织笔记本
- **文档操作** — 列出、创建、编辑、移动和删除文档
- **块级编辑** — 插入、前置、追加、更新、删除、移动、折叠/展开和查询内容块
- **数据库（属性视图）** — 创建表格、增删改行列
- **搜索与查询** — 全文搜索和 SQL 查询
- **文件操作** — 上传、下载、列出和管理资源文件
- **导出与转换** — 导出 Markdown、Pandoc 转换

## 安装

### 环境要求

- Node.js >= 18
- 已启用 API 的思源笔记服务端
- 思源 API Token（设置 → 关于 → API Token）

### NPM 安装

```bash
npm install -g siyuan-mcp-server
```

### NPX 运行（无需安装）

```bash
npx siyuan-mcp-server
```

## 配置

设置 `SIYUAN_TOKEN` 环境变量为你的思源 API Token。

可选：设置 `SIYUAN_API_URL`（默认：`http://localhost:6806`）。

### Claude Desktop 配置

在你的 Claude Desktop 配置文件中添加：

```json
{
  "mcpServers": {
    "siyuan": {
      "command": "npx",
      "args": ["-y", "siyuan-mcp-server"],
      "env": {
        "SIYUAN_TOKEN": "your-api-token"
      }
    }
  }
}
```

### 其他 MCP 客户端

任何支持 stdio 传输的 MCP 客户端均可使用，配置格式与上方类似。

## 可用命令

所有命令均以独立 MCP 工具形式暴露，同时支持通过 `executeCommand` 统一调度。

| 命名空间 | 说明 |
|----------|------|
| `av.*` | 数据库（属性视图）操作 |
| `block.*` | 块级增删改查、移动、折叠/展开、查询子块 |
| `filetree.*` | 文档列出/创建/重命名/删除/移动 |
| `notebook.*` | 笔记本管理 |
| `file.*` | 文件读写/列出 |
| `search.*` | 全文搜索 |
| `query.*` | SQL 查询和块查找 |
| `attr.*` | 块属性 |
| `assets.*` | 资源上传 |
| `export.*` | 导出 Markdown |
| `convert.*` | Pandoc 转换 |
| `system.*` | 系统信息 |
| `notification.*` | 推送消息 |
| `template.*` | 模板渲染 |
| `network.*` | 转发代理 |

### 笔记本命令

| 命令 | 说明 |
|------|------|
| `notebook.lsNotebooks` | 列出所有笔记本 |
| `notebook.openNotebook` | 打开已关闭的笔记本 |
| `notebook.closeNotebook` | 关闭笔记本 |
| `notebook.renameNotebook` | 重命名笔记本 |
| `notebook.createNotebook` | 创建新笔记本 |
| `notebook.removeNotebook` | 删除笔记本 |
| `notebook.getNotebookConf` | 获取笔记本配置 |
| `notebook.setNotebookConf` | 设置笔记本配置 |

### 文档命令

| 命令 | 说明 |
|------|------|
| `filetree.listDocsByPath` | 按路径列出笔记本中的文档 |
| `filetree.createDocWithMd` | 使用 Markdown 内容创建文档 |
| `filetree.renameDoc` | 重命名文档 |
| `filetree.removeDoc` | 删除文档 |
| `filetree.moveDocs` | 移动文档 |
| `filetree.getHPathByPath` | 通过路径获取可读路径 |
| `filetree.getHPathByID` | 通过 ID 获取可读路径 |

### 块命令

| 命令 | 说明 |
|------|------|
| `block.insertBlock` | 在指定块后插入块 |
| `block.prependBlock` | 在父块开头前置块 |
| `block.appendBlock` | 在父块末尾追加块 |
| `block.updateBlock` | 更新块内容 |
| `block.deleteBlock` | 删除块 |
| `block.moveBlock` | 移动块 |
| `block.getBlockKramdown` | 获取块 Kramdown 内容 |
| `block.getChildBlocks` | 获取父块的子块列表 |
| `block.foldBlock` | 折叠块 |
| `block.unfoldBlock` | 展开块 |

### 数据库操作（属性视图）

| 命令 | 说明 |
|------|------|
| `av.createAttributeView` | 创建新数据库表格 |
| `av.getAttributeView` | 查看数据库结构和数据 |
| `av.addRow` | 向数据库添加行 |
| `av.updateRow` | 更新行数据 |
| `av.deleteRow` | 删除行 |
| `av.addColumn` | 添加列 |
| `av.removeColumn` | 删除列 |
| `av.updateCell` | 更新单个单元格 |

### 搜索与查询

| 命令 | 说明 |
|------|------|
| `search.fullTextSearch` | 全文搜索 |
| `query.sql` | 执行 SQL 查询 |
| `query.block` | 通过 ID 查询单个块 |

### 文件与资源命令

| 命令 | 说明 |
|------|------|
| `file.getFile` | 获取文件内容 |
| `file.putFile` | 上传/写入文件 |
| `file.removeFile` | 删除文件 |
| `file.readDir` | 列出目录中的文件 |
| `assets.uploadAssets` | 上传资源文件 |

### 其他命令

| 命令 | 说明 |
|------|------|
| `attr.setBlockAttrs` | 设置块属性 |
| `attr.getBlockAttrs` | 获取块属性 |
| `export.exportMdContent` | 导出文档为 Markdown |
| `convert.pandoc` | 通过 Pandoc 转换文件 |
| `system.getVersion` | 获取思源版本 |
| `system.getCurrentTime` | 获取服务器当前时间 |
| `notification.pushMsg` | 推送通知消息 |
| `template.renderTemplate` | 渲染模板 |
| `network.forwardProxy` | 转发 HTTP 请求 |

## MCP 独立工具

除了 `executeCommand` 之外，以下独立的 MCP 工具也被注册，以便 LLM 直接发现：

- `queryCommands` — 列出可用命令
- `executeCommand` — 通过名称执行任意命令
- `help` — 获取指定命令的详细帮助
- `av.createAttributeView` / `av.getAttributeView` / `av.addRow` / `av.updateRow` / `av.deleteRow` / `av.addColumn` / `av.removeColumn` / `av.updateCell`

## 开发

```bash
npm install
npm run build
npm test
npm run dev
```

### 更新后重新安装

- **NPX 用户**：无需操作 — `npx` 会自动拉取最新发布的版本。
- **NPM 全局安装**：再次运行 `npm install -g siyuan-mcp-server` 即可升级。
- **本地源码/开发**：拉取代码后运行 `npm run build` 重新编译。

## 致谢

本项目基于 [Fromsko](https://github.com/fromsko) 的 [siyuan-mcp-server](https://github.com/fromsko/siyuan-mcp-server)，而该项目又建立在 [onigeya](https://github.com/onigeya/siyuan-mcp-server) 的早期工作之上。

主要修改和增强包括：
- 数据库（属性视图）创建和完整的 CRUD 支持
- 修复 `file.getFile` 和 `file.putFile` 命令
- 独立的 MCP 工具注册，提升 LLM 可发现性
- 新增 `filetree.listDocsByPath`、`block.prependBlock`、`block.appendBlock`、`block.getChildBlocks`、`block.foldBlock`、`block.unfoldBlock`

## 许可证

MIT

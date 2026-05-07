# SiYuan MCP Server

[SiYuan Note](https://b3log.org/siyuan/) 的 Model Context Protocol (MCP) 服务器。

让 AI 助手直接创建、读取、更新和管理你的思源笔记。

[English](README.md) | 简体中文

## 功能特性

- **笔记本管理** — 创建、重命名和组织笔记本
- **文档操作** — 创建、编辑、移动和删除文档
- **块级编辑** — 插入、更新和删除内容块
- **数据库（属性视图）** — 创建表格、增删改行列
- **搜索与查询** — 全文搜索和 SQL 查询
- **文件操作** — 上传、下载和管理资源文件

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
| `block.*` | 块的插入/更新/删除/移动 |
| `filetree.*` | 文档的创建/重命名/删除/移动 |
| `notebook.*` | 笔记本管理 |
| `file.*` | 文件读写 |
| `search.*` | 全文搜索 |
| `sql.*` | SQL 查询 |

### 数据库操作（新增）

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

### 支持的列类型

- `text` — 文本
- `number` — 数字
- `date` — 日期（支持 ISO 字符串自动转换）
- `select` — 单选
- `mSelect` — 多选
- `url` — 链接
- `email` — 邮箱
- `phone` — 电话
- `checkbox` — 复选框

## 开发

```bash
npm install
npm run build
npm test
npm run dev
```

## 致谢

本项目基于 [Fromsko](https://github.com/fromsko) 的 [siyuan-mcp-server](https://github.com/fromsko/siyuan-mcp-server)，而该项目又建立在 [onigeya](https://github.com/onigeya/siyuan-mcp-server) 的早期工作之上。

主要修改和增强包括：
- 数据库（属性视图）创建和完整的 CRUD 支持
- 修复 `file.getFile` 和 `file.putFile` 命令
- 独立的 MCP 工具注册，提升 LLM 可发现性

## 许可证

MIT

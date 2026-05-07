# SiYuan MCP Server

English | [简体中文](README.zh-CN.md)

Model Context Protocol (MCP) server for [SiYuan Note](https://b3log.org/siyuan/).

Enable AI assistants to create, read, update, and manage your SiYuan notes directly.

## Features

- **Notebook Management** — Create, rename, and organize notebooks
- **Document Operations** — Create, edit, move, and delete documents
- **Block-level Editing** — Insert, update, and delete content blocks
- **Database (Attribute View)** — Create tables, add/update/delete rows and columns
- **Search & Query** — Full-text search and SQL queries
- **File Operations** — Upload, download, and manage assets

## Installation

### Requirements

- Node.js >= 18
- SiYuan Note running with API enabled
- SiYuan API Token (Settings → About → API Token)

### NPM

```bash
npm install -g siyuan-mcp-server
```

### NPX (no install)

```bash
npx siyuan-mcp-server
```

## Configuration

Set the `SIYUAN_TOKEN` environment variable to your SiYuan API token.

Optional: set `SIYUAN_API_URL` (default: `http://localhost:6806`).

### Claude Desktop

Add to your Claude Desktop config:

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

## Available Commands

All commands are exposed both as standalone MCP tools and via the `executeCommand` dispatcher.

| Namespace | Description |
|-----------|-------------|
| `av.*` | Database (Attribute View) operations |
| `block.*` | Block insert/update/delete/move |
| `filetree.*` | Document create/rename/remove/move |
| `notebook.*` | Notebook management |
| `file.*` | File read/write |
| `search.*` | Full-text search |
| `sql.*` | SQL queries |

### Database Operations (New)

| Command | Description |
|---------|-------------|
| `av.createAttributeView` | Create a new database table |
| `av.getAttributeView` | View database structure and rows |
| `av.addRow` | Add rows to a database |
| `av.updateRow` | Update row values |
| `av.deleteRow` | Delete rows |
| `av.addColumn` | Add a column |
| `av.removeColumn` | Remove a column |
| `av.updateCell` | Update a single cell |

## Development

```bash
npm install
npm run build
npm test
npm run dev
```

## Attribution

This project is based on the original [siyuan-mcp-server](https://github.com/fromsko/siyuan-mcp-server) by [Fromsko](https://github.com/fromsko), which in turn builds upon earlier work by [onigeya](https://github.com/onigeya/siyuan-mcp-server).

Significant modifications and enhancements have been made, including:
- Database (Attribute View) creation and full CRUD support
- Fixed `file.getFile` and `file.putFile` commands
- Independent MCP tool registration for better LLM discoverability

## License

MIT

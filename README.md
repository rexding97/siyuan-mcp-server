# SiYuan MCP Server

English | [简体中文](README.zh-CN.md)

Model Context Protocol (MCP) server for [SiYuan Note](https://b3log.org/siyuan/).

Enable AI assistants to create, read, update, and manage your SiYuan notes directly.

## Features

- **Notebook Management** — Create, rename, open/close, and organize notebooks
- **Document Operations** — List, create, edit, move, and delete documents
- **Block-level Editing** — Insert, prepend, append, update, delete, move, fold/unfold, and query content blocks
- **Database (Attribute View)** — Create tables, add/update/delete rows and columns
- **Search & Query** — Full-text search and SQL queries
- **File Operations** — Upload, download, list, and manage assets
- **Export & Conversion** — Export Markdown, Pandoc conversion

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
| `block.*` | Block-level CRUD, move, fold/unfold, query children |
| `filetree.*` | Document list/create/rename/remove/move |
| `notebook.*` | Notebook management |
| `file.*` | File read/write/list |
| `search.*` | Full-text search |
| `query.*` | SQL queries and block lookup |
| `attr.*` | Block attributes |
| `assets.*` | Asset upload |
| `export.*` | Export Markdown |
| `convert.*` | Pandoc conversion |
| `system.*` | System info |
| `notification.*` | Push messages |
| `template.*` | Template rendering |
| `network.*` | Forward proxy |

### Notebook Commands

| Command | Description |
|---------|-------------|
| `notebook.lsNotebooks` | List all notebooks |
| `notebook.openNotebook` | Open a closed notebook |
| `notebook.closeNotebook` | Close a notebook |
| `notebook.renameNotebook` | Rename a notebook |
| `notebook.createNotebook` | Create a new notebook |
| `notebook.removeNotebook` | Remove a notebook |
| `notebook.getNotebookConf` | Get notebook configuration |
| `notebook.setNotebookConf` | Set notebook configuration |

### Document Commands

| Command | Description |
|---------|-------------|
| `filetree.listDocsByPath` | List documents in a notebook by path |
| `filetree.createDocWithMd` | Create a document with Markdown content |
| `filetree.renameDoc` | Rename a document |
| `filetree.removeDoc` | Remove a document |
| `filetree.moveDocs` | Move documents |
| `filetree.getHPathByPath` | Get human-readable path by path |
| `filetree.getHPathByID` | Get human-readable path by ID |

### Block Commands

| Command | Description |
|---------|-------------|
| `block.insertBlock` | Insert a block after a specific block |
| `block.prependBlock` | Prepend blocks to a parent block |
| `block.appendBlock` | Append blocks to a parent block |
| `block.updateBlock` | Update block content |
| `block.deleteBlock` | Delete a block |
| `block.moveBlock` | Move a block |
| `block.getBlockKramdown` | Get block Kramdown content |
| `block.getChildBlocks` | Get child blocks of a parent block |
| `block.foldBlock` | Fold a block |
| `block.unfoldBlock` | Unfold a block |

### Database Operations (Attribute View)

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

### Search & Query

| Command | Description |
|---------|-------------|
| `search.fullTextSearch` | Full-text search across notes |
| `query.sql` | Execute SQL query on the database |
| `query.block` | Query a single block by ID |

### File & Asset Commands

| Command | Description |
|---------|-------------|
| `file.getFile` | Get file content |
| `file.putFile` | Upload/write a file |
| `file.removeFile` | Remove a file |
| `file.readDir` | List files in a directory |
| `assets.uploadAssets` | Upload asset files |

### Other Commands

| Command | Description |
|---------|-------------|
| `attr.setBlockAttrs` | Set block attributes |
| `attr.getBlockAttrs` | Get block attributes |
| `export.exportMdContent` | Export document as Markdown |
| `convert.pandoc` | Convert files via Pandoc |
| `system.getVersion` | Get SiYuan version |
| `system.getCurrentTime` | Get server current time |
| `notification.pushMsg` | Push a notification message |
| `template.renderTemplate` | Render a template |
| `network.forwardProxy` | Forward HTTP request via proxy |

## MCP Tools

In addition to `executeCommand`, the following standalone MCP tools are registered for direct LLM discoverability:

- `queryCommands` — List available commands
- `executeCommand` — Execute any command by name
- `help` — Get detailed help for a specific command
- `av.createAttributeView` / `av.getAttributeView` / `av.addRow` / `av.updateRow` / `av.deleteRow` / `av.addColumn` / `av.removeColumn` / `av.updateCell`

## Development

```bash
npm install
npm run build
npm test
npm run dev
```

### Reinstalling after updates

- **NPX users**: No action needed — `npx` always fetches the latest published version.
- **NPM global install**: Run `npm install -g siyuan-mcp-server` again to upgrade.
- **Local source / development**: Run `npm run build` after pulling changes.

## Attribution

This project is based on the original [siyuan-mcp-server](https://github.com/fromsko/siyuan-mcp-server) by [Fromsko](https://github.com/fromsko), which in turn builds upon earlier work by [onigeya](https://github.com/onigeya/siyuan-mcp-server).

Significant modifications and enhancements have been made, including:
- Database (Attribute View) creation and full CRUD support
- Fixed `file.getFile` and `file.putFile` commands
- Independent MCP tool registration for better LLM discoverability
- Added `filetree.listDocsByPath`, `block.prependBlock`, `block.appendBlock`, `block.getChildBlocks`, `block.foldBlock`, `block.unfoldBlock`

## License

MIT

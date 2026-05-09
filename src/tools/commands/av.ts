import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { client } from '../../utils/client.js';
import { registry } from '../../utils/registry.js';
import { CommandHandler } from '../../utils/registry.js';
import { generateSiyuanId, getTimestamp, getSiyuanTimestamp } from '../../utils/siyuan-id.js';

const namespace = 'av';

// Supported column types
const columnTypeEnum = z.enum([
    'text', 'number', 'date', 'select', 'mSelect',
    'url', 'email', 'phone', 'checkbox'
]);

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if renderAttributeView returned usable structured data.
 * A valid response must have actual column definitions (more than just the
 * two default system columns '主键' and '单选') or real row/keyValue data.
 */
export function hasUsableAvData(data: any): boolean {
    if (!data) return false;
    const view = data.view || data.av?.view;
    const rows = view?.rows;
    const keyValues = data.keyValues || data.av?.keyValues;

    // Has actual column definitions (more than default 2 columns)
    if (Array.isArray(view?.columns) && view.columns.length > 2) return true;
    // Has keyValues with real column definitions (more than default 2)
    if (Array.isArray(keyValues) && keyValues.length > 2) return true;
    // Has actual row data
    if (Array.isArray(rows) && rows.length > 0) return true;

    return false;
}

/**
 * Fallback: query blocks table via SQL when API returns av: null
 */
async function fetchAvContentViaSql(avID: string): Promise<{ content: string; type: string; ial: string } | null> {
    try {
        const result = await client.post('/api/query/sql', {
            stmt: `SELECT id, content, type, ial FROM blocks WHERE id = '${avID}'`
        });
        if (result.code !== 0 || !result.data || result.data.length === 0) {
            return null;
        }
        const row = result.data[0];
        return {
            content: row.content || '',
            type: row.type || '',
            ial: row.ial || ''
        };
    } catch {
        return null;
    }
}

/**
 * If the given id is a block ID, resolve the real av-id from its DOM.
 * Returns the resolved avID (may be the same as input if it already is an avID).
 */
async function resolveAvID(id: string): Promise<string> {
    // Quick check: if getAttributeView returns real columns, it's already an avID
    try {
        const result = await client.post('/api/av/getAttributeView', { id });
        if (result.code === 0 && result.data?.av?.keyValues && result.data.av.keyValues.length > 2) {
            return id;
        }
    } catch { /* ignore */ }

    // Try to parse av-id from the block's DOM
    try {
        const domResult = await client.post('/api/block/getBlockDOM', { id });
        const dom = domResult.data?.dom || '';
        const match = dom.match(/data-av-id="([^"]+)"/);
        if (match && match[1] && match[1] !== id) {
            return match[1];
        }
    } catch { /* ignore */ }

    return id;
}

/**
 * Fetch Attribute View data with blockID -> avID auto-resolution.
 * Returns { data, avID } where avID is the resolved (real) av ID.
 */
async function fetchAvData(id: string, viewID?: string): Promise<{ data: any; avID: string }> {
    const req: any = { id };
    if (viewID) req.viewID = viewID;

    const result = await client.post('/api/av/renderAttributeView', req);
    if (result.code !== 0) {
        throw new Error(result.msg || 'Failed to get attribute view');
    }

    if (hasUsableAvData(result.data)) {
        return { data: result.data, avID: id };
    }

    // Fallback: the id may be a block ID; resolve real av-id from DOM
    const resolvedAvID = await resolveAvID(id);
    if (resolvedAvID !== id) {
        const retryReq: any = { id: resolvedAvID };
        if (viewID) retryReq.viewID = viewID;
        const retry = await client.post('/api/av/renderAttributeView', retryReq);
        if (retry.code !== 0) {
            throw new Error(retry.msg || 'Failed to get attribute view');
        }
        if (hasUsableAvData(retry.data)) {
            return { data: retry.data, avID: resolvedAvID };
        }
        return { data: retry.data, avID: resolvedAvID };
    }

    return { data: result.data, avID: id };
}

/**
 * Get column info from an Attribute View
 * Returns a Map: columnName -> { keyID, type, name }
 */
async function getColumnInfo(avID: string): Promise<Map<string, { keyID: string; type: string; name: string }>> {
    const { data } = await fetchAvData(avID);

    if (!hasUsableAvData(data)) {
        throw new Error(`Attribute View ${avID} 无法通过 API 获取结构（可能返回 av: null）。该数据库存在内部索引问题，建议通过 SQL 查询原始内容。`);
    }

    let columns = (data as any)?.view?.columns || [];

    // Fallback: if columns are empty, try keyValues
    if (columns.length === 0 && (data as any)?.keyValues) {
        columns = buildColumnsFromKeyValues((data as any).keyValues);
    }

    const map = new Map<string, { keyID: string; type: string; name: string }>();
    for (const col of columns) {
        if (col.name && col.id) {
            map.set(col.name, { keyID: col.id, type: col.type, name: col.name });
        }
    }
    return map;
}

/**
 * Convert user-friendly value to API value format (for setAttributeViewBlockAttr)
 */
function toApiValue(type: string, value: any): any {
    switch (type) {
        case 'block':
            return { type: 'block', block: { content: value !== undefined ? String(value) : '' } };
        case 'text':
        case 'url':
        case 'email':
        case 'phone':
            return { type, text: { content: value !== undefined ? String(value) : '' } };
        case 'number': {
            const num = value !== undefined ? Number(value) : NaN;
            return { type: 'number', number: { content: num, isNotEmpty: !isNaN(num) } };
        }
        case 'date': {
            let ts = 0;
            let isNotEmpty = false;
            if (value) {
                const d = new Date(value);
                if (!isNaN(d.getTime())) {
                    ts = d.getTime();
                    isNotEmpty = true;
                }
            }
            return {
                type: 'date',
                date: { content: ts, isNotEmpty, hasEndDate: false, isNotTime: true, content2: 0, isNotEmpty2: false, formattedContent: '' }
            };
        }
        case 'select': {
            const val = value !== undefined ? String(value) : '';
            return { type: 'select', mSelect: val ? [{ content: val, color: '1' }] : [] };
        }
        case 'mSelect': {
            const vals = Array.isArray(value) ? value : (value ? [value] : []);
            return { type: 'mSelect', mSelect: vals.filter(Boolean).map((v: string) => ({ content: v, color: '1' })) };
        }
        case 'checkbox': {
            return { type: 'checkbox', checkbox: { checked: value === true || value === 'true' } };
        }
        default:
            return { type: 'text', text: { content: value !== undefined ? String(value) : '' } };
    }
}

/**
 * Build full av.Value object for appendAttributeViewDetachedBlocksWithValues
 */
function toFullAvValue(type: string, id: string, keyID: string, blockID: string, value: any, timestamp: number): any {
    const base: any = { id, keyID, blockID, type, createdAt: timestamp, updatedAt: timestamp };

    switch (type) {
        case 'block': {
            return {
                ...base,
                isDetached: true,
                block: {
                    content: value !== undefined ? String(value) : '',
                    created: timestamp,
                    updated: timestamp
                }
            };
        }
        case 'text':
        case 'url':
        case 'email':
        case 'phone': {
            return { ...base, text: { content: value !== undefined ? String(value) : '' } };
        }
        case 'number': {
            const num = value !== undefined ? Number(value) : NaN;
            const isNotEmpty = !isNaN(num);
            return { ...base, number: { content: isNotEmpty ? num : 0, isNotEmpty } };
        }
        case 'date': {
            let ts = 0;
            let isNotEmpty = false;
            if (value) {
                const d = new Date(value);
                if (!isNaN(d.getTime())) {
                    ts = d.getTime();
                    isNotEmpty = true;
                }
            }
            return {
                ...base,
                date: { content: ts, isNotEmpty, hasEndDate: false, isNotTime: true, content2: 0, isNotEmpty2: false, formattedContent: '' }
            };
        }
        case 'select': {
            const val = value !== undefined ? String(value) : '';
            return { ...base, mSelect: val ? [{ content: val, color: '1' }] : [] };
        }
        case 'mSelect': {
            const vals = Array.isArray(value) ? value : (value ? [value] : []);
            return { ...base, mSelect: vals.filter(Boolean).map((v: string) => ({ content: v, color: '1' })) };
        }
        case 'checkbox': {
            return { ...base, checkbox: { checked: value === true || value === 'true' } };
        }
        default: {
            return { ...base, text: { content: value !== undefined ? String(value) : '' } };
        }
    }
}

/**
 * Format a cell value for display
 */
function formatCellValue(value: any): string {
    if (!value) return '';
    const v = value.value || value;
    if (!v) return '';
    if (v.block) return v.block.content || '';
    if (v.text) return v.text.content || '';
    if (v.number) return String(v.number.content ?? '');
    if (v.date) {
        if (!v.date.isNotEmpty) return '';
        return new Date(v.date.content).toISOString().split('T')[0];
    }
    if (v.mSelect) return v.mSelect.map((m: any) => m.content).join(', ');
    if (v.checkbox) return v.checkbox.checked ? '✓' : '✗';
    return '';
}

/**
 * Build rows from keyValues when view.rows is empty or unavailable.
 * Exported for testing.
 *
 * keyValues format: [{ key: {id, name, type}, values: [{id, keyID, blockID, type, text|number|...}] }]
 */
export function buildRowsFromKeyValues(keyValues: any[]): any[] {
    const rowMap = new Map<string, { id: string; cells: any[] }>();
    for (const kv of keyValues) {
        for (const value of kv.values || []) {
            const blockID = value.blockID;
            if (!blockID) continue;
            if (!rowMap.has(blockID)) {
                rowMap.set(blockID, { id: blockID, cells: [] });
            }
            rowMap.get(blockID)!.cells.push({ value });
        }
    }
    return Array.from(rowMap.values());
}

/**
 * Build columns from keyValues when view.columns is empty or unavailable.
 * Exported for testing.
 */
export function buildColumnsFromKeyValues(keyValues: any[]): any[] {
    return keyValues
        .map((kv: any) => kv.key)
        .filter((k: any) => k && k.id);
}

/**
 * Format Attribute View data for display.
 * Supports both nested (data.av) and flat (data directly) structures.
 * Exported for testing.
 */
export function formatAttributeView(data: any): string {
    const av = data || {};
    // Support both flat and nested structures
    const view = av.view || av.av?.view || {};
    let columns = view.columns || [];
    let rows = view.rows || [];

    // Fallback: if rows/columns are empty but keyValues exist, build from keyValues
    const keyValues = av.keyValues || av.av?.keyValues || [];
    if (rows.length === 0 && keyValues.length > 0) {
        rows = buildRowsFromKeyValues(keyValues);
    }
    if (columns.length === 0 && keyValues.length > 0) {
        columns = buildColumnsFromKeyValues(keyValues);
    }

    const name = av.name || av.av?.name || 'N/A';
    const id = av.id || av.av?.id || 'N/A';

    let output = `数据库: ${name}\n`;
    output += `ID: ${id}\n`;
    output += `视图: ${view.name || 'N/A'}${view.type ? ` (${view.type})` : ''}\n`;
    output += `列 (${columns.length}):\n`;
    for (const col of columns) {
        const optStr = col.options ? ` [选项: ${col.options.map((o: any) => o.name).join(', ')}]` : '';
        output += `  - ${col.name || 'N/A'} (${col.type || 'N/A'}${optStr}) [keyID: ${col.id || 'N/A'}]\n`;
    }
    output += `行 (${rows.length}):\n`;
    for (const row of rows) {
        output += `  [${row.id || 'N/A'}]\n`;
        for (const cell of row.cells || []) {
            // Support both cell.value.keyID and cell.keyID (direct value object)
            const keyID = cell.value?.keyID || cell.keyID;
            const col = columns.find((c: any) => c.id === keyID);
            if (col) {
                const cellVal = formatCellValue(cell);
                output += `    ${col.name}: ${cellVal || '(空)'}\n`;
            }
        }
    }
    return output;
}

// ============================================================================
// Build Attribute View JSON (for createAttributeView)
// ============================================================================

function buildAttributeView(
    avID: string,
    name: string,
    viewID: string,
    tableID: string,
    blockColumnName: string,
    columns: Array<{ id: string; name: string; type: string; options?: Array<{ name: string; color?: string }> }>,
    rows: Array<Record<string, any>>
) {
    const timestamp = getTimestamp();
    const allColumns = [
        {
            id: generateSiyuanId(),
            name: blockColumnName,
            type: 'block',
            icon: '',
            desc: '',
            numberFormat: '',
            template: ''
        },
        ...columns.map(col => ({
            id: col.id,
            name: col.name,
            type: col.type,
            icon: '',
            desc: '',
            ...(col.options && col.options.length > 0 ? {
                options: col.options.map((opt, idx) => ({
                    name: opt.name,
                    color: opt.color || String((idx % 13) + 1),
                    desc: ''
                }))
            } : {}),
            numberFormat: '',
            template: ''
        }))
    ];

    const rowBlockIDs = rows.map(() => generateSiyuanId());

    const keyValues = allColumns.map(col => {
        const values = rows.map((row, rowIdx) => {
            const blockID = rowBlockIDs[rowIdx];
            const valueId = generateSiyuanId();
            const cellValue = row[col.name];
            return toFullAvValue(col.type, valueId, col.id, blockID, cellValue, timestamp);
        });

        return {
            key: {
                id: col.id,
                name: col.name,
                type: col.type,
                icon: col.icon,
                desc: col.desc,
                ...((col as any).options ? { options: (col as any).options } : {}),
                numberFormat: col.numberFormat,
                template: col.template
            },
            values
        };
    });

    return {
        spec: 4,
        id: avID,
        name,
        keyValues,
        keyIDs: null,
        viewID,
        views: [
            {
                id: viewID,
                icon: '',
                name: '表格',
                hideAttrViewName: false,
                desc: '',
                pageSize: 50,
                type: 'table',
                table: {
                    spec: 0,
                    id: tableID,
                    showIcon: true,
                    wrapField: false,
                    columns: allColumns.map(col => ({
                        id: col.id,
                        wrap: false,
                        hidden: false,
                        pin: false,
                        width: ''
                    })),
                    rowIds: null
                },
                itemIds: rowBlockIDs,
                groupCreated: 0,
                groupItemIds: null,
                groupFolded: false,
                groupHidden: 0,
                groupSort: 0
            }
        ]
    };
}

// ============================================================================
// Command: createAttributeView
// ============================================================================

const createAttributeViewParams = z.object({
    notebook: z.string().describe('Notebook ID'),
    docID: z.string().describe('Document ID to insert the database into'),
    name: z.string().describe('Database name'),
    blockColumnName: z.string().optional().describe('Name of the primary block column (default: 名称)'),
    columns: z.array(
        z.object({
            name: z.string().describe('Column name'),
            type: columnTypeEnum.describe('Column type'),
            options: z.array(
                z.object({
                    name: z.string(),
                    color: z.string().optional()
                })
            ).optional().describe('Options for select/mSelect columns')
        })
    ).optional().describe('Additional columns besides the block column'),
    rows: z.array(z.record(z.any())).optional().describe('Initial row data, where keys are column names')
});

type CreateAttributeViewParams = z.infer<typeof createAttributeViewParams>;

const createAttributeViewHandler: CommandHandler<CreateAttributeViewParams> = {
    namespace,
    name: 'createAttributeView',
    description: 'Create a new database (Attribute View) in a SiYuan document',
    params: createAttributeViewParams,
    handler: async (params) => {
        try {
            const avID = generateSiyuanId();
            const viewID = generateSiyuanId();
            const tableID = generateSiyuanId();
            const avBlockID = generateSiyuanId();

            const blockColumnName = params.blockColumnName ?? '名称';
            const columns = params.columns ?? [];
            const rows = params.rows ?? [];

            const columnsWithIds = columns.map(col => ({
                ...col,
                id: generateSiyuanId()
            }));

            const avData = buildAttributeView(avID, params.name, viewID, tableID, blockColumnName, columnsWithIds, rows);

            const avPath = `/data/storage/av/${avID}.json`;
            const avJson = JSON.stringify(avData);
            const putAvResult = await client.putFile(avPath, avJson);
            if (putAvResult.code !== 0) {
                return { content: [{ type: 'text', text: `Failed to create AV file: ${putAvResult.msg}` }], isError: true };
            }

            // Use insertBlock DOM mode to insert NodeAttributeView into the document.
            // Direct .sy file modification does not refresh the kernel's in-memory cache,
            // especially in Docker environments where file watching may not work.
            const dom = `<div data-node-id="${avBlockID}" data-type="NodeAttributeView" data-av-id="${avID}" data-av-type="table" custom-sy-av-view="${viewID}"></div>`;
            const insertResult = await client.post('/api/block/insertBlock', {
                dataType: 'dom',
                data: dom,
                parentID: params.docID
            });
            if (insertResult.code !== 0) {
                return { content: [{ type: 'text', text: `Failed to insert AV block: ${insertResult.msg}` }], isError: true };
            }

            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        code: 0,
                        msg: 'Attribute View created successfully',
                        data: { avID, blockID: avBlockID, viewID, name: params.name, columns: columnsWithIds.length + 1, rows: rows.length }
                    })
                }]
            };
        } catch (error) {
            return {
                content: [{ type: 'text', text: `Error creating Attribute View: ${error instanceof Error ? error.message : String(error)}` }],
                isError: true
            };
        }
    },
    documentation: {
        description: 'Create a new database (Attribute View) in a SiYuan document. Writes the AV definition to storage/av/{avID}.json and inserts a NodeAttributeView block into the document.',
        params: {
            notebook: { type: 'string', description: 'Notebook ID', required: true },
            docID: { type: 'string', description: 'Document ID to insert the database into', required: true },
            name: { type: 'string', description: 'Database name', required: true },
            blockColumnName: { type: 'string', description: 'Name of the primary block column', required: false },
            columns: { type: 'array', description: 'Additional columns besides the block column', required: false },
            rows: { type: 'array', description: 'Initial row data, where keys are column names', required: false }
        },
        returns: {
            type: 'object',
            description: 'Operation result',
            properties: { avID: 'Attribute View ID', blockID: 'Block ID in the document', viewID: 'Default view ID', name: 'Database name', columns: 'Number of columns', rows: 'Number of rows' }
        },
        examples: [{
            description: 'Create a simple database with text and date columns',
            params: {
                notebook: '20210817205410-2kvfpfn',
                docID: '20210817205410-2kvfpfn',
                name: 'My Database',
                blockColumnName: 'Name',
                columns: [
                    { name: 'Status', type: 'select', options: [{ name: 'Active', color: '1' }, { name: 'Inactive', color: '2' }] },
                    { name: 'Due Date', type: 'date' }
                ]
            },
            response: {
                code: 0,
                msg: 'Attribute View created successfully',
                data: { avID: '20260507181650-gpei1jl', blockID: '20260507181642-41unzk9', viewID: '20260507181651-orh9o8r', name: 'My Database', columns: 3, rows: 0 }
            }
        }],
        apiLink: 'https://github.com/siyuan-note/siyuan/blob/master/API.md'
    }
};

// ============================================================================
// Command: getAttributeView
// ============================================================================

const getAttributeViewParams = z.object({
    avID: z.string().describe('Attribute View ID'),
    viewID: z.string().optional().describe('View ID (optional)'),
    page: z.number().optional().describe('Page number (default: 1)'),
    pageSize: z.number().optional().describe('Page size (default: 50)')
});

type GetAttributeViewParams = z.infer<typeof getAttributeViewParams>;

const getAttributeViewHandler: CommandHandler<GetAttributeViewParams> = {
    namespace,
    name: 'getAttributeView',
    description: 'Get database (Attribute View) structure and data',
    params: getAttributeViewParams,
    handler: async (params) => {
        try {
            const { data, avID } = await fetchAvData(params.avID, params.viewID);

            // If API still returns no usable structure after blockID->avID resolution, fallback to SQL
            if (!hasUsableAvData(data)) {
                const sqlRow = await fetchAvContentViaSql(avID);
                if (sqlRow) {
                    let output = `数据库 ID: ${params.avID}\n`;
                    if (avID !== params.avID) {
                        output += `解析后的 avID: ${avID}\n`;
                    }
                    output += `块类型: ${sqlRow.type || 'N/A'}\n`;
                    output += `[注意：renderAttributeView API 返回空壳结构，以下通过 SQL 查询 blocks 表获取原始内容]\n\n`;
                    output += sqlRow.content || '(无内容)';
                    return {
                        content: [{ type: 'text', text: output }],
                        _meta: { source: 'sql_fallback', avID, originalID: params.avID, apiResponse: data, sqlRow }
                    };
                }

                return {
                    content: [{ type: 'text', text: `Attribute View ${params.avID} 无可用数据。API 返回空壳且 SQL 查询未找到对应记录。` }],
                    isError: true
                };
            }

            const formatted = formatAttributeView(data);
            return {
                content: [{ type: 'text', text: formatted }],
                _meta: data
            };
        } catch (error) {
            return {
                content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
                isError: true
            };
        }
    },
    documentation: {
        description: 'Get database structure, columns, and rows in a human-readable format.',
        params: {
            avID: { type: 'string', description: 'Attribute View ID', required: true },
            viewID: { type: 'string', description: 'View ID (optional)', required: false },
            page: { type: 'number', description: 'Page number', required: false },
            pageSize: { type: 'number', description: 'Page size', required: false }
        },
        returns: { type: 'string', description: 'Formatted database info', properties: {} },
        examples: [],
        apiLink: 'https://github.com/siyuan-note/siyuan/blob/master/API.md'
    }
};

// ============================================================================
// Command: addRow
// ============================================================================

const addRowParams = z.object({
    avID: z.string().describe('Attribute View ID'),
    rows: z.array(z.record(z.any())).describe('Row data objects, where keys are column names')
});

type AddRowParams = z.infer<typeof addRowParams>;

const addRowHandler: CommandHandler<AddRowParams> = {
    namespace,
    name: 'addRow',
    description: 'Add rows to an existing database',
    params: addRowParams,
    handler: async (params) => {
        try {
            const colMap = await getColumnInfo(params.avID);
            const timestamp = getTimestamp();

            const blocksValues: any[][] = [];
            const addedRowIDs: string[] = [];

            for (const row of params.rows) {
                const blockID = generateSiyuanId();
                addedRowIDs.push(blockID);
                const rowValues: any[] = [];

                for (const [colName, colInfo] of colMap.entries()) {
                    const cellValue = row[colName];
                    const valueId = generateSiyuanId();
                    rowValues.push(toFullAvValue(colInfo.type, valueId, colInfo.keyID, blockID, cellValue, timestamp));
                }

                blocksValues.push(rowValues);
            }

            const result = await client.post('/api/av/appendAttributeViewDetachedBlocksWithValues', {
                avID: params.avID,
                blocksValues
            });

            if (result.code !== 0) {
                return { content: [{ type: 'text', text: `Failed to add rows: ${result.msg}` }], isError: true };
            }

            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({ code: 0, msg: 'Rows added successfully', data: { added: params.rows.length, rowIDs: addedRowIDs } })
                }]
            };
        } catch (error) {
            return {
                content: [{ type: 'text', text: `Error adding rows: ${error instanceof Error ? error.message : String(error)}` }],
                isError: true
            };
        }
    },
    documentation: {
        description: 'Add new rows to an existing database. Each row is an object where keys are column names.',
        params: {
            avID: { type: 'string', description: 'Attribute View ID', required: true },
            rows: { type: 'array', description: 'Row data objects', required: true }
        },
        returns: { type: 'object', description: 'Operation result', properties: { added: 'Number of rows added', rowIDs: 'Array of new row IDs' } },
        examples: [],
        apiLink: 'https://github.com/siyuan-note/siyuan/blob/master/API.md'
    }
};

// ============================================================================
// Command: updateRow
// ============================================================================

const updateRowParams = z.object({
    avID: z.string().describe('Attribute View ID'),
    rowID: z.string().describe('Row ID (blockID)'),
    values: z.record(z.any()).describe('Column values to update, where keys are column names')
});

type UpdateRowParams = z.infer<typeof updateRowParams>;

const updateRowHandler: CommandHandler<UpdateRowParams> = {
    namespace,
    name: 'updateRow',
    description: 'Update values in a database row',
    params: updateRowParams,
    handler: async (params) => {
        try {
            const colMap = await getColumnInfo(params.avID);
            const updates: any[] = [];

            for (const [colName, value] of Object.entries(params.values)) {
                const colInfo = colMap.get(colName);
                if (!colInfo) continue;
                updates.push({
                    keyID: colInfo.keyID,
                    rowID: params.rowID,
                    value: toApiValue(colInfo.type, value)
                });
            }

            if (updates.length === 0) {
                return { content: [{ type: 'text', text: 'No valid columns to update' }], isError: true };
            }

            const result = await client.post('/api/av/batchSetAttributeViewBlockAttrs', {
                avID: params.avID,
                values: updates
            });

            if (result.code !== 0) {
                return { content: [{ type: 'text', text: `Failed to update row: ${result.msg}` }], isError: true };
            }

            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({ code: 0, msg: 'Row updated successfully', data: { rowID: params.rowID, updatedColumns: updates.length } })
                }]
            };
        } catch (error) {
            return {
                content: [{ type: 'text', text: `Error updating row: ${error instanceof Error ? error.message : String(error)}` }],
                isError: true
            };
        }
    },
    documentation: {
        description: 'Update one or more cell values in a specific row.',
        params: {
            avID: { type: 'string', description: 'Attribute View ID', required: true },
            rowID: { type: 'string', description: 'Row ID (blockID)', required: true },
            values: { type: 'object', description: 'Column values to update', required: true }
        },
        returns: { type: 'object', description: 'Operation result', properties: { rowID: 'Row ID', updatedColumns: 'Number of updated columns' } },
        examples: [],
        apiLink: 'https://github.com/siyuan-note/siyuan/blob/master/API.md'
    }
};

// ============================================================================
// Command: deleteRow
// ============================================================================

const deleteRowParams = z.object({
    avID: z.string().describe('Attribute View ID'),
    rowIDs: z.array(z.string()).describe('Row IDs (blockIDs) to delete')
});

type DeleteRowParams = z.infer<typeof deleteRowParams>;

const deleteRowHandler: CommandHandler<DeleteRowParams> = {
    namespace,
    name: 'deleteRow',
    description: 'Delete rows from a database',
    params: deleteRowParams,
    handler: async (params) => {
        try {
            const result = await client.post('/api/av/removeAttributeViewBlocks', {
                avID: params.avID,
                srcIDs: params.rowIDs
            });

            if (result.code !== 0) {
                return { content: [{ type: 'text', text: `Failed to delete rows: ${result.msg}` }], isError: true };
            }

            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({ code: 0, msg: 'Rows deleted successfully', data: { deleted: params.rowIDs.length } })
                }]
            };
        } catch (error) {
            return {
                content: [{ type: 'text', text: `Error deleting rows: ${error instanceof Error ? error.message : String(error)}` }],
                isError: true
            };
        }
    },
    documentation: {
        description: 'Delete one or more rows from a database.',
        params: {
            avID: { type: 'string', description: 'Attribute View ID', required: true },
            rowIDs: { type: 'array', description: 'Row IDs to delete', required: true }
        },
        returns: { type: 'object', description: 'Operation result', properties: { deleted: 'Number of deleted rows' } },
        examples: [],
        apiLink: 'https://github.com/siyuan-note/siyuan/blob/master/API.md'
    }
};

// ============================================================================
// Command: addColumn
// ============================================================================

const addColumnParams = z.object({
    avID: z.string().describe('Attribute View ID'),
    name: z.string().describe('Column name'),
    type: columnTypeEnum.describe('Column type'),
    options: z.array(z.object({ name: z.string(), color: z.string().optional() })).optional().describe('Options for select/mSelect columns'),
    previousKeyID: z.string().optional().describe('Insert after this column keyID (empty for append)')
});

type AddColumnParams = z.infer<typeof addColumnParams>;

const addColumnHandler: CommandHandler<AddColumnParams> = {
    namespace,
    name: 'addColumn',
    description: 'Add a column to an existing database',
    params: addColumnParams,
    handler: async (params) => {
        try {
            const keyID = generateSiyuanId();
            const result = await client.post('/api/av/addAttributeViewKey', {
                avID: params.avID,
                keyID,
                keyName: params.name,
                keyType: params.type,
                keyIcon: '',
                previousKeyID: params.previousKeyID ?? ''
            });

            if (result.code !== 0) {
                return { content: [{ type: 'text', text: `Failed to add column: ${result.msg}` }], isError: true };
            }

            // If options provided for select/mSelect, we need to add them
            // Currently SiYuan doesn't have a direct API to set column options
            // The options are stored in the AV JSON file's keyValues[].key.options
            // We'll need to modify the AV JSON file directly
            if (params.options && params.options.length > 0 && (params.type === 'select' || params.type === 'mSelect')) {
                const avPath = `/data/storage/av/${params.avID}.json`;
                const fileResult = await client.post('/api/file/getFile', { path: avPath });
                if (fileResult && typeof fileResult === 'object' && !('code' in fileResult && (fileResult as any).code !== 0)) {
                    const avData = fileResult as any;
                    for (const kv of avData.keyValues || []) {
                        if (kv.key?.id === keyID) {
                            kv.key.options = params.options.map((opt, idx) => ({
                                name: opt.name,
                                color: opt.color || String((idx % 13) + 1),
                                desc: ''
                            }));
                            break;
                        }
                    }
                    await client.putFile(avPath, JSON.stringify(avData));
                }
            }

            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({ code: 0, msg: 'Column added successfully', data: { keyID, name: params.name, type: params.type } })
                }]
            };
        } catch (error) {
            return {
                content: [{ type: 'text', text: `Error adding column: ${error instanceof Error ? error.message : String(error)}` }],
                isError: true
            };
        }
    },
    documentation: {
        description: 'Add a new column to an existing database.',
        params: {
            avID: { type: 'string', description: 'Attribute View ID', required: true },
            name: { type: 'string', description: 'Column name', required: true },
            type: { type: 'string', description: 'Column type', required: true },
            options: { type: 'array', description: 'Options for select/mSelect', required: false },
            previousKeyID: { type: 'string', description: 'Insert after this column', required: false }
        },
        returns: { type: 'object', description: 'Operation result', properties: { keyID: 'New column keyID', name: 'Column name', type: 'Column type' } },
        examples: [],
        apiLink: 'https://github.com/siyuan-note/siyuan/blob/master/API.md'
    }
};

// ============================================================================
// Command: removeColumn
// ============================================================================

const removeColumnParams = z.object({
    avID: z.string().describe('Attribute View ID'),
    keyID: z.string().describe('Column keyID to remove')
});

type RemoveColumnParams = z.infer<typeof removeColumnParams>;

const removeColumnHandler: CommandHandler<RemoveColumnParams> = {
    namespace,
    name: 'removeColumn',
    description: 'Remove a column from a database',
    params: removeColumnParams,
    handler: async (params) => {
        try {
            const result = await client.post('/api/av/removeAttributeViewKey', {
                avID: params.avID,
                keyID: params.keyID,
                removeRelationDest: false
            });

            if (result.code !== 0) {
                return { content: [{ type: 'text', text: `Failed to remove column: ${result.msg}` }], isError: true };
            }

            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({ code: 0, msg: 'Column removed successfully', data: { keyID: params.keyID } })
                }]
            };
        } catch (error) {
            return {
                content: [{ type: 'text', text: `Error removing column: ${error instanceof Error ? error.message : String(error)}` }],
                isError: true
            };
        }
    },
    documentation: {
        description: 'Remove a column from a database.',
        params: {
            avID: { type: 'string', description: 'Attribute View ID', required: true },
            keyID: { type: 'string', description: 'Column keyID', required: true }
        },
        returns: { type: 'object', description: 'Operation result', properties: { keyID: 'Removed column keyID' } },
        examples: [],
        apiLink: 'https://github.com/siyuan-note/siyuan/blob/master/API.md'
    }
};

// ============================================================================
// Command: updateCell
// ============================================================================

const updateCellParams = z.object({
    avID: z.string().describe('Attribute View ID'),
    rowID: z.string().describe('Row ID (blockID)'),
    columnName: z.string().describe('Column name'),
    value: z.any().describe('New value')
});

type UpdateCellParams = z.infer<typeof updateCellParams>;

const updateCellHandler: CommandHandler<UpdateCellParams> = {
    namespace,
    name: 'updateCell',
    description: 'Update a single cell value',
    params: updateCellParams,
    handler: async (params) => {
        try {
            const colMap = await getColumnInfo(params.avID);
            const colInfo = colMap.get(params.columnName);
            if (!colInfo) {
                return { content: [{ type: 'text', text: `Column '${params.columnName}' not found` }], isError: true };
            }

            const result = await client.post('/api/av/setAttributeViewBlockAttr', {
                avID: params.avID,
                keyID: colInfo.keyID,
                itemID: params.rowID,
                value: toApiValue(colInfo.type, params.value)
            });

            if (result.code !== 0) {
                return { content: [{ type: 'text', text: `Failed to update cell: ${result.msg}` }], isError: true };
            }

            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({ code: 0, msg: 'Cell updated successfully', data: { rowID: params.rowID, column: params.columnName, value: params.value } })
                }]
            };
        } catch (error) {
            return {
                content: [{ type: 'text', text: `Error updating cell: ${error instanceof Error ? error.message : String(error)}` }],
                isError: true
            };
        }
    },
    documentation: {
        description: 'Update a single cell value in a specific row and column.',
        params: {
            avID: { type: 'string', description: 'Attribute View ID', required: true },
            rowID: { type: 'string', description: 'Row ID', required: true },
            columnName: { type: 'string', description: 'Column name', required: true },
            value: { type: 'any', description: 'New value', required: true }
        },
        returns: { type: 'object', description: 'Operation result', properties: { rowID: 'Row ID', column: 'Column name', value: 'New value' } },
        examples: [],
        apiLink: 'https://github.com/siyuan-note/siyuan/blob/master/API.md'
    }
};

// ============================================================================
// Registration
// ============================================================================

export function registerAvHandlers() {
    registry.registerCommand(createAttributeViewHandler);
    registry.registerCommand(getAttributeViewHandler);
    registry.registerCommand(addRowHandler);
    registry.registerCommand(updateRowHandler);
    registry.registerCommand(deleteRowHandler);
    registry.registerCommand(addColumnHandler);
    registry.registerCommand(removeColumnHandler);
    registry.registerCommand(updateCellHandler);
}

// ============================================================================
// Register AV commands as standalone MCP tools for better LLM discoverability
// ============================================================================

function wrapHandler<P>(handler: (params: P) => Promise<{ content: Array<{ type: string; text: string }>; _meta?: any; isError?: boolean }>) {
    return async (params: P) => {
        const result = await handler(params);
        return {
            content: result.content.map(item => ({ type: 'text' as const, text: item.text })),
            _meta: result._meta,
            isError: result.isError
        };
    };
}

export function registerAvTools(server: McpServer) {
    server.registerTool('av_createAttributeView', {
        title: 'Create SiYuan Database',
        description: createAttributeViewHandler.description,
        inputSchema: createAttributeViewParams
    }, wrapHandler(createAttributeViewHandler.handler));

    server.registerTool('av_getAttributeView', {
        title: 'Get SiYuan Database',
        description: getAttributeViewHandler.description,
        inputSchema: getAttributeViewParams
    }, wrapHandler(getAttributeViewHandler.handler));

    server.registerTool('av_addRow', {
        title: 'Add Rows to SiYuan Database',
        description: addRowHandler.description,
        inputSchema: addRowParams
    }, wrapHandler(addRowHandler.handler));

    server.registerTool('av_updateRow', {
        title: 'Update SiYuan Database Row',
        description: updateRowHandler.description,
        inputSchema: updateRowParams
    }, wrapHandler(updateRowHandler.handler));

    server.registerTool('av_deleteRow', {
        title: 'Delete Rows from SiYuan Database',
        description: deleteRowHandler.description,
        inputSchema: deleteRowParams
    }, wrapHandler(deleteRowHandler.handler));

    server.registerTool('av_addColumn', {
        title: 'Add Column to SiYuan Database',
        description: addColumnHandler.description,
        inputSchema: addColumnParams
    }, wrapHandler(addColumnHandler.handler));

    server.registerTool('av_removeColumn', {
        title: 'Remove Column from SiYuan Database',
        description: removeColumnHandler.description,
        inputSchema: removeColumnParams
    }, wrapHandler(removeColumnHandler.handler));

    server.registerTool('av_updateCell', {
        title: 'Update SiYuan Database Cell',
        description: updateCellHandler.description,
        inputSchema: updateCellParams
    }, wrapHandler(updateCellHandler.handler));
}

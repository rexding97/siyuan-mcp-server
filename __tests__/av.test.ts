import { describe, expect, test } from '@jest/globals';
import {
    hasUsableAvData,
    buildColumnsFromKeyValues,
    buildRowsFromKeyValues,
    formatAttributeView
} from '../src/tools/commands/av.js';

describe('hasUsableAvData', () => {
    test('returns false for null/undefined', () => {
        expect(hasUsableAvData(null)).toBe(false);
        expect(hasUsableAvData(undefined)).toBe(false);
    });

    test('returns false for empty object', () => {
        expect(hasUsableAvData({})).toBe(false);
    });

    test('returns false when av is explicitly null', () => {
        expect(hasUsableAvData({ av: null })).toBe(false);
    });

    test('returns false when av object exists but has no rows or keyValues', () => {
        expect(hasUsableAvData({ av: { name: 'Test' } })).toBe(false);
    });

    test('returns true when av object has rows', () => {
        expect(hasUsableAvData({ av: { view: { rows: [{ id: 'r1' }] } } })).toBe(true);
    });

    test('returns false when view exists but rows are empty', () => {
        // SiYuan often returns a shell with only default columns and zero rows
        expect(hasUsableAvData({ view: { columns: ['主键', '单选'], rows: [] } })).toBe(false);
    });

    test('returns true when view has actual rows', () => {
        expect(hasUsableAvData({ view: { columns: [], rows: [{ id: 'r1' }] } })).toBe(true);
    });

    test('returns true when keyValues is non-empty', () => {
        expect(hasUsableAvData({ keyValues: [{ key: { id: 'k1', name: 'Col1' } }] })).toBe(true);
    });

    test('returns false when keyValues is empty array', () => {
        expect(hasUsableAvData({ keyValues: [] })).toBe(false);
    });
});

describe('buildColumnsFromKeyValues', () => {
    test('extracts keys from keyValues', () => {
        const keyValues = [
            { key: { id: 'k1', name: '名称', type: 'block' } },
            { key: { id: 'k2', name: '状态', type: 'select' } }
        ];
        const cols = buildColumnsFromKeyValues(keyValues);
        expect(cols).toHaveLength(2);
        expect(cols[0]).toMatchObject({ id: 'k1', name: '名称', type: 'block' });
        expect(cols[1]).toMatchObject({ id: 'k2', name: '状态', type: 'select' });
    });

    test('filters out keys without id', () => {
        const keyValues = [
            { key: { id: 'k1', name: 'Col1' } },
            { key: { name: 'BadCol' } }
        ];
        const cols = buildColumnsFromKeyValues(keyValues);
        expect(cols).toHaveLength(1);
        expect(cols[0].id).toBe('k1');
    });

    test('returns empty array for empty input', () => {
        expect(buildColumnsFromKeyValues([])).toEqual([]);
    });
});

describe('buildRowsFromKeyValues', () => {
    test('groups values by blockID into rows', () => {
        const keyValues = [
            {
                key: { id: 'k1', name: '名称' },
                values: [
                    { id: 'v1', keyID: 'k1', blockID: 'row1', type: 'text', text: { content: 'Task A' } }
                ]
            },
            {
                key: { id: 'k2', name: '状态' },
                values: [
                    { id: 'v2', keyID: 'k2', blockID: 'row1', type: 'select', mSelect: [{ content: 'Done' }] }
                ]
            }
        ];
        const rows = buildRowsFromKeyValues(keyValues);
        expect(rows).toHaveLength(1);
        expect(rows[0].id).toBe('row1');
        expect(rows[0].cells).toHaveLength(2);
    });

    test('creates multiple rows for different blockIDs', () => {
        const keyValues = [
            {
                key: { id: 'k1', name: '名称' },
                values: [
                    { id: 'v1', keyID: 'k1', blockID: 'row1', type: 'text', text: { content: 'A' } },
                    { id: 'v2', keyID: 'k1', blockID: 'row2', type: 'text', text: { content: 'B' } }
                ]
            }
        ];
        const rows = buildRowsFromKeyValues(keyValues);
        expect(rows).toHaveLength(2);
        expect(rows.map((r: any) => r.id)).toContain('row1');
        expect(rows.map((r: any) => r.id)).toContain('row2');
    });

    test('skips values without blockID', () => {
        const keyValues = [
            {
                key: { id: 'k1', name: '名称' },
                values: [
                    { id: 'v1', keyID: 'k1', blockID: 'row1', type: 'text', text: { content: 'A' } },
                    { id: 'v2', keyID: 'k1', type: 'text', text: { content: 'Orphan' } }
                ]
            }
        ];
        const rows = buildRowsFromKeyValues(keyValues);
        expect(rows).toHaveLength(1);
        expect(rows[0].id).toBe('row1');
    });
});

describe('formatAttributeView', () => {
    test('formats normal view data', () => {
        const data = {
            name: '测试库',
            id: 'av1',
            view: {
                name: '表格',
                type: 'table',
                columns: [
                    { id: 'k1', name: '名称', type: 'block' },
                    { id: 'k2', name: '状态', type: 'select', options: [{ name: 'Done' }] }
                ],
                rows: [
                    {
                        id: 'row1',
                        cells: [
                            { value: { keyID: 'k1', block: { content: 'Task A' } } },
                            { value: { keyID: 'k2', mSelect: [{ content: 'Done' }] } }
                        ]
                    }
                ]
            }
        };
        const output = formatAttributeView(data);
        expect(output).toContain('数据库: 测试库');
        expect(output).toContain('ID: av1');
        expect(output).toContain('视图: 表格 (table)');
        expect(output).toContain('列 (2)');
        expect(output).toContain('行 (1)');
        expect(output).toContain('Task A');
        expect(output).toContain('Done');
    });

    test('falls back to keyValues when view is empty', () => {
        const data = {
            name: 'keyValues库',
            id: 'av2',
            view: { columns: [], rows: [] },
            keyValues: [
                {
                    key: { id: 'k1', name: '任务', type: 'text' },
                    values: [
                        { id: 'v1', keyID: 'k1', blockID: 'row1', type: 'text', text: { content: 'Fix bug' } }
                    ]
                }
            ]
        };
        const output = formatAttributeView(data);
        expect(output).toContain('数据库: keyValues库');
        expect(output).toContain('列 (1)');
        expect(output).toContain('行 (1)');
        expect(output).toContain('Fix bug');
    });

    test('handles completely empty data gracefully', () => {
        const output = formatAttributeView(null);
        expect(output).toContain('数据库: N/A');
        expect(output).toContain('ID: N/A');
        expect(output).toContain('列 (0)');
        expect(output).toContain('行 (0)');
    });

    test('handles flat API response (no av wrapper)', () => {
        const data = {
            id: 'av1',
            name: 'FlatDB',
            view: {
                name: '表格',
                type: 'table',
                columns: [{ id: 'k1', name: '名称', type: 'block' }],
                rows: [{ id: 'row1', cells: [{ value: { keyID: 'k1', block: { content: 'Task A' } } }] }]
            }
        };
        const output = formatAttributeView(data);
        expect(output).toContain('数据库: FlatDB');
        expect(output).toContain('ID: av1');
        expect(output).toContain('Task A');
    });

    test('handles av: null response gracefully', () => {
        const output = formatAttributeView({ av: null });
        expect(output).toContain('数据库: N/A');
        expect(output).toContain('列 (0)');
        expect(output).toContain('行 (0)');
    });
});

import { z } from 'zod';
import { client, createHandler } from '../../utils/client.js';
import { registry } from '../../utils/registry.js';
import { CommandHandler } from '../../utils/registry.js';

const namespace = 'file';

const getFileParams = z.object({
    path: z.string().describe('File path')
});
type GetFileParams = z.infer<typeof getFileParams>;

const putFileParams = z.object({
    path: z.string().describe('File path'),
    file: z.string().describe('File content (string)'),
    isDir: z.boolean().optional().describe('Whether it is a directory')
});
type PutFileParams = z.infer<typeof putFileParams>;

// Get file
const getFileHandler: CommandHandler<GetFileParams> = {
    namespace,
    name: 'getFile',
    description: 'Get file content',
    params: getFileParams,
    handler: async (params) => {
        const result = await client.post('/api/file/getFile', { path: params.path });
        // getFile returns raw file content on success, or { code, msg, data } on error
        if (result && typeof result === 'object' && 'code' in result && typeof (result as any).code === 'number' && (result as any).code !== 0) {
            return {
                content: [{ type: 'text', text: `Error: ${(result as any).msg}` }],
                isError: true
            };
        }
        return {
            content: [{ type: 'text', text: JSON.stringify(result) }]
        };
    },
    documentation: {
        description: 'Get file content',
        params: {
            path: {
                type: 'string',
                description: 'File path',
                required: true
            }
        },
        returns: {
            type: 'object',
            description: 'File content',
            properties: {
                isDir: 'Whether it is a directory',
                content: 'File content'
            }
        },
        examples: [
            {
                description: 'This example retrieves the content of a specific file from the data directory, indicating whether it is a directory and returning its contents.',
                params: {
                    path: "/data/20210808180117-6v0mkxr/20200923234011-ieuun1p.sy"
                },
                response: {
                    isDir: false,
                    content: "File content..."
                }
            }
        ],
        apiLink: 'https://github.com/siyuan-note/siyuan/blob/master/API.md#get-file'
    }
};

// Put file
const putFileHandler: CommandHandler<PutFileParams> = {
    namespace,
    name: 'putFile',
    description: 'Put file content',
    params: putFileParams,
    handler: async (params) => {
        const result = await client.putFile(params.path, params.file, params.isDir ?? false);
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(result)
                }
            ]
        };
    },
    documentation: {
        description: 'Put file content',
        params: {
            path: {
                type: 'string',
                description: 'File path',
                required: true
            },
            file: {
                type: 'string',
                description: 'File content (string)',
                required: true
            },
            isDir: {
                type: 'boolean',
                description: 'Whether it is a directory',
                required: false
            }
        },
        returns: {
            type: 'object',
            description: 'Operation result',
            properties: {
                path: 'File path'
            }
        },
        examples: [
            {
                description: 'This example demonstrates writing new content to a file at the specified path, creating or updating the file as needed.',
                params: {
                    path: "/data/20210808180117-6v0mkxr/20200923234011-ieuun1p.sy",
                    file: "New file content"
                },
                response: {
                    path: "/data/20210808180117-6v0mkxr/20200923234011-ieuun1p.sy"
                }
            }
        ],
        apiLink: 'https://github.com/siyuan-note/siyuan/blob/master/API.md#put-file'
    }
};

// Remove file
const removeFileHandler: CommandHandler = {
    namespace,
    name: 'removeFile',
    description: 'Remove file',
    params: z.object({
        path: z.string().describe('File path')
    }),
    handler: createHandler('/api/file/removeFile'),
    documentation: {
        description: 'Remove file',
        params: {
            path: {
                type: 'string',
                description: 'File path',
                required: true
            }
        },
        returns: {
            type: 'object',
            description: 'Operation result',
            properties: {}
        },
        examples: [
            {
                description: 'This example shows how to permanently delete a file from the specified path in the data directory.',
                params: {
                    path: "/data/20210808180117-6v0mkxr/20200923234011-ieuun1p.sy"
                },
                response: {}
            }
        ],
        apiLink: 'https://github.com/siyuan-note/siyuan/blob/master/API.md#remove-file'
    }
};

// List files
const readDirHandler: CommandHandler = {
    namespace,
    name: 'readDir',
    description: 'List files in directory',
    params: z.object({
        path: z.string().describe('Directory path')
    }),
    handler: createHandler('/api/file/readDir'),
    documentation: {
        description: 'List files in directory',
        params: {
            path: {
                type: 'string',
                description: 'Directory path',
                required: true
            }
        },
        returns: {
            type: 'object',
            description: 'Directory content',
            properties: {
                files: 'Array of file information'
            }
        },
        examples: [
            {
                description: 'This example lists all files and directories within a specified directory, providing information about each item\'s type and name.',
                params: {
                    path: "/data/20210808180117-6v0mkxr"
                },
                response: {
                    files: [
                        {
                            isDir: false,
                            name: "20200923234011-ieuun1p.sy"
                        }
                    ]
                }
            }
        ],
        apiLink: 'https://github.com/siyuan-note/siyuan/blob/master/API.md#list-files'
    }
};

// Register all file related commands
export function registerFileHandlers() {
    registry.registerCommand(getFileHandler);
    registry.registerCommand(putFileHandler);
    registry.registerCommand(removeFileHandler);
    registry.registerCommand(readDirHandler);
} 
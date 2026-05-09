import { z } from 'zod';
import { createHandler } from '../../utils/client.js';
import { registry } from '../../utils/registry.js';
import { CommandHandler } from '../../utils/registry.js';

const namespace = 'filetree';

// Create document with Markdown
const createDocWithMdHandler: CommandHandler = {
    namespace,
    name: 'createDocWithMd',
    description: 'Create a document with Markdown content',
    params: z.object({
        notebook: z.string().describe('Notebook ID'),
        path: z.string().describe('Document path'),
        markdown: z.string().describe('Markdown content')
    }),
    handler: createHandler('/api/filetree/createDocWithMd'),
    documentation: {
        description: 'Create a document with Markdown content',
        params: {
            notebook: {
                type: 'string',
                description: 'Notebook ID',
                required: true
            },
            path: {
                type: 'string',
                description: 'Document path',
                required: true
            },
            markdown: {
                type: 'string',
                description: 'Markdown content',
                required: true
            }
        },
        returns: {
            type: 'object',
            description: 'Operation result',
            properties: {
                id: 'Document ID'
            }
        },
        examples: [
            {
                description: 'This example demonstrates creating a new document with a markdown heading, specifying both the target notebook and the document path.',
                params: {
                    notebook: "20210817205410-2kvfpfn",
                    path: "/test/doc.md",
                    markdown: "# Hello World"
                },
                response: {
                    id: "20210817205410-2kvfpfn"
                }
            }
        ],
        apiLink: 'https://github.com/siyuan-note/siyuan/blob/master/API.md#create-document-with-markdown'
    }
};

// Rename document
const renameDocHandler: CommandHandler = {
    namespace,
    name: 'renameDoc',
    description: 'Rename a document',
    params: z.object({
        notebook: z.string().describe('Notebook ID'),
        path: z.string().describe('Document path'),
        title: z.string().describe('New document title')
    }),
    handler: createHandler('/api/filetree/renameDoc'),
    documentation: {
        description: 'Rename a document',
        params: {
            notebook: {
                type: 'string',
                description: 'Notebook ID',
                required: true
            },
            path: {
                type: 'string',
                description: 'Document path',
                required: true
            },
            title: {
                type: 'string',
                description: 'New document title',
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
                description: 'This example shows how to change the title of an existing document while maintaining its location in the notebook hierarchy.',
                params: {
                    notebook: "20210817205410-2kvfpfn",
                    path: "/test/doc.md",
                    title: "New Title"
                },
                response: {}
            }
        ],
        apiLink: 'https://github.com/siyuan-note/siyuan/blob/master/API.md#rename-document'
    }
};

// Remove document
const removeDocHandler: CommandHandler = {
    namespace,
    name: 'removeDoc',
    description: 'Remove a document',
    params: z.object({
        notebook: z.string().describe('Notebook ID'),
        path: z.string().describe('Document path')
    }),
    handler: createHandler('/api/filetree/removeDoc'),
    documentation: {
        description: 'Remove a document',
        params: {
            notebook: {
                type: 'string',
                description: 'Notebook ID',
                required: true
            },
            path: {
                type: 'string',
                description: 'Document path',
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
                description: 'This example demonstrates deleting a document from a specific notebook, removing it from the file tree structure.',
                params: {
                    notebook: "20210817205410-2kvfpfn",
                    path: "/test/doc.md"
                },
                response: {}
            }
        ],
        apiLink: 'https://github.com/siyuan-note/siyuan/blob/master/API.md#remove-document'
    }
};

// Move documents
const moveDocsHandler: CommandHandler = {
    namespace,
    name: 'moveDocs',
    description: 'Move documents',
    params: z.object({
        fromPaths: z.array(z.string()).describe('Source document paths'),
        toNotebook: z.string().describe('Target notebook ID'),
        toPath: z.string().describe('Target document path')
    }),
    handler: createHandler('/api/filetree/moveDocs'),
    documentation: {
        description: 'Move documents',
        params: {
            fromPaths: {
                type: 'array',
                description: 'Source document paths',
                required: true
            },
            toNotebook: {
                type: 'string',
                description: 'Target notebook ID',
                required: true
            },
            toPath: {
                type: 'string',
                description: 'Target document path',
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
                description: 'This example shows how to relocate multiple documents to a new location within a target notebook, preserving their content and relationships.',
                params: {
                    fromPaths: ["/test/doc1.md", "/test/doc2.md"],
                    toNotebook: "20210817205410-2kvfpfn",
                    toPath: "/target/path"
                },
                response: {}
            }
        ],
        apiLink: 'https://github.com/siyuan-note/siyuan/blob/master/API.md#move-documents'
    }
};

// Get document HPath by path
const getHPathByPathHandler: CommandHandler = {
    namespace,
    name: 'getHPathByPath',
    description: 'Get document HPath by path',
    params: z.object({
        notebook: z.string().describe('Notebook ID'),
        path: z.string().describe('Document path')
    }),
    handler: createHandler('/api/filetree/getHPathByPath'),
    documentation: {
        description: 'Get document HPath by path',
        params: {
            notebook: {
                type: 'string',
                description: 'Notebook ID',
                required: true
            },
            path: {
                type: 'string',
                description: 'Document path',
                required: true
            }
        },
        returns: {
            type: 'object',
            description: 'Operation result',
            properties: {
                hPath: 'Document HPath'
            }
        },
        examples: [
            {
                description: 'This example retrieves the human-readable path of a document using its notebook ID and file path, useful for displaying document locations.',
                params: {
                    notebook: "20210817205410-2kvfpfn",
                    path: "/test/doc.md"
                },
                response: {
                    hPath: "/Test/Doc"
                }
            }
        ],
        apiLink: 'https://github.com/siyuan-note/siyuan/blob/master/API.md#get-human-readable-path'
    }
};

// Get document HPath by ID
const getHPathByIDHandler: CommandHandler = {
    namespace,
    name: 'getHPathByID',
    description: 'Get document HPath by ID',
    params: z.object({
        id: z.string().describe('Document ID')
    }),
    handler: createHandler('/api/filetree/getHPathByID'),
    documentation: {
        description: 'Get document HPath by ID',
        params: {
            id: {
                type: 'string',
                description: 'Document ID',
                required: true
            }
        },
        returns: {
            type: 'object',
            description: 'Operation result',
            properties: {
                hPath: 'Document HPath'
            }
        },
        examples: [
            {
                description: 'This example demonstrates getting the human-readable path of a document using only its unique identifier, regardless of its notebook location.',
                params: {
                    id: "20210817205410-2kvfpfn"
                },
                response: {
                    hPath: "/Test/Doc"
                }
            }
        ],
        apiLink: 'https://github.com/siyuan-note/siyuan/blob/master/API.md#get-human-readable-path-by-id'
    }
};

// List documents by path
const listDocsByPathHandler: CommandHandler = {
    namespace,
    name: 'listDocsByPath',
    description: 'List documents in a notebook by path',
    params: z.object({
        notebook: z.string().describe('Notebook ID'),
        path: z.string().optional().describe('Document path, default is root "/"')
    }),
    handler: createHandler('/api/filetree/listDocsByPath'),
    documentation: {
        description: 'List documents in a notebook by path',
        params: {
            notebook: {
                type: 'string',
                description: 'Notebook ID',
                required: true
            },
            path: {
                type: 'string',
                description: 'Document path, default is root "/"',
                required: false
            }
        },
        returns: {
            type: 'object',
            description: 'Document list',
            properties: {
                files: 'Array of documents'
            }
        },
        examples: [
            {
                description: 'This example retrieves the list of documents at the root of a specified notebook.',
                params: {
                    notebook: "20210817205410-2kvfpfn",
                    path: "/"
                },
                response: {
                    files: [
                        {
                            id: "20200812220555-lj3enxa",
                            name: "Document name"
                        }
                    ]
                }
            }
        ],
        apiLink: 'https://github.com/siyuan-note/siyuan/blob/master/API.md#list-documents'
    }
};

// Remove document by ID
const removeDocByIDHandler: CommandHandler = {
    namespace,
    name: 'removeDocByID',
    description: 'Remove a document by its ID',
    params: z.object({
        id: z.string().describe('Document ID')
    }),
    handler: createHandler('/api/filetree/removeDocByID'),
    documentation: {
        description: 'Remove a document by its ID. More reliable than removeDoc when the document path is unknown or the path-based removal does not work.',
        params: {
            id: {
                type: 'string',
                description: 'Document ID',
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
                description: 'This example demonstrates deleting a document using its unique identifier, bypassing potential path-resolution issues.',
                params: {
                    id: "20210817205410-2kvfpfn"
                },
                response: {}
            }
        ],
        apiLink: 'https://github.com/siyuan-note/siyuan/blob/master/API.md#remove-document-by-id'
    }
};

// Rename document by ID
const renameDocByIDHandler: CommandHandler = {
    namespace,
    name: 'renameDocByID',
    description: 'Rename a document by its ID',
    params: z.object({
        id: z.string().describe('Document ID'),
        title: z.string().describe('New document title')
    }),
    handler: createHandler('/api/filetree/renameDocByID'),
    documentation: {
        description: 'Rename a document by its ID. More convenient than renameDoc when you already know the document ID.',
        params: {
            id: {
                type: 'string',
                description: 'Document ID',
                required: true
            },
            title: {
                type: 'string',
                description: 'New document title',
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
                description: 'This example shows how to rename a document using only its ID.',
                params: {
                    id: "20210817205410-2kvfpfn",
                    title: "New Title"
                },
                response: {}
            }
        ],
        apiLink: 'https://github.com/siyuan-note/siyuan/blob/master/API.md#rename-document-by-id'
    }
};

// Move documents by ID
const moveDocsByIDHandler: CommandHandler = {
    namespace,
    name: 'moveDocsByID',
    description: 'Move documents by their IDs',
    params: z.object({
        fromIDs: z.array(z.string()).describe('Source document IDs'),
        toID: z.string().describe('Target parent document or notebook ID')
    }),
    handler: createHandler('/api/filetree/moveDocsByID'),
    documentation: {
        description: 'Move documents identified by their IDs to a new parent document or notebook.',
        params: {
            fromIDs: {
                type: 'array',
                description: 'Source document IDs',
                required: true
            },
            toID: {
                type: 'string',
                description: 'Target parent document or notebook ID',
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
                description: 'This example shows how to move multiple documents to a new parent using their IDs.',
                params: {
                    fromIDs: ["20210917220056-yxtyl7i"],
                    toID: "20210817205410-2kvfpfn"
                },
                response: {}
            }
        ],
        apiLink: 'https://github.com/siyuan-note/siyuan/blob/master/API.md#move-documents-by-id'
    }
};

// Register all filetree related commands
export function registerFiletreeHandlers() {
    registry.registerCommand(listDocsByPathHandler);
    registry.registerCommand(createDocWithMdHandler);
    registry.registerCommand(renameDocHandler);
    registry.registerCommand(renameDocByIDHandler);
    registry.registerCommand(removeDocHandler);
    registry.registerCommand(removeDocByIDHandler);
    registry.registerCommand(moveDocsHandler);
    registry.registerCommand(moveDocsByIDHandler);
    registry.registerCommand(getHPathByPathHandler);
    registry.registerCommand(getHPathByIDHandler);
} 
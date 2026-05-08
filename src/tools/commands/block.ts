import { z } from 'zod';
import { createHandler } from '../../utils/client.js';
import { registry } from '../../utils/registry.js';
import { CommandHandler } from '../../utils/registry.js';

const namespace = 'block';

// Insert block
const insertBlockHandler: CommandHandler = {
    namespace,
    name: 'insertBlock',
    description: 'Insert a block',
    params: z.object({
        data: z.string().describe('Block content in Markdown format'),
        dataType: z.enum(['markdown', 'dom']).describe('Content type'),
        previousID: z.string().optional().describe('Previous block ID'),
        parentID: z.string().optional().describe('Parent block ID')
    }),
    handler: createHandler('/api/block/insertBlock'),
    documentation: {
        description: 'Insert a block',
        params: {
            data: {
                type: 'string',
                description: 'Block content in Markdown format',
                required: true
            },
            dataType: {
                type: 'string',
                description: 'Content type: markdown or dom',
                required: true
            },
            previousID: {
                type: 'string',
                description: 'Previous block ID',
                required: false
            },
            parentID: {
                type: 'string',
                description: 'Parent block ID',
                required: false
            }
        },
        returns: {
            type: 'object',
            description: 'Operation result',
            properties: {
                doOperations: 'Array of operations performed'
            }
        },
        examples: [
            {
                description: 'This example demonstrates inserting a new block with markdown content after a specific block and under a parent block, showing the hierarchical block structure manipulation.',
                params: {
                    data: "New block content",
                    dataType: "markdown",
                    previousID: "20200812220555-lj3enxa",
                    parentID: "20200812220555-lj3enxa"
                },
                response: {
                    doOperations: [
                        {
                            action: "insert",
                            data: "New block content",
                            id: "20200812220555-lj3enxa"
                        }
                    ]
                }
            }
        ],
        apiLink: 'https://github.com/siyuan-note/siyuan/blob/master/API.md#insert-block'
    }
};

// Update block
const updateBlockHandler: CommandHandler = {
    namespace,
    name: 'updateBlock',
    description: 'Update block content',
    params: z.object({
        data: z.string().describe('Block content in Markdown format'),
        dataType: z.enum(['markdown', 'dom']).describe('Content type'),
        id: z.string().describe('Block ID')
    }),
    handler: createHandler('/api/block/updateBlock'),
    documentation: {
        description: 'Update block content',
        params: {
            data: {
                type: 'string',
                description: 'Block content in Markdown format',
                required: true
            },
            dataType: {
                type: 'string',
                description: 'Content type: markdown or dom',
                required: true
            },
            id: {
                type: 'string',
                description: 'Block ID',
                required: true
            }
        },
        returns: {
            type: 'object',
            description: 'Operation result',
            properties: {
                doOperations: 'Array of operations performed'
            }
        },
        examples: [
            {
                description: 'This example shows how to update the content of an existing block identified by its ID, converting the new content from markdown format.',
                params: {
                    data: "Updated content",
                    dataType: "markdown",
                    id: "20200812220555-lj3enxa"
                },
                response: {
                    doOperations: [
                        {
                            action: "update",
                            data: "Updated content",
                            id: "20200812220555-lj3enxa"
                        }
                    ]
                }
            }
        ],
        apiLink: 'https://github.com/siyuan-note/siyuan/blob/master/API.md#update-block'
    }
};

// Delete block
const deleteBlockHandler: CommandHandler = {
    namespace,
    name: 'deleteBlock',
    description: 'Delete a block',
    params: z.object({
        id: z.string().describe('Block ID')
    }),
    handler: createHandler('/api/block/deleteBlock'),
    documentation: {
        description: 'Delete a block',
        params: {
            id: {
                type: 'string',
                description: 'Block ID',
                required: true
            }
        },
        returns: {
            type: 'object',
            description: 'Operation result',
            properties: {
                doOperations: 'Array of operations performed'
            }
        },
        examples: [
            {
                description: 'This example demonstrates how to permanently remove a block from the document structure using its unique identifier.',
                params: {
                    id: "20200812220555-lj3enxa"
                },
                response: {
                    doOperations: [
                        {
                            action: "delete",
                            id: "20200812220555-lj3enxa"
                        }
                    ]
                }
            }
        ],
        apiLink: 'https://github.com/siyuan-note/siyuan/blob/master/API.md#delete-block'
    }
};

// Move block
const moveBlockHandler: CommandHandler = {
    namespace,
    name: 'moveBlock',
    description: 'Move a block',
    params: z.object({
        id: z.string().describe('Block ID to move'),
        previousID: z.string().optional().describe('Previous block ID'),
        parentID: z.string().optional().describe('Parent block ID')
    }),
    handler: createHandler('/api/block/moveBlock'),
    documentation: {
        description: 'Move a block',
        params: {
            id: {
                type: 'string',
                description: 'Block ID to move',
                required: true
            },
            previousID: {
                type: 'string',
                description: 'Previous block ID',
                required: false
            },
            parentID: {
                type: 'string',
                description: 'Parent block ID',
                required: false
            }
        },
        returns: {
            type: 'object',
            description: 'Operation result',
            properties: {
                doOperations: 'Array of operations performed'
            }
        },
        examples: [
            {
                description: 'This example shows how to relocate a block within the document structure by specifying its new position relative to other blocks.',
                params: {
                    id: "20200812220555-lj3enxa",
                    previousID: "20200812220555-lj3enxa",
                    parentID: "20200812220555-lj3enxa"
                },
                response: {
                    doOperations: [
                        {
                            action: "move",
                            id: "20200812220555-lj3enxa",
                            previousID: "20200812220555-lj3enxa",
                            parentID: "20200812220555-lj3enxa"
                        }
                    ]
                }
            }
        ],
        apiLink: 'https://github.com/siyuan-note/siyuan/blob/master/API.md#move-block'
    }
};

// Get block Kramdown
const getBlockKramdownHandler: CommandHandler = {
    namespace,
    name: 'getBlockKramdown',
    description: 'Get block Kramdown content',
    params: z.object({
        id: z.string().describe('Block ID')
    }),
    handler: createHandler('/api/block/getBlockKramdown'),
    documentation: {
        description: 'Get block Kramdown content',
        params: {
            id: {
                type: 'string',
                description: 'Block ID',
                required: true
            }
        },
        returns: {
            type: 'object',
            description: 'Block Kramdown content',
            properties: {
                id: 'Block ID',
                kramdown: 'Block content in Kramdown format'
            }
        },
        examples: [
            {
                description: 'This example retrieves the Kramdown-formatted content of a specific block, useful for advanced markdown processing or external integrations.',
                params: {
                    id: "20200812220555-lj3enxa"
                },
                response: {
                    id: "20200812220555-lj3enxa",
                    kramdown: "## Block content"
                }
            }
        ],
        apiLink: 'https://github.com/siyuan-note/siyuan/blob/master/API.md#get-block-kramdown'
    }
};

// Prepend block
const prependBlockHandler: CommandHandler = {
    namespace,
    name: 'prependBlock',
    description: 'Prepend blocks to a parent block',
    params: z.object({
        data: z.string().describe('Block content in Markdown format'),
        dataType: z.enum(['markdown', 'dom']).describe('Content type'),
        parentID: z.string().describe('Parent block ID')
    }),
    handler: createHandler('/api/block/prependBlock'),
    documentation: {
        description: 'Prepend blocks to a parent block',
        params: {
            data: {
                type: 'string',
                description: 'Block content in Markdown format',
                required: true
            },
            dataType: {
                type: 'string',
                description: 'Content type: markdown or dom',
                required: true
            },
            parentID: {
                type: 'string',
                description: 'Parent block ID',
                required: true
            }
        },
        returns: {
            type: 'object',
            description: 'Operation result',
            properties: {
                doOperations: 'Array of operations performed'
            }
        },
        examples: [
            {
                description: 'This example demonstrates prepending a new block with markdown content to the beginning of a parent block.',
                params: {
                    data: "Prepend content",
                    dataType: "markdown",
                    parentID: "20200812220555-lj3enxa"
                },
                response: {
                    doOperations: [
                        {
                            action: "insert",
                            data: "Prepend content",
                            id: "20200812220555-lj3enxa"
                        }
                    ]
                }
            }
        ],
        apiLink: 'https://github.com/siyuan-note/siyuan/blob/master/API.md#prepend-blocks'
    }
};

// Append block
const appendBlockHandler: CommandHandler = {
    namespace,
    name: 'appendBlock',
    description: 'Append blocks to a parent block',
    params: z.object({
        data: z.string().describe('Block content in Markdown format'),
        dataType: z.enum(['markdown', 'dom']).describe('Content type'),
        parentID: z.string().describe('Parent block ID')
    }),
    handler: createHandler('/api/block/appendBlock'),
    documentation: {
        description: 'Append blocks to a parent block',
        params: {
            data: {
                type: 'string',
                description: 'Block content in Markdown format',
                required: true
            },
            dataType: {
                type: 'string',
                description: 'Content type: markdown or dom',
                required: true
            },
            parentID: {
                type: 'string',
                description: 'Parent block ID',
                required: true
            }
        },
        returns: {
            type: 'object',
            description: 'Operation result',
            properties: {
                doOperations: 'Array of operations performed'
            }
        },
        examples: [
            {
                description: 'This example demonstrates appending a new block with markdown content to the end of a parent block.',
                params: {
                    data: "Append content",
                    dataType: "markdown",
                    parentID: "20200812220555-lj3enxa"
                },
                response: {
                    doOperations: [
                        {
                            action: "insert",
                            data: "Append content",
                            id: "20200812220555-lj3enxa"
                        }
                    ]
                }
            }
        ],
        apiLink: 'https://github.com/siyuan-note/siyuan/blob/master/API.md#append-blocks'
    }
};

// Get child blocks
const getChildBlocksHandler: CommandHandler = {
    namespace,
    name: 'getChildBlocks',
    description: 'Get child blocks of a parent block',
    params: z.object({
        id: z.string().describe('Parent block ID')
    }),
    handler: createHandler('/api/block/getChildBlocks'),
    documentation: {
        description: 'Get child blocks of a parent block',
        params: {
            id: {
                type: 'string',
                description: 'Parent block ID',
                required: true
            }
        },
        returns: {
            type: 'array',
            description: 'Child blocks list',
            properties: {
                items: 'Array of child blocks with id, type, subType'
            }
        },
        examples: [
            {
                description: 'This example retrieves all child blocks under a specific parent block, including their IDs, types, and sub-types.',
                params: {
                    id: "20200812220555-lj3enxa"
                },
                response: {
                    blocks: [
                        {
                            id: "20200812220555-lj3enxa",
                            type: "h",
                            subType: "h1"
                        }
                    ]
                }
            }
        ],
        apiLink: 'https://github.com/siyuan-note/siyuan/blob/master/API.md#get-child-blocks'
    }
};

// Fold block
const foldBlockHandler: CommandHandler = {
    namespace,
    name: 'foldBlock',
    description: 'Fold a block',
    params: z.object({
        id: z.string().describe('Block ID')
    }),
    handler: createHandler('/api/block/foldBlock'),
    documentation: {
        description: 'Fold a block',
        params: {
            id: {
                type: 'string',
                description: 'Block ID',
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
                description: 'This example demonstrates folding a block to collapse its content in the editor view.',
                params: {
                    id: "20200812220555-lj3enxa"
                },
                response: {}
            }
        ],
        apiLink: 'https://github.com/siyuan-note/siyuan/blob/master/API.md#fold-block'
    }
};

// Unfold block
const unfoldBlockHandler: CommandHandler = {
    namespace,
    name: 'unfoldBlock',
    description: 'Unfold a block',
    params: z.object({
        id: z.string().describe('Block ID')
    }),
    handler: createHandler('/api/block/unfoldBlock'),
    documentation: {
        description: 'Unfold a block',
        params: {
            id: {
                type: 'string',
                description: 'Block ID',
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
                description: 'This example demonstrates unfolding a previously folded block to expand its content in the editor view.',
                params: {
                    id: "20200812220555-lj3enxa"
                },
                response: {}
            }
        ],
        apiLink: 'https://github.com/siyuan-note/siyuan/blob/master/API.md#unfold-block'
    }
};

// Register all block related commands
export function registerBlockHandlers() {
    registry.registerCommand(insertBlockHandler);
    registry.registerCommand(prependBlockHandler);
    registry.registerCommand(appendBlockHandler);
    registry.registerCommand(updateBlockHandler);
    registry.registerCommand(deleteBlockHandler);
    registry.registerCommand(moveBlockHandler);
    registry.registerCommand(getBlockKramdownHandler);
    registry.registerCommand(getChildBlocksHandler);
    registry.registerCommand(foldBlockHandler);
    registry.registerCommand(unfoldBlockHandler);
} 
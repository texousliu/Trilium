import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ToolRegistry } from './tool_registry.js';
import type { Tool, ToolHandler } from './tool_interfaces.js';

// Mock dependencies
vi.mock('../../log.js', () => ({
    default: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn()
    }
}));

describe('ToolRegistry', () => {
    let registry: ToolRegistry;

    beforeEach(() => {
        // Reset singleton instance before each test
        (ToolRegistry as any).instance = undefined;
        registry = ToolRegistry.getInstance();
        
        // Clear any existing tools
        (registry as any).tools.clear();
        (registry as any).initializationAttempted = false;
        
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('singleton pattern', () => {
        it('should return the same instance', () => {
            const instance1 = ToolRegistry.getInstance();
            const instance2 = ToolRegistry.getInstance();
            
            expect(instance1).toBe(instance2);
        });

        it('should create instance only once', () => {
            const instance1 = ToolRegistry.getInstance();
            const instance2 = ToolRegistry.getInstance();
            const instance3 = ToolRegistry.getInstance();
            
            expect(instance1).toBe(instance2);
            expect(instance2).toBe(instance3);
        });
    });

    describe('tool validation', () => {
        it('should validate a proper tool handler', () => {
            const validHandler: ToolHandler = {
                definition: {
                    type: 'function',
                    function: {
                        name: 'test_tool',
                        description: 'A test tool',
                        parameters: {
                            type: 'object',
                            properties: {},
                            required: []
                        }
                    }
                },
                execute: vi.fn().mockResolvedValue('result')
            };

            registry.registerTool(validHandler);
            
            expect(registry.getTool('test_tool')).toBe(validHandler);
        });

        it('should reject null or undefined handler', () => {
            registry.registerTool(null as any);
            registry.registerTool(undefined as any);
            
            expect(registry.getTools()).toHaveLength(0);
        });

        it('should reject handler without definition', () => {
            const invalidHandler = {
                execute: vi.fn()
            } as any;

            registry.registerTool(invalidHandler);
            
            expect(registry.getTools()).toHaveLength(0);
        });

        it('should reject handler without function definition', () => {
            const invalidHandler = {
                definition: {
                    type: 'function'
                },
                execute: vi.fn()
            } as any;

            registry.registerTool(invalidHandler);
            
            expect(registry.getTools()).toHaveLength(0);
        });

        it('should reject handler without function name', () => {
            const invalidHandler = {
                definition: {
                    type: 'function',
                    function: {
                        description: 'Missing name'
                    }
                },
                execute: vi.fn()
            } as any;

            registry.registerTool(invalidHandler);
            
            expect(registry.getTools()).toHaveLength(0);
        });

        it('should reject handler without execute method', () => {
            const invalidHandler = {
                definition: {
                    type: 'function',
                    function: {
                        name: 'test_tool',
                        description: 'Test tool'
                    }
                }
            } as any;

            registry.registerTool(invalidHandler);
            
            expect(registry.getTools()).toHaveLength(0);
        });

        it('should reject handler with non-function execute', () => {
            const invalidHandler = {
                definition: {
                    type: 'function',
                    function: {
                        name: 'test_tool',
                        description: 'Test tool'
                    }
                },
                execute: 'not a function'
            } as any;

            registry.registerTool(invalidHandler);
            
            expect(registry.getTools()).toHaveLength(0);
        });
    });

    describe('tool registration', () => {
        it('should register a valid tool', () => {
            const handler: ToolHandler = {
                definition: {
                    type: 'function',
                    function: {
                        name: 'calculator',
                        description: 'Performs calculations',
                        parameters: {
                            type: 'object',
                            properties: {
                                expression: { type: 'string' }
                            },
                            required: ['expression']
                        }
                    }
                },
                execute: vi.fn().mockResolvedValue('42')
            };

            registry.registerTool(handler);
            
            expect(registry.getTool('calculator')).toBe(handler);
            expect(registry.getTools()).toHaveLength(1);
        });

        it('should prevent duplicate tool registration', () => {
            const handler1: ToolHandler = {
                definition: {
                    type: 'function',
                    function: {
                        name: 'duplicate_tool',
                        description: 'First version'
                    }
                },
                execute: vi.fn()
            };

            const handler2: ToolHandler = {
                definition: {
                    type: 'function',
                    function: {
                        name: 'duplicate_tool',
                        description: 'Second version'
                    }
                },
                execute: vi.fn()
            };

            registry.registerTool(handler1);
            registry.registerTool(handler2);
            
            // Should keep the first registration
            expect(registry.getTool('duplicate_tool')).toBe(handler1);
            expect(registry.getTools()).toHaveLength(1);
        });

        it('should handle registration errors gracefully', () => {
            const handlerWithError = {
                definition: {
                    type: 'function',
                    function: {
                        name: 'error_tool',
                        description: 'This will cause an error'
                    }
                },
                execute: null
            } as any;

            // Should not throw
            expect(() => registry.registerTool(handlerWithError)).not.toThrow();
            expect(registry.getTool('error_tool')).toBeUndefined();
        });
    });

    describe('tool retrieval', () => {
        beforeEach(() => {
            const tools = [
                {
                    name: 'tool1',
                    description: 'First tool'
                },
                {
                    name: 'tool2',
                    description: 'Second tool'
                },
                {
                    name: 'tool3',
                    description: 'Third tool'
                }
            ];

            tools.forEach(tool => {
                const handler: ToolHandler = {
                    definition: {
                        type: 'function',
                        function: tool
                    },
                    execute: vi.fn()
                };
                registry.registerTool(handler);
            });
        });

        it('should retrieve a tool by name', () => {
            const tool = registry.getTool('tool1');
            
            expect(tool).toBeDefined();
            expect(tool?.definition.function.name).toBe('tool1');
        });

        it('should return undefined for non-existent tool', () => {
            const tool = registry.getTool('non_existent');
            
            expect(tool).toBeUndefined();
        });

        it('should get all registered tools', () => {
            const tools = registry.getTools();
            
            expect(tools).toHaveLength(3);
            expect(tools.map(t => t.definition.function.name)).toEqual(['tool1', 'tool2', 'tool3']);
        });

        it('should get tool definitions', () => {
            const definitions = registry.getToolDefinitions();
            
            expect(definitions).toHaveLength(3);
            expect(definitions[0]).toEqual({
                type: 'function',
                function: {
                    name: 'tool1',
                    description: 'First tool'
                }
            });
        });

        it('should check if tool exists', () => {
            expect(registry.hasTool('tool1')).toBe(true);
            expect(registry.hasTool('non_existent')).toBe(false);
        });
    });

    describe('tool execution', () => {
        let mockHandler: ToolHandler;

        beforeEach(() => {
            mockHandler = {
                definition: {
                    type: 'function',
                    function: {
                        name: 'test_executor',
                        description: 'Test tool for execution',
                        parameters: {
                            type: 'object',
                            properties: {
                                input: { type: 'string' }
                            },
                            required: ['input']
                        }
                    }
                },
                execute: vi.fn().mockResolvedValue('execution result')
            };

            registry.registerTool(mockHandler);
        });

        it('should execute a tool with arguments', async () => {
            const result = await registry.executeTool('test_executor', { input: 'test value' });
            
            expect(result).toBe('execution result');
            expect(mockHandler.execute).toHaveBeenCalledWith({ input: 'test value' });
        });

        it('should throw error for non-existent tool', async () => {
            await expect(
                registry.executeTool('non_existent', {})
            ).rejects.toThrow('Tool non_existent not found');
        });

        it('should handle tool execution errors', async () => {
            mockHandler.execute = vi.fn().mockRejectedValue(new Error('Execution failed'));
            
            await expect(
                registry.executeTool('test_executor', { input: 'test' })
            ).rejects.toThrow('Execution failed');
        });

        it('should execute tool without arguments', async () => {
            const simpleHandler: ToolHandler = {
                definition: {
                    type: 'function',
                    function: {
                        name: 'simple_tool',
                        description: 'Simple tool'
                    }
                },
                execute: vi.fn().mockResolvedValue('simple result')
            };

            registry.registerTool(simpleHandler);
            
            const result = await registry.executeTool('simple_tool');
            
            expect(result).toBe('simple result');
            expect(simpleHandler.execute).toHaveBeenCalledWith(undefined);
        });
    });

    describe('tool unregistration', () => {
        beforeEach(() => {
            const handler: ToolHandler = {
                definition: {
                    type: 'function',
                    function: {
                        name: 'removable_tool',
                        description: 'A tool that can be removed'
                    }
                },
                execute: vi.fn()
            };

            registry.registerTool(handler);
        });

        it('should unregister a tool', () => {
            expect(registry.hasTool('removable_tool')).toBe(true);
            
            registry.unregisterTool('removable_tool');
            
            expect(registry.hasTool('removable_tool')).toBe(false);
        });

        it('should handle unregistering non-existent tool', () => {
            // Should not throw
            expect(() => registry.unregisterTool('non_existent')).not.toThrow();
        });
    });

    describe('registry clearing', () => {
        beforeEach(() => {
            // Register multiple tools
            for (let i = 1; i <= 3; i++) {
                const handler: ToolHandler = {
                    definition: {
                        type: 'function',
                        function: {
                            name: `tool${i}`,
                            description: `Tool ${i}`
                        }
                    },
                    execute: vi.fn()
                };
                registry.registerTool(handler);
            }
        });

        it('should clear all tools', () => {
            expect(registry.getTools()).toHaveLength(3);
            
            registry.clear();
            
            expect(registry.getTools()).toHaveLength(0);
        });

        it('should reset initialization flag on clear', () => {
            (registry as any).initializationAttempted = true;
            
            registry.clear();
            
            expect((registry as any).initializationAttempted).toBe(false);
        });
    });

    describe('initialization handling', () => {
        it('should attempt initialization when registry is empty', () => {
            const emptyRegistry = ToolRegistry.getInstance();
            (emptyRegistry as any).tools.clear();
            (emptyRegistry as any).initializationAttempted = false;
            
            // Try to get tools which should trigger initialization attempt
            emptyRegistry.getTools();
            
            expect((emptyRegistry as any).initializationAttempted).toBe(true);
        });

        it('should not attempt initialization twice', () => {
            const spy = vi.spyOn(registry as any, 'tryInitializeTools');
            
            registry.getTools(); // First call
            registry.getTools(); // Second call
            
            expect(spy).toHaveBeenCalledTimes(1);
        });

        it('should not attempt initialization if tools exist', () => {
            const handler: ToolHandler = {
                definition: {
                    type: 'function',
                    function: {
                        name: 'existing_tool',
                        description: 'Already exists'
                    }
                },
                execute: vi.fn()
            };

            registry.registerTool(handler);
            
            const spy = vi.spyOn(registry as any, 'tryInitializeTools');
            
            registry.getTools();
            
            expect(spy).not.toHaveBeenCalled();
        });
    });

    describe('error handling', () => {
        it('should handle validation errors gracefully', () => {
            const problematicHandler = {
                definition: {
                    type: 'function',
                    function: {
                        name: 'problematic',
                        description: 'This will cause validation issues'
                    }
                },
                execute: () => { throw new Error('Validation error'); }
            } as any;

            // Should not throw during registration
            expect(() => registry.registerTool(problematicHandler)).not.toThrow();
        });

        it('should handle tool execution that throws synchronously', async () => {
            const throwingHandler: ToolHandler = {
                definition: {
                    type: 'function',
                    function: {
                        name: 'throwing_tool',
                        description: 'Throws an error'
                    }
                },
                execute: vi.fn().mockImplementation(() => {
                    throw new Error('Synchronous error');
                })
            };

            registry.registerTool(throwingHandler);
            
            await expect(
                registry.executeTool('throwing_tool', {})
            ).rejects.toThrow('Synchronous error');
        });
    });
});
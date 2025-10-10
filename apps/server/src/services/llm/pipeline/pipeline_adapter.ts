/**
 * Pipeline Adapter - Phase 1 Implementation
 *
 * Provides a unified interface for both legacy and V2 pipelines:
 * - Feature flag to switch between pipelines
 * - Translates between different input/output formats
 * - Enables gradual migration without breaking changes
 * - Provides metrics comparison between pipelines
 *
 * Usage:
 *   import pipelineAdapter from './pipeline_adapter.js';
 *   const response = await pipelineAdapter.execute(input);
 *
 * The adapter automatically selects the appropriate pipeline based on:
 * 1. Environment variable: USE_LEGACY_PIPELINE=true/false
 * 2. Option in input: useLegacyPipeline: true/false
 * 3. Default: V2 pipeline (new architecture)
 */

import type {
    Message,
    ChatCompletionOptions,
    ChatResponse
} from '../ai_interface.js';
import { ChatPipeline } from './chat_pipeline.js';
import pipelineV2, { type PipelineV2Input, type PipelineV2Output } from './pipeline_v2.js';
import { createLogger, LogLevel } from '../utils/structured_logger.js';
import type { ChatPipelineInput } from './interfaces.js';
import options from '../../options.js';

/**
 * Adapter input interface
 * Unified interface that works with both pipelines
 */
export interface AdapterInput {
    messages: Message[];
    options?: ChatCompletionOptions;
    noteId?: string;
    query?: string;
    format?: 'stream' | 'json';
    streamCallback?: (text: string, done: boolean, chunk?: any) => Promise<void> | void;
    showThinking?: boolean;
    requestId?: string;
    useLegacyPipeline?: boolean; // Override pipeline selection
}

/**
 * Adapter output interface
 */
export interface AdapterOutput extends ChatResponse {
    pipelineVersion: 'legacy' | 'v2';
    requestId?: string;
    processingTime?: number;
}

/**
 * Pipeline selection strategy
 */
export enum PipelineStrategy {
    LEGACY = 'legacy',
    V2 = 'v2',
    AUTO = 'auto' // Future: could auto-select based on query complexity
}

/**
 * Pipeline Adapter Implementation
 */
export class PipelineAdapter {
    private logger = createLogger();
    private legacyPipeline: ChatPipeline | null = null;
    private metrics = {
        legacy: { totalExecutions: 0, totalTime: 0 },
        v2: { totalExecutions: 0, totalTime: 0 }
    };

    /**
     * Execute pipeline with automatic selection
     */
    async execute(input: AdapterInput): Promise<AdapterOutput> {
        const strategy = this.selectPipeline(input);

        this.logger.debug('Pipeline adapter executing', {
            strategy,
            messageCount: input.messages.length,
            hasQuery: !!input.query
        });

        if (strategy === PipelineStrategy.LEGACY) {
            return this.executeLegacy(input);
        } else {
            return this.executeV2(input);
        }
    }

    /**
     * Select which pipeline to use
     */
    private selectPipeline(input: AdapterInput): PipelineStrategy {
        // 1. Check explicit override in input
        if (input.useLegacyPipeline !== undefined) {
            return input.useLegacyPipeline ? PipelineStrategy.LEGACY : PipelineStrategy.V2;
        }

        // 2. Check environment variable
        const envVar = process.env.USE_LEGACY_PIPELINE;
        if (envVar !== undefined) {
            return envVar === 'true' ? PipelineStrategy.LEGACY : PipelineStrategy.V2;
        }

        // 3. Check options (if available)
        try {
            const useLegacy = (options as any).getOptionBool('useLegacyPipeline');
            if (useLegacy !== undefined) {
                return useLegacy ? PipelineStrategy.LEGACY : PipelineStrategy.V2;
            }
        } catch {
            // Ignore if option doesn't exist
        }

        // 4. Default to V2 (new architecture)
        return PipelineStrategy.V2;
    }

    /**
     * Execute using legacy pipeline
     */
    private async executeLegacy(input: AdapterInput): Promise<AdapterOutput> {
        const startTime = Date.now();

        try {
            // Initialize legacy pipeline if needed
            if (!this.legacyPipeline) {
                try {
                    this.legacyPipeline = new ChatPipeline();
                } catch (error) {
                    this.logger.error('Failed to initialize legacy pipeline', error);
                    throw new Error(
                        `Legacy pipeline initialization failed: ${error instanceof Error ? error.message : String(error)}`
                    );
                }
            }

            // Convert adapter input to legacy pipeline input
            const legacyInput: ChatPipelineInput = {
                messages: input.messages,
                options: input.options || {},
                noteId: input.noteId,
                query: input.query,
                format: input.format,
                streamCallback: input.streamCallback,
                showThinking: input.showThinking
            };

            // Execute legacy pipeline
            const response = await this.legacyPipeline.execute(legacyInput);

            // Update metrics
            const processingTime = Date.now() - startTime;
            this.updateMetrics('legacy', processingTime);

            this.logger.info('Legacy pipeline executed', {
                duration: processingTime,
                responseLength: response.text.length
            });

            return {
                ...response,
                pipelineVersion: 'legacy',
                requestId: input.requestId,
                processingTime
            };

        } catch (error) {
            this.logger.error('Legacy pipeline error', error);
            throw error;
        }
    }

    /**
     * Execute using V2 pipeline
     */
    private async executeV2(input: AdapterInput): Promise<AdapterOutput> {
        const startTime = Date.now();

        try {
            // Convert adapter input to V2 pipeline input
            const v2Input: PipelineV2Input = {
                messages: input.messages,
                options: input.options,
                noteId: input.noteId,
                query: input.query,
                streamCallback: input.streamCallback,
                requestId: input.requestId
            };

            // Execute V2 pipeline
            const response = await pipelineV2.execute(v2Input);

            // Update metrics
            const processingTime = Date.now() - startTime;
            this.updateMetrics('v2', processingTime);

            this.logger.info('V2 pipeline executed', {
                duration: processingTime,
                responseLength: response.text.length,
                stagesExecuted: response.stagesExecuted
            });

            return {
                ...response,
                pipelineVersion: 'v2',
                requestId: response.requestId,
                processingTime: response.processingTime
            };

        } catch (error) {
            this.logger.error('V2 pipeline error', error);
            throw error;
        }
    }

    /**
     * Update metrics
     */
    private updateMetrics(pipeline: 'legacy' | 'v2', duration: number): void {
        const metric = this.metrics[pipeline];
        metric.totalExecutions++;
        metric.totalTime += duration;
    }

    /**
     * Get performance metrics
     */
    getMetrics(): {
        legacy: { executions: number; averageTime: number };
        v2: { executions: number; averageTime: number };
        improvement: number;
    } {
        const legacyAvg = this.metrics.legacy.totalExecutions > 0
            ? this.metrics.legacy.totalTime / this.metrics.legacy.totalExecutions
            : 0;

        const v2Avg = this.metrics.v2.totalExecutions > 0
            ? this.metrics.v2.totalTime / this.metrics.v2.totalExecutions
            : 0;

        const improvement = legacyAvg > 0 && v2Avg > 0
            ? ((legacyAvg - v2Avg) / legacyAvg * 100)
            : 0;

        return {
            legacy: {
                executions: this.metrics.legacy.totalExecutions,
                averageTime: legacyAvg
            },
            v2: {
                executions: this.metrics.v2.totalExecutions,
                averageTime: v2Avg
            },
            improvement
        };
    }

    /**
     * Reset metrics
     */
    resetMetrics(): void {
        this.metrics.legacy = { totalExecutions: 0, totalTime: 0 };
        this.metrics.v2 = { totalExecutions: 0, totalTime: 0 };
    }

    /**
     * Force specific pipeline for testing
     */
    async executeWithPipeline(
        input: AdapterInput,
        pipeline: PipelineStrategy
    ): Promise<AdapterOutput> {
        const modifiedInput = { ...input, useLegacyPipeline: pipeline === PipelineStrategy.LEGACY };
        return this.execute(modifiedInput);
    }
}

// Export singleton instance
const pipelineAdapter = new PipelineAdapter();
export default pipelineAdapter;

/**
 * Convenience functions
 */
export async function executePipeline(input: AdapterInput): Promise<AdapterOutput> {
    return pipelineAdapter.execute(input);
}

export async function executeLegacyPipeline(input: AdapterInput): Promise<AdapterOutput> {
    return pipelineAdapter.executeWithPipeline(input, PipelineStrategy.LEGACY);
}

export async function executeV2Pipeline(input: AdapterInput): Promise<AdapterOutput> {
    return pipelineAdapter.executeWithPipeline(input, PipelineStrategy.V2);
}

export function getPipelineMetrics() {
    return pipelineAdapter.getMetrics();
}

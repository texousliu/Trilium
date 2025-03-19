/**
 * Contextual Thinking Tool
 *
 * Provides a way for the LLM agent to expose its reasoning process to the user,
 * showing how it explores knowledge and reaches conclusions. This makes the
 * agent's thinking more transparent and allows users to understand the context
 * behind answers.
 *
 * Features:
 * - Capture and structure the agent's thinking steps
 * - Visualize reasoning chains for complex queries
 * - Expose confidence levels for different assertions
 * - Show how different sources of evidence are weighed
 */

import log from "../../log.js";
import aiServiceManager from "../ai_service_manager.js";

/**
 * Represents a single reasoning step taken by the agent
 */
export interface ThinkingStep {
  id: string;
  content: string;
  type: 'observation' | 'hypothesis' | 'question' | 'evidence' | 'conclusion';
  confidence?: number;
  sources?: string[];
  parentId?: string;
  children?: string[];
  metadata?: Record<string, any>;
}

/**
 * Contains the full reasoning process
 */
export interface ThinkingProcess {
  id: string;
  query: string;
  steps: ThinkingStep[];
  status: 'in_progress' | 'completed';
  startTime: number;
  endTime?: number;
}

export class ContextualThinkingTool {
  private static thinkingCounter = 0;
  private static stepCounter = 0;
  private activeProcId?: string;
  private processes: Record<string, ThinkingProcess> = {};

  /**
   * Start a new thinking process for a given query
   *
   * @param query The user query that initiated the thinking process
   * @returns The ID of the new thinking process
   */
  startThinking(query: string): string {
    const id = this.generateProcessId();

    this.processes[id] = {
      id,
      query,
      steps: [],
      status: 'in_progress',
      startTime: Date.now()
    };

    this.activeProcId = id;
    return id;
  }

  /**
   * Add a thinking step to the current active process
   *
   * @param content The content of the thinking step
   * @param type The type of thinking step
   * @param options Additional options for the step
   * @returns The ID of the new step
   */
  addThinkingStep(
    content: string,
    type: ThinkingStep['type'],
    options: {
      confidence?: number;
      sources?: string[];
      parentId?: string;
      metadata?: Record<string, any>;
    } = {}
  ): string | null {
    if (!this.activeProcId || !this.processes[this.activeProcId]) {
      log.error("No active thinking process to add step to");
      return null;
    }

    const stepId = this.generateStepId();
    const step: ThinkingStep = {
      id: stepId,
      content,
      type,
      ...options
    };

    // Add to parent's children if a parent is specified
    if (options.parentId) {
      const parentIdx = this.processes[this.activeProcId].steps.findIndex(
        s => s.id === options.parentId
      );

      if (parentIdx >= 0) {
        const parent = this.processes[this.activeProcId].steps[parentIdx];
        if (!parent.children) {
          parent.children = [];
        }
        parent.children.push(stepId);
        this.processes[this.activeProcId].steps[parentIdx] = parent;
      }
    }

    this.processes[this.activeProcId].steps.push(step);
    return stepId;
  }

  /**
   * Complete the current thinking process
   *
   * @param processId The ID of the process to complete (defaults to active process)
   * @returns The completed thinking process
   */
  completeThinking(processId?: string): ThinkingProcess | null {
    const id = processId || this.activeProcId;

    if (!id || !this.processes[id]) {
      log.error(`Thinking process ${id} not found`);
      return null;
    }

    this.processes[id].status = 'completed';
    this.processes[id].endTime = Date.now();

    if (id === this.activeProcId) {
      this.activeProcId = undefined;
    }

    return this.processes[id];
  }

  /**
   * Get a thinking process by ID
   */
  getThinkingProcess(processId: string): ThinkingProcess | null {
    return this.processes[processId] || null;
  }

  /**
   * Get the active thinking process
   */
  getActiveThinkingProcess(): ThinkingProcess | null {
    if (!this.activeProcId) return null;
    return this.processes[this.activeProcId] || null;
  }

  /**
   * Visualize the thinking process as HTML for display in the UI
   *
   * @param thinkingId The ID of the thinking process to visualize
   * @returns HTML representation of the thinking process
   */
  visualizeThinking(thinkingId: string): string {
    log.info(`Visualizing thinking process: thinkingId=${thinkingId}`);

    const process = this.getThinkingProcess(thinkingId);
    if (!process) {
      log.info(`No thinking process found for id: ${thinkingId}`);
      return "<div class='thinking-process'>No thinking process found</div>";
    }

    log.info(`Found thinking process with ${process.steps.length} steps for query: "${process.query.substring(0, 50)}..."`);

    let html = "<div class='thinking-process'>";
    html += `<h4>Thinking Process</h4>`;

    for (const step of process.steps) {
      html += `<div class='thinking-step ${step.type || ""}'>`;

      // Add an icon based on step type
      const icon = this.getStepIcon(step.type);
      html += `<span class='bx ${icon}'></span> `;

      // Add the step content
      html += step.content;

      // Show confidence if available
      if (step.metadata?.confidence) {
        const confidence = Math.round((step.metadata.confidence as number) * 100);
        html += ` <span class='thinking-confidence'>(Confidence: ${confidence}%)</span>`;
      }

      html += `</div>`;
    }

    html += "</div>";
    return html;
  }

  /**
   * Get an appropriate icon for a thinking step type
   */
  private getStepIcon(type: string): string {
    switch (type) {
      case 'observation':
        return 'bx-search';
      case 'hypothesis':
        return 'bx-bulb';
      case 'evidence':
        return 'bx-list-check';
      case 'conclusion':
        return 'bx-check-circle';
      default:
        return 'bx-message-square-dots';
    }
  }

  /**
   * Get a plain text summary of the thinking process
   *
   * @param thinkingId The ID of the thinking process to summarize
   * @returns Text summary of the thinking process
   */
  getThinkingSummary(thinkingId: string): string {
    const process = this.getThinkingProcess(thinkingId);
    if (!process) {
      return "No thinking process available.";
    }

    return this.visualizeThinking(thinkingId);
  }

  /**
   * Reset the active thinking process
   */
  resetActiveThinking(): void {
    this.activeProcId = undefined;
  }

  /**
   * Generate a unique ID for a thinking process
   */
  private generateProcessId(): string {
    return `thinking_${Date.now()}_${ContextualThinkingTool.thinkingCounter++}`;
  }

  /**
   * Generate a unique ID for a thinking step
   */
  private generateStepId(): string {
    return `step_${Date.now()}_${ContextualThinkingTool.stepCounter++}`;
  }

  /**
   * Format duration between two timestamps
   */
  private formatDuration(start: number, end: number): string {
    const durationMs = end - start;
    if (durationMs < 1000) {
      return `${durationMs}ms`;
    } else if (durationMs < 60000) {
      return `${Math.round(durationMs / 1000)}s`;
    } else {
      return `${Math.round(durationMs / 60000)}m ${Math.round((durationMs % 60000) / 1000)}s`;
    }
  }

  /**
   * Recursively render a step and its children
   */
  private renderStepTree(step: ThinkingStep, allSteps: ThinkingStep[]): string {
    const typeIcons: Record<string, string> = {
      'observation': '🔍',
      'hypothesis': '🤔',
      'question': '❓',
      'evidence': '📋',
      'conclusion': '✅'
    };

    const icon = typeIcons[step.type] || '•';
    const confidenceDisplay = step.confidence !== undefined
      ? `<span class="confidence">${Math.round(step.confidence * 100)}%</span>`
      : '';

    let html = `
      <div class="thinking-step thinking-${step.type}">
        <div class="step-header">
          <span class="step-icon">${icon}</span>
          <span class="step-type">${step.type}</span>
          ${confidenceDisplay}
        </div>
        <div class="step-content">${step.content}</div>
    `;

    // Add sources if available
    if (step.sources && step.sources.length > 0) {
      html += `<div class="step-sources">Sources: ${step.sources.join(', ')}</div>`;
    }

    // Recursively render children
    if (step.children && step.children.length > 0) {
      html += `<div class="step-children">`;

      for (const childId of step.children) {
        const childStep = allSteps.find(s => s.id === childId);
        if (childStep) {
          html += this.renderStepTree(childStep, allSteps);
        }
      }

      html += `</div>`;
    }

    html += `</div>`;
    return html;
  }
}

export default ContextualThinkingTool;

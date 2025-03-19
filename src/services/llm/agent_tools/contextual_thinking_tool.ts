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

import log from '../../log.js';

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
   * Generate a user-friendly HTML representation of the thinking process
   *
   * @param processId The ID of the process to visualize
   * @returns HTML string representing the thinking process
   */
  visualizeThinking(processId: string): string {
    const process = this.getThinkingProcess(processId);
    if (!process) {
      return `<div class="thinking-error">Thinking process ${processId} not found</div>`;
    }

    let html = `
      <div class="thinking-process">
        <div class="thinking-header">
          <h3>Thinking Process for: "${process.query}"</h3>
          <div class="thinking-metadata">
            <span>Status: ${process.status}</span>
            <span>Steps: ${process.steps.length}</span>
            <span>Time: ${this.formatDuration(process.startTime, process.endTime || Date.now())}</span>
          </div>
        </div>
        <div class="thinking-steps">
    `;

    // Find root steps (those without parents)
    const rootSteps = process.steps.filter(step => !step.parentId);

    // Recursively render the thinking tree
    for (const rootStep of rootSteps) {
      html += this.renderStepTree(rootStep, process.steps);
    }

    html += `
        </div>
      </div>
    `;

    return html;
  }

  /**
   * Generate a concise text representation of the thinking process
   * that can be displayed inline in the chat for transparency
   *
   * @param processId The ID of the process to summarize
   * @returns Text summary of the reasoning process
   */
  getThinkingSummary(processId?: string): string {
    const id = processId || this.activeProcId;
    if (!id || !this.processes[id]) {
      return "No thinking process available.";
    }

    const process = this.processes[id];
    let summary = `Thinking about: "${process.query}"\n\n`;

    // Group steps by type
    const stepsByType: Record<string, ThinkingStep[]> = {};
    for (const step of process.steps) {
      if (!stepsByType[step.type]) {
        stepsByType[step.type] = [];
      }
      stepsByType[step.type].push(step);
    }

    // Show observations first
    if (stepsByType['observation'] && stepsByType['observation'].length > 0) {
      summary += "🔍 Observations:\n";
      for (const step of stepsByType['observation'].slice(0, 3)) {
        summary += `- ${step.content}\n`;
      }
      if (stepsByType['observation'].length > 3) {
        summary += `- ...and ${stepsByType['observation'].length - 3} more observations\n`;
      }
      summary += "\n";
    }

    // Show questions the agent asked itself
    if (stepsByType['question'] && stepsByType['question'].length > 0) {
      summary += "❓ Questions considered:\n";
      for (const step of stepsByType['question'].slice(0, 3)) {
        summary += `- ${step.content}\n`;
      }
      if (stepsByType['question'].length > 3) {
        summary += `- ...and ${stepsByType['question'].length - 3} more questions\n`;
      }
      summary += "\n";
    }

    // Show evidence
    if (stepsByType['evidence'] && stepsByType['evidence'].length > 0) {
      summary += "📋 Evidence found:\n";
      for (const step of stepsByType['evidence'].slice(0, 3)) {
        summary += `- ${step.content}\n`;
      }
      if (stepsByType['evidence'].length > 3) {
        summary += `- ...and ${stepsByType['evidence'].length - 3} more pieces of evidence\n`;
      }
      summary += "\n";
    }

    // Show conclusions
    if (stepsByType['conclusion'] && stepsByType['conclusion'].length > 0) {
      summary += "✅ Conclusions:\n";
      for (const step of stepsByType['conclusion']) {
        const confidence = step.confidence ? ` (${Math.round(step.confidence * 100)}% confidence)` : '';
        summary += `- ${step.content}${confidence}\n`;
      }
    }

    return summary;
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

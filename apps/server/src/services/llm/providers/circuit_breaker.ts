/**
 * Circuit Breaker Pattern Implementation for LLM Providers
 * 
 * Implements a circuit breaker to prevent hammering failing providers.
 * States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Provider is failing, requests are rejected immediately
 * - HALF_OPEN: Testing if provider has recovered
 */

import log from '../../log.js';

/**
 * Circuit breaker states
 */
export enum CircuitState {
    CLOSED = 'CLOSED',
    OPEN = 'OPEN',
    HALF_OPEN = 'HALF_OPEN'
}

/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfig {
    /** Number of failures before opening circuit */
    failureThreshold: number;
    /** Time window for counting failures (ms) */
    failureWindow: number;
    /** Cooldown period before attempting half-open (ms) */
    cooldownPeriod: number;
    /** Number of successes in half-open to close circuit */
    successThreshold: number;
    /** Request timeout for half-open state (ms) */
    halfOpenTimeout: number;
    /** Whether to log state transitions */
    enableLogging: boolean;
}

/**
 * Circuit breaker statistics
 */
export interface CircuitBreakerStats {
    state: CircuitState;
    failures: number;
    successes: number;
    lastFailureTime?: Date;
    lastSuccessTime?: Date;
    lastStateChange: Date;
    totalRequests: number;
    rejectedRequests: number;
    stateHistory: Array<{
        state: CircuitState;
        timestamp: Date;
        reason: string;
    }>;
}

/**
 * Error type for circuit breaker rejections
 */
export class CircuitOpenError extends Error {
    constructor(public readonly providerName: string, public readonly nextRetryTime: Date) {
        super(`Circuit breaker is OPEN for provider ${providerName}. Will retry after ${nextRetryTime.toISOString()}`);
        this.name = 'CircuitOpenError';
    }
}

/**
 * Circuit Breaker implementation
 */
export class CircuitBreaker {
    private state: CircuitState = CircuitState.CLOSED;
    private failures: number = 0;
    private successes: number = 0;
    private failureTimestamps: Date[] = [];
    private lastStateChangeTime: Date = new Date();
    private cooldownTimer?: NodeJS.Timeout;
    private stats: CircuitBreakerStats;
    private readonly config: CircuitBreakerConfig;

    constructor(
        private readonly name: string,
        config?: Partial<CircuitBreakerConfig>
    ) {
        this.config = {
            failureThreshold: config?.failureThreshold ?? 5,
            failureWindow: config?.failureWindow ?? 60000, // 1 minute
            cooldownPeriod: config?.cooldownPeriod ?? 30000, // 30 seconds
            successThreshold: config?.successThreshold ?? 2,
            halfOpenTimeout: config?.halfOpenTimeout ?? 5000, // 5 seconds
            enableLogging: config?.enableLogging ?? true
        };

        this.stats = {
            state: this.state,
            failures: 0,
            successes: 0,
            lastStateChange: this.lastStateChangeTime,
            totalRequests: 0,
            rejectedRequests: 0,
            stateHistory: []
        };
    }

    /**
     * Execute a function with circuit breaker protection
     */
    public async execute<T>(
        fn: () => Promise<T>,
        timeout?: number
    ): Promise<T> {
        this.stats.totalRequests++;

        // Check if circuit is open
        if (this.state === CircuitState.OPEN) {
            this.stats.rejectedRequests++;
            const nextRetryTime = new Date(this.lastStateChangeTime.getTime() + this.config.cooldownPeriod);
            throw new CircuitOpenError(this.name, nextRetryTime);
        }

        // Apply timeout for half-open state
        const executionTimeout = this.state === CircuitState.HALF_OPEN 
            ? this.config.halfOpenTimeout 
            : timeout;

        try {
            const result = await this.executeWithTimeout(fn, executionTimeout);
            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure(error);
            throw error;
        }
    }

    /**
     * Execute function with timeout
     */
    private async executeWithTimeout<T>(
        fn: () => Promise<T>,
        timeout?: number
    ): Promise<T> {
        if (!timeout) {
            return fn();
        }

        return Promise.race([
            fn(),
            new Promise<T>((_, reject) =>
                setTimeout(() => reject(new Error(`Operation timed out after ${timeout}ms`)), timeout)
            )
        ]);
    }

    /**
     * Handle successful execution
     */
    private onSuccess(): void {
        this.successes++;
        this.stats.successes++;
        this.stats.lastSuccessTime = new Date();

        switch (this.state) {
            case CircuitState.HALF_OPEN:
                if (this.successes >= this.config.successThreshold) {
                    this.transitionTo(CircuitState.CLOSED, 'Success threshold reached');
                    this.reset();
                }
                break;
            
            case CircuitState.CLOSED:
                // Clear old failure timestamps
                this.cleanupFailureTimestamps();
                break;
        }
    }

    /**
     * Handle failed execution
     */
    private onFailure(error: any): void {
        const now = new Date();
        this.failures++;
        this.stats.failures++;
        this.stats.lastFailureTime = now;
        this.failureTimestamps.push(now);

        switch (this.state) {
            case CircuitState.HALF_OPEN:
                // Immediately open on failure in half-open state
                this.transitionTo(CircuitState.OPEN, `Failure in HALF_OPEN state: ${error.message}`);
                this.scheduleCooldown();
                break;
            
            case CircuitState.CLOSED:
                // Check if we've exceeded failure threshold
                this.cleanupFailureTimestamps();
                if (this.failureTimestamps.length >= this.config.failureThreshold) {
                    this.transitionTo(CircuitState.OPEN, `Failure threshold exceeded: ${this.failures} failures in ${this.config.failureWindow}ms`);
                    this.scheduleCooldown();
                }
                break;
        }
    }

    /**
     * Clean up old failure timestamps outside the window
     */
    private cleanupFailureTimestamps(): void {
        const now = Date.now();
        const windowStart = now - this.config.failureWindow;
        this.failureTimestamps = this.failureTimestamps.filter(
            timestamp => timestamp.getTime() > windowStart
        );
    }

    /**
     * Transition to a new state
     */
    private transitionTo(newState: CircuitState, reason: string): void {
        const oldState = this.state;
        this.state = newState;
        this.lastStateChangeTime = new Date();
        this.stats.state = newState;
        this.stats.lastStateChange = this.lastStateChangeTime;

        // Add to state history
        this.stats.stateHistory.push({
            state: newState,
            timestamp: this.lastStateChangeTime,
            reason
        });

        // Keep only last 100 state transitions
        if (this.stats.stateHistory.length > 100) {
            this.stats.stateHistory = this.stats.stateHistory.slice(-100);
        }

        if (this.config.enableLogging) {
            log.info(`[CircuitBreaker:${this.name}] State transition: ${oldState} -> ${newState}. Reason: ${reason}`);
        }
    }

    /**
     * Schedule cooldown period
     */
    private scheduleCooldown(): void {
        if (this.cooldownTimer) {
            clearTimeout(this.cooldownTimer);
        }

        this.cooldownTimer = setTimeout(() => {
            if (this.state === CircuitState.OPEN) {
                this.transitionTo(CircuitState.HALF_OPEN, 'Cooldown period expired');
                this.successes = 0; // Reset success counter for half-open state
            }
        }, this.config.cooldownPeriod);
    }

    /**
     * Reset counters
     */
    private reset(): void {
        this.failures = 0;
        this.successes = 0;
        this.failureTimestamps = [];
        
        if (this.cooldownTimer) {
            clearTimeout(this.cooldownTimer);
            this.cooldownTimer = undefined;
        }
    }

    /**
     * Get current state
     */
    public getState(): CircuitState {
        return this.state;
    }

    /**
     * Get statistics
     */
    public getStats(): CircuitBreakerStats {
        return { ...this.stats };
    }

    /**
     * Force open the circuit (for testing or manual intervention)
     */
    public forceOpen(reason: string = 'Manual intervention'): void {
        this.transitionTo(CircuitState.OPEN, reason);
        this.scheduleCooldown();
    }

    /**
     * Force close the circuit (for testing or manual intervention)
     */
    public forceClose(reason: string = 'Manual intervention'): void {
        this.transitionTo(CircuitState.CLOSED, reason);
        this.reset();
    }

    /**
     * Check if circuit allows requests
     */
    public isAvailable(): boolean {
        return this.state !== CircuitState.OPEN;
    }

    /**
     * Get time until next retry (if circuit is open)
     */
    public getNextRetryTime(): Date | null {
        if (this.state !== CircuitState.OPEN) {
            return null;
        }
        return new Date(this.lastStateChangeTime.getTime() + this.config.cooldownPeriod);
    }

    /**
     * Cleanup resources
     */
    public dispose(): void {
        if (this.cooldownTimer) {
            clearTimeout(this.cooldownTimer);
            this.cooldownTimer = undefined;
        }
    }
}

/**
 * Circuit Breaker Manager for managing multiple circuit breakers
 */
export class CircuitBreakerManager {
    private static instance: CircuitBreakerManager | null = null;
    private breakers: Map<string, CircuitBreaker> = new Map();
    private defaultConfig: Partial<CircuitBreakerConfig>;

    constructor(defaultConfig?: Partial<CircuitBreakerConfig>) {
        this.defaultConfig = defaultConfig || {};
    }

    /**
     * Get singleton instance
     */
    public static getInstance(defaultConfig?: Partial<CircuitBreakerConfig>): CircuitBreakerManager {
        if (!CircuitBreakerManager.instance) {
            CircuitBreakerManager.instance = new CircuitBreakerManager(defaultConfig);
        }
        return CircuitBreakerManager.instance;
    }

    /**
     * Get or create a circuit breaker for a provider
     */
    public getBreaker(
        providerName: string,
        config?: Partial<CircuitBreakerConfig>
    ): CircuitBreaker {
        if (!this.breakers.has(providerName)) {
            const breakerConfig = { ...this.defaultConfig, ...config };
            this.breakers.set(providerName, new CircuitBreaker(providerName, breakerConfig));
        }
        return this.breakers.get(providerName)!;
    }

    /**
     * Execute with circuit breaker protection
     */
    public async execute<T>(
        providerName: string,
        fn: () => Promise<T>,
        config?: Partial<CircuitBreakerConfig>
    ): Promise<T> {
        const breaker = this.getBreaker(providerName, config);
        return breaker.execute(fn);
    }

    /**
     * Get all circuit breaker stats
     */
    public getAllStats(): Map<string, CircuitBreakerStats> {
        const stats = new Map<string, CircuitBreakerStats>();
        for (const [name, breaker] of this.breakers) {
            stats.set(name, breaker.getStats());
        }
        return stats;
    }

    /**
     * Get health summary
     */
    public getHealthSummary(): {
        total: number;
        closed: number;
        open: number;
        halfOpen: number;
        availableProviders: string[];
        unavailableProviders: string[];
    } {
        const summary = {
            total: this.breakers.size,
            closed: 0,
            open: 0,
            halfOpen: 0,
            availableProviders: [] as string[],
            unavailableProviders: [] as string[]
        };

        for (const [name, breaker] of this.breakers) {
            const state = breaker.getState();
            switch (state) {
                case CircuitState.CLOSED:
                    summary.closed++;
                    summary.availableProviders.push(name);
                    break;
                case CircuitState.OPEN:
                    summary.open++;
                    summary.unavailableProviders.push(name);
                    break;
                case CircuitState.HALF_OPEN:
                    summary.halfOpen++;
                    summary.availableProviders.push(name);
                    break;
            }
        }

        return summary;
    }

    /**
     * Reset all circuit breakers
     */
    public resetAll(): void {
        for (const breaker of this.breakers.values()) {
            breaker.forceClose('Global reset');
        }
    }

    /**
     * Dispose all circuit breakers
     */
    public dispose(): void {
        for (const breaker of this.breakers.values()) {
            breaker.dispose();
        }
        this.breakers.clear();
        CircuitBreakerManager.instance = null;
    }
}

// Export singleton getter
export const getCircuitBreakerManager = (config?: Partial<CircuitBreakerConfig>): CircuitBreakerManager => {
    return CircuitBreakerManager.getInstance(config);
};
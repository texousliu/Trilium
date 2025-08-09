/**
 * Circuit Breaker Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
    CircuitBreaker, 
    CircuitBreakerManager, 
    CircuitState, 
    CircuitOpenError 
} from '../circuit_breaker.js';

describe('CircuitBreaker', () => {
    let breaker: CircuitBreaker;

    beforeEach(() => {
        breaker = new CircuitBreaker('test-provider', {
            failureThreshold: 3,
            failureWindow: 1000,
            cooldownPeriod: 500,
            successThreshold: 2,
            enableLogging: false
        });
    });

    afterEach(() => {
        breaker.dispose();
    });

    describe('State Transitions', () => {
        it('should start in CLOSED state', () => {
            expect(breaker.getState()).toBe(CircuitState.CLOSED);
        });

        it('should open after failure threshold', async () => {
            const failingFn = () => Promise.reject(new Error('Test failure'));

            // First two failures - should remain closed
            await expect(breaker.execute(failingFn)).rejects.toThrow('Test failure');
            expect(breaker.getState()).toBe(CircuitState.CLOSED);

            await expect(breaker.execute(failingFn)).rejects.toThrow('Test failure');
            expect(breaker.getState()).toBe(CircuitState.CLOSED);

            // Third failure - should open
            await expect(breaker.execute(failingFn)).rejects.toThrow('Test failure');
            expect(breaker.getState()).toBe(CircuitState.OPEN);
        });

        it('should reject requests when open', async () => {
            // Force open
            breaker.forceOpen('Test');
            
            const fn = () => Promise.resolve('success');
            await expect(breaker.execute(fn)).rejects.toThrow(CircuitOpenError);
        });

        it('should transition to HALF_OPEN after cooldown', async () => {
            // Force open
            breaker.forceOpen('Test');
            expect(breaker.getState()).toBe(CircuitState.OPEN);

            // Wait for cooldown
            await new Promise(resolve => setTimeout(resolve, 600));
            expect(breaker.getState()).toBe(CircuitState.HALF_OPEN);
        });

        it('should close after success threshold in HALF_OPEN', async () => {
            // Force to half-open
            breaker.forceOpen('Test');
            await new Promise(resolve => setTimeout(resolve, 600));
            expect(breaker.getState()).toBe(CircuitState.HALF_OPEN);

            const successFn = () => Promise.resolve('success');

            // First success
            await breaker.execute(successFn);
            expect(breaker.getState()).toBe(CircuitState.HALF_OPEN);

            // Second success - should close
            await breaker.execute(successFn);
            expect(breaker.getState()).toBe(CircuitState.CLOSED);
        });

        it('should reopen on failure in HALF_OPEN', async () => {
            // Force to half-open
            breaker.forceOpen('Test');
            await new Promise(resolve => setTimeout(resolve, 600));
            expect(breaker.getState()).toBe(CircuitState.HALF_OPEN);

            const failingFn = () => Promise.reject(new Error('Test failure'));

            // Failure in half-open should immediately open
            await expect(breaker.execute(failingFn)).rejects.toThrow('Test failure');
            expect(breaker.getState()).toBe(CircuitState.OPEN);
        });
    });

    describe('Failure Window', () => {
        it('should reset failures outside window', async () => {
            const failingFn = () => Promise.reject(new Error('Test failure'));

            // Two failures
            await expect(breaker.execute(failingFn)).rejects.toThrow();
            await expect(breaker.execute(failingFn)).rejects.toThrow();
            expect(breaker.getState()).toBe(CircuitState.CLOSED);

            // Wait for window to expire
            await new Promise(resolve => setTimeout(resolve, 1100));

            // Two more failures - should still be closed (window reset)
            await expect(breaker.execute(failingFn)).rejects.toThrow();
            await expect(breaker.execute(failingFn)).rejects.toThrow();
            expect(breaker.getState()).toBe(CircuitState.CLOSED);
        });
    });

    describe('Statistics', () => {
        it('should track statistics', async () => {
            const successFn = () => Promise.resolve('success');
            const failingFn = () => Promise.reject(new Error('Test failure'));

            await breaker.execute(successFn);
            await expect(breaker.execute(failingFn)).rejects.toThrow();

            const stats = breaker.getStats();
            expect(stats.totalRequests).toBe(2);
            expect(stats.successes).toBe(1);
            expect(stats.failures).toBe(1);
            expect(stats.rejectedRequests).toBe(0);
        });

        it('should track rejected requests', async () => {
            breaker.forceOpen('Test');

            const fn = () => Promise.resolve('success');
            await expect(breaker.execute(fn)).rejects.toThrow(CircuitOpenError);
            await expect(breaker.execute(fn)).rejects.toThrow(CircuitOpenError);

            const stats = breaker.getStats();
            expect(stats.rejectedRequests).toBe(2);
        });

        it('should track state history', async () => {
            breaker.forceOpen('Test open');
            breaker.forceClose('Test close');

            const stats = breaker.getStats();
            expect(stats.stateHistory).toHaveLength(2);
            expect(stats.stateHistory[0].state).toBe(CircuitState.OPEN);
            expect(stats.stateHistory[1].state).toBe(CircuitState.CLOSED);
        });
    });

    describe('Timeout', () => {
        it('should apply timeout in HALF_OPEN state', async () => {
            // Force to half-open
            breaker.forceOpen('Test');
            await new Promise(resolve => setTimeout(resolve, 600));

            const slowFn = () => new Promise(resolve => 
                setTimeout(() => resolve('success'), 10000)
            );

            // Should timeout (half-open timeout is 5000ms in config)
            await expect(breaker.execute(slowFn)).rejects.toThrow(/timed out/);
        });
    });
});

describe('CircuitBreakerManager', () => {
    let manager: CircuitBreakerManager;

    beforeEach(() => {
        manager = new CircuitBreakerManager({
            failureThreshold: 2,
            failureWindow: 1000,
            cooldownPeriod: 500,
            enableLogging: false
        });
    });

    afterEach(() => {
        manager.dispose();
    });

    describe('Breaker Management', () => {
        it('should create breakers on demand', () => {
            const breaker1 = manager.getBreaker('provider1');
            const breaker2 = manager.getBreaker('provider2');

            expect(breaker1).toBeDefined();
            expect(breaker2).toBeDefined();
            expect(breaker1).not.toBe(breaker2);
        });

        it('should return same breaker for same provider', () => {
            const breaker1 = manager.getBreaker('provider1');
            const breaker2 = manager.getBreaker('provider1');

            expect(breaker1).toBe(breaker2);
        });

        it('should execute with breaker protection', async () => {
            const fn = () => Promise.resolve('success');
            const result = await manager.execute('provider1', fn);

            expect(result).toBe('success');
        });
    });

    describe('Health Summary', () => {
        it('should provide health summary', async () => {
            const failingFn = () => Promise.reject(new Error('Test'));
            const successFn = () => Promise.resolve('success');

            // Create some breakers in different states
            await manager.execute('provider1', successFn);
            
            // Force provider2 to open
            const breaker2 = manager.getBreaker('provider2');
            breaker2.forceOpen('Test');

            const summary = manager.getHealthSummary();
            expect(summary.total).toBe(2);
            expect(summary.closed).toBe(1);
            expect(summary.open).toBe(1);
            expect(summary.availableProviders).toContain('provider1');
            expect(summary.unavailableProviders).toContain('provider2');
        });
    });

    describe('Global Operations', () => {
        it('should reset all breakers', () => {
            const breaker1 = manager.getBreaker('provider1');
            const breaker2 = manager.getBreaker('provider2');

            breaker1.forceOpen('Test');
            breaker2.forceOpen('Test');

            manager.resetAll();

            expect(breaker1.getState()).toBe(CircuitState.CLOSED);
            expect(breaker2.getState()).toBe(CircuitState.CLOSED);
        });

        it('should get all stats', async () => {
            await manager.execute('provider1', () => Promise.resolve('success'));
            await manager.execute('provider2', () => Promise.resolve('success'));

            const allStats = manager.getAllStats();
            expect(allStats.size).toBe(2);
            expect(allStats.has('provider1')).toBe(true);
            expect(allStats.has('provider2')).toBe(true);
        });
    });
});

describe('Circuit Breaker Integration', () => {
    it('should handle rapid failures gracefully', async () => {
        const breaker = new CircuitBreaker('rapid-test', {
            failureThreshold: 3,
            failureWindow: 1000,
            cooldownPeriod: 100,
            enableLogging: false
        });

        const failingFn = () => Promise.reject(new Error('Rapid failure'));
        const promises: Promise<any>[] = [];

        // Fire 10 rapid requests
        for (let i = 0; i < 10; i++) {
            promises.push(
                breaker.execute(failingFn).catch(err => err.message)
            );
        }

        const results = await Promise.all(promises);
        
        // First 3 should be actual failures
        expect(results.slice(0, 3)).toEqual([
            'Rapid failure',
            'Rapid failure', 
            'Rapid failure'
        ]);

        // Rest should be circuit open errors
        const openErrors = results.slice(3).filter((msg: string) => 
            msg.includes('Circuit breaker is OPEN')
        );
        expect(openErrors.length).toBeGreaterThan(0);

        breaker.dispose();
    });

    it('should handle concurrent successes correctly', async () => {
        const breaker = new CircuitBreaker('concurrent-test', {
            failureThreshold: 3,
            enableLogging: false
        });

        let counter = 0;
        const successFn = () => {
            counter++;
            return Promise.resolve(counter);
        };

        const promises: Promise<number>[] = [];
        for (let i = 0; i < 5; i++) {
            promises.push(breaker.execute(successFn));
        }

        const results = await Promise.all(promises);
        expect(results).toEqual([1, 2, 3, 4, 5]);
        expect(breaker.getState()).toBe(CircuitState.CLOSED);

        breaker.dispose();
    });
});
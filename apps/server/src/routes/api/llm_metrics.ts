/**
 * LLM Metrics API Endpoint
 * 
 * Provides metrics export endpoints for monitoring systems
 */

import { Router, Request, Response } from 'express';
import { getProviderFactory } from '../../services/llm/providers/provider_factory.js';
import log from '../../services/log.js';

const router = Router();

/**
 * GET /api/llm/metrics
 * Returns metrics in Prometheus format by default
 */
router.get('/llm/metrics', (req: Request, res: Response) => {
    try {
        const format = req.query.format as string || 'prometheus';
        const factory = getProviderFactory();
        
        if (!factory) {
            return res.status(503).json({ error: 'LLM service not initialized' });
        }

        const metrics = factory.exportMetrics(format as any);
        
        if (!metrics) {
            return res.status(503).json({ error: 'Metrics not available' });
        }

        // Set appropriate content type based on format
        switch (format) {
            case 'prometheus':
                res.set('Content-Type', 'text/plain; version=0.0.4');
                res.send(metrics);
                break;
            case 'json':
                res.json(metrics);
                break;
            case 'opentelemetry':
                res.json(metrics);
                break;
            case 'statsd':
                res.set('Content-Type', 'text/plain');
                res.send(Array.isArray(metrics) ? metrics.join('\n') : metrics);
                break;
            default:
                res.status(400).json({ error: `Unknown format: ${format}` });
        }
    } catch (error: any) {
        log.error(`[LLM Metrics API] Error exporting metrics: ${error.message}`);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/llm/metrics/summary
 * Returns a summary of metrics in JSON format
 */
router.get('/llm/metrics/summary', (req: Request, res: Response) => {
    try {
        const factory = getProviderFactory();
        
        if (!factory) {
            return res.status(503).json({ error: 'LLM service not initialized' });
        }

        const summary = factory.getMetricsSummary();
        
        if (!summary) {
            return res.status(503).json({ error: 'Metrics not available' });
        }

        res.json(summary);
    } catch (error: any) {
        log.error(`[LLM Metrics API] Error getting metrics summary: ${error.message}`);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/llm/circuit-breaker/status
 * Returns circuit breaker status for all providers
 */
router.get('/llm/circuit-breaker/status', (req: Request, res: Response) => {
    try {
        const factory = getProviderFactory();
        
        if (!factory) {
            return res.status(503).json({ error: 'LLM service not initialized' });
        }

        const status = factory.getCircuitBreakerStatus();
        
        if (!status) {
            return res.status(503).json({ error: 'Circuit breaker not enabled' });
        }

        res.json(status);
    } catch (error: any) {
        log.error(`[LLM Metrics API] Error getting circuit breaker status: ${error.message}`);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/llm/circuit-breaker/reset/:provider
 * Reset circuit breaker for a specific provider
 */
router.post('/llm/circuit-breaker/reset/:provider', (req: Request, res: Response) => {
    try {
        const { provider } = req.params;
        const factory = getProviderFactory();
        
        if (!factory) {
            return res.status(503).json({ error: 'LLM service not initialized' });
        }

        factory.resetCircuitBreaker(provider as any);
        res.json({ message: `Circuit breaker reset for provider: ${provider}` });
    } catch (error: any) {
        log.error(`[LLM Metrics API] Error resetting circuit breaker: ${error.message}`);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/llm/health
 * Returns overall health status of LLM service
 */
router.get('/llm/health', (req: Request, res: Response) => {
    try {
        const factory = getProviderFactory();
        
        if (!factory) {
            return res.status(503).json({ 
                status: 'unhealthy',
                error: 'LLM service not initialized' 
            });
        }

        const circuitStatus = factory.getCircuitBreakerStatus();
        const metrics = factory.getMetricsSummary();
        const statistics = factory.getStatistics();
        
        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            providers: {
                available: circuitStatus?.summary?.availableProviders || [],
                unavailable: circuitStatus?.summary?.unavailableProviders || [],
                cached: statistics?.cachedProviders || 0,
                healthy: statistics?.healthyProviders || 0,
                unhealthy: statistics?.unhealthyProviders || 0
            },
            metrics: {
                totalRequests: metrics?.system?.totalRequests || 0,
                totalFailures: metrics?.system?.totalFailures || 0,
                uptime: metrics?.system?.uptime || 0
            },
            circuitBreakers: circuitStatus?.summary || {}
        };

        // Determine overall health
        if (health.providers.available.length === 0) {
            health.status = 'unhealthy';
        } else if (health.providers.unavailable.length > 0) {
            health.status = 'degraded';
        }

        const statusCode = health.status === 'healthy' ? 200 : 
                          health.status === 'degraded' ? 200 : 503;
        
        res.status(statusCode).json(health);
    } catch (error: any) {
        log.error(`[LLM Metrics API] Error getting health status: ${error.message}`);
        res.status(500).json({ 
            status: 'unhealthy',
            error: 'Internal server error' 
        });
    }
});

export default router;
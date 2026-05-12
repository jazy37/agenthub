/**
 * Centralized Pino logger
 *
 * - Local (NODE_ENV !== production): human-readable output via pino-pretty
 * - Production: JSON output → ready for Grafana Loki / CloudWatch / Datadog
 *
 * Usage:
 *   const logger = require('./logger');
 *   logger.info({ userId, agentId }, 'Agent created');
 *   logger.error({ err, requestId }, 'DB query failed');
 *   const childLogger = logger.child({ module: 'socket' }); // adds module field to all logs
 */

const pino = require('pino');

const isProduction = process.env.NODE_ENV === 'production';

const logger = pino(
    {
        level: process.env.LOG_LEVEL || 'info',
        // Redact sensitive fields from logs
        redact: {
            paths: [
                'req.headers.authorization',
                'body.password',
                'body.currentPassword',
                'body.newPassword',
                'body.apiKey',
                'passwordHash',
                'resetPasswordToken',
                'verificationToken',
            ],
            censor: '[REDACTED]',
        },
        base: {
            service: 'agenthub-api',
            env: process.env.NODE_ENV || 'development',
        },
        timestamp: pino.stdTimeFunctions.isoTime,
    },
    // Use pino-pretty only in development for human-readable output
    isProduction
        ? undefined
        : pino.transport({
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'SYS:HH:MM:ss',
                ignore: 'pid,hostname,service,env',
                messageFormat: '{module} | {msg}',
            },
        })
);

module.exports = logger;

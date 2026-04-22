'use strict';

const { randomBytes } = require('crypto');
const logger = require('./logger');

/**
 * Creates a child span under the current request trace context.
 * Measures latency and logs with W3C trace correlation.
 * 
 * Usage:
 *   const span = createSpan(req, 'zoho.api.call', { endpoint: '/inventory/v1/items' });
 *   try {
 *     const result = await someAsyncWork();
 *     span.end({ success: true, itemCount: result.length });
 *   } catch (err) {
 *     span.end({ success: false, error: err.message });
 *   }
 */
function createSpan(req, name, attributes = {}) {
  const traceContext = req?.traceContext || {};
  const traceId = traceContext.traceId || randomBytes(16).toString('hex');
  const parentSpanId = traceContext.spanId || randomBytes(8).toString('hex');
  const spanId = randomBytes(8).toString('hex');
  const startTime = Date.now();

  const span = {
    traceId,
    parentSpanId,
    spanId,
    name,
    startTime,
    attributes,
    
    /**
     * End the span and log results
     */
    end: (result = {}) => {
      const endTime = Date.now();
      const latency = endTime - startTime;
      const log = {
        span: {
          traceId,
          spanId,
          parentSpanId,
          name,
          latencyMs: latency,
          timestamp: new Date(startTime).toISOString()
        },
        attributes,
        result
      };

      if (result.success === false || result.error) {
        logger.warn(log, `Span ${name} completed with error`);
      } else {
        logger.info(log, `Span ${name} completed`);
      }

      return { latency, log };
    }
  };

  return span;
}

/**
 * Higher-order function to wrap async functions with automatic span tracing
 * Usage:
 *   const tracedFunction = withSpan(req, 'zoho.create.order', async () => {
 *     return await createZohoSalesOrder(...);
 *   });
 */
async function withSpan(req, spanName, attributes, asyncFn) {
  const span = createSpan(req, spanName, attributes);
  try {
    const result = await asyncFn();
    span.end({ success: true });
    return result;
  } catch (error) {
    span.end({ success: false, error: error.message });
    throw error;
  }
}

module.exports = { createSpan, withSpan };

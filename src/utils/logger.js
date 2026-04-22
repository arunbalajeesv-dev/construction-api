'use strict';

const { Writable } = require('stream');
const pino = require('pino');
const { trace } = require('@opentelemetry/api');
const { logs, SeverityNumber } = require('@opentelemetry/api-logs');
const env = require('../config/env');

// Maps pino numeric level → OTel SeverityNumber
const pinoLevelToSeverity = {
  10: SeverityNumber.TRACE,
  20: SeverityNumber.DEBUG,
  30: SeverityNumber.INFO,
  40: SeverityNumber.WARN,
  50: SeverityNumber.ERROR,
  60: SeverityNumber.FATAL,
};

const pinoLevelToText = {
  10: 'TRACE', 20: 'DEBUG', 30: 'INFO', 40: 'WARN', 50: 'ERROR', 60: 'FATAL',
};

// Pino destination that emits each log line as an OTel LogRecord → Grafana Loki
const otelDest = new Writable({
  write(chunk, _enc, cb) {
    try {
      const rec = JSON.parse(chunk.toString());
      const { level, time: _time, pid: _pid, hostname: _hostname, msg, trace_id, span_id, ...attrs } = rec;
      const otelLogger = logs.getLogger('pino');
      const logRecord = {
        severityNumber: pinoLevelToSeverity[level] ?? SeverityNumber.INFO,
        severityText: pinoLevelToText[level] ?? 'INFO',
        body: msg,
        attributes: attrs,
      };
      if (trace_id && span_id) {
        logRecord.spanContext = { traceId: trace_id, spanId: span_id, traceFlags: 1 };
      }
      otelLogger.emit(logRecord);
    } catch (_) {}
    cb();
  },
});

const consoleDest = env.NODE_ENV !== 'production'
  ? pino.transport({
      target: 'pino-pretty',
      options: { colorize: true, translateTime: 'SYS:HH:MM:ss', ignore: 'pid,hostname' },
    })
  : undefined;

const streams = consoleDest
  ? pino.multistream([{ stream: consoleDest }, { stream: otelDest }])
  : pino.multistream([{ stream: process.stdout }, { stream: otelDest }]);

const logger = pino(
  {
    level: env.NODE_ENV === 'production' ? 'info' : 'debug',
    base: { service: 'construction-api' },
    timestamp: pino.stdTimeFunctions.isoTime,
    mixin() {
      const span = trace.getActiveSpan();
      if (span?.isRecording()) {
        const ctx = span.spanContext();
        return { trace_id: ctx.traceId, span_id: ctx.spanId };
      }
      return {};
    },
  },
  streams,
);

module.exports = logger;

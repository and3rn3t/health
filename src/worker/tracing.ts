/**
 * Lightweight OpenTelemetry-compatible tracing for Cloudflare Workers.
 *
 * Implements W3C Trace Context propagation (traceparent/tracestate headers)
 * without requiring the full OTel SDK — Workers-safe, zero dependencies.
 *
 * Trace data is exported via the PERFORMANCE_ANALYTICS binding for
 * querying in Cloudflare Analytics Engine or forwarding to an OTel collector.
 */

/** Hex-encode a Uint8Array */
function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Generate a random hex string of the given byte length. */
function randomHex(byteLength: number): string {
  return toHex(crypto.getRandomValues(new Uint8Array(byteLength)));
}

export interface TraceContext {
  traceId: string; // 32 hex chars (16 bytes)
  spanId: string; // 16 hex chars (8 bytes)
  parentSpanId: string | null;
  sampled: boolean;
}

/**
 * Parse incoming `traceparent` header per W3C Trace Context spec.
 * Falls back to generating a new trace context if the header is missing or invalid.
 */
export function parseTraceContext(
  traceparent: string | null | undefined
): TraceContext {
  if (traceparent) {
    // Format: version-traceId-parentSpanId-flags
    const parts = traceparent.split('-');
    const [version, traceId, parentSpanId, flags] = parts;
    if (
      parts.length === 4 &&
      version === '00' &&
      traceId &&
      traceId.length === 32 &&
      parentSpanId &&
      parentSpanId.length === 16 &&
      flags
    ) {
      return {
        traceId,
        spanId: randomHex(8),
        parentSpanId,
        sampled: (parseInt(flags, 16) & 0x01) === 1,
      };
    }
  }
  // Generate new root trace
  return {
    traceId: randomHex(16),
    spanId: randomHex(8),
    parentSpanId: null,
    sampled: true,
  };
}

/** Serialize a trace context into a `traceparent` header value. */
export function toTraceparent(ctx: TraceContext): string {
  const flags = ctx.sampled ? '01' : '00';
  return `00-${ctx.traceId}-${ctx.spanId}-${flags}`;
}

export interface SpanData {
  name: string;
  traceId: string;
  spanId: string;
  parentSpanId: string | null;
  startTime: number;
  endTime: number;
  status: number;
  attributes: Record<string, string | number | boolean>;
}

/**
 * Create a child span from a parent trace context.
 * Returns the new span context and a `finish()` function to record completion.
 */
export function startSpan(
  parent: TraceContext,
  name: string
): { ctx: TraceContext; finish: (status: number, attrs?: Record<string, string | number | boolean>) => SpanData } {
  const spanId = randomHex(8);
  const startTime = Date.now();
  const ctx: TraceContext = {
    traceId: parent.traceId,
    spanId,
    parentSpanId: parent.spanId,
    sampled: parent.sampled,
  };
  return {
    ctx,
    finish: (status, attrs = {}) => ({
      name,
      traceId: parent.traceId,
      spanId,
      parentSpanId: parent.spanId,
      startTime,
      endTime: Date.now(),
      status,
      attributes: attrs,
    }),
  };
}

/**
 * Write span data to Cloudflare Analytics Engine.
 * The analytics binding accepts blobs (strings) and doubles (numbers).
 */
export function exportSpan(
  analytics: { writeDataPoint: (event: { blobs: string[]; doubles: number[] }) => void } | undefined,
  span: SpanData
): void {
  if (!analytics) return;
  try {
    analytics.writeDataPoint({
      blobs: [
        span.name,
        span.traceId,
        span.spanId,
        span.parentSpanId || '',
        JSON.stringify(span.attributes),
      ],
      doubles: [span.startTime, span.endTime, span.endTime - span.startTime, span.status],
    });
  } catch {
    // Analytics write failures are non-fatal
  }
}

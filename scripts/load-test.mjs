/**
 * VitalSense Load Tests (k6)
 *
 * Run:  k6 run scripts/load-test.mjs --env BASE_URL=https://health.andernet.dev
 *       k6 run scripts/load-test.mjs --env BASE_URL=http://localhost:8789
 *
 * Auth tokens are acquired automatically via POST /api/device/auth during setup.
 * Override with a manual token if needed:
 *       k6 run scripts/load-test.mjs --env BASE_URL=http://localhost:8789 --env AUTH_TOKEN=eyJ...
 *
 * Scenarios:
 *   smoke              — 5 VUs for 30s   (sanity check)
 *   load               — ramp to 50 VUs  (sustained load)
 *   stress             — ramp to 100 VUs (find breaking point)
 *   ws_storm           — 50 concurrent WebSocket connections
 *   live_ingestion     — 20 VUs simulating live gait/balance data from iOS
 *   health_processing  — 15 VUs processing health metrics through analytics
 *   kv_settings        — 10 VUs doing CRUD on user settings
 *   error_scenarios    — 10 VUs sending malformed/unauthorized requests
 *   telemetry_ingestion — 25 VUs sending RUM, client errors, LiDAR, WS telemetry
 *   ws_throughput      — 20 VUs streaming sustained health data over WebSocket
 *   rate_limit_stress  — 15 VUs hammering rate-limited endpoints past 429
 *   max_payload        — 5 VUs sending max-size batches (50 gait, 100 metrics)
 *   spike              — 0→200 VUs in 5s (cold-start / autoscaling)
 *   soak               — 10 VUs for 30m (memory leaks, token expiry, KV quota)
 *                        Opt-in: --env INCLUDE_SOAK=true
 */

import http from 'k6/http';
import ws from 'k6/ws';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const healthDataLatency = new Trend('health_data_latency', true);
const wsConnectTime = new Trend('ws_connect_time', true);
const gaitIngestionLatency = new Trend('gait_ingestion_latency', true);
const batchProcessLatency = new Trend('batch_process_latency', true);
const telemetryLatency = new Trend('telemetry_latency', true);
const wsMessageRtt = new Trend('ws_message_rtt', true);
const rateLimitHits = new Counter('rate_limit_hits');

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8789';
const WS_URL = BASE_URL.replace('https://', 'wss://').replace('http://', 'ws://') + '/ws';
const MANUAL_TOKEN = __ENV.AUTH_TOKEN || '';
const VU_COUNT = 20; // number of distinct load-test users to mint
const INCLUDE_SOAK = __ENV.INCLUDE_SOAK === 'true';

// Shared state from setup() — tokens are distributed across VUs
let _setupData = { tokens: [] };

function authHeaders(extra) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(extra || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

function getToken() {
  if (MANUAL_TOKEN) return MANUAL_TOKEN;
  if (_setupData.tokens.length === 0) return '';
  // Distribute tokens across VUs by index
  const idx = (__VU - 1) % _setupData.tokens.length;
  return _setupData.tokens[idx] || '';
}

export const options = {
  scenarios: {
    smoke: {
      executor: 'constant-vus',
      vus: 5,
      duration: '30s',
      gracefulStop: '5s',
      tags: { scenario: 'smoke' },
    },
    load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 20 },
        { duration: '1m', target: 50 },
        { duration: '30s', target: 50 },
        { duration: '30s', target: 0 },
      ],
      startTime: '35s',
      tags: { scenario: 'load' },
    },
    stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 50 },
        { duration: '1m', target: 100 },
        { duration: '30s', target: 100 },
        { duration: '30s', target: 0 },
      ],
      startTime: '3m30s',
      tags: { scenario: 'stress' },
    },
    ws_storm: {
      executor: 'constant-vus',
      vus: 50,
      duration: '1m',
      startTime: '6m',
      tags: { scenario: 'ws_storm' },
      exec: 'wsTest',
    },
    live_ingestion: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '15s', target: 10 },
        { duration: '1m', target: 20 },
        { duration: '30s', target: 20 },
        { duration: '15s', target: 0 },
      ],
      startTime: '7m30s',
      tags: { scenario: 'live_ingestion' },
      exec: 'liveIngestionTest',
    },
    health_processing: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '15s', target: 5 },
        { duration: '1m', target: 15 },
        { duration: '30s', target: 15 },
        { duration: '15s', target: 0 },
      ],
      startTime: '9m30s',
      tags: { scenario: 'health_processing' },
      exec: 'healthProcessingTest',
    },
    kv_settings: {
      executor: 'constant-vus',
      vus: 10,
      duration: '1m',
      startTime: '11m30s',
      tags: { scenario: 'kv_settings' },
      exec: 'kvSettingsTest',
    },
    error_scenarios: {
      executor: 'constant-vus',
      vus: 10,
      duration: '30s',
      startTime: '13m',
      tags: { scenario: 'error_scenarios' },
      exec: 'errorScenariosTest',
    },
    telemetry_ingestion: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '15s', target: 10 },
        { duration: '1m', target: 25 },
        { duration: '30s', target: 25 },
        { duration: '15s', target: 0 },
      ],
      startTime: '14m',
      tags: { scenario: 'telemetry_ingestion' },
      exec: 'telemetryIngestionTest',
    },
    ws_throughput: {
      executor: 'constant-vus',
      vus: 20,
      duration: '2m',
      startTime: '16m',
      tags: { scenario: 'ws_throughput' },
      exec: 'wsThroughputTest',
    },
    rate_limit_stress: {
      executor: 'constant-vus',
      vus: 15,
      duration: '30s',
      startTime: '18m30s',
      tags: { scenario: 'rate_limit_stress' },
      exec: 'rateLimitStressTest',
    },
    max_payload: {
      executor: 'constant-vus',
      vus: 5,
      duration: '30s',
      startTime: '19m30s',
      tags: { scenario: 'max_payload' },
      exec: 'maxPayloadTest',
    },
    spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '5s', target: 200 },
        { duration: '30s', target: 200 },
        { duration: '10s', target: 0 },
      ],
      startTime: '20m30s',
      tags: { scenario: 'spike' },
    },
    // Soak is opt-in (INCLUDE_SOAK=true) to avoid 30m runs in nightly CI
    ...(INCLUDE_SOAK ? {
      soak: {
        executor: 'constant-vus',
        vus: 10,
        duration: '30m',
        startTime: '21m30s',
        tags: { scenario: 'soak' },
        exec: 'soakTest',
      },
    } : {}),
  },
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1500'],
    http_req_failed: ['rate<0.05'],
    errors: ['rate<0.1'],
    health_data_latency: ['p(95)<800'],
    ws_connect_time: ['p(95)<3000'],
    gait_ingestion_latency: ['p(95)<600'],
    batch_process_latency: ['p(95)<2000'],
    telemetry_latency: ['p(95)<400'],
    ws_message_rtt: ['p(95)<500'],
  },
};

// ---------------------------------------------------------------------------
// setup() — acquire device tokens before VUs start
// ---------------------------------------------------------------------------

export function setup() {
  if (MANUAL_TOKEN) {
    console.log('Using manually provided AUTH_TOKEN');
    return { tokens: [MANUAL_TOKEN] };
  }

  console.log(`Minting ${VU_COUNT} device tokens from ${BASE_URL}/api/device/auth ...`);
  const tokens = [];

  for (let i = 0; i < VU_COUNT; i++) {
    const userId = `load-test-vu-${i}`;
    const res = http.post(
      `${BASE_URL}/api/device/auth`,
      JSON.stringify({
        userId,
        clientType: 'web_dashboard',
        ttlSec: 3600,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );

    if (res.status === 200 || res.status === 201) {
      try {
        const body = JSON.parse(res.body);
        if (body.token) {
          tokens.push(body.token);
        }
      } catch {
        console.warn(`Failed to parse token response for ${userId}`);
      }
    } else {
      console.warn(`Token mint failed for ${userId}: HTTP ${res.status}`);
    }
  }

  if (tokens.length === 0) {
    console.warn('No tokens acquired — auth-gated endpoints will return 401');
  } else {
    console.log(`Acquired ${tokens.length}/${VU_COUNT} device tokens (TTL: 1h)`);
  }

  return { tokens };
}

// ---------------------------------------------------------------------------
// Default scenario: HTTP API tests
// ---------------------------------------------------------------------------

export default function (data) {
  _setupData = data;
  // Health check
  const healthRes = http.get(`${BASE_URL}/health`);
  check(healthRes, {
    'health: status 200': (r) => r.status === 200,
    'health: has status field': (r) => {
      try {
        return JSON.parse(r.body).status === 'healthy';
      } catch {
        return false;
      }
    },
  }) || errorRate.add(1);

  sleep(0.5);

  // Gait config version
  const gaitRes = http.get(`${BASE_URL}/api/gait-config-version`);
  check(gaitRes, {
    'gait config: status 200': (r) => r.status === 200,
    'gait config: has version': (r) => {
      try {
        return !!JSON.parse(r.body).version;
      } catch {
        return false;
      }
    },
  }) || errorRate.add(1);

  sleep(0.3);

  // Fall risk config
  const fallRes = http.get(`${BASE_URL}/api/fall-risk-config-version`);
  check(fallRes, {
    'fall risk config: status 200': (r) => r.status === 200,
  }) || errorRate.add(1);

  sleep(0.3);

  // Analytics config (combined endpoint)
  const analyticsRes = http.get(`${BASE_URL}/api/analytics-config-versions`);
  check(analyticsRes, {
    'analytics config: status 200': (r) => r.status === 200,
    'analytics config: has gait + fallRisk': (r) => {
      try {
        const body = JSON.parse(r.body);
        return !!body.gait && !!body.fallRisk;
      } catch {
        return false;
      }
    },
  }) || errorRate.add(1);

  sleep(0.3);

  // Health data GET (public/demo)
  const t0 = Date.now();
  const healthDataRes = http.get(`${BASE_URL}/api/health-data`, {
    headers: { 'X-Demo-Mode': 'true' },
  });
  healthDataLatency.add(Date.now() - t0);
  check(healthDataRes, {
    'health data: status 200': (r) => r.status === 200,
  }) || errorRate.add(1);

  sleep(1);
}

// ---------------------------------------------------------------------------
// WebSocket storm scenario
// ---------------------------------------------------------------------------

export function wsTest(data) {
  _setupData = data;
  const t0 = Date.now();

  const res = ws.connect(WS_URL, {}, function (socket) {
    wsConnectTime.add(Date.now() - t0);

    socket.on('open', () => {
      // Send a ping
      socket.send(JSON.stringify({
        type: 'ping',
        data: {},
        timestamp: new Date().toISOString(),
      }));
    });

    socket.on('message', (msg) => {
      try {
        const data = JSON.parse(msg);
        check(data, {
          'ws: valid message type': (d) => typeof d.type === 'string',
        });
      } catch {
        // Binary or non-JSON message
      }
    });

    socket.on('error', () => {
      errorRate.add(1);
    });

    // Keep connection alive for 10-20 seconds
    const holdTime = 10 + Math.random() * 10;
    sleep(holdTime);

    socket.close();
  });

  check(res, {
    'ws: connected successfully': (r) => r && r.status === 101,
  }) || errorRate.add(1);
}

// ---------------------------------------------------------------------------
// Data generators
// ---------------------------------------------------------------------------

function makeGaitSnapshot() {
  return {
    speed: 0.5 + Math.random() * 2.5,
    stepFrequency: 60 + Math.random() * 140,
    asymmetry: Math.random() * 0.5,
    variability: Math.random() * 0.3,
    capturedAt: new Date().toISOString(),
    source: 'k6_load_test',
  };
}

function makeBalanceProgress(elapsed) {
  return {
    percent: Math.min(100, (elapsed / 30) * 100),
    instantaneousStability: 0.5 + Math.random() * 0.5,
    elapsedSeconds: elapsed,
    testKind: 'romberg',
    capturedAt: new Date().toISOString(),
  };
}

function makeBalanceResult() {
  return {
    overallScore: 40 + Math.random() * 60,
    componentScores: {
      sway: 50 + Math.random() * 50,
      steadiness: 40 + Math.random() * 60,
      recovery: 45 + Math.random() * 55,
    },
    testKind: 'romberg',
    capturedAt: new Date().toISOString(),
  };
}

function makeHealthMetric(type) {
  const metricValues = {
    heart_rate: { value: 55 + Math.random() * 45, unit: 'bpm' },
    steps: { value: Math.floor(Math.random() * 15000), unit: 'count' },
    blood_oxygen: { value: 92 + Math.random() * 8, unit: '%' },
    respiratory_rate: { value: 10 + Math.random() * 15, unit: 'breaths/min' },
  };
  const m = metricValues[type] || metricValues.heart_rate;
  return {
    type,
    value: m.value,
    unit: m.unit,
    timestamp: new Date().toISOString(),
    source: 'k6_load_test',
    confidence: 0.8 + Math.random() * 0.2,
  };
}

// ---------------------------------------------------------------------------
// Live gait & balance ingestion (auth-gated)
// ---------------------------------------------------------------------------

export function liveIngestionTest(data) {
  _setupData = data;
  const headers = authHeaders();

  // POST single gait snapshot
  const t0 = Date.now();
  const gaitRes = http.post(
    `${BASE_URL}/api/live/gait`,
    JSON.stringify(makeGaitSnapshot()),
    { headers }
  );
  gaitIngestionLatency.add(Date.now() - t0);
  const gaitOk = check(gaitRes, {
    'gait: status 200 or 401': (r) => r.status === 200 || r.status === 401,
    'gait: not 500': (r) => r.status < 500,
  });
  if (!gaitOk) errorRate.add(1);
  if (gaitRes.status === 429) rateLimitHits.add(1);

  sleep(0.5);

  // POST batch gait snapshots (5-10 snapshots)
  const batchSize = 5 + Math.floor(Math.random() * 6);
  const snapshots = Array.from({ length: batchSize }, () => makeGaitSnapshot());
  const batchRes = http.post(
    `${BASE_URL}/api/live/gait/batch`,
    JSON.stringify({ snapshots }),
    { headers }
  );
  check(batchRes, {
    'gait batch: status 200 or 401': (r) => r.status === 200 || r.status === 401,
    'gait batch: not 500': (r) => r.status < 500,
  }) || errorRate.add(1);
  if (batchRes.status === 429) rateLimitHits.add(1);

  sleep(0.5);

  // POST balance progress updates (simulate a 3-second test window)
  for (let elapsed = 0; elapsed <= 3; elapsed++) {
    const balanceRes = http.post(
      `${BASE_URL}/api/live/balance/progress`,
      JSON.stringify(makeBalanceProgress(elapsed)),
      { headers }
    );
    check(balanceRes, {
      'balance progress: not 500': (r) => r.status < 500,
    }) || errorRate.add(1);
    if (balanceRes.status === 429) rateLimitHits.add(1);
    sleep(0.2);
  }

  // POST balance result
  const resultRes = http.post(
    `${BASE_URL}/api/live/balance/result`,
    JSON.stringify(makeBalanceResult()),
    { headers }
  );
  check(resultRes, {
    'balance result: not 500': (r) => r.status < 500,
  }) || errorRate.add(1);
  if (resultRes.status === 429) rateLimitHits.add(1);

  sleep(0.3);

  // GET recent gait data
  const recentGaitRes = http.get(`${BASE_URL}/api/live/gait/recent`, { headers });
  check(recentGaitRes, {
    'gait recent: status 200 or 401': (r) => r.status === 200 || r.status === 401,
  }) || errorRate.add(1);

  // GET recent balance data
  const recentBalanceRes = http.get(`${BASE_URL}/api/live/balance/recent`, { headers });
  check(recentBalanceRes, {
    'balance recent: status 200 or 401': (r) => r.status === 200 || r.status === 401,
  }) || errorRate.add(1);

  sleep(1);
}

// ---------------------------------------------------------------------------
// Health data processing (single + batch through analytics pipeline)
// ---------------------------------------------------------------------------

export function healthProcessingTest(data) {
  _setupData = data;
  const headers = authHeaders();
  const metricTypes = ['heart_rate', 'steps', 'blood_oxygen', 'respiratory_rate'];

  // POST single metric processing
  const metricType = metricTypes[Math.floor(Math.random() * metricTypes.length)];
  const processRes = http.post(
    `${BASE_URL}/api/health-data/process`,
    JSON.stringify(makeHealthMetric(metricType)),
    { headers }
  );
  check(processRes, {
    'process: status 201 or 429': (r) => r.status === 201 || r.status === 429,
    'process: not 500': (r) => r.status < 500,
    'process: has analytics on success': (r) => {
      if (r.status !== 201) return true;
      try {
        const body = JSON.parse(r.body);
        return body.ok && body.analytics !== undefined;
      } catch {
        return false;
      }
    },
  }) || errorRate.add(1);
  if (processRes.status === 429) rateLimitHits.add(1);

  sleep(0.5);

  // POST batch metric processing (3-8 metrics)
  const batchCount = 3 + Math.floor(Math.random() * 6);
  const metrics = Array.from({ length: batchCount }, () => {
    const t = metricTypes[Math.floor(Math.random() * metricTypes.length)];
    return makeHealthMetric(t);
  });
  const t0 = Date.now();
  const batchRes = http.post(
    `${BASE_URL}/api/health-data/batch`,
    JSON.stringify({
      metrics,
      uploadedAt: new Date().toISOString(),
      deviceInfo: { deviceId: 'k6-load-test', deviceType: 'test-harness' },
    }),
    { headers }
  );
  batchProcessLatency.add(Date.now() - t0);
  check(batchRes, {
    'batch: status 200/201 or 429': (r) =>
      r.status === 200 || r.status === 201 || r.status === 429,
    'batch: not 500': (r) => r.status < 500,
  }) || errorRate.add(1);
  if (batchRes.status === 429) rateLimitHits.add(1);

  sleep(1);
}

// ---------------------------------------------------------------------------
// KV settings CRUD (auth-gated)
// ---------------------------------------------------------------------------

export function kvSettingsTest(data) {
  _setupData = data;
  const headers = authHeaders();
  const keys = ['preferences', 'dashboard-layout', 'alert-settings', 'theme', 'notification-settings'];
  const key = keys[Math.floor(Math.random() * keys.length)];

  // PUT a setting
  const putRes = http.put(
    `${BASE_URL}/api/kv/${key}`,
    JSON.stringify({ value: { updatedAt: new Date().toISOString(), source: 'k6' } }),
    { headers }
  );
  check(putRes, {
    'kv put: status 200 or 401': (r) => r.status === 200 || r.status === 401,
    'kv put: not 500': (r) => r.status < 500,
  }) || errorRate.add(1);

  sleep(0.3);

  // GET the setting back
  const getRes = http.get(`${BASE_URL}/api/kv/${key}`, { headers });
  check(getRes, {
    'kv get: status 200 or 401': (r) => r.status === 200 || r.status === 401,
    'kv get: not 500': (r) => r.status < 500,
  }) || errorRate.add(1);

  sleep(0.3);

  // GET dynamic config (public, no auth required)
  const configType = Math.random() > 0.5 ? 'gait' : 'fallRisk';
  const configRes = http.get(`${BASE_URL}/api/config/${configType}`);
  check(configRes, {
    'config: status 200': (r) => r.status === 200,
  }) || errorRate.add(1);

  sleep(0.5);
}

// ---------------------------------------------------------------------------
// Error & edge-case scenarios (validation, auth, rate limits)
// ---------------------------------------------------------------------------

export function errorScenariosTest(data) {
  _setupData = data;
  // 1. Invalid JSON body
  const badJsonRes = http.post(
    `${BASE_URL}/api/live/gait`,
    'not-valid-json{{{',
    { headers: authHeaders() }
  );
  check(badJsonRes, {
    'bad json: returns 400': (r) => r.status === 400,
  }) || errorRate.add(1);

  sleep(0.2);

  // 2. Schema validation failure (missing required fields)
  const badSchemaRes = http.post(
    `${BASE_URL}/api/health-data/process`,
    JSON.stringify({ type: 'heart_rate' }), // missing value
    { headers: authHeaders() }
  );
  check(badSchemaRes, {
    'bad schema: returns 400': (r) => r.status === 400,
    'bad schema: has validation_error': (r) => {
      try {
        return JSON.parse(r.body).error === 'validation_error';
      } catch {
        return false;
      }
    },
  }) || errorRate.add(1);

  sleep(0.2);

  // 3. Missing auth on protected endpoint
  const noAuthRes = http.get(`${BASE_URL}/api/live/gait/recent`, {
    headers: { 'Content-Type': 'application/json' },
  });
  check(noAuthRes, {
    'no auth: returns 401': (r) => r.status === 401,
  }) || errorRate.add(1);

  sleep(0.2);

  // 4. Invalid KV key
  const badKeyRes = http.get(`${BASE_URL}/api/kv/not-allowed-key`, {
    headers: authHeaders(),
  });
  check(badKeyRes, {
    'bad kv key: returns 400': (r) => r.status === 400,
  }) || errorRate.add(1);

  sleep(0.2);

  // 5. Gait snapshot with out-of-range values
  const badGaitRes = http.post(
    `${BASE_URL}/api/live/gait`,
    JSON.stringify({
      speed: 999,         // max 4
      stepFrequency: -10, // min 0
      capturedAt: new Date().toISOString(),
    }),
    { headers: authHeaders() }
  );
  check(badGaitRes, {
    'bad gait values: returns 400': (r) => r.status === 400,
  }) || errorRate.add(1);

  sleep(0.2);

  // 6. Empty batch (should fail validation)
  const emptyBatchRes = http.post(
    `${BASE_URL}/api/health-data/batch`,
    JSON.stringify({ metrics: [], uploadedAt: new Date().toISOString() }),
    { headers: authHeaders() }
  );
  check(emptyBatchRes, {
    'empty batch: returns 400': (r) => r.status === 400,
  }) || errorRate.add(1);

  sleep(0.5);
}

// ---------------------------------------------------------------------------
// Telemetry ingestion (RUM, client errors, LiDAR, WS telemetry)
// ---------------------------------------------------------------------------

export function telemetryIngestionTest(data) {
  _setupData = data;
  const headers = authHeaders();

  // 1. RUM / performance metrics
  const t0 = Date.now();
  const perfRes = http.post(
    `${BASE_URL}/api/_perf_ingest`,
    JSON.stringify({
      v: 1,
      appVersion: '1.0.0-k6',
      metrics: {
        lcp: 200 + Math.random() * 2000,
        ttfb: 50 + Math.random() * 500,
        hydration: 100 + Math.random() * 800,
        wsConnect: 50 + Math.random() * 3000,
        cls: Math.random() * 0.3,
        inp: 50 + Math.random() * 400,
      },
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  telemetryLatency.add(Date.now() - t0);
  check(perfRes, {
    'perf ingest: status 200 or 429': (r) => r.status === 200 || r.status === 429,
    'perf ingest: not 500': (r) => r.status < 500,
  }) || errorRate.add(1);
  if (perfRes.status === 429) rateLimitHits.add(1);

  sleep(0.3);

  // 2. Client error reporting
  const errorRes = http.post(
    `${BASE_URL}/api/client-error`,
    JSON.stringify({
      message: `k6 simulated error at ${new Date().toISOString()}`,
      source: 'window.onerror',
      route: '/dashboard',
      sessionId: `k6-${__VU}-${__ITER}`,
      stack: 'Error: simulated\\n  at dashboard.tsx:42\\n  at render()',
      meta: { vuId: String(__VU) },
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  check(errorRes, {
    'client error: status 200': (r) => r.status === 200,
    'client error: has correlationId': (r) => {
      try {
        return !!JSON.parse(r.body).correlationId;
      } catch {
        return false;
      }
    },
  }) || errorRate.add(1);

  sleep(0.3);

  // 3. WebSocket telemetry events
  const wsEvents = ['connect_start', 'connect_success', 'pong_received', 'close'];
  const event = wsEvents[Math.floor(Math.random() * wsEvents.length)];
  const wsTelRes = http.post(
    `${BASE_URL}/api/ws-telemetry`,
    JSON.stringify({
      event,
      attempt: Math.floor(Math.random() * 3),
      code: event === 'close' ? 1000 : undefined,
      rttMs: 20 + Math.floor(Math.random() * 200),
      sinceMs: Math.floor(Math.random() * 60000),
      readyState: event === 'close' ? 3 : 1,
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  check(wsTelRes, {
    'ws telemetry: status 200': (r) => r.status === 200,
  }) || errorRate.add(1);

  sleep(0.3);

  // 4. LiDAR frames ingestion
  const frameCount = 3 + Math.floor(Math.random() * 8);
  const now = Date.now();
  const frames = Array.from({ length: frameCount }, (_, i) => ({
    ts: now - (frameCount - i) * 100,
    metrics: {
      obstacle_distance_min: 0.5 + Math.random() * 5,
      ground_slope: -5 + Math.random() * 10,
      surface_roughness: Math.random() * 0.5,
    },
  }));
  const lidarRes = http.post(
    `${BASE_URL}/api/lidar/ingest`,
    JSON.stringify({ frames }),
    { headers }
  );
  check(lidarRes, {
    'lidar: status 200 or 429': (r) => r.status === 200 || r.status === 429,
    'lidar: not 500': (r) => r.status < 500,
  }) || errorRate.add(1);
  if (lidarRes.status === 429) rateLimitHits.add(1);

  sleep(0.3);

  // 5. Version mismatch reporting
  const mismatchRes = http.post(
    `${BASE_URL}/api/client-analytics/version-mismatch`,
    JSON.stringify({
      gaitLocal: '2.1.0',
      gaitRemote: '2.2.0',
      fallLocal: '1.5.0',
      fallRemote: '1.5.0',
      ts: new Date().toISOString(),
      sample: Math.random(),
      seq: __ITER,
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  check(mismatchRes, {
    'version mismatch: status 200': (r) => r.status === 200,
  }) || errorRate.add(1);

  // 6. Observability endpoints (auth-gated)
  const obsHealthRes = http.get(`${BASE_URL}/api/observability/health`, { headers });
  check(obsHealthRes, {
    'obs health: status 200 or 401': (r) => r.status === 200 || r.status === 401,
  }) || errorRate.add(1);

  const ranges = ['1h', '6h', '24h', '7d'];
  const range = ranges[Math.floor(Math.random() * ranges.length)];
  const obsMetricsRes = http.get(`${BASE_URL}/api/observability/metrics?range=${range}`, { headers });
  check(obsMetricsRes, {
    'obs metrics: status 200 or 401': (r) => r.status === 200 || r.status === 401,
  }) || errorRate.add(1);

  sleep(0.5);
}

// ---------------------------------------------------------------------------
// WebSocket sustained throughput (stream health data, not just ping)
// ---------------------------------------------------------------------------

export function wsThroughputTest(data) {
  _setupData = data;
  const t0 = Date.now();
  let messagesReceived = 0;
  let messagesSent = 0;

  const res = ws.connect(WS_URL, {}, function (socket) {
    wsConnectTime.add(Date.now() - t0);

    socket.on('open', () => {
      // Send bursts of health data messages every second
      socket.setInterval(function () {
        // Simulate gait data streaming
        const sendT = Date.now();
        socket.send(JSON.stringify({
          type: 'health_data',
          data: {
            metric: 'gait_snapshot',
            speed: 0.5 + Math.random() * 2.5,
            stepFrequency: 60 + Math.random() * 140,
            asymmetry: Math.random() * 0.5,
          },
          timestamp: new Date().toISOString(),
        }));
        messagesSent++;

        // Also send periodic pings
        if (messagesSent % 5 === 0) {
          socket.send(JSON.stringify({
            type: 'ping',
            data: { sentAt: sendT },
            timestamp: new Date().toISOString(),
          }));
        }
      }, 500); // Every 500ms = ~2 messages/sec per VU
    });

    socket.on('message', (msg) => {
      messagesReceived++;
      try {
        const parsed = JSON.parse(msg);
        if (parsed.type === 'pong' && parsed.data && parsed.data.sentAt) {
          wsMessageRtt.add(Date.now() - parsed.data.sentAt);
        }
        check(parsed, {
          'ws throughput: valid message': (d) => typeof d.type === 'string',
        });
      } catch {
        // Binary or non-JSON
      }
    });

    socket.on('error', () => {
      errorRate.add(1);
    });

    // Hold connection for 30-60 seconds with active streaming
    const holdTime = 30 + Math.random() * 30;
    sleep(holdTime);

    socket.close();
  });

  check(res, {
    'ws throughput: connected': (r) => r && r.status === 101,
  }) || errorRate.add(1);
}

// ---------------------------------------------------------------------------
// Rate limit stress (deliberately exceed 429 thresholds)
// ---------------------------------------------------------------------------

export function rateLimitStressTest(data) {
  _setupData = data;
  const headers = authHeaders();

  // Hammer gait endpoint (limit: 120 req / 60s)
  // With 15 VUs sending rapid-fire, we should trigger 429s
  for (let i = 0; i < 10; i++) {
    const res = http.post(
      `${BASE_URL}/api/live/gait`,
      JSON.stringify(makeGaitSnapshot()),
      { headers }
    );
    if (res.status === 429) {
      rateLimitHits.add(1);
      check(res, {
        'rate limit: returns 429 with error body': (r) => {
          try {
            return JSON.parse(r.body).error === 'rate_limited';
          } catch {
            return false;
          }
        },
      });
      break; // Hit the limit — success
    }
    check(res, {
      'rate limit burst: not 500': (r) => r.status < 500,
    }) || errorRate.add(1);
    // No sleep — intentionally rapid-fire
  }

  sleep(0.2);

  // Hammer perf ingest (limit: 30 req / 60s)
  for (let i = 0; i < 5; i++) {
    const res = http.post(
      `${BASE_URL}/api/_perf_ingest`,
      JSON.stringify({
        metrics: { lcp: 300 + Math.random() * 1000, ttfb: 100 },
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
    if (res.status === 429) {
      rateLimitHits.add(1);
      break;
    }
  }

  sleep(0.2);

  // Hammer batch processing (limit: 20 req / 60s)
  for (let i = 0; i < 5; i++) {
    const res = http.post(
      `${BASE_URL}/api/health-data/batch`,
      JSON.stringify({
        metrics: [{ type: 'heart_rate', value: 72 }],
        uploadedAt: new Date().toISOString(),
      }),
      { headers }
    );
    if (res.status === 429) {
      rateLimitHits.add(1);
      break;
    }
  }

  sleep(1);
}

// ---------------------------------------------------------------------------
// Max payload (max-size batches: 50 gait snapshots, 100 health metrics)
// ---------------------------------------------------------------------------

export function maxPayloadTest(data) {
  _setupData = data;
  const headers = authHeaders();

  // 50-item gait batch (schema max)
  const maxGaitBatch = Array.from({ length: 50 }, () => makeGaitSnapshot());
  const t0 = Date.now();
  const gaitRes = http.post(
    `${BASE_URL}/api/live/gait/batch`,
    JSON.stringify({ snapshots: maxGaitBatch }),
    { headers }
  );
  batchProcessLatency.add(Date.now() - t0);
  check(gaitRes, {
    'max gait batch: status 200 or 401': (r) => r.status === 200 || r.status === 401,
    'max gait batch: not 500': (r) => r.status < 500,
  }) || errorRate.add(1);

  sleep(0.5);

  // 100-item health metric batch (schema max)
  const metricTypes = ['heart_rate', 'steps', 'blood_oxygen', 'respiratory_rate'];
  const maxMetricBatch = Array.from({ length: 100 }, () => {
    const t = metricTypes[Math.floor(Math.random() * metricTypes.length)];
    return makeHealthMetric(t);
  });
  const t1 = Date.now();
  const metricRes = http.post(
    `${BASE_URL}/api/health-data/batch`,
    JSON.stringify({
      metrics: maxMetricBatch,
      uploadedAt: new Date().toISOString(),
      deviceInfo: { deviceId: 'k6-max-payload', deviceType: 'test-harness' },
    }),
    { headers }
  );
  batchProcessLatency.add(Date.now() - t1);
  check(metricRes, {
    'max metric batch: status 200/201 or 429': (r) =>
      r.status === 200 || r.status === 201 || r.status === 429,
    'max metric batch: not 500': (r) => r.status < 500,
  }) || errorRate.add(1);

  sleep(0.5);

  // Large LiDAR frame batch (10 frames with full metrics)
  const lidarFrames = Array.from({ length: 10 }, (_, i) => ({
    ts: Date.now() - (10 - i) * 100,
    metrics: {
      obstacle_distance_min: Math.random() * 10,
      ground_slope: -10 + Math.random() * 20,
      surface_roughness: Math.random(),
      step_length: 0.3 + Math.random() * 0.7,
      stride_width: 0.1 + Math.random() * 0.3,
    },
  }));
  const lidarRes = http.post(
    `${BASE_URL}/api/lidar/ingest`,
    JSON.stringify({ frames: lidarFrames }),
    { headers }
  );
  check(lidarRes, {
    'max lidar: status 200 or 429': (r) => r.status === 200 || r.status === 429,
  }) || errorRate.add(1);

  sleep(1);
}

// ---------------------------------------------------------------------------
// Soak test (long-running steady state — detects leaks, expiry, quotas)
// ---------------------------------------------------------------------------

export function soakTest(data) {
  _setupData = data;
  const headers = authHeaders();
  const iteration = __ITER;

  // Mix of read and write operations to simulate steady production traffic
  // 1. Health check (always)
  const healthRes = http.get(`${BASE_URL}/health`);
  check(healthRes, {
    'soak health: status 200': (r) => r.status === 200,
  }) || errorRate.add(1);

  sleep(0.5);

  // 2. Alternate between different endpoint groups each iteration
  const group = iteration % 4;

  if (group === 0) {
    // Config reads
    http.get(`${BASE_URL}/api/gait-config-version`);
    http.get(`${BASE_URL}/api/fall-risk-config-version`);
    http.get(`${BASE_URL}/api/analytics-config-versions`);
  } else if (group === 1) {
    // Gait ingestion
    http.post(
      `${BASE_URL}/api/live/gait`,
      JSON.stringify(makeGaitSnapshot()),
      { headers }
    );
    http.get(`${BASE_URL}/api/live/gait/recent`, { headers });
  } else if (group === 2) {
    // Health data processing
    http.post(
      `${BASE_URL}/api/health-data/process`,
      JSON.stringify(makeHealthMetric('heart_rate')),
      { headers }
    );
  } else {
    // Telemetry
    http.post(
      `${BASE_URL}/api/_perf_ingest`,
      JSON.stringify({ metrics: { lcp: 500, ttfb: 100 } }),
      { headers: { 'Content-Type': 'application/json' } }
    );
    http.post(
      `${BASE_URL}/api/ws-telemetry`,
      JSON.stringify({ event: 'pong_received', rttMs: 50 }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 3. Periodic KV read (every 10th iteration)
  if (iteration % 10 === 0) {
    http.get(`${BASE_URL}/api/kv/preferences`, { headers });
  }

  // Steady pace — ~2 iterations/sec per VU
  sleep(2 + Math.random());
}

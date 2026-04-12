/**
 * VitalSense Load Tests (k6)
 *
 * Run:  k6 run scripts/load-test.mjs --env BASE_URL=https://health.andernet.dev
 *       k6 run scripts/load-test.mjs --env BASE_URL=http://localhost:8789
 *
 * Scenarios:
 *   smoke       — 5 VUs for 30s   (sanity check)
 *   load        — ramp to 50 VUs  (sustained load)
 *   stress      — ramp to 100 VUs (find breaking point)
 *   ws_storm    — 50 concurrent WebSocket connections
 */

import http from 'k6/http';
import ws from 'k6/ws';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const healthDataLatency = new Trend('health_data_latency', true);
const wsConnectTime = new Trend('ws_connect_time', true);

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8789';
const WS_URL = BASE_URL.replace('https://', 'wss://').replace('http://', 'ws://') + '/ws';

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
  },
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1500'],
    http_req_failed: ['rate<0.05'],
    errors: ['rate<0.1'],
    health_data_latency: ['p(95)<800'],
    ws_connect_time: ['p(95)<3000'],
  },
};

// ---------------------------------------------------------------------------
// Default scenario: HTTP API tests
// ---------------------------------------------------------------------------

export default function () {
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

export function wsTest() {
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

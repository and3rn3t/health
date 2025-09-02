var Qr = Object.defineProperty;
var zt = (t) => {
  throw TypeError(t);
};
var Xr = (t, e, r) => e in t ? Qr(t, e, { enumerable: !0, configurable: !0, writable: !0, value: r }) : t[e] = r;
var _ = (t, e, r) => Xr(t, typeof e != "symbol" ? e + "" : e, r), xt = (t, e, r) => e.has(t) || zt("Cannot " + r);
var d = (t, e, r) => (xt(t, e, "read from private field"), r ? r.call(t) : e.get(t)), x = (t, e, r) => e.has(t) ? zt("Cannot add the same private member more than once") : e instanceof WeakSet ? e.add(t) : e.set(t, r), v = (t, e, r, s) => (xt(t, e, "write to private field"), s ? s.call(t, r) : e.set(t, r), r), R = (t, e, r) => (xt(t, e, "access private method"), r);
var qt = (t, e, r, s) => ({
  set _(n) {
    v(t, e, n, r);
  },
  get _() {
    return d(t, e, s);
  }
});
class kr {
  /**
   * Process a single health metric into structured analytics
   */
  static async processHealthMetric(e, r) {
    const s = (/* @__PURE__ */ new Date()).toISOString(), n = crypto.randomUUID(), a = this.validateMetric(e), i = this.calculateHealthScore(e, r), o = this.assessFallRisk(e, r), c = this.analyzeTrend(e, r), l = this.detectAnomaly(e, r), u = this.generateAlert(
      e,
      i,
      o,
      l
    ), f = this.assessDataQuality(e, r);
    return {
      id: n,
      type: e.type,
      value: e.value,
      unit: e.unit,
      timestamp: e.timestamp || (/* @__PURE__ */ new Date()).toISOString(),
      processedAt: s,
      validated: a,
      healthScore: i,
      fallRisk: o,
      trendAnalysis: c,
      anomalyScore: l,
      alert: u,
      source: {
        deviceId: e.deviceId || "unknown",
        userId: e.userId || "unknown",
        collectedAt: e.timestamp || (/* @__PURE__ */ new Date()).toISOString(),
        processingPipeline: "enhanced-analytics-v1"
      },
      dataQuality: f
    };
  }
  /**
   * Process a batch of health metrics
   */
  static async processHealthBatch(e, r) {
    const s = [];
    for (const n of e.metrics)
      try {
        const a = await this.processHealthMetric(
          n,
          r
        );
        s.push(a);
      } catch (a) {
        console.error(`Failed to process metric ${n.type}:`, a), s.push(this.createErrorRecord(n, a));
      }
    return s;
  }
  /**
   * Validate health metric data
   */
  static validateMetric(e) {
    const s = {
      heart_rate: { min: 30, max: 220 },
      walking_steadiness: { min: 0, max: 100 },
      steps: { min: 0, max: 1e5 },
      oxygen_saturation: { min: 70, max: 100 },
      sleep_hours: { min: 0, max: 24 },
      body_weight: { min: 20, max: 500 },
      active_energy: { min: 0, max: 1e4 },
      distance_walking: { min: 0, max: 100 },
      blood_pressure_systolic: { min: 70, max: 250 },
      blood_pressure_diastolic: { min: 40, max: 150 },
      body_temperature: { min: 95, max: 110 },
      respiratory_rate: { min: 8, max: 40 },
      fall_event: { min: 0, max: 1 }
    }[e.type];
    return e.value >= s.min && e.value <= s.max;
  }
  /**
   * Calculate health score based on metric and trends
   */
  static calculateHealthScore(e, r) {
    let s = 50;
    return s += this.getMetricSpecificScore(e), s += this.getTrendAdjustment(e, r), Math.max(0, Math.min(100, s));
  }
  /**
   * Get metric-specific health score contribution
   */
  static getMetricSpecificScore(e) {
    switch (e.type) {
      case "heart_rate":
        return this.getHeartRateScore(e.value);
      case "walking_steadiness":
        return this.getWalkingSteadinessScore(e.value);
      case "steps":
        return this.getStepsScore(e.value);
      case "oxygen_saturation":
        return this.getOxygenSaturationScore(e.value);
      default:
        return 0;
    }
  }
  static getHeartRateScore(e) {
    return e >= 60 && e <= 100 ? 20 : e < 60 || e > 100 ? -10 : e < 40 || e > 120 ? -30 : 0;
  }
  static getWalkingSteadinessScore(e) {
    return e >= 75 ? 25 : e >= 50 ? 10 : e >= 25 ? -10 : -30;
  }
  static getStepsScore(e) {
    return e >= 8e3 ? 20 : e >= 5e3 ? 10 : e >= 2e3 ? -5 : -20;
  }
  static getOxygenSaturationScore(e) {
    return e >= 95 ? 15 : e >= 90 ? 5 : -25;
  }
  /**
   * Get trend-based score adjustment
   */
  static getTrendAdjustment(e, r) {
    if (!r || r.length < 3) return 0;
    const s = r.filter((a) => a.type === e.type).slice(-3).map((a) => a.value);
    if (s.length < 2) return 0;
    const n = this.calculateTrend(s);
    return n === "improving" ? 5 : n === "declining" ? -5 : 0;
  }
  /**
   * Assess fall risk based on metrics
   */
  static assessFallRisk(e, r) {
    let s = 0;
    return e.type === "walking_steadiness" && (e.value < 25 ? s += 40 : e.value < 50 ? s += 20 : e.value < 75 && (s += 10)), r && r.filter((i) => Date.now() - new Date(i.timestamp).getTime() < 6048e5).filter(
      (i) => i.type === "walking_steadiness" && i.value < 50 || i.type === "heart_rate" && (i.value < 50 || i.value > 120)
    ).length >= 3 && (s += 20), s >= 60 ? "critical" : s >= 40 ? "high" : s >= 20 ? "moderate" : "low";
  }
  /**
   * Analyze trend direction and significance
   */
  static analyzeTrend(e, r) {
    if (!r || r.length < 3)
      return {
        direction: "stable",
        confidence: 0.5
      };
    const s = r.filter((o) => o.type === e.type).slice(-7).map((o) => o.value);
    if (s.length < 3)
      return {
        direction: "stable",
        confidence: 0.5
      };
    const n = this.calculateTrend(s), a = this.calculateChangePercent(s), i = Math.min(1, s.length / 7);
    return {
      direction: n,
      confidence: i,
      changePercent: a
    };
  }
  /**
   * Detect anomalies in health data
   */
  static detectAnomaly(e, r) {
    if (!r || r.length < 10)
      return 0;
    const s = r.filter((c) => c.type === e.type).map((c) => c.value);
    if (s.length < 10) return 0;
    const n = s.reduce((c, l) => c + l, 0) / s.length, a = s.reduce((c, l) => c + Math.pow(l - n, 2), 0) / s.length, i = Math.sqrt(a), o = Math.abs(e.value - n) / i;
    return Math.min(1, o / 3);
  }
  /**
   * Generate alerts based on metric analysis
   */
  static generateAlert(e, r, s, n) {
    return e.type === "heart_rate" && (e.value < 40 || e.value > 140) ? {
      level: "critical",
      message: `Heart rate ${e.value} bpm is outside safe range`,
      actionRequired: !0,
      expiresAt: new Date(Date.now() + 14400 * 1e3).toISOString()
      // 4 hours
    } : e.type === "oxygen_saturation" && e.value < 90 ? {
      level: "critical",
      message: `Oxygen saturation ${e.value}% is critically low`,
      actionRequired: !0,
      expiresAt: new Date(Date.now() + 7200 * 1e3).toISOString()
      // 2 hours
    } : s === "critical" ? {
      level: "critical",
      message: "Critical fall risk detected - immediate attention required",
      actionRequired: !0,
      expiresAt: new Date(Date.now() + 1440 * 60 * 1e3).toISOString()
      // 24 hours
    } : r < 30 ? {
      level: "warning",
      message: "Health score indicates concerning trends",
      actionRequired: !1,
      expiresAt: new Date(Date.now() + 10080 * 60 * 1e3).toISOString()
      // 7 days
    } : n > 0.8 ? {
      level: "warning",
      message: "Unusual reading detected - monitoring recommended",
      actionRequired: !1,
      expiresAt: new Date(Date.now() + 1440 * 60 * 1e3).toISOString()
      // 24 hours
    } : null;
  }
  /**
   * Assess data quality metrics
   */
  static assessDataQuality(e, r) {
    const s = this.assessCompleteness(e), n = this.assessAccuracy(e), a = this.assessTimeliness(e), i = this.assessConsistency(e, r);
    return { completeness: s, accuracy: n, timeliness: a, consistency: i };
  }
  static assessCompleteness(e) {
    let r = 100;
    return e.unit || (r -= 10), e.timestamp || (r -= 15), e.deviceId || (r -= 5), Math.max(0, r);
  }
  static assessAccuracy(e) {
    let r = 90;
    return this.validateMetric(e) || (r -= 30), Math.max(0, r);
  }
  static assessTimeliness(e) {
    let r = 100;
    if (!e.timestamp) return r;
    const n = (Date.now() - new Date(e.timestamp).getTime()) / (1e3 * 60 * 60);
    return n > 24 ? r -= 20 : n > 12 ? r -= 10 : n > 6 && (r -= 5), Math.max(0, r);
  }
  static assessConsistency(e, r) {
    let s = 90;
    if (!r || r.length < 5) return s;
    const n = r.filter((o) => o.type === e.type).slice(-5).map((o) => o.value);
    if (n.length < 3) return s;
    const a = n.reduce((o, c) => o + c, 0) / n.length, i = Math.abs(e.value - a) / a;
    return i > 0.5 ? s -= 20 : i > 0.25 && (s -= 10), Math.max(0, s);
  }
  /**
   * Create error record for failed processing
   */
  static createErrorRecord(e, r) {
    return {
      id: crypto.randomUUID(),
      type: e.type,
      value: e.value,
      unit: e.unit,
      timestamp: e.timestamp || (/* @__PURE__ */ new Date()).toISOString(),
      processedAt: (/* @__PURE__ */ new Date()).toISOString(),
      validated: !1,
      alert: {
        level: "warning",
        message: `Processing failed: ${r.message}`,
        actionRequired: !1
      },
      source: {
        deviceId: e.deviceId || "unknown",
        userId: e.userId || "unknown",
        collectedAt: e.timestamp || (/* @__PURE__ */ new Date()).toISOString(),
        processingPipeline: "enhanced-analytics-v1"
      }
    };
  }
  /**
   * Helper: calculate trend direction
   */
  static calculateTrend(e) {
    if (e.length < 2) return "stable";
    const r = e[0], n = (e[e.length - 1] - r) / r * 100;
    return n > 5 ? "improving" : n < -5 ? "declining" : "stable";
  }
  /**
   * Helper: calculate percentage change
   */
  static calculateChangePercent(e) {
    if (e.length < 2) return 0;
    const r = e[0];
    return (e[e.length - 1] - r) / r * 100;
  }
}
const oe = 1440 * 60, es = {
  heart_rate: 30 * oe,
  steps: 30 * oe,
  walking_steadiness: 180 * oe,
  sleep: 90 * oe,
  activity: 90 * oe,
  fall_event: 365 * oe
};
function gt(t, e) {
  const r = es[t] ?? 30 * oe;
  return e && e !== "production" ? Math.min(r, 2 * oe) : r;
}
async function xr(t, e, r) {
  const s = Math.max(1, Math.min(2e3, (r == null ? void 0 : r.limit) ?? 1e3)), n = (r == null ? void 0 : r.prefix) ?? "health:", a = await e.list({ prefix: n, limit: s }), i = Date.now();
  let o = 0, c = 0;
  for (const l of a.keys) {
    o += 1;
    const u = l.name.split(":");
    if (u.length < 3) continue;
    const f = u[1], g = u.slice(2).join(":"), E = gt(f, t.ENVIRONMENT), C = Date.parse(g);
    if (!Number.isFinite(C)) continue;
    const O = C + E * 1e3;
    if (i > O)
      try {
        await e.delete(l.name), c += 1;
      } catch {
      }
  }
  return { scanned: o, deleted: c };
}
const ve = {
  info: (t, e) => console.log(t, bt(e)),
  warn: (t, e) => console.warn(t, bt(e)),
  error: (t, e) => console.error(t, bt(e))
};
function bt(t) {
  if (!t) return {};
  try {
    const e = [
      "body",
      "data",
      "payload",
      "health",
      "value",
      "name",
      "email",
      "phone"
    ], r = {};
    for (const [s, n] of Object.entries(t))
      r[s] = e.includes(s) ? "[redacted]" : n;
    return r;
  } catch {
    return {};
  }
}
function Bt(t, e) {
  const r = new Headers(), s = t && e.includes(t) ? t : "";
  return s && (r.set("Access-Control-Allow-Origin", s), r.set("Vary", "Origin"), r.set("Access-Control-Allow-Credentials", "true"), r.set("Access-Control-Allow-Headers", "authorization, content-type"), r.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS")), r;
}
async function br(t, e = {}) {
  try {
    const r = t.split(".");
    if (r.length !== 3) return { ok: !1 };
    const s = JSON.parse(atob(r[1])), n = Math.floor(Date.now() / 1e3), a = e.clockSkewSec ?? 60;
    return typeof s.exp == "number" && n > s.exp + a ? { ok: !1 } : typeof s.nbf == "number" && n + a < s.nbf ? { ok: !1 } : e.iss && s.iss !== e.iss ? { ok: !1 } : e.aud && s.aud !== e.aud ? { ok: !1 } : { ok: !0, sub: s.sub, claims: s };
  } catch {
    return { ok: !1 };
  }
}
function it(t) {
  const e = t.length % 4 === 0 ? "" : "=".repeat(4 - t.length % 4), r = t.replace(/-/g, "+").replace(/_/g, "/") + e, s = atob(r), n = new Uint8Array(s.length);
  for (let a = 0; a < s.length; a++) n[a] = s.charCodeAt(a);
  return n;
}
const Ft = /* @__PURE__ */ new Map();
async function ts(t, e) {
  const r = t, s = Date.now(), n = Ft.get(r);
  if (n && s - n.fetchedAt < n.ttlMs && n.keys[e])
    return n.keys[e];
  try {
    const a = await fetch(t);
    if (!a.ok) return null;
    const i = await a.json(), o = {};
    if (i.keys && Array.isArray(i.keys))
      for (const c of i.keys) {
        if (c.kty !== "RSA") continue;
        const l = await crypto.subtle.importKey(
          "jwk",
          c,
          { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
          !1,
          ["verify"]
        );
        c.kid && (o[c.kid] = l);
      }
    return Ft.set(r, {
      fetchedAt: s,
      ttlMs: 300 * 1e3,
      keys: o
    }), o[e] || null;
  } catch {
    return null;
  }
}
async function Sr(t, e) {
  try {
    const [r, s, n] = t.split(".");
    if (!r || !s || !n) return { ok: !1 };
    const a = JSON.parse(new TextDecoder().decode(it(r)));
    if (a.alg !== "RS256" || !a.kid) return { ok: !1 };
    const i = await ts(e.jwksUrl, a.kid);
    if (!i) return { ok: !1 };
    const o = new TextEncoder().encode(`${r}.${s}`), c = it(n), l = new Uint8Array(o.length);
    l.set(o);
    const u = new Uint8Array(c.length);
    if (u.set(c), !await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      i,
      u,
      l
    )) return { ok: !1 };
    const g = JSON.parse(
      new TextDecoder().decode(it(s))
    ), E = Math.floor(Date.now() / 1e3), C = e.clockSkewSec ?? 60;
    return typeof g.exp == "number" && E > g.exp + C ? { ok: !1 } : typeof g.nbf == "number" && E + C < g.nbf ? { ok: !1 } : e.iss && g.iss !== e.iss ? { ok: !1 } : e.aud && g.aud !== e.aud ? { ok: !1 } : {
      ok: !0,
      sub: g.sub,
      claims: g
    };
  } catch {
    return { ok: !1 };
  }
}
function rs(t) {
  try {
    const e = t.split(".");
    return e.length < 2 ? null : JSON.parse(
      new TextDecoder().decode(it(e[1]))
    );
  } catch {
    return null;
  }
}
async function Dt(t, e) {
  try {
    const r = e.at || (/* @__PURE__ */ new Date()).toISOString(), s = JSON.stringify({
      type: e.type,
      at: r,
      actor: e.actor ?? "anonymous",
      resource: e.resource ?? "-",
      meta: e.meta ?? {}
    }) + `
`;
    if (t.HEALTH_STORAGE) {
      const n = `audit/events/${r}_${Math.random().toString(36).slice(2)}.json`;
      await t.HEALTH_STORAGE.put(n, s, {
        httpMetadata: { contentType: "application/json" }
      });
    }
  } catch (r) {
    ve.warn("audit_write_failed", { error: r.message });
  }
}
async function Te(t) {
  const e = Uint8Array.from(atob(t), (r) => r.charCodeAt(0));
  if (e.byteLength !== 32)
    throw new Error("ENC_KEY must be 32 bytes (base64)");
  return crypto.subtle.importKey("raw", e, { name: "AES-GCM" }, !1, [
    "encrypt",
    "decrypt"
  ]);
}
async function vt(t, e) {
  const r = crypto.getRandomValues(new Uint8Array(12)), s = new TextEncoder().encode(JSON.stringify(e)), n = await crypto.subtle.encrypt({ name: "AES-GCM", iv: r }, t, s), a = new Uint8Array(r.byteLength + n.byteLength);
  return a.set(r, 0), a.set(new Uint8Array(n), r.byteLength), btoa(String.fromCharCode(...a));
}
async function Lt(t, e) {
  const r = Uint8Array.from(atob(e), (i) => i.charCodeAt(0)), s = r.slice(0, 12), n = r.slice(12), a = await crypto.subtle.decrypt({ name: "AES-GCM", iv: s }, t, n);
  return JSON.parse(new TextDecoder().decode(a));
}
function St(t) {
  return btoa(String.fromCharCode(...t)).replace(/=+$/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
async function ss(t, e, r = {}) {
  const s = new TextEncoder(), n = { alg: "HS256", typ: "JWT", ...r }, a = St(s.encode(JSON.stringify(n))), i = St(s.encode(JSON.stringify(t))), o = `${a}.${i}`, c = await crypto.subtle.importKey(
    "raw",
    s.encode(e),
    { name: "HMAC", hash: "SHA-256" },
    !1,
    ["sign"]
  ), l = await crypto.subtle.sign("HMAC", c, s.encode(o)), u = St(new Uint8Array(l));
  return `${o}.${u}`;
}
var A;
(function(t) {
  t.assertEqual = (n) => {
  };
  function e(n) {
  }
  t.assertIs = e;
  function r(n) {
    throw new Error();
  }
  t.assertNever = r, t.arrayToEnum = (n) => {
    const a = {};
    for (const i of n)
      a[i] = i;
    return a;
  }, t.getValidEnumValues = (n) => {
    const a = t.objectKeys(n).filter((o) => typeof n[n[o]] != "number"), i = {};
    for (const o of a)
      i[o] = n[o];
    return t.objectValues(i);
  }, t.objectValues = (n) => t.objectKeys(n).map(function(a) {
    return n[a];
  }), t.objectKeys = typeof Object.keys == "function" ? (n) => Object.keys(n) : (n) => {
    const a = [];
    for (const i in n)
      Object.prototype.hasOwnProperty.call(n, i) && a.push(i);
    return a;
  }, t.find = (n, a) => {
    for (const i of n)
      if (a(i))
        return i;
  }, t.isInteger = typeof Number.isInteger == "function" ? (n) => Number.isInteger(n) : (n) => typeof n == "number" && Number.isFinite(n) && Math.floor(n) === n;
  function s(n, a = " | ") {
    return n.map((i) => typeof i == "string" ? `'${i}'` : i).join(a);
  }
  t.joinValues = s, t.jsonStringifyReplacer = (n, a) => typeof a == "bigint" ? a.toString() : a;
})(A || (A = {}));
var Kt;
(function(t) {
  t.mergeShapes = (e, r) => ({
    ...e,
    ...r
    // second overwrites first
  });
})(Kt || (Kt = {}));
const m = A.arrayToEnum([
  "string",
  "nan",
  "number",
  "integer",
  "float",
  "boolean",
  "date",
  "bigint",
  "symbol",
  "function",
  "undefined",
  "null",
  "array",
  "object",
  "unknown",
  "promise",
  "void",
  "never",
  "map",
  "set"
]), ce = (t) => {
  switch (typeof t) {
    case "undefined":
      return m.undefined;
    case "string":
      return m.string;
    case "number":
      return Number.isNaN(t) ? m.nan : m.number;
    case "boolean":
      return m.boolean;
    case "function":
      return m.function;
    case "bigint":
      return m.bigint;
    case "symbol":
      return m.symbol;
    case "object":
      return Array.isArray(t) ? m.array : t === null ? m.null : t.then && typeof t.then == "function" && t.catch && typeof t.catch == "function" ? m.promise : typeof Map < "u" && t instanceof Map ? m.map : typeof Set < "u" && t instanceof Set ? m.set : typeof Date < "u" && t instanceof Date ? m.date : m.object;
    default:
      return m.unknown;
  }
}, h = A.arrayToEnum([
  "invalid_type",
  "invalid_literal",
  "custom",
  "invalid_union",
  "invalid_union_discriminator",
  "invalid_enum_value",
  "unrecognized_keys",
  "invalid_arguments",
  "invalid_return_type",
  "invalid_date",
  "invalid_string",
  "too_small",
  "too_big",
  "invalid_intersection_types",
  "not_multiple_of",
  "not_finite"
]);
class se extends Error {
  get errors() {
    return this.issues;
  }
  constructor(e) {
    super(), this.issues = [], this.addIssue = (s) => {
      this.issues = [...this.issues, s];
    }, this.addIssues = (s = []) => {
      this.issues = [...this.issues, ...s];
    };
    const r = new.target.prototype;
    Object.setPrototypeOf ? Object.setPrototypeOf(this, r) : this.__proto__ = r, this.name = "ZodError", this.issues = e;
  }
  format(e) {
    const r = e || function(a) {
      return a.message;
    }, s = { _errors: [] }, n = (a) => {
      for (const i of a.issues)
        if (i.code === "invalid_union")
          i.unionErrors.map(n);
        else if (i.code === "invalid_return_type")
          n(i.returnTypeError);
        else if (i.code === "invalid_arguments")
          n(i.argumentsError);
        else if (i.path.length === 0)
          s._errors.push(r(i));
        else {
          let o = s, c = 0;
          for (; c < i.path.length; ) {
            const l = i.path[c];
            c === i.path.length - 1 ? (o[l] = o[l] || { _errors: [] }, o[l]._errors.push(r(i))) : o[l] = o[l] || { _errors: [] }, o = o[l], c++;
          }
        }
    };
    return n(this), s;
  }
  static assert(e) {
    if (!(e instanceof se))
      throw new Error(`Not a ZodError: ${e}`);
  }
  toString() {
    return this.message;
  }
  get message() {
    return JSON.stringify(this.issues, A.jsonStringifyReplacer, 2);
  }
  get isEmpty() {
    return this.issues.length === 0;
  }
  flatten(e = (r) => r.message) {
    const r = {}, s = [];
    for (const n of this.issues)
      if (n.path.length > 0) {
        const a = n.path[0];
        r[a] = r[a] || [], r[a].push(e(n));
      } else
        s.push(e(n));
    return { formErrors: s, fieldErrors: r };
  }
  get formErrors() {
    return this.flatten();
  }
}
se.create = (t) => new se(t);
const Tt = (t, e) => {
  let r;
  switch (t.code) {
    case h.invalid_type:
      t.received === m.undefined ? r = "Required" : r = `Expected ${t.expected}, received ${t.received}`;
      break;
    case h.invalid_literal:
      r = `Invalid literal value, expected ${JSON.stringify(t.expected, A.jsonStringifyReplacer)}`;
      break;
    case h.unrecognized_keys:
      r = `Unrecognized key(s) in object: ${A.joinValues(t.keys, ", ")}`;
      break;
    case h.invalid_union:
      r = "Invalid input";
      break;
    case h.invalid_union_discriminator:
      r = `Invalid discriminator value. Expected ${A.joinValues(t.options)}`;
      break;
    case h.invalid_enum_value:
      r = `Invalid enum value. Expected ${A.joinValues(t.options)}, received '${t.received}'`;
      break;
    case h.invalid_arguments:
      r = "Invalid function arguments";
      break;
    case h.invalid_return_type:
      r = "Invalid function return type";
      break;
    case h.invalid_date:
      r = "Invalid date";
      break;
    case h.invalid_string:
      typeof t.validation == "object" ? "includes" in t.validation ? (r = `Invalid input: must include "${t.validation.includes}"`, typeof t.validation.position == "number" && (r = `${r} at one or more positions greater than or equal to ${t.validation.position}`)) : "startsWith" in t.validation ? r = `Invalid input: must start with "${t.validation.startsWith}"` : "endsWith" in t.validation ? r = `Invalid input: must end with "${t.validation.endsWith}"` : A.assertNever(t.validation) : t.validation !== "regex" ? r = `Invalid ${t.validation}` : r = "Invalid";
      break;
    case h.too_small:
      t.type === "array" ? r = `Array must contain ${t.exact ? "exactly" : t.inclusive ? "at least" : "more than"} ${t.minimum} element(s)` : t.type === "string" ? r = `String must contain ${t.exact ? "exactly" : t.inclusive ? "at least" : "over"} ${t.minimum} character(s)` : t.type === "number" ? r = `Number must be ${t.exact ? "exactly equal to " : t.inclusive ? "greater than or equal to " : "greater than "}${t.minimum}` : t.type === "bigint" ? r = `Number must be ${t.exact ? "exactly equal to " : t.inclusive ? "greater than or equal to " : "greater than "}${t.minimum}` : t.type === "date" ? r = `Date must be ${t.exact ? "exactly equal to " : t.inclusive ? "greater than or equal to " : "greater than "}${new Date(Number(t.minimum))}` : r = "Invalid input";
      break;
    case h.too_big:
      t.type === "array" ? r = `Array must contain ${t.exact ? "exactly" : t.inclusive ? "at most" : "less than"} ${t.maximum} element(s)` : t.type === "string" ? r = `String must contain ${t.exact ? "exactly" : t.inclusive ? "at most" : "under"} ${t.maximum} character(s)` : t.type === "number" ? r = `Number must be ${t.exact ? "exactly" : t.inclusive ? "less than or equal to" : "less than"} ${t.maximum}` : t.type === "bigint" ? r = `BigInt must be ${t.exact ? "exactly" : t.inclusive ? "less than or equal to" : "less than"} ${t.maximum}` : t.type === "date" ? r = `Date must be ${t.exact ? "exactly" : t.inclusive ? "smaller than or equal to" : "smaller than"} ${new Date(Number(t.maximum))}` : r = "Invalid input";
      break;
    case h.custom:
      r = "Invalid input";
      break;
    case h.invalid_intersection_types:
      r = "Intersection results could not be merged";
      break;
    case h.not_multiple_of:
      r = `Number must be a multiple of ${t.multipleOf}`;
      break;
    case h.not_finite:
      r = "Number must be finite";
      break;
    default:
      r = e.defaultError, A.assertNever(t);
  }
  return { message: r };
};
let ns = Tt;
function as() {
  return ns;
}
const is = (t) => {
  const { data: e, path: r, errorMaps: s, issueData: n } = t, a = [...r, ...n.path || []], i = {
    ...n,
    path: a
  };
  if (n.message !== void 0)
    return {
      ...n,
      path: a,
      message: n.message
    };
  let o = "";
  const c = s.filter((l) => !!l).slice().reverse();
  for (const l of c)
    o = l(i, { data: e, defaultError: o }).message;
  return {
    ...n,
    path: a,
    message: o
  };
};
function p(t, e) {
  const r = as(), s = is({
    issueData: e,
    data: t.data,
    path: t.path,
    errorMaps: [
      t.common.contextualErrorMap,
      // contextual error map is first priority
      t.schemaErrorMap,
      // then schema-bound map if available
      r,
      // then global override map
      r === Tt ? void 0 : Tt
      // then global default map
    ].filter((n) => !!n)
  });
  t.common.issues.push(s);
}
class V {
  constructor() {
    this.value = "valid";
  }
  dirty() {
    this.value === "valid" && (this.value = "dirty");
  }
  abort() {
    this.value !== "aborted" && (this.value = "aborted");
  }
  static mergeArray(e, r) {
    const s = [];
    for (const n of r) {
      if (n.status === "aborted")
        return w;
      n.status === "dirty" && e.dirty(), s.push(n.value);
    }
    return { status: e.value, value: s };
  }
  static async mergeObjectAsync(e, r) {
    const s = [];
    for (const n of r) {
      const a = await n.key, i = await n.value;
      s.push({
        key: a,
        value: i
      });
    }
    return V.mergeObjectSync(e, s);
  }
  static mergeObjectSync(e, r) {
    const s = {};
    for (const n of r) {
      const { key: a, value: i } = n;
      if (a.status === "aborted" || i.status === "aborted")
        return w;
      a.status === "dirty" && e.dirty(), i.status === "dirty" && e.dirty(), a.value !== "__proto__" && (typeof i.value < "u" || n.alwaysSet) && (s[a.value] = i.value);
    }
    return { status: e.value, value: s };
  }
}
const w = Object.freeze({
  status: "aborted"
}), Je = (t) => ({ status: "dirty", value: t }), z = (t) => ({ status: "valid", value: t }), Wt = (t) => t.status === "aborted", Jt = (t) => t.status === "dirty", Ve = (t) => t.status === "valid", ut = (t) => typeof Promise < "u" && t instanceof Promise;
var y;
(function(t) {
  t.errToObj = (e) => typeof e == "string" ? { message: e } : e || {}, t.toString = (e) => typeof e == "string" ? e : e == null ? void 0 : e.message;
})(y || (y = {}));
class ye {
  constructor(e, r, s, n) {
    this._cachedPath = [], this.parent = e, this.data = r, this._path = s, this._key = n;
  }
  get path() {
    return this._cachedPath.length || (Array.isArray(this._key) ? this._cachedPath.push(...this._path, ...this._key) : this._cachedPath.push(...this._path, this._key)), this._cachedPath;
  }
}
const Gt = (t, e) => {
  if (Ve(e))
    return { success: !0, data: e.value };
  if (!t.common.issues.length)
    throw new Error("Validation failed but no issues detected.");
  return {
    success: !1,
    get error() {
      if (this._error)
        return this._error;
      const r = new se(t.common.issues);
      return this._error = r, this._error;
    }
  };
};
function b(t) {
  if (!t)
    return {};
  const { errorMap: e, invalid_type_error: r, required_error: s, description: n } = t;
  if (e && (r || s))
    throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
  return e ? { errorMap: e, description: n } : { errorMap: (i, o) => {
    const { message: c } = t;
    return i.code === "invalid_enum_value" ? { message: c ?? o.defaultError } : typeof o.data > "u" ? { message: c ?? s ?? o.defaultError } : i.code !== "invalid_type" ? { message: o.defaultError } : { message: c ?? r ?? o.defaultError };
  }, description: n };
}
class S {
  get description() {
    return this._def.description;
  }
  _getType(e) {
    return ce(e.data);
  }
  _getOrReturnCtx(e, r) {
    return r || {
      common: e.parent.common,
      data: e.data,
      parsedType: ce(e.data),
      schemaErrorMap: this._def.errorMap,
      path: e.path,
      parent: e.parent
    };
  }
  _processInputParams(e) {
    return {
      status: new V(),
      ctx: {
        common: e.parent.common,
        data: e.data,
        parsedType: ce(e.data),
        schemaErrorMap: this._def.errorMap,
        path: e.path,
        parent: e.parent
      }
    };
  }
  _parseSync(e) {
    const r = this._parse(e);
    if (ut(r))
      throw new Error("Synchronous parse encountered promise.");
    return r;
  }
  _parseAsync(e) {
    const r = this._parse(e);
    return Promise.resolve(r);
  }
  parse(e, r) {
    const s = this.safeParse(e, r);
    if (s.success)
      return s.data;
    throw s.error;
  }
  safeParse(e, r) {
    const s = {
      common: {
        issues: [],
        async: (r == null ? void 0 : r.async) ?? !1,
        contextualErrorMap: r == null ? void 0 : r.errorMap
      },
      path: (r == null ? void 0 : r.path) || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data: e,
      parsedType: ce(e)
    }, n = this._parseSync({ data: e, path: s.path, parent: s });
    return Gt(s, n);
  }
  "~validate"(e) {
    var s, n;
    const r = {
      common: {
        issues: [],
        async: !!this["~standard"].async
      },
      path: [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data: e,
      parsedType: ce(e)
    };
    if (!this["~standard"].async)
      try {
        const a = this._parseSync({ data: e, path: [], parent: r });
        return Ve(a) ? {
          value: a.value
        } : {
          issues: r.common.issues
        };
      } catch (a) {
        (n = (s = a == null ? void 0 : a.message) == null ? void 0 : s.toLowerCase()) != null && n.includes("encountered") && (this["~standard"].async = !0), r.common = {
          issues: [],
          async: !0
        };
      }
    return this._parseAsync({ data: e, path: [], parent: r }).then((a) => Ve(a) ? {
      value: a.value
    } : {
      issues: r.common.issues
    });
  }
  async parseAsync(e, r) {
    const s = await this.safeParseAsync(e, r);
    if (s.success)
      return s.data;
    throw s.error;
  }
  async safeParseAsync(e, r) {
    const s = {
      common: {
        issues: [],
        contextualErrorMap: r == null ? void 0 : r.errorMap,
        async: !0
      },
      path: (r == null ? void 0 : r.path) || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data: e,
      parsedType: ce(e)
    }, n = this._parse({ data: e, path: s.path, parent: s }), a = await (ut(n) ? n : Promise.resolve(n));
    return Gt(s, a);
  }
  refine(e, r) {
    const s = (n) => typeof r == "string" || typeof r > "u" ? { message: r } : typeof r == "function" ? r(n) : r;
    return this._refinement((n, a) => {
      const i = e(n), o = () => a.addIssue({
        code: h.custom,
        ...s(n)
      });
      return typeof Promise < "u" && i instanceof Promise ? i.then((c) => c ? !0 : (o(), !1)) : i ? !0 : (o(), !1);
    });
  }
  refinement(e, r) {
    return this._refinement((s, n) => e(s) ? !0 : (n.addIssue(typeof r == "function" ? r(s, n) : r), !1));
  }
  _refinement(e) {
    return new qe({
      schema: this,
      typeName: k.ZodEffects,
      effect: { type: "refinement", refinement: e }
    });
  }
  superRefine(e) {
    return this._refinement(e);
  }
  constructor(e) {
    this.spa = this.safeParseAsync, this._def = e, this.parse = this.parse.bind(this), this.safeParse = this.safeParse.bind(this), this.parseAsync = this.parseAsync.bind(this), this.safeParseAsync = this.safeParseAsync.bind(this), this.spa = this.spa.bind(this), this.refine = this.refine.bind(this), this.refinement = this.refinement.bind(this), this.superRefine = this.superRefine.bind(this), this.optional = this.optional.bind(this), this.nullable = this.nullable.bind(this), this.nullish = this.nullish.bind(this), this.array = this.array.bind(this), this.promise = this.promise.bind(this), this.or = this.or.bind(this), this.and = this.and.bind(this), this.transform = this.transform.bind(this), this.brand = this.brand.bind(this), this.default = this.default.bind(this), this.catch = this.catch.bind(this), this.describe = this.describe.bind(this), this.pipe = this.pipe.bind(this), this.readonly = this.readonly.bind(this), this.isNullable = this.isNullable.bind(this), this.isOptional = this.isOptional.bind(this), this["~standard"] = {
      version: 1,
      vendor: "zod",
      validate: (r) => this["~validate"](r)
    };
  }
  optional() {
    return me.create(this, this._def);
  }
  nullable() {
    return Be.create(this, this._def);
  }
  nullish() {
    return this.nullable().optional();
  }
  array() {
    return J.create(this);
  }
  promise() {
    return pt.create(this, this._def);
  }
  or(e) {
    return ht.create([this, e], this._def);
  }
  and(e) {
    return ft.create(this, e, this._def);
  }
  transform(e) {
    return new qe({
      ...b(this._def),
      schema: this,
      typeName: k.ZodEffects,
      effect: { type: "transform", transform: e }
    });
  }
  default(e) {
    const r = typeof e == "function" ? e : () => e;
    return new Nt({
      ...b(this._def),
      innerType: this,
      defaultValue: r,
      typeName: k.ZodDefault
    });
  }
  brand() {
    return new Ts({
      typeName: k.ZodBranded,
      type: this,
      ...b(this._def)
    });
  }
  catch(e) {
    const r = typeof e == "function" ? e : () => e;
    return new It({
      ...b(this._def),
      innerType: this,
      catchValue: r,
      typeName: k.ZodCatch
    });
  }
  describe(e) {
    const r = this.constructor;
    return new r({
      ...this._def,
      description: e
    });
  }
  pipe(e) {
    return Zt.create(this, e);
  }
  readonly() {
    return Pt.create(this);
  }
  isOptional() {
    return this.safeParse(void 0).success;
  }
  isNullable() {
    return this.safeParse(null).success;
  }
}
const os = /^c[^\s-]{8,}$/i, cs = /^[0-9a-z]+$/, ls = /^[0-9A-HJKMNP-TV-Z]{26}$/i, us = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i, ds = /^[a-z0-9_-]{21}$/i, hs = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/, fs = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/, ps = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i, ms = "^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$";
let At;
const ys = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/, gs = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/, vs = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/, _s = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/, ws = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/, ks = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/, Ar = "((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))", xs = new RegExp(`^${Ar}$`);
function Rr(t) {
  let e = "[0-5]\\d";
  t.precision ? e = `${e}\\.\\d{${t.precision}}` : t.precision == null && (e = `${e}(\\.\\d+)?`);
  const r = t.precision ? "+" : "?";
  return `([01]\\d|2[0-3]):[0-5]\\d(:${e})${r}`;
}
function bs(t) {
  return new RegExp(`^${Rr(t)}$`);
}
function Ss(t) {
  let e = `${Ar}T${Rr(t)}`;
  const r = [];
  return r.push(t.local ? "Z?" : "Z"), t.offset && r.push("([+-]\\d{2}:?\\d{2})"), e = `${e}(${r.join("|")})`, new RegExp(`^${e}$`);
}
function As(t, e) {
  return !!((e === "v4" || !e) && ys.test(t) || (e === "v6" || !e) && vs.test(t));
}
function Rs(t, e) {
  if (!hs.test(t))
    return !1;
  try {
    const [r] = t.split(".");
    if (!r)
      return !1;
    const s = r.replace(/-/g, "+").replace(/_/g, "/").padEnd(r.length + (4 - r.length % 4) % 4, "="), n = JSON.parse(atob(s));
    return !(typeof n != "object" || n === null || "typ" in n && (n == null ? void 0 : n.typ) !== "JWT" || !n.alg || e && n.alg !== e);
  } catch {
    return !1;
  }
}
function Es(t, e) {
  return !!((e === "v4" || !e) && gs.test(t) || (e === "v6" || !e) && _s.test(t));
}
class re extends S {
  _parse(e) {
    if (this._def.coerce && (e.data = String(e.data)), this._getType(e) !== m.string) {
      const a = this._getOrReturnCtx(e);
      return p(a, {
        code: h.invalid_type,
        expected: m.string,
        received: a.parsedType
      }), w;
    }
    const s = new V();
    let n;
    for (const a of this._def.checks)
      if (a.kind === "min")
        e.data.length < a.value && (n = this._getOrReturnCtx(e, n), p(n, {
          code: h.too_small,
          minimum: a.value,
          type: "string",
          inclusive: !0,
          exact: !1,
          message: a.message
        }), s.dirty());
      else if (a.kind === "max")
        e.data.length > a.value && (n = this._getOrReturnCtx(e, n), p(n, {
          code: h.too_big,
          maximum: a.value,
          type: "string",
          inclusive: !0,
          exact: !1,
          message: a.message
        }), s.dirty());
      else if (a.kind === "length") {
        const i = e.data.length > a.value, o = e.data.length < a.value;
        (i || o) && (n = this._getOrReturnCtx(e, n), i ? p(n, {
          code: h.too_big,
          maximum: a.value,
          type: "string",
          inclusive: !0,
          exact: !0,
          message: a.message
        }) : o && p(n, {
          code: h.too_small,
          minimum: a.value,
          type: "string",
          inclusive: !0,
          exact: !0,
          message: a.message
        }), s.dirty());
      } else if (a.kind === "email")
        ps.test(e.data) || (n = this._getOrReturnCtx(e, n), p(n, {
          validation: "email",
          code: h.invalid_string,
          message: a.message
        }), s.dirty());
      else if (a.kind === "emoji")
        At || (At = new RegExp(ms, "u")), At.test(e.data) || (n = this._getOrReturnCtx(e, n), p(n, {
          validation: "emoji",
          code: h.invalid_string,
          message: a.message
        }), s.dirty());
      else if (a.kind === "uuid")
        us.test(e.data) || (n = this._getOrReturnCtx(e, n), p(n, {
          validation: "uuid",
          code: h.invalid_string,
          message: a.message
        }), s.dirty());
      else if (a.kind === "nanoid")
        ds.test(e.data) || (n = this._getOrReturnCtx(e, n), p(n, {
          validation: "nanoid",
          code: h.invalid_string,
          message: a.message
        }), s.dirty());
      else if (a.kind === "cuid")
        os.test(e.data) || (n = this._getOrReturnCtx(e, n), p(n, {
          validation: "cuid",
          code: h.invalid_string,
          message: a.message
        }), s.dirty());
      else if (a.kind === "cuid2")
        cs.test(e.data) || (n = this._getOrReturnCtx(e, n), p(n, {
          validation: "cuid2",
          code: h.invalid_string,
          message: a.message
        }), s.dirty());
      else if (a.kind === "ulid")
        ls.test(e.data) || (n = this._getOrReturnCtx(e, n), p(n, {
          validation: "ulid",
          code: h.invalid_string,
          message: a.message
        }), s.dirty());
      else if (a.kind === "url")
        try {
          new URL(e.data);
        } catch {
          n = this._getOrReturnCtx(e, n), p(n, {
            validation: "url",
            code: h.invalid_string,
            message: a.message
          }), s.dirty();
        }
      else a.kind === "regex" ? (a.regex.lastIndex = 0, a.regex.test(e.data) || (n = this._getOrReturnCtx(e, n), p(n, {
        validation: "regex",
        code: h.invalid_string,
        message: a.message
      }), s.dirty())) : a.kind === "trim" ? e.data = e.data.trim() : a.kind === "includes" ? e.data.includes(a.value, a.position) || (n = this._getOrReturnCtx(e, n), p(n, {
        code: h.invalid_string,
        validation: { includes: a.value, position: a.position },
        message: a.message
      }), s.dirty()) : a.kind === "toLowerCase" ? e.data = e.data.toLowerCase() : a.kind === "toUpperCase" ? e.data = e.data.toUpperCase() : a.kind === "startsWith" ? e.data.startsWith(a.value) || (n = this._getOrReturnCtx(e, n), p(n, {
        code: h.invalid_string,
        validation: { startsWith: a.value },
        message: a.message
      }), s.dirty()) : a.kind === "endsWith" ? e.data.endsWith(a.value) || (n = this._getOrReturnCtx(e, n), p(n, {
        code: h.invalid_string,
        validation: { endsWith: a.value },
        message: a.message
      }), s.dirty()) : a.kind === "datetime" ? Ss(a).test(e.data) || (n = this._getOrReturnCtx(e, n), p(n, {
        code: h.invalid_string,
        validation: "datetime",
        message: a.message
      }), s.dirty()) : a.kind === "date" ? xs.test(e.data) || (n = this._getOrReturnCtx(e, n), p(n, {
        code: h.invalid_string,
        validation: "date",
        message: a.message
      }), s.dirty()) : a.kind === "time" ? bs(a).test(e.data) || (n = this._getOrReturnCtx(e, n), p(n, {
        code: h.invalid_string,
        validation: "time",
        message: a.message
      }), s.dirty()) : a.kind === "duration" ? fs.test(e.data) || (n = this._getOrReturnCtx(e, n), p(n, {
        validation: "duration",
        code: h.invalid_string,
        message: a.message
      }), s.dirty()) : a.kind === "ip" ? As(e.data, a.version) || (n = this._getOrReturnCtx(e, n), p(n, {
        validation: "ip",
        code: h.invalid_string,
        message: a.message
      }), s.dirty()) : a.kind === "jwt" ? Rs(e.data, a.alg) || (n = this._getOrReturnCtx(e, n), p(n, {
        validation: "jwt",
        code: h.invalid_string,
        message: a.message
      }), s.dirty()) : a.kind === "cidr" ? Es(e.data, a.version) || (n = this._getOrReturnCtx(e, n), p(n, {
        validation: "cidr",
        code: h.invalid_string,
        message: a.message
      }), s.dirty()) : a.kind === "base64" ? ws.test(e.data) || (n = this._getOrReturnCtx(e, n), p(n, {
        validation: "base64",
        code: h.invalid_string,
        message: a.message
      }), s.dirty()) : a.kind === "base64url" ? ks.test(e.data) || (n = this._getOrReturnCtx(e, n), p(n, {
        validation: "base64url",
        code: h.invalid_string,
        message: a.message
      }), s.dirty()) : A.assertNever(a);
    return { status: s.value, value: e.data };
  }
  _regex(e, r, s) {
    return this.refinement((n) => e.test(n), {
      validation: r,
      code: h.invalid_string,
      ...y.errToObj(s)
    });
  }
  _addCheck(e) {
    return new re({
      ...this._def,
      checks: [...this._def.checks, e]
    });
  }
  email(e) {
    return this._addCheck({ kind: "email", ...y.errToObj(e) });
  }
  url(e) {
    return this._addCheck({ kind: "url", ...y.errToObj(e) });
  }
  emoji(e) {
    return this._addCheck({ kind: "emoji", ...y.errToObj(e) });
  }
  uuid(e) {
    return this._addCheck({ kind: "uuid", ...y.errToObj(e) });
  }
  nanoid(e) {
    return this._addCheck({ kind: "nanoid", ...y.errToObj(e) });
  }
  cuid(e) {
    return this._addCheck({ kind: "cuid", ...y.errToObj(e) });
  }
  cuid2(e) {
    return this._addCheck({ kind: "cuid2", ...y.errToObj(e) });
  }
  ulid(e) {
    return this._addCheck({ kind: "ulid", ...y.errToObj(e) });
  }
  base64(e) {
    return this._addCheck({ kind: "base64", ...y.errToObj(e) });
  }
  base64url(e) {
    return this._addCheck({
      kind: "base64url",
      ...y.errToObj(e)
    });
  }
  jwt(e) {
    return this._addCheck({ kind: "jwt", ...y.errToObj(e) });
  }
  ip(e) {
    return this._addCheck({ kind: "ip", ...y.errToObj(e) });
  }
  cidr(e) {
    return this._addCheck({ kind: "cidr", ...y.errToObj(e) });
  }
  datetime(e) {
    return typeof e == "string" ? this._addCheck({
      kind: "datetime",
      precision: null,
      offset: !1,
      local: !1,
      message: e
    }) : this._addCheck({
      kind: "datetime",
      precision: typeof (e == null ? void 0 : e.precision) > "u" ? null : e == null ? void 0 : e.precision,
      offset: (e == null ? void 0 : e.offset) ?? !1,
      local: (e == null ? void 0 : e.local) ?? !1,
      ...y.errToObj(e == null ? void 0 : e.message)
    });
  }
  date(e) {
    return this._addCheck({ kind: "date", message: e });
  }
  time(e) {
    return typeof e == "string" ? this._addCheck({
      kind: "time",
      precision: null,
      message: e
    }) : this._addCheck({
      kind: "time",
      precision: typeof (e == null ? void 0 : e.precision) > "u" ? null : e == null ? void 0 : e.precision,
      ...y.errToObj(e == null ? void 0 : e.message)
    });
  }
  duration(e) {
    return this._addCheck({ kind: "duration", ...y.errToObj(e) });
  }
  regex(e, r) {
    return this._addCheck({
      kind: "regex",
      regex: e,
      ...y.errToObj(r)
    });
  }
  includes(e, r) {
    return this._addCheck({
      kind: "includes",
      value: e,
      position: r == null ? void 0 : r.position,
      ...y.errToObj(r == null ? void 0 : r.message)
    });
  }
  startsWith(e, r) {
    return this._addCheck({
      kind: "startsWith",
      value: e,
      ...y.errToObj(r)
    });
  }
  endsWith(e, r) {
    return this._addCheck({
      kind: "endsWith",
      value: e,
      ...y.errToObj(r)
    });
  }
  min(e, r) {
    return this._addCheck({
      kind: "min",
      value: e,
      ...y.errToObj(r)
    });
  }
  max(e, r) {
    return this._addCheck({
      kind: "max",
      value: e,
      ...y.errToObj(r)
    });
  }
  length(e, r) {
    return this._addCheck({
      kind: "length",
      value: e,
      ...y.errToObj(r)
    });
  }
  /**
   * Equivalent to `.min(1)`
   */
  nonempty(e) {
    return this.min(1, y.errToObj(e));
  }
  trim() {
    return new re({
      ...this._def,
      checks: [...this._def.checks, { kind: "trim" }]
    });
  }
  toLowerCase() {
    return new re({
      ...this._def,
      checks: [...this._def.checks, { kind: "toLowerCase" }]
    });
  }
  toUpperCase() {
    return new re({
      ...this._def,
      checks: [...this._def.checks, { kind: "toUpperCase" }]
    });
  }
  get isDatetime() {
    return !!this._def.checks.find((e) => e.kind === "datetime");
  }
  get isDate() {
    return !!this._def.checks.find((e) => e.kind === "date");
  }
  get isTime() {
    return !!this._def.checks.find((e) => e.kind === "time");
  }
  get isDuration() {
    return !!this._def.checks.find((e) => e.kind === "duration");
  }
  get isEmail() {
    return !!this._def.checks.find((e) => e.kind === "email");
  }
  get isURL() {
    return !!this._def.checks.find((e) => e.kind === "url");
  }
  get isEmoji() {
    return !!this._def.checks.find((e) => e.kind === "emoji");
  }
  get isUUID() {
    return !!this._def.checks.find((e) => e.kind === "uuid");
  }
  get isNANOID() {
    return !!this._def.checks.find((e) => e.kind === "nanoid");
  }
  get isCUID() {
    return !!this._def.checks.find((e) => e.kind === "cuid");
  }
  get isCUID2() {
    return !!this._def.checks.find((e) => e.kind === "cuid2");
  }
  get isULID() {
    return !!this._def.checks.find((e) => e.kind === "ulid");
  }
  get isIP() {
    return !!this._def.checks.find((e) => e.kind === "ip");
  }
  get isCIDR() {
    return !!this._def.checks.find((e) => e.kind === "cidr");
  }
  get isBase64() {
    return !!this._def.checks.find((e) => e.kind === "base64");
  }
  get isBase64url() {
    return !!this._def.checks.find((e) => e.kind === "base64url");
  }
  get minLength() {
    let e = null;
    for (const r of this._def.checks)
      r.kind === "min" && (e === null || r.value > e) && (e = r.value);
    return e;
  }
  get maxLength() {
    let e = null;
    for (const r of this._def.checks)
      r.kind === "max" && (e === null || r.value < e) && (e = r.value);
    return e;
  }
}
re.create = (t) => new re({
  checks: [],
  typeName: k.ZodString,
  coerce: (t == null ? void 0 : t.coerce) ?? !1,
  ...b(t)
});
function Os(t, e) {
  const r = (t.toString().split(".")[1] || "").length, s = (e.toString().split(".")[1] || "").length, n = r > s ? r : s, a = Number.parseInt(t.toFixed(n).replace(".", "")), i = Number.parseInt(e.toFixed(n).replace(".", ""));
  return a % i / 10 ** n;
}
class Re extends S {
  constructor() {
    super(...arguments), this.min = this.gte, this.max = this.lte, this.step = this.multipleOf;
  }
  _parse(e) {
    if (this._def.coerce && (e.data = Number(e.data)), this._getType(e) !== m.number) {
      const a = this._getOrReturnCtx(e);
      return p(a, {
        code: h.invalid_type,
        expected: m.number,
        received: a.parsedType
      }), w;
    }
    let s;
    const n = new V();
    for (const a of this._def.checks)
      a.kind === "int" ? A.isInteger(e.data) || (s = this._getOrReturnCtx(e, s), p(s, {
        code: h.invalid_type,
        expected: "integer",
        received: "float",
        message: a.message
      }), n.dirty()) : a.kind === "min" ? (a.inclusive ? e.data < a.value : e.data <= a.value) && (s = this._getOrReturnCtx(e, s), p(s, {
        code: h.too_small,
        minimum: a.value,
        type: "number",
        inclusive: a.inclusive,
        exact: !1,
        message: a.message
      }), n.dirty()) : a.kind === "max" ? (a.inclusive ? e.data > a.value : e.data >= a.value) && (s = this._getOrReturnCtx(e, s), p(s, {
        code: h.too_big,
        maximum: a.value,
        type: "number",
        inclusive: a.inclusive,
        exact: !1,
        message: a.message
      }), n.dirty()) : a.kind === "multipleOf" ? Os(e.data, a.value) !== 0 && (s = this._getOrReturnCtx(e, s), p(s, {
        code: h.not_multiple_of,
        multipleOf: a.value,
        message: a.message
      }), n.dirty()) : a.kind === "finite" ? Number.isFinite(e.data) || (s = this._getOrReturnCtx(e, s), p(s, {
        code: h.not_finite,
        message: a.message
      }), n.dirty()) : A.assertNever(a);
    return { status: n.value, value: e.data };
  }
  gte(e, r) {
    return this.setLimit("min", e, !0, y.toString(r));
  }
  gt(e, r) {
    return this.setLimit("min", e, !1, y.toString(r));
  }
  lte(e, r) {
    return this.setLimit("max", e, !0, y.toString(r));
  }
  lt(e, r) {
    return this.setLimit("max", e, !1, y.toString(r));
  }
  setLimit(e, r, s, n) {
    return new Re({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind: e,
          value: r,
          inclusive: s,
          message: y.toString(n)
        }
      ]
    });
  }
  _addCheck(e) {
    return new Re({
      ...this._def,
      checks: [...this._def.checks, e]
    });
  }
  int(e) {
    return this._addCheck({
      kind: "int",
      message: y.toString(e)
    });
  }
  positive(e) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: !1,
      message: y.toString(e)
    });
  }
  negative(e) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: !1,
      message: y.toString(e)
    });
  }
  nonpositive(e) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: !0,
      message: y.toString(e)
    });
  }
  nonnegative(e) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: !0,
      message: y.toString(e)
    });
  }
  multipleOf(e, r) {
    return this._addCheck({
      kind: "multipleOf",
      value: e,
      message: y.toString(r)
    });
  }
  finite(e) {
    return this._addCheck({
      kind: "finite",
      message: y.toString(e)
    });
  }
  safe(e) {
    return this._addCheck({
      kind: "min",
      inclusive: !0,
      value: Number.MIN_SAFE_INTEGER,
      message: y.toString(e)
    })._addCheck({
      kind: "max",
      inclusive: !0,
      value: Number.MAX_SAFE_INTEGER,
      message: y.toString(e)
    });
  }
  get minValue() {
    let e = null;
    for (const r of this._def.checks)
      r.kind === "min" && (e === null || r.value > e) && (e = r.value);
    return e;
  }
  get maxValue() {
    let e = null;
    for (const r of this._def.checks)
      r.kind === "max" && (e === null || r.value < e) && (e = r.value);
    return e;
  }
  get isInt() {
    return !!this._def.checks.find((e) => e.kind === "int" || e.kind === "multipleOf" && A.isInteger(e.value));
  }
  get isFinite() {
    let e = null, r = null;
    for (const s of this._def.checks) {
      if (s.kind === "finite" || s.kind === "int" || s.kind === "multipleOf")
        return !0;
      s.kind === "min" ? (r === null || s.value > r) && (r = s.value) : s.kind === "max" && (e === null || s.value < e) && (e = s.value);
    }
    return Number.isFinite(r) && Number.isFinite(e);
  }
}
Re.create = (t) => new Re({
  checks: [],
  typeName: k.ZodNumber,
  coerce: (t == null ? void 0 : t.coerce) || !1,
  ...b(t)
});
class Ee extends S {
  constructor() {
    super(...arguments), this.min = this.gte, this.max = this.lte;
  }
  _parse(e) {
    if (this._def.coerce)
      try {
        e.data = BigInt(e.data);
      } catch {
        return this._getInvalidInput(e);
      }
    if (this._getType(e) !== m.bigint)
      return this._getInvalidInput(e);
    let s;
    const n = new V();
    for (const a of this._def.checks)
      a.kind === "min" ? (a.inclusive ? e.data < a.value : e.data <= a.value) && (s = this._getOrReturnCtx(e, s), p(s, {
        code: h.too_small,
        type: "bigint",
        minimum: a.value,
        inclusive: a.inclusive,
        message: a.message
      }), n.dirty()) : a.kind === "max" ? (a.inclusive ? e.data > a.value : e.data >= a.value) && (s = this._getOrReturnCtx(e, s), p(s, {
        code: h.too_big,
        type: "bigint",
        maximum: a.value,
        inclusive: a.inclusive,
        message: a.message
      }), n.dirty()) : a.kind === "multipleOf" ? e.data % a.value !== BigInt(0) && (s = this._getOrReturnCtx(e, s), p(s, {
        code: h.not_multiple_of,
        multipleOf: a.value,
        message: a.message
      }), n.dirty()) : A.assertNever(a);
    return { status: n.value, value: e.data };
  }
  _getInvalidInput(e) {
    const r = this._getOrReturnCtx(e);
    return p(r, {
      code: h.invalid_type,
      expected: m.bigint,
      received: r.parsedType
    }), w;
  }
  gte(e, r) {
    return this.setLimit("min", e, !0, y.toString(r));
  }
  gt(e, r) {
    return this.setLimit("min", e, !1, y.toString(r));
  }
  lte(e, r) {
    return this.setLimit("max", e, !0, y.toString(r));
  }
  lt(e, r) {
    return this.setLimit("max", e, !1, y.toString(r));
  }
  setLimit(e, r, s, n) {
    return new Ee({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind: e,
          value: r,
          inclusive: s,
          message: y.toString(n)
        }
      ]
    });
  }
  _addCheck(e) {
    return new Ee({
      ...this._def,
      checks: [...this._def.checks, e]
    });
  }
  positive(e) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: !1,
      message: y.toString(e)
    });
  }
  negative(e) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: !1,
      message: y.toString(e)
    });
  }
  nonpositive(e) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: !0,
      message: y.toString(e)
    });
  }
  nonnegative(e) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: !0,
      message: y.toString(e)
    });
  }
  multipleOf(e, r) {
    return this._addCheck({
      kind: "multipleOf",
      value: e,
      message: y.toString(r)
    });
  }
  get minValue() {
    let e = null;
    for (const r of this._def.checks)
      r.kind === "min" && (e === null || r.value > e) && (e = r.value);
    return e;
  }
  get maxValue() {
    let e = null;
    for (const r of this._def.checks)
      r.kind === "max" && (e === null || r.value < e) && (e = r.value);
    return e;
  }
}
Ee.create = (t) => new Ee({
  checks: [],
  typeName: k.ZodBigInt,
  coerce: (t == null ? void 0 : t.coerce) ?? !1,
  ...b(t)
});
class dt extends S {
  _parse(e) {
    if (this._def.coerce && (e.data = !!e.data), this._getType(e) !== m.boolean) {
      const s = this._getOrReturnCtx(e);
      return p(s, {
        code: h.invalid_type,
        expected: m.boolean,
        received: s.parsedType
      }), w;
    }
    return z(e.data);
  }
}
dt.create = (t) => new dt({
  typeName: k.ZodBoolean,
  coerce: (t == null ? void 0 : t.coerce) || !1,
  ...b(t)
});
class Ue extends S {
  _parse(e) {
    if (this._def.coerce && (e.data = new Date(e.data)), this._getType(e) !== m.date) {
      const a = this._getOrReturnCtx(e);
      return p(a, {
        code: h.invalid_type,
        expected: m.date,
        received: a.parsedType
      }), w;
    }
    if (Number.isNaN(e.data.getTime())) {
      const a = this._getOrReturnCtx(e);
      return p(a, {
        code: h.invalid_date
      }), w;
    }
    const s = new V();
    let n;
    for (const a of this._def.checks)
      a.kind === "min" ? e.data.getTime() < a.value && (n = this._getOrReturnCtx(e, n), p(n, {
        code: h.too_small,
        message: a.message,
        inclusive: !0,
        exact: !1,
        minimum: a.value,
        type: "date"
      }), s.dirty()) : a.kind === "max" ? e.data.getTime() > a.value && (n = this._getOrReturnCtx(e, n), p(n, {
        code: h.too_big,
        message: a.message,
        inclusive: !0,
        exact: !1,
        maximum: a.value,
        type: "date"
      }), s.dirty()) : A.assertNever(a);
    return {
      status: s.value,
      value: new Date(e.data.getTime())
    };
  }
  _addCheck(e) {
    return new Ue({
      ...this._def,
      checks: [...this._def.checks, e]
    });
  }
  min(e, r) {
    return this._addCheck({
      kind: "min",
      value: e.getTime(),
      message: y.toString(r)
    });
  }
  max(e, r) {
    return this._addCheck({
      kind: "max",
      value: e.getTime(),
      message: y.toString(r)
    });
  }
  get minDate() {
    let e = null;
    for (const r of this._def.checks)
      r.kind === "min" && (e === null || r.value > e) && (e = r.value);
    return e != null ? new Date(e) : null;
  }
  get maxDate() {
    let e = null;
    for (const r of this._def.checks)
      r.kind === "max" && (e === null || r.value < e) && (e = r.value);
    return e != null ? new Date(e) : null;
  }
}
Ue.create = (t) => new Ue({
  checks: [],
  coerce: (t == null ? void 0 : t.coerce) || !1,
  typeName: k.ZodDate,
  ...b(t)
});
class Yt extends S {
  _parse(e) {
    if (this._getType(e) !== m.symbol) {
      const s = this._getOrReturnCtx(e);
      return p(s, {
        code: h.invalid_type,
        expected: m.symbol,
        received: s.parsedType
      }), w;
    }
    return z(e.data);
  }
}
Yt.create = (t) => new Yt({
  typeName: k.ZodSymbol,
  ...b(t)
});
class Qt extends S {
  _parse(e) {
    if (this._getType(e) !== m.undefined) {
      const s = this._getOrReturnCtx(e);
      return p(s, {
        code: h.invalid_type,
        expected: m.undefined,
        received: s.parsedType
      }), w;
    }
    return z(e.data);
  }
}
Qt.create = (t) => new Qt({
  typeName: k.ZodUndefined,
  ...b(t)
});
class Xt extends S {
  _parse(e) {
    if (this._getType(e) !== m.null) {
      const s = this._getOrReturnCtx(e);
      return p(s, {
        code: h.invalid_type,
        expected: m.null,
        received: s.parsedType
      }), w;
    }
    return z(e.data);
  }
}
Xt.create = (t) => new Xt({
  typeName: k.ZodNull,
  ...b(t)
});
class er extends S {
  constructor() {
    super(...arguments), this._any = !0;
  }
  _parse(e) {
    return z(e.data);
  }
}
er.create = (t) => new er({
  typeName: k.ZodAny,
  ...b(t)
});
class jt extends S {
  constructor() {
    super(...arguments), this._unknown = !0;
  }
  _parse(e) {
    return z(e.data);
  }
}
jt.create = (t) => new jt({
  typeName: k.ZodUnknown,
  ...b(t)
});
class ge extends S {
  _parse(e) {
    const r = this._getOrReturnCtx(e);
    return p(r, {
      code: h.invalid_type,
      expected: m.never,
      received: r.parsedType
    }), w;
  }
}
ge.create = (t) => new ge({
  typeName: k.ZodNever,
  ...b(t)
});
class tr extends S {
  _parse(e) {
    if (this._getType(e) !== m.undefined) {
      const s = this._getOrReturnCtx(e);
      return p(s, {
        code: h.invalid_type,
        expected: m.void,
        received: s.parsedType
      }), w;
    }
    return z(e.data);
  }
}
tr.create = (t) => new tr({
  typeName: k.ZodVoid,
  ...b(t)
});
class J extends S {
  _parse(e) {
    const { ctx: r, status: s } = this._processInputParams(e), n = this._def;
    if (r.parsedType !== m.array)
      return p(r, {
        code: h.invalid_type,
        expected: m.array,
        received: r.parsedType
      }), w;
    if (n.exactLength !== null) {
      const i = r.data.length > n.exactLength.value, o = r.data.length < n.exactLength.value;
      (i || o) && (p(r, {
        code: i ? h.too_big : h.too_small,
        minimum: o ? n.exactLength.value : void 0,
        maximum: i ? n.exactLength.value : void 0,
        type: "array",
        inclusive: !0,
        exact: !0,
        message: n.exactLength.message
      }), s.dirty());
    }
    if (n.minLength !== null && r.data.length < n.minLength.value && (p(r, {
      code: h.too_small,
      minimum: n.minLength.value,
      type: "array",
      inclusive: !0,
      exact: !1,
      message: n.minLength.message
    }), s.dirty()), n.maxLength !== null && r.data.length > n.maxLength.value && (p(r, {
      code: h.too_big,
      maximum: n.maxLength.value,
      type: "array",
      inclusive: !0,
      exact: !1,
      message: n.maxLength.message
    }), s.dirty()), r.common.async)
      return Promise.all([...r.data].map((i, o) => n.type._parseAsync(new ye(r, i, r.path, o)))).then((i) => V.mergeArray(s, i));
    const a = [...r.data].map((i, o) => n.type._parseSync(new ye(r, i, r.path, o)));
    return V.mergeArray(s, a);
  }
  get element() {
    return this._def.type;
  }
  min(e, r) {
    return new J({
      ...this._def,
      minLength: { value: e, message: y.toString(r) }
    });
  }
  max(e, r) {
    return new J({
      ...this._def,
      maxLength: { value: e, message: y.toString(r) }
    });
  }
  length(e, r) {
    return new J({
      ...this._def,
      exactLength: { value: e, message: y.toString(r) }
    });
  }
  nonempty(e) {
    return this.min(1, e);
  }
}
J.create = (t, e) => new J({
  type: t,
  minLength: null,
  maxLength: null,
  exactLength: null,
  typeName: k.ZodArray,
  ...b(e)
});
function Ce(t) {
  if (t instanceof j) {
    const e = {};
    for (const r in t.shape) {
      const s = t.shape[r];
      e[r] = me.create(Ce(s));
    }
    return new j({
      ...t._def,
      shape: () => e
    });
  } else return t instanceof J ? new J({
    ...t._def,
    type: Ce(t.element)
  }) : t instanceof me ? me.create(Ce(t.unwrap())) : t instanceof Be ? Be.create(Ce(t.unwrap())) : t instanceof Oe ? Oe.create(t.items.map((e) => Ce(e))) : t;
}
class j extends S {
  constructor() {
    super(...arguments), this._cached = null, this.nonstrict = this.passthrough, this.augment = this.extend;
  }
  _getCached() {
    if (this._cached !== null)
      return this._cached;
    const e = this._def.shape(), r = A.objectKeys(e);
    return this._cached = { shape: e, keys: r }, this._cached;
  }
  _parse(e) {
    if (this._getType(e) !== m.object) {
      const l = this._getOrReturnCtx(e);
      return p(l, {
        code: h.invalid_type,
        expected: m.object,
        received: l.parsedType
      }), w;
    }
    const { status: s, ctx: n } = this._processInputParams(e), { shape: a, keys: i } = this._getCached(), o = [];
    if (!(this._def.catchall instanceof ge && this._def.unknownKeys === "strip"))
      for (const l in n.data)
        i.includes(l) || o.push(l);
    const c = [];
    for (const l of i) {
      const u = a[l], f = n.data[l];
      c.push({
        key: { status: "valid", value: l },
        value: u._parse(new ye(n, f, n.path, l)),
        alwaysSet: l in n.data
      });
    }
    if (this._def.catchall instanceof ge) {
      const l = this._def.unknownKeys;
      if (l === "passthrough")
        for (const u of o)
          c.push({
            key: { status: "valid", value: u },
            value: { status: "valid", value: n.data[u] }
          });
      else if (l === "strict")
        o.length > 0 && (p(n, {
          code: h.unrecognized_keys,
          keys: o
        }), s.dirty());
      else if (l !== "strip") throw new Error("Internal ZodObject error: invalid unknownKeys value.");
    } else {
      const l = this._def.catchall;
      for (const u of o) {
        const f = n.data[u];
        c.push({
          key: { status: "valid", value: u },
          value: l._parse(
            new ye(n, f, n.path, u)
            //, ctx.child(key), value, getParsedType(value)
          ),
          alwaysSet: u in n.data
        });
      }
    }
    return n.common.async ? Promise.resolve().then(async () => {
      const l = [];
      for (const u of c) {
        const f = await u.key, g = await u.value;
        l.push({
          key: f,
          value: g,
          alwaysSet: u.alwaysSet
        });
      }
      return l;
    }).then((l) => V.mergeObjectSync(s, l)) : V.mergeObjectSync(s, c);
  }
  get shape() {
    return this._def.shape();
  }
  strict(e) {
    return y.errToObj, new j({
      ...this._def,
      unknownKeys: "strict",
      ...e !== void 0 ? {
        errorMap: (r, s) => {
          var a, i;
          const n = ((i = (a = this._def).errorMap) == null ? void 0 : i.call(a, r, s).message) ?? s.defaultError;
          return r.code === "unrecognized_keys" ? {
            message: y.errToObj(e).message ?? n
          } : {
            message: n
          };
        }
      } : {}
    });
  }
  strip() {
    return new j({
      ...this._def,
      unknownKeys: "strip"
    });
  }
  passthrough() {
    return new j({
      ...this._def,
      unknownKeys: "passthrough"
    });
  }
  // const AugmentFactory =
  //   <Def extends ZodObjectDef>(def: Def) =>
  //   <Augmentation extends ZodRawShape>(
  //     augmentation: Augmentation
  //   ): ZodObject<
  //     extendShape<ReturnType<Def["shape"]>, Augmentation>,
  //     Def["unknownKeys"],
  //     Def["catchall"]
  //   > => {
  //     return new ZodObject({
  //       ...def,
  //       shape: () => ({
  //         ...def.shape(),
  //         ...augmentation,
  //       }),
  //     }) as any;
  //   };
  extend(e) {
    return new j({
      ...this._def,
      shape: () => ({
        ...this._def.shape(),
        ...e
      })
    });
  }
  /**
   * Prior to zod@1.0.12 there was a bug in the
   * inferred type of merged objects. Please
   * upgrade if you are experiencing issues.
   */
  merge(e) {
    return new j({
      unknownKeys: e._def.unknownKeys,
      catchall: e._def.catchall,
      shape: () => ({
        ...this._def.shape(),
        ...e._def.shape()
      }),
      typeName: k.ZodObject
    });
  }
  // merge<
  //   Incoming extends AnyZodObject,
  //   Augmentation extends Incoming["shape"],
  //   NewOutput extends {
  //     [k in keyof Augmentation | keyof Output]: k extends keyof Augmentation
  //       ? Augmentation[k]["_output"]
  //       : k extends keyof Output
  //       ? Output[k]
  //       : never;
  //   },
  //   NewInput extends {
  //     [k in keyof Augmentation | keyof Input]: k extends keyof Augmentation
  //       ? Augmentation[k]["_input"]
  //       : k extends keyof Input
  //       ? Input[k]
  //       : never;
  //   }
  // >(
  //   merging: Incoming
  // ): ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"],
  //   NewOutput,
  //   NewInput
  // > {
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  setKey(e, r) {
    return this.augment({ [e]: r });
  }
  // merge<Incoming extends AnyZodObject>(
  //   merging: Incoming
  // ): //ZodObject<T & Incoming["_shape"], UnknownKeys, Catchall> = (merging) => {
  // ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"]
  // > {
  //   // const mergedShape = objectUtil.mergeShapes(
  //   //   this._def.shape(),
  //   //   merging._def.shape()
  //   // );
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  catchall(e) {
    return new j({
      ...this._def,
      catchall: e
    });
  }
  pick(e) {
    const r = {};
    for (const s of A.objectKeys(e))
      e[s] && this.shape[s] && (r[s] = this.shape[s]);
    return new j({
      ...this._def,
      shape: () => r
    });
  }
  omit(e) {
    const r = {};
    for (const s of A.objectKeys(this.shape))
      e[s] || (r[s] = this.shape[s]);
    return new j({
      ...this._def,
      shape: () => r
    });
  }
  /**
   * @deprecated
   */
  deepPartial() {
    return Ce(this);
  }
  partial(e) {
    const r = {};
    for (const s of A.objectKeys(this.shape)) {
      const n = this.shape[s];
      e && !e[s] ? r[s] = n : r[s] = n.optional();
    }
    return new j({
      ...this._def,
      shape: () => r
    });
  }
  required(e) {
    const r = {};
    for (const s of A.objectKeys(this.shape))
      if (e && !e[s])
        r[s] = this.shape[s];
      else {
        let a = this.shape[s];
        for (; a instanceof me; )
          a = a._def.innerType;
        r[s] = a;
      }
    return new j({
      ...this._def,
      shape: () => r
    });
  }
  keyof() {
    return Er(A.objectKeys(this.shape));
  }
}
j.create = (t, e) => new j({
  shape: () => t,
  unknownKeys: "strip",
  catchall: ge.create(),
  typeName: k.ZodObject,
  ...b(e)
});
j.strictCreate = (t, e) => new j({
  shape: () => t,
  unknownKeys: "strict",
  catchall: ge.create(),
  typeName: k.ZodObject,
  ...b(e)
});
j.lazycreate = (t, e) => new j({
  shape: t,
  unknownKeys: "strip",
  catchall: ge.create(),
  typeName: k.ZodObject,
  ...b(e)
});
class ht extends S {
  _parse(e) {
    const { ctx: r } = this._processInputParams(e), s = this._def.options;
    function n(a) {
      for (const o of a)
        if (o.result.status === "valid")
          return o.result;
      for (const o of a)
        if (o.result.status === "dirty")
          return r.common.issues.push(...o.ctx.common.issues), o.result;
      const i = a.map((o) => new se(o.ctx.common.issues));
      return p(r, {
        code: h.invalid_union,
        unionErrors: i
      }), w;
    }
    if (r.common.async)
      return Promise.all(s.map(async (a) => {
        const i = {
          ...r,
          common: {
            ...r.common,
            issues: []
          },
          parent: null
        };
        return {
          result: await a._parseAsync({
            data: r.data,
            path: r.path,
            parent: i
          }),
          ctx: i
        };
      })).then(n);
    {
      let a;
      const i = [];
      for (const c of s) {
        const l = {
          ...r,
          common: {
            ...r.common,
            issues: []
          },
          parent: null
        }, u = c._parseSync({
          data: r.data,
          path: r.path,
          parent: l
        });
        if (u.status === "valid")
          return u;
        u.status === "dirty" && !a && (a = { result: u, ctx: l }), l.common.issues.length && i.push(l.common.issues);
      }
      if (a)
        return r.common.issues.push(...a.ctx.common.issues), a.result;
      const o = i.map((c) => new se(c));
      return p(r, {
        code: h.invalid_union,
        unionErrors: o
      }), w;
    }
  }
  get options() {
    return this._def.options;
  }
}
ht.create = (t, e) => new ht({
  options: t,
  typeName: k.ZodUnion,
  ...b(e)
});
function Ct(t, e) {
  const r = ce(t), s = ce(e);
  if (t === e)
    return { valid: !0, data: t };
  if (r === m.object && s === m.object) {
    const n = A.objectKeys(e), a = A.objectKeys(t).filter((o) => n.indexOf(o) !== -1), i = { ...t, ...e };
    for (const o of a) {
      const c = Ct(t[o], e[o]);
      if (!c.valid)
        return { valid: !1 };
      i[o] = c.data;
    }
    return { valid: !0, data: i };
  } else if (r === m.array && s === m.array) {
    if (t.length !== e.length)
      return { valid: !1 };
    const n = [];
    for (let a = 0; a < t.length; a++) {
      const i = t[a], o = e[a], c = Ct(i, o);
      if (!c.valid)
        return { valid: !1 };
      n.push(c.data);
    }
    return { valid: !0, data: n };
  } else return r === m.date && s === m.date && +t == +e ? { valid: !0, data: t } : { valid: !1 };
}
class ft extends S {
  _parse(e) {
    const { status: r, ctx: s } = this._processInputParams(e), n = (a, i) => {
      if (Wt(a) || Wt(i))
        return w;
      const o = Ct(a.value, i.value);
      return o.valid ? ((Jt(a) || Jt(i)) && r.dirty(), { status: r.value, value: o.data }) : (p(s, {
        code: h.invalid_intersection_types
      }), w);
    };
    return s.common.async ? Promise.all([
      this._def.left._parseAsync({
        data: s.data,
        path: s.path,
        parent: s
      }),
      this._def.right._parseAsync({
        data: s.data,
        path: s.path,
        parent: s
      })
    ]).then(([a, i]) => n(a, i)) : n(this._def.left._parseSync({
      data: s.data,
      path: s.path,
      parent: s
    }), this._def.right._parseSync({
      data: s.data,
      path: s.path,
      parent: s
    }));
  }
}
ft.create = (t, e, r) => new ft({
  left: t,
  right: e,
  typeName: k.ZodIntersection,
  ...b(r)
});
class Oe extends S {
  _parse(e) {
    const { status: r, ctx: s } = this._processInputParams(e);
    if (s.parsedType !== m.array)
      return p(s, {
        code: h.invalid_type,
        expected: m.array,
        received: s.parsedType
      }), w;
    if (s.data.length < this._def.items.length)
      return p(s, {
        code: h.too_small,
        minimum: this._def.items.length,
        inclusive: !0,
        exact: !1,
        type: "array"
      }), w;
    !this._def.rest && s.data.length > this._def.items.length && (p(s, {
      code: h.too_big,
      maximum: this._def.items.length,
      inclusive: !0,
      exact: !1,
      type: "array"
    }), r.dirty());
    const a = [...s.data].map((i, o) => {
      const c = this._def.items[o] || this._def.rest;
      return c ? c._parse(new ye(s, i, s.path, o)) : null;
    }).filter((i) => !!i);
    return s.common.async ? Promise.all(a).then((i) => V.mergeArray(r, i)) : V.mergeArray(r, a);
  }
  get items() {
    return this._def.items;
  }
  rest(e) {
    return new Oe({
      ...this._def,
      rest: e
    });
  }
}
Oe.create = (t, e) => {
  if (!Array.isArray(t))
    throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
  return new Oe({
    items: t,
    typeName: k.ZodTuple,
    rest: null,
    ...b(e)
  });
};
class rr extends S {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(e) {
    const { status: r, ctx: s } = this._processInputParams(e);
    if (s.parsedType !== m.map)
      return p(s, {
        code: h.invalid_type,
        expected: m.map,
        received: s.parsedType
      }), w;
    const n = this._def.keyType, a = this._def.valueType, i = [...s.data.entries()].map(([o, c], l) => ({
      key: n._parse(new ye(s, o, s.path, [l, "key"])),
      value: a._parse(new ye(s, c, s.path, [l, "value"]))
    }));
    if (s.common.async) {
      const o = /* @__PURE__ */ new Map();
      return Promise.resolve().then(async () => {
        for (const c of i) {
          const l = await c.key, u = await c.value;
          if (l.status === "aborted" || u.status === "aborted")
            return w;
          (l.status === "dirty" || u.status === "dirty") && r.dirty(), o.set(l.value, u.value);
        }
        return { status: r.value, value: o };
      });
    } else {
      const o = /* @__PURE__ */ new Map();
      for (const c of i) {
        const l = c.key, u = c.value;
        if (l.status === "aborted" || u.status === "aborted")
          return w;
        (l.status === "dirty" || u.status === "dirty") && r.dirty(), o.set(l.value, u.value);
      }
      return { status: r.value, value: o };
    }
  }
}
rr.create = (t, e, r) => new rr({
  valueType: e,
  keyType: t,
  typeName: k.ZodMap,
  ...b(r)
});
class Qe extends S {
  _parse(e) {
    const { status: r, ctx: s } = this._processInputParams(e);
    if (s.parsedType !== m.set)
      return p(s, {
        code: h.invalid_type,
        expected: m.set,
        received: s.parsedType
      }), w;
    const n = this._def;
    n.minSize !== null && s.data.size < n.minSize.value && (p(s, {
      code: h.too_small,
      minimum: n.minSize.value,
      type: "set",
      inclusive: !0,
      exact: !1,
      message: n.minSize.message
    }), r.dirty()), n.maxSize !== null && s.data.size > n.maxSize.value && (p(s, {
      code: h.too_big,
      maximum: n.maxSize.value,
      type: "set",
      inclusive: !0,
      exact: !1,
      message: n.maxSize.message
    }), r.dirty());
    const a = this._def.valueType;
    function i(c) {
      const l = /* @__PURE__ */ new Set();
      for (const u of c) {
        if (u.status === "aborted")
          return w;
        u.status === "dirty" && r.dirty(), l.add(u.value);
      }
      return { status: r.value, value: l };
    }
    const o = [...s.data.values()].map((c, l) => a._parse(new ye(s, c, s.path, l)));
    return s.common.async ? Promise.all(o).then((c) => i(c)) : i(o);
  }
  min(e, r) {
    return new Qe({
      ...this._def,
      minSize: { value: e, message: y.toString(r) }
    });
  }
  max(e, r) {
    return new Qe({
      ...this._def,
      maxSize: { value: e, message: y.toString(r) }
    });
  }
  size(e, r) {
    return this.min(e, r).max(e, r);
  }
  nonempty(e) {
    return this.min(1, e);
  }
}
Qe.create = (t, e) => new Qe({
  valueType: t,
  minSize: null,
  maxSize: null,
  typeName: k.ZodSet,
  ...b(e)
});
class sr extends S {
  get schema() {
    return this._def.getter();
  }
  _parse(e) {
    const { ctx: r } = this._processInputParams(e);
    return this._def.getter()._parse({ data: r.data, path: r.path, parent: r });
  }
}
sr.create = (t, e) => new sr({
  getter: t,
  typeName: k.ZodLazy,
  ...b(e)
});
class nr extends S {
  _parse(e) {
    if (e.data !== this._def.value) {
      const r = this._getOrReturnCtx(e);
      return p(r, {
        received: r.data,
        code: h.invalid_literal,
        expected: this._def.value
      }), w;
    }
    return { status: "valid", value: e.data };
  }
  get value() {
    return this._def.value;
  }
}
nr.create = (t, e) => new nr({
  value: t,
  typeName: k.ZodLiteral,
  ...b(e)
});
function Er(t, e) {
  return new ze({
    values: t,
    typeName: k.ZodEnum,
    ...b(e)
  });
}
class ze extends S {
  _parse(e) {
    if (typeof e.data != "string") {
      const r = this._getOrReturnCtx(e), s = this._def.values;
      return p(r, {
        expected: A.joinValues(s),
        received: r.parsedType,
        code: h.invalid_type
      }), w;
    }
    if (this._cache || (this._cache = new Set(this._def.values)), !this._cache.has(e.data)) {
      const r = this._getOrReturnCtx(e), s = this._def.values;
      return p(r, {
        received: r.data,
        code: h.invalid_enum_value,
        options: s
      }), w;
    }
    return z(e.data);
  }
  get options() {
    return this._def.values;
  }
  get enum() {
    const e = {};
    for (const r of this._def.values)
      e[r] = r;
    return e;
  }
  get Values() {
    const e = {};
    for (const r of this._def.values)
      e[r] = r;
    return e;
  }
  get Enum() {
    const e = {};
    for (const r of this._def.values)
      e[r] = r;
    return e;
  }
  extract(e, r = this._def) {
    return ze.create(e, {
      ...this._def,
      ...r
    });
  }
  exclude(e, r = this._def) {
    return ze.create(this.options.filter((s) => !e.includes(s)), {
      ...this._def,
      ...r
    });
  }
}
ze.create = Er;
class ar extends S {
  _parse(e) {
    const r = A.getValidEnumValues(this._def.values), s = this._getOrReturnCtx(e);
    if (s.parsedType !== m.string && s.parsedType !== m.number) {
      const n = A.objectValues(r);
      return p(s, {
        expected: A.joinValues(n),
        received: s.parsedType,
        code: h.invalid_type
      }), w;
    }
    if (this._cache || (this._cache = new Set(A.getValidEnumValues(this._def.values))), !this._cache.has(e.data)) {
      const n = A.objectValues(r);
      return p(s, {
        received: s.data,
        code: h.invalid_enum_value,
        options: n
      }), w;
    }
    return z(e.data);
  }
  get enum() {
    return this._def.values;
  }
}
ar.create = (t, e) => new ar({
  values: t,
  typeName: k.ZodNativeEnum,
  ...b(e)
});
class pt extends S {
  unwrap() {
    return this._def.type;
  }
  _parse(e) {
    const { ctx: r } = this._processInputParams(e);
    if (r.parsedType !== m.promise && r.common.async === !1)
      return p(r, {
        code: h.invalid_type,
        expected: m.promise,
        received: r.parsedType
      }), w;
    const s = r.parsedType === m.promise ? r.data : Promise.resolve(r.data);
    return z(s.then((n) => this._def.type.parseAsync(n, {
      path: r.path,
      errorMap: r.common.contextualErrorMap
    })));
  }
}
pt.create = (t, e) => new pt({
  type: t,
  typeName: k.ZodPromise,
  ...b(e)
});
class qe extends S {
  innerType() {
    return this._def.schema;
  }
  sourceType() {
    return this._def.schema._def.typeName === k.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
  }
  _parse(e) {
    const { status: r, ctx: s } = this._processInputParams(e), n = this._def.effect || null, a = {
      addIssue: (i) => {
        p(s, i), i.fatal ? r.abort() : r.dirty();
      },
      get path() {
        return s.path;
      }
    };
    if (a.addIssue = a.addIssue.bind(a), n.type === "preprocess") {
      const i = n.transform(s.data, a);
      if (s.common.async)
        return Promise.resolve(i).then(async (o) => {
          if (r.value === "aborted")
            return w;
          const c = await this._def.schema._parseAsync({
            data: o,
            path: s.path,
            parent: s
          });
          return c.status === "aborted" ? w : c.status === "dirty" || r.value === "dirty" ? Je(c.value) : c;
        });
      {
        if (r.value === "aborted")
          return w;
        const o = this._def.schema._parseSync({
          data: i,
          path: s.path,
          parent: s
        });
        return o.status === "aborted" ? w : o.status === "dirty" || r.value === "dirty" ? Je(o.value) : o;
      }
    }
    if (n.type === "refinement") {
      const i = (o) => {
        const c = n.refinement(o, a);
        if (s.common.async)
          return Promise.resolve(c);
        if (c instanceof Promise)
          throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
        return o;
      };
      if (s.common.async === !1) {
        const o = this._def.schema._parseSync({
          data: s.data,
          path: s.path,
          parent: s
        });
        return o.status === "aborted" ? w : (o.status === "dirty" && r.dirty(), i(o.value), { status: r.value, value: o.value });
      } else
        return this._def.schema._parseAsync({ data: s.data, path: s.path, parent: s }).then((o) => o.status === "aborted" ? w : (o.status === "dirty" && r.dirty(), i(o.value).then(() => ({ status: r.value, value: o.value }))));
    }
    if (n.type === "transform")
      if (s.common.async === !1) {
        const i = this._def.schema._parseSync({
          data: s.data,
          path: s.path,
          parent: s
        });
        if (!Ve(i))
          return w;
        const o = n.transform(i.value, a);
        if (o instanceof Promise)
          throw new Error("Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.");
        return { status: r.value, value: o };
      } else
        return this._def.schema._parseAsync({ data: s.data, path: s.path, parent: s }).then((i) => Ve(i) ? Promise.resolve(n.transform(i.value, a)).then((o) => ({
          status: r.value,
          value: o
        })) : w);
    A.assertNever(n);
  }
}
qe.create = (t, e, r) => new qe({
  schema: t,
  typeName: k.ZodEffects,
  effect: e,
  ...b(r)
});
qe.createWithPreprocess = (t, e, r) => new qe({
  schema: e,
  effect: { type: "preprocess", transform: t },
  typeName: k.ZodEffects,
  ...b(r)
});
class me extends S {
  _parse(e) {
    return this._getType(e) === m.undefined ? z(void 0) : this._def.innerType._parse(e);
  }
  unwrap() {
    return this._def.innerType;
  }
}
me.create = (t, e) => new me({
  innerType: t,
  typeName: k.ZodOptional,
  ...b(e)
});
class Be extends S {
  _parse(e) {
    return this._getType(e) === m.null ? z(null) : this._def.innerType._parse(e);
  }
  unwrap() {
    return this._def.innerType;
  }
}
Be.create = (t, e) => new Be({
  innerType: t,
  typeName: k.ZodNullable,
  ...b(e)
});
class Nt extends S {
  _parse(e) {
    const { ctx: r } = this._processInputParams(e);
    let s = r.data;
    return r.parsedType === m.undefined && (s = this._def.defaultValue()), this._def.innerType._parse({
      data: s,
      path: r.path,
      parent: r
    });
  }
  removeDefault() {
    return this._def.innerType;
  }
}
Nt.create = (t, e) => new Nt({
  innerType: t,
  typeName: k.ZodDefault,
  defaultValue: typeof e.default == "function" ? e.default : () => e.default,
  ...b(e)
});
class It extends S {
  _parse(e) {
    const { ctx: r } = this._processInputParams(e), s = {
      ...r,
      common: {
        ...r.common,
        issues: []
      }
    }, n = this._def.innerType._parse({
      data: s.data,
      path: s.path,
      parent: {
        ...s
      }
    });
    return ut(n) ? n.then((a) => ({
      status: "valid",
      value: a.status === "valid" ? a.value : this._def.catchValue({
        get error() {
          return new se(s.common.issues);
        },
        input: s.data
      })
    })) : {
      status: "valid",
      value: n.status === "valid" ? n.value : this._def.catchValue({
        get error() {
          return new se(s.common.issues);
        },
        input: s.data
      })
    };
  }
  removeCatch() {
    return this._def.innerType;
  }
}
It.create = (t, e) => new It({
  innerType: t,
  typeName: k.ZodCatch,
  catchValue: typeof e.catch == "function" ? e.catch : () => e.catch,
  ...b(e)
});
class ir extends S {
  _parse(e) {
    if (this._getType(e) !== m.nan) {
      const s = this._getOrReturnCtx(e);
      return p(s, {
        code: h.invalid_type,
        expected: m.nan,
        received: s.parsedType
      }), w;
    }
    return { status: "valid", value: e.data };
  }
}
ir.create = (t) => new ir({
  typeName: k.ZodNaN,
  ...b(t)
});
class Ts extends S {
  _parse(e) {
    const { ctx: r } = this._processInputParams(e), s = r.data;
    return this._def.type._parse({
      data: s,
      path: r.path,
      parent: r
    });
  }
  unwrap() {
    return this._def.type;
  }
}
class Zt extends S {
  _parse(e) {
    const { status: r, ctx: s } = this._processInputParams(e);
    if (s.common.async)
      return (async () => {
        const a = await this._def.in._parseAsync({
          data: s.data,
          path: s.path,
          parent: s
        });
        return a.status === "aborted" ? w : a.status === "dirty" ? (r.dirty(), Je(a.value)) : this._def.out._parseAsync({
          data: a.value,
          path: s.path,
          parent: s
        });
      })();
    {
      const n = this._def.in._parseSync({
        data: s.data,
        path: s.path,
        parent: s
      });
      return n.status === "aborted" ? w : n.status === "dirty" ? (r.dirty(), {
        status: "dirty",
        value: n.value
      }) : this._def.out._parseSync({
        data: n.value,
        path: s.path,
        parent: s
      });
    }
  }
  static create(e, r) {
    return new Zt({
      in: e,
      out: r,
      typeName: k.ZodPipeline
    });
  }
}
class Pt extends S {
  _parse(e) {
    const r = this._def.innerType._parse(e), s = (n) => (Ve(n) && (n.value = Object.freeze(n.value)), n);
    return ut(r) ? r.then((n) => s(n)) : s(r);
  }
  unwrap() {
    return this._def.innerType;
  }
}
Pt.create = (t, e) => new Pt({
  innerType: t,
  typeName: k.ZodReadonly,
  ...b(e)
});
var k;
(function(t) {
  t.ZodString = "ZodString", t.ZodNumber = "ZodNumber", t.ZodNaN = "ZodNaN", t.ZodBigInt = "ZodBigInt", t.ZodBoolean = "ZodBoolean", t.ZodDate = "ZodDate", t.ZodSymbol = "ZodSymbol", t.ZodUndefined = "ZodUndefined", t.ZodNull = "ZodNull", t.ZodAny = "ZodAny", t.ZodUnknown = "ZodUnknown", t.ZodNever = "ZodNever", t.ZodVoid = "ZodVoid", t.ZodArray = "ZodArray", t.ZodObject = "ZodObject", t.ZodUnion = "ZodUnion", t.ZodDiscriminatedUnion = "ZodDiscriminatedUnion", t.ZodIntersection = "ZodIntersection", t.ZodTuple = "ZodTuple", t.ZodRecord = "ZodRecord", t.ZodMap = "ZodMap", t.ZodSet = "ZodSet", t.ZodFunction = "ZodFunction", t.ZodLazy = "ZodLazy", t.ZodLiteral = "ZodLiteral", t.ZodEnum = "ZodEnum", t.ZodEffects = "ZodEffects", t.ZodNativeEnum = "ZodNativeEnum", t.ZodOptional = "ZodOptional", t.ZodNullable = "ZodNullable", t.ZodDefault = "ZodDefault", t.ZodCatch = "ZodCatch", t.ZodPromise = "ZodPromise", t.ZodBranded = "ZodBranded", t.ZodPipeline = "ZodPipeline", t.ZodReadonly = "ZodReadonly";
})(k || (k = {}));
const T = re.create, q = Re.create;
Ee.create;
const or = dt.create;
Ue.create;
const js = jt.create;
ge.create;
const Or = J.create, W = j.create;
ht.create;
ft.create;
Oe.create;
const Me = ze.create;
pt.create;
me.create;
Be.create;
const Tr = {
  string: ((t) => re.create({ ...t, coerce: !0 })),
  number: ((t) => Re.create({ ...t, coerce: !0 })),
  boolean: ((t) => dt.create({
    ...t,
    coerce: !0
  })),
  bigint: ((t) => Ee.create({ ...t, coerce: !0 })),
  date: ((t) => Ue.create({ ...t, coerce: !0 }))
};
W({
  type: Me([
    "connection_established",
    "live_health_update",
    "historical_data_update",
    "emergency_alert",
    "client_presence",
    "error",
    "pong"
  ]),
  data: js().optional(),
  timestamp: T().datetime().optional()
});
const jr = Me([
  "heart_rate",
  "walking_steadiness",
  "steps",
  "oxygen_saturation",
  "sleep_hours",
  "body_weight",
  "active_energy",
  "distance_walking",
  "blood_pressure_systolic",
  "blood_pressure_diastolic",
  "body_temperature",
  "respiratory_rate",
  "fall_event"
]), Ht = W({
  type: jr,
  value: q().describe("numeric value for the metric"),
  unit: T().optional(),
  timestamp: T().datetime().optional(),
  deviceId: T().optional(),
  userId: T().optional(),
  source: T().optional().describe("data source like Apple Watch, manual entry"),
  confidence: q().min(0).max(1).optional().describe("confidence level of the reading")
}), Cs = W({
  metrics: Or(Ht),
  uploadedAt: T().datetime(),
  deviceInfo: W({
    deviceId: T(),
    deviceType: T(),
    osVersion: T().optional(),
    appVersion: T().optional()
  }).optional()
}), _t = W({
  id: T().uuid().optional(),
  type: jr,
  value: q(),
  unit: T().optional(),
  timestamp: T().datetime(),
  processedAt: T().datetime(),
  validated: or(),
  // Analytics and insights
  healthScore: q().min(0).max(100).optional(),
  fallRisk: Me(["low", "moderate", "high", "critical"]).optional(),
  trendAnalysis: W({
    direction: Me(["improving", "stable", "declining"]),
    confidence: q().min(0).max(1),
    changePercent: q().optional()
  }).optional(),
  // Contextual data
  anomalyScore: q().min(0).max(1).optional().describe("how unusual this reading is"),
  correlatedMetrics: Or(T()).optional().describe("related metrics that influenced this reading"),
  // Alert and notification system
  alert: W({
    level: Me(["info", "warning", "critical", "emergency"]),
    message: T(),
    actionRequired: or().optional(),
    expiresAt: T().datetime().optional()
  }).nullable().optional(),
  // Data lineage
  source: W({
    deviceId: T().optional(),
    userId: T(),
    collectedAt: T().datetime(),
    processingPipeline: T().optional()
  }),
  // Quality metrics
  dataQuality: W({
    completeness: q().min(0).max(100),
    accuracy: q().min(0).max(100),
    timeliness: q().min(0).max(100),
    consistency: q().min(0).max(100)
  }).optional()
});
var cr = (t, e, r) => (s, n) => {
  let a = -1;
  return i(0);
  async function i(o) {
    if (o <= a)
      throw new Error("next() called multiple times");
    a = o;
    let c, l = !1, u;
    if (t[o] ? (u = t[o][0][0], s.req.routeIndex = o) : u = o === t.length && n || void 0, u)
      try {
        c = await u(s, () => i(o + 1));
      } catch (f) {
        if (f instanceof Error && e)
          s.error = f, c = await e(f, s), l = !0;
        else
          throw f;
      }
    else
      s.finalized === !1 && r && (c = await r(s));
    return c && (s.finalized === !1 || l) && (s.res = c), s;
  }
}, Ns = Symbol(), Is = async (t, e = /* @__PURE__ */ Object.create(null)) => {
  const { all: r = !1, dot: s = !1 } = e, a = (t instanceof $r ? t.raw.headers : t.headers).get("Content-Type");
  return a != null && a.startsWith("multipart/form-data") || a != null && a.startsWith("application/x-www-form-urlencoded") ? Ps(t, { all: r, dot: s }) : {};
};
async function Ps(t, e) {
  const r = await t.formData();
  return r ? Ms(r, e) : {};
}
function Ms(t, e) {
  const r = /* @__PURE__ */ Object.create(null);
  return t.forEach((s, n) => {
    e.all || n.endsWith("[]") ? $s(r, n, s) : r[n] = s;
  }), e.dot && Object.entries(r).forEach(([s, n]) => {
    s.includes(".") && (Ds(r, s, n), delete r[s]);
  }), r;
}
var $s = (t, e, r) => {
  t[e] !== void 0 ? Array.isArray(t[e]) ? t[e].push(r) : t[e] = [t[e], r] : e.endsWith("[]") ? t[e] = [r] : t[e] = r;
}, Ds = (t, e, r) => {
  let s = t;
  const n = e.split(".");
  n.forEach((a, i) => {
    i === n.length - 1 ? s[a] = r : ((!s[a] || typeof s[a] != "object" || Array.isArray(s[a]) || s[a] instanceof File) && (s[a] = /* @__PURE__ */ Object.create(null)), s = s[a]);
  });
}, Cr = (t) => {
  const e = t.split("/");
  return e[0] === "" && e.shift(), e;
}, Ls = (t) => {
  const { groups: e, path: r } = Zs(t), s = Cr(r);
  return Hs(s, e);
}, Zs = (t) => {
  const e = [];
  return t = t.replace(/\{[^}]+\}/g, (r, s) => {
    const n = `@${s}`;
    return e.push([n, r]), n;
  }), { groups: e, path: t };
}, Hs = (t, e) => {
  for (let r = e.length - 1; r >= 0; r--) {
    const [s] = e[r];
    for (let n = t.length - 1; n >= 0; n--)
      if (t[n].includes(s)) {
        t[n] = t[n].replace(s, e[r][1]);
        break;
      }
  }
  return t;
}, at = {}, Vs = (t, e) => {
  if (t === "*")
    return "*";
  const r = t.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (r) {
    const s = `${t}#${e}`;
    return at[s] || (r[2] ? at[s] = e && e[0] !== ":" && e[0] !== "*" ? [s, r[1], new RegExp(`^${r[2]}(?=/${e})`)] : [t, r[1], new RegExp(`^${r[2]}$`)] : at[s] = [t, r[1], !0]), at[s];
  }
  return null;
}, Vt = (t, e) => {
  try {
    return e(t);
  } catch {
    return t.replace(/(?:%[0-9A-Fa-f]{2})+/g, (r) => {
      try {
        return e(r);
      } catch {
        return r;
      }
    });
  }
}, Us = (t) => Vt(t, decodeURI), Nr = (t) => {
  const e = t.url, r = e.indexOf(
    "/",
    e.charCodeAt(9) === 58 ? 13 : 8
  );
  let s = r;
  for (; s < e.length; s++) {
    const n = e.charCodeAt(s);
    if (n === 37) {
      const a = e.indexOf("?", s), i = e.slice(r, a === -1 ? void 0 : a);
      return Us(i.includes("%25") ? i.replace(/%25/g, "%2525") : i);
    } else if (n === 63)
      break;
  }
  return e.slice(r, s);
}, zs = (t) => {
  const e = Nr(t);
  return e.length > 1 && e.at(-1) === "/" ? e.slice(0, -1) : e;
}, Ne = (t, e, ...r) => (r.length && (e = Ne(e, ...r)), `${(t == null ? void 0 : t[0]) === "/" ? "" : "/"}${t}${e === "/" ? "" : `${(t == null ? void 0 : t.at(-1)) === "/" ? "" : "/"}${(e == null ? void 0 : e[0]) === "/" ? e.slice(1) : e}`}`), Ir = (t) => {
  if (t.charCodeAt(t.length - 1) !== 63 || !t.includes(":"))
    return null;
  const e = t.split("/"), r = [];
  let s = "";
  return e.forEach((n) => {
    if (n !== "" && !/\:/.test(n))
      s += "/" + n;
    else if (/\:/.test(n))
      if (/\?/.test(n)) {
        r.length === 0 && s === "" ? r.push("/") : r.push(s);
        const a = n.replace("?", "");
        s += "/" + a, r.push(s);
      } else
        s += "/" + n;
  }), r.filter((n, a, i) => i.indexOf(n) === a);
}, Rt = (t) => /[%+]/.test(t) ? (t.indexOf("+") !== -1 && (t = t.replace(/\+/g, " ")), t.indexOf("%") !== -1 ? Vt(t, Mr) : t) : t, Pr = (t, e, r) => {
  let s;
  if (!r && e && !/[%+]/.test(e)) {
    let i = t.indexOf(`?${e}`, 8);
    for (i === -1 && (i = t.indexOf(`&${e}`, 8)); i !== -1; ) {
      const o = t.charCodeAt(i + e.length + 1);
      if (o === 61) {
        const c = i + e.length + 2, l = t.indexOf("&", c);
        return Rt(t.slice(c, l === -1 ? void 0 : l));
      } else if (o == 38 || isNaN(o))
        return "";
      i = t.indexOf(`&${e}`, i + 1);
    }
    if (s = /[%+]/.test(t), !s)
      return;
  }
  const n = {};
  s ?? (s = /[%+]/.test(t));
  let a = t.indexOf("?", 8);
  for (; a !== -1; ) {
    const i = t.indexOf("&", a + 1);
    let o = t.indexOf("=", a);
    o > i && i !== -1 && (o = -1);
    let c = t.slice(
      a + 1,
      o === -1 ? i === -1 ? void 0 : i : o
    );
    if (s && (c = Rt(c)), a = i, c === "")
      continue;
    let l;
    o === -1 ? l = "" : (l = t.slice(o + 1, i === -1 ? void 0 : i), s && (l = Rt(l))), r ? (n[c] && Array.isArray(n[c]) || (n[c] = []), n[c].push(l)) : n[c] ?? (n[c] = l);
  }
  return e ? n[e] : n;
}, qs = Pr, Bs = (t, e) => Pr(t, e, !0), Mr = decodeURIComponent, lr = (t) => Vt(t, Mr), $e, U, ne, Dr, Lr, Mt, le, hr, $r = (hr = class {
  constructor(t, e = "/", r = [[]]) {
    x(this, ne);
    _(this, "raw");
    x(this, $e);
    x(this, U);
    _(this, "routeIndex", 0);
    _(this, "path");
    _(this, "bodyCache", {});
    x(this, le, (t) => {
      const { bodyCache: e, raw: r } = this, s = e[t];
      if (s)
        return s;
      const n = Object.keys(e)[0];
      return n ? e[n].then((a) => (n === "json" && (a = JSON.stringify(a)), new Response(a)[t]())) : e[t] = r[t]();
    });
    this.raw = t, this.path = e, v(this, U, r), v(this, $e, {});
  }
  param(t) {
    return t ? R(this, ne, Dr).call(this, t) : R(this, ne, Lr).call(this);
  }
  query(t) {
    return qs(this.url, t);
  }
  queries(t) {
    return Bs(this.url, t);
  }
  header(t) {
    if (t)
      return this.raw.headers.get(t) ?? void 0;
    const e = {};
    return this.raw.headers.forEach((r, s) => {
      e[s] = r;
    }), e;
  }
  async parseBody(t) {
    var e;
    return (e = this.bodyCache).parsedBody ?? (e.parsedBody = await Is(this, t));
  }
  json() {
    return d(this, le).call(this, "text").then((t) => JSON.parse(t));
  }
  text() {
    return d(this, le).call(this, "text");
  }
  arrayBuffer() {
    return d(this, le).call(this, "arrayBuffer");
  }
  blob() {
    return d(this, le).call(this, "blob");
  }
  formData() {
    return d(this, le).call(this, "formData");
  }
  addValidatedData(t, e) {
    d(this, $e)[t] = e;
  }
  valid(t) {
    return d(this, $e)[t];
  }
  get url() {
    return this.raw.url;
  }
  get method() {
    return this.raw.method;
  }
  get [Ns]() {
    return d(this, U);
  }
  get matchedRoutes() {
    return d(this, U)[0].map(([[, t]]) => t);
  }
  get routePath() {
    return d(this, U)[0].map(([[, t]]) => t)[this.routeIndex].path;
  }
}, $e = new WeakMap(), U = new WeakMap(), ne = new WeakSet(), Dr = function(t) {
  const e = d(this, U)[0][this.routeIndex][1][t], r = R(this, ne, Mt).call(this, e);
  return r ? /\%/.test(r) ? lr(r) : r : void 0;
}, Lr = function() {
  const t = {}, e = Object.keys(d(this, U)[0][this.routeIndex][1]);
  for (const r of e) {
    const s = R(this, ne, Mt).call(this, d(this, U)[0][this.routeIndex][1][r]);
    s && typeof s == "string" && (t[r] = /\%/.test(s) ? lr(s) : s);
  }
  return t;
}, Mt = function(t) {
  return d(this, U)[1] ? d(this, U)[1][t] : t;
}, le = new WeakMap(), hr), Fs = {
  Stringify: 1
}, Zr = async (t, e, r, s, n) => {
  typeof t == "object" && !(t instanceof String) && (t instanceof Promise || (t = t.toString()), t instanceof Promise && (t = await t));
  const a = t.callbacks;
  return a != null && a.length ? (n ? n[0] += t : n = [t], Promise.all(a.map((o) => o({ phase: e, buffer: n, context: s }))).then(
    (o) => Promise.all(
      o.filter(Boolean).map((c) => Zr(c, e, !1, s, n))
    ).then(() => n[0])
  )) : Promise.resolve(t);
}, Ks = "text/plain; charset=UTF-8", Et = (t, e) => ({
  "Content-Type": t,
  ...e
}), Xe, et, Q, De, X, Z, tt, Le, Ze, ke, rt, st, ue, Ie, fr, Ws = (fr = class {
  constructor(t, e) {
    x(this, ue);
    x(this, Xe);
    x(this, et);
    _(this, "env", {});
    x(this, Q);
    _(this, "finalized", !1);
    _(this, "error");
    x(this, De);
    x(this, X);
    x(this, Z);
    x(this, tt);
    x(this, Le);
    x(this, Ze);
    x(this, ke);
    x(this, rt);
    x(this, st);
    _(this, "render", (...t) => (d(this, Le) ?? v(this, Le, (e) => this.html(e)), d(this, Le).call(this, ...t)));
    _(this, "setLayout", (t) => v(this, tt, t));
    _(this, "getLayout", () => d(this, tt));
    _(this, "setRenderer", (t) => {
      v(this, Le, t);
    });
    _(this, "header", (t, e, r) => {
      this.finalized && v(this, Z, new Response(d(this, Z).body, d(this, Z)));
      const s = d(this, Z) ? d(this, Z).headers : d(this, ke) ?? v(this, ke, new Headers());
      e === void 0 ? s.delete(t) : r != null && r.append ? s.append(t, e) : s.set(t, e);
    });
    _(this, "status", (t) => {
      v(this, De, t);
    });
    _(this, "set", (t, e) => {
      d(this, Q) ?? v(this, Q, /* @__PURE__ */ new Map()), d(this, Q).set(t, e);
    });
    _(this, "get", (t) => d(this, Q) ? d(this, Q).get(t) : void 0);
    _(this, "newResponse", (...t) => R(this, ue, Ie).call(this, ...t));
    _(this, "body", (t, e, r) => R(this, ue, Ie).call(this, t, e, r));
    _(this, "text", (t, e, r) => !d(this, ke) && !d(this, De) && !e && !r && !this.finalized ? new Response(t) : R(this, ue, Ie).call(this, t, e, Et(Ks, r)));
    _(this, "json", (t, e, r) => R(this, ue, Ie).call(this, JSON.stringify(t), e, Et("application/json", r)));
    _(this, "html", (t, e, r) => {
      const s = (n) => R(this, ue, Ie).call(this, n, e, Et("text/html; charset=UTF-8", r));
      return typeof t == "object" ? Zr(t, Fs.Stringify, !1, {}).then(s) : s(t);
    });
    _(this, "redirect", (t, e) => {
      const r = String(t);
      return this.header(
        "Location",
        /[^\x00-\xFF]/.test(r) ? encodeURI(r) : r
      ), this.newResponse(null, e ?? 302);
    });
    _(this, "notFound", () => (d(this, Ze) ?? v(this, Ze, () => new Response()), d(this, Ze).call(this, this)));
    v(this, Xe, t), e && (v(this, X, e.executionCtx), this.env = e.env, v(this, Ze, e.notFoundHandler), v(this, st, e.path), v(this, rt, e.matchResult));
  }
  get req() {
    return d(this, et) ?? v(this, et, new $r(d(this, Xe), d(this, st), d(this, rt))), d(this, et);
  }
  get event() {
    if (d(this, X) && "respondWith" in d(this, X))
      return d(this, X);
    throw Error("This context has no FetchEvent");
  }
  get executionCtx() {
    if (d(this, X))
      return d(this, X);
    throw Error("This context has no ExecutionContext");
  }
  get res() {
    return d(this, Z) || v(this, Z, new Response(null, {
      headers: d(this, ke) ?? v(this, ke, new Headers())
    }));
  }
  set res(t) {
    if (d(this, Z) && t) {
      t = new Response(t.body, t);
      for (const [e, r] of d(this, Z).headers.entries())
        if (e !== "content-type")
          if (e === "set-cookie") {
            const s = d(this, Z).headers.getSetCookie();
            t.headers.delete("set-cookie");
            for (const n of s)
              t.headers.append("set-cookie", n);
          } else
            t.headers.set(e, r);
    }
    v(this, Z, t), this.finalized = !0;
  }
  get var() {
    return d(this, Q) ? Object.fromEntries(d(this, Q)) : {};
  }
}, Xe = new WeakMap(), et = new WeakMap(), Q = new WeakMap(), De = new WeakMap(), X = new WeakMap(), Z = new WeakMap(), tt = new WeakMap(), Le = new WeakMap(), Ze = new WeakMap(), ke = new WeakMap(), rt = new WeakMap(), st = new WeakMap(), ue = new WeakSet(), Ie = function(t, e, r) {
  const s = d(this, Z) ? new Headers(d(this, Z).headers) : d(this, ke) ?? new Headers();
  if (typeof e == "object" && "headers" in e) {
    const a = e.headers instanceof Headers ? e.headers : new Headers(e.headers);
    for (const [i, o] of a)
      i.toLowerCase() === "set-cookie" ? s.append(i, o) : s.set(i, o);
  }
  if (r)
    for (const [a, i] of Object.entries(r))
      if (typeof i == "string")
        s.set(a, i);
      else {
        s.delete(a);
        for (const o of i)
          s.append(a, o);
      }
  const n = typeof e == "number" ? e : (e == null ? void 0 : e.status) ?? d(this, De);
  return new Response(t, { status: n, headers: s });
}, fr), N = "ALL", Js = "all", Gs = ["get", "post", "put", "delete", "options", "patch"], Hr = "Can not add a route since the matcher is already built.", Vr = class extends Error {
}, Ys = "__COMPOSED_HANDLER", Qs = (t) => t.text("404 Not Found", 404), ur = (t, e) => {
  if ("getResponse" in t) {
    const r = t.getResponse();
    return e.newResponse(r.body, r);
  }
  return console.error(t), e.text("Internal Server Error", 500);
}, B, I, zr, F, _e, ot, ct, pr, Ur = (pr = class {
  constructor(e = {}) {
    x(this, I);
    _(this, "get");
    _(this, "post");
    _(this, "put");
    _(this, "delete");
    _(this, "options");
    _(this, "patch");
    _(this, "all");
    _(this, "on");
    _(this, "use");
    _(this, "router");
    _(this, "getPath");
    _(this, "_basePath", "/");
    x(this, B, "/");
    _(this, "routes", []);
    x(this, F, Qs);
    _(this, "errorHandler", ur);
    _(this, "onError", (e) => (this.errorHandler = e, this));
    _(this, "notFound", (e) => (v(this, F, e), this));
    _(this, "fetch", (e, ...r) => R(this, I, ct).call(this, e, r[1], r[0], e.method));
    _(this, "request", (e, r, s, n) => e instanceof Request ? this.fetch(r ? new Request(e, r) : e, s, n) : (e = e.toString(), this.fetch(
      new Request(
        /^https?:\/\//.test(e) ? e : `http://localhost${Ne("/", e)}`,
        r
      ),
      s,
      n
    )));
    _(this, "fire", () => {
      addEventListener("fetch", (e) => {
        e.respondWith(R(this, I, ct).call(this, e.request, e, void 0, e.request.method));
      });
    });
    [...Gs, Js].forEach((a) => {
      this[a] = (i, ...o) => (typeof i == "string" ? v(this, B, i) : R(this, I, _e).call(this, a, d(this, B), i), o.forEach((c) => {
        R(this, I, _e).call(this, a, d(this, B), c);
      }), this);
    }), this.on = (a, i, ...o) => {
      for (const c of [i].flat()) {
        v(this, B, c);
        for (const l of [a].flat())
          o.map((u) => {
            R(this, I, _e).call(this, l.toUpperCase(), d(this, B), u);
          });
      }
      return this;
    }, this.use = (a, ...i) => (typeof a == "string" ? v(this, B, a) : (v(this, B, "*"), i.unshift(a)), i.forEach((o) => {
      R(this, I, _e).call(this, N, d(this, B), o);
    }), this);
    const { strict: s, ...n } = e;
    Object.assign(this, n), this.getPath = s ?? !0 ? e.getPath ?? Nr : zs;
  }
  route(e, r) {
    const s = this.basePath(e);
    return r.routes.map((n) => {
      var i;
      let a;
      r.errorHandler === ur ? a = n.handler : (a = async (o, c) => (await cr([], r.errorHandler)(o, () => n.handler(o, c))).res, a[Ys] = n.handler), R(i = s, I, _e).call(i, n.method, n.path, a);
    }), this;
  }
  basePath(e) {
    const r = R(this, I, zr).call(this);
    return r._basePath = Ne(this._basePath, e), r;
  }
  mount(e, r, s) {
    let n, a;
    s && (typeof s == "function" ? a = s : (a = s.optionHandler, s.replaceRequest === !1 ? n = (c) => c : n = s.replaceRequest));
    const i = a ? (c) => {
      const l = a(c);
      return Array.isArray(l) ? l : [l];
    } : (c) => {
      let l;
      try {
        l = c.executionCtx;
      } catch {
      }
      return [c.env, l];
    };
    n || (n = (() => {
      const c = Ne(this._basePath, e), l = c === "/" ? 0 : c.length;
      return (u) => {
        const f = new URL(u.url);
        return f.pathname = f.pathname.slice(l) || "/", new Request(f, u);
      };
    })());
    const o = async (c, l) => {
      const u = await r(n(c.req.raw), ...i(c));
      if (u)
        return u;
      await l();
    };
    return R(this, I, _e).call(this, N, Ne(e, "*"), o), this;
  }
}, B = new WeakMap(), I = new WeakSet(), zr = function() {
  const e = new Ur({
    router: this.router,
    getPath: this.getPath
  });
  return e.errorHandler = this.errorHandler, v(e, F, d(this, F)), e.routes = this.routes, e;
}, F = new WeakMap(), _e = function(e, r, s) {
  e = e.toUpperCase(), r = Ne(this._basePath, r);
  const n = { basePath: this._basePath, path: r, method: e, handler: s };
  this.router.add(e, r, [s, n]), this.routes.push(n);
}, ot = function(e, r) {
  if (e instanceof Error)
    return this.errorHandler(e, r);
  throw e;
}, ct = function(e, r, s, n) {
  if (n === "HEAD")
    return (async () => new Response(null, await R(this, I, ct).call(this, e, r, s, "GET")))();
  const a = this.getPath(e, { env: s }), i = this.router.match(n, a), o = new Ws(e, {
    path: a,
    matchResult: i,
    env: s,
    executionCtx: r,
    notFoundHandler: d(this, F)
  });
  if (i[0].length === 1) {
    let l;
    try {
      l = i[0][0][0][0](o, async () => {
        o.res = await d(this, F).call(this, o);
      });
    } catch (u) {
      return R(this, I, ot).call(this, u, o);
    }
    return l instanceof Promise ? l.then(
      (u) => u || (o.finalized ? o.res : d(this, F).call(this, o))
    ).catch((u) => R(this, I, ot).call(this, u, o)) : l ?? d(this, F).call(this, o);
  }
  const c = cr(i[0], this.errorHandler, d(this, F));
  return (async () => {
    try {
      const l = await c(o);
      if (!l.finalized)
        throw new Error(
          "Context is not finalized. Did you forget to return a Response object or `await next()`?"
        );
      return l.res;
    } catch (l) {
      return R(this, I, ot).call(this, l, o);
    }
  })();
}, pr), mt = "[^/]+", Ge = ".*", Ye = "(?:|/.*)", Pe = Symbol(), Xs = new Set(".\\+*[^]$()");
function en(t, e) {
  return t.length === 1 ? e.length === 1 ? t < e ? -1 : 1 : -1 : e.length === 1 || t === Ge || t === Ye ? 1 : e === Ge || e === Ye ? -1 : t === mt ? 1 : e === mt ? -1 : t.length === e.length ? t < e ? -1 : 1 : e.length - t.length;
}
var xe, be, K, mr, $t = (mr = class {
  constructor() {
    x(this, xe);
    x(this, be);
    x(this, K, /* @__PURE__ */ Object.create(null));
  }
  insert(e, r, s, n, a) {
    if (e.length === 0) {
      if (d(this, xe) !== void 0)
        throw Pe;
      if (a)
        return;
      v(this, xe, r);
      return;
    }
    const [i, ...o] = e, c = i === "*" ? o.length === 0 ? ["", "", Ge] : ["", "", mt] : i === "/*" ? ["", "", Ye] : i.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
    let l;
    if (c) {
      const u = c[1];
      let f = c[2] || mt;
      if (u && c[2] && (f === ".*" || (f = f.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:"), /\((?!\?:)/.test(f))))
        throw Pe;
      if (l = d(this, K)[f], !l) {
        if (Object.keys(d(this, K)).some(
          (g) => g !== Ge && g !== Ye
        ))
          throw Pe;
        if (a)
          return;
        l = d(this, K)[f] = new $t(), u !== "" && v(l, be, n.varIndex++);
      }
      !a && u !== "" && s.push([u, d(l, be)]);
    } else if (l = d(this, K)[i], !l) {
      if (Object.keys(d(this, K)).some(
        (u) => u.length > 1 && u !== Ge && u !== Ye
      ))
        throw Pe;
      if (a)
        return;
      l = d(this, K)[i] = new $t();
    }
    l.insert(o, r, s, n, a);
  }
  buildRegExpStr() {
    const r = Object.keys(d(this, K)).sort(en).map((s) => {
      const n = d(this, K)[s];
      return (typeof d(n, be) == "number" ? `(${s})@${d(n, be)}` : Xs.has(s) ? `\\${s}` : s) + n.buildRegExpStr();
    });
    return typeof d(this, xe) == "number" && r.unshift(`#${d(this, xe)}`), r.length === 0 ? "" : r.length === 1 ? r[0] : "(?:" + r.join("|") + ")";
  }
}, xe = new WeakMap(), be = new WeakMap(), K = new WeakMap(), mr), yt, nt, yr, tn = (yr = class {
  constructor() {
    x(this, yt, { varIndex: 0 });
    x(this, nt, new $t());
  }
  insert(t, e, r) {
    const s = [], n = [];
    for (let i = 0; ; ) {
      let o = !1;
      if (t = t.replace(/\{[^}]+\}/g, (c) => {
        const l = `@\\${i}`;
        return n[i] = [l, c], i++, o = !0, l;
      }), !o)
        break;
    }
    const a = t.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
    for (let i = n.length - 1; i >= 0; i--) {
      const [o] = n[i];
      for (let c = a.length - 1; c >= 0; c--)
        if (a[c].indexOf(o) !== -1) {
          a[c] = a[c].replace(o, n[i][1]);
          break;
        }
    }
    return d(this, nt).insert(a, e, s, d(this, yt), r), s;
  }
  buildRegExp() {
    let t = d(this, nt).buildRegExpStr();
    if (t === "")
      return [/^$/, [], []];
    let e = 0;
    const r = [], s = [];
    return t = t.replace(/#(\d+)|@(\d+)|\.\*\$/g, (n, a, i) => a !== void 0 ? (r[++e] = Number(a), "$()") : (i !== void 0 && (s[Number(i)] = ++e), "")), [new RegExp(`^${t}`), r, s];
  }
}, yt = new WeakMap(), nt = new WeakMap(), yr), qr = [], rn = [/^$/, [], /* @__PURE__ */ Object.create(null)], lt = /* @__PURE__ */ Object.create(null);
function Br(t) {
  return lt[t] ?? (lt[t] = new RegExp(
    t === "*" ? "" : `^${t.replace(
      /\/\*$|([.\\+*[^\]$()])/g,
      (e, r) => r ? `\\${r}` : "(?:|/.*)"
    )}$`
  ));
}
function sn() {
  lt = /* @__PURE__ */ Object.create(null);
}
function nn(t) {
  var l;
  const e = new tn(), r = [];
  if (t.length === 0)
    return rn;
  const s = t.map(
    (u) => [!/\*|\/:/.test(u[0]), ...u]
  ).sort(
    ([u, f], [g, E]) => u ? 1 : g ? -1 : f.length - E.length
  ), n = /* @__PURE__ */ Object.create(null);
  for (let u = 0, f = -1, g = s.length; u < g; u++) {
    const [E, C, O] = s[u];
    E ? n[C] = [O.map(([M]) => [M, /* @__PURE__ */ Object.create(null)]), qr] : f++;
    let P;
    try {
      P = e.insert(C, f, E);
    } catch (M) {
      throw M === Pe ? new Vr(C) : M;
    }
    E || (r[f] = O.map(([M, G]) => {
      const ae = /* @__PURE__ */ Object.create(null);
      for (G -= 1; G >= 0; G--) {
        const [H, wt] = P[G];
        ae[H] = wt;
      }
      return [M, ae];
    }));
  }
  const [a, i, o] = e.buildRegExp();
  for (let u = 0, f = r.length; u < f; u++)
    for (let g = 0, E = r[u].length; g < E; g++) {
      const C = (l = r[u][g]) == null ? void 0 : l[1];
      if (!C)
        continue;
      const O = Object.keys(C);
      for (let P = 0, M = O.length; P < M; P++)
        C[O[P]] = o[C[O[P]]];
    }
  const c = [];
  for (const u in i)
    c[u] = r[i[u]];
  return [a, c, n];
}
function je(t, e) {
  if (t) {
    for (const r of Object.keys(t).sort((s, n) => n.length - s.length))
      if (Br(r).test(e))
        return [...t[r]];
  }
}
var de, he, Fe, Fr, Kr, gr, an = (gr = class {
  constructor() {
    x(this, Fe);
    _(this, "name", "RegExpRouter");
    x(this, de);
    x(this, he);
    v(this, de, { [N]: /* @__PURE__ */ Object.create(null) }), v(this, he, { [N]: /* @__PURE__ */ Object.create(null) });
  }
  add(t, e, r) {
    var o;
    const s = d(this, de), n = d(this, he);
    if (!s || !n)
      throw new Error(Hr);
    s[t] || [s, n].forEach((c) => {
      c[t] = /* @__PURE__ */ Object.create(null), Object.keys(c[N]).forEach((l) => {
        c[t][l] = [...c[N][l]];
      });
    }), e === "/*" && (e = "*");
    const a = (e.match(/\/:/g) || []).length;
    if (/\*$/.test(e)) {
      const c = Br(e);
      t === N ? Object.keys(s).forEach((l) => {
        var u;
        (u = s[l])[e] || (u[e] = je(s[l], e) || je(s[N], e) || []);
      }) : (o = s[t])[e] || (o[e] = je(s[t], e) || je(s[N], e) || []), Object.keys(s).forEach((l) => {
        (t === N || t === l) && Object.keys(s[l]).forEach((u) => {
          c.test(u) && s[l][u].push([r, a]);
        });
      }), Object.keys(n).forEach((l) => {
        (t === N || t === l) && Object.keys(n[l]).forEach(
          (u) => c.test(u) && n[l][u].push([r, a])
        );
      });
      return;
    }
    const i = Ir(e) || [e];
    for (let c = 0, l = i.length; c < l; c++) {
      const u = i[c];
      Object.keys(n).forEach((f) => {
        var g;
        (t === N || t === f) && ((g = n[f])[u] || (g[u] = [
          ...je(s[f], u) || je(s[N], u) || []
        ]), n[f][u].push([r, a - l + c + 1]));
      });
    }
  }
  match(t, e) {
    sn();
    const r = R(this, Fe, Fr).call(this);
    return this.match = (s, n) => {
      const a = r[s] || r[N], i = a[2][n];
      if (i)
        return i;
      const o = n.match(a[0]);
      if (!o)
        return [[], qr];
      const c = o.indexOf("", 1);
      return [a[1][c], o];
    }, this.match(t, e);
  }
}, de = new WeakMap(), he = new WeakMap(), Fe = new WeakSet(), Fr = function() {
  const t = /* @__PURE__ */ Object.create(null);
  return Object.keys(d(this, he)).concat(Object.keys(d(this, de))).forEach((e) => {
    t[e] || (t[e] = R(this, Fe, Kr).call(this, e));
  }), v(this, de, v(this, he, void 0)), t;
}, Kr = function(t) {
  const e = [];
  let r = t === N;
  return [d(this, de), d(this, he)].forEach((s) => {
    const n = s[t] ? Object.keys(s[t]).map((a) => [a, s[t][a]]) : [];
    n.length !== 0 ? (r || (r = !0), e.push(...n)) : t !== N && e.push(
      ...Object.keys(s[N]).map((a) => [a, s[N][a]])
    );
  }), r ? nn(e) : null;
}, gr), fe, ee, vr, on = (vr = class {
  constructor(t) {
    _(this, "name", "SmartRouter");
    x(this, fe, []);
    x(this, ee, []);
    v(this, fe, t.routers);
  }
  add(t, e, r) {
    if (!d(this, ee))
      throw new Error(Hr);
    d(this, ee).push([t, e, r]);
  }
  match(t, e) {
    if (!d(this, ee))
      throw new Error("Fatal error");
    const r = d(this, fe), s = d(this, ee), n = r.length;
    let a = 0, i;
    for (; a < n; a++) {
      const o = r[a];
      try {
        for (let c = 0, l = s.length; c < l; c++)
          o.add(...s[c]);
        i = o.match(t, e);
      } catch (c) {
        if (c instanceof Vr)
          continue;
        throw c;
      }
      this.match = o.match.bind(o), v(this, fe, [o]), v(this, ee, void 0);
      break;
    }
    if (a === n)
      throw new Error("Fatal error");
    return this.name = `SmartRouter + ${this.activeRouter.name}`, i;
  }
  get activeRouter() {
    if (d(this, ee) || d(this, fe).length !== 1)
      throw new Error("No active router has been determined yet.");
    return d(this, fe)[0];
  }
}, fe = new WeakMap(), ee = new WeakMap(), vr), We = /* @__PURE__ */ Object.create(null), pe, D, Se, He, $, te, we, _r, Wr = (_r = class {
  constructor(t, e, r) {
    x(this, te);
    x(this, pe);
    x(this, D);
    x(this, Se);
    x(this, He, 0);
    x(this, $, We);
    if (v(this, D, r || /* @__PURE__ */ Object.create(null)), v(this, pe, []), t && e) {
      const s = /* @__PURE__ */ Object.create(null);
      s[t] = { handler: e, possibleKeys: [], score: 0 }, v(this, pe, [s]);
    }
    v(this, Se, []);
  }
  insert(t, e, r) {
    v(this, He, ++qt(this, He)._);
    let s = this;
    const n = Ls(e), a = [];
    for (let i = 0, o = n.length; i < o; i++) {
      const c = n[i], l = n[i + 1], u = Vs(c, l), f = Array.isArray(u) ? u[0] : c;
      if (f in d(s, D)) {
        s = d(s, D)[f], u && a.push(u[1]);
        continue;
      }
      d(s, D)[f] = new Wr(), u && (d(s, Se).push(u), a.push(u[1])), s = d(s, D)[f];
    }
    return d(s, pe).push({
      [t]: {
        handler: r,
        possibleKeys: a.filter((i, o, c) => c.indexOf(i) === o),
        score: d(this, He)
      }
    }), s;
  }
  search(t, e) {
    var o;
    const r = [];
    v(this, $, We);
    let n = [this];
    const a = Cr(e), i = [];
    for (let c = 0, l = a.length; c < l; c++) {
      const u = a[c], f = c === l - 1, g = [];
      for (let E = 0, C = n.length; E < C; E++) {
        const O = n[E], P = d(O, D)[u];
        P && (v(P, $, d(O, $)), f ? (d(P, D)["*"] && r.push(
          ...R(this, te, we).call(this, d(P, D)["*"], t, d(O, $))
        ), r.push(...R(this, te, we).call(this, P, t, d(O, $)))) : g.push(P));
        for (let M = 0, G = d(O, Se).length; M < G; M++) {
          const ae = d(O, Se)[M], H = d(O, $) === We ? {} : { ...d(O, $) };
          if (ae === "*") {
            const ie = d(O, D)["*"];
            ie && (r.push(...R(this, te, we).call(this, ie, t, d(O, $))), v(ie, $, H), g.push(ie));
            continue;
          }
          const [wt, Ut, Ke] = ae;
          if (!u && !(Ke instanceof RegExp))
            continue;
          const Y = d(O, D)[wt], Yr = a.slice(c).join("/");
          if (Ke instanceof RegExp) {
            const ie = Ke.exec(Yr);
            if (ie) {
              if (H[Ut] = ie[0], r.push(...R(this, te, we).call(this, Y, t, d(O, $), H)), Object.keys(d(Y, D)).length) {
                v(Y, $, H);
                const kt = ((o = ie[0].match(/\//)) == null ? void 0 : o.length) ?? 0;
                (i[kt] || (i[kt] = [])).push(Y);
              }
              continue;
            }
          }
          (Ke === !0 || Ke.test(u)) && (H[Ut] = u, f ? (r.push(...R(this, te, we).call(this, Y, t, H, d(O, $))), d(Y, D)["*"] && r.push(
            ...R(this, te, we).call(this, d(Y, D)["*"], t, H, d(O, $))
          )) : (v(Y, $, H), g.push(Y)));
        }
      }
      n = g.concat(i.shift() ?? []);
    }
    return r.length > 1 && r.sort((c, l) => c.score - l.score), [r.map(({ handler: c, params: l }) => [c, l])];
  }
}, pe = new WeakMap(), D = new WeakMap(), Se = new WeakMap(), He = new WeakMap(), $ = new WeakMap(), te = new WeakSet(), we = function(t, e, r, s) {
  const n = [];
  for (let a = 0, i = d(t, pe).length; a < i; a++) {
    const o = d(t, pe)[a], c = o[e] || o[N], l = {};
    if (c !== void 0 && (c.params = /* @__PURE__ */ Object.create(null), n.push(c), r !== We || s && s !== We))
      for (let u = 0, f = c.possibleKeys.length; u < f; u++) {
        const g = c.possibleKeys[u], E = l[c.score];
        c.params[g] = s != null && s[g] && !E ? s[g] : r[g] ?? (s == null ? void 0 : s[g]), l[c.score] = !0;
      }
  }
  return n;
}, _r), Ae, wr, cn = (wr = class {
  constructor() {
    _(this, "name", "TrieRouter");
    x(this, Ae);
    v(this, Ae, new Wr());
  }
  add(t, e, r) {
    const s = Ir(e);
    if (s) {
      for (let n = 0, a = s.length; n < a; n++)
        d(this, Ae).insert(t, s[n], r);
      return;
    }
    d(this, Ae).insert(t, e, r);
  }
  match(t, e) {
    return d(this, Ae).search(t, e);
  }
}, Ae = new WeakMap(), wr), ln = class extends Ur {
  constructor(t = {}) {
    super(t), this.router = t.router ?? new on({
      routers: [new an(), new cn()]
    });
  }
};
const L = new ln(), Ot = /* @__PURE__ */ new Map();
function dr(t, e = 60, r = 6e4) {
  const s = Date.now(), n = Ot.get(t) || { tokens: e, last: s }, a = s - n.last, i = Math.floor(a / r) * e;
  return n.tokens = Math.min(e, n.tokens + i), n.last = s, n.tokens <= 0 ? (Ot.set(t, n), !1) : (n.tokens -= 1, Ot.set(t, n), !0);
}
async function un(t, e, r = 60, s = 6e4) {
  try {
    if (!t.env.RATE_LIMITER) return dr(e, r, s);
    const n = t.env.RATE_LIMITER.idFromName(e), a = t.env.RATE_LIMITER.get(n), i = new URL("https://do.local/consume");
    i.searchParams.set("key", e), i.searchParams.set("limit", String(r)), i.searchParams.set("intervalMs", String(s));
    const o = await a.fetch(new Request(i.toString()));
    return o.ok ? !!(await o.json().catch(() => ({ ok: !1 }))).ok : !1;
  } catch {
    return dr(e, r, s);
  }
}
function Jr(t) {
  var n;
  const e = t.req.header("Authorization") || "", r = e.startsWith("Bearer ") ? e.slice(7) : "";
  return (r ? (n = rs(r)) == null ? void 0 : n.sub : void 0) || t.req.header("CF-Connecting-IP") || "anon";
}
async function dn(t) {
  if (t.env.ENVIRONMENT !== "production") return !0;
  const e = t.req.header("Authorization") || "", r = e.startsWith("Bearer ") ? e.slice(7) : "";
  if (!r) return !1;
  const s = t.env.API_JWKS_URL;
  return s ? (await Sr(r, {
    iss: t.env.API_ISS,
    aud: t.env.API_AUD,
    jwksUrl: s
  })).ok : (await br(r, {
    iss: t.env.API_ISS,
    aud: t.env.API_AUD
  })).ok;
}
L.use("*", async (t, e) => {
  const r = t.req.header("Origin") || null, s = (t.env.ALLOWED_ORIGINS || "").split(",").map((o) => o.trim()).filter(Boolean), n = crypto.randomUUID();
  if (t.req.method === "OPTIONS") {
    const o = Bt(r, s);
    return o.set("X-Correlation-Id", n), t.newResponse(null, { status: 204, headers: o });
  }
  await e();
  const a = t.res ?? new Response(null), i = [
    "default-src 'self'",
    "img-src 'self' data:",
    "style-src 'self' 'unsafe-inline'",
    // Tailwind inlined
    "script-src 'self'",
    "connect-src 'self' https: wss:",
    "frame-ancestors 'none'"
  ].join("; ");
  try {
    const o = a.headers;
    o.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    ), o.set("X-Content-Type-Options", "nosniff"), o.set("X-Frame-Options", "DENY"), o.set("Referrer-Policy", "no-referrer"), o.set("Permissions-Policy", "geolocation=(), microphone=(), camera=()"), o.set("Content-Security-Policy", i), o.set("X-Correlation-Id", n), Bt(r, s).forEach((l, u) => o.set(u, l));
  } catch (o) {
    ve.warn("header_injection_failed", { error: o.message });
  }
  return a;
});
L.use("/api/*", async (t, e) => {
  const r = Jr(t);
  return await un(t, r) ? await dn(t) ? e() : t.json({ error: "unauthorized" }, 401) : t.json({ error: "rate_limited" }, 429);
});
L.use("/*", async (t, e) => {
  var s;
  if (t.req.method !== "GET") return e();
  const r = await ((s = t.env.ASSETS) == null ? void 0 : s.fetch(t.req.raw));
  return !r || r.status === 404 ? e() : r;
});
L.get("/health", (t) => t.json({
  status: "healthy",
  timestamp: (/* @__PURE__ */ new Date()).toISOString(),
  environment: t.env.ENVIRONMENT || "unknown"
}));
L.get("/ws", (t) => t.text(
  "WebSocket endpoint not available on Worker. Use local bridge server.",
  426
));
L.get("/api/_selftest", async (t) => {
  if (t.env.ENVIRONMENT === "production")
    return t.json({ error: "not_available" }, 404);
  const e = {};
  try {
    const r = t.env.ENC_KEY;
    if (r) {
      const s = await Te(r), n = { hello: "world", at: Date.now() }, a = await vt(s, n);
      e.aes_gcm = { ok: !0, ciphertextLength: a.length };
    } else
      e.aes_gcm = { ok: !1, reason: "no_key" };
  } catch (r) {
    e.aes_gcm = { ok: !1, error: r.message };
  }
  try {
    const r = "eyJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJiYSIsImF1ZCI6ImF1ZCIsImV4cCI6MX0.signature", s = t.env.API_JWKS_URL;
    if (s) {
      const n = await Sr(r, {
        iss: "ba",
        aud: "aud",
        jwksUrl: s
      });
      e.jwt_jwks_negative = { ok: !n.ok };
    } else
      e.jwt_claims_negative = {
        ok: !(await br(r)).ok
      };
  } catch (r) {
    e.jwt_error = { ok: !1, error: r.message };
  }
  return t.json({ ok: !0, results: e });
});
L.get("/api/_ratelimit", async (t) => {
  if (t.env.ENVIRONMENT === "production")
    return t.json({ error: "not_available" }, 404);
  const e = new URL(t.req.url).searchParams.get("key") || Jr(t);
  try {
    if (!t.env.RATE_LIMITER) return t.json({ error: "no_rate_limiter" }, 500);
    const r = t.env.RATE_LIMITER.idFromName(e), s = t.env.RATE_LIMITER.get(r), n = new URL("https://do.local/consume");
    n.searchParams.set("key", e), n.searchParams.set("probe", "1");
    const i = await (await s.fetch(new Request(n.toString()))).json().catch(() => ({ ok: !1 }));
    return t.json({ ok: !0, key: e, remaining: i.remaining ?? null });
  } catch (r) {
    return t.json({ ok: !1, error: r.message }, 500);
  }
});
L.get("/api/_audit", async (t) => {
  if (t.env.ENVIRONMENT === "production")
    return t.json({ error: "not_available" }, 404);
  if (!t.env.HEALTH_STORAGE) return t.json({ error: "no_storage" }, 500);
  const e = new URL(t.req.url), r = Math.max(
    1,
    Math.min(100, Number(e.searchParams.get("limit") || 20))
  ), s = e.searchParams.get("withBodies") === "1";
  try {
    const a = ((await t.env.HEALTH_STORAGE.list({
      prefix: "audit/events/",
      limit: 1e3
    })).objects || []).sort((o, c) => o.key < c.key ? 1 : -1).slice(0, r);
    if (!s)
      return t.json({
        ok: !0,
        count: a.length,
        keys: a.map((o) => o.key)
      });
    const i = [];
    for (const o of a) {
      const c = await t.env.HEALTH_STORAGE.get(o.key);
      if (c != null && c.body) {
        const u = (await new Response(c.body).text()).split(`
`)[0];
        i.push({ key: o.key, line: u });
      } else
        i.push({ key: o.key });
    }
    return t.json({ ok: !0, count: i.length, events: i });
  } catch (n) {
    return t.json({ ok: !1, error: n.message }, 500);
  }
});
L.post("/api/device/auth", async (t) => {
  const e = t.env.DEVICE_JWT_SECRET;
  if (!e) return t.json({ error: "not_configured" }, 500);
  const r = W({
    userId: T().min(1),
    clientType: Me(["ios_app", "web_dashboard"]).default("ios_app"),
    ttlSec: Tr.number().min(60).max(3600).optional()
  });
  let s;
  try {
    const o = await t.req.json(), c = r.safeParse(o);
    if (!c.success)
      return t.json(
        { error: "validation_error", details: c.error.flatten() },
        400
      );
    s = c.data;
  } catch {
    return t.json({ error: "invalid_json" }, 400);
  }
  const n = Math.floor(Date.now() / 1e3), a = s.ttlSec ?? 600, i = {
    iss: t.env.API_ISS || "health-app",
    aud: t.env.API_AUD || "ws-device",
    sub: s.userId,
    iat: n,
    nbf: n,
    exp: n + a,
    scope: `device:${s.clientType}`
  };
  try {
    const o = await ss(
      i,
      e
    );
    return t.json({ ok: !0, token: o, expiresIn: a });
  } catch (o) {
    return ve.error("device_token_sign_failed", { error: o.message }), t.json({ error: "server_error" }, 500);
  }
});
L.post("/api/_purge", async (t) => {
  if (t.env.ENVIRONMENT === "production")
    return t.json({ error: "not_available" }, 404);
  const e = new URL(t.req.url), r = Math.max(
    1,
    Math.min(2e3, Number(e.searchParams.get("limit") || 1e3))
  ), s = e.searchParams.get("prefix") || "health:", n = t.env.HEALTH_KV;
  if (!n || typeof n.list != "function" || typeof n.delete != "function")
    return t.json({ ok: !0, scanned: 0, deleted: 0 });
  const a = await xr(t.env, n, { limit: r, prefix: s });
  return t.json({ ok: !0, ...a });
});
L.post("/api/health-data/process", async (t) => {
  let e;
  try {
    e = await t.req.json();
  } catch {
    return t.json({ error: "invalid_json" }, 400);
  }
  const r = Ht.safeParse(e);
  if (!r.success)
    return t.json(
      { error: "validation_error", details: r.error.flatten() },
      400
    );
  try {
    const s = await Gr(
      t,
      r.data.type,
      r.data.userId
    ), n = await kr.processHealthMetric(
      r.data,
      s
    ), a = t.env.HEALTH_KV;
    if (a) {
      const o = `health:${n.type}:${n.processedAt}`, c = t.env.ENC_KEY ? await Te(t.env.ENC_KEY) : null, l = c ? await vt(c, n) : JSON.stringify(n), u = gt(n.type, t.env.ENVIRONMENT);
      await a.put(o, l, { expirationTtl: u });
    }
    const i = t.res.headers.get("X-Correlation-Id") || "";
    return await Dt(t.env, {
      type: "health_data_processed",
      actor: "enhanced_processor",
      resource: "kv:health",
      meta: {
        type: n.type,
        correlationId: i,
        healthScore: n.healthScore,
        fallRisk: n.fallRisk,
        hasAlert: !!n.alert
      }
    }), t.json(
      {
        ok: !0,
        data: n,
        analytics: {
          healthScore: n.healthScore,
          fallRisk: n.fallRisk,
          anomalyScore: n.anomalyScore,
          dataQuality: n.dataQuality,
          alert: n.alert
        }
      },
      201
    );
  } catch (s) {
    return ve.error("Health data processing failed", {
      error: s.message,
      metric: r.data.type
    }), t.json({ error: "processing_failed" }, 500);
  }
});
L.post("/api/health-data/batch", async (t) => {
  let e;
  try {
    e = await t.req.json();
  } catch {
    return t.json({ error: "invalid_json" }, 400);
  }
  const r = Cs.safeParse(e);
  if (!r.success)
    return t.json(
      { error: "validation_error", details: r.error.flatten() },
      400
    );
  try {
    const s = [], n = [];
    for (const i of r.data.metrics)
      try {
        const o = await Gr(
          t,
          i.type,
          i.userId
        ), c = await kr.processHealthMetric(
          i,
          o
        ), l = t.env.HEALTH_KV;
        if (l) {
          const u = `health:${c.type}:${c.processedAt}`, f = t.env.ENC_KEY ? await Te(t.env.ENC_KEY) : null, g = f ? await vt(f, c) : JSON.stringify(c), E = gt(
            c.type,
            t.env.ENVIRONMENT
          );
          await l.put(u, g, { expirationTtl: E });
        }
        s.push(c);
      } catch (o) {
        n.push(`${i.type}: ${o.message}`);
      }
    const a = t.res.headers.get("X-Correlation-Id") || "";
    return await Dt(t.env, {
      type: "health_data_batch_processed",
      actor: "enhanced_processor",
      resource: "kv:health",
      meta: {
        correlationId: a,
        totalMetrics: r.data.metrics.length,
        successCount: s.length,
        errorCount: n.length
      }
    }), t.json(
      {
        ok: !0,
        processed: s.length,
        total: r.data.metrics.length,
        data: s,
        errors: n.length > 0 ? n : void 0
      },
      201
    );
  } catch (s) {
    return ve.error("Batch processing failed", {
      error: s.message,
      batchSize: r.data.metrics.length
    }), t.json({ error: "batch_processing_failed" }, 500);
  }
});
L.get("/api/health-data/analytics/:userId", async (t) => {
  const e = t.req.param("userId");
  if (!e)
    return t.json({ error: "user_id_required" }, 400);
  try {
    const r = t.env.HEALTH_KV;
    if (!r || typeof r.list != "function" || typeof r.get != "function")
      return t.json({ ok: !0, analytics: null });
    const n = await r.list({ prefix: "health:", limit: 100 }), a = t.env.ENC_KEY, i = a ? await Te(a) : null, o = [];
    for (const l of n.keys) {
      const u = await r.get(l.name);
      if (!u) continue;
      const f = i ? await (async () => {
        try {
          return await Lt(i, u);
        } catch {
          return null;
        }
      })() : (() => {
        try {
          return JSON.parse(u);
        } catch {
          return null;
        }
      })();
      if (!f) continue;
      const g = _t.safeParse(f);
      if (!g.success) continue;
      const E = g.data;
      E.source.userId === e && o.push(E);
    }
    const c = hn(o);
    return t.json({ ok: !0, analytics: c });
  } catch (r) {
    return ve.error("Analytics calculation failed", {
      error: r.message,
      userId: e
    }), t.json({ error: "analytics_failed" }, 500);
  }
});
async function Gr(t, e, r) {
  const s = t.env.HEALTH_KV;
  if (!s || !r || typeof s.list != "function" || typeof s.get != "function")
    return [];
  try {
    const n = `health:${e}:`, a = await s.list({ prefix: n, limit: 30 }), i = t.env.ENC_KEY, o = i ? await Te(i) : null, c = [];
    for (const l of a.keys) {
      const u = await s.get(l.name);
      if (!u) continue;
      const f = o ? await (async () => {
        try {
          return await Lt(o, u);
        } catch {
          return null;
        }
      })() : (() => {
        try {
          return JSON.parse(u);
        } catch {
          return null;
        }
      })();
      if (!f) continue;
      const g = _t.safeParse(f);
      if (!g.success) continue;
      const E = g.data;
      E.source.userId === r && c.push(E);
    }
    return c.sort(
      (l, u) => new Date(u.processedAt).getTime() - new Date(l.processedAt).getTime()
    );
  } catch {
    return [];
  }
}
function hn(t) {
  const e = Date.now(), r = t.filter(
    (u) => e - new Date(u.processedAt).getTime() < 1440 * 60 * 1e3
  ), s = t.filter(
    (u) => e - new Date(u.processedAt).getTime() < 10080 * 60 * 1e3
  ), n = t.length > 0 ? t.filter((u) => u.healthScore !== void 0).reduce((u, f) => u + (f.healthScore || 0), 0) / t.filter((u) => u.healthScore !== void 0).length : 0, a = t.filter(
    (u) => {
      var f;
      return ((f = u.alert) == null ? void 0 : f.level) === "critical";
    }
  ).length, i = t.filter((u) => {
    var f;
    return ((f = u.alert) == null ? void 0 : f.level) === "warning";
  }).length, o = {
    low: t.filter((u) => u.fallRisk === "low").length,
    moderate: t.filter((u) => u.fallRisk === "moderate").length,
    high: t.filter((u) => u.fallRisk === "high").length,
    critical: t.filter((u) => u.fallRisk === "critical").length
  }, c = [...new Set(t.map((u) => u.type))], l = t.length > 0 && t.some((u) => u.dataQuality) ? t.filter((u) => u.dataQuality).reduce(
    (u, f) => u + (f.dataQuality.completeness + f.dataQuality.accuracy + f.dataQuality.timeliness + f.dataQuality.consistency) / 4,
    0
  ) / t.filter((u) => u.dataQuality).length : 0;
  return {
    totalDataPoints: t.length,
    last24Hours: r.length,
    last7Days: s.length,
    averageHealthScore: Math.round(n * 10) / 10,
    alerts: {
      critical: a,
      warning: i,
      total: a + i
    },
    fallRiskDistribution: o,
    metricTypes: c,
    dataQualityScore: Math.round(l * 10) / 10,
    lastUpdated: t.length > 0 ? t.sort(
      (u, f) => new Date(f.processedAt).getTime() - new Date(u.processedAt).getTime()
    )[0].processedAt : null
  };
}
L.get("/api/health-data", async (t) => {
  const e = W({
    from: T().datetime().optional(),
    to: T().datetime().optional(),
    metric: Ht.shape.type.optional(),
    limit: Tr.number().min(1).max(500).optional(),
    cursor: T().optional()
  }), r = new URL(t.req.url), s = Object.fromEntries(r.searchParams.entries()), n = e.safeParse(s);
  if (!n.success)
    return t.json(
      { error: "validation_error", details: n.error.flatten() },
      400
    );
  const { from: a, to: i, metric: o, cursor: c } = n.data, l = n.data.limit ?? 100, u = t.env.HEALTH_KV;
  if (!u || typeof u.list != "function" || typeof u.get != "function")
    return t.json({ ok: !0, data: [] });
  const f = o ? `health:${o}:` : "health:";
  try {
    const g = await u.list({ prefix: f, limit: l, cursor: c }), E = t.env.ENC_KEY, C = E ? await Te(E) : null, O = [];
    for (const P of g.keys) {
      const M = await u.get(P.name);
      if (!M) continue;
      const G = C ? await (async () => {
        try {
          return await Lt(C, M);
        } catch {
          return null;
        }
      })() : (() => {
        try {
          return JSON.parse(M);
        } catch {
          return null;
        }
      })();
      if (!G) continue;
      const ae = _t.safeParse(G);
      if (!ae.success) continue;
      const H = ae.data;
      if (!(a && new Date(H.processedAt).getTime() < new Date(a).getTime()) && !(i && new Date(H.processedAt).getTime() > new Date(i).getTime()) && (O.push(H), O.length >= l))
        break;
    }
    return O.sort((P, M) => P.processedAt < M.processedAt ? 1 : -1), t.json({
      ok: !0,
      data: O,
      nextCursor: g.list_complete ? void 0 : g.cursor,
      hasMore: g.list_complete === !1
    });
  } catch (g) {
    return ve.error("KV read failed", { error: g.message }), t.json({ error: "server_error" }, 500);
  }
});
L.post("/api/health-data", async (t) => {
  let e;
  try {
    e = await t.req.json();
  } catch {
    return t.json({ error: "invalid_json" }, 400);
  }
  const r = _t.safeParse(e);
  if (!r.success)
    return t.json(
      { error: "validation_error", details: r.error.flatten() },
      400
    );
  try {
    const s = t.env.HEALTH_KV;
    if (s) {
      const a = `health:${r.data.type}:${r.data.processedAt}`, i = t.env.ENC_KEY ? await Te(t.env.ENC_KEY) : null, o = i ? await vt(i, r.data) : JSON.stringify(r.data), c = gt(r.data.type, t.env.ENVIRONMENT);
      await s.put(a, o, { expirationTtl: c });
    }
    const n = t.res.headers.get("X-Correlation-Id") || "";
    await Dt(t.env, {
      type: "health_data_created",
      actor: "api",
      resource: "kv:health",
      meta: { type: r.data.type, correlationId: n }
    });
  } catch (s) {
    return ve.error("KV write failed", { error: s.message }), t.json({ error: "server_error" }, 500);
  }
  return t.json({ ok: !0, data: r.data }, 201);
});
L.get("*", async (t) => {
  const e = new URL("/index.html", t.req.url);
  return t.env.ASSETS ? t.env.ASSETS.fetch(new Request(e.toString(), t.req.raw)) : t.text("Not Found", 404);
});
async function gn(t, e, r) {
  const s = e.HEALTH_KV;
  s && r.waitUntil(xr(e, s));
}
class vn {
  constructor(e) {
    _(this, "storage");
    this.storage = e.storage;
  }
  async fetch(e) {
    const r = new URL(e.url), s = r.searchParams.get("key") || "anon", n = Number(r.searchParams.get("limit") || 60), a = Number(r.searchParams.get("intervalMs") || 6e4), i = r.searchParams.get("probe") === "1", o = Date.now(), c = await this.storage.get(s), l = c && typeof c.tokens == "number" && typeof c.last == "number" ? { tokens: c.tokens, last: c.last } : { tokens: n, last: o }, u = o - l.last, f = Math.floor(u / a) * n;
    return l.tokens = Math.min(n, l.tokens + f), l.last = o, !i && l.tokens <= 0 ? (await this.storage.put(s, l), new Response(JSON.stringify({ ok: !1 }), {
      status: 429,
      headers: { "content-type": "application/json" }
    })) : (i || (l.tokens -= 1, await this.storage.put(s, l)), new Response(
      JSON.stringify({ ok: !0, remaining: l.tokens }),
      { status: 200, headers: { "content-type": "application/json" } }
    ));
  }
}
class _n {
  constructor(e, r) {
  }
  async fetch(e) {
    return new Response(
      "WebSocket not available on Worker. Use local bridge.",
      {
        status: 426,
        headers: { "content-type": "text/plain" }
      }
    );
  }
}
export {
  _n as HealthWebSocket,
  vn as RateLimiter,
  L as default,
  gn as scheduled
};
//# sourceMappingURL=index.js.map

var Xr = Object.defineProperty;
var Wt = (t) => {
  throw TypeError(t);
};
var es = (t, e, r) => e in t ? Xr(t, e, { enumerable: !0, configurable: !0, writable: !0, value: r }) : t[e] = r;
var v = (t, e, r) => es(t, typeof e != "symbol" ? e + "" : e, r), Et = (t, e, r) => e.has(t) || Wt("Cannot " + r);
var u = (t, e, r) => (Et(t, e, "read from private field"), r ? r.call(t) : e.get(t)), k = (t, e, r) => e.has(t) ? Wt("Cannot add the same private member more than once") : e instanceof WeakSet ? e.add(t) : e.set(t, r), _ = (t, e, r, s) => (Et(t, e, "write to private field"), s ? s.call(t, r) : e.set(t, r), r), I = (t, e, r) => (Et(t, e, "access private method"), r);
var Kt = (t, e, r, s) => ({
  set _(n) {
    _(t, e, n, r);
  },
  get _() {
    return u(t, e, s);
  }
});
class xr {
  /**
   * Process a single health metric into structured analytics
   */
  static async processHealthMetric(e, r) {
    const s = (/* @__PURE__ */ new Date()).toISOString(), n = crypto.randomUUID(), a = this.validateMetric(e), i = this.calculateHealthScore(e, r), o = this.assessFallRisk(e, r), c = this.analyzeTrend(e, r), l = this.detectAnomaly(e, r), d = this.generateAlert(
      e,
      i,
      o,
      l
    ), h = this.assessDataQuality(e, r);
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
      alert: d,
      source: {
        deviceId: e.deviceId || "unknown",
        userId: e.userId || "unknown",
        collectedAt: e.timestamp || (/* @__PURE__ */ new Date()).toISOString(),
        processingPipeline: "enhanced-analytics-v1"
      },
      dataQuality: h
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
const ue = 1440 * 60, ts = {
  heart_rate: 30 * ue,
  steps: 30 * ue,
  walking_steadiness: 180 * ue,
  sleep: 90 * ue,
  activity: 90 * ue,
  fall_event: 365 * ue
};
function bt(t, e) {
  const r = ts[t] ?? 30 * ue;
  return e && e !== "production" ? Math.min(r, 2 * ue) : r;
}
async function Ar(t, e, r) {
  const s = Math.max(1, Math.min(2e3, (r == null ? void 0 : r.limit) ?? 1e3)), n = (r == null ? void 0 : r.prefix) ?? "health:", a = await e.list({ prefix: n, limit: s }), i = Date.now();
  let o = 0, c = 0;
  for (const l of a.keys) {
    o += 1;
    const d = l.name.split(":");
    if (d.length < 3) continue;
    const h = d[1], y = d.slice(2).join(":"), T = bt(h, t.ENVIRONMENT), O = Date.parse(y);
    if (!Number.isFinite(O)) continue;
    const R = O + T * 1e3;
    if (i > R)
      try {
        await e.delete(l.name), c += 1;
      } catch {
      }
  }
  return { scanned: o, deleted: c };
}
const W = {
  info: (t, e) => console.log(t, It(e)),
  warn: (t, e) => console.warn(t, It(e)),
  error: (t, e) => console.error(t, It(e))
};
function It(t) {
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
function Ft(t, e) {
  const r = new Headers(), s = t && e.includes(t) ? t : "";
  return s && (r.set("Access-Control-Allow-Origin", s), r.set("Vary", "Origin"), r.set("Access-Control-Allow-Credentials", "true"), r.set("Access-Control-Allow-Headers", "authorization, content-type"), r.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS")), r;
}
async function Er(t, e = {}) {
  try {
    const r = t.split(".");
    if (r.length !== 3) return { ok: !1 };
    const s = JSON.parse(atob(r[1])), n = Math.floor(Date.now() / 1e3), a = e.clockSkewSec ?? 60;
    return typeof s.exp == "number" && n > s.exp + a ? { ok: !1 } : typeof s.nbf == "number" && n + a < s.nbf ? { ok: !1 } : e.iss && s.iss !== e.iss ? { ok: !1 } : e.aud && s.aud !== e.aud ? { ok: !1 } : { ok: !0, sub: s.sub, claims: s };
  } catch {
    return { ok: !1 };
  }
}
function dt(t) {
  const e = t.length % 4 === 0 ? "" : "=".repeat(4 - t.length % 4), r = t.replace(/-/g, "+").replace(/_/g, "/") + e, s = atob(r), n = new Uint8Array(s.length);
  for (let a = 0; a < s.length; a++) n[a] = s.charCodeAt(a);
  return n;
}
const Jt = /* @__PURE__ */ new Map();
async function rs(t, e) {
  const r = t, s = Date.now(), n = Jt.get(r);
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
    return Jt.set(r, {
      fetchedAt: s,
      ttlMs: 300 * 1e3,
      keys: o
    }), o[e] || null;
  } catch {
    return null;
  }
}
async function Ir(t, e) {
  try {
    const [r, s, n] = t.split(".");
    if (!r || !s || !n) return { ok: !1 };
    const a = JSON.parse(new TextDecoder().decode(dt(r)));
    if (a.alg !== "RS256" || !a.kid) return { ok: !1 };
    const i = await rs(e.jwksUrl, a.kid);
    if (!i) return { ok: !1 };
    const o = new TextEncoder().encode(`${r}.${s}`), c = dt(n), l = new Uint8Array(o.length);
    l.set(o);
    const d = new Uint8Array(c.length);
    if (d.set(c), !await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      i,
      d,
      l
    )) return { ok: !1 };
    const y = JSON.parse(
      new TextDecoder().decode(dt(s))
    ), T = Math.floor(Date.now() / 1e3), O = e.clockSkewSec ?? 60;
    return typeof y.exp == "number" && T > y.exp + O ? { ok: !1 } : typeof y.nbf == "number" && T + O < y.nbf ? { ok: !1 } : e.iss && y.iss !== e.iss ? { ok: !1 } : e.aud && y.aud !== e.aud ? { ok: !1 } : {
      ok: !0,
      sub: y.sub,
      claims: y
    };
  } catch {
    return { ok: !1 };
  }
}
function Vt(t) {
  try {
    const e = t.split(".");
    return e.length < 2 ? null : JSON.parse(
      new TextDecoder().decode(dt(e[1]))
    );
  } catch {
    return null;
  }
}
async function kt(t, e) {
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
    W.warn("audit_write_failed", { error: r.message });
  }
}
async function ce(t) {
  const e = Uint8Array.from(atob(t), (r) => r.charCodeAt(0));
  if (e.byteLength !== 32)
    throw new Error("ENC_KEY must be 32 bytes (base64)");
  return crypto.subtle.importKey("raw", e, { name: "AES-GCM" }, !1, [
    "encrypt",
    "decrypt"
  ]);
}
async function ot(t, e) {
  const r = crypto.getRandomValues(new Uint8Array(12)), s = new TextEncoder().encode(JSON.stringify(e)), n = await crypto.subtle.encrypt({ name: "AES-GCM", iv: r }, t, s), a = new Uint8Array(r.byteLength + n.byteLength);
  return a.set(r, 0), a.set(new Uint8Array(n), r.byteLength), btoa(String.fromCharCode(...a));
}
async function St(t, e) {
  const r = Uint8Array.from(atob(e), (i) => i.charCodeAt(0)), s = r.slice(0, 12), n = r.slice(12), a = await crypto.subtle.decrypt({ name: "AES-GCM", iv: s }, t, n);
  return JSON.parse(new TextDecoder().decode(a));
}
function Rt(t) {
  return btoa(String.fromCharCode(...t)).replace(/=+$/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
async function ss(t, e, r = {}) {
  const s = new TextEncoder(), n = { alg: "HS256", typ: "JWT", ...r }, a = Rt(s.encode(JSON.stringify(n))), i = Rt(s.encode(JSON.stringify(t))), o = `${a}.${i}`, c = await crypto.subtle.importKey(
    "raw",
    s.encode(e),
    { name: "HMAC", hash: "SHA-256" },
    !1,
    ["sign"]
  ), l = await crypto.subtle.sign("HMAC", c, s.encode(o)), d = Rt(new Uint8Array(l));
  return `${o}.${d}`;
}
var E;
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
})(E || (E = {}));
var Gt;
(function(t) {
  t.mergeShapes = (e, r) => ({
    ...e,
    ...r
    // second overwrites first
  });
})(Gt || (Gt = {}));
const p = E.arrayToEnum([
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
]), he = (t) => {
  switch (typeof t) {
    case "undefined":
      return p.undefined;
    case "string":
      return p.string;
    case "number":
      return Number.isNaN(t) ? p.nan : p.number;
    case "boolean":
      return p.boolean;
    case "function":
      return p.function;
    case "bigint":
      return p.bigint;
    case "symbol":
      return p.symbol;
    case "object":
      return Array.isArray(t) ? p.array : t === null ? p.null : t.then && typeof t.then == "function" && t.catch && typeof t.catch == "function" ? p.promise : typeof Map < "u" && t instanceof Map ? p.map : typeof Set < "u" && t instanceof Set ? p.set : typeof Date < "u" && t instanceof Date ? p.date : p.object;
    default:
      return p.unknown;
  }
}, f = E.arrayToEnum([
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
class ie extends Error {
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
    if (!(e instanceof ie))
      throw new Error(`Not a ZodError: ${e}`);
  }
  toString() {
    return this.message;
  }
  get message() {
    return JSON.stringify(this.issues, E.jsonStringifyReplacer, 2);
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
ie.create = (t) => new ie(t);
const Dt = (t, e) => {
  let r;
  switch (t.code) {
    case f.invalid_type:
      t.received === p.undefined ? r = "Required" : r = `Expected ${t.expected}, received ${t.received}`;
      break;
    case f.invalid_literal:
      r = `Invalid literal value, expected ${JSON.stringify(t.expected, E.jsonStringifyReplacer)}`;
      break;
    case f.unrecognized_keys:
      r = `Unrecognized key(s) in object: ${E.joinValues(t.keys, ", ")}`;
      break;
    case f.invalid_union:
      r = "Invalid input";
      break;
    case f.invalid_union_discriminator:
      r = `Invalid discriminator value. Expected ${E.joinValues(t.options)}`;
      break;
    case f.invalid_enum_value:
      r = `Invalid enum value. Expected ${E.joinValues(t.options)}, received '${t.received}'`;
      break;
    case f.invalid_arguments:
      r = "Invalid function arguments";
      break;
    case f.invalid_return_type:
      r = "Invalid function return type";
      break;
    case f.invalid_date:
      r = "Invalid date";
      break;
    case f.invalid_string:
      typeof t.validation == "object" ? "includes" in t.validation ? (r = `Invalid input: must include "${t.validation.includes}"`, typeof t.validation.position == "number" && (r = `${r} at one or more positions greater than or equal to ${t.validation.position}`)) : "startsWith" in t.validation ? r = `Invalid input: must start with "${t.validation.startsWith}"` : "endsWith" in t.validation ? r = `Invalid input: must end with "${t.validation.endsWith}"` : E.assertNever(t.validation) : t.validation !== "regex" ? r = `Invalid ${t.validation}` : r = "Invalid";
      break;
    case f.too_small:
      t.type === "array" ? r = `Array must contain ${t.exact ? "exactly" : t.inclusive ? "at least" : "more than"} ${t.minimum} element(s)` : t.type === "string" ? r = `String must contain ${t.exact ? "exactly" : t.inclusive ? "at least" : "over"} ${t.minimum} character(s)` : t.type === "number" ? r = `Number must be ${t.exact ? "exactly equal to " : t.inclusive ? "greater than or equal to " : "greater than "}${t.minimum}` : t.type === "bigint" ? r = `Number must be ${t.exact ? "exactly equal to " : t.inclusive ? "greater than or equal to " : "greater than "}${t.minimum}` : t.type === "date" ? r = `Date must be ${t.exact ? "exactly equal to " : t.inclusive ? "greater than or equal to " : "greater than "}${new Date(Number(t.minimum))}` : r = "Invalid input";
      break;
    case f.too_big:
      t.type === "array" ? r = `Array must contain ${t.exact ? "exactly" : t.inclusive ? "at most" : "less than"} ${t.maximum} element(s)` : t.type === "string" ? r = `String must contain ${t.exact ? "exactly" : t.inclusive ? "at most" : "under"} ${t.maximum} character(s)` : t.type === "number" ? r = `Number must be ${t.exact ? "exactly" : t.inclusive ? "less than or equal to" : "less than"} ${t.maximum}` : t.type === "bigint" ? r = `BigInt must be ${t.exact ? "exactly" : t.inclusive ? "less than or equal to" : "less than"} ${t.maximum}` : t.type === "date" ? r = `Date must be ${t.exact ? "exactly" : t.inclusive ? "smaller than or equal to" : "smaller than"} ${new Date(Number(t.maximum))}` : r = "Invalid input";
      break;
    case f.custom:
      r = "Invalid input";
      break;
    case f.invalid_intersection_types:
      r = "Intersection results could not be merged";
      break;
    case f.not_multiple_of:
      r = `Number must be a multiple of ${t.multipleOf}`;
      break;
    case f.not_finite:
      r = "Number must be finite";
      break;
    default:
      r = e.defaultError, E.assertNever(t);
  }
  return { message: r };
};
let ns = Dt;
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
function m(t, e) {
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
      r === Dt ? void 0 : Dt
      // then global default map
    ].filter((n) => !!n)
  });
  t.common.issues.push(s);
}
class z {
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
    return z.mergeObjectSync(e, s);
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
}), Ye = (t) => ({ status: "dirty", value: t }), K = (t) => ({ status: "valid", value: t }), Yt = (t) => t.status === "aborted", Qt = (t) => t.status === "dirty", qe = (t) => t.status === "valid", mt = (t) => typeof Promise < "u" && t instanceof Promise;
var g;
(function(t) {
  t.errToObj = (e) => typeof e == "string" ? { message: e } : e || {}, t.toString = (e) => typeof e == "string" ? e : e == null ? void 0 : e.message;
})(g || (g = {}));
class we {
  constructor(e, r, s, n) {
    this._cachedPath = [], this.parent = e, this.data = r, this._path = s, this._key = n;
  }
  get path() {
    return this._cachedPath.length || (Array.isArray(this._key) ? this._cachedPath.push(...this._path, ...this._key) : this._cachedPath.push(...this._path, this._key)), this._cachedPath;
  }
}
const Xt = (t, e) => {
  if (qe(e))
    return { success: !0, data: e.value };
  if (!t.common.issues.length)
    throw new Error("Validation failed but no issues detected.");
  return {
    success: !1,
    get error() {
      if (this._error)
        return this._error;
      const r = new ie(t.common.issues);
      return this._error = r, this._error;
    }
  };
};
function S(t) {
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
class A {
  get description() {
    return this._def.description;
  }
  _getType(e) {
    return he(e.data);
  }
  _getOrReturnCtx(e, r) {
    return r || {
      common: e.parent.common,
      data: e.data,
      parsedType: he(e.data),
      schemaErrorMap: this._def.errorMap,
      path: e.path,
      parent: e.parent
    };
  }
  _processInputParams(e) {
    return {
      status: new z(),
      ctx: {
        common: e.parent.common,
        data: e.data,
        parsedType: he(e.data),
        schemaErrorMap: this._def.errorMap,
        path: e.path,
        parent: e.parent
      }
    };
  }
  _parseSync(e) {
    const r = this._parse(e);
    if (mt(r))
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
      parsedType: he(e)
    }, n = this._parseSync({ data: e, path: s.path, parent: s });
    return Xt(s, n);
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
      parsedType: he(e)
    };
    if (!this["~standard"].async)
      try {
        const a = this._parseSync({ data: e, path: [], parent: r });
        return qe(a) ? {
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
    return this._parseAsync({ data: e, path: [], parent: r }).then((a) => qe(a) ? {
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
      parsedType: he(e)
    }, n = this._parse({ data: e, path: s.path, parent: s }), a = await (mt(n) ? n : Promise.resolve(n));
    return Xt(s, a);
  }
  refine(e, r) {
    const s = (n) => typeof r == "string" || typeof r > "u" ? { message: r } : typeof r == "function" ? r(n) : r;
    return this._refinement((n, a) => {
      const i = e(n), o = () => a.addIssue({
        code: f.custom,
        ...s(n)
      });
      return typeof Promise < "u" && i instanceof Promise ? i.then((c) => c ? !0 : (o(), !1)) : i ? !0 : (o(), !1);
    });
  }
  refinement(e, r) {
    return this._refinement((s, n) => e(s) ? !0 : (n.addIssue(typeof r == "function" ? r(s, n) : r), !1));
  }
  _refinement(e) {
    return new Ke({
      schema: this,
      typeName: b.ZodEffects,
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
    return _e.create(this, this._def);
  }
  nullable() {
    return Fe.create(this, this._def);
  }
  nullish() {
    return this.nullable().optional();
  }
  array() {
    return X.create(this);
  }
  promise() {
    return vt.create(this, this._def);
  }
  or(e) {
    return gt.create([this, e], this._def);
  }
  and(e) {
    return yt.create(this, e, this._def);
  }
  transform(e) {
    return new Ke({
      ...S(this._def),
      schema: this,
      typeName: b.ZodEffects,
      effect: { type: "transform", transform: e }
    });
  }
  default(e) {
    const r = typeof e == "function" ? e : () => e;
    return new Pt({
      ...S(this._def),
      innerType: this,
      defaultValue: r,
      typeName: b.ZodDefault
    });
  }
  brand() {
    return new Ts({
      typeName: b.ZodBranded,
      type: this,
      ...S(this._def)
    });
  }
  catch(e) {
    const r = typeof e == "function" ? e : () => e;
    return new Lt({
      ...S(this._def),
      innerType: this,
      catchValue: r,
      typeName: b.ZodCatch
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
    return $t.create(this);
  }
  isOptional() {
    return this.safeParse(void 0).success;
  }
  isNullable() {
    return this.safeParse(null).success;
  }
}
const os = /^c[^\s-]{8,}$/i, cs = /^[0-9a-z]+$/, ls = /^[0-9A-HJKMNP-TV-Z]{26}$/i, ds = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i, us = /^[a-z0-9_-]{21}$/i, hs = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/, fs = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/, ms = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i, ps = "^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$";
let Tt;
const gs = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/, ys = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/, vs = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/, _s = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/, ws = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/, bs = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/, Rr = "((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))", ks = new RegExp(`^${Rr}$`);
function Tr(t) {
  let e = "[0-5]\\d";
  t.precision ? e = `${e}\\.\\d{${t.precision}}` : t.precision == null && (e = `${e}(\\.\\d+)?`);
  const r = t.precision ? "+" : "?";
  return `([01]\\d|2[0-3]):[0-5]\\d(:${e})${r}`;
}
function Ss(t) {
  return new RegExp(`^${Tr(t)}$`);
}
function xs(t) {
  let e = `${Rr}T${Tr(t)}`;
  const r = [];
  return r.push(t.local ? "Z?" : "Z"), t.offset && r.push("([+-]\\d{2}:?\\d{2})"), e = `${e}(${r.join("|")})`, new RegExp(`^${e}$`);
}
function As(t, e) {
  return !!((e === "v4" || !e) && gs.test(t) || (e === "v6" || !e) && vs.test(t));
}
function Es(t, e) {
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
function Is(t, e) {
  return !!((e === "v4" || !e) && ys.test(t) || (e === "v6" || !e) && _s.test(t));
}
class ae extends A {
  _parse(e) {
    if (this._def.coerce && (e.data = String(e.data)), this._getType(e) !== p.string) {
      const a = this._getOrReturnCtx(e);
      return m(a, {
        code: f.invalid_type,
        expected: p.string,
        received: a.parsedType
      }), w;
    }
    const s = new z();
    let n;
    for (const a of this._def.checks)
      if (a.kind === "min")
        e.data.length < a.value && (n = this._getOrReturnCtx(e, n), m(n, {
          code: f.too_small,
          minimum: a.value,
          type: "string",
          inclusive: !0,
          exact: !1,
          message: a.message
        }), s.dirty());
      else if (a.kind === "max")
        e.data.length > a.value && (n = this._getOrReturnCtx(e, n), m(n, {
          code: f.too_big,
          maximum: a.value,
          type: "string",
          inclusive: !0,
          exact: !1,
          message: a.message
        }), s.dirty());
      else if (a.kind === "length") {
        const i = e.data.length > a.value, o = e.data.length < a.value;
        (i || o) && (n = this._getOrReturnCtx(e, n), i ? m(n, {
          code: f.too_big,
          maximum: a.value,
          type: "string",
          inclusive: !0,
          exact: !0,
          message: a.message
        }) : o && m(n, {
          code: f.too_small,
          minimum: a.value,
          type: "string",
          inclusive: !0,
          exact: !0,
          message: a.message
        }), s.dirty());
      } else if (a.kind === "email")
        ms.test(e.data) || (n = this._getOrReturnCtx(e, n), m(n, {
          validation: "email",
          code: f.invalid_string,
          message: a.message
        }), s.dirty());
      else if (a.kind === "emoji")
        Tt || (Tt = new RegExp(ps, "u")), Tt.test(e.data) || (n = this._getOrReturnCtx(e, n), m(n, {
          validation: "emoji",
          code: f.invalid_string,
          message: a.message
        }), s.dirty());
      else if (a.kind === "uuid")
        ds.test(e.data) || (n = this._getOrReturnCtx(e, n), m(n, {
          validation: "uuid",
          code: f.invalid_string,
          message: a.message
        }), s.dirty());
      else if (a.kind === "nanoid")
        us.test(e.data) || (n = this._getOrReturnCtx(e, n), m(n, {
          validation: "nanoid",
          code: f.invalid_string,
          message: a.message
        }), s.dirty());
      else if (a.kind === "cuid")
        os.test(e.data) || (n = this._getOrReturnCtx(e, n), m(n, {
          validation: "cuid",
          code: f.invalid_string,
          message: a.message
        }), s.dirty());
      else if (a.kind === "cuid2")
        cs.test(e.data) || (n = this._getOrReturnCtx(e, n), m(n, {
          validation: "cuid2",
          code: f.invalid_string,
          message: a.message
        }), s.dirty());
      else if (a.kind === "ulid")
        ls.test(e.data) || (n = this._getOrReturnCtx(e, n), m(n, {
          validation: "ulid",
          code: f.invalid_string,
          message: a.message
        }), s.dirty());
      else if (a.kind === "url")
        try {
          new URL(e.data);
        } catch {
          n = this._getOrReturnCtx(e, n), m(n, {
            validation: "url",
            code: f.invalid_string,
            message: a.message
          }), s.dirty();
        }
      else a.kind === "regex" ? (a.regex.lastIndex = 0, a.regex.test(e.data) || (n = this._getOrReturnCtx(e, n), m(n, {
        validation: "regex",
        code: f.invalid_string,
        message: a.message
      }), s.dirty())) : a.kind === "trim" ? e.data = e.data.trim() : a.kind === "includes" ? e.data.includes(a.value, a.position) || (n = this._getOrReturnCtx(e, n), m(n, {
        code: f.invalid_string,
        validation: { includes: a.value, position: a.position },
        message: a.message
      }), s.dirty()) : a.kind === "toLowerCase" ? e.data = e.data.toLowerCase() : a.kind === "toUpperCase" ? e.data = e.data.toUpperCase() : a.kind === "startsWith" ? e.data.startsWith(a.value) || (n = this._getOrReturnCtx(e, n), m(n, {
        code: f.invalid_string,
        validation: { startsWith: a.value },
        message: a.message
      }), s.dirty()) : a.kind === "endsWith" ? e.data.endsWith(a.value) || (n = this._getOrReturnCtx(e, n), m(n, {
        code: f.invalid_string,
        validation: { endsWith: a.value },
        message: a.message
      }), s.dirty()) : a.kind === "datetime" ? xs(a).test(e.data) || (n = this._getOrReturnCtx(e, n), m(n, {
        code: f.invalid_string,
        validation: "datetime",
        message: a.message
      }), s.dirty()) : a.kind === "date" ? ks.test(e.data) || (n = this._getOrReturnCtx(e, n), m(n, {
        code: f.invalid_string,
        validation: "date",
        message: a.message
      }), s.dirty()) : a.kind === "time" ? Ss(a).test(e.data) || (n = this._getOrReturnCtx(e, n), m(n, {
        code: f.invalid_string,
        validation: "time",
        message: a.message
      }), s.dirty()) : a.kind === "duration" ? fs.test(e.data) || (n = this._getOrReturnCtx(e, n), m(n, {
        validation: "duration",
        code: f.invalid_string,
        message: a.message
      }), s.dirty()) : a.kind === "ip" ? As(e.data, a.version) || (n = this._getOrReturnCtx(e, n), m(n, {
        validation: "ip",
        code: f.invalid_string,
        message: a.message
      }), s.dirty()) : a.kind === "jwt" ? Es(e.data, a.alg) || (n = this._getOrReturnCtx(e, n), m(n, {
        validation: "jwt",
        code: f.invalid_string,
        message: a.message
      }), s.dirty()) : a.kind === "cidr" ? Is(e.data, a.version) || (n = this._getOrReturnCtx(e, n), m(n, {
        validation: "cidr",
        code: f.invalid_string,
        message: a.message
      }), s.dirty()) : a.kind === "base64" ? ws.test(e.data) || (n = this._getOrReturnCtx(e, n), m(n, {
        validation: "base64",
        code: f.invalid_string,
        message: a.message
      }), s.dirty()) : a.kind === "base64url" ? bs.test(e.data) || (n = this._getOrReturnCtx(e, n), m(n, {
        validation: "base64url",
        code: f.invalid_string,
        message: a.message
      }), s.dirty()) : E.assertNever(a);
    return { status: s.value, value: e.data };
  }
  _regex(e, r, s) {
    return this.refinement((n) => e.test(n), {
      validation: r,
      code: f.invalid_string,
      ...g.errToObj(s)
    });
  }
  _addCheck(e) {
    return new ae({
      ...this._def,
      checks: [...this._def.checks, e]
    });
  }
  email(e) {
    return this._addCheck({ kind: "email", ...g.errToObj(e) });
  }
  url(e) {
    return this._addCheck({ kind: "url", ...g.errToObj(e) });
  }
  emoji(e) {
    return this._addCheck({ kind: "emoji", ...g.errToObj(e) });
  }
  uuid(e) {
    return this._addCheck({ kind: "uuid", ...g.errToObj(e) });
  }
  nanoid(e) {
    return this._addCheck({ kind: "nanoid", ...g.errToObj(e) });
  }
  cuid(e) {
    return this._addCheck({ kind: "cuid", ...g.errToObj(e) });
  }
  cuid2(e) {
    return this._addCheck({ kind: "cuid2", ...g.errToObj(e) });
  }
  ulid(e) {
    return this._addCheck({ kind: "ulid", ...g.errToObj(e) });
  }
  base64(e) {
    return this._addCheck({ kind: "base64", ...g.errToObj(e) });
  }
  base64url(e) {
    return this._addCheck({
      kind: "base64url",
      ...g.errToObj(e)
    });
  }
  jwt(e) {
    return this._addCheck({ kind: "jwt", ...g.errToObj(e) });
  }
  ip(e) {
    return this._addCheck({ kind: "ip", ...g.errToObj(e) });
  }
  cidr(e) {
    return this._addCheck({ kind: "cidr", ...g.errToObj(e) });
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
      ...g.errToObj(e == null ? void 0 : e.message)
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
      ...g.errToObj(e == null ? void 0 : e.message)
    });
  }
  duration(e) {
    return this._addCheck({ kind: "duration", ...g.errToObj(e) });
  }
  regex(e, r) {
    return this._addCheck({
      kind: "regex",
      regex: e,
      ...g.errToObj(r)
    });
  }
  includes(e, r) {
    return this._addCheck({
      kind: "includes",
      value: e,
      position: r == null ? void 0 : r.position,
      ...g.errToObj(r == null ? void 0 : r.message)
    });
  }
  startsWith(e, r) {
    return this._addCheck({
      kind: "startsWith",
      value: e,
      ...g.errToObj(r)
    });
  }
  endsWith(e, r) {
    return this._addCheck({
      kind: "endsWith",
      value: e,
      ...g.errToObj(r)
    });
  }
  min(e, r) {
    return this._addCheck({
      kind: "min",
      value: e,
      ...g.errToObj(r)
    });
  }
  max(e, r) {
    return this._addCheck({
      kind: "max",
      value: e,
      ...g.errToObj(r)
    });
  }
  length(e, r) {
    return this._addCheck({
      kind: "length",
      value: e,
      ...g.errToObj(r)
    });
  }
  /**
   * Equivalent to `.min(1)`
   */
  nonempty(e) {
    return this.min(1, g.errToObj(e));
  }
  trim() {
    return new ae({
      ...this._def,
      checks: [...this._def.checks, { kind: "trim" }]
    });
  }
  toLowerCase() {
    return new ae({
      ...this._def,
      checks: [...this._def.checks, { kind: "toLowerCase" }]
    });
  }
  toUpperCase() {
    return new ae({
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
ae.create = (t) => new ae({
  checks: [],
  typeName: b.ZodString,
  coerce: (t == null ? void 0 : t.coerce) ?? !1,
  ...S(t)
});
function Rs(t, e) {
  const r = (t.toString().split(".")[1] || "").length, s = (e.toString().split(".")[1] || "").length, n = r > s ? r : s, a = Number.parseInt(t.toFixed(n).replace(".", "")), i = Number.parseInt(e.toFixed(n).replace(".", ""));
  return a % i / 10 ** n;
}
class Te extends A {
  constructor() {
    super(...arguments), this.min = this.gte, this.max = this.lte, this.step = this.multipleOf;
  }
  _parse(e) {
    if (this._def.coerce && (e.data = Number(e.data)), this._getType(e) !== p.number) {
      const a = this._getOrReturnCtx(e);
      return m(a, {
        code: f.invalid_type,
        expected: p.number,
        received: a.parsedType
      }), w;
    }
    let s;
    const n = new z();
    for (const a of this._def.checks)
      a.kind === "int" ? E.isInteger(e.data) || (s = this._getOrReturnCtx(e, s), m(s, {
        code: f.invalid_type,
        expected: "integer",
        received: "float",
        message: a.message
      }), n.dirty()) : a.kind === "min" ? (a.inclusive ? e.data < a.value : e.data <= a.value) && (s = this._getOrReturnCtx(e, s), m(s, {
        code: f.too_small,
        minimum: a.value,
        type: "number",
        inclusive: a.inclusive,
        exact: !1,
        message: a.message
      }), n.dirty()) : a.kind === "max" ? (a.inclusive ? e.data > a.value : e.data >= a.value) && (s = this._getOrReturnCtx(e, s), m(s, {
        code: f.too_big,
        maximum: a.value,
        type: "number",
        inclusive: a.inclusive,
        exact: !1,
        message: a.message
      }), n.dirty()) : a.kind === "multipleOf" ? Rs(e.data, a.value) !== 0 && (s = this._getOrReturnCtx(e, s), m(s, {
        code: f.not_multiple_of,
        multipleOf: a.value,
        message: a.message
      }), n.dirty()) : a.kind === "finite" ? Number.isFinite(e.data) || (s = this._getOrReturnCtx(e, s), m(s, {
        code: f.not_finite,
        message: a.message
      }), n.dirty()) : E.assertNever(a);
    return { status: n.value, value: e.data };
  }
  gte(e, r) {
    return this.setLimit("min", e, !0, g.toString(r));
  }
  gt(e, r) {
    return this.setLimit("min", e, !1, g.toString(r));
  }
  lte(e, r) {
    return this.setLimit("max", e, !0, g.toString(r));
  }
  lt(e, r) {
    return this.setLimit("max", e, !1, g.toString(r));
  }
  setLimit(e, r, s, n) {
    return new Te({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind: e,
          value: r,
          inclusive: s,
          message: g.toString(n)
        }
      ]
    });
  }
  _addCheck(e) {
    return new Te({
      ...this._def,
      checks: [...this._def.checks, e]
    });
  }
  int(e) {
    return this._addCheck({
      kind: "int",
      message: g.toString(e)
    });
  }
  positive(e) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: !1,
      message: g.toString(e)
    });
  }
  negative(e) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: !1,
      message: g.toString(e)
    });
  }
  nonpositive(e) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: !0,
      message: g.toString(e)
    });
  }
  nonnegative(e) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: !0,
      message: g.toString(e)
    });
  }
  multipleOf(e, r) {
    return this._addCheck({
      kind: "multipleOf",
      value: e,
      message: g.toString(r)
    });
  }
  finite(e) {
    return this._addCheck({
      kind: "finite",
      message: g.toString(e)
    });
  }
  safe(e) {
    return this._addCheck({
      kind: "min",
      inclusive: !0,
      value: Number.MIN_SAFE_INTEGER,
      message: g.toString(e)
    })._addCheck({
      kind: "max",
      inclusive: !0,
      value: Number.MAX_SAFE_INTEGER,
      message: g.toString(e)
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
    return !!this._def.checks.find((e) => e.kind === "int" || e.kind === "multipleOf" && E.isInteger(e.value));
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
Te.create = (t) => new Te({
  checks: [],
  typeName: b.ZodNumber,
  coerce: (t == null ? void 0 : t.coerce) || !1,
  ...S(t)
});
class Oe extends A {
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
    if (this._getType(e) !== p.bigint)
      return this._getInvalidInput(e);
    let s;
    const n = new z();
    for (const a of this._def.checks)
      a.kind === "min" ? (a.inclusive ? e.data < a.value : e.data <= a.value) && (s = this._getOrReturnCtx(e, s), m(s, {
        code: f.too_small,
        type: "bigint",
        minimum: a.value,
        inclusive: a.inclusive,
        message: a.message
      }), n.dirty()) : a.kind === "max" ? (a.inclusive ? e.data > a.value : e.data >= a.value) && (s = this._getOrReturnCtx(e, s), m(s, {
        code: f.too_big,
        type: "bigint",
        maximum: a.value,
        inclusive: a.inclusive,
        message: a.message
      }), n.dirty()) : a.kind === "multipleOf" ? e.data % a.value !== BigInt(0) && (s = this._getOrReturnCtx(e, s), m(s, {
        code: f.not_multiple_of,
        multipleOf: a.value,
        message: a.message
      }), n.dirty()) : E.assertNever(a);
    return { status: n.value, value: e.data };
  }
  _getInvalidInput(e) {
    const r = this._getOrReturnCtx(e);
    return m(r, {
      code: f.invalid_type,
      expected: p.bigint,
      received: r.parsedType
    }), w;
  }
  gte(e, r) {
    return this.setLimit("min", e, !0, g.toString(r));
  }
  gt(e, r) {
    return this.setLimit("min", e, !1, g.toString(r));
  }
  lte(e, r) {
    return this.setLimit("max", e, !0, g.toString(r));
  }
  lt(e, r) {
    return this.setLimit("max", e, !1, g.toString(r));
  }
  setLimit(e, r, s, n) {
    return new Oe({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind: e,
          value: r,
          inclusive: s,
          message: g.toString(n)
        }
      ]
    });
  }
  _addCheck(e) {
    return new Oe({
      ...this._def,
      checks: [...this._def.checks, e]
    });
  }
  positive(e) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: !1,
      message: g.toString(e)
    });
  }
  negative(e) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: !1,
      message: g.toString(e)
    });
  }
  nonpositive(e) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: !0,
      message: g.toString(e)
    });
  }
  nonnegative(e) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: !0,
      message: g.toString(e)
    });
  }
  multipleOf(e, r) {
    return this._addCheck({
      kind: "multipleOf",
      value: e,
      message: g.toString(r)
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
Oe.create = (t) => new Oe({
  checks: [],
  typeName: b.ZodBigInt,
  coerce: (t == null ? void 0 : t.coerce) ?? !1,
  ...S(t)
});
class pt extends A {
  _parse(e) {
    if (this._def.coerce && (e.data = !!e.data), this._getType(e) !== p.boolean) {
      const s = this._getOrReturnCtx(e);
      return m(s, {
        code: f.invalid_type,
        expected: p.boolean,
        received: s.parsedType
      }), w;
    }
    return K(e.data);
  }
}
pt.create = (t) => new pt({
  typeName: b.ZodBoolean,
  coerce: (t == null ? void 0 : t.coerce) || !1,
  ...S(t)
});
class Be extends A {
  _parse(e) {
    if (this._def.coerce && (e.data = new Date(e.data)), this._getType(e) !== p.date) {
      const a = this._getOrReturnCtx(e);
      return m(a, {
        code: f.invalid_type,
        expected: p.date,
        received: a.parsedType
      }), w;
    }
    if (Number.isNaN(e.data.getTime())) {
      const a = this._getOrReturnCtx(e);
      return m(a, {
        code: f.invalid_date
      }), w;
    }
    const s = new z();
    let n;
    for (const a of this._def.checks)
      a.kind === "min" ? e.data.getTime() < a.value && (n = this._getOrReturnCtx(e, n), m(n, {
        code: f.too_small,
        message: a.message,
        inclusive: !0,
        exact: !1,
        minimum: a.value,
        type: "date"
      }), s.dirty()) : a.kind === "max" ? e.data.getTime() > a.value && (n = this._getOrReturnCtx(e, n), m(n, {
        code: f.too_big,
        message: a.message,
        inclusive: !0,
        exact: !1,
        maximum: a.value,
        type: "date"
      }), s.dirty()) : E.assertNever(a);
    return {
      status: s.value,
      value: new Date(e.data.getTime())
    };
  }
  _addCheck(e) {
    return new Be({
      ...this._def,
      checks: [...this._def.checks, e]
    });
  }
  min(e, r) {
    return this._addCheck({
      kind: "min",
      value: e.getTime(),
      message: g.toString(r)
    });
  }
  max(e, r) {
    return this._addCheck({
      kind: "max",
      value: e.getTime(),
      message: g.toString(r)
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
Be.create = (t) => new Be({
  checks: [],
  coerce: (t == null ? void 0 : t.coerce) || !1,
  typeName: b.ZodDate,
  ...S(t)
});
class er extends A {
  _parse(e) {
    if (this._getType(e) !== p.symbol) {
      const s = this._getOrReturnCtx(e);
      return m(s, {
        code: f.invalid_type,
        expected: p.symbol,
        received: s.parsedType
      }), w;
    }
    return K(e.data);
  }
}
er.create = (t) => new er({
  typeName: b.ZodSymbol,
  ...S(t)
});
class tr extends A {
  _parse(e) {
    if (this._getType(e) !== p.undefined) {
      const s = this._getOrReturnCtx(e);
      return m(s, {
        code: f.invalid_type,
        expected: p.undefined,
        received: s.parsedType
      }), w;
    }
    return K(e.data);
  }
}
tr.create = (t) => new tr({
  typeName: b.ZodUndefined,
  ...S(t)
});
class rr extends A {
  _parse(e) {
    if (this._getType(e) !== p.null) {
      const s = this._getOrReturnCtx(e);
      return m(s, {
        code: f.invalid_type,
        expected: p.null,
        received: s.parsedType
      }), w;
    }
    return K(e.data);
  }
}
rr.create = (t) => new rr({
  typeName: b.ZodNull,
  ...S(t)
});
class sr extends A {
  constructor() {
    super(...arguments), this._any = !0;
  }
  _parse(e) {
    return K(e.data);
  }
}
sr.create = (t) => new sr({
  typeName: b.ZodAny,
  ...S(t)
});
class Nt extends A {
  constructor() {
    super(...arguments), this._unknown = !0;
  }
  _parse(e) {
    return K(e.data);
  }
}
Nt.create = (t) => new Nt({
  typeName: b.ZodUnknown,
  ...S(t)
});
class be extends A {
  _parse(e) {
    const r = this._getOrReturnCtx(e);
    return m(r, {
      code: f.invalid_type,
      expected: p.never,
      received: r.parsedType
    }), w;
  }
}
be.create = (t) => new be({
  typeName: b.ZodNever,
  ...S(t)
});
class nr extends A {
  _parse(e) {
    if (this._getType(e) !== p.undefined) {
      const s = this._getOrReturnCtx(e);
      return m(s, {
        code: f.invalid_type,
        expected: p.void,
        received: s.parsedType
      }), w;
    }
    return K(e.data);
  }
}
nr.create = (t) => new nr({
  typeName: b.ZodVoid,
  ...S(t)
});
class X extends A {
  _parse(e) {
    const { ctx: r, status: s } = this._processInputParams(e), n = this._def;
    if (r.parsedType !== p.array)
      return m(r, {
        code: f.invalid_type,
        expected: p.array,
        received: r.parsedType
      }), w;
    if (n.exactLength !== null) {
      const i = r.data.length > n.exactLength.value, o = r.data.length < n.exactLength.value;
      (i || o) && (m(r, {
        code: i ? f.too_big : f.too_small,
        minimum: o ? n.exactLength.value : void 0,
        maximum: i ? n.exactLength.value : void 0,
        type: "array",
        inclusive: !0,
        exact: !0,
        message: n.exactLength.message
      }), s.dirty());
    }
    if (n.minLength !== null && r.data.length < n.minLength.value && (m(r, {
      code: f.too_small,
      minimum: n.minLength.value,
      type: "array",
      inclusive: !0,
      exact: !1,
      message: n.minLength.message
    }), s.dirty()), n.maxLength !== null && r.data.length > n.maxLength.value && (m(r, {
      code: f.too_big,
      maximum: n.maxLength.value,
      type: "array",
      inclusive: !0,
      exact: !1,
      message: n.maxLength.message
    }), s.dirty()), r.common.async)
      return Promise.all([...r.data].map((i, o) => n.type._parseAsync(new we(r, i, r.path, o)))).then((i) => z.mergeArray(s, i));
    const a = [...r.data].map((i, o) => n.type._parseSync(new we(r, i, r.path, o)));
    return z.mergeArray(s, a);
  }
  get element() {
    return this._def.type;
  }
  min(e, r) {
    return new X({
      ...this._def,
      minLength: { value: e, message: g.toString(r) }
    });
  }
  max(e, r) {
    return new X({
      ...this._def,
      maxLength: { value: e, message: g.toString(r) }
    });
  }
  length(e, r) {
    return new X({
      ...this._def,
      exactLength: { value: e, message: g.toString(r) }
    });
  }
  nonempty(e) {
    return this.min(1, e);
  }
}
X.create = (t, e) => new X({
  type: t,
  minLength: null,
  maxLength: null,
  exactLength: null,
  typeName: b.ZodArray,
  ...S(e)
});
function Ne(t) {
  if (t instanceof C) {
    const e = {};
    for (const r in t.shape) {
      const s = t.shape[r];
      e[r] = _e.create(Ne(s));
    }
    return new C({
      ...t._def,
      shape: () => e
    });
  } else return t instanceof X ? new X({
    ...t._def,
    type: Ne(t.element)
  }) : t instanceof _e ? _e.create(Ne(t.unwrap())) : t instanceof Fe ? Fe.create(Ne(t.unwrap())) : t instanceof je ? je.create(t.items.map((e) => Ne(e))) : t;
}
class C extends A {
  constructor() {
    super(...arguments), this._cached = null, this.nonstrict = this.passthrough, this.augment = this.extend;
  }
  _getCached() {
    if (this._cached !== null)
      return this._cached;
    const e = this._def.shape(), r = E.objectKeys(e);
    return this._cached = { shape: e, keys: r }, this._cached;
  }
  _parse(e) {
    if (this._getType(e) !== p.object) {
      const l = this._getOrReturnCtx(e);
      return m(l, {
        code: f.invalid_type,
        expected: p.object,
        received: l.parsedType
      }), w;
    }
    const { status: s, ctx: n } = this._processInputParams(e), { shape: a, keys: i } = this._getCached(), o = [];
    if (!(this._def.catchall instanceof be && this._def.unknownKeys === "strip"))
      for (const l in n.data)
        i.includes(l) || o.push(l);
    const c = [];
    for (const l of i) {
      const d = a[l], h = n.data[l];
      c.push({
        key: { status: "valid", value: l },
        value: d._parse(new we(n, h, n.path, l)),
        alwaysSet: l in n.data
      });
    }
    if (this._def.catchall instanceof be) {
      const l = this._def.unknownKeys;
      if (l === "passthrough")
        for (const d of o)
          c.push({
            key: { status: "valid", value: d },
            value: { status: "valid", value: n.data[d] }
          });
      else if (l === "strict")
        o.length > 0 && (m(n, {
          code: f.unrecognized_keys,
          keys: o
        }), s.dirty());
      else if (l !== "strip") throw new Error("Internal ZodObject error: invalid unknownKeys value.");
    } else {
      const l = this._def.catchall;
      for (const d of o) {
        const h = n.data[d];
        c.push({
          key: { status: "valid", value: d },
          value: l._parse(
            new we(n, h, n.path, d)
            //, ctx.child(key), value, getParsedType(value)
          ),
          alwaysSet: d in n.data
        });
      }
    }
    return n.common.async ? Promise.resolve().then(async () => {
      const l = [];
      for (const d of c) {
        const h = await d.key, y = await d.value;
        l.push({
          key: h,
          value: y,
          alwaysSet: d.alwaysSet
        });
      }
      return l;
    }).then((l) => z.mergeObjectSync(s, l)) : z.mergeObjectSync(s, c);
  }
  get shape() {
    return this._def.shape();
  }
  strict(e) {
    return g.errToObj, new C({
      ...this._def,
      unknownKeys: "strict",
      ...e !== void 0 ? {
        errorMap: (r, s) => {
          var a, i;
          const n = ((i = (a = this._def).errorMap) == null ? void 0 : i.call(a, r, s).message) ?? s.defaultError;
          return r.code === "unrecognized_keys" ? {
            message: g.errToObj(e).message ?? n
          } : {
            message: n
          };
        }
      } : {}
    });
  }
  strip() {
    return new C({
      ...this._def,
      unknownKeys: "strip"
    });
  }
  passthrough() {
    return new C({
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
    return new C({
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
    return new C({
      unknownKeys: e._def.unknownKeys,
      catchall: e._def.catchall,
      shape: () => ({
        ...this._def.shape(),
        ...e._def.shape()
      }),
      typeName: b.ZodObject
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
    return new C({
      ...this._def,
      catchall: e
    });
  }
  pick(e) {
    const r = {};
    for (const s of E.objectKeys(e))
      e[s] && this.shape[s] && (r[s] = this.shape[s]);
    return new C({
      ...this._def,
      shape: () => r
    });
  }
  omit(e) {
    const r = {};
    for (const s of E.objectKeys(this.shape))
      e[s] || (r[s] = this.shape[s]);
    return new C({
      ...this._def,
      shape: () => r
    });
  }
  /**
   * @deprecated
   */
  deepPartial() {
    return Ne(this);
  }
  partial(e) {
    const r = {};
    for (const s of E.objectKeys(this.shape)) {
      const n = this.shape[s];
      e && !e[s] ? r[s] = n : r[s] = n.optional();
    }
    return new C({
      ...this._def,
      shape: () => r
    });
  }
  required(e) {
    const r = {};
    for (const s of E.objectKeys(this.shape))
      if (e && !e[s])
        r[s] = this.shape[s];
      else {
        let a = this.shape[s];
        for (; a instanceof _e; )
          a = a._def.innerType;
        r[s] = a;
      }
    return new C({
      ...this._def,
      shape: () => r
    });
  }
  keyof() {
    return Or(E.objectKeys(this.shape));
  }
}
C.create = (t, e) => new C({
  shape: () => t,
  unknownKeys: "strip",
  catchall: be.create(),
  typeName: b.ZodObject,
  ...S(e)
});
C.strictCreate = (t, e) => new C({
  shape: () => t,
  unknownKeys: "strict",
  catchall: be.create(),
  typeName: b.ZodObject,
  ...S(e)
});
C.lazycreate = (t, e) => new C({
  shape: t,
  unknownKeys: "strip",
  catchall: be.create(),
  typeName: b.ZodObject,
  ...S(e)
});
class gt extends A {
  _parse(e) {
    const { ctx: r } = this._processInputParams(e), s = this._def.options;
    function n(a) {
      for (const o of a)
        if (o.result.status === "valid")
          return o.result;
      for (const o of a)
        if (o.result.status === "dirty")
          return r.common.issues.push(...o.ctx.common.issues), o.result;
      const i = a.map((o) => new ie(o.ctx.common.issues));
      return m(r, {
        code: f.invalid_union,
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
        }, d = c._parseSync({
          data: r.data,
          path: r.path,
          parent: l
        });
        if (d.status === "valid")
          return d;
        d.status === "dirty" && !a && (a = { result: d, ctx: l }), l.common.issues.length && i.push(l.common.issues);
      }
      if (a)
        return r.common.issues.push(...a.ctx.common.issues), a.result;
      const o = i.map((c) => new ie(c));
      return m(r, {
        code: f.invalid_union,
        unionErrors: o
      }), w;
    }
  }
  get options() {
    return this._def.options;
  }
}
gt.create = (t, e) => new gt({
  options: t,
  typeName: b.ZodUnion,
  ...S(e)
});
function Mt(t, e) {
  const r = he(t), s = he(e);
  if (t === e)
    return { valid: !0, data: t };
  if (r === p.object && s === p.object) {
    const n = E.objectKeys(e), a = E.objectKeys(t).filter((o) => n.indexOf(o) !== -1), i = { ...t, ...e };
    for (const o of a) {
      const c = Mt(t[o], e[o]);
      if (!c.valid)
        return { valid: !1 };
      i[o] = c.data;
    }
    return { valid: !0, data: i };
  } else if (r === p.array && s === p.array) {
    if (t.length !== e.length)
      return { valid: !1 };
    const n = [];
    for (let a = 0; a < t.length; a++) {
      const i = t[a], o = e[a], c = Mt(i, o);
      if (!c.valid)
        return { valid: !1 };
      n.push(c.data);
    }
    return { valid: !0, data: n };
  } else return r === p.date && s === p.date && +t == +e ? { valid: !0, data: t } : { valid: !1 };
}
class yt extends A {
  _parse(e) {
    const { status: r, ctx: s } = this._processInputParams(e), n = (a, i) => {
      if (Yt(a) || Yt(i))
        return w;
      const o = Mt(a.value, i.value);
      return o.valid ? ((Qt(a) || Qt(i)) && r.dirty(), { status: r.value, value: o.data }) : (m(s, {
        code: f.invalid_intersection_types
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
yt.create = (t, e, r) => new yt({
  left: t,
  right: e,
  typeName: b.ZodIntersection,
  ...S(r)
});
class je extends A {
  _parse(e) {
    const { status: r, ctx: s } = this._processInputParams(e);
    if (s.parsedType !== p.array)
      return m(s, {
        code: f.invalid_type,
        expected: p.array,
        received: s.parsedType
      }), w;
    if (s.data.length < this._def.items.length)
      return m(s, {
        code: f.too_small,
        minimum: this._def.items.length,
        inclusive: !0,
        exact: !1,
        type: "array"
      }), w;
    !this._def.rest && s.data.length > this._def.items.length && (m(s, {
      code: f.too_big,
      maximum: this._def.items.length,
      inclusive: !0,
      exact: !1,
      type: "array"
    }), r.dirty());
    const a = [...s.data].map((i, o) => {
      const c = this._def.items[o] || this._def.rest;
      return c ? c._parse(new we(s, i, s.path, o)) : null;
    }).filter((i) => !!i);
    return s.common.async ? Promise.all(a).then((i) => z.mergeArray(r, i)) : z.mergeArray(r, a);
  }
  get items() {
    return this._def.items;
  }
  rest(e) {
    return new je({
      ...this._def,
      rest: e
    });
  }
}
je.create = (t, e) => {
  if (!Array.isArray(t))
    throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
  return new je({
    items: t,
    typeName: b.ZodTuple,
    rest: null,
    ...S(e)
  });
};
class ar extends A {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(e) {
    const { status: r, ctx: s } = this._processInputParams(e);
    if (s.parsedType !== p.map)
      return m(s, {
        code: f.invalid_type,
        expected: p.map,
        received: s.parsedType
      }), w;
    const n = this._def.keyType, a = this._def.valueType, i = [...s.data.entries()].map(([o, c], l) => ({
      key: n._parse(new we(s, o, s.path, [l, "key"])),
      value: a._parse(new we(s, c, s.path, [l, "value"]))
    }));
    if (s.common.async) {
      const o = /* @__PURE__ */ new Map();
      return Promise.resolve().then(async () => {
        for (const c of i) {
          const l = await c.key, d = await c.value;
          if (l.status === "aborted" || d.status === "aborted")
            return w;
          (l.status === "dirty" || d.status === "dirty") && r.dirty(), o.set(l.value, d.value);
        }
        return { status: r.value, value: o };
      });
    } else {
      const o = /* @__PURE__ */ new Map();
      for (const c of i) {
        const l = c.key, d = c.value;
        if (l.status === "aborted" || d.status === "aborted")
          return w;
        (l.status === "dirty" || d.status === "dirty") && r.dirty(), o.set(l.value, d.value);
      }
      return { status: r.value, value: o };
    }
  }
}
ar.create = (t, e, r) => new ar({
  valueType: e,
  keyType: t,
  typeName: b.ZodMap,
  ...S(r)
});
class et extends A {
  _parse(e) {
    const { status: r, ctx: s } = this._processInputParams(e);
    if (s.parsedType !== p.set)
      return m(s, {
        code: f.invalid_type,
        expected: p.set,
        received: s.parsedType
      }), w;
    const n = this._def;
    n.minSize !== null && s.data.size < n.minSize.value && (m(s, {
      code: f.too_small,
      minimum: n.minSize.value,
      type: "set",
      inclusive: !0,
      exact: !1,
      message: n.minSize.message
    }), r.dirty()), n.maxSize !== null && s.data.size > n.maxSize.value && (m(s, {
      code: f.too_big,
      maximum: n.maxSize.value,
      type: "set",
      inclusive: !0,
      exact: !1,
      message: n.maxSize.message
    }), r.dirty());
    const a = this._def.valueType;
    function i(c) {
      const l = /* @__PURE__ */ new Set();
      for (const d of c) {
        if (d.status === "aborted")
          return w;
        d.status === "dirty" && r.dirty(), l.add(d.value);
      }
      return { status: r.value, value: l };
    }
    const o = [...s.data.values()].map((c, l) => a._parse(new we(s, c, s.path, l)));
    return s.common.async ? Promise.all(o).then((c) => i(c)) : i(o);
  }
  min(e, r) {
    return new et({
      ...this._def,
      minSize: { value: e, message: g.toString(r) }
    });
  }
  max(e, r) {
    return new et({
      ...this._def,
      maxSize: { value: e, message: g.toString(r) }
    });
  }
  size(e, r) {
    return this.min(e, r).max(e, r);
  }
  nonempty(e) {
    return this.min(1, e);
  }
}
et.create = (t, e) => new et({
  valueType: t,
  minSize: null,
  maxSize: null,
  typeName: b.ZodSet,
  ...S(e)
});
class ir extends A {
  get schema() {
    return this._def.getter();
  }
  _parse(e) {
    const { ctx: r } = this._processInputParams(e);
    return this._def.getter()._parse({ data: r.data, path: r.path, parent: r });
  }
}
ir.create = (t, e) => new ir({
  getter: t,
  typeName: b.ZodLazy,
  ...S(e)
});
class or extends A {
  _parse(e) {
    if (e.data !== this._def.value) {
      const r = this._getOrReturnCtx(e);
      return m(r, {
        received: r.data,
        code: f.invalid_literal,
        expected: this._def.value
      }), w;
    }
    return { status: "valid", value: e.data };
  }
  get value() {
    return this._def.value;
  }
}
or.create = (t, e) => new or({
  value: t,
  typeName: b.ZodLiteral,
  ...S(e)
});
function Or(t, e) {
  return new We({
    values: t,
    typeName: b.ZodEnum,
    ...S(e)
  });
}
class We extends A {
  _parse(e) {
    if (typeof e.data != "string") {
      const r = this._getOrReturnCtx(e), s = this._def.values;
      return m(r, {
        expected: E.joinValues(s),
        received: r.parsedType,
        code: f.invalid_type
      }), w;
    }
    if (this._cache || (this._cache = new Set(this._def.values)), !this._cache.has(e.data)) {
      const r = this._getOrReturnCtx(e), s = this._def.values;
      return m(r, {
        received: r.data,
        code: f.invalid_enum_value,
        options: s
      }), w;
    }
    return K(e.data);
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
    return We.create(e, {
      ...this._def,
      ...r
    });
  }
  exclude(e, r = this._def) {
    return We.create(this.options.filter((s) => !e.includes(s)), {
      ...this._def,
      ...r
    });
  }
}
We.create = Or;
class cr extends A {
  _parse(e) {
    const r = E.getValidEnumValues(this._def.values), s = this._getOrReturnCtx(e);
    if (s.parsedType !== p.string && s.parsedType !== p.number) {
      const n = E.objectValues(r);
      return m(s, {
        expected: E.joinValues(n),
        received: s.parsedType,
        code: f.invalid_type
      }), w;
    }
    if (this._cache || (this._cache = new Set(E.getValidEnumValues(this._def.values))), !this._cache.has(e.data)) {
      const n = E.objectValues(r);
      return m(s, {
        received: s.data,
        code: f.invalid_enum_value,
        options: n
      }), w;
    }
    return K(e.data);
  }
  get enum() {
    return this._def.values;
  }
}
cr.create = (t, e) => new cr({
  values: t,
  typeName: b.ZodNativeEnum,
  ...S(e)
});
class vt extends A {
  unwrap() {
    return this._def.type;
  }
  _parse(e) {
    const { ctx: r } = this._processInputParams(e);
    if (r.parsedType !== p.promise && r.common.async === !1)
      return m(r, {
        code: f.invalid_type,
        expected: p.promise,
        received: r.parsedType
      }), w;
    const s = r.parsedType === p.promise ? r.data : Promise.resolve(r.data);
    return K(s.then((n) => this._def.type.parseAsync(n, {
      path: r.path,
      errorMap: r.common.contextualErrorMap
    })));
  }
}
vt.create = (t, e) => new vt({
  type: t,
  typeName: b.ZodPromise,
  ...S(e)
});
class Ke extends A {
  innerType() {
    return this._def.schema;
  }
  sourceType() {
    return this._def.schema._def.typeName === b.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
  }
  _parse(e) {
    const { status: r, ctx: s } = this._processInputParams(e), n = this._def.effect || null, a = {
      addIssue: (i) => {
        m(s, i), i.fatal ? r.abort() : r.dirty();
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
          return c.status === "aborted" ? w : c.status === "dirty" || r.value === "dirty" ? Ye(c.value) : c;
        });
      {
        if (r.value === "aborted")
          return w;
        const o = this._def.schema._parseSync({
          data: i,
          path: s.path,
          parent: s
        });
        return o.status === "aborted" ? w : o.status === "dirty" || r.value === "dirty" ? Ye(o.value) : o;
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
        if (!qe(i))
          return w;
        const o = n.transform(i.value, a);
        if (o instanceof Promise)
          throw new Error("Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.");
        return { status: r.value, value: o };
      } else
        return this._def.schema._parseAsync({ data: s.data, path: s.path, parent: s }).then((i) => qe(i) ? Promise.resolve(n.transform(i.value, a)).then((o) => ({
          status: r.value,
          value: o
        })) : w);
    E.assertNever(n);
  }
}
Ke.create = (t, e, r) => new Ke({
  schema: t,
  typeName: b.ZodEffects,
  effect: e,
  ...S(r)
});
Ke.createWithPreprocess = (t, e, r) => new Ke({
  schema: e,
  effect: { type: "preprocess", transform: t },
  typeName: b.ZodEffects,
  ...S(r)
});
class _e extends A {
  _parse(e) {
    return this._getType(e) === p.undefined ? K(void 0) : this._def.innerType._parse(e);
  }
  unwrap() {
    return this._def.innerType;
  }
}
_e.create = (t, e) => new _e({
  innerType: t,
  typeName: b.ZodOptional,
  ...S(e)
});
class Fe extends A {
  _parse(e) {
    return this._getType(e) === p.null ? K(null) : this._def.innerType._parse(e);
  }
  unwrap() {
    return this._def.innerType;
  }
}
Fe.create = (t, e) => new Fe({
  innerType: t,
  typeName: b.ZodNullable,
  ...S(e)
});
class Pt extends A {
  _parse(e) {
    const { ctx: r } = this._processInputParams(e);
    let s = r.data;
    return r.parsedType === p.undefined && (s = this._def.defaultValue()), this._def.innerType._parse({
      data: s,
      path: r.path,
      parent: r
    });
  }
  removeDefault() {
    return this._def.innerType;
  }
}
Pt.create = (t, e) => new Pt({
  innerType: t,
  typeName: b.ZodDefault,
  defaultValue: typeof e.default == "function" ? e.default : () => e.default,
  ...S(e)
});
class Lt extends A {
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
    return mt(n) ? n.then((a) => ({
      status: "valid",
      value: a.status === "valid" ? a.value : this._def.catchValue({
        get error() {
          return new ie(s.common.issues);
        },
        input: s.data
      })
    })) : {
      status: "valid",
      value: n.status === "valid" ? n.value : this._def.catchValue({
        get error() {
          return new ie(s.common.issues);
        },
        input: s.data
      })
    };
  }
  removeCatch() {
    return this._def.innerType;
  }
}
Lt.create = (t, e) => new Lt({
  innerType: t,
  typeName: b.ZodCatch,
  catchValue: typeof e.catch == "function" ? e.catch : () => e.catch,
  ...S(e)
});
class lr extends A {
  _parse(e) {
    if (this._getType(e) !== p.nan) {
      const s = this._getOrReturnCtx(e);
      return m(s, {
        code: f.invalid_type,
        expected: p.nan,
        received: s.parsedType
      }), w;
    }
    return { status: "valid", value: e.data };
  }
}
lr.create = (t) => new lr({
  typeName: b.ZodNaN,
  ...S(t)
});
class Ts extends A {
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
class Zt extends A {
  _parse(e) {
    const { status: r, ctx: s } = this._processInputParams(e);
    if (s.common.async)
      return (async () => {
        const a = await this._def.in._parseAsync({
          data: s.data,
          path: s.path,
          parent: s
        });
        return a.status === "aborted" ? w : a.status === "dirty" ? (r.dirty(), Ye(a.value)) : this._def.out._parseAsync({
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
      typeName: b.ZodPipeline
    });
  }
}
class $t extends A {
  _parse(e) {
    const r = this._def.innerType._parse(e), s = (n) => (qe(n) && (n.value = Object.freeze(n.value)), n);
    return mt(r) ? r.then((n) => s(n)) : s(r);
  }
  unwrap() {
    return this._def.innerType;
  }
}
$t.create = (t, e) => new $t({
  innerType: t,
  typeName: b.ZodReadonly,
  ...S(e)
});
var b;
(function(t) {
  t.ZodString = "ZodString", t.ZodNumber = "ZodNumber", t.ZodNaN = "ZodNaN", t.ZodBigInt = "ZodBigInt", t.ZodBoolean = "ZodBoolean", t.ZodDate = "ZodDate", t.ZodSymbol = "ZodSymbol", t.ZodUndefined = "ZodUndefined", t.ZodNull = "ZodNull", t.ZodAny = "ZodAny", t.ZodUnknown = "ZodUnknown", t.ZodNever = "ZodNever", t.ZodVoid = "ZodVoid", t.ZodArray = "ZodArray", t.ZodObject = "ZodObject", t.ZodUnion = "ZodUnion", t.ZodDiscriminatedUnion = "ZodDiscriminatedUnion", t.ZodIntersection = "ZodIntersection", t.ZodTuple = "ZodTuple", t.ZodRecord = "ZodRecord", t.ZodMap = "ZodMap", t.ZodSet = "ZodSet", t.ZodFunction = "ZodFunction", t.ZodLazy = "ZodLazy", t.ZodLiteral = "ZodLiteral", t.ZodEnum = "ZodEnum", t.ZodEffects = "ZodEffects", t.ZodNativeEnum = "ZodNativeEnum", t.ZodOptional = "ZodOptional", t.ZodNullable = "ZodNullable", t.ZodDefault = "ZodDefault", t.ZodCatch = "ZodCatch", t.ZodPromise = "ZodPromise", t.ZodBranded = "ZodBranded", t.ZodPipeline = "ZodPipeline", t.ZodReadonly = "ZodReadonly";
})(b || (b = {}));
const j = ae.create, F = Te.create;
Oe.create;
const dr = pt.create;
Be.create;
const Os = Nt.create;
be.create;
const zt = X.create, B = C.create;
gt.create;
yt.create;
je.create;
const $e = We.create;
vt.create;
_e.create;
Fe.create;
const jr = {
  string: ((t) => ae.create({ ...t, coerce: !0 })),
  number: ((t) => Te.create({ ...t, coerce: !0 })),
  boolean: ((t) => pt.create({
    ...t,
    coerce: !0
  })),
  bigint: ((t) => Oe.create({ ...t, coerce: !0 })),
  date: ((t) => Be.create({ ...t, coerce: !0 }))
};
B({
  type: $e([
    "connection_established",
    "live_health_update",
    "historical_data_update",
    "emergency_alert",
    "client_presence",
    "error",
    "pong"
  ]),
  data: Os().optional(),
  timestamp: j().datetime().optional()
});
const Cr = $e([
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
]), qt = B({
  type: Cr,
  value: F().describe("numeric value for the metric"),
  unit: j().optional(),
  timestamp: j().datetime().optional(),
  deviceId: j().optional(),
  userId: j().optional(),
  source: j().optional().describe("data source like Apple Watch, manual entry"),
  confidence: F().min(0).max(1).optional().describe("confidence level of the reading")
}), js = B({
  metrics: zt(qt),
  uploadedAt: j().datetime(),
  deviceInfo: B({
    deviceId: j(),
    deviceType: j(),
    osVersion: j().optional(),
    appVersion: j().optional()
  }).optional()
}), xt = B({
  id: j().uuid().optional(),
  type: Cr,
  value: F(),
  unit: j().optional(),
  timestamp: j().datetime(),
  processedAt: j().datetime(),
  validated: dr(),
  // Analytics and insights
  healthScore: F().min(0).max(100).optional(),
  fallRisk: $e(["low", "moderate", "high", "critical"]).optional(),
  trendAnalysis: B({
    direction: $e(["improving", "stable", "declining"]),
    confidence: F().min(0).max(1),
    changePercent: F().optional()
  }).optional(),
  // Contextual data
  anomalyScore: F().min(0).max(1).optional().describe("how unusual this reading is"),
  correlatedMetrics: zt(j()).optional().describe("related metrics that influenced this reading"),
  // Alert and notification system
  alert: B({
    level: $e(["info", "warning", "critical", "emergency"]),
    message: j(),
    actionRequired: dr().optional(),
    expiresAt: j().datetime().optional()
  }).nullable().optional(),
  // Data lineage
  source: B({
    deviceId: j().optional(),
    userId: j(),
    collectedAt: j().datetime(),
    processingPipeline: j().optional()
  }),
  // Quality metrics
  dataQuality: B({
    completeness: F().min(0).max(100),
    accuracy: F().min(0).max(100),
    timeliness: F().min(0).max(100),
    consistency: F().min(0).max(100)
  }).optional()
});
var ur = (t, e, r) => (s, n) => {
  let a = -1;
  return i(0);
  async function i(o) {
    if (o <= a)
      throw new Error("next() called multiple times");
    a = o;
    let c, l = !1, d;
    if (t[o] ? (d = t[o][0][0], s.req.routeIndex = o) : d = o === t.length && n || void 0, d)
      try {
        c = await d(s, () => i(o + 1));
      } catch (h) {
        if (h instanceof Error && e)
          s.error = h, c = await e(h, s), l = !0;
        else
          throw h;
      }
    else
      s.finalized === !1 && r && (c = await r(s));
    return c && (s.finalized === !1 || l) && (s.res = c), s;
  }
}, Cs = Symbol(), Ds = async (t, e = /* @__PURE__ */ Object.create(null)) => {
  const { all: r = !1, dot: s = !1 } = e, a = (t instanceof $r ? t.raw.headers : t.headers).get("Content-Type");
  return a != null && a.startsWith("multipart/form-data") || a != null && a.startsWith("application/x-www-form-urlencoded") ? Ns(t, { all: r, dot: s }) : {};
};
async function Ns(t, e) {
  const r = await t.formData();
  return r ? Ms(r, e) : {};
}
function Ms(t, e) {
  const r = /* @__PURE__ */ Object.create(null);
  return t.forEach((s, n) => {
    e.all || n.endsWith("[]") ? Ps(r, n, s) : r[n] = s;
  }), e.dot && Object.entries(r).forEach(([s, n]) => {
    s.includes(".") && (Ls(r, s, n), delete r[s]);
  }), r;
}
var Ps = (t, e, r) => {
  t[e] !== void 0 ? Array.isArray(t[e]) ? t[e].push(r) : t[e] = [t[e], r] : e.endsWith("[]") ? t[e] = [r] : t[e] = r;
}, Ls = (t, e, r) => {
  let s = t;
  const n = e.split(".");
  n.forEach((a, i) => {
    i === n.length - 1 ? s[a] = r : ((!s[a] || typeof s[a] != "object" || Array.isArray(s[a]) || s[a] instanceof File) && (s[a] = /* @__PURE__ */ Object.create(null)), s = s[a]);
  });
}, Dr = (t) => {
  const e = t.split("/");
  return e[0] === "" && e.shift(), e;
}, $s = (t) => {
  const { groups: e, path: r } = Hs(t), s = Dr(r);
  return Us(s, e);
}, Hs = (t) => {
  const e = [];
  return t = t.replace(/\{[^}]+\}/g, (r, s) => {
    const n = `@${s}`;
    return e.push([n, r]), n;
  }), { groups: e, path: t };
}, Us = (t, e) => {
  for (let r = e.length - 1; r >= 0; r--) {
    const [s] = e[r];
    for (let n = t.length - 1; n >= 0; n--)
      if (t[n].includes(s)) {
        t[n] = t[n].replace(s, e[r][1]);
        break;
      }
  }
  return t;
}, lt = {}, Vs = (t, e) => {
  if (t === "*")
    return "*";
  const r = t.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (r) {
    const s = `${t}#${e}`;
    return lt[s] || (r[2] ? lt[s] = e && e[0] !== ":" && e[0] !== "*" ? [s, r[1], new RegExp(`^${r[2]}(?=/${e})`)] : [t, r[1], new RegExp(`^${r[2]}$`)] : lt[s] = [t, r[1], !0]), lt[s];
  }
  return null;
}, Bt = (t, e) => {
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
}, Zs = (t) => Bt(t, decodeURI), Nr = (t) => {
  const e = t.url, r = e.indexOf(
    "/",
    e.charCodeAt(9) === 58 ? 13 : 8
  );
  let s = r;
  for (; s < e.length; s++) {
    const n = e.charCodeAt(s);
    if (n === 37) {
      const a = e.indexOf("?", s), i = e.slice(r, a === -1 ? void 0 : a);
      return Zs(i.includes("%25") ? i.replace(/%25/g, "%2525") : i);
    } else if (n === 63)
      break;
  }
  return e.slice(r, s);
}, zs = (t) => {
  const e = Nr(t);
  return e.length > 1 && e.at(-1) === "/" ? e.slice(0, -1) : e;
}, Me = (t, e, ...r) => (r.length && (e = Me(e, ...r)), `${(t == null ? void 0 : t[0]) === "/" ? "" : "/"}${t}${e === "/" ? "" : `${(t == null ? void 0 : t.at(-1)) === "/" ? "" : "/"}${(e == null ? void 0 : e[0]) === "/" ? e.slice(1) : e}`}`), Mr = (t) => {
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
}, Ot = (t) => /[%+]/.test(t) ? (t.indexOf("+") !== -1 && (t = t.replace(/\+/g, " ")), t.indexOf("%") !== -1 ? Bt(t, Lr) : t) : t, Pr = (t, e, r) => {
  let s;
  if (!r && e && !/[%+]/.test(e)) {
    let i = t.indexOf(`?${e}`, 8);
    for (i === -1 && (i = t.indexOf(`&${e}`, 8)); i !== -1; ) {
      const o = t.charCodeAt(i + e.length + 1);
      if (o === 61) {
        const c = i + e.length + 2, l = t.indexOf("&", c);
        return Ot(t.slice(c, l === -1 ? void 0 : l));
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
    if (s && (c = Ot(c)), a = i, c === "")
      continue;
    let l;
    o === -1 ? l = "" : (l = t.slice(o + 1, i === -1 ? void 0 : i), s && (l = Ot(l))), r ? (n[c] && Array.isArray(n[c]) || (n[c] = []), n[c].push(l)) : n[c] ?? (n[c] = l);
  }
  return e ? n[e] : n;
}, qs = Pr, Bs = (t, e) => Pr(t, e, !0), Lr = decodeURIComponent, hr = (t) => Bt(t, Lr), He, q, oe, Hr, Ur, Ht, fe, pr, $r = (pr = class {
  constructor(t, e = "/", r = [[]]) {
    k(this, oe);
    v(this, "raw");
    k(this, He);
    k(this, q);
    v(this, "routeIndex", 0);
    v(this, "path");
    v(this, "bodyCache", {});
    k(this, fe, (t) => {
      const { bodyCache: e, raw: r } = this, s = e[t];
      if (s)
        return s;
      const n = Object.keys(e)[0];
      return n ? e[n].then((a) => (n === "json" && (a = JSON.stringify(a)), new Response(a)[t]())) : e[t] = r[t]();
    });
    this.raw = t, this.path = e, _(this, q, r), _(this, He, {});
  }
  param(t) {
    return t ? I(this, oe, Hr).call(this, t) : I(this, oe, Ur).call(this);
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
    return (e = this.bodyCache).parsedBody ?? (e.parsedBody = await Ds(this, t));
  }
  json() {
    return u(this, fe).call(this, "text").then((t) => JSON.parse(t));
  }
  text() {
    return u(this, fe).call(this, "text");
  }
  arrayBuffer() {
    return u(this, fe).call(this, "arrayBuffer");
  }
  blob() {
    return u(this, fe).call(this, "blob");
  }
  formData() {
    return u(this, fe).call(this, "formData");
  }
  addValidatedData(t, e) {
    u(this, He)[t] = e;
  }
  valid(t) {
    return u(this, He)[t];
  }
  get url() {
    return this.raw.url;
  }
  get method() {
    return this.raw.method;
  }
  get [Cs]() {
    return u(this, q);
  }
  get matchedRoutes() {
    return u(this, q)[0].map(([[, t]]) => t);
  }
  get routePath() {
    return u(this, q)[0].map(([[, t]]) => t)[this.routeIndex].path;
  }
}, He = new WeakMap(), q = new WeakMap(), oe = new WeakSet(), Hr = function(t) {
  const e = u(this, q)[0][this.routeIndex][1][t], r = I(this, oe, Ht).call(this, e);
  return r ? /\%/.test(r) ? hr(r) : r : void 0;
}, Ur = function() {
  const t = {}, e = Object.keys(u(this, q)[0][this.routeIndex][1]);
  for (const r of e) {
    const s = I(this, oe, Ht).call(this, u(this, q)[0][this.routeIndex][1][r]);
    s && typeof s == "string" && (t[r] = /\%/.test(s) ? hr(s) : s);
  }
  return t;
}, Ht = function(t) {
  return u(this, q)[1] ? u(this, q)[1][t] : t;
}, fe = new WeakMap(), pr), Ws = {
  Stringify: 1
}, Vr = async (t, e, r, s, n) => {
  typeof t == "object" && !(t instanceof String) && (t instanceof Promise || (t = t.toString()), t instanceof Promise && (t = await t));
  const a = t.callbacks;
  return a != null && a.length ? (n ? n[0] += t : n = [t], Promise.all(a.map((o) => o({ phase: e, buffer: n, context: s }))).then(
    (o) => Promise.all(
      o.filter(Boolean).map((c) => Vr(c, e, !1, s, n))
    ).then(() => n[0])
  )) : Promise.resolve(t);
}, Ks = "text/plain; charset=UTF-8", jt = (t, e) => ({
  "Content-Type": t,
  ...e
}), tt, rt, te, Ue, re, V, st, Ve, Ze, xe, nt, at, me, Pe, gr, Fs = (gr = class {
  constructor(t, e) {
    k(this, me);
    k(this, tt);
    k(this, rt);
    v(this, "env", {});
    k(this, te);
    v(this, "finalized", !1);
    v(this, "error");
    k(this, Ue);
    k(this, re);
    k(this, V);
    k(this, st);
    k(this, Ve);
    k(this, Ze);
    k(this, xe);
    k(this, nt);
    k(this, at);
    v(this, "render", (...t) => (u(this, Ve) ?? _(this, Ve, (e) => this.html(e)), u(this, Ve).call(this, ...t)));
    v(this, "setLayout", (t) => _(this, st, t));
    v(this, "getLayout", () => u(this, st));
    v(this, "setRenderer", (t) => {
      _(this, Ve, t);
    });
    v(this, "header", (t, e, r) => {
      this.finalized && _(this, V, new Response(u(this, V).body, u(this, V)));
      const s = u(this, V) ? u(this, V).headers : u(this, xe) ?? _(this, xe, new Headers());
      e === void 0 ? s.delete(t) : r != null && r.append ? s.append(t, e) : s.set(t, e);
    });
    v(this, "status", (t) => {
      _(this, Ue, t);
    });
    v(this, "set", (t, e) => {
      u(this, te) ?? _(this, te, /* @__PURE__ */ new Map()), u(this, te).set(t, e);
    });
    v(this, "get", (t) => u(this, te) ? u(this, te).get(t) : void 0);
    v(this, "newResponse", (...t) => I(this, me, Pe).call(this, ...t));
    v(this, "body", (t, e, r) => I(this, me, Pe).call(this, t, e, r));
    v(this, "text", (t, e, r) => !u(this, xe) && !u(this, Ue) && !e && !r && !this.finalized ? new Response(t) : I(this, me, Pe).call(this, t, e, jt(Ks, r)));
    v(this, "json", (t, e, r) => I(this, me, Pe).call(this, JSON.stringify(t), e, jt("application/json", r)));
    v(this, "html", (t, e, r) => {
      const s = (n) => I(this, me, Pe).call(this, n, e, jt("text/html; charset=UTF-8", r));
      return typeof t == "object" ? Vr(t, Ws.Stringify, !1, {}).then(s) : s(t);
    });
    v(this, "redirect", (t, e) => {
      const r = String(t);
      return this.header(
        "Location",
        /[^\x00-\xFF]/.test(r) ? encodeURI(r) : r
      ), this.newResponse(null, e ?? 302);
    });
    v(this, "notFound", () => (u(this, Ze) ?? _(this, Ze, () => new Response()), u(this, Ze).call(this, this)));
    _(this, tt, t), e && (_(this, re, e.executionCtx), this.env = e.env, _(this, Ze, e.notFoundHandler), _(this, at, e.path), _(this, nt, e.matchResult));
  }
  get req() {
    return u(this, rt) ?? _(this, rt, new $r(u(this, tt), u(this, at), u(this, nt))), u(this, rt);
  }
  get event() {
    if (u(this, re) && "respondWith" in u(this, re))
      return u(this, re);
    throw Error("This context has no FetchEvent");
  }
  get executionCtx() {
    if (u(this, re))
      return u(this, re);
    throw Error("This context has no ExecutionContext");
  }
  get res() {
    return u(this, V) || _(this, V, new Response(null, {
      headers: u(this, xe) ?? _(this, xe, new Headers())
    }));
  }
  set res(t) {
    if (u(this, V) && t) {
      t = new Response(t.body, t);
      for (const [e, r] of u(this, V).headers.entries())
        if (e !== "content-type")
          if (e === "set-cookie") {
            const s = u(this, V).headers.getSetCookie();
            t.headers.delete("set-cookie");
            for (const n of s)
              t.headers.append("set-cookie", n);
          } else
            t.headers.set(e, r);
    }
    _(this, V, t), this.finalized = !0;
  }
  get var() {
    return u(this, te) ? Object.fromEntries(u(this, te)) : {};
  }
}, tt = new WeakMap(), rt = new WeakMap(), te = new WeakMap(), Ue = new WeakMap(), re = new WeakMap(), V = new WeakMap(), st = new WeakMap(), Ve = new WeakMap(), Ze = new WeakMap(), xe = new WeakMap(), nt = new WeakMap(), at = new WeakMap(), me = new WeakSet(), Pe = function(t, e, r) {
  const s = u(this, V) ? new Headers(u(this, V).headers) : u(this, xe) ?? new Headers();
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
  const n = typeof e == "number" ? e : (e == null ? void 0 : e.status) ?? u(this, Ue);
  return new Response(t, { status: n, headers: s });
}, gr), N = "ALL", Js = "all", Gs = ["get", "post", "put", "delete", "options", "patch"], Zr = "Can not add a route since the matcher is already built.", zr = class extends Error {
}, Ys = "__COMPOSED_HANDLER", Qs = (t) => t.text("404 Not Found", 404), fr = (t, e) => {
  if ("getResponse" in t) {
    const r = t.getResponse();
    return e.newResponse(r.body, r);
  }
  return console.error(t), e.text("Internal Server Error", 500);
}, J, M, Br, G, ke, ut, ht, yr, qr = (yr = class {
  constructor(e = {}) {
    k(this, M);
    v(this, "get");
    v(this, "post");
    v(this, "put");
    v(this, "delete");
    v(this, "options");
    v(this, "patch");
    v(this, "all");
    v(this, "on");
    v(this, "use");
    v(this, "router");
    v(this, "getPath");
    v(this, "_basePath", "/");
    k(this, J, "/");
    v(this, "routes", []);
    k(this, G, Qs);
    v(this, "errorHandler", fr);
    v(this, "onError", (e) => (this.errorHandler = e, this));
    v(this, "notFound", (e) => (_(this, G, e), this));
    v(this, "fetch", (e, ...r) => I(this, M, ht).call(this, e, r[1], r[0], e.method));
    v(this, "request", (e, r, s, n) => e instanceof Request ? this.fetch(r ? new Request(e, r) : e, s, n) : (e = e.toString(), this.fetch(
      new Request(
        /^https?:\/\//.test(e) ? e : `http://localhost${Me("/", e)}`,
        r
      ),
      s,
      n
    )));
    v(this, "fire", () => {
      addEventListener("fetch", (e) => {
        e.respondWith(I(this, M, ht).call(this, e.request, e, void 0, e.request.method));
      });
    });
    [...Gs, Js].forEach((a) => {
      this[a] = (i, ...o) => (typeof i == "string" ? _(this, J, i) : I(this, M, ke).call(this, a, u(this, J), i), o.forEach((c) => {
        I(this, M, ke).call(this, a, u(this, J), c);
      }), this);
    }), this.on = (a, i, ...o) => {
      for (const c of [i].flat()) {
        _(this, J, c);
        for (const l of [a].flat())
          o.map((d) => {
            I(this, M, ke).call(this, l.toUpperCase(), u(this, J), d);
          });
      }
      return this;
    }, this.use = (a, ...i) => (typeof a == "string" ? _(this, J, a) : (_(this, J, "*"), i.unshift(a)), i.forEach((o) => {
      I(this, M, ke).call(this, N, u(this, J), o);
    }), this);
    const { strict: s, ...n } = e;
    Object.assign(this, n), this.getPath = s ?? !0 ? e.getPath ?? Nr : zs;
  }
  route(e, r) {
    const s = this.basePath(e);
    return r.routes.map((n) => {
      var i;
      let a;
      r.errorHandler === fr ? a = n.handler : (a = async (o, c) => (await ur([], r.errorHandler)(o, () => n.handler(o, c))).res, a[Ys] = n.handler), I(i = s, M, ke).call(i, n.method, n.path, a);
    }), this;
  }
  basePath(e) {
    const r = I(this, M, Br).call(this);
    return r._basePath = Me(this._basePath, e), r;
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
      const c = Me(this._basePath, e), l = c === "/" ? 0 : c.length;
      return (d) => {
        const h = new URL(d.url);
        return h.pathname = h.pathname.slice(l) || "/", new Request(h, d);
      };
    })());
    const o = async (c, l) => {
      const d = await r(n(c.req.raw), ...i(c));
      if (d)
        return d;
      await l();
    };
    return I(this, M, ke).call(this, N, Me(e, "*"), o), this;
  }
}, J = new WeakMap(), M = new WeakSet(), Br = function() {
  const e = new qr({
    router: this.router,
    getPath: this.getPath
  });
  return e.errorHandler = this.errorHandler, _(e, G, u(this, G)), e.routes = this.routes, e;
}, G = new WeakMap(), ke = function(e, r, s) {
  e = e.toUpperCase(), r = Me(this._basePath, r);
  const n = { basePath: this._basePath, path: r, method: e, handler: s };
  this.router.add(e, r, [s, n]), this.routes.push(n);
}, ut = function(e, r) {
  if (e instanceof Error)
    return this.errorHandler(e, r);
  throw e;
}, ht = function(e, r, s, n) {
  if (n === "HEAD")
    return (async () => new Response(null, await I(this, M, ht).call(this, e, r, s, "GET")))();
  const a = this.getPath(e, { env: s }), i = this.router.match(n, a), o = new Fs(e, {
    path: a,
    matchResult: i,
    env: s,
    executionCtx: r,
    notFoundHandler: u(this, G)
  });
  if (i[0].length === 1) {
    let l;
    try {
      l = i[0][0][0][0](o, async () => {
        o.res = await u(this, G).call(this, o);
      });
    } catch (d) {
      return I(this, M, ut).call(this, d, o);
    }
    return l instanceof Promise ? l.then(
      (d) => d || (o.finalized ? o.res : u(this, G).call(this, o))
    ).catch((d) => I(this, M, ut).call(this, d, o)) : l ?? u(this, G).call(this, o);
  }
  const c = ur(i[0], this.errorHandler, u(this, G));
  return (async () => {
    try {
      const l = await c(o);
      if (!l.finalized)
        throw new Error(
          "Context is not finalized. Did you forget to return a Response object or `await next()`?"
        );
      return l.res;
    } catch (l) {
      return I(this, M, ut).call(this, l, o);
    }
  })();
}, yr), _t = "[^/]+", Qe = ".*", Xe = "(?:|/.*)", Le = Symbol(), Xs = new Set(".\\+*[^]$()");
function en(t, e) {
  return t.length === 1 ? e.length === 1 ? t < e ? -1 : 1 : -1 : e.length === 1 || t === Qe || t === Xe ? 1 : e === Qe || e === Xe ? -1 : t === _t ? 1 : e === _t ? -1 : t.length === e.length ? t < e ? -1 : 1 : e.length - t.length;
}
var Ae, Ee, Y, vr, Ut = (vr = class {
  constructor() {
    k(this, Ae);
    k(this, Ee);
    k(this, Y, /* @__PURE__ */ Object.create(null));
  }
  insert(e, r, s, n, a) {
    if (e.length === 0) {
      if (u(this, Ae) !== void 0)
        throw Le;
      if (a)
        return;
      _(this, Ae, r);
      return;
    }
    const [i, ...o] = e, c = i === "*" ? o.length === 0 ? ["", "", Qe] : ["", "", _t] : i === "/*" ? ["", "", Xe] : i.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
    let l;
    if (c) {
      const d = c[1];
      let h = c[2] || _t;
      if (d && c[2] && (h === ".*" || (h = h.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:"), /\((?!\?:)/.test(h))))
        throw Le;
      if (l = u(this, Y)[h], !l) {
        if (Object.keys(u(this, Y)).some(
          (y) => y !== Qe && y !== Xe
        ))
          throw Le;
        if (a)
          return;
        l = u(this, Y)[h] = new Ut(), d !== "" && _(l, Ee, n.varIndex++);
      }
      !a && d !== "" && s.push([d, u(l, Ee)]);
    } else if (l = u(this, Y)[i], !l) {
      if (Object.keys(u(this, Y)).some(
        (d) => d.length > 1 && d !== Qe && d !== Xe
      ))
        throw Le;
      if (a)
        return;
      l = u(this, Y)[i] = new Ut();
    }
    l.insert(o, r, s, n, a);
  }
  buildRegExpStr() {
    const r = Object.keys(u(this, Y)).sort(en).map((s) => {
      const n = u(this, Y)[s];
      return (typeof u(n, Ee) == "number" ? `(${s})@${u(n, Ee)}` : Xs.has(s) ? `\\${s}` : s) + n.buildRegExpStr();
    });
    return typeof u(this, Ae) == "number" && r.unshift(`#${u(this, Ae)}`), r.length === 0 ? "" : r.length === 1 ? r[0] : "(?:" + r.join("|") + ")";
  }
}, Ae = new WeakMap(), Ee = new WeakMap(), Y = new WeakMap(), vr), wt, it, _r, tn = (_r = class {
  constructor() {
    k(this, wt, { varIndex: 0 });
    k(this, it, new Ut());
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
    return u(this, it).insert(a, e, s, u(this, wt), r), s;
  }
  buildRegExp() {
    let t = u(this, it).buildRegExpStr();
    if (t === "")
      return [/^$/, [], []];
    let e = 0;
    const r = [], s = [];
    return t = t.replace(/#(\d+)|@(\d+)|\.\*\$/g, (n, a, i) => a !== void 0 ? (r[++e] = Number(a), "$()") : (i !== void 0 && (s[Number(i)] = ++e), "")), [new RegExp(`^${t}`), r, s];
  }
}, wt = new WeakMap(), it = new WeakMap(), _r), Wr = [], rn = [/^$/, [], /* @__PURE__ */ Object.create(null)], ft = /* @__PURE__ */ Object.create(null);
function Kr(t) {
  return ft[t] ?? (ft[t] = new RegExp(
    t === "*" ? "" : `^${t.replace(
      /\/\*$|([.\\+*[^\]$()])/g,
      (e, r) => r ? `\\${r}` : "(?:|/.*)"
    )}$`
  ));
}
function sn() {
  ft = /* @__PURE__ */ Object.create(null);
}
function nn(t) {
  var l;
  const e = new tn(), r = [];
  if (t.length === 0)
    return rn;
  const s = t.map(
    (d) => [!/\*|\/:/.test(d[0]), ...d]
  ).sort(
    ([d, h], [y, T]) => d ? 1 : y ? -1 : h.length - T.length
  ), n = /* @__PURE__ */ Object.create(null);
  for (let d = 0, h = -1, y = s.length; d < y; d++) {
    const [T, O, R] = s[d];
    T ? n[O] = [R.map(([P]) => [P, /* @__PURE__ */ Object.create(null)]), Wr] : h++;
    let D;
    try {
      D = e.insert(O, h, T);
    } catch (P) {
      throw P === Le ? new zr(O) : P;
    }
    T || (r[h] = R.map(([P, le]) => {
      const Q = /* @__PURE__ */ Object.create(null);
      for (le -= 1; le >= 0; le--) {
        const [L, U] = D[le];
        Q[L] = U;
      }
      return [P, Q];
    }));
  }
  const [a, i, o] = e.buildRegExp();
  for (let d = 0, h = r.length; d < h; d++)
    for (let y = 0, T = r[d].length; y < T; y++) {
      const O = (l = r[d][y]) == null ? void 0 : l[1];
      if (!O)
        continue;
      const R = Object.keys(O);
      for (let D = 0, P = R.length; D < P; D++)
        O[R[D]] = o[O[R[D]]];
    }
  const c = [];
  for (const d in i)
    c[d] = r[i[d]];
  return [a, c, n];
}
function De(t, e) {
  if (t) {
    for (const r of Object.keys(t).sort((s, n) => n.length - s.length))
      if (Kr(r).test(e))
        return [...t[r]];
  }
}
var pe, ge, Je, Fr, Jr, wr, an = (wr = class {
  constructor() {
    k(this, Je);
    v(this, "name", "RegExpRouter");
    k(this, pe);
    k(this, ge);
    _(this, pe, { [N]: /* @__PURE__ */ Object.create(null) }), _(this, ge, { [N]: /* @__PURE__ */ Object.create(null) });
  }
  add(t, e, r) {
    var o;
    const s = u(this, pe), n = u(this, ge);
    if (!s || !n)
      throw new Error(Zr);
    s[t] || [s, n].forEach((c) => {
      c[t] = /* @__PURE__ */ Object.create(null), Object.keys(c[N]).forEach((l) => {
        c[t][l] = [...c[N][l]];
      });
    }), e === "/*" && (e = "*");
    const a = (e.match(/\/:/g) || []).length;
    if (/\*$/.test(e)) {
      const c = Kr(e);
      t === N ? Object.keys(s).forEach((l) => {
        var d;
        (d = s[l])[e] || (d[e] = De(s[l], e) || De(s[N], e) || []);
      }) : (o = s[t])[e] || (o[e] = De(s[t], e) || De(s[N], e) || []), Object.keys(s).forEach((l) => {
        (t === N || t === l) && Object.keys(s[l]).forEach((d) => {
          c.test(d) && s[l][d].push([r, a]);
        });
      }), Object.keys(n).forEach((l) => {
        (t === N || t === l) && Object.keys(n[l]).forEach(
          (d) => c.test(d) && n[l][d].push([r, a])
        );
      });
      return;
    }
    const i = Mr(e) || [e];
    for (let c = 0, l = i.length; c < l; c++) {
      const d = i[c];
      Object.keys(n).forEach((h) => {
        var y;
        (t === N || t === h) && ((y = n[h])[d] || (y[d] = [
          ...De(s[h], d) || De(s[N], d) || []
        ]), n[h][d].push([r, a - l + c + 1]));
      });
    }
  }
  match(t, e) {
    sn();
    const r = I(this, Je, Fr).call(this);
    return this.match = (s, n) => {
      const a = r[s] || r[N], i = a[2][n];
      if (i)
        return i;
      const o = n.match(a[0]);
      if (!o)
        return [[], Wr];
      const c = o.indexOf("", 1);
      return [a[1][c], o];
    }, this.match(t, e);
  }
}, pe = new WeakMap(), ge = new WeakMap(), Je = new WeakSet(), Fr = function() {
  const t = /* @__PURE__ */ Object.create(null);
  return Object.keys(u(this, ge)).concat(Object.keys(u(this, pe))).forEach((e) => {
    t[e] || (t[e] = I(this, Je, Jr).call(this, e));
  }), _(this, pe, _(this, ge, void 0)), t;
}, Jr = function(t) {
  const e = [];
  let r = t === N;
  return [u(this, pe), u(this, ge)].forEach((s) => {
    const n = s[t] ? Object.keys(s[t]).map((a) => [a, s[t][a]]) : [];
    n.length !== 0 ? (r || (r = !0), e.push(...n)) : t !== N && e.push(
      ...Object.keys(s[N]).map((a) => [a, s[N][a]])
    );
  }), r ? nn(e) : null;
}, wr), ye, se, br, on = (br = class {
  constructor(t) {
    v(this, "name", "SmartRouter");
    k(this, ye, []);
    k(this, se, []);
    _(this, ye, t.routers);
  }
  add(t, e, r) {
    if (!u(this, se))
      throw new Error(Zr);
    u(this, se).push([t, e, r]);
  }
  match(t, e) {
    if (!u(this, se))
      throw new Error("Fatal error");
    const r = u(this, ye), s = u(this, se), n = r.length;
    let a = 0, i;
    for (; a < n; a++) {
      const o = r[a];
      try {
        for (let c = 0, l = s.length; c < l; c++)
          o.add(...s[c]);
        i = o.match(t, e);
      } catch (c) {
        if (c instanceof zr)
          continue;
        throw c;
      }
      this.match = o.match.bind(o), _(this, ye, [o]), _(this, se, void 0);
      break;
    }
    if (a === n)
      throw new Error("Fatal error");
    return this.name = `SmartRouter + ${this.activeRouter.name}`, i;
  }
  get activeRouter() {
    if (u(this, se) || u(this, ye).length !== 1)
      throw new Error("No active router has been determined yet.");
    return u(this, ye)[0];
  }
}, ye = new WeakMap(), se = new WeakMap(), br), Ge = /* @__PURE__ */ Object.create(null), ve, H, Ie, ze, $, ne, Se, kr, Gr = (kr = class {
  constructor(t, e, r) {
    k(this, ne);
    k(this, ve);
    k(this, H);
    k(this, Ie);
    k(this, ze, 0);
    k(this, $, Ge);
    if (_(this, H, r || /* @__PURE__ */ Object.create(null)), _(this, ve, []), t && e) {
      const s = /* @__PURE__ */ Object.create(null);
      s[t] = { handler: e, possibleKeys: [], score: 0 }, _(this, ve, [s]);
    }
    _(this, Ie, []);
  }
  insert(t, e, r) {
    _(this, ze, ++Kt(this, ze)._);
    let s = this;
    const n = $s(e), a = [];
    for (let i = 0, o = n.length; i < o; i++) {
      const c = n[i], l = n[i + 1], d = Vs(c, l), h = Array.isArray(d) ? d[0] : c;
      if (h in u(s, H)) {
        s = u(s, H)[h], d && a.push(d[1]);
        continue;
      }
      u(s, H)[h] = new Gr(), d && (u(s, Ie).push(d), a.push(d[1])), s = u(s, H)[h];
    }
    return u(s, ve).push({
      [t]: {
        handler: r,
        possibleKeys: a.filter((i, o, c) => c.indexOf(i) === o),
        score: u(this, ze)
      }
    }), s;
  }
  search(t, e) {
    var o;
    const r = [];
    _(this, $, Ge);
    let n = [this];
    const a = Dr(e), i = [];
    for (let c = 0, l = a.length; c < l; c++) {
      const d = a[c], h = c === l - 1, y = [];
      for (let T = 0, O = n.length; T < O; T++) {
        const R = n[T], D = u(R, H)[d];
        D && (_(D, $, u(R, $)), h ? (u(D, H)["*"] && r.push(
          ...I(this, ne, Se).call(this, u(D, H)["*"], t, u(R, $))
        ), r.push(...I(this, ne, Se).call(this, D, t, u(R, $)))) : y.push(D));
        for (let P = 0, le = u(R, Ie).length; P < le; P++) {
          const Q = u(R, Ie)[P], L = u(R, $) === Ge ? {} : { ...u(R, $) };
          if (Q === "*") {
            const de = u(R, H)["*"];
            de && (r.push(...I(this, ne, Se).call(this, de, t, u(R, $))), _(de, $, L), y.push(de));
            continue;
          }
          const [U, Ce, ee] = Q;
          if (!d && !(ee instanceof RegExp))
            continue;
          const Z = u(R, H)[U], ct = a.slice(c).join("/");
          if (ee instanceof RegExp) {
            const de = ee.exec(ct);
            if (de) {
              if (L[Ce] = de[0], r.push(...I(this, ne, Se).call(this, Z, t, u(R, $), L)), Object.keys(u(Z, H)).length) {
                _(Z, $, L);
                const At = ((o = de[0].match(/\//)) == null ? void 0 : o.length) ?? 0;
                (i[At] || (i[At] = [])).push(Z);
              }
              continue;
            }
          }
          (ee === !0 || ee.test(d)) && (L[Ce] = d, h ? (r.push(...I(this, ne, Se).call(this, Z, t, L, u(R, $))), u(Z, H)["*"] && r.push(
            ...I(this, ne, Se).call(this, u(Z, H)["*"], t, L, u(R, $))
          )) : (_(Z, $, L), y.push(Z)));
        }
      }
      n = y.concat(i.shift() ?? []);
    }
    return r.length > 1 && r.sort((c, l) => c.score - l.score), [r.map(({ handler: c, params: l }) => [c, l])];
  }
}, ve = new WeakMap(), H = new WeakMap(), Ie = new WeakMap(), ze = new WeakMap(), $ = new WeakMap(), ne = new WeakSet(), Se = function(t, e, r, s) {
  const n = [];
  for (let a = 0, i = u(t, ve).length; a < i; a++) {
    const o = u(t, ve)[a], c = o[e] || o[N], l = {};
    if (c !== void 0 && (c.params = /* @__PURE__ */ Object.create(null), n.push(c), r !== Ge || s && s !== Ge))
      for (let d = 0, h = c.possibleKeys.length; d < h; d++) {
        const y = c.possibleKeys[d], T = l[c.score];
        c.params[y] = s != null && s[y] && !T ? s[y] : r[y] ?? (s == null ? void 0 : s[y]), l[c.score] = !0;
      }
  }
  return n;
}, kr), Re, Sr, cn = (Sr = class {
  constructor() {
    v(this, "name", "TrieRouter");
    k(this, Re);
    _(this, Re, new Gr());
  }
  add(t, e, r) {
    const s = Mr(e);
    if (s) {
      for (let n = 0, a = s.length; n < a; n++)
        u(this, Re).insert(t, s[n], r);
      return;
    }
    u(this, Re).insert(t, e, r);
  }
  match(t, e) {
    return u(this, Re).search(t, e);
  }
}, Re = new WeakMap(), Sr), ln = class extends qr {
  constructor(t = {}) {
    super(t), this.router = t.router ?? new on({
      routers: [new an(), new cn()]
    });
  }
};
const x = new ln(), Ct = /* @__PURE__ */ new Map();
function mr(t, e = 60, r = 6e4) {
  const s = Date.now(), n = Ct.get(t) || { tokens: e, last: s }, a = s - n.last, i = Math.floor(a / r) * e;
  return n.tokens = Math.min(e, n.tokens + i), n.last = s, n.tokens <= 0 ? (Ct.set(t, n), !1) : (n.tokens -= 1, Ct.set(t, n), !0);
}
async function dn(t, e, r = 60, s = 6e4) {
  try {
    if (!t.env.RATE_LIMITER) return mr(e, r, s);
    const n = t.env.RATE_LIMITER.idFromName(e), a = t.env.RATE_LIMITER.get(n), i = new URL("https://do.local/consume");
    i.searchParams.set("key", e), i.searchParams.set("limit", String(r)), i.searchParams.set("intervalMs", String(s));
    const o = await a.fetch(new Request(i.toString()));
    return o.ok ? !!(await o.json().catch(() => ({ ok: !1 }))).ok : !1;
  } catch {
    return mr(e, r, s);
  }
}
function Yr(t) {
  var n;
  const e = t.req.header("Authorization") || "", r = e.startsWith("Bearer ") ? e.slice(7) : "";
  return (r ? (n = Vt(r)) == null ? void 0 : n.sub : void 0) || t.req.header("CF-Connecting-IP") || "anon";
}
async function un(t) {
  const r = (t.req.header("Referer") || "").includes("/demo") || t.req.header("X-Demo-Mode") === "true";
  if (t.env.ENVIRONMENT !== "production" || r) return !0;
  const s = t.req.header("Authorization") || "", n = s.startsWith("Bearer ") ? s.slice(7) : "";
  if (!n) return !1;
  const a = t.env.API_JWKS_URL || (t.env.AUTH0_DOMAIN ? `https://${t.env.AUTH0_DOMAIN}/.well-known/jwks.json` : void 0);
  return a ? (await Ir(n, {
    iss: t.env.API_ISS || (t.env.AUTH0_DOMAIN ? `https://${t.env.AUTH0_DOMAIN}/` : void 0),
    aud: t.env.API_AUD,
    jwksUrl: a
  })).ok : (await Er(n, {
    iss: t.env.API_ISS || (t.env.AUTH0_DOMAIN ? `https://${t.env.AUTH0_DOMAIN}/` : void 0),
    aud: t.env.API_AUD
  })).ok;
}
x.use("*", async (t, e) => {
  const r = t.req.header("Origin") || null, s = (t.env.ALLOWED_ORIGINS || "").split(",").map((d) => d.trim()).filter(Boolean), n = crypto.randomUUID();
  if (t.req.method === "OPTIONS") {
    const d = Ft(r, s);
    return d.set("X-Correlation-Id", n), t.newResponse(null, { status: 204, headers: d });
  }
  await e();
  const a = t.res ?? new Response(null), i = new URL(t.req.url).pathname, o = i === "/login" || i.startsWith("/login/"), c = i === "/demo" || i.startsWith("/demo/");
  let l;
  o ? l = [
    "default-src 'self'",
    "img-src 'self' data: https:",
    "style-src 'self' 'unsafe-inline'",
    "script-src 'self' 'unsafe-inline' https://cdn.auth0.com https://static.cloudflareinsights.com",
    "connect-src 'self' https: wss:",
    "frame-ancestors 'none'"
  ].join("; ") : c ? l = [
    "default-src 'self'",
    "img-src 'self' data: https:",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com",
    "connect-src 'self' https: wss:",
    "frame-ancestors 'none'"
  ].join("; ") : l = [
    "default-src 'self'",
    // Allow local and external images (e.g., icons, remote logos)
    "img-src 'self' data: https:",
    // Allow inlined styles and Google Fonts CSS for branding
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    // Allow Google Fonts files
    "font-src 'self' https://fonts.gstatic.com",
    // App scripts are self only
    "script-src 'self'",
    // API/WebSocket connections
    "connect-src 'self' https: wss:",
    // Allow Auth0 silent auth iframes and keep clickjacking protection
    `frame-src 'self' ${t.env.AUTH0_DOMAIN ? `https://${t.env.AUTH0_DOMAIN}` : "https://*.auth0.com"} https://*.auth0.com`,
    "frame-ancestors 'none'"
  ].join("; ");
  try {
    const d = a.headers;
    d.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    ), d.set("X-Content-Type-Options", "nosniff"), d.set("X-Frame-Options", "DENY"), d.set("Referrer-Policy", "no-referrer"), d.set("Permissions-Policy", "geolocation=(), microphone=(), camera=()"), d.set("Content-Security-Policy", l), d.set("X-Correlation-Id", n), Ft(r, s).forEach((y, T) => d.set(T, y));
  } catch (d) {
    W.warn("header_injection_failed", { error: d.message });
  }
  return a;
});
x.use("/api/*", async (t, e) => {
  const s = new URL(t.req.url).pathname, n = t.req.method === "GET" && (s === "/api/ws-url" || s === "/api/ws-device-token" || s === "/api/ws-user-id" || s === "/api/ws-live-enabled"), a = Yr(t);
  return await dn(t, a) ? !n && !await un(t) ? t.json({ error: "unauthorized" }, 401) : e() : t.json({ error: "rate_limited" }, 429);
});
x.use("/*", async (t, e) => {
  var o;
  if (t.req.method !== "GET") return e();
  const r = new URL(t.req.url), s = r.pathname, n = r.searchParams.has("code"), a = r.searchParams.has("state");
  if ((n || a) && s !== "/callback")
    return t.redirect(`/callback${r.search}`, 302);
  if (s === "/login" || s.startsWith("/login/") || s === "/callback")
    return e();
  const i = await ((o = t.env.ASSETS) == null ? void 0 : o.fetch(t.req.raw));
  return !i || i.status === 404 ? e() : i;
});
x.get("/health", (t) => t.json({
  status: "healthy",
  timestamp: (/* @__PURE__ */ new Date()).toISOString(),
  environment: t.env.ENVIRONMENT || "unknown"
}));
x.get("/app-config.js", (t) => {
  const e = t.env.AUTH0_DOMAIN || "", r = t.env.AUTH0_CLIENT_ID || "", n = `${t.env.BASE_URL || new URL(t.req.url).origin}/callback`, a = (t.env.ENVIRONMENT || "unknown") === "production" ? "local" : "network", i = `// Runtime app config (loaded before app bundle)
window.__VITALSENSE_CONFIG__ = ${JSON.stringify({
    environment: t.env.ENVIRONMENT || "unknown",
    auth0: {
      domain: e,
      clientId: r,
      redirectUri: n,
      audience: "https://vitalsense-health-api",
      scope: "openid profile email read:health_data write:health_data manage:emergency_contacts"
    }
  })};

// KV mode hint: 'local' => client-only storage; 'network' => use server endpoint
window.__VITALSENSE_KV_MODE = ${JSON.stringify(a)};

// Compatibility for @github/spark/hooks (expects a global var, not just window prop)
var BASE_KV_SERVICE_URL = ${JSON.stringify(a === "network" ? "/api" : "")};
// also expose on window for code that reads from window
window.BASE_KV_SERVICE_URL = BASE_KV_SERVICE_URL;
`;
  return new Response(i, {
    headers: { "content-type": "application/javascript; charset=utf-8" }
  });
});
x.get("/callback", async (t) => {
  var e;
  try {
    const r = new URL(t.req.url), s = r.searchParams.has("code"), n = r.searchParams.has("state");
    if (!s && !n)
      return (t.req.header("Cookie") || "").includes("auth0.is.authenticated=true"), t.redirect("/", 302);
    const a = new URL(t.req.url), i = new URL("/index.html", a.origin), o = new Request(i.toString(), { method: "GET" }), c = await ((e = t.env.ASSETS) == null ? void 0 : e.fetch(o));
    return !c || c.status === 404 ? t.text("Callback handler unavailable (index.html not found)", 500) : c;
  } catch (r) {
    try {
      console.error("callback_handler_error", r);
    } catch {
    }
    return t.text("Callback handler error", 500);
  }
});
x.get("/api/ws-url", (t) => {
  const e = t.req.url.startsWith("https") ? "wss" : "ws", r = new URL(t.req.url).host;
  return t.json({
    url: `${e}://${r}/ws`,
    fallback: t.env.WEBSOCKET_URL || `${e}://${r}/ws`
  });
});
x.get("/api/ws-device-token", (t) => (t.req.header("Referer") || "").includes("/demo") ? t.json({ token: "demo-device-token" }) : t.json({ token: "device-token-placeholder" }));
x.get("/api/ws-user-id", (t) => (t.req.header("Referer") || "").includes("/demo") ? t.json({ userId: "demo-user-vitalsense" }) : t.json({ userId: "user-id-placeholder" }));
x.get("/api/ws-live-enabled", (t) => t.json({ enabled: !0 }));
x.get("/api/user/emergency-contacts", async (t) => {
  try {
    const e = t.env.HEALTH_KV;
    if (!e || typeof e.get != "function")
      return t.json({ contacts: [] }, 200);
    const r = t.req.header("Authorization") || "", s = r.startsWith("Bearer ") ? r.slice(7) : "", n = s ? Vt(s) : null, a = (n == null ? void 0 : n.sub) || null;
    if (!a) return t.json({ error: "unauthorized" }, 401);
    const i = `user:contacts:${encodeURIComponent(a)}`, o = await e.get(i);
    if (!o) return t.json({ contacts: [], updatedAt: null }, 200);
    const c = t.env.ENC_KEY;
    let l = null;
    try {
      if (c) {
        const y = await ce(c);
        l = await St(y, o);
      } else
        l = JSON.parse(o);
    } catch (y) {
      return W.error("contacts_read_parse_failed", { error: y.message }), t.json({ error: "contacts_parse_failed" }, 500);
    }
    const d = Array.isArray(l == null ? void 0 : l.contacts) ? l.contacts : [], h = (l == null ? void 0 : l.updatedAt) || null;
    return t.json({ contacts: d, updatedAt: h }, 200);
  } catch (e) {
    return W.error("contacts_read_failed", { error: e.message }), t.json({ error: "contacts_read_failed" }, 500);
  }
});
x.put("/api/user/emergency-contacts", async (t) => {
  try {
    const e = t.env.HEALTH_KV;
    if (!e || typeof e.put != "function")
      return t.json({ error: "storage_unavailable" }, 503);
    const r = t.req.header("Authorization") || "", s = r.startsWith("Bearer ") ? r.slice(7) : "", n = s ? Vt(s) : null, a = (n == null ? void 0 : n.sub) || null;
    if (!a) return t.json({ error: "unauthorized" }, 401);
    const i = (n == null ? void 0 : n.permissions) || [], o = (n == null ? void 0 : n.scope) || "";
    if (!(i.includes("manage:emergency_contacts") || o.split(" ").includes("manage:emergency_contacts"))) return t.json({ error: "forbidden" }, 403);
    const l = await t.req.json().catch(() => null), h = B({
      contacts: zt(j().min(1).max(256)).max(50)
    }).safeParse(l);
    if (!h.success)
      return t.json(
        { error: "invalid_body", details: h.error.flatten() },
        400
      );
    const y = Array.from(
      new Set(h.data.contacts.map((P) => P.trim()).filter(Boolean))
    ), T = `user:contacts:${encodeURIComponent(a)}`, O = {
      version: 1,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      contacts: y
    };
    let R;
    const D = t.env.ENC_KEY;
    if (D) {
      const P = await ce(D);
      R = await ot(P, O);
    } else
      R = JSON.stringify(O);
    return await e.put(T, R), await kt(t.env, {
      type: "update_contacts",
      actor: a,
      resource: "kv:user:contacts",
      meta: { count: y.length }
    }), t.json({ ok: !0, updatedAt: O.updatedAt }, 200);
  } catch (e) {
    return W.error("contacts_write_failed", { error: e.message }), t.json({ error: "contacts_write_failed" }, 500);
  }
});
x.get("/ws", async (t) => {
  if (t.req.header("upgrade") !== "websocket")
    return t.text("Expected Upgrade: websocket", 426);
  if (!t.env.HEALTH_WEBSOCKET)
    return t.text("WebSocket service not available", 503);
  const r = t.env.HEALTH_WEBSOCKET.newUniqueId();
  return t.env.HEALTH_WEBSOCKET.get(r).fetch(t.req.raw);
});
x.get("/api/_selftest", async (t) => {
  if (t.env.ENVIRONMENT === "production")
    return t.json({ error: "not_available" }, 404);
  const e = {};
  try {
    const r = t.env.ENC_KEY;
    if (r) {
      const s = await ce(r), n = { hello: "world", at: Date.now() }, a = await ot(s, n);
      e.aes_gcm = { ok: !0, ciphertextLength: a.length };
    } else
      e.aes_gcm = { ok: !1, reason: "no_key" };
  } catch (r) {
    e.aes_gcm = { ok: !1, error: r.message };
  }
  try {
    const r = "eyJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJiYSIsImF1ZCI6ImF1ZCIsImV4cCI6MX0.signature", s = t.env.API_JWKS_URL;
    if (s) {
      const n = await Ir(r, {
        iss: "ba",
        aud: "aud",
        jwksUrl: s
      });
      e.jwt_jwks_negative = { ok: !n.ok };
    } else
      e.jwt_claims_negative = {
        ok: !(await Er(r)).ok
      };
  } catch (r) {
    e.jwt_error = { ok: !1, error: r.message };
  }
  return t.json({ ok: !0, results: e });
});
x.get("/api/_ratelimit", async (t) => {
  if (t.env.ENVIRONMENT === "production")
    return t.json({ error: "not_available" }, 404);
  const e = new URL(t.req.url).searchParams.get("key") || Yr(t);
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
x.get("/api/_audit", async (t) => {
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
        const d = (await new Response(c.body).text()).split(`
`)[0];
        i.push({ key: o.key, line: d });
      } else
        i.push({ key: o.key });
    }
    return t.json({ ok: !0, count: i.length, events: i });
  } catch (n) {
    return t.json({ ok: !1, error: n.message }, 500);
  }
});
x.post("/api/device/auth", async (t) => {
  const e = t.env.DEVICE_JWT_SECRET;
  if (!e) return t.json({ error: "not_configured" }, 500);
  const r = B({
    userId: j().min(1),
    clientType: $e(["ios_app", "web_dashboard"]).default("ios_app"),
    ttlSec: jr.number().min(60).max(3600).optional()
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
  } catch (o) {
    return W.error("device_token_parse_failed", { error: o.message }), t.json({ error: "invalid_json" }, 400);
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
    return W.error("device_token_sign_failed", { error: o.message }), t.json({ error: "server_error" }, 500);
  }
});
x.post("/api/_purge", async (t) => {
  if (t.env.ENVIRONMENT === "production")
    return t.json({ error: "not_available" }, 404);
  const e = new URL(t.req.url), r = Math.max(
    1,
    Math.min(2e3, Number(e.searchParams.get("limit") || 1e3))
  ), s = e.searchParams.get("prefix") || "health:", n = t.env.HEALTH_KV;
  if (!n || typeof n.list != "function" || typeof n.delete != "function")
    return t.json({ ok: !0, scanned: 0, deleted: 0 });
  const a = await Ar(t.env, n, { limit: r, prefix: s });
  return t.json({ ok: !0, ...a });
});
x.post("/api/health-data/process", async (t) => {
  let e;
  try {
    e = await t.req.json();
  } catch {
    return t.json({ error: "invalid_json" }, 400);
  }
  const r = qt.safeParse(e);
  if (!r.success)
    return t.json(
      { error: "validation_error", details: r.error.flatten() },
      400
    );
  try {
    const s = await Qr(
      t,
      r.data.type,
      r.data.userId
    ), n = await xr.processHealthMetric(
      r.data,
      s
    ), a = t.env.HEALTH_KV;
    if (a) {
      const o = `health:${n.type}:${n.processedAt}`, c = t.env.ENC_KEY ? await ce(t.env.ENC_KEY) : null, l = c ? await ot(c, n) : JSON.stringify(n), d = bt(n.type, t.env.ENVIRONMENT);
      await a.put(o, l, { expirationTtl: d });
    }
    const i = t.res.headers.get("X-Correlation-Id") || "";
    return await kt(t.env, {
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
    return W.error("Health data processing failed", {
      error: s.message,
      metric: r.data.type
    }), t.json({ error: "processing_failed" }, 500);
  }
});
x.post("/api/health-data/batch", async (t) => {
  let e;
  try {
    e = await t.req.json();
  } catch {
    return t.json({ error: "invalid_json" }, 400);
  }
  const r = js.safeParse(e);
  if (!r.success)
    return t.json(
      { error: "validation_error", details: r.error.flatten() },
      400
    );
  try {
    const s = [], n = [];
    for (const i of r.data.metrics)
      try {
        const o = await Qr(
          t,
          i.type,
          i.userId
        ), c = await xr.processHealthMetric(
          i,
          o
        ), l = t.env.HEALTH_KV;
        if (l) {
          const d = `health:${c.type}:${c.processedAt}`, h = t.env.ENC_KEY ? await ce(t.env.ENC_KEY) : null, y = h ? await ot(h, c) : JSON.stringify(c), T = bt(
            c.type,
            t.env.ENVIRONMENT
          );
          await l.put(d, y, { expirationTtl: T });
        }
        s.push(c);
      } catch (o) {
        n.push(`${i.type}: ${o.message}`);
      }
    const a = t.res.headers.get("X-Correlation-Id") || "";
    return await kt(t.env, {
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
    return W.error("Batch processing failed", {
      error: s.message,
      batchSize: r.data.metrics.length
    }), t.json({ error: "batch_processing_failed" }, 500);
  }
});
async function hn(t, e) {
  if (e)
    try {
      return await St(e, t);
    } catch {
      return null;
    }
  else
    try {
      return JSON.parse(t);
    } catch {
      return null;
    }
}
async function fn(t, e, r) {
  if (!t || typeof t.list != "function" || typeof t.get != "function")
    return [];
  const n = await t.list({ prefix: "health:", limit: 100 }), a = [];
  for (const i of n.keys) {
    const o = await t.get(i.name);
    if (!o) continue;
    const c = await hn(o, r);
    if (!c) continue;
    const l = xt.safeParse(c);
    if (!l.success) continue;
    const d = l.data;
    d.source.userId === e && a.push(d);
  }
  return a;
}
x.get("/api/health-data/analytics/:userId", async (t) => {
  const e = t.req.param("userId");
  if (!e)
    return t.json({ error: "user_id_required" }, 400);
  if (((t.req.header("Referer") || "").includes("/demo") || t.req.header("X-Demo-Mode") === "true") && e === "demo-user-vitalsense") {
    const n = {
      totalDataPoints: 42,
      last24Hours: 8,
      last7Days: 42,
      averageHealthScore: 87.5,
      alerts: {
        critical: 0,
        warning: 1,
        total: 1
      },
      fallRiskDistribution: {
        low: 40,
        moderate: 2,
        high: 0,
        critical: 0
      },
      metricTypes: ["heart_rate", "steps", "sleep", "blood_pressure"],
      dataQualityScore: 94.2,
      lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
    };
    return t.json({ ok: !0, analytics: n });
  }
  try {
    const n = t.env.HEALTH_KV;
    if (!n || typeof n.list != "function" || typeof n.get != "function")
      return t.json({ ok: !0, analytics: null });
    const a = t.env.ENC_KEY, i = a ? await ce(a) : null, o = await fn(n, e, i), c = mn(o);
    return t.json({ ok: !0, analytics: c });
  } catch (n) {
    return W.error("Analytics calculation failed", {
      error: n.message,
      userId: e
    }), t.json({ error: "analytics_failed" }, 500);
  }
});
async function Qr(t, e, r) {
  const s = t.env.HEALTH_KV;
  if (!s || !r || typeof s.list != "function" || typeof s.get != "function")
    return [];
  try {
    const n = `health:${e}:`, a = await s.list({ prefix: n, limit: 30 }), i = t.env.ENC_KEY, o = i ? await ce(i) : null, c = [];
    for (const l of a.keys) {
      const d = await s.get(l.name);
      if (!d) continue;
      const h = o ? await (async () => {
        try {
          return await St(o, d);
        } catch {
          return null;
        }
      })() : (() => {
        try {
          return JSON.parse(d);
        } catch {
          return null;
        }
      })();
      if (!h) continue;
      const y = xt.safeParse(h);
      if (!y.success) continue;
      const T = y.data;
      T.source.userId === r && c.push(T);
    }
    return c.sort(
      (l, d) => new Date(d.processedAt).getTime() - new Date(l.processedAt).getTime()
    );
  } catch {
    return [];
  }
}
function mn(t) {
  const e = Date.now(), r = t.filter(
    (d) => e - new Date(d.processedAt).getTime() < 1440 * 60 * 1e3
  ), s = t.filter(
    (d) => e - new Date(d.processedAt).getTime() < 10080 * 60 * 1e3
  ), n = t.length > 0 ? t.filter((d) => d.healthScore !== void 0).reduce((d, h) => d + (h.healthScore || 0), 0) / t.filter((d) => d.healthScore !== void 0).length : 0, a = t.filter(
    (d) => {
      var h;
      return ((h = d.alert) == null ? void 0 : h.level) === "critical";
    }
  ).length, i = t.filter((d) => {
    var h;
    return ((h = d.alert) == null ? void 0 : h.level) === "warning";
  }).length, o = {
    low: t.filter((d) => d.fallRisk === "low").length,
    moderate: t.filter((d) => d.fallRisk === "moderate").length,
    high: t.filter((d) => d.fallRisk === "high").length,
    critical: t.filter((d) => d.fallRisk === "critical").length
  }, c = [...new Set(t.map((d) => d.type))], l = t.length > 0 && t.some((d) => d.dataQuality) ? t.filter((d) => d.dataQuality).reduce(
    (d, h) => d + (h.dataQuality.completeness + h.dataQuality.accuracy + h.dataQuality.timeliness + h.dataQuality.consistency) / 4,
    0
  ) / t.filter((d) => d.dataQuality).length : 0;
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
    lastUpdated: t.length > 0 ? [...t].sort(
      (d, h) => new Date(h.processedAt).getTime() - new Date(d.processedAt).getTime()
    )[0].processedAt : null
  };
}
x.get("/api/kv/:key", async (t) => {
  try {
    const e = t.req.param("key"), r = t.env.HEALTH_KV;
    if (!(r != null && r.get))
      return t.json({ error: "KV storage not available" }, 503);
    const s = await r.get(e);
    return t.json({ key: e, value: s });
  } catch (e) {
    return console.error("KV get error:", e), t.json({ error: "Failed to get value" }, 500);
  }
});
x.put("/api/kv/:key", async (t) => {
  try {
    const e = t.req.param("key"), r = await t.req.json(), s = t.env.HEALTH_KV;
    return s ? (await s.put(e, JSON.stringify(r.value)), t.json({ success: !0, key: e })) : t.json({ error: "KV storage not available" }, 503);
  } catch (e) {
    return console.error("KV put error:", e), t.json({ error: "Failed to save value" }, 500);
  }
});
x.delete("/api/kv/:key", async (t) => {
  try {
    const e = t.req.param("key"), r = t.env.HEALTH_KV;
    return r != null && r.delete ? (await r.delete(e), t.json({ success: !0, key: e })) : t.json({ error: "KV storage not available" }, 503);
  } catch (e) {
    return console.error("KV delete error:", e), t.json({ error: "Failed to delete value" }, 500);
  }
});
function pn() {
  const t = /* @__PURE__ */ new Date(), e = [];
  for (let s = 0; s < 7; s++) {
    const n = new Date(t.getTime() - s * 24 * 60 * 60 * 1e3);
    e.push({
      id: `demo-heart-rate-${s}`,
      type: "heart_rate",
      value: 70 + Math.floor(Math.random() * 10),
      unit: "bpm",
      timestamp: n.toISOString(),
      processedAt: n.toISOString(),
      source: {
        userId: "demo-user-vitalsense",
        deviceId: "demo-device",
        appVersion: "1.0.0-demo"
      },
      healthScore: 85 + Math.floor(Math.random() * 10),
      fallRisk: "low",
      anomalyScore: 0.1 + Math.random() * 0.2,
      dataQuality: {
        completeness: 0.95,
        accuracy: 0.98,
        timeliness: 0.92,
        consistency: 0.96
      }
    }), e.push({
      id: `demo-steps-${s}`,
      type: "steps",
      value: 8e3 + Math.floor(Math.random() * 3e3),
      unit: "count",
      timestamp: n.toISOString(),
      processedAt: n.toISOString(),
      source: {
        userId: "demo-user-vitalsense",
        deviceId: "demo-device",
        appVersion: "1.0.0-demo"
      },
      healthScore: 88 + Math.floor(Math.random() * 8),
      fallRisk: "low",
      anomalyScore: 0.05 + Math.random() * 0.15,
      dataQuality: {
        completeness: 0.98,
        accuracy: 0.95,
        timeliness: 0.9,
        consistency: 0.94
      }
    });
  }
  return [...e].sort(
    (s, n) => new Date(n.timestamp).getTime() - new Date(s.timestamp).getTime()
  );
}
x.get("/api/health-data", async (t) => {
  if ((t.req.header("Referer") || "").includes("/demo") || t.req.header("X-Demo-Mode") === "true") {
    const O = pn();
    return t.json({
      ok: !0,
      data: O,
      hasMore: !1
    });
  }
  const s = B({
    from: j().datetime().optional(),
    to: j().datetime().optional(),
    metric: qt.shape.type.optional(),
    limit: jr.number().min(1).max(500).optional(),
    cursor: j().optional()
  }), n = new URL(t.req.url), a = Object.fromEntries(n.searchParams.entries()), i = s.safeParse(a);
  if (!i.success)
    return t.json(
      { error: "validation_error", details: i.error.flatten() },
      400
    );
  const { from: o, to: c, metric: l, cursor: d } = i.data, h = i.data.limit ?? 100, y = t.env.HEALTH_KV;
  if (!y || typeof y.list != "function" || typeof y.get != "function")
    return t.json({ ok: !0, data: [] });
  const T = l ? `health:${l}:` : "health:";
  try {
    const O = await y.list({ prefix: T, limit: h, cursor: d }), R = t.env.ENC_KEY, D = R ? await ce(R) : null, P = (L) => {
      const U = new Date(L.processedAt).getTime();
      return !(o && U < new Date(o).getTime() || c && U > new Date(c).getTime());
    };
    async function le(L, U, Ce) {
      if (!Ce || typeof Ce.get != "function") return null;
      const ee = await Ce.get(L.name);
      if (!ee) return null;
      let Z;
      if (U)
        try {
          Z = await St(U, ee);
        } catch {
          return null;
        }
      else
        try {
          Z = JSON.parse(ee);
        } catch {
          return null;
        }
      const ct = xt.safeParse(Z);
      return ct.success ? ct.data : null;
    }
    const Q = [];
    for (const L of O.keys) {
      const U = await le(L, D, y);
      if (U && P(U) && (Q.push(U), Q.length >= h))
        break;
    }
    return Q.sort((L, U) => L.processedAt < U.processedAt ? 1 : -1), t.json({
      ok: !0,
      data: Q,
      nextCursor: O.list_complete ? void 0 : O.cursor,
      hasMore: O.list_complete === !1
    });
  } catch (O) {
    return W.error("KV read failed", { error: O.message }), t.json({ error: "server_error" }, 500);
  }
});
x.post("/api/health-data", async (t) => {
  let e;
  try {
    e = await t.req.json();
  } catch {
    return t.json({ error: "invalid_json" }, 400);
  }
  const r = xt.safeParse(e);
  if (!r.success)
    return t.json(
      { error: "validation_error", details: r.error.flatten() },
      400
    );
  try {
    const s = t.env.HEALTH_KV;
    if (s) {
      const a = `health:${r.data.type}:${r.data.processedAt}`, i = t.env.ENC_KEY ? await ce(t.env.ENC_KEY) : null, o = i ? await ot(i, r.data) : JSON.stringify(r.data), c = bt(r.data.type, t.env.ENVIRONMENT);
      await s.put(a, o, { expirationTtl: c });
    }
    const n = t.res.headers.get("X-Correlation-Id") || "";
    await kt(t.env, {
      type: "health_data_created",
      actor: "api",
      resource: "kv:health",
      meta: { type: r.data.type, correlationId: n }
    });
  } catch (s) {
    return W.error("KV write failed", { error: s.message }), t.json({ error: "server_error" }, 500);
  }
  return t.json({ ok: !0, data: r.data }, 201);
});
x.post("/_spark/loaded", async (t) => t.json({ ok: !0, status: "loaded" }));
x.get("/demo", async (t) => {
  if (!t.env.ASSETS)
    return t.text("Assets not available", 500);
  const e = await t.env.ASSETS.fetch(
    new Request(`${new URL(t.req.url).origin}/index.html`)
  );
  if (!e.ok)
    return t.text(
      `App not available: ${e.status} ${e.statusText}`,
      500
    );
  let r = await e.text();
  const s = {
    id: "demo-user-vitalsense",
    name: "Demo User",
    email: "demo@vitalsense.health",
    picture: "https://via.placeholder.com/64x64/2563eb/ffffff?text=VT",
    authenticated: !0,
    mode: "demo"
  }, n = `
    <meta name="vitalsense-demo-mode" content="true">
    <meta name="vitalsense-demo-user" content='${JSON.stringify(s)}'>
    <script>
      // CRITICAL: Patch Array.prototype.slice IMMEDIATELY before anything else loads
      (function() {
        const originalSlice = Array.prototype.slice;
        Array.prototype.slice = function(...args) {
          // If 'this' is null, undefined, or not array-like, return empty array
          if (this == null || typeof this !== 'object') {
            console.warn('slice() called on non-array:', this);
            return [];
          }
          // If 'this' doesn't have a length property, return empty array
          if (typeof this.length !== 'number') {
            console.warn('slice() called on object without length:', this);
            return [];
          }
          try {
            return originalSlice.apply(this, args);
          } catch (e) {
            console.warn('slice() failed, returning empty array:', e);
            return [];
          }
        };
      })();

      // VitalSense Demo Mode - Set immediately before any other scripts
      window.VITALSENSE_DEMO_MODE = true;
      window.VITALSENSE_DEMO_USER = ${JSON.stringify(s)};
      window.vitalsense_demo_mode = true;
      window.vitalsense_demo_user = ${JSON.stringify(s)};
      window.vitalsense_bypass_auth = true;

      // Global error handlers that run before React loads
      window.addEventListener('error', function(e) {
        if (e.message && e.message.includes('slice is not a function')) {
          console.error('CRITICAL: slice error caught before React:', e);
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
        if (e.message && e.message.includes('is not a function')) {
          console.error('CRITICAL: function error caught:', e);
          // Don't prevent - let React error boundary handle it
        }
      });

      window.addEventListener('unhandledrejection', function(e) {
        if (e.reason && e.reason.message && e.reason.message.includes('slice is not a function')) {
          console.error('CRITICAL: slice promise rejection caught:', e);
          e.preventDefault();
        }
      });

      // Override fetch to add demo mode header for API requests
      const originalFetch = window.fetch;
      window.fetch = function(input, init = {}) {
        if (typeof input === 'string' && input.includes('/api/')) {
          init.headers = {
            ...init.headers,
            'X-Demo-Mode': 'true',
            'X-Demo-User': 'demo-user-vitalsense'
          };
        }
        return originalFetch(input, init);
      };

  // Define missing environment variables for demo mode
  // Provide as both global var and window property for broad compatibility
  var BASE_KV_SERVICE_URL = '/api';
  window.BASE_KV_SERVICE_URL = BASE_KV_SERVICE_URL;
      window.GITHUB_RUNTIME_PERMANENT_NAME = 'vitalsense-demo';

  // Disable WebSocket connections in demo mode (read by client hook)
  window.VITALSENSE_DISABLE_WEBSOCKET = true;

      // Defensive array helper for .slice() errors
      window.safeSlice = function(arr, ...args) {
        if (!Array.isArray(arr)) return [];
        return arr.slice(...args);
      };

      // Global error handler for unhandled array issues
      window.addEventListener('error', function(e) {
        if (e.message && e.message.includes('slice is not a function')) {
          console.warn('Array slice error caught and handled:', e);
          e.preventDefault();
          return false;
        }
      });

      // Patch Array prototype temporarily for safety
      const originalArraySlice = Array.prototype.slice;
      Array.prototype.slice = function(...args) {
        if (this == null) {
          console.warn('slice called on null/undefined, returning empty array');
          return [];
        }
        return originalArraySlice.apply(this, args);
      };

      // Override WebSocket constructor to prevent connections to localhost
      const OriginalWebSocket = window.WebSocket;
      window.WebSocket = function(url, protocols) {
        console.log('🛡️ Demo mode: WebSocket connection blocked to', url);
        // Return a mock WebSocket that doesn't actually connect
        const mockWS = new EventTarget();
        mockWS.url = url;
        mockWS.readyState = 0; // CONNECTING
        mockWS.send = function() { console.log('🛡️ Demo mode: WebSocket.send() blocked'); };
        mockWS.close = function() { console.log('🛡️ Demo mode: WebSocket.close() called'); };

        // Simulate connection failure after a short delay
        setTimeout(() => {
          const errorEvent = new Event('error');
          mockWS.dispatchEvent(errorEvent);
          mockWS.readyState = 3; // CLOSED
        }, 100);

        return mockWS;
      };

      // Store in localStorage for persistence
      try {
        localStorage.setItem('vitalsense_demo_mode', 'true');
        localStorage.setItem('vitalsense_demo_user', JSON.stringify(${JSON.stringify(s)}));
        localStorage.setItem('VITALSENSE_DEMO_MODE', 'true');
        localStorage.setItem('auth_bypass', 'demo');
      } catch(e) { console.warn('localStorage not available:', e); }

      console.log('🚀 VitalSense Demo Mode Activated!', window.vitalsense_demo_user);

      // Override any auth redirects globally
      const originalAssign = Location.prototype.assign;
      const originalReplace = Location.prototype.replace;

      Location.prototype.assign = function(url) {
        if (url.includes('/login') || url.includes('/auth')) {
          console.log('🛡️ Demo mode: blocking auth redirect to', url);
          return;
        }
        return originalAssign.call(this, url);
      };

      Location.prototype.replace = function(url) {
        if (url.includes('/login') || url.includes('/auth')) {
          console.log('🛡️ Demo mode: blocking auth redirect to', url);
          return;
        }
        return originalReplace.call(this, url);
      };
    <\/script>
  `;
  r = r.replace("</head>", n + "</head>");
  const a = `
    <script>
      // Fallback demo mode injection
      if (!window.VITALSENSE_DEMO_MODE) {
        window.VITALSENSE_DEMO_MODE = true;
        window.VITALSENSE_DEMO_USER = ${JSON.stringify(s)};
        window.vitalsense_demo_mode = true;
        window.vitalsense_demo_user = ${JSON.stringify(s)};
        console.log('📦 Fallback: VitalSense Demo Mode Activated!');
      }
    <\/script>
  `;
  return r = r.replace("</body>", a + "</body>"), new Response(r, {
    headers: {
      "Content-Type": "text/html; charset=UTF-8"
    }
  });
});
x.get("/demo/disable", async (t) => t.html(`<!doctype html><html><head><meta charset="utf-8"><title>Disable Demo</title></head><body>
  <script>
    try {
      localStorage.removeItem('vitalsense_demo_mode');
      localStorage.removeItem('vitalsense_demo_user');
      localStorage.removeItem('VITALSENSE_DEMO_MODE');
      localStorage.removeItem('auth_bypass');
      // reset any custom flags used earlier
      localStorage.removeItem('vitalsense_bypass_auth');
      sessionStorage.clear();
    } catch (e) { /* ignore */ }
    // Hard reload root without cache
    location.replace('/');
  <\/script>
  </body></html>`));
x.get("/demo/enable", async (t) => t.html(`<!doctype html><html><head><meta charset="utf-8"><title>Enable Demo</title></head><body>
  <script>
    try {
      localStorage.setItem('vitalsense_demo_mode', 'true');
      localStorage.setItem('VITALSENSE_DEMO_MODE', 'true');
      localStorage.setItem('auth_bypass', 'demo');
    } catch (e) { /* ignore */ }
    location.replace('/demo');
  <\/script>
  </body></html>`));
x.get("/demo-static", async (t) => t.html(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VitalSense Demo - Health Dashboard</title>
    <style>
        :root {
            --vs-primary: #2563eb;
            --vs-secondary: #0891b2;
            --vs-background: #ffffff;
            --vs-foreground: #0f172a;
            --vs-card: #f8fafc;
            --vs-border: #e2e8f0;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, var(--vs-primary) 0%, var(--vs-secondary) 100%);
            min-height: 100vh;
            color: var(--vs-foreground);
        }

        .demo-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
        }

        .demo-header {
            background: white;
            padding: 2rem;
            border-radius: 1rem;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            margin-bottom: 2rem;
            text-align: center;
        }

        .demo-header h1 {
            color: var(--vs-primary);
            font-size: 2.5rem;
            margin-bottom: 0.5rem;
        }

        .demo-header p {
            color: #64748b;
            font-size: 1.1rem;
        }

        .demo-badge {
            background: var(--vs-secondary);
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 0.5rem;
            font-weight: 600;
            display: inline-block;
            margin-bottom: 1rem;
        }

        .demo-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
            margin-bottom: 2rem;
        }

        .demo-card {
            background: white;
            padding: 2rem;
            border-radius: 1rem;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }

        .demo-card h3 {
            color: var(--vs-primary);
            margin-bottom: 1rem;
            font-size: 1.25rem;
        }

        .demo-metric {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.75rem 0;
            border-bottom: 1px solid var(--vs-border);
        }

        .demo-metric:last-child {
            border-bottom: none;
        }

        .demo-value {
            font-weight: 600;
            color: var(--vs-secondary);
        }

        .demo-actions {
            background: white;
            padding: 2rem;
            border-radius: 1rem;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            text-align: center;
        }

        .demo-button {
            background: var(--vs-primary);
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 0.5rem;
            font-size: 1rem;
            font-weight: 500;
            cursor: pointer;
            margin: 0 0.5rem;
            transition: background-color 0.2s;
        }

        .demo-button:hover {
            background: #1d4ed8;
        }

        .demo-button.secondary {
            background: var(--vs-secondary);
        }

        .demo-button.secondary:hover {
            background: #0e7490;
        }
    </style>
</head>
<body>
    <div class="demo-container">
        <div class="demo-header">
            <div class="demo-badge">🚀 DEMO MODE</div>
            <h1>VitalSense Health Dashboard</h1>
            <p>Your Personal Health Intelligence Platform</p>
            <p style="margin-top: 1rem; font-size: 0.9rem; color: #64748b;">
                Welcome, <strong>Demo User</strong> (demo@vitalsense.health)
            </p>
        </div>

        <div class="demo-grid">
            <div class="demo-card">
                <h3>📊 Health Metrics</h3>
                <div class="demo-metric">
                    <span>Heart Rate</span>
                    <span class="demo-value">72 BPM</span>
                </div>
                <div class="demo-metric">
                    <span>Steps Today</span>
                    <span class="demo-value">8,247</span>
                </div>
                <div class="demo-metric">
                    <span>Sleep Score</span>
                    <span class="demo-value">85/100</span>
                </div>
                <div class="demo-metric">
                    <span>Blood Pressure</span>
                    <span class="demo-value">120/80</span>
                </div>
            </div>

            <div class="demo-card">
                <h3>🛡️ Fall Risk Analysis</h3>
                <div class="demo-metric">
                    <span>Risk Level</span>
                    <span class="demo-value" style="color: #10b981;">Low</span>
                </div>
                <div class="demo-metric">
                    <span>Balance Score</span>
                    <span class="demo-value">92/100</span>
                </div>
                <div class="demo-metric">
                    <span>Activity Level</span>
                    <span class="demo-value">Active</span>
                </div>
                <div class="demo-metric">
                    <span>Last Assessment</span>
                    <span class="demo-value">Today</span>
                </div>
            </div>

            <div class="demo-card">
                <h3>🤖 AI Insights</h3>
                <div style="padding: 1rem 0;">
                    <p style="margin-bottom: 1rem;">
                        <strong>💡 Today's Recommendation:</strong><br>
                        Your activity levels are excellent! Consider adding 10 minutes of balance exercises to further reduce fall risk.
                    </p>
                    <p style="margin-bottom: 1rem;">
                        <strong>📈 Trend Analysis:</strong><br>
                        Sleep quality has improved 15% over the past week. Great progress!
                    </p>
                    <p>
                        <strong>⚠️ Alert:</strong><br>
                        No health alerts at this time. All metrics are within normal ranges.
                    </p>
                </div>
            </div>

            <div class="demo-card">
                <h3>👥 Caregiver Dashboard</h3>
                <div class="demo-metric">
                    <span>Connected Caregivers</span>
                    <span class="demo-value">2</span>
                </div>
                <div class="demo-metric">
                    <span>Emergency Contacts</span>
                    <span class="demo-value">3</span>
                </div>
                <div class="demo-metric">
                    <span>Last Check-in</span>
                    <span class="demo-value">2 hours ago</span>
                </div>
                <div class="demo-metric">
                    <span>Sharing Status</span>
                    <span class="demo-value" style="color: #10b981;">Active</span>
                </div>
            </div>
        </div>

        <div class="demo-actions">
            <h3 style="margin-bottom: 1.5rem; color: var(--vs-primary);">Demo Actions</h3>
            <button class="demo-button" onclick="alert('📱 iOS App integration would sync your Apple Health data here!')">
                Connect iOS App
            </button>
            <button class="demo-button secondary" onclick="alert('🚨 Emergency alert system activated! Caregivers would be notified.')">
                Test Emergency Alert
            </button>
            <button class="demo-button" onclick="window.location.href='/login'">
                Exit Demo → Login
            </button>
        </div>

        <div style="text-align: center; padding: 2rem; color: white;">
            <p>🔒 This is a demo environment. No real health data is stored or processed.</p>
            <p style="margin-top: 0.5rem; font-size: 0.9rem; opacity: 0.8;">
                VitalSense • Your Health Intelligence Platform • Demo Mode
            </p>
        </div>
    </div>

    <script>
        console.log('🚀 VitalSense Static Demo Loaded!');

        // Simulate real-time updates
        setInterval(() => {
            const heartRate = document.querySelector('.demo-metric .demo-value');
            if (heartRate && heartRate.textContent.includes('BPM')) {
                const rate = 70 + Math.floor(Math.random() * 6);
                heartRate.textContent = rate + ' BPM';
            }
        }, 5000);
    <\/script>
</body>
</html>`));
x.get("/login", async (t) => {
  const e = t.env.AUTH0_DOMAIN || "", r = t.env.AUTH0_CLIENT_ID || "", n = `${t.env.BASE_URL || new URL(t.req.url).origin || "https://health.andernet.dev"}/callback`, a = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VitalSense Health - Secure Sign In</title>
    <style>
        :root {
            --vs-primary: #2563eb;
            --vs-primary-foreground: #ffffff;
            --vs-secondary: #0891b2;
            --vs-background: #ffffff;
            --vs-foreground: #0f172a;
            --vs-card: #f8fafc;
            --vs-border: #e2e8f0;
            --vs-input: #ffffff;
            --vs-ring: #2563eb;
            --vs-radius: 0.5rem;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, var(--vs-primary) 0%, var(--vs-secondary) 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--vs-foreground);
        }

        .login-container {
            background: var(--vs-background);
            padding: 2rem;
            border-radius: var(--vs-radius);
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
            width: 100%;
            max-width: 400px;
            border: 1px solid var(--vs-border);
        }

        .logo {
            text-align: center;
            margin-bottom: 2rem;
        }

        .logo h1 {
            color: var(--vs-primary);
            font-size: 2rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
        }

        .logo p {
            color: #64748b;
            font-size: 0.875rem;
        }

        .login-button {
            width: 100%;
            background: var(--vs-primary);
            color: var(--vs-primary-foreground);
            border: none;
            padding: 0.75rem 1rem;
            border-radius: calc(var(--vs-radius) - 2px);
            font-size: 1rem;
            font-weight: 500;
            cursor: pointer;
            transition: background-color 0.2s ease;
            margin-bottom: 1rem;
        }

        .login-button:hover {
            background: #1d4ed8;
        }

        .login-button:focus {
            outline: 2px solid var(--vs-ring);
            outline-offset: 2px;
        }

        .divider {
            text-align: center;
            margin: 1.5rem 0;
            position: relative;
            color: #64748b;
            font-size: 0.875rem;
        }

        .divider::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 0;
            right: 0;
            height: 1px;
            background: var(--vs-border);
        }

        .divider span {
            background: var(--vs-background);
            padding: 0 1rem;
        }

        .features {
            text-align: center;
            font-size: 0.875rem;
            color: #64748b;
            line-height: 1.5;
        }

        .security-note {
            margin-top: 1rem;
            padding: 0.75rem;
            background: var(--vs-card);
            border-radius: calc(var(--vs-radius) - 2px);
            font-size: 0.75rem;
            color: #64748b;
            border: 1px solid var(--vs-border);
        }

        @media (max-width: 480px) {
            .login-container {
                margin: 1rem;
                padding: 1.5rem;
            }
        }
    </style>
</head>
<body>
    <div class="login-container">
        <div class="logo">
            <h1>VitalSense</h1>
            <p>Your Health Intelligence Platform</p>
        </div>

        <button class="login-button" onclick="loginWithAuth0()">
            Sign In with VitalSense
        </button>

        <div class="divider">
            <span>or</span>
        </div>

        <button class="login-button" onclick="loginDemo()" style="background: var(--vs-secondary);">
            Try Demo Mode
        </button>

        <button class="login-button" onclick="window.open('/demo-static', '_blank')" style="background: #059669; margin-top: 0.5rem;">
            Quick Demo Access (New Tab)
        </button>

        <button class="login-button" onclick="alert('Redirecting to static demo...'); setTimeout(() => window.location.href='/demo-static', 1000);" style="background: #dc2626; margin-top: 0.5rem;">
            Debug Demo Redirect
        </button>

        <div class="divider">
            <span>Secure Authentication</span>
        </div>

        <div class="features">
            <p>• Privacy-first health monitoring</p>
            <p>• AI-powered insights</p>
            <p>• Emergency fall detection</p>
        </div>

        <div class="security-note">
            🔒 Your health data is encrypted and secure. We use industry-standard authentication.
        </div>
    </div>

    <script src="https://cdn.auth0.com/js/auth0/9.23.2/auth0.min.js"><\/script>
    <script>
        // Wait for Auth0 to load before initializing
        function initializeAuth0() {
            if (typeof auth0 === 'undefined') {
                console.log('⏳ Waiting for Auth0 to load...');
                setTimeout(initializeAuth0, 100);
                return;
            }

            console.log('🔐 Initializing Auth0 WebAuth...');

            window.vitalsenseAuth = new auth0.WebAuth({
                domain: '${e}',
                clientID: '${r}',
                redirectUri: '${n}',
                responseType: 'code',
                scope: 'openid profile email'
            });

            console.log('✅ Auth0 WebAuth initialized successfully');
        }

        // Start initialization
        initializeAuth0();

    function loginWithAuth0() {
      console.log('🔐 Auth0 login button clicked');
      const domain = '${e}';
      const clientId = '${r}';
      if (!domain || !clientId) {
        console.log('⚠️ Missing Auth0 config, using demo mode...');
        loginDemo();
        return;
      }
      if (!window.vitalsenseAuth) {
        console.log('⚠️ Auth0 not initialized yet, trying demo mode...');
        loginDemo();
        return;
      }
      fetch('https://' + domain + '/.well-known/openid-configuration')
        .then(response => {
          if (response.ok) {
            console.log('✅ Auth0 configuration valid, starting authorization...');
            window.vitalsenseAuth.authorize();
          } else {
            console.log('⚠️ Auth0 configuration invalid (' + response.status + '), using demo mode...');
            loginDemo();
          }
        })
        .catch(error => {
          console.log('❌ Auth0 not accessible, using demo mode...', error);
          loginDemo();
        });
    }

        function loginDemo() {
            console.log('Demo login clicked!');

            // Simple redirect to static demo route
            const button = event.target;
            button.textContent = 'Launching Demo...';
            button.disabled = true;

            setTimeout(() => {
                console.log('Redirecting to static demo...');
                window.location.href = '/demo-static';
            }, 500);
        }

        // Auto-redirect if already logged in (after Auth0 is initialized)
        function checkExistingAuth() {
            if (window.vitalsenseAuth) {
                window.vitalsenseAuth.parseHash((err, authResult) => {
                    if (authResult && authResult.accessToken) {
                        console.log('✅ User already authenticated, redirecting...');
                        window.location.href = '/';
                    }
                });
            }
        }

        // Check for existing auth after a short delay to ensure Auth0 is loaded
        setTimeout(checkExistingAuth, 1000);
    <\/script>
    <!-- VS-CUSTOM-LOGIN:1 -->
    <div style="text-align:center;margin-top:1rem;color:#94a3b8;font-size:10px;">Custom Login Page</div>
</body>
</html>`;
  return new Response(a, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store, no-cache, must-revalidate, max-age=0",
      pragma: "no-cache",
      "x-robots-tag": "noindex",
      "x-page-id": "vs-custom-login"
    }
  });
});
x.get("/api/auth0/health", async (t) => {
  const e = t.env.AUTH0_DOMAIN || "", r = t.env.AUTH0_CLIENT_ID || "", s = e ? `https://${e}/` : null, n = e ? `https://${e}/.well-known/openid-configuration` : null, a = {
    ok: !1,
    domain: e,
    clientIdSet: !!r,
    issuer: null,
    jwks_uri: null,
    authorization_endpoint: null,
    error: null
  };
  try {
    if (!n) throw new Error("AUTH0_DOMAIN not set");
    const i = await fetch(n);
    if (!i.ok) throw new Error(`openid-configuration ${i.status}`);
    const o = await i.json();
    return a.ok = !0, a.issuer = o.issuer || s, a.jwks_uri = o.jwks_uri, a.authorization_endpoint = o.authorization_endpoint, t.json(a, 200);
  } catch (i) {
    return a.ok = !1, a.error = i.message, t.json(a, 200);
  }
});
x.get("/auth0/health", async (t) => {
  const e = t.env.AUTH0_DOMAIN || "", r = t.env.AUTH0_CLIENT_ID || "", s = e ? `https://${e}/` : null, n = e ? `https://${e}/.well-known/openid-configuration` : null, a = {
    ok: !1,
    domain: e,
    clientIdSet: !!r,
    issuer: null,
    jwks_uri: null,
    authorization_endpoint: null,
    error: null
  };
  try {
    if (!n) throw new Error("AUTH0_DOMAIN not set");
    const i = await fetch(n);
    if (!i.ok) throw new Error(`openid-configuration ${i.status}`);
    const o = await i.json();
    return a.ok = !0, a.issuer = o.issuer || s, a.jwks_uri = o.jwks_uri, a.authorization_endpoint = o.authorization_endpoint, t.json(a, 200);
  } catch (i) {
    return a.ok = !1, a.error = i.message, t.json(a, 200);
  }
});
x.get("/auth/login", async (t) => t.redirect("/login", 302));
x.get("/_force-login", async (t) => {
  const e = Date.now();
  return t.redirect(`/login?ts=${e}`, 302);
});
x.get("*", async (t) => {
  const e = new URL(t.req.url), r = e.pathname;
  try {
    const n = e.searchParams.has("code"), a = e.searchParams.has("state");
    if ((n || a) && r !== "/callback")
      return t.redirect(`/callback${e.search}`, 302);
  } catch {
  }
  if (!t.env.ASSETS || r === "/login" || r.startsWith("/login/") || r === "/callback" || r === "/demo" || r.startsWith("/demo/") || r === "/auth0/health" || r === "/api/auth0/health")
    return t.text("Not Found", 404);
  const s = new URL("/index.html", t.req.url);
  return t.env.ASSETS.fetch(new Request(s.toString(), t.req.raw));
});
async function wn(t, e, r) {
  const s = e.HEALTH_KV;
  s && r.waitUntil(Ar(e, s));
}
class bn {
  constructor(e) {
    v(this, "storage");
    this.storage = e.storage;
  }
  async fetch(e) {
    const r = new URL(e.url), s = r.searchParams.get("key") || "anon", n = Number(r.searchParams.get("limit") || 60), a = Number(r.searchParams.get("intervalMs") || 6e4), i = r.searchParams.get("probe") === "1", o = Date.now(), c = await this.storage.get(s), l = c && typeof c.tokens == "number" && typeof c.last == "number" ? { tokens: c.tokens, last: c.last } : { tokens: n, last: o }, d = o - l.last, h = Math.floor(d / a) * n;
    return l.tokens = Math.min(n, l.tokens + h), l.last = o, !i && l.tokens <= 0 ? (await this.storage.put(s, l), new Response(JSON.stringify({ ok: !1 }), {
      status: 429,
      headers: { "content-type": "application/json" }
    })) : (i || (l.tokens -= 1, await this.storage.put(s, l)), new Response(
      JSON.stringify({ ok: !0, remaining: l.tokens }),
      { status: 200, headers: { "content-type": "application/json" } }
    ));
  }
}
class kn {
  constructor(e, r) {
    v(this, "state");
    v(this, "env");
    v(this, "sessions");
    v(this, "heartbeatInterval");
    this.state = e, this.env = r, this.sessions = /* @__PURE__ */ new Map(), this.startHeartbeat();
  }
  async fetch(e) {
    if (e.headers.get("Upgrade") !== "websocket")
      return new Response("Expected WebSocket Upgrade", { status: 426 });
    try {
      const s = new WebSocketPair(), [n, a] = Object.values(s), i = new URL(e.url), o = i.searchParams.get("userId") || `user_${Date.now()}`, c = i.searchParams.get("deviceId") || `device_${Date.now()}`, l = i.searchParams.get("token") || "anonymous";
      a.accept();
      const d = {
        userId: o,
        deviceId: c,
        token: l,
        connectedAt: /* @__PURE__ */ new Date(),
        lastActivity: /* @__PURE__ */ new Date(),
        messageCount: 0,
        bytesReceived: 0,
        bytesSent: 0,
        latency: 0
      };
      return this.sessions.set(a, d), a.addEventListener("message", async (h) => {
        await this.handleMessage(a, h, d);
      }), a.addEventListener("close", (h) => {
        this.handleDisconnection(a, d, h);
      }), a.addEventListener("error", (h) => {
        console.error("WebSocket error:", h), this.sessions.delete(a);
      }), await this.sendMessage(a, {
        type: "connection_established",
        message: "Connected to VitalSense WebSocket",
        userId: o,
        deviceId: c,
        serverTime: (/* @__PURE__ */ new Date()).toISOString(),
        sessionId: this.generateSessionId()
      }), console.log(`WebSocket connected: ${o} from ${c}`), new Response(null, {
        status: 101,
        webSocket: n
      });
    } catch (s) {
      return console.error("WebSocket connection error:", s), new Response("WebSocket connection failed", { status: 500 });
    }
  }
  async handleMessage(e, r, s) {
    try {
      s.lastActivity = /* @__PURE__ */ new Date(), s.messageCount++, s.bytesReceived += new Blob([r.data]).size;
      const n = JSON.parse(r.data);
      switch (console.log(`Message from ${s.userId}:`, n.type), n.type) {
        case "health_data":
          await this.processHealthData(e, n, s);
          break;
        case "health_batch":
          await this.processHealthBatch(e, n, s);
          break;
        case "ping":
          await this.handlePing(e, n, s);
          break;
        case "client_info":
          await this.updateClientInfo(e, n, s);
          break;
        case "get_status":
          await this.sendStatus(e, s);
          break;
        default:
          await this.sendMessage(e, {
            type: "error",
            message: `Unknown message type: ${n.type}`,
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          });
      }
    } catch (n) {
      console.error("Message handling error:", n), await this.sendMessage(e, {
        type: "error",
        message: "Failed to process message",
        error: n instanceof Error ? n.message : "Unknown error",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
  }
  async processHealthData(e, r, s) {
    var n;
    try {
      const a = r;
      if (!a.metrics || !Array.isArray(a.metrics))
        throw new Error("Invalid health data format - missing metrics array");
      const i = [];
      for (const o of a.metrics) {
        const c = o;
        i.push({
          ...c,
          userId: s.userId,
          deviceId: s.deviceId,
          receivedAt: (/* @__PURE__ */ new Date()).toISOString(),
          sessionId: this.generateSessionId()
        });
      }
      if ((n = this.env) != null && n.HEALTH_KV && i.length > 0) {
        const o = `health:${s.userId}:${Date.now()}`, c = {
          userId: s.userId,
          deviceId: s.deviceId,
          metrics: i,
          processedAt: (/* @__PURE__ */ new Date()).toISOString(),
          metricCount: i.length
        };
        await this.env.HEALTH_KV.put(
          o,
          JSON.stringify(c),
          { expirationTtl: 86400 }
          // 24 hours
        );
      }
      await this.sendMessage(e, {
        type: "health_data_ack",
        message: "Health data processed successfully",
        metricsProcessed: i.length,
        processingTime: Date.now() - new Date(a.timestamp || Date.now()).getTime(),
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      }), await this.broadcastToUserSessions(s.userId, {
        type: "live_health_update",
        userId: s.userId,
        deviceId: s.deviceId,
        metricsCount: i.length,
        lastMetric: i[i.length - 1],
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (a) {
      console.error("Health data processing error:", a), await this.sendMessage(e, {
        type: "health_data_error",
        message: "Failed to process health data",
        error: a instanceof Error ? a.message : "Unknown error",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
  }
  async processHealthBatch(e, r, s) {
    var n;
    try {
      const a = r;
      if (!a.batch || !Array.isArray(a.batch))
        throw new Error("Invalid batch format");
      const i = [];
      let o = 0;
      for (const c of a.batch) {
        const l = c;
        l.metrics && Array.isArray(l.metrics) && (o += l.metrics.length, i.push({
          ...c,
          userId: s.userId,
          deviceId: s.deviceId,
          processedAt: (/* @__PURE__ */ new Date()).toISOString()
        }));
      }
      if ((n = this.env) != null && n.HEALTH_KV && i.length > 0) {
        const c = `health:batch:${s.userId}:${Date.now()}`;
        await this.env.HEALTH_KV.put(
          c,
          JSON.stringify({
            userId: s.userId,
            deviceId: s.deviceId,
            batches: i,
            totalMetrics: o,
            processedAt: (/* @__PURE__ */ new Date()).toISOString()
          }),
          { expirationTtl: 86400 }
          // 24 hours
        );
      }
      await this.sendMessage(e, {
        type: "health_batch_ack",
        message: "Health batch processed successfully",
        batchesProcessed: i.length,
        totalMetrics: o,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (a) {
      console.error("Health batch processing error:", a), await this.sendMessage(e, {
        type: "health_batch_error",
        message: "Failed to process health batch",
        error: a instanceof Error ? a.message : "Unknown error",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
  }
  async handlePing(e, r, s) {
    const n = Date.now(), a = r, i = a.timestamp ? new Date(a.timestamp).getTime() : n, o = n - i;
    s.latency = o, await this.sendMessage(e, {
      type: "pong",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      latency: o,
      serverTime: n
    });
  }
  async updateClientInfo(e, r, s) {
    const n = r;
    n.deviceInfo && (s.deviceInfo = n.deviceInfo), n.appVersion && (s.appVersion = n.appVersion), await this.sendMessage(e, {
      type: "client_info_ack",
      message: "Client information updated",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
  async sendStatus(e, r) {
    const s = this.sessions.size, n = Date.now() - r.connectedAt.getTime();
    await this.sendMessage(e, {
      type: "status_response",
      sessionInfo: {
        userId: r.userId,
        deviceId: r.deviceId,
        connectedAt: r.connectedAt.toISOString(),
        uptime: n,
        messageCount: r.messageCount,
        bytesReceived: r.bytesReceived,
        bytesSent: r.bytesSent,
        latency: r.latency
      },
      serverInfo: {
        activeSessions: s,
        serverTime: (/* @__PURE__ */ new Date()).toISOString()
      },
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
  async sendMessage(e, r) {
    if (e.readyState === 1) {
      const s = JSON.stringify(r);
      e.send(s);
      const n = this.sessions.get(e);
      n && (n.bytesSent += new Blob([s]).size);
    }
  }
  async broadcastToUserSessions(e, r) {
    for (const [s, n] of this.sessions)
      n.userId === e && s.readyState === 1 && await this.sendMessage(s, r);
  }
  handleDisconnection(e, r, s) {
    console.log(
      `WebSocket disconnected: ${r.userId} (${s.code}: ${s.reason})`
    ), this.sessions.delete(e);
  }
  generateSessionId() {
    return Math.random().toString(36).substring(2, 15);
  }
  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      const e = Date.now();
      for (const [r, s] of this.sessions)
        e - s.lastActivity.getTime() > 3e5 && (console.log(`Closing inactive session: ${s.userId}`), r.close(1e3, "Session timeout"), this.sessions.delete(r));
    }, 3e4);
  }
}
export {
  kn as HealthWebSocket,
  bn as RateLimiter,
  x as default,
  wn as scheduled
};
//# sourceMappingURL=index.js.map

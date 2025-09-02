var Br = Object.defineProperty;
var Mt = (t) => {
  throw TypeError(t);
};
var Fr = (t, e, r) => e in t ? Br(t, e, { enumerable: !0, configurable: !0, writable: !0, value: r }) : t[e] = r;
var _ = (t, e, r) => Fr(t, typeof e != "symbol" ? e + "" : e, r), yt = (t, e, r) => e.has(t) || Mt("Cannot " + r);
var d = (t, e, r) => (yt(t, e, "read from private field"), r ? r.call(t) : e.get(t)), x = (t, e, r) => e.has(t) ? Mt("Cannot add the same private member more than once") : e instanceof WeakSet ? e.add(t) : e.set(t, r), g = (t, e, r, s) => (yt(t, e, "write to private field"), s ? s.call(t, r) : e.set(t, r), r), R = (t, e, r) => (yt(t, e, "access private method"), r);
var Zt = (t, e, r, s) => ({
  set _(n) {
    g(t, e, n, r);
  },
  get _() {
    return d(t, e, s);
  }
});
const qr = {
  heart_rate: 2592e3,
  steps: 2592e3,
  walking_steadiness: 15552e3,
  sleep: 7776e3,
  activity: 7776e3,
  fall_event: 31536e3
};
function fr(t, e) {
  const r = qr[t] ?? 2592e3;
  return e && e !== "production" ? Math.min(r, 2 * 86400) : r;
}
async function pr(t, e, r) {
  const s = Math.max(1, Math.min(2e3, (r == null ? void 0 : r.limit) ?? 1e3)), n = (r == null ? void 0 : r.prefix) ?? "health:", a = await e.list({ prefix: n, limit: s }), i = Date.now();
  let o = 0, c = 0;
  for (const l of a.keys) {
    o += 1;
    const u = l.name.split(":");
    if (u.length < 3) continue;
    const y = u[1], v = u.slice(2).join(":"), O = fr(y, t.ENVIRONMENT), j = Date.parse(v);
    if (!Number.isFinite(j)) continue;
    const E = j + O * 1e3;
    if (i > E)
      try {
        await e.delete(l.name), c += 1;
      } catch {
      }
  }
  return { scanned: o, deleted: c };
}
const tt = {
  info: (t, e) => console.log(t, gt(e)),
  warn: (t, e) => console.warn(t, gt(e)),
  error: (t, e) => console.error(t, gt(e))
};
function gt(t) {
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
function Lt(t, e) {
  const r = new Headers(), s = t && e.includes(t) ? t : "";
  return s && (r.set("Access-Control-Allow-Origin", s), r.set("Vary", "Origin"), r.set("Access-Control-Allow-Credentials", "true"), r.set("Access-Control-Allow-Headers", "authorization, content-type"), r.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS")), r;
}
async function mr(t, e = {}) {
  try {
    const r = t.split(".");
    if (r.length !== 3) return { ok: !1 };
    const s = JSON.parse(atob(r[1])), n = Math.floor(Date.now() / 1e3), a = e.clockSkewSec ?? 60;
    return typeof s.exp == "number" && n > s.exp + a ? { ok: !1 } : typeof s.nbf == "number" && n + a < s.nbf ? { ok: !1 } : e.iss && s.iss !== e.iss ? { ok: !1 } : e.aud && s.aud !== e.aud ? { ok: !1 } : { ok: !0, sub: s.sub, claims: s };
  } catch {
    return { ok: !1 };
  }
}
function st(t) {
  const e = t.length % 4 === 0 ? "" : "=".repeat(4 - t.length % 4), r = t.replace(/-/g, "+").replace(/_/g, "/") + e, s = atob(r), n = new Uint8Array(s.length);
  for (let a = 0; a < s.length; a++) n[a] = s.charCodeAt(a);
  return n;
}
const Dt = /* @__PURE__ */ new Map();
async function Wr(t, e) {
  const r = t, s = Date.now(), n = Dt.get(r);
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
    return Dt.set(r, {
      fetchedAt: s,
      ttlMs: 300 * 1e3,
      keys: o
    }), o[e] || null;
  } catch {
    return null;
  }
}
async function yr(t, e) {
  try {
    const [r, s, n] = t.split(".");
    if (!r || !s || !n) return { ok: !1 };
    const a = JSON.parse(new TextDecoder().decode(st(r)));
    if (a.alg !== "RS256" || !a.kid) return { ok: !1 };
    const i = await Wr(e.jwksUrl, a.kid);
    if (!i) return { ok: !1 };
    const o = new TextEncoder().encode(`${r}.${s}`), c = st(n), l = new Uint8Array(o.length);
    l.set(o);
    const u = new Uint8Array(c.length);
    if (u.set(c), !await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      i,
      u,
      l
    )) return { ok: !1 };
    const v = JSON.parse(
      new TextDecoder().decode(st(s))
    ), O = Math.floor(Date.now() / 1e3), j = e.clockSkewSec ?? 60;
    return typeof v.exp == "number" && O > v.exp + j ? { ok: !1 } : typeof v.nbf == "number" && O + j < v.nbf ? { ok: !1 } : e.iss && v.iss !== e.iss ? { ok: !1 } : e.aud && v.aud !== e.aud ? { ok: !1 } : {
      ok: !0,
      sub: v.sub,
      claims: v
    };
  } catch {
    return { ok: !1 };
  }
}
function Jr(t) {
  try {
    const e = t.split(".");
    return e.length < 2 ? null : JSON.parse(
      new TextDecoder().decode(st(e[1]))
    );
  } catch {
    return null;
  }
}
async function Kr(t, e) {
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
    tt.warn("audit_write_failed", { error: r.message });
  }
}
async function Nt(t) {
  const e = Uint8Array.from(atob(t), (r) => r.charCodeAt(0));
  if (e.byteLength !== 32)
    throw new Error("ENC_KEY must be 32 bytes (base64)");
  return crypto.subtle.importKey("raw", e, { name: "AES-GCM" }, !1, [
    "encrypt",
    "decrypt"
  ]);
}
async function gr(t, e) {
  const r = crypto.getRandomValues(new Uint8Array(12)), s = new TextEncoder().encode(JSON.stringify(e)), n = await crypto.subtle.encrypt({ name: "AES-GCM", iv: r }, t, s), a = new Uint8Array(r.byteLength + n.byteLength);
  return a.set(r, 0), a.set(new Uint8Array(n), r.byteLength), btoa(String.fromCharCode(...a));
}
async function Gr(t, e) {
  const r = Uint8Array.from(atob(e), (i) => i.charCodeAt(0)), s = r.slice(0, 12), n = r.slice(12), a = await crypto.subtle.decrypt({ name: "AES-GCM", iv: s }, t, n);
  return JSON.parse(new TextDecoder().decode(a));
}
function _t(t) {
  return btoa(String.fromCharCode(...t)).replace(/=+$/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
async function Yr(t, e, r = {}) {
  const s = new TextEncoder(), n = { alg: "HS256", typ: "JWT", ...r }, a = _t(s.encode(JSON.stringify(n))), i = _t(s.encode(JSON.stringify(t))), o = `${a}.${i}`, c = await crypto.subtle.importKey(
    "raw",
    s.encode(e),
    { name: "HMAC", hash: "SHA-256" },
    !1,
    ["sign"]
  ), l = await crypto.subtle.sign("HMAC", c, s.encode(o)), u = _t(new Uint8Array(l));
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
var Vt;
(function(t) {
  t.mergeShapes = (e, r) => ({
    ...e,
    ...r
    // second overwrites first
  });
})(Vt || (Vt = {}));
const p = A.arrayToEnum([
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
]), ne = (t) => {
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
class ee extends Error {
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
    if (!(e instanceof ee))
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
ee.create = (t) => new ee(t);
const bt = (t, e) => {
  let r;
  switch (t.code) {
    case h.invalid_type:
      t.received === p.undefined ? r = "Required" : r = `Expected ${t.expected}, received ${t.received}`;
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
let Xr = bt;
function Qr() {
  return Xr;
}
const es = (t) => {
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
function f(t, e) {
  const r = Qr(), s = es({
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
      r === bt ? void 0 : bt
      // then global default map
    ].filter((n) => !!n)
  });
  t.common.issues.push(s);
}
class D {
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
        return k;
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
    return D.mergeObjectSync(e, s);
  }
  static mergeObjectSync(e, r) {
    const s = {};
    for (const n of r) {
      const { key: a, value: i } = n;
      if (a.status === "aborted" || i.status === "aborted")
        return k;
      a.status === "dirty" && e.dirty(), i.status === "dirty" && e.dirty(), a.value !== "__proto__" && (typeof i.value < "u" || n.alwaysSet) && (s[a.value] = i.value);
    }
    return { status: e.value, value: s };
  }
}
const k = Object.freeze({
  status: "aborted"
}), Be = (t) => ({ status: "dirty", value: t }), H = (t) => ({ status: "valid", value: t }), Ut = (t) => t.status === "aborted", Ht = (t) => t.status === "dirty", $e = (t) => t.status === "valid", ot = (t) => typeof Promise < "u" && t instanceof Promise;
var m;
(function(t) {
  t.errToObj = (e) => typeof e == "string" ? { message: e } : e || {}, t.toString = (e) => typeof e == "string" ? e : e == null ? void 0 : e.message;
})(m || (m = {}));
class fe {
  constructor(e, r, s, n) {
    this._cachedPath = [], this.parent = e, this.data = r, this._path = s, this._key = n;
  }
  get path() {
    return this._cachedPath.length || (Array.isArray(this._key) ? this._cachedPath.push(...this._path, ...this._key) : this._cachedPath.push(...this._path, this._key)), this._cachedPath;
  }
}
const zt = (t, e) => {
  if ($e(e))
    return { success: !0, data: e.value };
  if (!t.common.issues.length)
    throw new Error("Validation failed but no issues detected.");
  return {
    success: !1,
    get error() {
      if (this._error)
        return this._error;
      const r = new ee(t.common.issues);
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
    return ne(e.data);
  }
  _getOrReturnCtx(e, r) {
    return r || {
      common: e.parent.common,
      data: e.data,
      parsedType: ne(e.data),
      schemaErrorMap: this._def.errorMap,
      path: e.path,
      parent: e.parent
    };
  }
  _processInputParams(e) {
    return {
      status: new D(),
      ctx: {
        common: e.parent.common,
        data: e.data,
        parsedType: ne(e.data),
        schemaErrorMap: this._def.errorMap,
        path: e.path,
        parent: e.parent
      }
    };
  }
  _parseSync(e) {
    const r = this._parse(e);
    if (ot(r))
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
      parsedType: ne(e)
    }, n = this._parseSync({ data: e, path: s.path, parent: s });
    return zt(s, n);
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
      parsedType: ne(e)
    };
    if (!this["~standard"].async)
      try {
        const a = this._parseSync({ data: e, path: [], parent: r });
        return $e(a) ? {
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
    return this._parseAsync({ data: e, path: [], parent: r }).then((a) => $e(a) ? {
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
      parsedType: ne(e)
    }, n = this._parse({ data: e, path: s.path, parent: s }), a = await (ot(n) ? n : Promise.resolve(n));
    return zt(s, a);
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
    return new Le({
      schema: this,
      typeName: w.ZodEffects,
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
    return de.create(this, this._def);
  }
  nullable() {
    return De.create(this, this._def);
  }
  nullish() {
    return this.nullable().optional();
  }
  array() {
    return q.create(this);
  }
  promise() {
    return dt.create(this, this._def);
  }
  or(e) {
    return lt.create([this, e], this._def);
  }
  and(e) {
    return ut.create(this, e, this._def);
  }
  transform(e) {
    return new Le({
      ...b(this._def),
      schema: this,
      typeName: w.ZodEffects,
      effect: { type: "transform", transform: e }
    });
  }
  default(e) {
    const r = typeof e == "function" ? e : () => e;
    return new Rt({
      ...b(this._def),
      innerType: this,
      defaultValue: r,
      typeName: w.ZodDefault
    });
  }
  brand() {
    return new bs({
      typeName: w.ZodBranded,
      type: this,
      ...b(this._def)
    });
  }
  catch(e) {
    const r = typeof e == "function" ? e : () => e;
    return new Et({
      ...b(this._def),
      innerType: this,
      catchValue: r,
      typeName: w.ZodCatch
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
    return It.create(this, e);
  }
  readonly() {
    return Ot.create(this);
  }
  isOptional() {
    return this.safeParse(void 0).success;
  }
  isNullable() {
    return this.safeParse(null).success;
  }
}
const ts = /^c[^\s-]{8,}$/i, rs = /^[0-9a-z]+$/, ss = /^[0-9A-HJKMNP-TV-Z]{26}$/i, ns = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i, as = /^[a-z0-9_-]{21}$/i, is = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/, os = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/, cs = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i, ls = "^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$";
let vt;
const us = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/, ds = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/, hs = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/, fs = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/, ps = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/, ms = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/, _r = "((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))", ys = new RegExp(`^${_r}$`);
function vr(t) {
  let e = "[0-5]\\d";
  t.precision ? e = `${e}\\.\\d{${t.precision}}` : t.precision == null && (e = `${e}(\\.\\d+)?`);
  const r = t.precision ? "+" : "?";
  return `([01]\\d|2[0-3]):[0-5]\\d(:${e})${r}`;
}
function gs(t) {
  return new RegExp(`^${vr(t)}$`);
}
function _s(t) {
  let e = `${_r}T${vr(t)}`;
  const r = [];
  return r.push(t.local ? "Z?" : "Z"), t.offset && r.push("([+-]\\d{2}:?\\d{2})"), e = `${e}(${r.join("|")})`, new RegExp(`^${e}$`);
}
function vs(t, e) {
  return !!((e === "v4" || !e) && us.test(t) || (e === "v6" || !e) && hs.test(t));
}
function ks(t, e) {
  if (!is.test(t))
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
function ws(t, e) {
  return !!((e === "v4" || !e) && ds.test(t) || (e === "v6" || !e) && fs.test(t));
}
class Q extends S {
  _parse(e) {
    if (this._def.coerce && (e.data = String(e.data)), this._getType(e) !== p.string) {
      const a = this._getOrReturnCtx(e);
      return f(a, {
        code: h.invalid_type,
        expected: p.string,
        received: a.parsedType
      }), k;
    }
    const s = new D();
    let n;
    for (const a of this._def.checks)
      if (a.kind === "min")
        e.data.length < a.value && (n = this._getOrReturnCtx(e, n), f(n, {
          code: h.too_small,
          minimum: a.value,
          type: "string",
          inclusive: !0,
          exact: !1,
          message: a.message
        }), s.dirty());
      else if (a.kind === "max")
        e.data.length > a.value && (n = this._getOrReturnCtx(e, n), f(n, {
          code: h.too_big,
          maximum: a.value,
          type: "string",
          inclusive: !0,
          exact: !1,
          message: a.message
        }), s.dirty());
      else if (a.kind === "length") {
        const i = e.data.length > a.value, o = e.data.length < a.value;
        (i || o) && (n = this._getOrReturnCtx(e, n), i ? f(n, {
          code: h.too_big,
          maximum: a.value,
          type: "string",
          inclusive: !0,
          exact: !0,
          message: a.message
        }) : o && f(n, {
          code: h.too_small,
          minimum: a.value,
          type: "string",
          inclusive: !0,
          exact: !0,
          message: a.message
        }), s.dirty());
      } else if (a.kind === "email")
        cs.test(e.data) || (n = this._getOrReturnCtx(e, n), f(n, {
          validation: "email",
          code: h.invalid_string,
          message: a.message
        }), s.dirty());
      else if (a.kind === "emoji")
        vt || (vt = new RegExp(ls, "u")), vt.test(e.data) || (n = this._getOrReturnCtx(e, n), f(n, {
          validation: "emoji",
          code: h.invalid_string,
          message: a.message
        }), s.dirty());
      else if (a.kind === "uuid")
        ns.test(e.data) || (n = this._getOrReturnCtx(e, n), f(n, {
          validation: "uuid",
          code: h.invalid_string,
          message: a.message
        }), s.dirty());
      else if (a.kind === "nanoid")
        as.test(e.data) || (n = this._getOrReturnCtx(e, n), f(n, {
          validation: "nanoid",
          code: h.invalid_string,
          message: a.message
        }), s.dirty());
      else if (a.kind === "cuid")
        ts.test(e.data) || (n = this._getOrReturnCtx(e, n), f(n, {
          validation: "cuid",
          code: h.invalid_string,
          message: a.message
        }), s.dirty());
      else if (a.kind === "cuid2")
        rs.test(e.data) || (n = this._getOrReturnCtx(e, n), f(n, {
          validation: "cuid2",
          code: h.invalid_string,
          message: a.message
        }), s.dirty());
      else if (a.kind === "ulid")
        ss.test(e.data) || (n = this._getOrReturnCtx(e, n), f(n, {
          validation: "ulid",
          code: h.invalid_string,
          message: a.message
        }), s.dirty());
      else if (a.kind === "url")
        try {
          new URL(e.data);
        } catch {
          n = this._getOrReturnCtx(e, n), f(n, {
            validation: "url",
            code: h.invalid_string,
            message: a.message
          }), s.dirty();
        }
      else a.kind === "regex" ? (a.regex.lastIndex = 0, a.regex.test(e.data) || (n = this._getOrReturnCtx(e, n), f(n, {
        validation: "regex",
        code: h.invalid_string,
        message: a.message
      }), s.dirty())) : a.kind === "trim" ? e.data = e.data.trim() : a.kind === "includes" ? e.data.includes(a.value, a.position) || (n = this._getOrReturnCtx(e, n), f(n, {
        code: h.invalid_string,
        validation: { includes: a.value, position: a.position },
        message: a.message
      }), s.dirty()) : a.kind === "toLowerCase" ? e.data = e.data.toLowerCase() : a.kind === "toUpperCase" ? e.data = e.data.toUpperCase() : a.kind === "startsWith" ? e.data.startsWith(a.value) || (n = this._getOrReturnCtx(e, n), f(n, {
        code: h.invalid_string,
        validation: { startsWith: a.value },
        message: a.message
      }), s.dirty()) : a.kind === "endsWith" ? e.data.endsWith(a.value) || (n = this._getOrReturnCtx(e, n), f(n, {
        code: h.invalid_string,
        validation: { endsWith: a.value },
        message: a.message
      }), s.dirty()) : a.kind === "datetime" ? _s(a).test(e.data) || (n = this._getOrReturnCtx(e, n), f(n, {
        code: h.invalid_string,
        validation: "datetime",
        message: a.message
      }), s.dirty()) : a.kind === "date" ? ys.test(e.data) || (n = this._getOrReturnCtx(e, n), f(n, {
        code: h.invalid_string,
        validation: "date",
        message: a.message
      }), s.dirty()) : a.kind === "time" ? gs(a).test(e.data) || (n = this._getOrReturnCtx(e, n), f(n, {
        code: h.invalid_string,
        validation: "time",
        message: a.message
      }), s.dirty()) : a.kind === "duration" ? os.test(e.data) || (n = this._getOrReturnCtx(e, n), f(n, {
        validation: "duration",
        code: h.invalid_string,
        message: a.message
      }), s.dirty()) : a.kind === "ip" ? vs(e.data, a.version) || (n = this._getOrReturnCtx(e, n), f(n, {
        validation: "ip",
        code: h.invalid_string,
        message: a.message
      }), s.dirty()) : a.kind === "jwt" ? ks(e.data, a.alg) || (n = this._getOrReturnCtx(e, n), f(n, {
        validation: "jwt",
        code: h.invalid_string,
        message: a.message
      }), s.dirty()) : a.kind === "cidr" ? ws(e.data, a.version) || (n = this._getOrReturnCtx(e, n), f(n, {
        validation: "cidr",
        code: h.invalid_string,
        message: a.message
      }), s.dirty()) : a.kind === "base64" ? ps.test(e.data) || (n = this._getOrReturnCtx(e, n), f(n, {
        validation: "base64",
        code: h.invalid_string,
        message: a.message
      }), s.dirty()) : a.kind === "base64url" ? ms.test(e.data) || (n = this._getOrReturnCtx(e, n), f(n, {
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
      ...m.errToObj(s)
    });
  }
  _addCheck(e) {
    return new Q({
      ...this._def,
      checks: [...this._def.checks, e]
    });
  }
  email(e) {
    return this._addCheck({ kind: "email", ...m.errToObj(e) });
  }
  url(e) {
    return this._addCheck({ kind: "url", ...m.errToObj(e) });
  }
  emoji(e) {
    return this._addCheck({ kind: "emoji", ...m.errToObj(e) });
  }
  uuid(e) {
    return this._addCheck({ kind: "uuid", ...m.errToObj(e) });
  }
  nanoid(e) {
    return this._addCheck({ kind: "nanoid", ...m.errToObj(e) });
  }
  cuid(e) {
    return this._addCheck({ kind: "cuid", ...m.errToObj(e) });
  }
  cuid2(e) {
    return this._addCheck({ kind: "cuid2", ...m.errToObj(e) });
  }
  ulid(e) {
    return this._addCheck({ kind: "ulid", ...m.errToObj(e) });
  }
  base64(e) {
    return this._addCheck({ kind: "base64", ...m.errToObj(e) });
  }
  base64url(e) {
    return this._addCheck({
      kind: "base64url",
      ...m.errToObj(e)
    });
  }
  jwt(e) {
    return this._addCheck({ kind: "jwt", ...m.errToObj(e) });
  }
  ip(e) {
    return this._addCheck({ kind: "ip", ...m.errToObj(e) });
  }
  cidr(e) {
    return this._addCheck({ kind: "cidr", ...m.errToObj(e) });
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
      ...m.errToObj(e == null ? void 0 : e.message)
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
      ...m.errToObj(e == null ? void 0 : e.message)
    });
  }
  duration(e) {
    return this._addCheck({ kind: "duration", ...m.errToObj(e) });
  }
  regex(e, r) {
    return this._addCheck({
      kind: "regex",
      regex: e,
      ...m.errToObj(r)
    });
  }
  includes(e, r) {
    return this._addCheck({
      kind: "includes",
      value: e,
      position: r == null ? void 0 : r.position,
      ...m.errToObj(r == null ? void 0 : r.message)
    });
  }
  startsWith(e, r) {
    return this._addCheck({
      kind: "startsWith",
      value: e,
      ...m.errToObj(r)
    });
  }
  endsWith(e, r) {
    return this._addCheck({
      kind: "endsWith",
      value: e,
      ...m.errToObj(r)
    });
  }
  min(e, r) {
    return this._addCheck({
      kind: "min",
      value: e,
      ...m.errToObj(r)
    });
  }
  max(e, r) {
    return this._addCheck({
      kind: "max",
      value: e,
      ...m.errToObj(r)
    });
  }
  length(e, r) {
    return this._addCheck({
      kind: "length",
      value: e,
      ...m.errToObj(r)
    });
  }
  /**
   * Equivalent to `.min(1)`
   */
  nonempty(e) {
    return this.min(1, m.errToObj(e));
  }
  trim() {
    return new Q({
      ...this._def,
      checks: [...this._def.checks, { kind: "trim" }]
    });
  }
  toLowerCase() {
    return new Q({
      ...this._def,
      checks: [...this._def.checks, { kind: "toLowerCase" }]
    });
  }
  toUpperCase() {
    return new Q({
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
Q.create = (t) => new Q({
  checks: [],
  typeName: w.ZodString,
  coerce: (t == null ? void 0 : t.coerce) ?? !1,
  ...b(t)
});
function xs(t, e) {
  const r = (t.toString().split(".")[1] || "").length, s = (e.toString().split(".")[1] || "").length, n = r > s ? r : s, a = Number.parseInt(t.toFixed(n).replace(".", "")), i = Number.parseInt(e.toFixed(n).replace(".", ""));
  return a % i / 10 ** n;
}
class xe extends S {
  constructor() {
    super(...arguments), this.min = this.gte, this.max = this.lte, this.step = this.multipleOf;
  }
  _parse(e) {
    if (this._def.coerce && (e.data = Number(e.data)), this._getType(e) !== p.number) {
      const a = this._getOrReturnCtx(e);
      return f(a, {
        code: h.invalid_type,
        expected: p.number,
        received: a.parsedType
      }), k;
    }
    let s;
    const n = new D();
    for (const a of this._def.checks)
      a.kind === "int" ? A.isInteger(e.data) || (s = this._getOrReturnCtx(e, s), f(s, {
        code: h.invalid_type,
        expected: "integer",
        received: "float",
        message: a.message
      }), n.dirty()) : a.kind === "min" ? (a.inclusive ? e.data < a.value : e.data <= a.value) && (s = this._getOrReturnCtx(e, s), f(s, {
        code: h.too_small,
        minimum: a.value,
        type: "number",
        inclusive: a.inclusive,
        exact: !1,
        message: a.message
      }), n.dirty()) : a.kind === "max" ? (a.inclusive ? e.data > a.value : e.data >= a.value) && (s = this._getOrReturnCtx(e, s), f(s, {
        code: h.too_big,
        maximum: a.value,
        type: "number",
        inclusive: a.inclusive,
        exact: !1,
        message: a.message
      }), n.dirty()) : a.kind === "multipleOf" ? xs(e.data, a.value) !== 0 && (s = this._getOrReturnCtx(e, s), f(s, {
        code: h.not_multiple_of,
        multipleOf: a.value,
        message: a.message
      }), n.dirty()) : a.kind === "finite" ? Number.isFinite(e.data) || (s = this._getOrReturnCtx(e, s), f(s, {
        code: h.not_finite,
        message: a.message
      }), n.dirty()) : A.assertNever(a);
    return { status: n.value, value: e.data };
  }
  gte(e, r) {
    return this.setLimit("min", e, !0, m.toString(r));
  }
  gt(e, r) {
    return this.setLimit("min", e, !1, m.toString(r));
  }
  lte(e, r) {
    return this.setLimit("max", e, !0, m.toString(r));
  }
  lt(e, r) {
    return this.setLimit("max", e, !1, m.toString(r));
  }
  setLimit(e, r, s, n) {
    return new xe({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind: e,
          value: r,
          inclusive: s,
          message: m.toString(n)
        }
      ]
    });
  }
  _addCheck(e) {
    return new xe({
      ...this._def,
      checks: [...this._def.checks, e]
    });
  }
  int(e) {
    return this._addCheck({
      kind: "int",
      message: m.toString(e)
    });
  }
  positive(e) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: !1,
      message: m.toString(e)
    });
  }
  negative(e) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: !1,
      message: m.toString(e)
    });
  }
  nonpositive(e) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: !0,
      message: m.toString(e)
    });
  }
  nonnegative(e) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: !0,
      message: m.toString(e)
    });
  }
  multipleOf(e, r) {
    return this._addCheck({
      kind: "multipleOf",
      value: e,
      message: m.toString(r)
    });
  }
  finite(e) {
    return this._addCheck({
      kind: "finite",
      message: m.toString(e)
    });
  }
  safe(e) {
    return this._addCheck({
      kind: "min",
      inclusive: !0,
      value: Number.MIN_SAFE_INTEGER,
      message: m.toString(e)
    })._addCheck({
      kind: "max",
      inclusive: !0,
      value: Number.MAX_SAFE_INTEGER,
      message: m.toString(e)
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
xe.create = (t) => new xe({
  checks: [],
  typeName: w.ZodNumber,
  coerce: (t == null ? void 0 : t.coerce) || !1,
  ...b(t)
});
class be extends S {
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
    const n = new D();
    for (const a of this._def.checks)
      a.kind === "min" ? (a.inclusive ? e.data < a.value : e.data <= a.value) && (s = this._getOrReturnCtx(e, s), f(s, {
        code: h.too_small,
        type: "bigint",
        minimum: a.value,
        inclusive: a.inclusive,
        message: a.message
      }), n.dirty()) : a.kind === "max" ? (a.inclusive ? e.data > a.value : e.data >= a.value) && (s = this._getOrReturnCtx(e, s), f(s, {
        code: h.too_big,
        type: "bigint",
        maximum: a.value,
        inclusive: a.inclusive,
        message: a.message
      }), n.dirty()) : a.kind === "multipleOf" ? e.data % a.value !== BigInt(0) && (s = this._getOrReturnCtx(e, s), f(s, {
        code: h.not_multiple_of,
        multipleOf: a.value,
        message: a.message
      }), n.dirty()) : A.assertNever(a);
    return { status: n.value, value: e.data };
  }
  _getInvalidInput(e) {
    const r = this._getOrReturnCtx(e);
    return f(r, {
      code: h.invalid_type,
      expected: p.bigint,
      received: r.parsedType
    }), k;
  }
  gte(e, r) {
    return this.setLimit("min", e, !0, m.toString(r));
  }
  gt(e, r) {
    return this.setLimit("min", e, !1, m.toString(r));
  }
  lte(e, r) {
    return this.setLimit("max", e, !0, m.toString(r));
  }
  lt(e, r) {
    return this.setLimit("max", e, !1, m.toString(r));
  }
  setLimit(e, r, s, n) {
    return new be({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind: e,
          value: r,
          inclusive: s,
          message: m.toString(n)
        }
      ]
    });
  }
  _addCheck(e) {
    return new be({
      ...this._def,
      checks: [...this._def.checks, e]
    });
  }
  positive(e) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: !1,
      message: m.toString(e)
    });
  }
  negative(e) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: !1,
      message: m.toString(e)
    });
  }
  nonpositive(e) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: !0,
      message: m.toString(e)
    });
  }
  nonnegative(e) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: !0,
      message: m.toString(e)
    });
  }
  multipleOf(e, r) {
    return this._addCheck({
      kind: "multipleOf",
      value: e,
      message: m.toString(r)
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
be.create = (t) => new be({
  checks: [],
  typeName: w.ZodBigInt,
  coerce: (t == null ? void 0 : t.coerce) ?? !1,
  ...b(t)
});
class ct extends S {
  _parse(e) {
    if (this._def.coerce && (e.data = !!e.data), this._getType(e) !== p.boolean) {
      const s = this._getOrReturnCtx(e);
      return f(s, {
        code: h.invalid_type,
        expected: p.boolean,
        received: s.parsedType
      }), k;
    }
    return H(e.data);
  }
}
ct.create = (t) => new ct({
  typeName: w.ZodBoolean,
  coerce: (t == null ? void 0 : t.coerce) || !1,
  ...b(t)
});
class Me extends S {
  _parse(e) {
    if (this._def.coerce && (e.data = new Date(e.data)), this._getType(e) !== p.date) {
      const a = this._getOrReturnCtx(e);
      return f(a, {
        code: h.invalid_type,
        expected: p.date,
        received: a.parsedType
      }), k;
    }
    if (Number.isNaN(e.data.getTime())) {
      const a = this._getOrReturnCtx(e);
      return f(a, {
        code: h.invalid_date
      }), k;
    }
    const s = new D();
    let n;
    for (const a of this._def.checks)
      a.kind === "min" ? e.data.getTime() < a.value && (n = this._getOrReturnCtx(e, n), f(n, {
        code: h.too_small,
        message: a.message,
        inclusive: !0,
        exact: !1,
        minimum: a.value,
        type: "date"
      }), s.dirty()) : a.kind === "max" ? e.data.getTime() > a.value && (n = this._getOrReturnCtx(e, n), f(n, {
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
    return new Me({
      ...this._def,
      checks: [...this._def.checks, e]
    });
  }
  min(e, r) {
    return this._addCheck({
      kind: "min",
      value: e.getTime(),
      message: m.toString(r)
    });
  }
  max(e, r) {
    return this._addCheck({
      kind: "max",
      value: e.getTime(),
      message: m.toString(r)
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
Me.create = (t) => new Me({
  checks: [],
  coerce: (t == null ? void 0 : t.coerce) || !1,
  typeName: w.ZodDate,
  ...b(t)
});
class Bt extends S {
  _parse(e) {
    if (this._getType(e) !== p.symbol) {
      const s = this._getOrReturnCtx(e);
      return f(s, {
        code: h.invalid_type,
        expected: p.symbol,
        received: s.parsedType
      }), k;
    }
    return H(e.data);
  }
}
Bt.create = (t) => new Bt({
  typeName: w.ZodSymbol,
  ...b(t)
});
class Ft extends S {
  _parse(e) {
    if (this._getType(e) !== p.undefined) {
      const s = this._getOrReturnCtx(e);
      return f(s, {
        code: h.invalid_type,
        expected: p.undefined,
        received: s.parsedType
      }), k;
    }
    return H(e.data);
  }
}
Ft.create = (t) => new Ft({
  typeName: w.ZodUndefined,
  ...b(t)
});
class qt extends S {
  _parse(e) {
    if (this._getType(e) !== p.null) {
      const s = this._getOrReturnCtx(e);
      return f(s, {
        code: h.invalid_type,
        expected: p.null,
        received: s.parsedType
      }), k;
    }
    return H(e.data);
  }
}
qt.create = (t) => new qt({
  typeName: w.ZodNull,
  ...b(t)
});
class Wt extends S {
  constructor() {
    super(...arguments), this._any = !0;
  }
  _parse(e) {
    return H(e.data);
  }
}
Wt.create = (t) => new Wt({
  typeName: w.ZodAny,
  ...b(t)
});
class St extends S {
  constructor() {
    super(...arguments), this._unknown = !0;
  }
  _parse(e) {
    return H(e.data);
  }
}
St.create = (t) => new St({
  typeName: w.ZodUnknown,
  ...b(t)
});
class pe extends S {
  _parse(e) {
    const r = this._getOrReturnCtx(e);
    return f(r, {
      code: h.invalid_type,
      expected: p.never,
      received: r.parsedType
    }), k;
  }
}
pe.create = (t) => new pe({
  typeName: w.ZodNever,
  ...b(t)
});
class Jt extends S {
  _parse(e) {
    if (this._getType(e) !== p.undefined) {
      const s = this._getOrReturnCtx(e);
      return f(s, {
        code: h.invalid_type,
        expected: p.void,
        received: s.parsedType
      }), k;
    }
    return H(e.data);
  }
}
Jt.create = (t) => new Jt({
  typeName: w.ZodVoid,
  ...b(t)
});
class q extends S {
  _parse(e) {
    const { ctx: r, status: s } = this._processInputParams(e), n = this._def;
    if (r.parsedType !== p.array)
      return f(r, {
        code: h.invalid_type,
        expected: p.array,
        received: r.parsedType
      }), k;
    if (n.exactLength !== null) {
      const i = r.data.length > n.exactLength.value, o = r.data.length < n.exactLength.value;
      (i || o) && (f(r, {
        code: i ? h.too_big : h.too_small,
        minimum: o ? n.exactLength.value : void 0,
        maximum: i ? n.exactLength.value : void 0,
        type: "array",
        inclusive: !0,
        exact: !0,
        message: n.exactLength.message
      }), s.dirty());
    }
    if (n.minLength !== null && r.data.length < n.minLength.value && (f(r, {
      code: h.too_small,
      minimum: n.minLength.value,
      type: "array",
      inclusive: !0,
      exact: !1,
      message: n.minLength.message
    }), s.dirty()), n.maxLength !== null && r.data.length > n.maxLength.value && (f(r, {
      code: h.too_big,
      maximum: n.maxLength.value,
      type: "array",
      inclusive: !0,
      exact: !1,
      message: n.maxLength.message
    }), s.dirty()), r.common.async)
      return Promise.all([...r.data].map((i, o) => n.type._parseAsync(new fe(r, i, r.path, o)))).then((i) => D.mergeArray(s, i));
    const a = [...r.data].map((i, o) => n.type._parseSync(new fe(r, i, r.path, o)));
    return D.mergeArray(s, a);
  }
  get element() {
    return this._def.type;
  }
  min(e, r) {
    return new q({
      ...this._def,
      minLength: { value: e, message: m.toString(r) }
    });
  }
  max(e, r) {
    return new q({
      ...this._def,
      maxLength: { value: e, message: m.toString(r) }
    });
  }
  length(e, r) {
    return new q({
      ...this._def,
      exactLength: { value: e, message: m.toString(r) }
    });
  }
  nonempty(e) {
    return this.min(1, e);
  }
}
q.create = (t, e) => new q({
  type: t,
  minLength: null,
  maxLength: null,
  exactLength: null,
  typeName: w.ZodArray,
  ...b(e)
});
function Re(t) {
  if (t instanceof T) {
    const e = {};
    for (const r in t.shape) {
      const s = t.shape[r];
      e[r] = de.create(Re(s));
    }
    return new T({
      ...t._def,
      shape: () => e
    });
  } else return t instanceof q ? new q({
    ...t._def,
    type: Re(t.element)
  }) : t instanceof de ? de.create(Re(t.unwrap())) : t instanceof De ? De.create(Re(t.unwrap())) : t instanceof Se ? Se.create(t.items.map((e) => Re(e))) : t;
}
class T extends S {
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
    if (this._getType(e) !== p.object) {
      const l = this._getOrReturnCtx(e);
      return f(l, {
        code: h.invalid_type,
        expected: p.object,
        received: l.parsedType
      }), k;
    }
    const { status: s, ctx: n } = this._processInputParams(e), { shape: a, keys: i } = this._getCached(), o = [];
    if (!(this._def.catchall instanceof pe && this._def.unknownKeys === "strip"))
      for (const l in n.data)
        i.includes(l) || o.push(l);
    const c = [];
    for (const l of i) {
      const u = a[l], y = n.data[l];
      c.push({
        key: { status: "valid", value: l },
        value: u._parse(new fe(n, y, n.path, l)),
        alwaysSet: l in n.data
      });
    }
    if (this._def.catchall instanceof pe) {
      const l = this._def.unknownKeys;
      if (l === "passthrough")
        for (const u of o)
          c.push({
            key: { status: "valid", value: u },
            value: { status: "valid", value: n.data[u] }
          });
      else if (l === "strict")
        o.length > 0 && (f(n, {
          code: h.unrecognized_keys,
          keys: o
        }), s.dirty());
      else if (l !== "strip") throw new Error("Internal ZodObject error: invalid unknownKeys value.");
    } else {
      const l = this._def.catchall;
      for (const u of o) {
        const y = n.data[u];
        c.push({
          key: { status: "valid", value: u },
          value: l._parse(
            new fe(n, y, n.path, u)
            //, ctx.child(key), value, getParsedType(value)
          ),
          alwaysSet: u in n.data
        });
      }
    }
    return n.common.async ? Promise.resolve().then(async () => {
      const l = [];
      for (const u of c) {
        const y = await u.key, v = await u.value;
        l.push({
          key: y,
          value: v,
          alwaysSet: u.alwaysSet
        });
      }
      return l;
    }).then((l) => D.mergeObjectSync(s, l)) : D.mergeObjectSync(s, c);
  }
  get shape() {
    return this._def.shape();
  }
  strict(e) {
    return m.errToObj, new T({
      ...this._def,
      unknownKeys: "strict",
      ...e !== void 0 ? {
        errorMap: (r, s) => {
          var a, i;
          const n = ((i = (a = this._def).errorMap) == null ? void 0 : i.call(a, r, s).message) ?? s.defaultError;
          return r.code === "unrecognized_keys" ? {
            message: m.errToObj(e).message ?? n
          } : {
            message: n
          };
        }
      } : {}
    });
  }
  strip() {
    return new T({
      ...this._def,
      unknownKeys: "strip"
    });
  }
  passthrough() {
    return new T({
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
    return new T({
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
    return new T({
      unknownKeys: e._def.unknownKeys,
      catchall: e._def.catchall,
      shape: () => ({
        ...this._def.shape(),
        ...e._def.shape()
      }),
      typeName: w.ZodObject
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
    return new T({
      ...this._def,
      catchall: e
    });
  }
  pick(e) {
    const r = {};
    for (const s of A.objectKeys(e))
      e[s] && this.shape[s] && (r[s] = this.shape[s]);
    return new T({
      ...this._def,
      shape: () => r
    });
  }
  omit(e) {
    const r = {};
    for (const s of A.objectKeys(this.shape))
      e[s] || (r[s] = this.shape[s]);
    return new T({
      ...this._def,
      shape: () => r
    });
  }
  /**
   * @deprecated
   */
  deepPartial() {
    return Re(this);
  }
  partial(e) {
    const r = {};
    for (const s of A.objectKeys(this.shape)) {
      const n = this.shape[s];
      e && !e[s] ? r[s] = n : r[s] = n.optional();
    }
    return new T({
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
        for (; a instanceof de; )
          a = a._def.innerType;
        r[s] = a;
      }
    return new T({
      ...this._def,
      shape: () => r
    });
  }
  keyof() {
    return kr(A.objectKeys(this.shape));
  }
}
T.create = (t, e) => new T({
  shape: () => t,
  unknownKeys: "strip",
  catchall: pe.create(),
  typeName: w.ZodObject,
  ...b(e)
});
T.strictCreate = (t, e) => new T({
  shape: () => t,
  unknownKeys: "strict",
  catchall: pe.create(),
  typeName: w.ZodObject,
  ...b(e)
});
T.lazycreate = (t, e) => new T({
  shape: t,
  unknownKeys: "strip",
  catchall: pe.create(),
  typeName: w.ZodObject,
  ...b(e)
});
class lt extends S {
  _parse(e) {
    const { ctx: r } = this._processInputParams(e), s = this._def.options;
    function n(a) {
      for (const o of a)
        if (o.result.status === "valid")
          return o.result;
      for (const o of a)
        if (o.result.status === "dirty")
          return r.common.issues.push(...o.ctx.common.issues), o.result;
      const i = a.map((o) => new ee(o.ctx.common.issues));
      return f(r, {
        code: h.invalid_union,
        unionErrors: i
      }), k;
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
      const o = i.map((c) => new ee(c));
      return f(r, {
        code: h.invalid_union,
        unionErrors: o
      }), k;
    }
  }
  get options() {
    return this._def.options;
  }
}
lt.create = (t, e) => new lt({
  options: t,
  typeName: w.ZodUnion,
  ...b(e)
});
function At(t, e) {
  const r = ne(t), s = ne(e);
  if (t === e)
    return { valid: !0, data: t };
  if (r === p.object && s === p.object) {
    const n = A.objectKeys(e), a = A.objectKeys(t).filter((o) => n.indexOf(o) !== -1), i = { ...t, ...e };
    for (const o of a) {
      const c = At(t[o], e[o]);
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
      const i = t[a], o = e[a], c = At(i, o);
      if (!c.valid)
        return { valid: !1 };
      n.push(c.data);
    }
    return { valid: !0, data: n };
  } else return r === p.date && s === p.date && +t == +e ? { valid: !0, data: t } : { valid: !1 };
}
class ut extends S {
  _parse(e) {
    const { status: r, ctx: s } = this._processInputParams(e), n = (a, i) => {
      if (Ut(a) || Ut(i))
        return k;
      const o = At(a.value, i.value);
      return o.valid ? ((Ht(a) || Ht(i)) && r.dirty(), { status: r.value, value: o.data }) : (f(s, {
        code: h.invalid_intersection_types
      }), k);
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
ut.create = (t, e, r) => new ut({
  left: t,
  right: e,
  typeName: w.ZodIntersection,
  ...b(r)
});
class Se extends S {
  _parse(e) {
    const { status: r, ctx: s } = this._processInputParams(e);
    if (s.parsedType !== p.array)
      return f(s, {
        code: h.invalid_type,
        expected: p.array,
        received: s.parsedType
      }), k;
    if (s.data.length < this._def.items.length)
      return f(s, {
        code: h.too_small,
        minimum: this._def.items.length,
        inclusive: !0,
        exact: !1,
        type: "array"
      }), k;
    !this._def.rest && s.data.length > this._def.items.length && (f(s, {
      code: h.too_big,
      maximum: this._def.items.length,
      inclusive: !0,
      exact: !1,
      type: "array"
    }), r.dirty());
    const a = [...s.data].map((i, o) => {
      const c = this._def.items[o] || this._def.rest;
      return c ? c._parse(new fe(s, i, s.path, o)) : null;
    }).filter((i) => !!i);
    return s.common.async ? Promise.all(a).then((i) => D.mergeArray(r, i)) : D.mergeArray(r, a);
  }
  get items() {
    return this._def.items;
  }
  rest(e) {
    return new Se({
      ...this._def,
      rest: e
    });
  }
}
Se.create = (t, e) => {
  if (!Array.isArray(t))
    throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
  return new Se({
    items: t,
    typeName: w.ZodTuple,
    rest: null,
    ...b(e)
  });
};
class Kt extends S {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(e) {
    const { status: r, ctx: s } = this._processInputParams(e);
    if (s.parsedType !== p.map)
      return f(s, {
        code: h.invalid_type,
        expected: p.map,
        received: s.parsedType
      }), k;
    const n = this._def.keyType, a = this._def.valueType, i = [...s.data.entries()].map(([o, c], l) => ({
      key: n._parse(new fe(s, o, s.path, [l, "key"])),
      value: a._parse(new fe(s, c, s.path, [l, "value"]))
    }));
    if (s.common.async) {
      const o = /* @__PURE__ */ new Map();
      return Promise.resolve().then(async () => {
        for (const c of i) {
          const l = await c.key, u = await c.value;
          if (l.status === "aborted" || u.status === "aborted")
            return k;
          (l.status === "dirty" || u.status === "dirty") && r.dirty(), o.set(l.value, u.value);
        }
        return { status: r.value, value: o };
      });
    } else {
      const o = /* @__PURE__ */ new Map();
      for (const c of i) {
        const l = c.key, u = c.value;
        if (l.status === "aborted" || u.status === "aborted")
          return k;
        (l.status === "dirty" || u.status === "dirty") && r.dirty(), o.set(l.value, u.value);
      }
      return { status: r.value, value: o };
    }
  }
}
Kt.create = (t, e, r) => new Kt({
  valueType: e,
  keyType: t,
  typeName: w.ZodMap,
  ...b(r)
});
class We extends S {
  _parse(e) {
    const { status: r, ctx: s } = this._processInputParams(e);
    if (s.parsedType !== p.set)
      return f(s, {
        code: h.invalid_type,
        expected: p.set,
        received: s.parsedType
      }), k;
    const n = this._def;
    n.minSize !== null && s.data.size < n.minSize.value && (f(s, {
      code: h.too_small,
      minimum: n.minSize.value,
      type: "set",
      inclusive: !0,
      exact: !1,
      message: n.minSize.message
    }), r.dirty()), n.maxSize !== null && s.data.size > n.maxSize.value && (f(s, {
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
          return k;
        u.status === "dirty" && r.dirty(), l.add(u.value);
      }
      return { status: r.value, value: l };
    }
    const o = [...s.data.values()].map((c, l) => a._parse(new fe(s, c, s.path, l)));
    return s.common.async ? Promise.all(o).then((c) => i(c)) : i(o);
  }
  min(e, r) {
    return new We({
      ...this._def,
      minSize: { value: e, message: m.toString(r) }
    });
  }
  max(e, r) {
    return new We({
      ...this._def,
      maxSize: { value: e, message: m.toString(r) }
    });
  }
  size(e, r) {
    return this.min(e, r).max(e, r);
  }
  nonempty(e) {
    return this.min(1, e);
  }
}
We.create = (t, e) => new We({
  valueType: t,
  minSize: null,
  maxSize: null,
  typeName: w.ZodSet,
  ...b(e)
});
class Gt extends S {
  get schema() {
    return this._def.getter();
  }
  _parse(e) {
    const { ctx: r } = this._processInputParams(e);
    return this._def.getter()._parse({ data: r.data, path: r.path, parent: r });
  }
}
Gt.create = (t, e) => new Gt({
  getter: t,
  typeName: w.ZodLazy,
  ...b(e)
});
class Yt extends S {
  _parse(e) {
    if (e.data !== this._def.value) {
      const r = this._getOrReturnCtx(e);
      return f(r, {
        received: r.data,
        code: h.invalid_literal,
        expected: this._def.value
      }), k;
    }
    return { status: "valid", value: e.data };
  }
  get value() {
    return this._def.value;
  }
}
Yt.create = (t, e) => new Yt({
  value: t,
  typeName: w.ZodLiteral,
  ...b(e)
});
function kr(t, e) {
  return new Ze({
    values: t,
    typeName: w.ZodEnum,
    ...b(e)
  });
}
class Ze extends S {
  _parse(e) {
    if (typeof e.data != "string") {
      const r = this._getOrReturnCtx(e), s = this._def.values;
      return f(r, {
        expected: A.joinValues(s),
        received: r.parsedType,
        code: h.invalid_type
      }), k;
    }
    if (this._cache || (this._cache = new Set(this._def.values)), !this._cache.has(e.data)) {
      const r = this._getOrReturnCtx(e), s = this._def.values;
      return f(r, {
        received: r.data,
        code: h.invalid_enum_value,
        options: s
      }), k;
    }
    return H(e.data);
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
    return Ze.create(e, {
      ...this._def,
      ...r
    });
  }
  exclude(e, r = this._def) {
    return Ze.create(this.options.filter((s) => !e.includes(s)), {
      ...this._def,
      ...r
    });
  }
}
Ze.create = kr;
class Xt extends S {
  _parse(e) {
    const r = A.getValidEnumValues(this._def.values), s = this._getOrReturnCtx(e);
    if (s.parsedType !== p.string && s.parsedType !== p.number) {
      const n = A.objectValues(r);
      return f(s, {
        expected: A.joinValues(n),
        received: s.parsedType,
        code: h.invalid_type
      }), k;
    }
    if (this._cache || (this._cache = new Set(A.getValidEnumValues(this._def.values))), !this._cache.has(e.data)) {
      const n = A.objectValues(r);
      return f(s, {
        received: s.data,
        code: h.invalid_enum_value,
        options: n
      }), k;
    }
    return H(e.data);
  }
  get enum() {
    return this._def.values;
  }
}
Xt.create = (t, e) => new Xt({
  values: t,
  typeName: w.ZodNativeEnum,
  ...b(e)
});
class dt extends S {
  unwrap() {
    return this._def.type;
  }
  _parse(e) {
    const { ctx: r } = this._processInputParams(e);
    if (r.parsedType !== p.promise && r.common.async === !1)
      return f(r, {
        code: h.invalid_type,
        expected: p.promise,
        received: r.parsedType
      }), k;
    const s = r.parsedType === p.promise ? r.data : Promise.resolve(r.data);
    return H(s.then((n) => this._def.type.parseAsync(n, {
      path: r.path,
      errorMap: r.common.contextualErrorMap
    })));
  }
}
dt.create = (t, e) => new dt({
  type: t,
  typeName: w.ZodPromise,
  ...b(e)
});
class Le extends S {
  innerType() {
    return this._def.schema;
  }
  sourceType() {
    return this._def.schema._def.typeName === w.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
  }
  _parse(e) {
    const { status: r, ctx: s } = this._processInputParams(e), n = this._def.effect || null, a = {
      addIssue: (i) => {
        f(s, i), i.fatal ? r.abort() : r.dirty();
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
            return k;
          const c = await this._def.schema._parseAsync({
            data: o,
            path: s.path,
            parent: s
          });
          return c.status === "aborted" ? k : c.status === "dirty" || r.value === "dirty" ? Be(c.value) : c;
        });
      {
        if (r.value === "aborted")
          return k;
        const o = this._def.schema._parseSync({
          data: i,
          path: s.path,
          parent: s
        });
        return o.status === "aborted" ? k : o.status === "dirty" || r.value === "dirty" ? Be(o.value) : o;
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
        return o.status === "aborted" ? k : (o.status === "dirty" && r.dirty(), i(o.value), { status: r.value, value: o.value });
      } else
        return this._def.schema._parseAsync({ data: s.data, path: s.path, parent: s }).then((o) => o.status === "aborted" ? k : (o.status === "dirty" && r.dirty(), i(o.value).then(() => ({ status: r.value, value: o.value }))));
    }
    if (n.type === "transform")
      if (s.common.async === !1) {
        const i = this._def.schema._parseSync({
          data: s.data,
          path: s.path,
          parent: s
        });
        if (!$e(i))
          return k;
        const o = n.transform(i.value, a);
        if (o instanceof Promise)
          throw new Error("Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.");
        return { status: r.value, value: o };
      } else
        return this._def.schema._parseAsync({ data: s.data, path: s.path, parent: s }).then((i) => $e(i) ? Promise.resolve(n.transform(i.value, a)).then((o) => ({
          status: r.value,
          value: o
        })) : k);
    A.assertNever(n);
  }
}
Le.create = (t, e, r) => new Le({
  schema: t,
  typeName: w.ZodEffects,
  effect: e,
  ...b(r)
});
Le.createWithPreprocess = (t, e, r) => new Le({
  schema: e,
  effect: { type: "preprocess", transform: t },
  typeName: w.ZodEffects,
  ...b(r)
});
class de extends S {
  _parse(e) {
    return this._getType(e) === p.undefined ? H(void 0) : this._def.innerType._parse(e);
  }
  unwrap() {
    return this._def.innerType;
  }
}
de.create = (t, e) => new de({
  innerType: t,
  typeName: w.ZodOptional,
  ...b(e)
});
class De extends S {
  _parse(e) {
    return this._getType(e) === p.null ? H(null) : this._def.innerType._parse(e);
  }
  unwrap() {
    return this._def.innerType;
  }
}
De.create = (t, e) => new De({
  innerType: t,
  typeName: w.ZodNullable,
  ...b(e)
});
class Rt extends S {
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
Rt.create = (t, e) => new Rt({
  innerType: t,
  typeName: w.ZodDefault,
  defaultValue: typeof e.default == "function" ? e.default : () => e.default,
  ...b(e)
});
class Et extends S {
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
    return ot(n) ? n.then((a) => ({
      status: "valid",
      value: a.status === "valid" ? a.value : this._def.catchValue({
        get error() {
          return new ee(s.common.issues);
        },
        input: s.data
      })
    })) : {
      status: "valid",
      value: n.status === "valid" ? n.value : this._def.catchValue({
        get error() {
          return new ee(s.common.issues);
        },
        input: s.data
      })
    };
  }
  removeCatch() {
    return this._def.innerType;
  }
}
Et.create = (t, e) => new Et({
  innerType: t,
  typeName: w.ZodCatch,
  catchValue: typeof e.catch == "function" ? e.catch : () => e.catch,
  ...b(e)
});
class Qt extends S {
  _parse(e) {
    if (this._getType(e) !== p.nan) {
      const s = this._getOrReturnCtx(e);
      return f(s, {
        code: h.invalid_type,
        expected: p.nan,
        received: s.parsedType
      }), k;
    }
    return { status: "valid", value: e.data };
  }
}
Qt.create = (t) => new Qt({
  typeName: w.ZodNaN,
  ...b(t)
});
class bs extends S {
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
class It extends S {
  _parse(e) {
    const { status: r, ctx: s } = this._processInputParams(e);
    if (s.common.async)
      return (async () => {
        const a = await this._def.in._parseAsync({
          data: s.data,
          path: s.path,
          parent: s
        });
        return a.status === "aborted" ? k : a.status === "dirty" ? (r.dirty(), Be(a.value)) : this._def.out._parseAsync({
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
      return n.status === "aborted" ? k : n.status === "dirty" ? (r.dirty(), {
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
    return new It({
      in: e,
      out: r,
      typeName: w.ZodPipeline
    });
  }
}
class Ot extends S {
  _parse(e) {
    const r = this._def.innerType._parse(e), s = (n) => ($e(n) && (n.value = Object.freeze(n.value)), n);
    return ot(r) ? r.then((n) => s(n)) : s(r);
  }
  unwrap() {
    return this._def.innerType;
  }
}
Ot.create = (t, e) => new Ot({
  innerType: t,
  typeName: w.ZodReadonly,
  ...b(e)
});
var w;
(function(t) {
  t.ZodString = "ZodString", t.ZodNumber = "ZodNumber", t.ZodNaN = "ZodNaN", t.ZodBigInt = "ZodBigInt", t.ZodBoolean = "ZodBoolean", t.ZodDate = "ZodDate", t.ZodSymbol = "ZodSymbol", t.ZodUndefined = "ZodUndefined", t.ZodNull = "ZodNull", t.ZodAny = "ZodAny", t.ZodUnknown = "ZodUnknown", t.ZodNever = "ZodNever", t.ZodVoid = "ZodVoid", t.ZodArray = "ZodArray", t.ZodObject = "ZodObject", t.ZodUnion = "ZodUnion", t.ZodDiscriminatedUnion = "ZodDiscriminatedUnion", t.ZodIntersection = "ZodIntersection", t.ZodTuple = "ZodTuple", t.ZodRecord = "ZodRecord", t.ZodMap = "ZodMap", t.ZodSet = "ZodSet", t.ZodFunction = "ZodFunction", t.ZodLazy = "ZodLazy", t.ZodLiteral = "ZodLiteral", t.ZodEnum = "ZodEnum", t.ZodEffects = "ZodEffects", t.ZodNativeEnum = "ZodNativeEnum", t.ZodOptional = "ZodOptional", t.ZodNullable = "ZodNullable", t.ZodDefault = "ZodDefault", t.ZodCatch = "ZodCatch", t.ZodPromise = "ZodPromise", t.ZodBranded = "ZodBranded", t.ZodPipeline = "ZodPipeline", t.ZodReadonly = "ZodReadonly";
})(w || (w = {}));
const he = Q.create, Tt = xe.create;
be.create;
const Ss = ct.create;
Me.create;
const As = St.create;
pe.create;
q.create;
const Ve = T.create;
lt.create;
ut.create;
Se.create;
const Je = Ze.create;
dt.create;
de.create;
De.create;
const wr = {
  string: ((t) => Q.create({ ...t, coerce: !0 })),
  number: ((t) => xe.create({ ...t, coerce: !0 })),
  boolean: ((t) => ct.create({
    ...t,
    coerce: !0
  })),
  bigint: ((t) => be.create({ ...t, coerce: !0 })),
  date: ((t) => Me.create({ ...t, coerce: !0 }))
};
Ve({
  type: Je([
    "connection_established",
    "live_health_update",
    "historical_data_update",
    "emergency_alert",
    "client_presence",
    "error",
    "pong"
  ]),
  data: As().optional(),
  timestamp: he().datetime().optional()
});
const xr = Ve({
  type: Je(["heart_rate", "walking_steadiness", "steps", "oxygen_saturation"]).describe("metric identifier"),
  value: Tt().describe("numeric value for the metric"),
  unit: he().optional()
}), br = Ve({
  type: xr.shape.type,
  value: Tt(),
  processedAt: he().datetime(),
  validated: Ss(),
  healthScore: Tt().optional(),
  fallRisk: Je(["low", "moderate", "high", "critical"]).optional(),
  alert: Ve({
    level: Je(["warning", "critical"]),
    message: he()
  }).nullable().optional()
});
var er = (t, e, r) => (s, n) => {
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
      } catch (y) {
        if (y instanceof Error && e)
          s.error = y, c = await e(y, s), l = !0;
        else
          throw y;
      }
    else
      s.finalized === !1 && r && (c = await r(s));
    return c && (s.finalized === !1 || l) && (s.res = c), s;
  }
}, Rs = Symbol(), Es = async (t, e = /* @__PURE__ */ Object.create(null)) => {
  const { all: r = !1, dot: s = !1 } = e, a = (t instanceof Tr ? t.raw.headers : t.headers).get("Content-Type");
  return a != null && a.startsWith("multipart/form-data") || a != null && a.startsWith("application/x-www-form-urlencoded") ? Os(t, { all: r, dot: s }) : {};
};
async function Os(t, e) {
  const r = await t.formData();
  return r ? Ts(r, e) : {};
}
function Ts(t, e) {
  const r = /* @__PURE__ */ Object.create(null);
  return t.forEach((s, n) => {
    e.all || n.endsWith("[]") ? js(r, n, s) : r[n] = s;
  }), e.dot && Object.entries(r).forEach(([s, n]) => {
    s.includes(".") && (Cs(r, s, n), delete r[s]);
  }), r;
}
var js = (t, e, r) => {
  t[e] !== void 0 ? Array.isArray(t[e]) ? t[e].push(r) : t[e] = [t[e], r] : e.endsWith("[]") ? t[e] = [r] : t[e] = r;
}, Cs = (t, e, r) => {
  let s = t;
  const n = e.split(".");
  n.forEach((a, i) => {
    i === n.length - 1 ? s[a] = r : ((!s[a] || typeof s[a] != "object" || Array.isArray(s[a]) || s[a] instanceof File) && (s[a] = /* @__PURE__ */ Object.create(null)), s = s[a]);
  });
}, Sr = (t) => {
  const e = t.split("/");
  return e[0] === "" && e.shift(), e;
}, Ns = (t) => {
  const { groups: e, path: r } = Is(t), s = Sr(r);
  return Ps(s, e);
}, Is = (t) => {
  const e = [];
  return t = t.replace(/\{[^}]+\}/g, (r, s) => {
    const n = `@${s}`;
    return e.push([n, r]), n;
  }), { groups: e, path: t };
}, Ps = (t, e) => {
  for (let r = e.length - 1; r >= 0; r--) {
    const [s] = e[r];
    for (let n = t.length - 1; n >= 0; n--)
      if (t[n].includes(s)) {
        t[n] = t[n].replace(s, e[r][1]);
        break;
      }
  }
  return t;
}, rt = {}, $s = (t, e) => {
  if (t === "*")
    return "*";
  const r = t.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (r) {
    const s = `${t}#${e}`;
    return rt[s] || (r[2] ? rt[s] = e && e[0] !== ":" && e[0] !== "*" ? [s, r[1], new RegExp(`^${r[2]}(?=/${e})`)] : [t, r[1], new RegExp(`^${r[2]}$`)] : rt[s] = [t, r[1], !0]), rt[s];
  }
  return null;
}, Pt = (t, e) => {
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
}, Ms = (t) => Pt(t, decodeURI), Ar = (t) => {
  const e = t.url, r = e.indexOf(
    "/",
    e.charCodeAt(9) === 58 ? 13 : 8
  );
  let s = r;
  for (; s < e.length; s++) {
    const n = e.charCodeAt(s);
    if (n === 37) {
      const a = e.indexOf("?", s), i = e.slice(r, a === -1 ? void 0 : a);
      return Ms(i.includes("%25") ? i.replace(/%25/g, "%2525") : i);
    } else if (n === 63)
      break;
  }
  return e.slice(r, s);
}, Zs = (t) => {
  const e = Ar(t);
  return e.length > 1 && e.at(-1) === "/" ? e.slice(0, -1) : e;
}, Ee = (t, e, ...r) => (r.length && (e = Ee(e, ...r)), `${(t == null ? void 0 : t[0]) === "/" ? "" : "/"}${t}${e === "/" ? "" : `${(t == null ? void 0 : t.at(-1)) === "/" ? "" : "/"}${(e == null ? void 0 : e[0]) === "/" ? e.slice(1) : e}`}`), Rr = (t) => {
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
}, kt = (t) => /[%+]/.test(t) ? (t.indexOf("+") !== -1 && (t = t.replace(/\+/g, " ")), t.indexOf("%") !== -1 ? Pt(t, Or) : t) : t, Er = (t, e, r) => {
  let s;
  if (!r && e && !/[%+]/.test(e)) {
    let i = t.indexOf(`?${e}`, 8);
    for (i === -1 && (i = t.indexOf(`&${e}`, 8)); i !== -1; ) {
      const o = t.charCodeAt(i + e.length + 1);
      if (o === 61) {
        const c = i + e.length + 2, l = t.indexOf("&", c);
        return kt(t.slice(c, l === -1 ? void 0 : l));
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
    if (s && (c = kt(c)), a = i, c === "")
      continue;
    let l;
    o === -1 ? l = "" : (l = t.slice(o + 1, i === -1 ? void 0 : i), s && (l = kt(l))), r ? (n[c] && Array.isArray(n[c]) || (n[c] = []), n[c].push(l)) : n[c] ?? (n[c] = l);
  }
  return e ? n[e] : n;
}, Ls = Er, Ds = (t, e) => Er(t, e, !0), Or = decodeURIComponent, tr = (t) => Pt(t, Or), je, U, te, jr, Cr, jt, ae, nr, Tr = (nr = class {
  constructor(t, e = "/", r = [[]]) {
    x(this, te);
    _(this, "raw");
    x(this, je);
    x(this, U);
    _(this, "routeIndex", 0);
    _(this, "path");
    _(this, "bodyCache", {});
    x(this, ae, (t) => {
      const { bodyCache: e, raw: r } = this, s = e[t];
      if (s)
        return s;
      const n = Object.keys(e)[0];
      return n ? e[n].then((a) => (n === "json" && (a = JSON.stringify(a)), new Response(a)[t]())) : e[t] = r[t]();
    });
    this.raw = t, this.path = e, g(this, U, r), g(this, je, {});
  }
  param(t) {
    return t ? R(this, te, jr).call(this, t) : R(this, te, Cr).call(this);
  }
  query(t) {
    return Ls(this.url, t);
  }
  queries(t) {
    return Ds(this.url, t);
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
    return (e = this.bodyCache).parsedBody ?? (e.parsedBody = await Es(this, t));
  }
  json() {
    return d(this, ae).call(this, "text").then((t) => JSON.parse(t));
  }
  text() {
    return d(this, ae).call(this, "text");
  }
  arrayBuffer() {
    return d(this, ae).call(this, "arrayBuffer");
  }
  blob() {
    return d(this, ae).call(this, "blob");
  }
  formData() {
    return d(this, ae).call(this, "formData");
  }
  addValidatedData(t, e) {
    d(this, je)[t] = e;
  }
  valid(t) {
    return d(this, je)[t];
  }
  get url() {
    return this.raw.url;
  }
  get method() {
    return this.raw.method;
  }
  get [Rs]() {
    return d(this, U);
  }
  get matchedRoutes() {
    return d(this, U)[0].map(([[, t]]) => t);
  }
  get routePath() {
    return d(this, U)[0].map(([[, t]]) => t)[this.routeIndex].path;
  }
}, je = new WeakMap(), U = new WeakMap(), te = new WeakSet(), jr = function(t) {
  const e = d(this, U)[0][this.routeIndex][1][t], r = R(this, te, jt).call(this, e);
  return r ? /\%/.test(r) ? tr(r) : r : void 0;
}, Cr = function() {
  const t = {}, e = Object.keys(d(this, U)[0][this.routeIndex][1]);
  for (const r of e) {
    const s = R(this, te, jt).call(this, d(this, U)[0][this.routeIndex][1][r]);
    s && typeof s == "string" && (t[r] = /\%/.test(s) ? tr(s) : s);
  }
  return t;
}, jt = function(t) {
  return d(this, U)[1] ? d(this, U)[1][t] : t;
}, ae = new WeakMap(), nr), Vs = {
  Stringify: 1
}, Nr = async (t, e, r, s, n) => {
  typeof t == "object" && !(t instanceof String) && (t instanceof Promise || (t = t.toString()), t instanceof Promise && (t = await t));
  const a = t.callbacks;
  return a != null && a.length ? (n ? n[0] += t : n = [t], Promise.all(a.map((o) => o({ phase: e, buffer: n, context: s }))).then(
    (o) => Promise.all(
      o.filter(Boolean).map((c) => Nr(c, e, !1, s, n))
    ).then(() => n[0])
  )) : Promise.resolve(t);
}, Us = "text/plain; charset=UTF-8", wt = (t, e) => ({
  "Content-Type": t,
  ...e
}), Ke, Ge, K, Ce, G, Z, Ye, Ne, Ie, ge, Xe, Qe, ie, Oe, ar, Hs = (ar = class {
  constructor(t, e) {
    x(this, ie);
    x(this, Ke);
    x(this, Ge);
    _(this, "env", {});
    x(this, K);
    _(this, "finalized", !1);
    _(this, "error");
    x(this, Ce);
    x(this, G);
    x(this, Z);
    x(this, Ye);
    x(this, Ne);
    x(this, Ie);
    x(this, ge);
    x(this, Xe);
    x(this, Qe);
    _(this, "render", (...t) => (d(this, Ne) ?? g(this, Ne, (e) => this.html(e)), d(this, Ne).call(this, ...t)));
    _(this, "setLayout", (t) => g(this, Ye, t));
    _(this, "getLayout", () => d(this, Ye));
    _(this, "setRenderer", (t) => {
      g(this, Ne, t);
    });
    _(this, "header", (t, e, r) => {
      this.finalized && g(this, Z, new Response(d(this, Z).body, d(this, Z)));
      const s = d(this, Z) ? d(this, Z).headers : d(this, ge) ?? g(this, ge, new Headers());
      e === void 0 ? s.delete(t) : r != null && r.append ? s.append(t, e) : s.set(t, e);
    });
    _(this, "status", (t) => {
      g(this, Ce, t);
    });
    _(this, "set", (t, e) => {
      d(this, K) ?? g(this, K, /* @__PURE__ */ new Map()), d(this, K).set(t, e);
    });
    _(this, "get", (t) => d(this, K) ? d(this, K).get(t) : void 0);
    _(this, "newResponse", (...t) => R(this, ie, Oe).call(this, ...t));
    _(this, "body", (t, e, r) => R(this, ie, Oe).call(this, t, e, r));
    _(this, "text", (t, e, r) => !d(this, ge) && !d(this, Ce) && !e && !r && !this.finalized ? new Response(t) : R(this, ie, Oe).call(this, t, e, wt(Us, r)));
    _(this, "json", (t, e, r) => R(this, ie, Oe).call(this, JSON.stringify(t), e, wt("application/json", r)));
    _(this, "html", (t, e, r) => {
      const s = (n) => R(this, ie, Oe).call(this, n, e, wt("text/html; charset=UTF-8", r));
      return typeof t == "object" ? Nr(t, Vs.Stringify, !1, {}).then(s) : s(t);
    });
    _(this, "redirect", (t, e) => {
      const r = String(t);
      return this.header(
        "Location",
        /[^\x00-\xFF]/.test(r) ? encodeURI(r) : r
      ), this.newResponse(null, e ?? 302);
    });
    _(this, "notFound", () => (d(this, Ie) ?? g(this, Ie, () => new Response()), d(this, Ie).call(this, this)));
    g(this, Ke, t), e && (g(this, G, e.executionCtx), this.env = e.env, g(this, Ie, e.notFoundHandler), g(this, Qe, e.path), g(this, Xe, e.matchResult));
  }
  get req() {
    return d(this, Ge) ?? g(this, Ge, new Tr(d(this, Ke), d(this, Qe), d(this, Xe))), d(this, Ge);
  }
  get event() {
    if (d(this, G) && "respondWith" in d(this, G))
      return d(this, G);
    throw Error("This context has no FetchEvent");
  }
  get executionCtx() {
    if (d(this, G))
      return d(this, G);
    throw Error("This context has no ExecutionContext");
  }
  get res() {
    return d(this, Z) || g(this, Z, new Response(null, {
      headers: d(this, ge) ?? g(this, ge, new Headers())
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
    g(this, Z, t), this.finalized = !0;
  }
  get var() {
    return d(this, K) ? Object.fromEntries(d(this, K)) : {};
  }
}, Ke = new WeakMap(), Ge = new WeakMap(), K = new WeakMap(), Ce = new WeakMap(), G = new WeakMap(), Z = new WeakMap(), Ye = new WeakMap(), Ne = new WeakMap(), Ie = new WeakMap(), ge = new WeakMap(), Xe = new WeakMap(), Qe = new WeakMap(), ie = new WeakSet(), Oe = function(t, e, r) {
  const s = d(this, Z) ? new Headers(d(this, Z).headers) : d(this, ge) ?? new Headers();
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
  const n = typeof e == "number" ? e : (e == null ? void 0 : e.status) ?? d(this, Ce);
  return new Response(t, { status: n, headers: s });
}, ar), C = "ALL", zs = "all", Bs = ["get", "post", "put", "delete", "options", "patch"], Ir = "Can not add a route since the matcher is already built.", Pr = class extends Error {
}, Fs = "__COMPOSED_HANDLER", qs = (t) => t.text("404 Not Found", 404), rr = (t, e) => {
  if ("getResponse" in t) {
    const r = t.getResponse();
    return e.newResponse(r.body, r);
  }
  return console.error(t), e.text("Internal Server Error", 500);
}, z, N, Mr, B, me, nt, at, ir, $r = (ir = class {
  constructor(e = {}) {
    x(this, N);
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
    x(this, z, "/");
    _(this, "routes", []);
    x(this, B, qs);
    _(this, "errorHandler", rr);
    _(this, "onError", (e) => (this.errorHandler = e, this));
    _(this, "notFound", (e) => (g(this, B, e), this));
    _(this, "fetch", (e, ...r) => R(this, N, at).call(this, e, r[1], r[0], e.method));
    _(this, "request", (e, r, s, n) => e instanceof Request ? this.fetch(r ? new Request(e, r) : e, s, n) : (e = e.toString(), this.fetch(
      new Request(
        /^https?:\/\//.test(e) ? e : `http://localhost${Ee("/", e)}`,
        r
      ),
      s,
      n
    )));
    _(this, "fire", () => {
      addEventListener("fetch", (e) => {
        e.respondWith(R(this, N, at).call(this, e.request, e, void 0, e.request.method));
      });
    });
    [...Bs, zs].forEach((a) => {
      this[a] = (i, ...o) => (typeof i == "string" ? g(this, z, i) : R(this, N, me).call(this, a, d(this, z), i), o.forEach((c) => {
        R(this, N, me).call(this, a, d(this, z), c);
      }), this);
    }), this.on = (a, i, ...o) => {
      for (const c of [i].flat()) {
        g(this, z, c);
        for (const l of [a].flat())
          o.map((u) => {
            R(this, N, me).call(this, l.toUpperCase(), d(this, z), u);
          });
      }
      return this;
    }, this.use = (a, ...i) => (typeof a == "string" ? g(this, z, a) : (g(this, z, "*"), i.unshift(a)), i.forEach((o) => {
      R(this, N, me).call(this, C, d(this, z), o);
    }), this);
    const { strict: s, ...n } = e;
    Object.assign(this, n), this.getPath = s ?? !0 ? e.getPath ?? Ar : Zs;
  }
  route(e, r) {
    const s = this.basePath(e);
    return r.routes.map((n) => {
      var i;
      let a;
      r.errorHandler === rr ? a = n.handler : (a = async (o, c) => (await er([], r.errorHandler)(o, () => n.handler(o, c))).res, a[Fs] = n.handler), R(i = s, N, me).call(i, n.method, n.path, a);
    }), this;
  }
  basePath(e) {
    const r = R(this, N, Mr).call(this);
    return r._basePath = Ee(this._basePath, e), r;
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
      const c = Ee(this._basePath, e), l = c === "/" ? 0 : c.length;
      return (u) => {
        const y = new URL(u.url);
        return y.pathname = y.pathname.slice(l) || "/", new Request(y, u);
      };
    })());
    const o = async (c, l) => {
      const u = await r(n(c.req.raw), ...i(c));
      if (u)
        return u;
      await l();
    };
    return R(this, N, me).call(this, C, Ee(e, "*"), o), this;
  }
}, z = new WeakMap(), N = new WeakSet(), Mr = function() {
  const e = new $r({
    router: this.router,
    getPath: this.getPath
  });
  return e.errorHandler = this.errorHandler, g(e, B, d(this, B)), e.routes = this.routes, e;
}, B = new WeakMap(), me = function(e, r, s) {
  e = e.toUpperCase(), r = Ee(this._basePath, r);
  const n = { basePath: this._basePath, path: r, method: e, handler: s };
  this.router.add(e, r, [s, n]), this.routes.push(n);
}, nt = function(e, r) {
  if (e instanceof Error)
    return this.errorHandler(e, r);
  throw e;
}, at = function(e, r, s, n) {
  if (n === "HEAD")
    return (async () => new Response(null, await R(this, N, at).call(this, e, r, s, "GET")))();
  const a = this.getPath(e, { env: s }), i = this.router.match(n, a), o = new Hs(e, {
    path: a,
    matchResult: i,
    env: s,
    executionCtx: r,
    notFoundHandler: d(this, B)
  });
  if (i[0].length === 1) {
    let l;
    try {
      l = i[0][0][0][0](o, async () => {
        o.res = await d(this, B).call(this, o);
      });
    } catch (u) {
      return R(this, N, nt).call(this, u, o);
    }
    return l instanceof Promise ? l.then(
      (u) => u || (o.finalized ? o.res : d(this, B).call(this, o))
    ).catch((u) => R(this, N, nt).call(this, u, o)) : l ?? d(this, B).call(this, o);
  }
  const c = er(i[0], this.errorHandler, d(this, B));
  return (async () => {
    try {
      const l = await c(o);
      if (!l.finalized)
        throw new Error(
          "Context is not finalized. Did you forget to return a Response object or `await next()`?"
        );
      return l.res;
    } catch (l) {
      return R(this, N, nt).call(this, l, o);
    }
  })();
}, ir), ht = "[^/]+", Fe = ".*", qe = "(?:|/.*)", Te = Symbol(), Ws = new Set(".\\+*[^]$()");
function Js(t, e) {
  return t.length === 1 ? e.length === 1 ? t < e ? -1 : 1 : -1 : e.length === 1 || t === Fe || t === qe ? 1 : e === Fe || e === qe ? -1 : t === ht ? 1 : e === ht ? -1 : t.length === e.length ? t < e ? -1 : 1 : e.length - t.length;
}
var _e, ve, F, or, Ct = (or = class {
  constructor() {
    x(this, _e);
    x(this, ve);
    x(this, F, /* @__PURE__ */ Object.create(null));
  }
  insert(e, r, s, n, a) {
    if (e.length === 0) {
      if (d(this, _e) !== void 0)
        throw Te;
      if (a)
        return;
      g(this, _e, r);
      return;
    }
    const [i, ...o] = e, c = i === "*" ? o.length === 0 ? ["", "", Fe] : ["", "", ht] : i === "/*" ? ["", "", qe] : i.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
    let l;
    if (c) {
      const u = c[1];
      let y = c[2] || ht;
      if (u && c[2] && (y === ".*" || (y = y.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:"), /\((?!\?:)/.test(y))))
        throw Te;
      if (l = d(this, F)[y], !l) {
        if (Object.keys(d(this, F)).some(
          (v) => v !== Fe && v !== qe
        ))
          throw Te;
        if (a)
          return;
        l = d(this, F)[y] = new Ct(), u !== "" && g(l, ve, n.varIndex++);
      }
      !a && u !== "" && s.push([u, d(l, ve)]);
    } else if (l = d(this, F)[i], !l) {
      if (Object.keys(d(this, F)).some(
        (u) => u.length > 1 && u !== Fe && u !== qe
      ))
        throw Te;
      if (a)
        return;
      l = d(this, F)[i] = new Ct();
    }
    l.insert(o, r, s, n, a);
  }
  buildRegExpStr() {
    const r = Object.keys(d(this, F)).sort(Js).map((s) => {
      const n = d(this, F)[s];
      return (typeof d(n, ve) == "number" ? `(${s})@${d(n, ve)}` : Ws.has(s) ? `\\${s}` : s) + n.buildRegExpStr();
    });
    return typeof d(this, _e) == "number" && r.unshift(`#${d(this, _e)}`), r.length === 0 ? "" : r.length === 1 ? r[0] : "(?:" + r.join("|") + ")";
  }
}, _e = new WeakMap(), ve = new WeakMap(), F = new WeakMap(), or), ft, et, cr, Ks = (cr = class {
  constructor() {
    x(this, ft, { varIndex: 0 });
    x(this, et, new Ct());
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
    return d(this, et).insert(a, e, s, d(this, ft), r), s;
  }
  buildRegExp() {
    let t = d(this, et).buildRegExpStr();
    if (t === "")
      return [/^$/, [], []];
    let e = 0;
    const r = [], s = [];
    return t = t.replace(/#(\d+)|@(\d+)|\.\*\$/g, (n, a, i) => a !== void 0 ? (r[++e] = Number(a), "$()") : (i !== void 0 && (s[Number(i)] = ++e), "")), [new RegExp(`^${t}`), r, s];
  }
}, ft = new WeakMap(), et = new WeakMap(), cr), Zr = [], Gs = [/^$/, [], /* @__PURE__ */ Object.create(null)], it = /* @__PURE__ */ Object.create(null);
function Lr(t) {
  return it[t] ?? (it[t] = new RegExp(
    t === "*" ? "" : `^${t.replace(
      /\/\*$|([.\\+*[^\]$()])/g,
      (e, r) => r ? `\\${r}` : "(?:|/.*)"
    )}$`
  ));
}
function Ys() {
  it = /* @__PURE__ */ Object.create(null);
}
function Xs(t) {
  var l;
  const e = new Ks(), r = [];
  if (t.length === 0)
    return Gs;
  const s = t.map(
    (u) => [!/\*|\/:/.test(u[0]), ...u]
  ).sort(
    ([u, y], [v, O]) => u ? 1 : v ? -1 : y.length - O.length
  ), n = /* @__PURE__ */ Object.create(null);
  for (let u = 0, y = -1, v = s.length; u < v; u++) {
    const [O, j, E] = s[u];
    O ? n[j] = [E.map(([P]) => [P, /* @__PURE__ */ Object.create(null)]), Zr] : y++;
    let I;
    try {
      I = e.insert(j, y, O);
    } catch (P) {
      throw P === Te ? new Pr(j) : P;
    }
    O || (r[y] = E.map(([P, W]) => {
      const re = /* @__PURE__ */ Object.create(null);
      for (W -= 1; W >= 0; W--) {
        const [L, pt] = I[W];
        re[L] = pt;
      }
      return [P, re];
    }));
  }
  const [a, i, o] = e.buildRegExp();
  for (let u = 0, y = r.length; u < y; u++)
    for (let v = 0, O = r[u].length; v < O; v++) {
      const j = (l = r[u][v]) == null ? void 0 : l[1];
      if (!j)
        continue;
      const E = Object.keys(j);
      for (let I = 0, P = E.length; I < P; I++)
        j[E[I]] = o[j[E[I]]];
    }
  const c = [];
  for (const u in i)
    c[u] = r[i[u]];
  return [a, c, n];
}
function Ae(t, e) {
  if (t) {
    for (const r of Object.keys(t).sort((s, n) => n.length - s.length))
      if (Lr(r).test(e))
        return [...t[r]];
  }
}
var oe, ce, Ue, Dr, Vr, lr, Qs = (lr = class {
  constructor() {
    x(this, Ue);
    _(this, "name", "RegExpRouter");
    x(this, oe);
    x(this, ce);
    g(this, oe, { [C]: /* @__PURE__ */ Object.create(null) }), g(this, ce, { [C]: /* @__PURE__ */ Object.create(null) });
  }
  add(t, e, r) {
    var o;
    const s = d(this, oe), n = d(this, ce);
    if (!s || !n)
      throw new Error(Ir);
    s[t] || [s, n].forEach((c) => {
      c[t] = /* @__PURE__ */ Object.create(null), Object.keys(c[C]).forEach((l) => {
        c[t][l] = [...c[C][l]];
      });
    }), e === "/*" && (e = "*");
    const a = (e.match(/\/:/g) || []).length;
    if (/\*$/.test(e)) {
      const c = Lr(e);
      t === C ? Object.keys(s).forEach((l) => {
        var u;
        (u = s[l])[e] || (u[e] = Ae(s[l], e) || Ae(s[C], e) || []);
      }) : (o = s[t])[e] || (o[e] = Ae(s[t], e) || Ae(s[C], e) || []), Object.keys(s).forEach((l) => {
        (t === C || t === l) && Object.keys(s[l]).forEach((u) => {
          c.test(u) && s[l][u].push([r, a]);
        });
      }), Object.keys(n).forEach((l) => {
        (t === C || t === l) && Object.keys(n[l]).forEach(
          (u) => c.test(u) && n[l][u].push([r, a])
        );
      });
      return;
    }
    const i = Rr(e) || [e];
    for (let c = 0, l = i.length; c < l; c++) {
      const u = i[c];
      Object.keys(n).forEach((y) => {
        var v;
        (t === C || t === y) && ((v = n[y])[u] || (v[u] = [
          ...Ae(s[y], u) || Ae(s[C], u) || []
        ]), n[y][u].push([r, a - l + c + 1]));
      });
    }
  }
  match(t, e) {
    Ys();
    const r = R(this, Ue, Dr).call(this);
    return this.match = (s, n) => {
      const a = r[s] || r[C], i = a[2][n];
      if (i)
        return i;
      const o = n.match(a[0]);
      if (!o)
        return [[], Zr];
      const c = o.indexOf("", 1);
      return [a[1][c], o];
    }, this.match(t, e);
  }
}, oe = new WeakMap(), ce = new WeakMap(), Ue = new WeakSet(), Dr = function() {
  const t = /* @__PURE__ */ Object.create(null);
  return Object.keys(d(this, ce)).concat(Object.keys(d(this, oe))).forEach((e) => {
    t[e] || (t[e] = R(this, Ue, Vr).call(this, e));
  }), g(this, oe, g(this, ce, void 0)), t;
}, Vr = function(t) {
  const e = [];
  let r = t === C;
  return [d(this, oe), d(this, ce)].forEach((s) => {
    const n = s[t] ? Object.keys(s[t]).map((a) => [a, s[t][a]]) : [];
    n.length !== 0 ? (r || (r = !0), e.push(...n)) : t !== C && e.push(
      ...Object.keys(s[C]).map((a) => [a, s[C][a]])
    );
  }), r ? Xs(e) : null;
}, lr), le, Y, ur, en = (ur = class {
  constructor(t) {
    _(this, "name", "SmartRouter");
    x(this, le, []);
    x(this, Y, []);
    g(this, le, t.routers);
  }
  add(t, e, r) {
    if (!d(this, Y))
      throw new Error(Ir);
    d(this, Y).push([t, e, r]);
  }
  match(t, e) {
    if (!d(this, Y))
      throw new Error("Fatal error");
    const r = d(this, le), s = d(this, Y), n = r.length;
    let a = 0, i;
    for (; a < n; a++) {
      const o = r[a];
      try {
        for (let c = 0, l = s.length; c < l; c++)
          o.add(...s[c]);
        i = o.match(t, e);
      } catch (c) {
        if (c instanceof Pr)
          continue;
        throw c;
      }
      this.match = o.match.bind(o), g(this, le, [o]), g(this, Y, void 0);
      break;
    }
    if (a === n)
      throw new Error("Fatal error");
    return this.name = `SmartRouter + ${this.activeRouter.name}`, i;
  }
  get activeRouter() {
    if (d(this, Y) || d(this, le).length !== 1)
      throw new Error("No active router has been determined yet.");
    return d(this, le)[0];
  }
}, le = new WeakMap(), Y = new WeakMap(), ur), ze = /* @__PURE__ */ Object.create(null), ue, M, ke, Pe, $, X, ye, dr, Ur = (dr = class {
  constructor(t, e, r) {
    x(this, X);
    x(this, ue);
    x(this, M);
    x(this, ke);
    x(this, Pe, 0);
    x(this, $, ze);
    if (g(this, M, r || /* @__PURE__ */ Object.create(null)), g(this, ue, []), t && e) {
      const s = /* @__PURE__ */ Object.create(null);
      s[t] = { handler: e, possibleKeys: [], score: 0 }, g(this, ue, [s]);
    }
    g(this, ke, []);
  }
  insert(t, e, r) {
    g(this, Pe, ++Zt(this, Pe)._);
    let s = this;
    const n = Ns(e), a = [];
    for (let i = 0, o = n.length; i < o; i++) {
      const c = n[i], l = n[i + 1], u = $s(c, l), y = Array.isArray(u) ? u[0] : c;
      if (y in d(s, M)) {
        s = d(s, M)[y], u && a.push(u[1]);
        continue;
      }
      d(s, M)[y] = new Ur(), u && (d(s, ke).push(u), a.push(u[1])), s = d(s, M)[y];
    }
    return d(s, ue).push({
      [t]: {
        handler: r,
        possibleKeys: a.filter((i, o, c) => c.indexOf(i) === o),
        score: d(this, Pe)
      }
    }), s;
  }
  search(t, e) {
    var o;
    const r = [];
    g(this, $, ze);
    let n = [this];
    const a = Sr(e), i = [];
    for (let c = 0, l = a.length; c < l; c++) {
      const u = a[c], y = c === l - 1, v = [];
      for (let O = 0, j = n.length; O < j; O++) {
        const E = n[O], I = d(E, M)[u];
        I && (g(I, $, d(E, $)), y ? (d(I, M)["*"] && r.push(
          ...R(this, X, ye).call(this, d(I, M)["*"], t, d(E, $))
        ), r.push(...R(this, X, ye).call(this, I, t, d(E, $)))) : v.push(I));
        for (let P = 0, W = d(E, ke).length; P < W; P++) {
          const re = d(E, ke)[P], L = d(E, $) === ze ? {} : { ...d(E, $) };
          if (re === "*") {
            const se = d(E, M)["*"];
            se && (r.push(...R(this, X, ye).call(this, se, t, d(E, $))), g(se, $, L), v.push(se));
            continue;
          }
          const [pt, $t, He] = re;
          if (!u && !(He instanceof RegExp))
            continue;
          const J = d(E, M)[pt], zr = a.slice(c).join("/");
          if (He instanceof RegExp) {
            const se = He.exec(zr);
            if (se) {
              if (L[$t] = se[0], r.push(...R(this, X, ye).call(this, J, t, d(E, $), L)), Object.keys(d(J, M)).length) {
                g(J, $, L);
                const mt = ((o = se[0].match(/\//)) == null ? void 0 : o.length) ?? 0;
                (i[mt] || (i[mt] = [])).push(J);
              }
              continue;
            }
          }
          (He === !0 || He.test(u)) && (L[$t] = u, y ? (r.push(...R(this, X, ye).call(this, J, t, L, d(E, $))), d(J, M)["*"] && r.push(
            ...R(this, X, ye).call(this, d(J, M)["*"], t, L, d(E, $))
          )) : (g(J, $, L), v.push(J)));
        }
      }
      n = v.concat(i.shift() ?? []);
    }
    return r.length > 1 && r.sort((c, l) => c.score - l.score), [r.map(({ handler: c, params: l }) => [c, l])];
  }
}, ue = new WeakMap(), M = new WeakMap(), ke = new WeakMap(), Pe = new WeakMap(), $ = new WeakMap(), X = new WeakSet(), ye = function(t, e, r, s) {
  const n = [];
  for (let a = 0, i = d(t, ue).length; a < i; a++) {
    const o = d(t, ue)[a], c = o[e] || o[C], l = {};
    if (c !== void 0 && (c.params = /* @__PURE__ */ Object.create(null), n.push(c), r !== ze || s && s !== ze))
      for (let u = 0, y = c.possibleKeys.length; u < y; u++) {
        const v = c.possibleKeys[u], O = l[c.score];
        c.params[v] = s != null && s[v] && !O ? s[v] : r[v] ?? (s == null ? void 0 : s[v]), l[c.score] = !0;
      }
  }
  return n;
}, dr), we, hr, tn = (hr = class {
  constructor() {
    _(this, "name", "TrieRouter");
    x(this, we);
    g(this, we, new Ur());
  }
  add(t, e, r) {
    const s = Rr(e);
    if (s) {
      for (let n = 0, a = s.length; n < a; n++)
        d(this, we).insert(t, s[n], r);
      return;
    }
    d(this, we).insert(t, e, r);
  }
  match(t, e) {
    return d(this, we).search(t, e);
  }
}, we = new WeakMap(), hr), rn = class extends $r {
  constructor(t = {}) {
    super(t), this.router = t.router ?? new en({
      routers: [new Qs(), new tn()]
    });
  }
};
const V = new rn(), xt = /* @__PURE__ */ new Map();
function sr(t, e = 60, r = 6e4) {
  const s = Date.now(), n = xt.get(t) || { tokens: e, last: s }, a = s - n.last, i = Math.floor(a / r) * e;
  return n.tokens = Math.min(e, n.tokens + i), n.last = s, n.tokens <= 0 ? (xt.set(t, n), !1) : (n.tokens -= 1, xt.set(t, n), !0);
}
async function sn(t, e, r = 60, s = 6e4) {
  try {
    if (!t.env.RATE_LIMITER) return sr(e, r, s);
    const n = t.env.RATE_LIMITER.idFromName(e), a = t.env.RATE_LIMITER.get(n), i = new URL("https://do.local/consume");
    i.searchParams.set("key", e), i.searchParams.set("limit", String(r)), i.searchParams.set("intervalMs", String(s));
    const o = await a.fetch(new Request(i.toString()));
    return o.ok ? !!(await o.json().catch(() => ({ ok: !1 }))).ok : !1;
  } catch {
    return sr(e, r, s);
  }
}
function Hr(t) {
  var n;
  const e = t.req.header("Authorization") || "", r = e.startsWith("Bearer ") ? e.slice(7) : "";
  return (r ? (n = Jr(r)) == null ? void 0 : n.sub : void 0) || t.req.header("CF-Connecting-IP") || "anon";
}
async function nn(t) {
  if (t.env.ENVIRONMENT !== "production") return !0;
  const e = t.req.header("Authorization") || "", r = e.startsWith("Bearer ") ? e.slice(7) : "";
  if (!r) return !1;
  const s = t.env.API_JWKS_URL;
  return s ? (await yr(r, {
    iss: t.env.API_ISS,
    aud: t.env.API_AUD,
    jwksUrl: s
  })).ok : (await mr(r, {
    iss: t.env.API_ISS,
    aud: t.env.API_AUD
  })).ok;
}
V.use("*", async (t, e) => {
  const r = t.req.header("Origin") || null, s = (t.env.ALLOWED_ORIGINS || "").split(",").map((o) => o.trim()).filter(Boolean), n = crypto.randomUUID();
  if (t.req.method === "OPTIONS") {
    const o = Lt(r, s);
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
    ), o.set("X-Content-Type-Options", "nosniff"), o.set("X-Frame-Options", "DENY"), o.set("Referrer-Policy", "no-referrer"), o.set("Permissions-Policy", "geolocation=(), microphone=(), camera=()"), o.set("Content-Security-Policy", i), o.set("X-Correlation-Id", n), Lt(r, s).forEach((l, u) => o.set(u, l));
  } catch (o) {
    tt.warn("header_injection_failed", { error: o.message });
  }
  return a;
});
V.use("/api/*", async (t, e) => {
  const r = Hr(t);
  return await sn(t, r) ? await nn(t) ? e() : t.json({ error: "unauthorized" }, 401) : t.json({ error: "rate_limited" }, 429);
});
V.use("/*", async (t, e) => {
  var s;
  if (t.req.method !== "GET") return e();
  const r = await ((s = t.env.ASSETS) == null ? void 0 : s.fetch(t.req.raw));
  return !r || r.status === 404 ? e() : r;
});
V.get("/health", (t) => t.json({
  status: "healthy",
  timestamp: (/* @__PURE__ */ new Date()).toISOString(),
  environment: t.env.ENVIRONMENT || "unknown"
}));
V.get("/ws", (t) => t.text(
  "WebSocket endpoint not available on Worker. Use local bridge server.",
  426
));
V.get("/api/_selftest", async (t) => {
  if (t.env.ENVIRONMENT === "production")
    return t.json({ error: "not_available" }, 404);
  const e = {};
  try {
    const r = t.env.ENC_KEY;
    if (r) {
      const s = await Nt(r), n = { hello: "world", at: Date.now() }, a = await gr(s, n);
      e.aes_gcm = { ok: !0, ciphertextLength: a.length };
    } else
      e.aes_gcm = { ok: !1, reason: "no_key" };
  } catch (r) {
    e.aes_gcm = { ok: !1, error: r.message };
  }
  try {
    const r = "eyJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJiYSIsImF1ZCI6ImF1ZCIsImV4cCI6MX0.signature", s = t.env.API_JWKS_URL;
    if (s) {
      const n = await yr(r, {
        iss: "ba",
        aud: "aud",
        jwksUrl: s
      });
      e.jwt_jwks_negative = { ok: !n.ok };
    } else
      e.jwt_claims_negative = {
        ok: !(await mr(r)).ok
      };
  } catch (r) {
    e.jwt_error = { ok: !1, error: r.message };
  }
  return t.json({ ok: !0, results: e });
});
V.get("/api/_ratelimit", async (t) => {
  if (t.env.ENVIRONMENT === "production")
    return t.json({ error: "not_available" }, 404);
  const e = new URL(t.req.url).searchParams.get("key") || Hr(t);
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
V.get("/api/_audit", async (t) => {
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
V.post("/api/device/auth", async (t) => {
  const e = t.env.DEVICE_JWT_SECRET;
  if (!e) return t.json({ error: "not_configured" }, 500);
  const r = Ve({
    userId: he().min(1),
    clientType: Je(["ios_app", "web_dashboard"]).default("ios_app"),
    ttlSec: wr.number().min(60).max(3600).optional()
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
    const o = await Yr(
      i,
      e
    );
    return t.json({ ok: !0, token: o, expiresIn: a });
  } catch (o) {
    return tt.error("device_token_sign_failed", { error: o.message }), t.json({ error: "server_error" }, 500);
  }
});
V.post("/api/_purge", async (t) => {
  if (t.env.ENVIRONMENT === "production")
    return t.json({ error: "not_available" }, 404);
  const e = new URL(t.req.url), r = Math.max(
    1,
    Math.min(2e3, Number(e.searchParams.get("limit") || 1e3))
  ), s = e.searchParams.get("prefix") || "health:", n = t.env.HEALTH_KV;
  if (!n || typeof n.list != "function" || typeof n.delete != "function")
    return t.json({ ok: !0, scanned: 0, deleted: 0 });
  const a = await pr(t.env, n, { limit: r, prefix: s });
  return t.json({ ok: !0, ...a });
});
V.get("/api/health-data", async (t) => {
  const e = Ve({
    from: he().datetime().optional(),
    to: he().datetime().optional(),
    metric: xr.shape.type.optional(),
    limit: wr.number().min(1).max(500).optional(),
    cursor: he().optional()
  }), r = new URL(t.req.url), s = Object.fromEntries(r.searchParams.entries()), n = e.safeParse(s);
  if (!n.success)
    return t.json(
      { error: "validation_error", details: n.error.flatten() },
      400
    );
  const { from: a, to: i, metric: o, cursor: c } = n.data, l = n.data.limit ?? 100, u = t.env.HEALTH_KV;
  if (!u || typeof u.list != "function" || typeof u.get != "function")
    return t.json({ ok: !0, data: [] });
  const y = o ? `health:${o}:` : "health:";
  try {
    const v = await u.list({ prefix: y, limit: l, cursor: c }), O = t.env.ENC_KEY, j = O ? await Nt(O) : null, E = [];
    for (const I of v.keys) {
      const P = await u.get(I.name);
      if (!P) continue;
      const W = j ? await (async () => {
        try {
          return await Gr(j, P);
        } catch {
          return null;
        }
      })() : (() => {
        try {
          return JSON.parse(P);
        } catch {
          return null;
        }
      })();
      if (!W) continue;
      const re = br.safeParse(W);
      if (!re.success) continue;
      const L = re.data;
      if (!(a && new Date(L.processedAt).getTime() < new Date(a).getTime()) && !(i && new Date(L.processedAt).getTime() > new Date(i).getTime()) && (E.push(L), E.length >= l))
        break;
    }
    return E.sort((I, P) => I.processedAt < P.processedAt ? 1 : -1), t.json({
      ok: !0,
      data: E,
      nextCursor: v.list_complete ? void 0 : v.cursor,
      hasMore: v.list_complete === !1
    });
  } catch (v) {
    return tt.error("KV read failed", { error: v.message }), t.json({ error: "server_error" }, 500);
  }
});
V.post("/api/health-data", async (t) => {
  let e;
  try {
    e = await t.req.json();
  } catch {
    return t.json({ error: "invalid_json" }, 400);
  }
  const r = br.safeParse(e);
  if (!r.success)
    return t.json(
      { error: "validation_error", details: r.error.flatten() },
      400
    );
  try {
    const s = t.env.HEALTH_KV;
    if (s) {
      const a = `health:${r.data.type}:${r.data.processedAt}`, i = t.env.ENC_KEY ? await Nt(t.env.ENC_KEY) : null, o = i ? await gr(i, r.data) : JSON.stringify(r.data), c = fr(r.data.type, t.env.ENVIRONMENT);
      await s.put(a, o, { expirationTtl: c });
    }
    const n = t.res.headers.get("X-Correlation-Id") || "";
    await Kr(t.env, {
      type: "health_data_created",
      actor: "api",
      resource: "kv:health",
      meta: { type: r.data.type, correlationId: n }
    });
  } catch (s) {
    return tt.error("KV write failed", { error: s.message }), t.json({ error: "server_error" }, 500);
  }
  return t.json({ ok: !0, data: r.data }, 201);
});
V.get("*", async (t) => {
  const e = new URL("/index.html", t.req.url);
  return t.env.ASSETS ? t.env.ASSETS.fetch(new Request(e.toString(), t.req.raw)) : t.text("Not Found", 404);
});
async function un(t, e, r) {
  const s = e.HEALTH_KV;
  s && r.waitUntil(pr(e, s));
}
class dn {
  constructor(e) {
    _(this, "storage");
    this.storage = e.storage;
  }
  async fetch(e) {
    const r = new URL(e.url), s = r.searchParams.get("key") || "anon", n = Number(r.searchParams.get("limit") || 60), a = Number(r.searchParams.get("intervalMs") || 6e4), i = r.searchParams.get("probe") === "1", o = Date.now(), c = await this.storage.get(s), l = c && typeof c.tokens == "number" && typeof c.last == "number" ? { tokens: c.tokens, last: c.last } : { tokens: n, last: o }, u = o - l.last, y = Math.floor(u / a) * n;
    return l.tokens = Math.min(n, l.tokens + y), l.last = o, !i && l.tokens <= 0 ? (await this.storage.put(s, l), new Response(JSON.stringify({ ok: !1 }), {
      status: 429,
      headers: { "content-type": "application/json" }
    })) : (i || (l.tokens -= 1, await this.storage.put(s, l)), new Response(
      JSON.stringify({ ok: !0, remaining: l.tokens }),
      { status: 200, headers: { "content-type": "application/json" } }
    ));
  }
}
class hn {
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
  hn as HealthWebSocket,
  dn as RateLimiter,
  V as default,
  un as scheduled
};
//# sourceMappingURL=index.js.map

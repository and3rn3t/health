var qr = Object.defineProperty;
var Zt = (t) => {
  throw TypeError(t);
};
var Wr = (t, e, r) => e in t ? qr(t, e, { enumerable: !0, configurable: !0, writable: !0, value: r }) : t[e] = r;
var v = (t, e, r) => Wr(t, typeof e != "symbol" ? e + "" : e, r), gt = (t, e, r) => e.has(t) || Zt("Cannot " + r);
var d = (t, e, r) => (gt(t, e, "read from private field"), r ? r.call(t) : e.get(t)), x = (t, e, r) => e.has(t) ? Zt("Cannot add the same private member more than once") : e instanceof WeakSet ? e.add(t) : e.set(t, r), g = (t, e, r, s) => (gt(t, e, "write to private field"), s ? s.call(t, r) : e.set(t, r), r), A = (t, e, r) => (gt(t, e, "access private method"), r);
var Lt = (t, e, r, s) => ({
  set _(n) {
    g(t, e, n, r);
  },
  get _() {
    return d(t, e, s);
  }
});
var Dt = (t, e, r) => (s, n) => {
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
}, Jr = Symbol(), Kr = async (t, e = /* @__PURE__ */ Object.create(null)) => {
  const { all: r = !1, dot: s = !1 } = e, a = (t instanceof _r ? t.raw.headers : t.headers).get("Content-Type");
  return a != null && a.startsWith("multipart/form-data") || a != null && a.startsWith("application/x-www-form-urlencoded") ? Gr(t, { all: r, dot: s }) : {};
};
async function Gr(t, e) {
  const r = await t.formData();
  return r ? Yr(r, e) : {};
}
function Yr(t, e) {
  const r = /* @__PURE__ */ Object.create(null);
  return t.forEach((s, n) => {
    e.all || n.endsWith("[]") ? Xr(r, n, s) : r[n] = s;
  }), e.dot && Object.entries(r).forEach(([s, n]) => {
    s.includes(".") && (Qr(r, s, n), delete r[s]);
  }), r;
}
var Xr = (t, e, r) => {
  t[e] !== void 0 ? Array.isArray(t[e]) ? t[e].push(r) : t[e] = [t[e], r] : e.endsWith("[]") ? t[e] = [r] : t[e] = r;
}, Qr = (t, e, r) => {
  let s = t;
  const n = e.split(".");
  n.forEach((a, i) => {
    i === n.length - 1 ? s[a] = r : ((!s[a] || typeof s[a] != "object" || Array.isArray(s[a]) || s[a] instanceof File) && (s[a] = /* @__PURE__ */ Object.create(null)), s = s[a]);
  });
}, pr = (t) => {
  const e = t.split("/");
  return e[0] === "" && e.shift(), e;
}, es = (t) => {
  const { groups: e, path: r } = ts(t), s = pr(r);
  return rs(s, e);
}, ts = (t) => {
  const e = [];
  return t = t.replace(/\{[^}]+\}/g, (r, s) => {
    const n = `@${s}`;
    return e.push([n, r]), n;
  }), { groups: e, path: t };
}, rs = (t, e) => {
  for (let r = e.length - 1; r >= 0; r--) {
    const [s] = e[r];
    for (let n = t.length - 1; n >= 0; n--)
      if (t[n].includes(s)) {
        t[n] = t[n].replace(s, e[r][1]);
        break;
      }
  }
  return t;
}, rt = {}, ss = (t, e) => {
  if (t === "*")
    return "*";
  const r = t.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (r) {
    const s = `${t}#${e}`;
    return rt[s] || (r[2] ? rt[s] = e && e[0] !== ":" && e[0] !== "*" ? [s, r[1], new RegExp(`^${r[2]}(?=/${e})`)] : [t, r[1], new RegExp(`^${r[2]}$`)] : rt[s] = [t, r[1], !0]), rt[s];
  }
  return null;
}, It = (t, e) => {
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
}, ns = (t) => It(t, decodeURI), mr = (t) => {
  const e = t.url, r = e.indexOf(
    "/",
    e.charCodeAt(9) === 58 ? 13 : 8
  );
  let s = r;
  for (; s < e.length; s++) {
    const n = e.charCodeAt(s);
    if (n === 37) {
      const a = e.indexOf("?", s), i = e.slice(r, a === -1 ? void 0 : a);
      return ns(i.includes("%25") ? i.replace(/%25/g, "%2525") : i);
    } else if (n === 63)
      break;
  }
  return e.slice(r, s);
}, as = (t) => {
  const e = mr(t);
  return e.length > 1 && e.at(-1) === "/" ? e.slice(0, -1) : e;
}, Oe = (t, e, ...r) => (r.length && (e = Oe(e, ...r)), `${(t == null ? void 0 : t[0]) === "/" ? "" : "/"}${t}${e === "/" ? "" : `${(t == null ? void 0 : t.at(-1)) === "/" ? "" : "/"}${(e == null ? void 0 : e[0]) === "/" ? e.slice(1) : e}`}`), yr = (t) => {
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
}, vt = (t) => /[%+]/.test(t) ? (t.indexOf("+") !== -1 && (t = t.replace(/\+/g, " ")), t.indexOf("%") !== -1 ? It(t, vr) : t) : t, gr = (t, e, r) => {
  let s;
  if (!r && e && !/[%+]/.test(e)) {
    let i = t.indexOf(`?${e}`, 8);
    for (i === -1 && (i = t.indexOf(`&${e}`, 8)); i !== -1; ) {
      const o = t.charCodeAt(i + e.length + 1);
      if (o === 61) {
        const c = i + e.length + 2, l = t.indexOf("&", c);
        return vt(t.slice(c, l === -1 ? void 0 : l));
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
    if (s && (c = vt(c)), a = i, c === "")
      continue;
    let l;
    o === -1 ? l = "" : (l = t.slice(o + 1, i === -1 ? void 0 : i), s && (l = vt(l))), r ? (n[c] && Array.isArray(n[c]) || (n[c] = []), n[c].push(l)) : n[c] ?? (n[c] = l);
  }
  return e ? n[e] : n;
}, is = gr, os = (t, e) => gr(t, e, !0), vr = decodeURIComponent, Vt = (t) => It(t, vr), Ce, H, te, kr, wr, St, ie, ar, _r = (ar = class {
  constructor(t, e = "/", r = [[]]) {
    x(this, te);
    v(this, "raw");
    x(this, Ce);
    x(this, H);
    v(this, "routeIndex", 0);
    v(this, "path");
    v(this, "bodyCache", {});
    x(this, ie, (t) => {
      const { bodyCache: e, raw: r } = this, s = e[t];
      if (s)
        return s;
      const n = Object.keys(e)[0];
      return n ? e[n].then((a) => (n === "json" && (a = JSON.stringify(a)), new Response(a)[t]())) : e[t] = r[t]();
    });
    this.raw = t, this.path = e, g(this, H, r), g(this, Ce, {});
  }
  param(t) {
    return t ? A(this, te, kr).call(this, t) : A(this, te, wr).call(this);
  }
  query(t) {
    return is(this.url, t);
  }
  queries(t) {
    return os(this.url, t);
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
    return (e = this.bodyCache).parsedBody ?? (e.parsedBody = await Kr(this, t));
  }
  json() {
    return d(this, ie).call(this, "text").then((t) => JSON.parse(t));
  }
  text() {
    return d(this, ie).call(this, "text");
  }
  arrayBuffer() {
    return d(this, ie).call(this, "arrayBuffer");
  }
  blob() {
    return d(this, ie).call(this, "blob");
  }
  formData() {
    return d(this, ie).call(this, "formData");
  }
  addValidatedData(t, e) {
    d(this, Ce)[t] = e;
  }
  valid(t) {
    return d(this, Ce)[t];
  }
  get url() {
    return this.raw.url;
  }
  get method() {
    return this.raw.method;
  }
  get [Jr]() {
    return d(this, H);
  }
  get matchedRoutes() {
    return d(this, H)[0].map(([[, t]]) => t);
  }
  get routePath() {
    return d(this, H)[0].map(([[, t]]) => t)[this.routeIndex].path;
  }
}, Ce = new WeakMap(), H = new WeakMap(), te = new WeakSet(), kr = function(t) {
  const e = d(this, H)[0][this.routeIndex][1][t], r = A(this, te, St).call(this, e);
  return r ? /\%/.test(r) ? Vt(r) : r : void 0;
}, wr = function() {
  const t = {}, e = Object.keys(d(this, H)[0][this.routeIndex][1]);
  for (const r of e) {
    const s = A(this, te, St).call(this, d(this, H)[0][this.routeIndex][1][r]);
    s && typeof s == "string" && (t[r] = /\%/.test(s) ? Vt(s) : s);
  }
  return t;
}, St = function(t) {
  return d(this, H)[1] ? d(this, H)[1][t] : t;
}, ie = new WeakMap(), ar), cs = {
  Stringify: 1
}, xr = async (t, e, r, s, n) => {
  typeof t == "object" && !(t instanceof String) && (t instanceof Promise || (t = t.toString()), t instanceof Promise && (t = await t));
  const a = t.callbacks;
  return a != null && a.length ? (n ? n[0] += t : n = [t], Promise.all(a.map((o) => o({ phase: e, buffer: n, context: s }))).then(
    (o) => Promise.all(
      o.filter(Boolean).map((c) => xr(c, e, !1, s, n))
    ).then(() => n[0])
  )) : Promise.resolve(t);
}, ls = "text/plain; charset=UTF-8", _t = (t, e) => ({
  "Content-Type": t,
  ...e
}), Ge, Ye, K, Ne, G, Z, Xe, Ie, Pe, ve, Qe, et, oe, Ee, ir, us = (ir = class {
  constructor(t, e) {
    x(this, oe);
    x(this, Ge);
    x(this, Ye);
    v(this, "env", {});
    x(this, K);
    v(this, "finalized", !1);
    v(this, "error");
    x(this, Ne);
    x(this, G);
    x(this, Z);
    x(this, Xe);
    x(this, Ie);
    x(this, Pe);
    x(this, ve);
    x(this, Qe);
    x(this, et);
    v(this, "render", (...t) => (d(this, Ie) ?? g(this, Ie, (e) => this.html(e)), d(this, Ie).call(this, ...t)));
    v(this, "setLayout", (t) => g(this, Xe, t));
    v(this, "getLayout", () => d(this, Xe));
    v(this, "setRenderer", (t) => {
      g(this, Ie, t);
    });
    v(this, "header", (t, e, r) => {
      this.finalized && g(this, Z, new Response(d(this, Z).body, d(this, Z)));
      const s = d(this, Z) ? d(this, Z).headers : d(this, ve) ?? g(this, ve, new Headers());
      e === void 0 ? s.delete(t) : r != null && r.append ? s.append(t, e) : s.set(t, e);
    });
    v(this, "status", (t) => {
      g(this, Ne, t);
    });
    v(this, "set", (t, e) => {
      d(this, K) ?? g(this, K, /* @__PURE__ */ new Map()), d(this, K).set(t, e);
    });
    v(this, "get", (t) => d(this, K) ? d(this, K).get(t) : void 0);
    v(this, "newResponse", (...t) => A(this, oe, Ee).call(this, ...t));
    v(this, "body", (t, e, r) => A(this, oe, Ee).call(this, t, e, r));
    v(this, "text", (t, e, r) => !d(this, ve) && !d(this, Ne) && !e && !r && !this.finalized ? new Response(t) : A(this, oe, Ee).call(this, t, e, _t(ls, r)));
    v(this, "json", (t, e, r) => A(this, oe, Ee).call(this, JSON.stringify(t), e, _t("application/json", r)));
    v(this, "html", (t, e, r) => {
      const s = (n) => A(this, oe, Ee).call(this, n, e, _t("text/html; charset=UTF-8", r));
      return typeof t == "object" ? xr(t, cs.Stringify, !1, {}).then(s) : s(t);
    });
    v(this, "redirect", (t, e) => {
      const r = String(t);
      return this.header(
        "Location",
        /[^\x00-\xFF]/.test(r) ? encodeURI(r) : r
      ), this.newResponse(null, e ?? 302);
    });
    v(this, "notFound", () => (d(this, Pe) ?? g(this, Pe, () => new Response()), d(this, Pe).call(this, this)));
    g(this, Ge, t), e && (g(this, G, e.executionCtx), this.env = e.env, g(this, Pe, e.notFoundHandler), g(this, et, e.path), g(this, Qe, e.matchResult));
  }
  get req() {
    return d(this, Ye) ?? g(this, Ye, new _r(d(this, Ge), d(this, et), d(this, Qe))), d(this, Ye);
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
      headers: d(this, ve) ?? g(this, ve, new Headers())
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
}, Ge = new WeakMap(), Ye = new WeakMap(), K = new WeakMap(), Ne = new WeakMap(), G = new WeakMap(), Z = new WeakMap(), Xe = new WeakMap(), Ie = new WeakMap(), Pe = new WeakMap(), ve = new WeakMap(), Qe = new WeakMap(), et = new WeakMap(), oe = new WeakSet(), Ee = function(t, e, r) {
  const s = d(this, Z) ? new Headers(d(this, Z).headers) : d(this, ve) ?? new Headers();
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
  const n = typeof e == "number" ? e : (e == null ? void 0 : e.status) ?? d(this, Ne);
  return new Response(t, { status: n, headers: s });
}, ir), C = "ALL", ds = "all", hs = ["get", "post", "put", "delete", "options", "patch"], br = "Can not add a route since the matcher is already built.", Sr = class extends Error {
}, fs = "__COMPOSED_HANDLER", ps = (t) => t.text("404 Not Found", 404), Ht = (t, e) => {
  if ("getResponse" in t) {
    const r = t.getResponse();
    return e.newResponse(r.body, r);
  }
  return console.error(t), e.text("Internal Server Error", 500);
}, z, N, Ar, B, ye, st, nt, or, Rr = (or = class {
  constructor(e = {}) {
    x(this, N);
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
    x(this, z, "/");
    v(this, "routes", []);
    x(this, B, ps);
    v(this, "errorHandler", Ht);
    v(this, "onError", (e) => (this.errorHandler = e, this));
    v(this, "notFound", (e) => (g(this, B, e), this));
    v(this, "fetch", (e, ...r) => A(this, N, nt).call(this, e, r[1], r[0], e.method));
    v(this, "request", (e, r, s, n) => e instanceof Request ? this.fetch(r ? new Request(e, r) : e, s, n) : (e = e.toString(), this.fetch(
      new Request(
        /^https?:\/\//.test(e) ? e : `http://localhost${Oe("/", e)}`,
        r
      ),
      s,
      n
    )));
    v(this, "fire", () => {
      addEventListener("fetch", (e) => {
        e.respondWith(A(this, N, nt).call(this, e.request, e, void 0, e.request.method));
      });
    });
    [...hs, ds].forEach((a) => {
      this[a] = (i, ...o) => (typeof i == "string" ? g(this, z, i) : A(this, N, ye).call(this, a, d(this, z), i), o.forEach((c) => {
        A(this, N, ye).call(this, a, d(this, z), c);
      }), this);
    }), this.on = (a, i, ...o) => {
      for (const c of [i].flat()) {
        g(this, z, c);
        for (const l of [a].flat())
          o.map((u) => {
            A(this, N, ye).call(this, l.toUpperCase(), d(this, z), u);
          });
      }
      return this;
    }, this.use = (a, ...i) => (typeof a == "string" ? g(this, z, a) : (g(this, z, "*"), i.unshift(a)), i.forEach((o) => {
      A(this, N, ye).call(this, C, d(this, z), o);
    }), this);
    const { strict: s, ...n } = e;
    Object.assign(this, n), this.getPath = s ?? !0 ? e.getPath ?? mr : as;
  }
  route(e, r) {
    const s = this.basePath(e);
    return r.routes.map((n) => {
      var i;
      let a;
      r.errorHandler === Ht ? a = n.handler : (a = async (o, c) => (await Dt([], r.errorHandler)(o, () => n.handler(o, c))).res, a[fs] = n.handler), A(i = s, N, ye).call(i, n.method, n.path, a);
    }), this;
  }
  basePath(e) {
    const r = A(this, N, Ar).call(this);
    return r._basePath = Oe(this._basePath, e), r;
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
      const c = Oe(this._basePath, e), l = c === "/" ? 0 : c.length;
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
    return A(this, N, ye).call(this, C, Oe(e, "*"), o), this;
  }
}, z = new WeakMap(), N = new WeakSet(), Ar = function() {
  const e = new Rr({
    router: this.router,
    getPath: this.getPath
  });
  return e.errorHandler = this.errorHandler, g(e, B, d(this, B)), e.routes = this.routes, e;
}, B = new WeakMap(), ye = function(e, r, s) {
  e = e.toUpperCase(), r = Oe(this._basePath, r);
  const n = { basePath: this._basePath, path: r, method: e, handler: s };
  this.router.add(e, r, [s, n]), this.routes.push(n);
}, st = function(e, r) {
  if (e instanceof Error)
    return this.errorHandler(e, r);
  throw e;
}, nt = function(e, r, s, n) {
  if (n === "HEAD")
    return (async () => new Response(null, await A(this, N, nt).call(this, e, r, s, "GET")))();
  const a = this.getPath(e, { env: s }), i = this.router.match(n, a), o = new us(e, {
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
      return A(this, N, st).call(this, u, o);
    }
    return l instanceof Promise ? l.then(
      (u) => u || (o.finalized ? o.res : d(this, B).call(this, o))
    ).catch((u) => A(this, N, st).call(this, u, o)) : l ?? d(this, B).call(this, o);
  }
  const c = Dt(i[0], this.errorHandler, d(this, B));
  return (async () => {
    try {
      const l = await c(o);
      if (!l.finalized)
        throw new Error(
          "Context is not finalized. Did you forget to return a Response object or `await next()`?"
        );
      return l.res;
    } catch (l) {
      return A(this, N, st).call(this, l, o);
    }
  })();
}, or), ot = "[^/]+", qe = ".*", We = "(?:|/.*)", Te = Symbol(), ms = new Set(".\\+*[^]$()");
function ys(t, e) {
  return t.length === 1 ? e.length === 1 ? t < e ? -1 : 1 : -1 : e.length === 1 || t === qe || t === We ? 1 : e === qe || e === We ? -1 : t === ot ? 1 : e === ot ? -1 : t.length === e.length ? t < e ? -1 : 1 : e.length - t.length;
}
var _e, ke, F, cr, Rt = (cr = class {
  constructor() {
    x(this, _e);
    x(this, ke);
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
    const [i, ...o] = e, c = i === "*" ? o.length === 0 ? ["", "", qe] : ["", "", ot] : i === "/*" ? ["", "", We] : i.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
    let l;
    if (c) {
      const u = c[1];
      let y = c[2] || ot;
      if (u && c[2] && (y === ".*" || (y = y.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:"), /\((?!\?:)/.test(y))))
        throw Te;
      if (l = d(this, F)[y], !l) {
        if (Object.keys(d(this, F)).some(
          (_) => _ !== qe && _ !== We
        ))
          throw Te;
        if (a)
          return;
        l = d(this, F)[y] = new Rt(), u !== "" && g(l, ke, n.varIndex++);
      }
      !a && u !== "" && s.push([u, d(l, ke)]);
    } else if (l = d(this, F)[i], !l) {
      if (Object.keys(d(this, F)).some(
        (u) => u.length > 1 && u !== qe && u !== We
      ))
        throw Te;
      if (a)
        return;
      l = d(this, F)[i] = new Rt();
    }
    l.insert(o, r, s, n, a);
  }
  buildRegExpStr() {
    const r = Object.keys(d(this, F)).sort(ys).map((s) => {
      const n = d(this, F)[s];
      return (typeof d(n, ke) == "number" ? `(${s})@${d(n, ke)}` : ms.has(s) ? `\\${s}` : s) + n.buildRegExpStr();
    });
    return typeof d(this, _e) == "number" && r.unshift(`#${d(this, _e)}`), r.length === 0 ? "" : r.length === 1 ? r[0] : "(?:" + r.join("|") + ")";
  }
}, _e = new WeakMap(), ke = new WeakMap(), F = new WeakMap(), cr), ft, tt, lr, gs = (lr = class {
  constructor() {
    x(this, ft, { varIndex: 0 });
    x(this, tt, new Rt());
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
    return d(this, tt).insert(a, e, s, d(this, ft), r), s;
  }
  buildRegExp() {
    let t = d(this, tt).buildRegExpStr();
    if (t === "")
      return [/^$/, [], []];
    let e = 0;
    const r = [], s = [];
    return t = t.replace(/#(\d+)|@(\d+)|\.\*\$/g, (n, a, i) => a !== void 0 ? (r[++e] = Number(a), "$()") : (i !== void 0 && (s[Number(i)] = ++e), "")), [new RegExp(`^${t}`), r, s];
  }
}, ft = new WeakMap(), tt = new WeakMap(), lr), Or = [], vs = [/^$/, [], /* @__PURE__ */ Object.create(null)], at = /* @__PURE__ */ Object.create(null);
function Er(t) {
  return at[t] ?? (at[t] = new RegExp(
    t === "*" ? "" : `^${t.replace(
      /\/\*$|([.\\+*[^\]$()])/g,
      (e, r) => r ? `\\${r}` : "(?:|/.*)"
    )}$`
  ));
}
function _s() {
  at = /* @__PURE__ */ Object.create(null);
}
function ks(t) {
  var l;
  const e = new gs(), r = [];
  if (t.length === 0)
    return vs;
  const s = t.map(
    (u) => [!/\*|\/:/.test(u[0]), ...u]
  ).sort(
    ([u, y], [_, E]) => u ? 1 : _ ? -1 : y.length - E.length
  ), n = /* @__PURE__ */ Object.create(null);
  for (let u = 0, y = -1, _ = s.length; u < _; u++) {
    const [E, j, O] = s[u];
    E ? n[j] = [O.map(([P]) => [P, /* @__PURE__ */ Object.create(null)]), Or] : y++;
    let I;
    try {
      I = e.insert(j, y, E);
    } catch (P) {
      throw P === Te ? new Sr(j) : P;
    }
    E || (r[y] = O.map(([P, W]) => {
      const re = /* @__PURE__ */ Object.create(null);
      for (W -= 1; W >= 0; W--) {
        const [L, mt] = I[W];
        re[L] = mt;
      }
      return [P, re];
    }));
  }
  const [a, i, o] = e.buildRegExp();
  for (let u = 0, y = r.length; u < y; u++)
    for (let _ = 0, E = r[u].length; _ < E; _++) {
      const j = (l = r[u][_]) == null ? void 0 : l[1];
      if (!j)
        continue;
      const O = Object.keys(j);
      for (let I = 0, P = O.length; I < P; I++)
        j[O[I]] = o[j[O[I]]];
    }
  const c = [];
  for (const u in i)
    c[u] = r[i[u]];
  return [a, c, n];
}
function Ae(t, e) {
  if (t) {
    for (const r of Object.keys(t).sort((s, n) => n.length - s.length))
      if (Er(r).test(e))
        return [...t[r]];
  }
}
var ce, le, Ue, Tr, jr, ur, ws = (ur = class {
  constructor() {
    x(this, Ue);
    v(this, "name", "RegExpRouter");
    x(this, ce);
    x(this, le);
    g(this, ce, { [C]: /* @__PURE__ */ Object.create(null) }), g(this, le, { [C]: /* @__PURE__ */ Object.create(null) });
  }
  add(t, e, r) {
    var o;
    const s = d(this, ce), n = d(this, le);
    if (!s || !n)
      throw new Error(br);
    s[t] || [s, n].forEach((c) => {
      c[t] = /* @__PURE__ */ Object.create(null), Object.keys(c[C]).forEach((l) => {
        c[t][l] = [...c[C][l]];
      });
    }), e === "/*" && (e = "*");
    const a = (e.match(/\/:/g) || []).length;
    if (/\*$/.test(e)) {
      const c = Er(e);
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
    const i = yr(e) || [e];
    for (let c = 0, l = i.length; c < l; c++) {
      const u = i[c];
      Object.keys(n).forEach((y) => {
        var _;
        (t === C || t === y) && ((_ = n[y])[u] || (_[u] = [
          ...Ae(s[y], u) || Ae(s[C], u) || []
        ]), n[y][u].push([r, a - l + c + 1]));
      });
    }
  }
  match(t, e) {
    _s();
    const r = A(this, Ue, Tr).call(this);
    return this.match = (s, n) => {
      const a = r[s] || r[C], i = a[2][n];
      if (i)
        return i;
      const o = n.match(a[0]);
      if (!o)
        return [[], Or];
      const c = o.indexOf("", 1);
      return [a[1][c], o];
    }, this.match(t, e);
  }
}, ce = new WeakMap(), le = new WeakMap(), Ue = new WeakSet(), Tr = function() {
  const t = /* @__PURE__ */ Object.create(null);
  return Object.keys(d(this, le)).concat(Object.keys(d(this, ce))).forEach((e) => {
    t[e] || (t[e] = A(this, Ue, jr).call(this, e));
  }), g(this, ce, g(this, le, void 0)), t;
}, jr = function(t) {
  const e = [];
  let r = t === C;
  return [d(this, ce), d(this, le)].forEach((s) => {
    const n = s[t] ? Object.keys(s[t]).map((a) => [a, s[t][a]]) : [];
    n.length !== 0 ? (r || (r = !0), e.push(...n)) : t !== C && e.push(
      ...Object.keys(s[C]).map((a) => [a, s[C][a]])
    );
  }), r ? ks(e) : null;
}, ur), ue, Y, dr, xs = (dr = class {
  constructor(t) {
    v(this, "name", "SmartRouter");
    x(this, ue, []);
    x(this, Y, []);
    g(this, ue, t.routers);
  }
  add(t, e, r) {
    if (!d(this, Y))
      throw new Error(br);
    d(this, Y).push([t, e, r]);
  }
  match(t, e) {
    if (!d(this, Y))
      throw new Error("Fatal error");
    const r = d(this, ue), s = d(this, Y), n = r.length;
    let a = 0, i;
    for (; a < n; a++) {
      const o = r[a];
      try {
        for (let c = 0, l = s.length; c < l; c++)
          o.add(...s[c]);
        i = o.match(t, e);
      } catch (c) {
        if (c instanceof Sr)
          continue;
        throw c;
      }
      this.match = o.match.bind(o), g(this, ue, [o]), g(this, Y, void 0);
      break;
    }
    if (a === n)
      throw new Error("Fatal error");
    return this.name = `SmartRouter + ${this.activeRouter.name}`, i;
  }
  get activeRouter() {
    if (d(this, Y) || d(this, ue).length !== 1)
      throw new Error("No active router has been determined yet.");
    return d(this, ue)[0];
  }
}, ue = new WeakMap(), Y = new WeakMap(), dr), Be = /* @__PURE__ */ Object.create(null), de, M, we, $e, $, X, ge, hr, Cr = (hr = class {
  constructor(t, e, r) {
    x(this, X);
    x(this, de);
    x(this, M);
    x(this, we);
    x(this, $e, 0);
    x(this, $, Be);
    if (g(this, M, r || /* @__PURE__ */ Object.create(null)), g(this, de, []), t && e) {
      const s = /* @__PURE__ */ Object.create(null);
      s[t] = { handler: e, possibleKeys: [], score: 0 }, g(this, de, [s]);
    }
    g(this, we, []);
  }
  insert(t, e, r) {
    g(this, $e, ++Lt(this, $e)._);
    let s = this;
    const n = es(e), a = [];
    for (let i = 0, o = n.length; i < o; i++) {
      const c = n[i], l = n[i + 1], u = ss(c, l), y = Array.isArray(u) ? u[0] : c;
      if (y in d(s, M)) {
        s = d(s, M)[y], u && a.push(u[1]);
        continue;
      }
      d(s, M)[y] = new Cr(), u && (d(s, we).push(u), a.push(u[1])), s = d(s, M)[y];
    }
    return d(s, de).push({
      [t]: {
        handler: r,
        possibleKeys: a.filter((i, o, c) => c.indexOf(i) === o),
        score: d(this, $e)
      }
    }), s;
  }
  search(t, e) {
    var o;
    const r = [];
    g(this, $, Be);
    let n = [this];
    const a = pr(e), i = [];
    for (let c = 0, l = a.length; c < l; c++) {
      const u = a[c], y = c === l - 1, _ = [];
      for (let E = 0, j = n.length; E < j; E++) {
        const O = n[E], I = d(O, M)[u];
        I && (g(I, $, d(O, $)), y ? (d(I, M)["*"] && r.push(
          ...A(this, X, ge).call(this, d(I, M)["*"], t, d(O, $))
        ), r.push(...A(this, X, ge).call(this, I, t, d(O, $)))) : _.push(I));
        for (let P = 0, W = d(O, we).length; P < W; P++) {
          const re = d(O, we)[P], L = d(O, $) === Be ? {} : { ...d(O, $) };
          if (re === "*") {
            const se = d(O, M)["*"];
            se && (r.push(...A(this, X, ge).call(this, se, t, d(O, $))), g(se, $, L), _.push(se));
            continue;
          }
          const [mt, Mt, ze] = re;
          if (!u && !(ze instanceof RegExp))
            continue;
          const J = d(O, M)[mt], Fr = a.slice(c).join("/");
          if (ze instanceof RegExp) {
            const se = ze.exec(Fr);
            if (se) {
              if (L[Mt] = se[0], r.push(...A(this, X, ge).call(this, J, t, d(O, $), L)), Object.keys(d(J, M)).length) {
                g(J, $, L);
                const yt = ((o = se[0].match(/\//)) == null ? void 0 : o.length) ?? 0;
                (i[yt] || (i[yt] = [])).push(J);
              }
              continue;
            }
          }
          (ze === !0 || ze.test(u)) && (L[Mt] = u, y ? (r.push(...A(this, X, ge).call(this, J, t, L, d(O, $))), d(J, M)["*"] && r.push(
            ...A(this, X, ge).call(this, d(J, M)["*"], t, L, d(O, $))
          )) : (g(J, $, L), _.push(J)));
        }
      }
      n = _.concat(i.shift() ?? []);
    }
    return r.length > 1 && r.sort((c, l) => c.score - l.score), [r.map(({ handler: c, params: l }) => [c, l])];
  }
}, de = new WeakMap(), M = new WeakMap(), we = new WeakMap(), $e = new WeakMap(), $ = new WeakMap(), X = new WeakSet(), ge = function(t, e, r, s) {
  const n = [];
  for (let a = 0, i = d(t, de).length; a < i; a++) {
    const o = d(t, de)[a], c = o[e] || o[C], l = {};
    if (c !== void 0 && (c.params = /* @__PURE__ */ Object.create(null), n.push(c), r !== Be || s && s !== Be))
      for (let u = 0, y = c.possibleKeys.length; u < y; u++) {
        const _ = c.possibleKeys[u], E = l[c.score];
        c.params[_] = s != null && s[_] && !E ? s[_] : r[_] ?? (s == null ? void 0 : s[_]), l[c.score] = !0;
      }
  }
  return n;
}, hr), xe, fr, bs = (fr = class {
  constructor() {
    v(this, "name", "TrieRouter");
    x(this, xe);
    g(this, xe, new Cr());
  }
  add(t, e, r) {
    const s = yr(e);
    if (s) {
      for (let n = 0, a = s.length; n < a; n++)
        d(this, xe).insert(t, s[n], r);
      return;
    }
    d(this, xe).insert(t, e, r);
  }
  match(t, e) {
    return d(this, xe).search(t, e);
  }
}, xe = new WeakMap(), fr), Ss = class extends Rr {
  constructor(t = {}) {
    super(t), this.router = t.router ?? new xs({
      routers: [new ws(), new bs()]
    });
  }
}, R;
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
})(R || (R = {}));
var Ut;
(function(t) {
  t.mergeShapes = (e, r) => ({
    ...e,
    ...r
    // second overwrites first
  });
})(Ut || (Ut = {}));
const p = R.arrayToEnum([
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
}, h = R.arrayToEnum([
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
    return JSON.stringify(this.issues, R.jsonStringifyReplacer, 2);
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
const At = (t, e) => {
  let r;
  switch (t.code) {
    case h.invalid_type:
      t.received === p.undefined ? r = "Required" : r = `Expected ${t.expected}, received ${t.received}`;
      break;
    case h.invalid_literal:
      r = `Invalid literal value, expected ${JSON.stringify(t.expected, R.jsonStringifyReplacer)}`;
      break;
    case h.unrecognized_keys:
      r = `Unrecognized key(s) in object: ${R.joinValues(t.keys, ", ")}`;
      break;
    case h.invalid_union:
      r = "Invalid input";
      break;
    case h.invalid_union_discriminator:
      r = `Invalid discriminator value. Expected ${R.joinValues(t.options)}`;
      break;
    case h.invalid_enum_value:
      r = `Invalid enum value. Expected ${R.joinValues(t.options)}, received '${t.received}'`;
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
      typeof t.validation == "object" ? "includes" in t.validation ? (r = `Invalid input: must include "${t.validation.includes}"`, typeof t.validation.position == "number" && (r = `${r} at one or more positions greater than or equal to ${t.validation.position}`)) : "startsWith" in t.validation ? r = `Invalid input: must start with "${t.validation.startsWith}"` : "endsWith" in t.validation ? r = `Invalid input: must end with "${t.validation.endsWith}"` : R.assertNever(t.validation) : t.validation !== "regex" ? r = `Invalid ${t.validation}` : r = "Invalid";
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
      r = e.defaultError, R.assertNever(t);
  }
  return { message: r };
};
let Rs = At;
function As() {
  return Rs;
}
const Os = (t) => {
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
  const r = As(), s = Os({
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
      r === At ? void 0 : At
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
}), Fe = (t) => ({ status: "dirty", value: t }), U = (t) => ({ status: "valid", value: t }), zt = (t) => t.status === "aborted", Bt = (t) => t.status === "dirty", Me = (t) => t.status === "valid", ct = (t) => typeof Promise < "u" && t instanceof Promise;
var m;
(function(t) {
  t.errToObj = (e) => typeof e == "string" ? { message: e } : e || {}, t.toString = (e) => typeof e == "string" ? e : e == null ? void 0 : e.message;
})(m || (m = {}));
class pe {
  constructor(e, r, s, n) {
    this._cachedPath = [], this.parent = e, this.data = r, this._path = s, this._key = n;
  }
  get path() {
    return this._cachedPath.length || (Array.isArray(this._key) ? this._cachedPath.push(...this._path, ...this._key) : this._cachedPath.push(...this._path, this._key)), this._cachedPath;
  }
}
const Ft = (t, e) => {
  if (Me(e))
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
    if (ct(r))
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
    return Ft(s, n);
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
        return Me(a) ? {
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
    return this._parseAsync({ data: e, path: [], parent: r }).then((a) => Me(a) ? {
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
    }, n = this._parse({ data: e, path: s.path, parent: s }), a = await (ct(n) ? n : Promise.resolve(n));
    return Ft(s, a);
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
    return new De({
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
    return he.create(this, this._def);
  }
  nullable() {
    return Ve.create(this, this._def);
  }
  nullish() {
    return this.nullable().optional();
  }
  array() {
    return q.create(this);
  }
  promise() {
    return ht.create(this, this._def);
  }
  or(e) {
    return ut.create([this, e], this._def);
  }
  and(e) {
    return dt.create(this, e, this._def);
  }
  transform(e) {
    return new De({
      ...b(this._def),
      schema: this,
      typeName: w.ZodEffects,
      effect: { type: "transform", transform: e }
    });
  }
  default(e) {
    const r = typeof e == "function" ? e : () => e;
    return new Tt({
      ...b(this._def),
      innerType: this,
      defaultValue: r,
      typeName: w.ZodDefault
    });
  }
  brand() {
    return new Gs({
      typeName: w.ZodBranded,
      type: this,
      ...b(this._def)
    });
  }
  catch(e) {
    const r = typeof e == "function" ? e : () => e;
    return new jt({
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
    return Pt.create(this, e);
  }
  readonly() {
    return Ct.create(this);
  }
  isOptional() {
    return this.safeParse(void 0).success;
  }
  isNullable() {
    return this.safeParse(null).success;
  }
}
const Es = /^c[^\s-]{8,}$/i, Ts = /^[0-9a-z]+$/, js = /^[0-9A-HJKMNP-TV-Z]{26}$/i, Cs = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i, Ns = /^[a-z0-9_-]{21}$/i, Is = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/, Ps = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/, $s = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i, Ms = "^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$";
let kt;
const Zs = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/, Ls = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/, Ds = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/, Vs = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/, Hs = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/, Us = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/, Nr = "((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))", zs = new RegExp(`^${Nr}$`);
function Ir(t) {
  let e = "[0-5]\\d";
  t.precision ? e = `${e}\\.\\d{${t.precision}}` : t.precision == null && (e = `${e}(\\.\\d+)?`);
  const r = t.precision ? "+" : "?";
  return `([01]\\d|2[0-3]):[0-5]\\d(:${e})${r}`;
}
function Bs(t) {
  return new RegExp(`^${Ir(t)}$`);
}
function Fs(t) {
  let e = `${Nr}T${Ir(t)}`;
  const r = [];
  return r.push(t.local ? "Z?" : "Z"), t.offset && r.push("([+-]\\d{2}:?\\d{2})"), e = `${e}(${r.join("|")})`, new RegExp(`^${e}$`);
}
function qs(t, e) {
  return !!((e === "v4" || !e) && Zs.test(t) || (e === "v6" || !e) && Ds.test(t));
}
function Ws(t, e) {
  if (!Is.test(t))
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
function Js(t, e) {
  return !!((e === "v4" || !e) && Ls.test(t) || (e === "v6" || !e) && Vs.test(t));
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
        $s.test(e.data) || (n = this._getOrReturnCtx(e, n), f(n, {
          validation: "email",
          code: h.invalid_string,
          message: a.message
        }), s.dirty());
      else if (a.kind === "emoji")
        kt || (kt = new RegExp(Ms, "u")), kt.test(e.data) || (n = this._getOrReturnCtx(e, n), f(n, {
          validation: "emoji",
          code: h.invalid_string,
          message: a.message
        }), s.dirty());
      else if (a.kind === "uuid")
        Cs.test(e.data) || (n = this._getOrReturnCtx(e, n), f(n, {
          validation: "uuid",
          code: h.invalid_string,
          message: a.message
        }), s.dirty());
      else if (a.kind === "nanoid")
        Ns.test(e.data) || (n = this._getOrReturnCtx(e, n), f(n, {
          validation: "nanoid",
          code: h.invalid_string,
          message: a.message
        }), s.dirty());
      else if (a.kind === "cuid")
        Es.test(e.data) || (n = this._getOrReturnCtx(e, n), f(n, {
          validation: "cuid",
          code: h.invalid_string,
          message: a.message
        }), s.dirty());
      else if (a.kind === "cuid2")
        Ts.test(e.data) || (n = this._getOrReturnCtx(e, n), f(n, {
          validation: "cuid2",
          code: h.invalid_string,
          message: a.message
        }), s.dirty());
      else if (a.kind === "ulid")
        js.test(e.data) || (n = this._getOrReturnCtx(e, n), f(n, {
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
      }), s.dirty()) : a.kind === "datetime" ? Fs(a).test(e.data) || (n = this._getOrReturnCtx(e, n), f(n, {
        code: h.invalid_string,
        validation: "datetime",
        message: a.message
      }), s.dirty()) : a.kind === "date" ? zs.test(e.data) || (n = this._getOrReturnCtx(e, n), f(n, {
        code: h.invalid_string,
        validation: "date",
        message: a.message
      }), s.dirty()) : a.kind === "time" ? Bs(a).test(e.data) || (n = this._getOrReturnCtx(e, n), f(n, {
        code: h.invalid_string,
        validation: "time",
        message: a.message
      }), s.dirty()) : a.kind === "duration" ? Ps.test(e.data) || (n = this._getOrReturnCtx(e, n), f(n, {
        validation: "duration",
        code: h.invalid_string,
        message: a.message
      }), s.dirty()) : a.kind === "ip" ? qs(e.data, a.version) || (n = this._getOrReturnCtx(e, n), f(n, {
        validation: "ip",
        code: h.invalid_string,
        message: a.message
      }), s.dirty()) : a.kind === "jwt" ? Ws(e.data, a.alg) || (n = this._getOrReturnCtx(e, n), f(n, {
        validation: "jwt",
        code: h.invalid_string,
        message: a.message
      }), s.dirty()) : a.kind === "cidr" ? Js(e.data, a.version) || (n = this._getOrReturnCtx(e, n), f(n, {
        validation: "cidr",
        code: h.invalid_string,
        message: a.message
      }), s.dirty()) : a.kind === "base64" ? Hs.test(e.data) || (n = this._getOrReturnCtx(e, n), f(n, {
        validation: "base64",
        code: h.invalid_string,
        message: a.message
      }), s.dirty()) : a.kind === "base64url" ? Us.test(e.data) || (n = this._getOrReturnCtx(e, n), f(n, {
        validation: "base64url",
        code: h.invalid_string,
        message: a.message
      }), s.dirty()) : R.assertNever(a);
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
function Ks(t, e) {
  const r = (t.toString().split(".")[1] || "").length, s = (e.toString().split(".")[1] || "").length, n = r > s ? r : s, a = Number.parseInt(t.toFixed(n).replace(".", "")), i = Number.parseInt(e.toFixed(n).replace(".", ""));
  return a % i / 10 ** n;
}
class be extends S {
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
      a.kind === "int" ? R.isInteger(e.data) || (s = this._getOrReturnCtx(e, s), f(s, {
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
      }), n.dirty()) : a.kind === "multipleOf" ? Ks(e.data, a.value) !== 0 && (s = this._getOrReturnCtx(e, s), f(s, {
        code: h.not_multiple_of,
        multipleOf: a.value,
        message: a.message
      }), n.dirty()) : a.kind === "finite" ? Number.isFinite(e.data) || (s = this._getOrReturnCtx(e, s), f(s, {
        code: h.not_finite,
        message: a.message
      }), n.dirty()) : R.assertNever(a);
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
    return !!this._def.checks.find((e) => e.kind === "int" || e.kind === "multipleOf" && R.isInteger(e.value));
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
be.create = (t) => new be({
  checks: [],
  typeName: w.ZodNumber,
  coerce: (t == null ? void 0 : t.coerce) || !1,
  ...b(t)
});
class Se extends S {
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
      }), n.dirty()) : R.assertNever(a);
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
    return new Se({
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
    return new Se({
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
Se.create = (t) => new Se({
  checks: [],
  typeName: w.ZodBigInt,
  coerce: (t == null ? void 0 : t.coerce) ?? !1,
  ...b(t)
});
class lt extends S {
  _parse(e) {
    if (this._def.coerce && (e.data = !!e.data), this._getType(e) !== p.boolean) {
      const s = this._getOrReturnCtx(e);
      return f(s, {
        code: h.invalid_type,
        expected: p.boolean,
        received: s.parsedType
      }), k;
    }
    return U(e.data);
  }
}
lt.create = (t) => new lt({
  typeName: w.ZodBoolean,
  coerce: (t == null ? void 0 : t.coerce) || !1,
  ...b(t)
});
class Ze extends S {
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
      }), s.dirty()) : R.assertNever(a);
    return {
      status: s.value,
      value: new Date(e.data.getTime())
    };
  }
  _addCheck(e) {
    return new Ze({
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
Ze.create = (t) => new Ze({
  checks: [],
  coerce: (t == null ? void 0 : t.coerce) || !1,
  typeName: w.ZodDate,
  ...b(t)
});
class qt extends S {
  _parse(e) {
    if (this._getType(e) !== p.symbol) {
      const s = this._getOrReturnCtx(e);
      return f(s, {
        code: h.invalid_type,
        expected: p.symbol,
        received: s.parsedType
      }), k;
    }
    return U(e.data);
  }
}
qt.create = (t) => new qt({
  typeName: w.ZodSymbol,
  ...b(t)
});
class Wt extends S {
  _parse(e) {
    if (this._getType(e) !== p.undefined) {
      const s = this._getOrReturnCtx(e);
      return f(s, {
        code: h.invalid_type,
        expected: p.undefined,
        received: s.parsedType
      }), k;
    }
    return U(e.data);
  }
}
Wt.create = (t) => new Wt({
  typeName: w.ZodUndefined,
  ...b(t)
});
class Jt extends S {
  _parse(e) {
    if (this._getType(e) !== p.null) {
      const s = this._getOrReturnCtx(e);
      return f(s, {
        code: h.invalid_type,
        expected: p.null,
        received: s.parsedType
      }), k;
    }
    return U(e.data);
  }
}
Jt.create = (t) => new Jt({
  typeName: w.ZodNull,
  ...b(t)
});
class Kt extends S {
  constructor() {
    super(...arguments), this._any = !0;
  }
  _parse(e) {
    return U(e.data);
  }
}
Kt.create = (t) => new Kt({
  typeName: w.ZodAny,
  ...b(t)
});
class Ot extends S {
  constructor() {
    super(...arguments), this._unknown = !0;
  }
  _parse(e) {
    return U(e.data);
  }
}
Ot.create = (t) => new Ot({
  typeName: w.ZodUnknown,
  ...b(t)
});
class me extends S {
  _parse(e) {
    const r = this._getOrReturnCtx(e);
    return f(r, {
      code: h.invalid_type,
      expected: p.never,
      received: r.parsedType
    }), k;
  }
}
me.create = (t) => new me({
  typeName: w.ZodNever,
  ...b(t)
});
class Gt extends S {
  _parse(e) {
    if (this._getType(e) !== p.undefined) {
      const s = this._getOrReturnCtx(e);
      return f(s, {
        code: h.invalid_type,
        expected: p.void,
        received: s.parsedType
      }), k;
    }
    return U(e.data);
  }
}
Gt.create = (t) => new Gt({
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
      return Promise.all([...r.data].map((i, o) => n.type._parseAsync(new pe(r, i, r.path, o)))).then((i) => D.mergeArray(s, i));
    const a = [...r.data].map((i, o) => n.type._parseSync(new pe(r, i, r.path, o)));
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
function je(t) {
  if (t instanceof T) {
    const e = {};
    for (const r in t.shape) {
      const s = t.shape[r];
      e[r] = he.create(je(s));
    }
    return new T({
      ...t._def,
      shape: () => e
    });
  } else return t instanceof q ? new q({
    ...t._def,
    type: je(t.element)
  }) : t instanceof he ? he.create(je(t.unwrap())) : t instanceof Ve ? Ve.create(je(t.unwrap())) : t instanceof Re ? Re.create(t.items.map((e) => je(e))) : t;
}
class T extends S {
  constructor() {
    super(...arguments), this._cached = null, this.nonstrict = this.passthrough, this.augment = this.extend;
  }
  _getCached() {
    if (this._cached !== null)
      return this._cached;
    const e = this._def.shape(), r = R.objectKeys(e);
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
    if (!(this._def.catchall instanceof me && this._def.unknownKeys === "strip"))
      for (const l in n.data)
        i.includes(l) || o.push(l);
    const c = [];
    for (const l of i) {
      const u = a[l], y = n.data[l];
      c.push({
        key: { status: "valid", value: l },
        value: u._parse(new pe(n, y, n.path, l)),
        alwaysSet: l in n.data
      });
    }
    if (this._def.catchall instanceof me) {
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
            new pe(n, y, n.path, u)
            //, ctx.child(key), value, getParsedType(value)
          ),
          alwaysSet: u in n.data
        });
      }
    }
    return n.common.async ? Promise.resolve().then(async () => {
      const l = [];
      for (const u of c) {
        const y = await u.key, _ = await u.value;
        l.push({
          key: y,
          value: _,
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
    for (const s of R.objectKeys(e))
      e[s] && this.shape[s] && (r[s] = this.shape[s]);
    return new T({
      ...this._def,
      shape: () => r
    });
  }
  omit(e) {
    const r = {};
    for (const s of R.objectKeys(this.shape))
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
    return je(this);
  }
  partial(e) {
    const r = {};
    for (const s of R.objectKeys(this.shape)) {
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
    for (const s of R.objectKeys(this.shape))
      if (e && !e[s])
        r[s] = this.shape[s];
      else {
        let a = this.shape[s];
        for (; a instanceof he; )
          a = a._def.innerType;
        r[s] = a;
      }
    return new T({
      ...this._def,
      shape: () => r
    });
  }
  keyof() {
    return Pr(R.objectKeys(this.shape));
  }
}
T.create = (t, e) => new T({
  shape: () => t,
  unknownKeys: "strip",
  catchall: me.create(),
  typeName: w.ZodObject,
  ...b(e)
});
T.strictCreate = (t, e) => new T({
  shape: () => t,
  unknownKeys: "strict",
  catchall: me.create(),
  typeName: w.ZodObject,
  ...b(e)
});
T.lazycreate = (t, e) => new T({
  shape: t,
  unknownKeys: "strip",
  catchall: me.create(),
  typeName: w.ZodObject,
  ...b(e)
});
class ut extends S {
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
ut.create = (t, e) => new ut({
  options: t,
  typeName: w.ZodUnion,
  ...b(e)
});
function Et(t, e) {
  const r = ne(t), s = ne(e);
  if (t === e)
    return { valid: !0, data: t };
  if (r === p.object && s === p.object) {
    const n = R.objectKeys(e), a = R.objectKeys(t).filter((o) => n.indexOf(o) !== -1), i = { ...t, ...e };
    for (const o of a) {
      const c = Et(t[o], e[o]);
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
      const i = t[a], o = e[a], c = Et(i, o);
      if (!c.valid)
        return { valid: !1 };
      n.push(c.data);
    }
    return { valid: !0, data: n };
  } else return r === p.date && s === p.date && +t == +e ? { valid: !0, data: t } : { valid: !1 };
}
class dt extends S {
  _parse(e) {
    const { status: r, ctx: s } = this._processInputParams(e), n = (a, i) => {
      if (zt(a) || zt(i))
        return k;
      const o = Et(a.value, i.value);
      return o.valid ? ((Bt(a) || Bt(i)) && r.dirty(), { status: r.value, value: o.data }) : (f(s, {
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
dt.create = (t, e, r) => new dt({
  left: t,
  right: e,
  typeName: w.ZodIntersection,
  ...b(r)
});
class Re extends S {
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
      return c ? c._parse(new pe(s, i, s.path, o)) : null;
    }).filter((i) => !!i);
    return s.common.async ? Promise.all(a).then((i) => D.mergeArray(r, i)) : D.mergeArray(r, a);
  }
  get items() {
    return this._def.items;
  }
  rest(e) {
    return new Re({
      ...this._def,
      rest: e
    });
  }
}
Re.create = (t, e) => {
  if (!Array.isArray(t))
    throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
  return new Re({
    items: t,
    typeName: w.ZodTuple,
    rest: null,
    ...b(e)
  });
};
class Yt extends S {
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
      key: n._parse(new pe(s, o, s.path, [l, "key"])),
      value: a._parse(new pe(s, c, s.path, [l, "value"]))
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
Yt.create = (t, e, r) => new Yt({
  valueType: e,
  keyType: t,
  typeName: w.ZodMap,
  ...b(r)
});
class Je extends S {
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
    const o = [...s.data.values()].map((c, l) => a._parse(new pe(s, c, s.path, l)));
    return s.common.async ? Promise.all(o).then((c) => i(c)) : i(o);
  }
  min(e, r) {
    return new Je({
      ...this._def,
      minSize: { value: e, message: m.toString(r) }
    });
  }
  max(e, r) {
    return new Je({
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
Je.create = (t, e) => new Je({
  valueType: t,
  minSize: null,
  maxSize: null,
  typeName: w.ZodSet,
  ...b(e)
});
class Xt extends S {
  get schema() {
    return this._def.getter();
  }
  _parse(e) {
    const { ctx: r } = this._processInputParams(e);
    return this._def.getter()._parse({ data: r.data, path: r.path, parent: r });
  }
}
Xt.create = (t, e) => new Xt({
  getter: t,
  typeName: w.ZodLazy,
  ...b(e)
});
class Qt extends S {
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
Qt.create = (t, e) => new Qt({
  value: t,
  typeName: w.ZodLiteral,
  ...b(e)
});
function Pr(t, e) {
  return new Le({
    values: t,
    typeName: w.ZodEnum,
    ...b(e)
  });
}
class Le extends S {
  _parse(e) {
    if (typeof e.data != "string") {
      const r = this._getOrReturnCtx(e), s = this._def.values;
      return f(r, {
        expected: R.joinValues(s),
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
    return U(e.data);
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
    return Le.create(e, {
      ...this._def,
      ...r
    });
  }
  exclude(e, r = this._def) {
    return Le.create(this.options.filter((s) => !e.includes(s)), {
      ...this._def,
      ...r
    });
  }
}
Le.create = Pr;
class er extends S {
  _parse(e) {
    const r = R.getValidEnumValues(this._def.values), s = this._getOrReturnCtx(e);
    if (s.parsedType !== p.string && s.parsedType !== p.number) {
      const n = R.objectValues(r);
      return f(s, {
        expected: R.joinValues(n),
        received: s.parsedType,
        code: h.invalid_type
      }), k;
    }
    if (this._cache || (this._cache = new Set(R.getValidEnumValues(this._def.values))), !this._cache.has(e.data)) {
      const n = R.objectValues(r);
      return f(s, {
        received: s.data,
        code: h.invalid_enum_value,
        options: n
      }), k;
    }
    return U(e.data);
  }
  get enum() {
    return this._def.values;
  }
}
er.create = (t, e) => new er({
  values: t,
  typeName: w.ZodNativeEnum,
  ...b(e)
});
class ht extends S {
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
    return U(s.then((n) => this._def.type.parseAsync(n, {
      path: r.path,
      errorMap: r.common.contextualErrorMap
    })));
  }
}
ht.create = (t, e) => new ht({
  type: t,
  typeName: w.ZodPromise,
  ...b(e)
});
class De extends S {
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
          return c.status === "aborted" ? k : c.status === "dirty" || r.value === "dirty" ? Fe(c.value) : c;
        });
      {
        if (r.value === "aborted")
          return k;
        const o = this._def.schema._parseSync({
          data: i,
          path: s.path,
          parent: s
        });
        return o.status === "aborted" ? k : o.status === "dirty" || r.value === "dirty" ? Fe(o.value) : o;
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
        if (!Me(i))
          return k;
        const o = n.transform(i.value, a);
        if (o instanceof Promise)
          throw new Error("Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.");
        return { status: r.value, value: o };
      } else
        return this._def.schema._parseAsync({ data: s.data, path: s.path, parent: s }).then((i) => Me(i) ? Promise.resolve(n.transform(i.value, a)).then((o) => ({
          status: r.value,
          value: o
        })) : k);
    R.assertNever(n);
  }
}
De.create = (t, e, r) => new De({
  schema: t,
  typeName: w.ZodEffects,
  effect: e,
  ...b(r)
});
De.createWithPreprocess = (t, e, r) => new De({
  schema: e,
  effect: { type: "preprocess", transform: t },
  typeName: w.ZodEffects,
  ...b(r)
});
class he extends S {
  _parse(e) {
    return this._getType(e) === p.undefined ? U(void 0) : this._def.innerType._parse(e);
  }
  unwrap() {
    return this._def.innerType;
  }
}
he.create = (t, e) => new he({
  innerType: t,
  typeName: w.ZodOptional,
  ...b(e)
});
class Ve extends S {
  _parse(e) {
    return this._getType(e) === p.null ? U(null) : this._def.innerType._parse(e);
  }
  unwrap() {
    return this._def.innerType;
  }
}
Ve.create = (t, e) => new Ve({
  innerType: t,
  typeName: w.ZodNullable,
  ...b(e)
});
class Tt extends S {
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
Tt.create = (t, e) => new Tt({
  innerType: t,
  typeName: w.ZodDefault,
  defaultValue: typeof e.default == "function" ? e.default : () => e.default,
  ...b(e)
});
class jt extends S {
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
    return ct(n) ? n.then((a) => ({
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
jt.create = (t, e) => new jt({
  innerType: t,
  typeName: w.ZodCatch,
  catchValue: typeof e.catch == "function" ? e.catch : () => e.catch,
  ...b(e)
});
class tr extends S {
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
tr.create = (t) => new tr({
  typeName: w.ZodNaN,
  ...b(t)
});
class Gs extends S {
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
class Pt extends S {
  _parse(e) {
    const { status: r, ctx: s } = this._processInputParams(e);
    if (s.common.async)
      return (async () => {
        const a = await this._def.in._parseAsync({
          data: s.data,
          path: s.path,
          parent: s
        });
        return a.status === "aborted" ? k : a.status === "dirty" ? (r.dirty(), Fe(a.value)) : this._def.out._parseAsync({
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
    return new Pt({
      in: e,
      out: r,
      typeName: w.ZodPipeline
    });
  }
}
class Ct extends S {
  _parse(e) {
    const r = this._def.innerType._parse(e), s = (n) => (Me(n) && (n.value = Object.freeze(n.value)), n);
    return ct(r) ? r.then((n) => s(n)) : s(r);
  }
  unwrap() {
    return this._def.innerType;
  }
}
Ct.create = (t, e) => new Ct({
  innerType: t,
  typeName: w.ZodReadonly,
  ...b(e)
});
var w;
(function(t) {
  t.ZodString = "ZodString", t.ZodNumber = "ZodNumber", t.ZodNaN = "ZodNaN", t.ZodBigInt = "ZodBigInt", t.ZodBoolean = "ZodBoolean", t.ZodDate = "ZodDate", t.ZodSymbol = "ZodSymbol", t.ZodUndefined = "ZodUndefined", t.ZodNull = "ZodNull", t.ZodAny = "ZodAny", t.ZodUnknown = "ZodUnknown", t.ZodNever = "ZodNever", t.ZodVoid = "ZodVoid", t.ZodArray = "ZodArray", t.ZodObject = "ZodObject", t.ZodUnion = "ZodUnion", t.ZodDiscriminatedUnion = "ZodDiscriminatedUnion", t.ZodIntersection = "ZodIntersection", t.ZodTuple = "ZodTuple", t.ZodRecord = "ZodRecord", t.ZodMap = "ZodMap", t.ZodSet = "ZodSet", t.ZodFunction = "ZodFunction", t.ZodLazy = "ZodLazy", t.ZodLiteral = "ZodLiteral", t.ZodEnum = "ZodEnum", t.ZodEffects = "ZodEffects", t.ZodNativeEnum = "ZodNativeEnum", t.ZodOptional = "ZodOptional", t.ZodNullable = "ZodNullable", t.ZodDefault = "ZodDefault", t.ZodCatch = "ZodCatch", t.ZodPromise = "ZodPromise", t.ZodBranded = "ZodBranded", t.ZodPipeline = "ZodPipeline", t.ZodReadonly = "ZodReadonly";
})(w || (w = {}));
const fe = Q.create, Nt = be.create;
Se.create;
const Ys = lt.create;
Ze.create;
const Xs = Ot.create;
me.create;
q.create;
const He = T.create;
ut.create;
dt.create;
Re.create;
const Ke = Le.create;
ht.create;
he.create;
Ve.create;
const $r = {
  string: ((t) => Q.create({ ...t, coerce: !0 })),
  number: ((t) => be.create({ ...t, coerce: !0 })),
  boolean: ((t) => lt.create({
    ...t,
    coerce: !0
  })),
  bigint: ((t) => Se.create({ ...t, coerce: !0 })),
  date: ((t) => Ze.create({ ...t, coerce: !0 }))
};
He({
  type: Ke([
    "connection_established",
    "live_health_update",
    "historical_data_update",
    "emergency_alert",
    "error",
    "pong"
  ]),
  data: Xs().optional(),
  timestamp: fe().datetime().optional()
});
const Mr = He({
  type: Ke(["heart_rate", "walking_steadiness", "steps", "oxygen_saturation"]).describe("metric identifier"),
  value: Nt().describe("numeric value for the metric"),
  unit: fe().optional()
}), Zr = He({
  type: Mr.shape.type,
  value: Nt(),
  processedAt: fe().datetime(),
  validated: Ys(),
  healthScore: Nt().optional(),
  fallRisk: Ke(["low", "moderate", "high", "critical"]).optional(),
  alert: He({
    level: Ke(["warning", "critical"]),
    message: fe()
  }).nullable().optional()
}), pt = {
  info: (t, e) => console.log(t, wt(e)),
  warn: (t, e) => console.warn(t, wt(e)),
  error: (t, e) => console.error(t, wt(e))
};
function wt(t) {
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
function Qs(t, e) {
  const r = new Headers(t.headers);
  return r.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload"
  ), r.set("X-Content-Type-Options", "nosniff"), r.set("X-Frame-Options", "DENY"), r.set("Referrer-Policy", "no-referrer"), r.set("Permissions-Policy", "geolocation=(), microphone=(), camera=()"), r.set("Content-Security-Policy", e), new Response(t.body, { status: t.status, headers: r });
}
function rr(t, e) {
  const r = new Headers(), s = t && e.includes(t) ? t : "";
  return s && (r.set("Access-Control-Allow-Origin", s), r.set("Vary", "Origin"), r.set("Access-Control-Allow-Credentials", "true"), r.set("Access-Control-Allow-Headers", "authorization, content-type"), r.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS")), r;
}
async function Lr(t, e = {}) {
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
const sr = /* @__PURE__ */ new Map();
async function en(t, e) {
  const r = t, s = Date.now(), n = sr.get(r);
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
    return sr.set(r, {
      fetchedAt: s,
      ttlMs: 300 * 1e3,
      keys: o
    }), o[e] || null;
  } catch {
    return null;
  }
}
async function Dr(t, e) {
  try {
    const [r, s, n] = t.split(".");
    if (!r || !s || !n) return { ok: !1 };
    const a = JSON.parse(new TextDecoder().decode(it(r)));
    if (a.alg !== "RS256" || !a.kid) return { ok: !1 };
    const i = await en(e.jwksUrl, a.kid);
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
    const _ = JSON.parse(
      new TextDecoder().decode(it(s))
    ), E = Math.floor(Date.now() / 1e3), j = e.clockSkewSec ?? 60;
    return typeof _.exp == "number" && E > _.exp + j ? { ok: !1 } : typeof _.nbf == "number" && E + j < _.nbf ? { ok: !1 } : e.iss && _.iss !== e.iss ? { ok: !1 } : e.aud && _.aud !== e.aud ? { ok: !1 } : {
      ok: !0,
      sub: _.sub,
      claims: _
    };
  } catch {
    return { ok: !1 };
  }
}
function tn(t) {
  try {
    const e = t.split(".");
    return e.length < 2 ? null : JSON.parse(
      new TextDecoder().decode(it(e[1]))
    );
  } catch {
    return null;
  }
}
async function rn(t, e) {
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
    pt.warn("audit_write_failed", { error: r.message });
  }
}
async function $t(t) {
  const e = Uint8Array.from(atob(t), (r) => r.charCodeAt(0));
  if (e.byteLength !== 32)
    throw new Error("ENC_KEY must be 32 bytes (base64)");
  return crypto.subtle.importKey("raw", e, { name: "AES-GCM" }, !1, [
    "encrypt",
    "decrypt"
  ]);
}
async function Vr(t, e) {
  const r = crypto.getRandomValues(new Uint8Array(12)), s = new TextEncoder().encode(JSON.stringify(e)), n = await crypto.subtle.encrypt({ name: "AES-GCM", iv: r }, t, s), a = new Uint8Array(r.byteLength + n.byteLength);
  return a.set(r, 0), a.set(new Uint8Array(n), r.byteLength), btoa(String.fromCharCode(...a));
}
async function sn(t, e) {
  const r = Uint8Array.from(atob(e), (i) => i.charCodeAt(0)), s = r.slice(0, 12), n = r.slice(12), a = await crypto.subtle.decrypt({ name: "AES-GCM", iv: s }, t, n);
  return JSON.parse(new TextDecoder().decode(a));
}
function xt(t) {
  return btoa(String.fromCharCode(...t)).replace(/=+$/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
async function nn(t, e, r = {}) {
  const s = new TextEncoder(), n = { alg: "HS256", typ: "JWT", ...r }, a = xt(s.encode(JSON.stringify(n))), i = xt(s.encode(JSON.stringify(t))), o = `${a}.${i}`, c = await crypto.subtle.importKey(
    "raw",
    s.encode(e),
    { name: "HMAC", hash: "SHA-256" },
    !1,
    ["sign"]
  ), l = await crypto.subtle.sign("HMAC", c, s.encode(o)), u = xt(new Uint8Array(l));
  return `${o}.${u}`;
}
const ae = 1440 * 60, an = {
  heart_rate: 30 * ae,
  steps: 30 * ae,
  walking_steadiness: 180 * ae,
  sleep: 90 * ae,
  activity: 90 * ae,
  fall_event: 365 * ae
};
function Hr(t, e) {
  const r = an[t] ?? 30 * ae;
  return e && e !== "production" ? Math.min(r, 2 * ae) : r;
}
async function Ur(t, e, r) {
  const s = Math.max(1, Math.min(2e3, (r == null ? void 0 : r.limit) ?? 1e3)), n = (r == null ? void 0 : r.prefix) ?? "health:", a = await e.list({ prefix: n, limit: s }), i = Date.now();
  let o = 0, c = 0;
  for (const l of a.keys) {
    o += 1;
    const u = l.name.split(":");
    if (u.length < 3) continue;
    const y = u[1], _ = u.slice(2).join(":"), E = Hr(y, t.ENVIRONMENT), j = Date.parse(_);
    if (!Number.isFinite(j)) continue;
    const O = j + E * 1e3;
    if (i > O)
      try {
        await e.delete(l.name), c += 1;
      } catch {
      }
  }
  return { scanned: o, deleted: c };
}
const V = new Ss(), bt = /* @__PURE__ */ new Map();
function nr(t, e = 60, r = 6e4) {
  const s = Date.now(), n = bt.get(t) || { tokens: e, last: s }, a = s - n.last, i = Math.floor(a / r) * e;
  return n.tokens = Math.min(e, n.tokens + i), n.last = s, n.tokens <= 0 ? (bt.set(t, n), !1) : (n.tokens -= 1, bt.set(t, n), !0);
}
async function on(t, e, r = 60, s = 6e4) {
  try {
    if (!t.env.RATE_LIMITER) return nr(e, r, s);
    const n = t.env.RATE_LIMITER.idFromName(e), a = t.env.RATE_LIMITER.get(n), i = new URL("https://do.local/consume");
    i.searchParams.set("key", e), i.searchParams.set("limit", String(r)), i.searchParams.set("intervalMs", String(s));
    const o = await a.fetch(new Request(i.toString()));
    return o.ok ? !!(await o.json().catch(() => ({ ok: !1 }))).ok : !1;
  } catch {
    return nr(e, r, s);
  }
}
function zr(t) {
  var n;
  const e = t.req.header("Authorization") || "", r = e.startsWith("Bearer ") ? e.slice(7) : "";
  return (r ? (n = tn(r)) == null ? void 0 : n.sub : void 0) || t.req.header("CF-Connecting-IP") || "anon";
}
async function Br(t) {
  if (t.env.ENVIRONMENT !== "production") return !0;
  const e = t.req.header("Authorization") || "", r = e.startsWith("Bearer ") ? e.slice(7) : "";
  if (!r) return !1;
  const s = t.env.API_JWKS_URL;
  return s ? (await Dr(r, {
    iss: t.env.API_ISS,
    aud: t.env.API_AUD,
    jwksUrl: s
  })).ok : (await Lr(r, {
    iss: t.env.API_ISS,
    aud: t.env.API_AUD
  })).ok;
}
V.use("*", async (t, e) => {
  const r = t.req.header("Origin") || null, s = (t.env.ALLOWED_ORIGINS || "").split(",").map((c) => c.trim()).filter(Boolean), n = crypto.randomUUID();
  if (t.res = t.newResponse(null), t.req.method === "OPTIONS") {
    const c = rr(r, s);
    return c.set("X-Correlation-Id", n), t.newResponse(null, { status: 204, headers: c });
  }
  await e();
  const a = [
    "default-src 'self'",
    "img-src 'self' data:",
    "style-src 'self' 'unsafe-inline'",
    // Tailwind inlined
    "script-src 'self'",
    "connect-src 'self' https: wss:",
    "frame-ancestors 'none'"
  ].join("; "), i = Qs(t.res, a), o = rr(r, s);
  return i.headers.set("X-Correlation-Id", n), o.forEach((c, l) => i.headers.set(l, c)), i;
});
V.use("/api/*", async (t, e) => {
  const r = zr(t);
  return await on(t, r) ? await Br(t) ? e() : t.json({ error: "unauthorized" }, 401) : t.json({ error: "rate_limited" }, 429);
});
V.use("/*", async (t, e) => {
  var s;
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
      const s = await $t(r), n = { hello: "world", at: Date.now() }, a = await Vr(s, n);
      e.aes_gcm = { ok: !0, ciphertextLength: a.length };
    } else
      e.aes_gcm = { ok: !1, reason: "no_key" };
  } catch (r) {
    e.aes_gcm = { ok: !1, error: r.message };
  }
  try {
    const r = "eyJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJiYSIsImF1ZCI6ImF1ZCIsImV4cCI6MX0.signature", s = t.env.API_JWKS_URL;
    if (s) {
      const n = await Dr(r, {
        iss: "ba",
        aud: "aud",
        jwksUrl: s
      });
      e.jwt_jwks_negative = { ok: !n.ok };
    } else
      e.jwt_claims_negative = {
        ok: !(await Lr(r)).ok
      };
  } catch (r) {
    e.jwt_error = { ok: !1, error: r.message };
  }
  return t.json({ ok: !0, results: e });
});
V.get("/api/_ratelimit", async (t) => {
  if (t.env.ENVIRONMENT === "production")
    return t.json({ error: "not_available" }, 404);
  const e = new URL(t.req.url).searchParams.get("key") || zr(t);
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
  if (!await Br(t)) return t.json({ error: "unauthorized" }, 401);
  const e = t.env.DEVICE_JWT_SECRET;
  if (!e) return t.json({ error: "not_configured" }, 500);
  const r = He({
    userId: fe().min(1),
    clientType: Ke(["ios_app", "web_dashboard"]).default("ios_app"),
    ttlSec: $r.number().min(60).max(3600).optional()
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
    const o = await nn(
      i,
      e
    );
    return t.json({ ok: !0, token: o, expiresIn: a });
  } catch (o) {
    return pt.error("device_token_sign_failed", { error: o.message }), t.json({ error: "server_error" }, 500);
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
  const a = await Ur(t.env, n, { limit: r, prefix: s });
  return t.json({ ok: !0, ...a });
});
V.get("/api/health-data", async (t) => {
  const e = He({
    from: fe().datetime().optional(),
    to: fe().datetime().optional(),
    metric: Mr.shape.type.optional(),
    limit: $r.number().min(1).max(500).optional(),
    cursor: fe().optional()
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
    const _ = await u.list({ prefix: y, limit: l, cursor: c }), E = t.env.ENC_KEY, j = E ? await $t(E) : null, O = [];
    for (const I of _.keys) {
      const P = await u.get(I.name);
      if (!P) continue;
      const W = j ? await (async () => {
        try {
          return await sn(j, P);
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
      const re = Zr.safeParse(W);
      if (!re.success) continue;
      const L = re.data;
      if (!(a && new Date(L.processedAt).getTime() < new Date(a).getTime()) && !(i && new Date(L.processedAt).getTime() > new Date(i).getTime()) && (O.push(L), O.length >= l))
        break;
    }
    return O.sort((I, P) => I.processedAt < P.processedAt ? 1 : -1), t.json({
      ok: !0,
      data: O,
      nextCursor: _.list_complete ? void 0 : _.cursor,
      hasMore: _.list_complete === !1
    });
  } catch (_) {
    return pt.error("KV read failed", { error: _.message }), t.json({ error: "server_error" }, 500);
  }
});
V.post("/api/health-data", async (t) => {
  let e;
  try {
    e = await t.req.json();
  } catch {
    return t.json({ error: "invalid_json" }, 400);
  }
  const r = Zr.safeParse(e);
  if (!r.success)
    return t.json(
      { error: "validation_error", details: r.error.flatten() },
      400
    );
  try {
    const s = t.env.HEALTH_KV;
    if (s) {
      const a = `health:${r.data.type}:${r.data.processedAt}`, i = t.env.ENC_KEY ? await $t(t.env.ENC_KEY) : null, o = i ? await Vr(i, r.data) : JSON.stringify(r.data), c = Hr(r.data.type, t.env.ENVIRONMENT);
      await s.put(a, o, { expirationTtl: c });
    }
    const n = t.res.headers.get("X-Correlation-Id") || "";
    await rn(t.env, {
      type: "health_data_created",
      actor: "api",
      resource: "kv:health",
      meta: { type: r.data.type, correlationId: n }
    });
  } catch (s) {
    return pt.error("KV write failed", { error: s.message }), t.json({ error: "server_error" }, 500);
  }
  return t.json({ ok: !0, data: r.data }, 201);
});
V.get("*", async (t) => {
  const e = new URL("/index.html", t.req.url);
  return t.env.ASSETS ? t.env.ASSETS.fetch(new Request(e.toString(), t.req.raw)) : t.text("Not Found", 404);
});
async function hn(t, e, r) {
  const s = e.HEALTH_KV;
  s && r.waitUntil(Ur(e, s));
}
class fn {
  constructor(e) {
    v(this, "storage");
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
export {
  fn as RateLimiter,
  V as default,
  hn as scheduled
};
//# sourceMappingURL=index.js.map

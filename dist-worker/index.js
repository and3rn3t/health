var Vr = Object.defineProperty;
var Pt = (t) => {
  throw TypeError(t);
};
var Ur = (t, e, r) => e in t ? Vr(t, e, { enumerable: !0, configurable: !0, writable: !0, value: r }) : t[e] = r;
var g = (t, e, r) => Ur(t, typeof e != "symbol" ? e + "" : e, r), mt = (t, e, r) => e.has(t) || Pt("Cannot " + r);
var d = (t, e, r) => (mt(t, e, "read from private field"), r ? r.call(t) : e.get(t)), x = (t, e, r) => e.has(t) ? Pt("Cannot add the same private member more than once") : e instanceof WeakSet ? e.add(t) : e.set(t, r), y = (t, e, r, s) => (mt(t, e, "write to private field"), s ? s.call(t, r) : e.set(t, r), r), O = (t, e, r) => (mt(t, e, "access private method"), r);
var $t = (t, e, r, s) => ({
  set _(n) {
    y(t, e, n, r);
  },
  get _() {
    return d(t, e, s);
  }
});
var Zt = (t, e, r) => (s, n) => {
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
      } catch (v) {
        if (v instanceof Error && e)
          s.error = v, c = await e(v, s), l = !0;
        else
          throw v;
      }
    else
      s.finalized === !1 && r && (c = await r(s));
    return c && (s.finalized === !1 || l) && (s.res = c), s;
  }
}, Hr = Symbol(), zr = async (t, e = /* @__PURE__ */ Object.create(null)) => {
  const { all: r = !1, dot: s = !1 } = e, a = (t instanceof yr ? t.raw.headers : t.headers).get("Content-Type");
  return a != null && a.startsWith("multipart/form-data") || a != null && a.startsWith("application/x-www-form-urlencoded") ? Fr(t, { all: r, dot: s }) : {};
};
async function Fr(t, e) {
  const r = await t.formData();
  return r ? Br(r, e) : {};
}
function Br(t, e) {
  const r = /* @__PURE__ */ Object.create(null);
  return t.forEach((s, n) => {
    e.all || n.endsWith("[]") ? qr(r, n, s) : r[n] = s;
  }), e.dot && Object.entries(r).forEach(([s, n]) => {
    s.includes(".") && (Wr(r, s, n), delete r[s]);
  }), r;
}
var qr = (t, e, r) => {
  t[e] !== void 0 ? Array.isArray(t[e]) ? t[e].push(r) : t[e] = [t[e], r] : e.endsWith("[]") ? t[e] = [r] : t[e] = r;
}, Wr = (t, e, r) => {
  let s = t;
  const n = e.split(".");
  n.forEach((a, i) => {
    i === n.length - 1 ? s[a] = r : ((!s[a] || typeof s[a] != "object" || Array.isArray(s[a]) || s[a] instanceof File) && (s[a] = /* @__PURE__ */ Object.create(null)), s = s[a]);
  });
}, ur = (t) => {
  const e = t.split("/");
  return e[0] === "" && e.shift(), e;
}, Jr = (t) => {
  const { groups: e, path: r } = Kr(t), s = ur(r);
  return Gr(s, e);
}, Kr = (t) => {
  const e = [];
  return t = t.replace(/\{[^}]+\}/g, (r, s) => {
    const n = `@${s}`;
    return e.push([n, r]), n;
  }), { groups: e, path: t };
}, Gr = (t, e) => {
  for (let r = e.length - 1; r >= 0; r--) {
    const [s] = e[r];
    for (let n = t.length - 1; n >= 0; n--)
      if (t[n].includes(s)) {
        t[n] = t[n].replace(s, e[r][1]);
        break;
      }
  }
  return t;
}, et = {}, Yr = (t, e) => {
  if (t === "*")
    return "*";
  const r = t.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (r) {
    const s = `${t}#${e}`;
    return et[s] || (r[2] ? et[s] = e && e[0] !== ":" && e[0] !== "*" ? [s, r[1], new RegExp(`^${r[2]}(?=/${e})`)] : [t, r[1], new RegExp(`^${r[2]}$`)] : et[s] = [t, r[1], !0]), et[s];
  }
  return null;
}, jt = (t, e) => {
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
}, Xr = (t) => jt(t, decodeURI), hr = (t) => {
  const e = t.url, r = e.indexOf(
    "/",
    e.charCodeAt(9) === 58 ? 13 : 8
  );
  let s = r;
  for (; s < e.length; s++) {
    const n = e.charCodeAt(s);
    if (n === 37) {
      const a = e.indexOf("?", s), i = e.slice(r, a === -1 ? void 0 : a);
      return Xr(i.includes("%25") ? i.replace(/%25/g, "%2525") : i);
    } else if (n === 63)
      break;
  }
  return e.slice(r, s);
}, Qr = (t) => {
  const e = hr(t);
  return e.length > 1 && e.at(-1) === "/" ? e.slice(0, -1) : e;
}, be = (t, e, ...r) => (r.length && (e = be(e, ...r)), `${(t == null ? void 0 : t[0]) === "/" ? "" : "/"}${t}${e === "/" ? "" : `${(t == null ? void 0 : t.at(-1)) === "/" ? "" : "/"}${(e == null ? void 0 : e[0]) === "/" ? e.slice(1) : e}`}`), fr = (t) => {
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
}, yt = (t) => /[%+]/.test(t) ? (t.indexOf("+") !== -1 && (t = t.replace(/\+/g, " ")), t.indexOf("%") !== -1 ? jt(t, mr) : t) : t, pr = (t, e, r) => {
  let s;
  if (!r && e && !/[%+]/.test(e)) {
    let i = t.indexOf(`?${e}`, 8);
    for (i === -1 && (i = t.indexOf(`&${e}`, 8)); i !== -1; ) {
      const o = t.charCodeAt(i + e.length + 1);
      if (o === 61) {
        const c = i + e.length + 2, l = t.indexOf("&", c);
        return yt(t.slice(c, l === -1 ? void 0 : l));
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
    if (s && (c = yt(c)), a = i, c === "")
      continue;
    let l;
    o === -1 ? l = "" : (l = t.slice(o + 1, i === -1 ? void 0 : i), s && (l = yt(l))), r ? (n[c] && Array.isArray(n[c]) || (n[c] = []), n[c].push(l)) : n[c] ?? (n[c] = l);
  }
  return e ? n[e] : n;
}, es = pr, ts = (t, e) => pr(t, e, !0), mr = decodeURIComponent, Lt = (t) => jt(t, mr), Ae, D, Q, gr, vr, xt, se, rr, yr = (rr = class {
  constructor(t, e = "/", r = [[]]) {
    x(this, Q);
    g(this, "raw");
    x(this, Ae);
    x(this, D);
    g(this, "routeIndex", 0);
    g(this, "path");
    g(this, "bodyCache", {});
    x(this, se, (t) => {
      const { bodyCache: e, raw: r } = this, s = e[t];
      if (s)
        return s;
      const n = Object.keys(e)[0];
      return n ? e[n].then((a) => (n === "json" && (a = JSON.stringify(a)), new Response(a)[t]())) : e[t] = r[t]();
    });
    this.raw = t, this.path = e, y(this, D, r), y(this, Ae, {});
  }
  param(t) {
    return t ? O(this, Q, gr).call(this, t) : O(this, Q, vr).call(this);
  }
  query(t) {
    return es(this.url, t);
  }
  queries(t) {
    return ts(this.url, t);
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
    return (e = this.bodyCache).parsedBody ?? (e.parsedBody = await zr(this, t));
  }
  json() {
    return d(this, se).call(this, "text").then((t) => JSON.parse(t));
  }
  text() {
    return d(this, se).call(this, "text");
  }
  arrayBuffer() {
    return d(this, se).call(this, "arrayBuffer");
  }
  blob() {
    return d(this, se).call(this, "blob");
  }
  formData() {
    return d(this, se).call(this, "formData");
  }
  addValidatedData(t, e) {
    d(this, Ae)[t] = e;
  }
  valid(t) {
    return d(this, Ae)[t];
  }
  get url() {
    return this.raw.url;
  }
  get method() {
    return this.raw.method;
  }
  get [Hr]() {
    return d(this, D);
  }
  get matchedRoutes() {
    return d(this, D)[0].map(([[, t]]) => t);
  }
  get routePath() {
    return d(this, D)[0].map(([[, t]]) => t)[this.routeIndex].path;
  }
}, Ae = new WeakMap(), D = new WeakMap(), Q = new WeakSet(), gr = function(t) {
  const e = d(this, D)[0][this.routeIndex][1][t], r = O(this, Q, xt).call(this, e);
  return r ? /\%/.test(r) ? Lt(r) : r : void 0;
}, vr = function() {
  const t = {}, e = Object.keys(d(this, D)[0][this.routeIndex][1]);
  for (const r of e) {
    const s = O(this, Q, xt).call(this, d(this, D)[0][this.routeIndex][1][r]);
    s && typeof s == "string" && (t[r] = /\%/.test(s) ? Lt(s) : s);
  }
  return t;
}, xt = function(t) {
  return d(this, D)[1] ? d(this, D)[1][t] : t;
}, se = new WeakMap(), rr), rs = {
  Stringify: 1
}, _r = async (t, e, r, s, n) => {
  typeof t == "object" && !(t instanceof String) && (t instanceof Promise || (t = t.toString()), t instanceof Promise && (t = await t));
  const a = t.callbacks;
  return a != null && a.length ? (n ? n[0] += t : n = [t], Promise.all(a.map((o) => o({ phase: e, buffer: n, context: s }))).then(
    (o) => Promise.all(
      o.filter(Boolean).map((c) => _r(c, e, !1, s, n))
    ).then(() => n[0])
  )) : Promise.resolve(t);
}, ss = "text/plain; charset=UTF-8", gt = (t, e) => ({
  "Content-Type": t,
  ...e
}), Je, Ke, J, Ee, K, P, Ge, Te, Ce, me, Ye, Xe, ne, Re, sr, ns = (sr = class {
  constructor(t, e) {
    x(this, ne);
    x(this, Je);
    x(this, Ke);
    g(this, "env", {});
    x(this, J);
    g(this, "finalized", !1);
    g(this, "error");
    x(this, Ee);
    x(this, K);
    x(this, P);
    x(this, Ge);
    x(this, Te);
    x(this, Ce);
    x(this, me);
    x(this, Ye);
    x(this, Xe);
    g(this, "render", (...t) => (d(this, Te) ?? y(this, Te, (e) => this.html(e)), d(this, Te).call(this, ...t)));
    g(this, "setLayout", (t) => y(this, Ge, t));
    g(this, "getLayout", () => d(this, Ge));
    g(this, "setRenderer", (t) => {
      y(this, Te, t);
    });
    g(this, "header", (t, e, r) => {
      this.finalized && y(this, P, new Response(d(this, P).body, d(this, P)));
      const s = d(this, P) ? d(this, P).headers : d(this, me) ?? y(this, me, new Headers());
      e === void 0 ? s.delete(t) : r != null && r.append ? s.append(t, e) : s.set(t, e);
    });
    g(this, "status", (t) => {
      y(this, Ee, t);
    });
    g(this, "set", (t, e) => {
      d(this, J) ?? y(this, J, /* @__PURE__ */ new Map()), d(this, J).set(t, e);
    });
    g(this, "get", (t) => d(this, J) ? d(this, J).get(t) : void 0);
    g(this, "newResponse", (...t) => O(this, ne, Re).call(this, ...t));
    g(this, "body", (t, e, r) => O(this, ne, Re).call(this, t, e, r));
    g(this, "text", (t, e, r) => !d(this, me) && !d(this, Ee) && !e && !r && !this.finalized ? new Response(t) : O(this, ne, Re).call(this, t, e, gt(ss, r)));
    g(this, "json", (t, e, r) => O(this, ne, Re).call(this, JSON.stringify(t), e, gt("application/json", r)));
    g(this, "html", (t, e, r) => {
      const s = (n) => O(this, ne, Re).call(this, n, e, gt("text/html; charset=UTF-8", r));
      return typeof t == "object" ? _r(t, rs.Stringify, !1, {}).then(s) : s(t);
    });
    g(this, "redirect", (t, e) => {
      const r = String(t);
      return this.header(
        "Location",
        /[^\x00-\xFF]/.test(r) ? encodeURI(r) : r
      ), this.newResponse(null, e ?? 302);
    });
    g(this, "notFound", () => (d(this, Ce) ?? y(this, Ce, () => new Response()), d(this, Ce).call(this, this)));
    y(this, Je, t), e && (y(this, K, e.executionCtx), this.env = e.env, y(this, Ce, e.notFoundHandler), y(this, Xe, e.path), y(this, Ye, e.matchResult));
  }
  get req() {
    return d(this, Ke) ?? y(this, Ke, new yr(d(this, Je), d(this, Xe), d(this, Ye))), d(this, Ke);
  }
  get event() {
    if (d(this, K) && "respondWith" in d(this, K))
      return d(this, K);
    throw Error("This context has no FetchEvent");
  }
  get executionCtx() {
    if (d(this, K))
      return d(this, K);
    throw Error("This context has no ExecutionContext");
  }
  get res() {
    return d(this, P) || y(this, P, new Response(null, {
      headers: d(this, me) ?? y(this, me, new Headers())
    }));
  }
  set res(t) {
    if (d(this, P) && t) {
      t = new Response(t.body, t);
      for (const [e, r] of d(this, P).headers.entries())
        if (e !== "content-type")
          if (e === "set-cookie") {
            const s = d(this, P).headers.getSetCookie();
            t.headers.delete("set-cookie");
            for (const n of s)
              t.headers.append("set-cookie", n);
          } else
            t.headers.set(e, r);
    }
    y(this, P, t), this.finalized = !0;
  }
  get var() {
    return d(this, J) ? Object.fromEntries(d(this, J)) : {};
  }
}, Je = new WeakMap(), Ke = new WeakMap(), J = new WeakMap(), Ee = new WeakMap(), K = new WeakMap(), P = new WeakMap(), Ge = new WeakMap(), Te = new WeakMap(), Ce = new WeakMap(), me = new WeakMap(), Ye = new WeakMap(), Xe = new WeakMap(), ne = new WeakSet(), Re = function(t, e, r) {
  const s = d(this, P) ? new Headers(d(this, P).headers) : d(this, me) ?? new Headers();
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
  const n = typeof e == "number" ? e : (e == null ? void 0 : e.status) ?? d(this, Ee);
  return new Response(t, { status: n, headers: s });
}, sr), T = "ALL", as = "all", is = ["get", "post", "put", "delete", "options", "patch"], kr = "Can not add a route since the matcher is already built.", xr = class extends Error {
}, os = "__COMPOSED_HANDLER", cs = (t) => t.text("404 Not Found", 404), Mt = (t, e) => {
  if ("getResponse" in t) {
    const r = t.getResponse();
    return e.newResponse(r.body, r);
  }
  return console.error(t), e.text("Internal Server Error", 500);
}, U, C, br, H, fe, tt, rt, nr, wr = (nr = class {
  constructor(e = {}) {
    x(this, C);
    g(this, "get");
    g(this, "post");
    g(this, "put");
    g(this, "delete");
    g(this, "options");
    g(this, "patch");
    g(this, "all");
    g(this, "on");
    g(this, "use");
    g(this, "router");
    g(this, "getPath");
    g(this, "_basePath", "/");
    x(this, U, "/");
    g(this, "routes", []);
    x(this, H, cs);
    g(this, "errorHandler", Mt);
    g(this, "onError", (e) => (this.errorHandler = e, this));
    g(this, "notFound", (e) => (y(this, H, e), this));
    g(this, "fetch", (e, ...r) => O(this, C, rt).call(this, e, r[1], r[0], e.method));
    g(this, "request", (e, r, s, n) => e instanceof Request ? this.fetch(r ? new Request(e, r) : e, s, n) : (e = e.toString(), this.fetch(
      new Request(
        /^https?:\/\//.test(e) ? e : `http://localhost${be("/", e)}`,
        r
      ),
      s,
      n
    )));
    g(this, "fire", () => {
      addEventListener("fetch", (e) => {
        e.respondWith(O(this, C, rt).call(this, e.request, e, void 0, e.request.method));
      });
    });
    [...is, as].forEach((a) => {
      this[a] = (i, ...o) => (typeof i == "string" ? y(this, U, i) : O(this, C, fe).call(this, a, d(this, U), i), o.forEach((c) => {
        O(this, C, fe).call(this, a, d(this, U), c);
      }), this);
    }), this.on = (a, i, ...o) => {
      for (const c of [i].flat()) {
        y(this, U, c);
        for (const l of [a].flat())
          o.map((u) => {
            O(this, C, fe).call(this, l.toUpperCase(), d(this, U), u);
          });
      }
      return this;
    }, this.use = (a, ...i) => (typeof a == "string" ? y(this, U, a) : (y(this, U, "*"), i.unshift(a)), i.forEach((o) => {
      O(this, C, fe).call(this, T, d(this, U), o);
    }), this);
    const { strict: s, ...n } = e;
    Object.assign(this, n), this.getPath = s ?? !0 ? e.getPath ?? hr : Qr;
  }
  route(e, r) {
    const s = this.basePath(e);
    return r.routes.map((n) => {
      var i;
      let a;
      r.errorHandler === Mt ? a = n.handler : (a = async (o, c) => (await Zt([], r.errorHandler)(o, () => n.handler(o, c))).res, a[os] = n.handler), O(i = s, C, fe).call(i, n.method, n.path, a);
    }), this;
  }
  basePath(e) {
    const r = O(this, C, br).call(this);
    return r._basePath = be(this._basePath, e), r;
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
      const c = be(this._basePath, e), l = c === "/" ? 0 : c.length;
      return (u) => {
        const v = new URL(u.url);
        return v.pathname = v.pathname.slice(l) || "/", new Request(v, u);
      };
    })());
    const o = async (c, l) => {
      const u = await r(n(c.req.raw), ...i(c));
      if (u)
        return u;
      await l();
    };
    return O(this, C, fe).call(this, T, be(e, "*"), o), this;
  }
}, U = new WeakMap(), C = new WeakSet(), br = function() {
  const e = new wr({
    router: this.router,
    getPath: this.getPath
  });
  return e.errorHandler = this.errorHandler, y(e, H, d(this, H)), e.routes = this.routes, e;
}, H = new WeakMap(), fe = function(e, r, s) {
  e = e.toUpperCase(), r = be(this._basePath, r);
  const n = { basePath: this._basePath, path: r, method: e, handler: s };
  this.router.add(e, r, [s, n]), this.routes.push(n);
}, tt = function(e, r) {
  if (e instanceof Error)
    return this.errorHandler(e, r);
  throw e;
}, rt = function(e, r, s, n) {
  if (n === "HEAD")
    return (async () => new Response(null, await O(this, C, rt).call(this, e, r, s, "GET")))();
  const a = this.getPath(e, { env: s }), i = this.router.match(n, a), o = new ns(e, {
    path: a,
    matchResult: i,
    env: s,
    executionCtx: r,
    notFoundHandler: d(this, H)
  });
  if (i[0].length === 1) {
    let l;
    try {
      l = i[0][0][0][0](o, async () => {
        o.res = await d(this, H).call(this, o);
      });
    } catch (u) {
      return O(this, C, tt).call(this, u, o);
    }
    return l instanceof Promise ? l.then(
      (u) => u || (o.finalized ? o.res : d(this, H).call(this, o))
    ).catch((u) => O(this, C, tt).call(this, u, o)) : l ?? d(this, H).call(this, o);
  }
  const c = Zt(i[0], this.errorHandler, d(this, H));
  return (async () => {
    try {
      const l = await c(o);
      if (!l.finalized)
        throw new Error(
          "Context is not finalized. Did you forget to return a Response object or `await next()`?"
        );
      return l.res;
    } catch (l) {
      return O(this, C, tt).call(this, l, o);
    }
  })();
}, nr), at = "[^/]+", ze = ".*", Fe = "(?:|/.*)", Se = Symbol(), ls = new Set(".\\+*[^]$()");
function ds(t, e) {
  return t.length === 1 ? e.length === 1 ? t < e ? -1 : 1 : -1 : e.length === 1 || t === ze || t === Fe ? 1 : e === ze || e === Fe ? -1 : t === at ? 1 : e === at ? -1 : t.length === e.length ? t < e ? -1 : 1 : e.length - t.length;
}
var ye, ge, z, ar, wt = (ar = class {
  constructor() {
    x(this, ye);
    x(this, ge);
    x(this, z, /* @__PURE__ */ Object.create(null));
  }
  insert(e, r, s, n, a) {
    if (e.length === 0) {
      if (d(this, ye) !== void 0)
        throw Se;
      if (a)
        return;
      y(this, ye, r);
      return;
    }
    const [i, ...o] = e, c = i === "*" ? o.length === 0 ? ["", "", ze] : ["", "", at] : i === "/*" ? ["", "", Fe] : i.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
    let l;
    if (c) {
      const u = c[1];
      let v = c[2] || at;
      if (u && c[2] && (v === ".*" || (v = v.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:"), /\((?!\?:)/.test(v))))
        throw Se;
      if (l = d(this, z)[v], !l) {
        if (Object.keys(d(this, z)).some(
          (b) => b !== ze && b !== Fe
        ))
          throw Se;
        if (a)
          return;
        l = d(this, z)[v] = new wt(), u !== "" && y(l, ge, n.varIndex++);
      }
      !a && u !== "" && s.push([u, d(l, ge)]);
    } else if (l = d(this, z)[i], !l) {
      if (Object.keys(d(this, z)).some(
        (u) => u.length > 1 && u !== ze && u !== Fe
      ))
        throw Se;
      if (a)
        return;
      l = d(this, z)[i] = new wt();
    }
    l.insert(o, r, s, n, a);
  }
  buildRegExpStr() {
    const r = Object.keys(d(this, z)).sort(ds).map((s) => {
      const n = d(this, z)[s];
      return (typeof d(n, ge) == "number" ? `(${s})@${d(n, ge)}` : ls.has(s) ? `\\${s}` : s) + n.buildRegExpStr();
    });
    return typeof d(this, ye) == "number" && r.unshift(`#${d(this, ye)}`), r.length === 0 ? "" : r.length === 1 ? r[0] : "(?:" + r.join("|") + ")";
  }
}, ye = new WeakMap(), ge = new WeakMap(), z = new WeakMap(), ar), ht, Qe, ir, us = (ir = class {
  constructor() {
    x(this, ht, { varIndex: 0 });
    x(this, Qe, new wt());
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
    return d(this, Qe).insert(a, e, s, d(this, ht), r), s;
  }
  buildRegExp() {
    let t = d(this, Qe).buildRegExpStr();
    if (t === "")
      return [/^$/, [], []];
    let e = 0;
    const r = [], s = [];
    return t = t.replace(/#(\d+)|@(\d+)|\.\*\$/g, (n, a, i) => a !== void 0 ? (r[++e] = Number(a), "$()") : (i !== void 0 && (s[Number(i)] = ++e), "")), [new RegExp(`^${t}`), r, s];
  }
}, ht = new WeakMap(), Qe = new WeakMap(), ir), Rr = [], hs = [/^$/, [], /* @__PURE__ */ Object.create(null)], st = /* @__PURE__ */ Object.create(null);
function Sr(t) {
  return st[t] ?? (st[t] = new RegExp(
    t === "*" ? "" : `^${t.replace(
      /\/\*$|([.\\+*[^\]$()])/g,
      (e, r) => r ? `\\${r}` : "(?:|/.*)"
    )}$`
  ));
}
function fs() {
  st = /* @__PURE__ */ Object.create(null);
}
function ps(t) {
  var l;
  const e = new us(), r = [];
  if (t.length === 0)
    return hs;
  const s = t.map(
    (u) => [!/\*|\/:/.test(u[0]), ...u]
  ).sort(
    ([u, v], [b, N]) => u ? 1 : b ? -1 : v.length - N.length
  ), n = /* @__PURE__ */ Object.create(null);
  for (let u = 0, v = -1, b = s.length; u < b; u++) {
    const [N, Z, A] = s[u];
    N ? n[Z] = [A.map(([M]) => [M, /* @__PURE__ */ Object.create(null)]), Rr] : v++;
    let $;
    try {
      $ = e.insert(Z, v, N);
    } catch (M) {
      throw M === Se ? new xr(Z) : M;
    }
    N || (r[v] = A.map(([M, xe]) => {
      const De = /* @__PURE__ */ Object.create(null);
      for (xe -= 1; xe >= 0; xe--) {
        const [B, ft] = $[xe];
        De[B] = ft;
      }
      return [M, De];
    }));
  }
  const [a, i, o] = e.buildRegExp();
  for (let u = 0, v = r.length; u < v; u++)
    for (let b = 0, N = r[u].length; b < N; b++) {
      const Z = (l = r[u][b]) == null ? void 0 : l[1];
      if (!Z)
        continue;
      const A = Object.keys(Z);
      for (let $ = 0, M = A.length; $ < M; $++)
        Z[A[$]] = o[Z[A[$]]];
    }
  const c = [];
  for (const u in i)
    c[u] = r[i[u]];
  return [a, c, n];
}
function we(t, e) {
  if (t) {
    for (const r of Object.keys(t).sort((s, n) => n.length - s.length))
      if (Sr(r).test(e))
        return [...t[r]];
  }
}
var ae, ie, Me, Or, Ar, or, ms = (or = class {
  constructor() {
    x(this, Me);
    g(this, "name", "RegExpRouter");
    x(this, ae);
    x(this, ie);
    y(this, ae, { [T]: /* @__PURE__ */ Object.create(null) }), y(this, ie, { [T]: /* @__PURE__ */ Object.create(null) });
  }
  add(t, e, r) {
    var o;
    const s = d(this, ae), n = d(this, ie);
    if (!s || !n)
      throw new Error(kr);
    s[t] || [s, n].forEach((c) => {
      c[t] = /* @__PURE__ */ Object.create(null), Object.keys(c[T]).forEach((l) => {
        c[t][l] = [...c[T][l]];
      });
    }), e === "/*" && (e = "*");
    const a = (e.match(/\/:/g) || []).length;
    if (/\*$/.test(e)) {
      const c = Sr(e);
      t === T ? Object.keys(s).forEach((l) => {
        var u;
        (u = s[l])[e] || (u[e] = we(s[l], e) || we(s[T], e) || []);
      }) : (o = s[t])[e] || (o[e] = we(s[t], e) || we(s[T], e) || []), Object.keys(s).forEach((l) => {
        (t === T || t === l) && Object.keys(s[l]).forEach((u) => {
          c.test(u) && s[l][u].push([r, a]);
        });
      }), Object.keys(n).forEach((l) => {
        (t === T || t === l) && Object.keys(n[l]).forEach(
          (u) => c.test(u) && n[l][u].push([r, a])
        );
      });
      return;
    }
    const i = fr(e) || [e];
    for (let c = 0, l = i.length; c < l; c++) {
      const u = i[c];
      Object.keys(n).forEach((v) => {
        var b;
        (t === T || t === v) && ((b = n[v])[u] || (b[u] = [
          ...we(s[v], u) || we(s[T], u) || []
        ]), n[v][u].push([r, a - l + c + 1]));
      });
    }
  }
  match(t, e) {
    fs();
    const r = O(this, Me, Or).call(this);
    return this.match = (s, n) => {
      const a = r[s] || r[T], i = a[2][n];
      if (i)
        return i;
      const o = n.match(a[0]);
      if (!o)
        return [[], Rr];
      const c = o.indexOf("", 1);
      return [a[1][c], o];
    }, this.match(t, e);
  }
}, ae = new WeakMap(), ie = new WeakMap(), Me = new WeakSet(), Or = function() {
  const t = /* @__PURE__ */ Object.create(null);
  return Object.keys(d(this, ie)).concat(Object.keys(d(this, ae))).forEach((e) => {
    t[e] || (t[e] = O(this, Me, Ar).call(this, e));
  }), y(this, ae, y(this, ie, void 0)), t;
}, Ar = function(t) {
  const e = [];
  let r = t === T;
  return [d(this, ae), d(this, ie)].forEach((s) => {
    const n = s[t] ? Object.keys(s[t]).map((a) => [a, s[t][a]]) : [];
    n.length !== 0 ? (r || (r = !0), e.push(...n)) : t !== T && e.push(
      ...Object.keys(s[T]).map((a) => [a, s[T][a]])
    );
  }), r ? ps(e) : null;
}, or), oe, G, cr, ys = (cr = class {
  constructor(t) {
    g(this, "name", "SmartRouter");
    x(this, oe, []);
    x(this, G, []);
    y(this, oe, t.routers);
  }
  add(t, e, r) {
    if (!d(this, G))
      throw new Error(kr);
    d(this, G).push([t, e, r]);
  }
  match(t, e) {
    if (!d(this, G))
      throw new Error("Fatal error");
    const r = d(this, oe), s = d(this, G), n = r.length;
    let a = 0, i;
    for (; a < n; a++) {
      const o = r[a];
      try {
        for (let c = 0, l = s.length; c < l; c++)
          o.add(...s[c]);
        i = o.match(t, e);
      } catch (c) {
        if (c instanceof xr)
          continue;
        throw c;
      }
      this.match = o.match.bind(o), y(this, oe, [o]), y(this, G, void 0);
      break;
    }
    if (a === n)
      throw new Error("Fatal error");
    return this.name = `SmartRouter + ${this.activeRouter.name}`, i;
  }
  get activeRouter() {
    if (d(this, G) || d(this, oe).length !== 1)
      throw new Error("No active router has been determined yet.");
    return d(this, oe)[0];
  }
}, oe = new WeakMap(), G = new WeakMap(), cr), Ue = /* @__PURE__ */ Object.create(null), ce, I, ve, je, j, Y, pe, lr, Er = (lr = class {
  constructor(t, e, r) {
    x(this, Y);
    x(this, ce);
    x(this, I);
    x(this, ve);
    x(this, je, 0);
    x(this, j, Ue);
    if (y(this, I, r || /* @__PURE__ */ Object.create(null)), y(this, ce, []), t && e) {
      const s = /* @__PURE__ */ Object.create(null);
      s[t] = { handler: e, possibleKeys: [], score: 0 }, y(this, ce, [s]);
    }
    y(this, ve, []);
  }
  insert(t, e, r) {
    y(this, je, ++$t(this, je)._);
    let s = this;
    const n = Jr(e), a = [];
    for (let i = 0, o = n.length; i < o; i++) {
      const c = n[i], l = n[i + 1], u = Yr(c, l), v = Array.isArray(u) ? u[0] : c;
      if (v in d(s, I)) {
        s = d(s, I)[v], u && a.push(u[1]);
        continue;
      }
      d(s, I)[v] = new Er(), u && (d(s, ve).push(u), a.push(u[1])), s = d(s, I)[v];
    }
    return d(s, ce).push({
      [t]: {
        handler: r,
        possibleKeys: a.filter((i, o, c) => c.indexOf(i) === o),
        score: d(this, je)
      }
    }), s;
  }
  search(t, e) {
    var o;
    const r = [];
    y(this, j, Ue);
    let n = [this];
    const a = ur(e), i = [];
    for (let c = 0, l = a.length; c < l; c++) {
      const u = a[c], v = c === l - 1, b = [];
      for (let N = 0, Z = n.length; N < Z; N++) {
        const A = n[N], $ = d(A, I)[u];
        $ && (y($, j, d(A, j)), v ? (d($, I)["*"] && r.push(
          ...O(this, Y, pe).call(this, d($, I)["*"], t, d(A, j))
        ), r.push(...O(this, Y, pe).call(this, $, t, d(A, j)))) : b.push($));
        for (let M = 0, xe = d(A, ve).length; M < xe; M++) {
          const De = d(A, ve)[M], B = d(A, j) === Ue ? {} : { ...d(A, j) };
          if (De === "*") {
            const ee = d(A, I)["*"];
            ee && (r.push(...O(this, Y, pe).call(this, ee, t, d(A, j))), y(ee, j, B), b.push(ee));
            continue;
          }
          const [ft, It, Ve] = De;
          if (!u && !(Ve instanceof RegExp))
            continue;
          const W = d(A, I)[ft], Dr = a.slice(c).join("/");
          if (Ve instanceof RegExp) {
            const ee = Ve.exec(Dr);
            if (ee) {
              if (B[It] = ee[0], r.push(...O(this, Y, pe).call(this, W, t, d(A, j), B)), Object.keys(d(W, I)).length) {
                y(W, j, B);
                const pt = ((o = ee[0].match(/\//)) == null ? void 0 : o.length) ?? 0;
                (i[pt] || (i[pt] = [])).push(W);
              }
              continue;
            }
          }
          (Ve === !0 || Ve.test(u)) && (B[It] = u, v ? (r.push(...O(this, Y, pe).call(this, W, t, B, d(A, j))), d(W, I)["*"] && r.push(
            ...O(this, Y, pe).call(this, d(W, I)["*"], t, B, d(A, j))
          )) : (y(W, j, B), b.push(W)));
        }
      }
      n = b.concat(i.shift() ?? []);
    }
    return r.length > 1 && r.sort((c, l) => c.score - l.score), [r.map(({ handler: c, params: l }) => [c, l])];
  }
}, ce = new WeakMap(), I = new WeakMap(), ve = new WeakMap(), je = new WeakMap(), j = new WeakMap(), Y = new WeakSet(), pe = function(t, e, r, s) {
  const n = [];
  for (let a = 0, i = d(t, ce).length; a < i; a++) {
    const o = d(t, ce)[a], c = o[e] || o[T], l = {};
    if (c !== void 0 && (c.params = /* @__PURE__ */ Object.create(null), n.push(c), r !== Ue || s && s !== Ue))
      for (let u = 0, v = c.possibleKeys.length; u < v; u++) {
        const b = c.possibleKeys[u], N = l[c.score];
        c.params[b] = s != null && s[b] && !N ? s[b] : r[b] ?? (s == null ? void 0 : s[b]), l[c.score] = !0;
      }
  }
  return n;
}, lr), _e, dr, gs = (dr = class {
  constructor() {
    g(this, "name", "TrieRouter");
    x(this, _e);
    y(this, _e, new Er());
  }
  add(t, e, r) {
    const s = fr(e);
    if (s) {
      for (let n = 0, a = s.length; n < a; n++)
        d(this, _e).insert(t, s[n], r);
      return;
    }
    d(this, _e).insert(t, e, r);
  }
  match(t, e) {
    return d(this, _e).search(t, e);
  }
}, _e = new WeakMap(), dr), vs = class extends wr {
  constructor(t = {}) {
    super(t), this.router = t.router ?? new ys({
      routers: [new ms(), new gs()]
    });
  }
}, S;
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
})(S || (S = {}));
var Dt;
(function(t) {
  t.mergeShapes = (e, r) => ({
    ...e,
    ...r
    // second overwrites first
  });
})(Dt || (Dt = {}));
const p = S.arrayToEnum([
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
]), te = (t) => {
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
}, h = S.arrayToEnum([
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
class X extends Error {
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
    if (!(e instanceof X))
      throw new Error(`Not a ZodError: ${e}`);
  }
  toString() {
    return this.message;
  }
  get message() {
    return JSON.stringify(this.issues, S.jsonStringifyReplacer, 2);
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
X.create = (t) => new X(t);
const bt = (t, e) => {
  let r;
  switch (t.code) {
    case h.invalid_type:
      t.received === p.undefined ? r = "Required" : r = `Expected ${t.expected}, received ${t.received}`;
      break;
    case h.invalid_literal:
      r = `Invalid literal value, expected ${JSON.stringify(t.expected, S.jsonStringifyReplacer)}`;
      break;
    case h.unrecognized_keys:
      r = `Unrecognized key(s) in object: ${S.joinValues(t.keys, ", ")}`;
      break;
    case h.invalid_union:
      r = "Invalid input";
      break;
    case h.invalid_union_discriminator:
      r = `Invalid discriminator value. Expected ${S.joinValues(t.options)}`;
      break;
    case h.invalid_enum_value:
      r = `Invalid enum value. Expected ${S.joinValues(t.options)}, received '${t.received}'`;
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
      typeof t.validation == "object" ? "includes" in t.validation ? (r = `Invalid input: must include "${t.validation.includes}"`, typeof t.validation.position == "number" && (r = `${r} at one or more positions greater than or equal to ${t.validation.position}`)) : "startsWith" in t.validation ? r = `Invalid input: must start with "${t.validation.startsWith}"` : "endsWith" in t.validation ? r = `Invalid input: must end with "${t.validation.endsWith}"` : S.assertNever(t.validation) : t.validation !== "regex" ? r = `Invalid ${t.validation}` : r = "Invalid";
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
      r = e.defaultError, S.assertNever(t);
  }
  return { message: r };
};
let _s = bt;
function ks() {
  return _s;
}
const xs = (t) => {
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
  const r = ks(), s = xs({
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
class L {
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
        return _;
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
    return L.mergeObjectSync(e, s);
  }
  static mergeObjectSync(e, r) {
    const s = {};
    for (const n of r) {
      const { key: a, value: i } = n;
      if (a.status === "aborted" || i.status === "aborted")
        return _;
      a.status === "dirty" && e.dirty(), i.status === "dirty" && e.dirty(), a.value !== "__proto__" && (typeof i.value < "u" || n.alwaysSet) && (s[a.value] = i.value);
    }
    return { status: e.value, value: s };
  }
}
const _ = Object.freeze({
  status: "aborted"
}), He = (t) => ({ status: "dirty", value: t }), V = (t) => ({ status: "valid", value: t }), Vt = (t) => t.status === "aborted", Ut = (t) => t.status === "dirty", Ne = (t) => t.status === "valid", it = (t) => typeof Promise < "u" && t instanceof Promise;
var m;
(function(t) {
  t.errToObj = (e) => typeof e == "string" ? { message: e } : e || {}, t.toString = (e) => typeof e == "string" ? e : e == null ? void 0 : e.message;
})(m || (m = {}));
class ue {
  constructor(e, r, s, n) {
    this._cachedPath = [], this.parent = e, this.data = r, this._path = s, this._key = n;
  }
  get path() {
    return this._cachedPath.length || (Array.isArray(this._key) ? this._cachedPath.push(...this._path, ...this._key) : this._cachedPath.push(...this._path, this._key)), this._cachedPath;
  }
}
const Ht = (t, e) => {
  if (Ne(e))
    return { success: !0, data: e.value };
  if (!t.common.issues.length)
    throw new Error("Validation failed but no issues detected.");
  return {
    success: !1,
    get error() {
      if (this._error)
        return this._error;
      const r = new X(t.common.issues);
      return this._error = r, this._error;
    }
  };
};
function w(t) {
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
class R {
  get description() {
    return this._def.description;
  }
  _getType(e) {
    return te(e.data);
  }
  _getOrReturnCtx(e, r) {
    return r || {
      common: e.parent.common,
      data: e.data,
      parsedType: te(e.data),
      schemaErrorMap: this._def.errorMap,
      path: e.path,
      parent: e.parent
    };
  }
  _processInputParams(e) {
    return {
      status: new L(),
      ctx: {
        common: e.parent.common,
        data: e.data,
        parsedType: te(e.data),
        schemaErrorMap: this._def.errorMap,
        path: e.path,
        parent: e.parent
      }
    };
  }
  _parseSync(e) {
    const r = this._parse(e);
    if (it(r))
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
      parsedType: te(e)
    }, n = this._parseSync({ data: e, path: s.path, parent: s });
    return Ht(s, n);
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
      parsedType: te(e)
    };
    if (!this["~standard"].async)
      try {
        const a = this._parseSync({ data: e, path: [], parent: r });
        return Ne(a) ? {
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
    return this._parseAsync({ data: e, path: [], parent: r }).then((a) => Ne(a) ? {
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
      parsedType: te(e)
    }, n = this._parse({ data: e, path: s.path, parent: s }), a = await (it(n) ? n : Promise.resolve(n));
    return Ht(s, a);
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
    return new $e({
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
    return de.create(this, this._def);
  }
  nullable() {
    return Ze.create(this, this._def);
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
    return ct.create([this, e], this._def);
  }
  and(e) {
    return lt.create(this, e, this._def);
  }
  transform(e) {
    return new $e({
      ...w(this._def),
      schema: this,
      typeName: k.ZodEffects,
      effect: { type: "transform", transform: e }
    });
  }
  default(e) {
    const r = typeof e == "function" ? e : () => e;
    return new At({
      ...w(this._def),
      innerType: this,
      defaultValue: r,
      typeName: k.ZodDefault
    });
  }
  brand() {
    return new Fs({
      typeName: k.ZodBranded,
      type: this,
      ...w(this._def)
    });
  }
  catch(e) {
    const r = typeof e == "function" ? e : () => e;
    return new Et({
      ...w(this._def),
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
    return Nt.create(this, e);
  }
  readonly() {
    return Tt.create(this);
  }
  isOptional() {
    return this.safeParse(void 0).success;
  }
  isNullable() {
    return this.safeParse(null).success;
  }
}
const ws = /^c[^\s-]{8,}$/i, bs = /^[0-9a-z]+$/, Rs = /^[0-9A-HJKMNP-TV-Z]{26}$/i, Ss = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i, Os = /^[a-z0-9_-]{21}$/i, As = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/, Es = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/, Ts = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i, Cs = "^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$";
let vt;
const js = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/, Ns = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/, Is = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/, Ps = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/, $s = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/, Zs = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/, Tr = "((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))", Ls = new RegExp(`^${Tr}$`);
function Cr(t) {
  let e = "[0-5]\\d";
  t.precision ? e = `${e}\\.\\d{${t.precision}}` : t.precision == null && (e = `${e}(\\.\\d+)?`);
  const r = t.precision ? "+" : "?";
  return `([01]\\d|2[0-3]):[0-5]\\d(:${e})${r}`;
}
function Ms(t) {
  return new RegExp(`^${Cr(t)}$`);
}
function Ds(t) {
  let e = `${Tr}T${Cr(t)}`;
  const r = [];
  return r.push(t.local ? "Z?" : "Z"), t.offset && r.push("([+-]\\d{2}:?\\d{2})"), e = `${e}(${r.join("|")})`, new RegExp(`^${e}$`);
}
function Vs(t, e) {
  return !!((e === "v4" || !e) && js.test(t) || (e === "v6" || !e) && Is.test(t));
}
function Us(t, e) {
  if (!As.test(t))
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
function Hs(t, e) {
  return !!((e === "v4" || !e) && Ns.test(t) || (e === "v6" || !e) && Ps.test(t));
}
class le extends R {
  _parse(e) {
    if (this._def.coerce && (e.data = String(e.data)), this._getType(e) !== p.string) {
      const a = this._getOrReturnCtx(e);
      return f(a, {
        code: h.invalid_type,
        expected: p.string,
        received: a.parsedType
      }), _;
    }
    const s = new L();
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
        Ts.test(e.data) || (n = this._getOrReturnCtx(e, n), f(n, {
          validation: "email",
          code: h.invalid_string,
          message: a.message
        }), s.dirty());
      else if (a.kind === "emoji")
        vt || (vt = new RegExp(Cs, "u")), vt.test(e.data) || (n = this._getOrReturnCtx(e, n), f(n, {
          validation: "emoji",
          code: h.invalid_string,
          message: a.message
        }), s.dirty());
      else if (a.kind === "uuid")
        Ss.test(e.data) || (n = this._getOrReturnCtx(e, n), f(n, {
          validation: "uuid",
          code: h.invalid_string,
          message: a.message
        }), s.dirty());
      else if (a.kind === "nanoid")
        Os.test(e.data) || (n = this._getOrReturnCtx(e, n), f(n, {
          validation: "nanoid",
          code: h.invalid_string,
          message: a.message
        }), s.dirty());
      else if (a.kind === "cuid")
        ws.test(e.data) || (n = this._getOrReturnCtx(e, n), f(n, {
          validation: "cuid",
          code: h.invalid_string,
          message: a.message
        }), s.dirty());
      else if (a.kind === "cuid2")
        bs.test(e.data) || (n = this._getOrReturnCtx(e, n), f(n, {
          validation: "cuid2",
          code: h.invalid_string,
          message: a.message
        }), s.dirty());
      else if (a.kind === "ulid")
        Rs.test(e.data) || (n = this._getOrReturnCtx(e, n), f(n, {
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
      }), s.dirty()) : a.kind === "datetime" ? Ds(a).test(e.data) || (n = this._getOrReturnCtx(e, n), f(n, {
        code: h.invalid_string,
        validation: "datetime",
        message: a.message
      }), s.dirty()) : a.kind === "date" ? Ls.test(e.data) || (n = this._getOrReturnCtx(e, n), f(n, {
        code: h.invalid_string,
        validation: "date",
        message: a.message
      }), s.dirty()) : a.kind === "time" ? Ms(a).test(e.data) || (n = this._getOrReturnCtx(e, n), f(n, {
        code: h.invalid_string,
        validation: "time",
        message: a.message
      }), s.dirty()) : a.kind === "duration" ? Es.test(e.data) || (n = this._getOrReturnCtx(e, n), f(n, {
        validation: "duration",
        code: h.invalid_string,
        message: a.message
      }), s.dirty()) : a.kind === "ip" ? Vs(e.data, a.version) || (n = this._getOrReturnCtx(e, n), f(n, {
        validation: "ip",
        code: h.invalid_string,
        message: a.message
      }), s.dirty()) : a.kind === "jwt" ? Us(e.data, a.alg) || (n = this._getOrReturnCtx(e, n), f(n, {
        validation: "jwt",
        code: h.invalid_string,
        message: a.message
      }), s.dirty()) : a.kind === "cidr" ? Hs(e.data, a.version) || (n = this._getOrReturnCtx(e, n), f(n, {
        validation: "cidr",
        code: h.invalid_string,
        message: a.message
      }), s.dirty()) : a.kind === "base64" ? $s.test(e.data) || (n = this._getOrReturnCtx(e, n), f(n, {
        validation: "base64",
        code: h.invalid_string,
        message: a.message
      }), s.dirty()) : a.kind === "base64url" ? Zs.test(e.data) || (n = this._getOrReturnCtx(e, n), f(n, {
        validation: "base64url",
        code: h.invalid_string,
        message: a.message
      }), s.dirty()) : S.assertNever(a);
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
    return new le({
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
    return new le({
      ...this._def,
      checks: [...this._def.checks, { kind: "trim" }]
    });
  }
  toLowerCase() {
    return new le({
      ...this._def,
      checks: [...this._def.checks, { kind: "toLowerCase" }]
    });
  }
  toUpperCase() {
    return new le({
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
le.create = (t) => new le({
  checks: [],
  typeName: k.ZodString,
  coerce: (t == null ? void 0 : t.coerce) ?? !1,
  ...w(t)
});
function zs(t, e) {
  const r = (t.toString().split(".")[1] || "").length, s = (e.toString().split(".")[1] || "").length, n = r > s ? r : s, a = Number.parseInt(t.toFixed(n).replace(".", "")), i = Number.parseInt(e.toFixed(n).replace(".", ""));
  return a % i / 10 ** n;
}
class Ie extends R {
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
      }), _;
    }
    let s;
    const n = new L();
    for (const a of this._def.checks)
      a.kind === "int" ? S.isInteger(e.data) || (s = this._getOrReturnCtx(e, s), f(s, {
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
      }), n.dirty()) : a.kind === "multipleOf" ? zs(e.data, a.value) !== 0 && (s = this._getOrReturnCtx(e, s), f(s, {
        code: h.not_multiple_of,
        multipleOf: a.value,
        message: a.message
      }), n.dirty()) : a.kind === "finite" ? Number.isFinite(e.data) || (s = this._getOrReturnCtx(e, s), f(s, {
        code: h.not_finite,
        message: a.message
      }), n.dirty()) : S.assertNever(a);
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
    return new Ie({
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
    return new Ie({
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
    return !!this._def.checks.find((e) => e.kind === "int" || e.kind === "multipleOf" && S.isInteger(e.value));
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
Ie.create = (t) => new Ie({
  checks: [],
  typeName: k.ZodNumber,
  coerce: (t == null ? void 0 : t.coerce) || !1,
  ...w(t)
});
class Be extends R {
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
    const n = new L();
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
      }), n.dirty()) : S.assertNever(a);
    return { status: n.value, value: e.data };
  }
  _getInvalidInput(e) {
    const r = this._getOrReturnCtx(e);
    return f(r, {
      code: h.invalid_type,
      expected: p.bigint,
      received: r.parsedType
    }), _;
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
    return new Be({
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
    return new Be({
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
Be.create = (t) => new Be({
  checks: [],
  typeName: k.ZodBigInt,
  coerce: (t == null ? void 0 : t.coerce) ?? !1,
  ...w(t)
});
class Rt extends R {
  _parse(e) {
    if (this._def.coerce && (e.data = !!e.data), this._getType(e) !== p.boolean) {
      const s = this._getOrReturnCtx(e);
      return f(s, {
        code: h.invalid_type,
        expected: p.boolean,
        received: s.parsedType
      }), _;
    }
    return V(e.data);
  }
}
Rt.create = (t) => new Rt({
  typeName: k.ZodBoolean,
  coerce: (t == null ? void 0 : t.coerce) || !1,
  ...w(t)
});
class ot extends R {
  _parse(e) {
    if (this._def.coerce && (e.data = new Date(e.data)), this._getType(e) !== p.date) {
      const a = this._getOrReturnCtx(e);
      return f(a, {
        code: h.invalid_type,
        expected: p.date,
        received: a.parsedType
      }), _;
    }
    if (Number.isNaN(e.data.getTime())) {
      const a = this._getOrReturnCtx(e);
      return f(a, {
        code: h.invalid_date
      }), _;
    }
    const s = new L();
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
      }), s.dirty()) : S.assertNever(a);
    return {
      status: s.value,
      value: new Date(e.data.getTime())
    };
  }
  _addCheck(e) {
    return new ot({
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
ot.create = (t) => new ot({
  checks: [],
  coerce: (t == null ? void 0 : t.coerce) || !1,
  typeName: k.ZodDate,
  ...w(t)
});
class zt extends R {
  _parse(e) {
    if (this._getType(e) !== p.symbol) {
      const s = this._getOrReturnCtx(e);
      return f(s, {
        code: h.invalid_type,
        expected: p.symbol,
        received: s.parsedType
      }), _;
    }
    return V(e.data);
  }
}
zt.create = (t) => new zt({
  typeName: k.ZodSymbol,
  ...w(t)
});
class Ft extends R {
  _parse(e) {
    if (this._getType(e) !== p.undefined) {
      const s = this._getOrReturnCtx(e);
      return f(s, {
        code: h.invalid_type,
        expected: p.undefined,
        received: s.parsedType
      }), _;
    }
    return V(e.data);
  }
}
Ft.create = (t) => new Ft({
  typeName: k.ZodUndefined,
  ...w(t)
});
class Bt extends R {
  _parse(e) {
    if (this._getType(e) !== p.null) {
      const s = this._getOrReturnCtx(e);
      return f(s, {
        code: h.invalid_type,
        expected: p.null,
        received: s.parsedType
      }), _;
    }
    return V(e.data);
  }
}
Bt.create = (t) => new Bt({
  typeName: k.ZodNull,
  ...w(t)
});
class qt extends R {
  constructor() {
    super(...arguments), this._any = !0;
  }
  _parse(e) {
    return V(e.data);
  }
}
qt.create = (t) => new qt({
  typeName: k.ZodAny,
  ...w(t)
});
class St extends R {
  constructor() {
    super(...arguments), this._unknown = !0;
  }
  _parse(e) {
    return V(e.data);
  }
}
St.create = (t) => new St({
  typeName: k.ZodUnknown,
  ...w(t)
});
class he extends R {
  _parse(e) {
    const r = this._getOrReturnCtx(e);
    return f(r, {
      code: h.invalid_type,
      expected: p.never,
      received: r.parsedType
    }), _;
  }
}
he.create = (t) => new he({
  typeName: k.ZodNever,
  ...w(t)
});
class Wt extends R {
  _parse(e) {
    if (this._getType(e) !== p.undefined) {
      const s = this._getOrReturnCtx(e);
      return f(s, {
        code: h.invalid_type,
        expected: p.void,
        received: s.parsedType
      }), _;
    }
    return V(e.data);
  }
}
Wt.create = (t) => new Wt({
  typeName: k.ZodVoid,
  ...w(t)
});
class q extends R {
  _parse(e) {
    const { ctx: r, status: s } = this._processInputParams(e), n = this._def;
    if (r.parsedType !== p.array)
      return f(r, {
        code: h.invalid_type,
        expected: p.array,
        received: r.parsedType
      }), _;
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
      return Promise.all([...r.data].map((i, o) => n.type._parseAsync(new ue(r, i, r.path, o)))).then((i) => L.mergeArray(s, i));
    const a = [...r.data].map((i, o) => n.type._parseSync(new ue(r, i, r.path, o)));
    return L.mergeArray(s, a);
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
  typeName: k.ZodArray,
  ...w(e)
});
function Oe(t) {
  if (t instanceof E) {
    const e = {};
    for (const r in t.shape) {
      const s = t.shape[r];
      e[r] = de.create(Oe(s));
    }
    return new E({
      ...t._def,
      shape: () => e
    });
  } else return t instanceof q ? new q({
    ...t._def,
    type: Oe(t.element)
  }) : t instanceof de ? de.create(Oe(t.unwrap())) : t instanceof Ze ? Ze.create(Oe(t.unwrap())) : t instanceof ke ? ke.create(t.items.map((e) => Oe(e))) : t;
}
class E extends R {
  constructor() {
    super(...arguments), this._cached = null, this.nonstrict = this.passthrough, this.augment = this.extend;
  }
  _getCached() {
    if (this._cached !== null)
      return this._cached;
    const e = this._def.shape(), r = S.objectKeys(e);
    return this._cached = { shape: e, keys: r }, this._cached;
  }
  _parse(e) {
    if (this._getType(e) !== p.object) {
      const l = this._getOrReturnCtx(e);
      return f(l, {
        code: h.invalid_type,
        expected: p.object,
        received: l.parsedType
      }), _;
    }
    const { status: s, ctx: n } = this._processInputParams(e), { shape: a, keys: i } = this._getCached(), o = [];
    if (!(this._def.catchall instanceof he && this._def.unknownKeys === "strip"))
      for (const l in n.data)
        i.includes(l) || o.push(l);
    const c = [];
    for (const l of i) {
      const u = a[l], v = n.data[l];
      c.push({
        key: { status: "valid", value: l },
        value: u._parse(new ue(n, v, n.path, l)),
        alwaysSet: l in n.data
      });
    }
    if (this._def.catchall instanceof he) {
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
        const v = n.data[u];
        c.push({
          key: { status: "valid", value: u },
          value: l._parse(
            new ue(n, v, n.path, u)
            //, ctx.child(key), value, getParsedType(value)
          ),
          alwaysSet: u in n.data
        });
      }
    }
    return n.common.async ? Promise.resolve().then(async () => {
      const l = [];
      for (const u of c) {
        const v = await u.key, b = await u.value;
        l.push({
          key: v,
          value: b,
          alwaysSet: u.alwaysSet
        });
      }
      return l;
    }).then((l) => L.mergeObjectSync(s, l)) : L.mergeObjectSync(s, c);
  }
  get shape() {
    return this._def.shape();
  }
  strict(e) {
    return m.errToObj, new E({
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
    return new E({
      ...this._def,
      unknownKeys: "strip"
    });
  }
  passthrough() {
    return new E({
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
    return new E({
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
    return new E({
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
    return new E({
      ...this._def,
      catchall: e
    });
  }
  pick(e) {
    const r = {};
    for (const s of S.objectKeys(e))
      e[s] && this.shape[s] && (r[s] = this.shape[s]);
    return new E({
      ...this._def,
      shape: () => r
    });
  }
  omit(e) {
    const r = {};
    for (const s of S.objectKeys(this.shape))
      e[s] || (r[s] = this.shape[s]);
    return new E({
      ...this._def,
      shape: () => r
    });
  }
  /**
   * @deprecated
   */
  deepPartial() {
    return Oe(this);
  }
  partial(e) {
    const r = {};
    for (const s of S.objectKeys(this.shape)) {
      const n = this.shape[s];
      e && !e[s] ? r[s] = n : r[s] = n.optional();
    }
    return new E({
      ...this._def,
      shape: () => r
    });
  }
  required(e) {
    const r = {};
    for (const s of S.objectKeys(this.shape))
      if (e && !e[s])
        r[s] = this.shape[s];
      else {
        let a = this.shape[s];
        for (; a instanceof de; )
          a = a._def.innerType;
        r[s] = a;
      }
    return new E({
      ...this._def,
      shape: () => r
    });
  }
  keyof() {
    return jr(S.objectKeys(this.shape));
  }
}
E.create = (t, e) => new E({
  shape: () => t,
  unknownKeys: "strip",
  catchall: he.create(),
  typeName: k.ZodObject,
  ...w(e)
});
E.strictCreate = (t, e) => new E({
  shape: () => t,
  unknownKeys: "strict",
  catchall: he.create(),
  typeName: k.ZodObject,
  ...w(e)
});
E.lazycreate = (t, e) => new E({
  shape: t,
  unknownKeys: "strip",
  catchall: he.create(),
  typeName: k.ZodObject,
  ...w(e)
});
class ct extends R {
  _parse(e) {
    const { ctx: r } = this._processInputParams(e), s = this._def.options;
    function n(a) {
      for (const o of a)
        if (o.result.status === "valid")
          return o.result;
      for (const o of a)
        if (o.result.status === "dirty")
          return r.common.issues.push(...o.ctx.common.issues), o.result;
      const i = a.map((o) => new X(o.ctx.common.issues));
      return f(r, {
        code: h.invalid_union,
        unionErrors: i
      }), _;
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
      const o = i.map((c) => new X(c));
      return f(r, {
        code: h.invalid_union,
        unionErrors: o
      }), _;
    }
  }
  get options() {
    return this._def.options;
  }
}
ct.create = (t, e) => new ct({
  options: t,
  typeName: k.ZodUnion,
  ...w(e)
});
function Ot(t, e) {
  const r = te(t), s = te(e);
  if (t === e)
    return { valid: !0, data: t };
  if (r === p.object && s === p.object) {
    const n = S.objectKeys(e), a = S.objectKeys(t).filter((o) => n.indexOf(o) !== -1), i = { ...t, ...e };
    for (const o of a) {
      const c = Ot(t[o], e[o]);
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
      const i = t[a], o = e[a], c = Ot(i, o);
      if (!c.valid)
        return { valid: !1 };
      n.push(c.data);
    }
    return { valid: !0, data: n };
  } else return r === p.date && s === p.date && +t == +e ? { valid: !0, data: t } : { valid: !1 };
}
class lt extends R {
  _parse(e) {
    const { status: r, ctx: s } = this._processInputParams(e), n = (a, i) => {
      if (Vt(a) || Vt(i))
        return _;
      const o = Ot(a.value, i.value);
      return o.valid ? ((Ut(a) || Ut(i)) && r.dirty(), { status: r.value, value: o.data }) : (f(s, {
        code: h.invalid_intersection_types
      }), _);
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
lt.create = (t, e, r) => new lt({
  left: t,
  right: e,
  typeName: k.ZodIntersection,
  ...w(r)
});
class ke extends R {
  _parse(e) {
    const { status: r, ctx: s } = this._processInputParams(e);
    if (s.parsedType !== p.array)
      return f(s, {
        code: h.invalid_type,
        expected: p.array,
        received: s.parsedType
      }), _;
    if (s.data.length < this._def.items.length)
      return f(s, {
        code: h.too_small,
        minimum: this._def.items.length,
        inclusive: !0,
        exact: !1,
        type: "array"
      }), _;
    !this._def.rest && s.data.length > this._def.items.length && (f(s, {
      code: h.too_big,
      maximum: this._def.items.length,
      inclusive: !0,
      exact: !1,
      type: "array"
    }), r.dirty());
    const a = [...s.data].map((i, o) => {
      const c = this._def.items[o] || this._def.rest;
      return c ? c._parse(new ue(s, i, s.path, o)) : null;
    }).filter((i) => !!i);
    return s.common.async ? Promise.all(a).then((i) => L.mergeArray(r, i)) : L.mergeArray(r, a);
  }
  get items() {
    return this._def.items;
  }
  rest(e) {
    return new ke({
      ...this._def,
      rest: e
    });
  }
}
ke.create = (t, e) => {
  if (!Array.isArray(t))
    throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
  return new ke({
    items: t,
    typeName: k.ZodTuple,
    rest: null,
    ...w(e)
  });
};
class Jt extends R {
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
      }), _;
    const n = this._def.keyType, a = this._def.valueType, i = [...s.data.entries()].map(([o, c], l) => ({
      key: n._parse(new ue(s, o, s.path, [l, "key"])),
      value: a._parse(new ue(s, c, s.path, [l, "value"]))
    }));
    if (s.common.async) {
      const o = /* @__PURE__ */ new Map();
      return Promise.resolve().then(async () => {
        for (const c of i) {
          const l = await c.key, u = await c.value;
          if (l.status === "aborted" || u.status === "aborted")
            return _;
          (l.status === "dirty" || u.status === "dirty") && r.dirty(), o.set(l.value, u.value);
        }
        return { status: r.value, value: o };
      });
    } else {
      const o = /* @__PURE__ */ new Map();
      for (const c of i) {
        const l = c.key, u = c.value;
        if (l.status === "aborted" || u.status === "aborted")
          return _;
        (l.status === "dirty" || u.status === "dirty") && r.dirty(), o.set(l.value, u.value);
      }
      return { status: r.value, value: o };
    }
  }
}
Jt.create = (t, e, r) => new Jt({
  valueType: e,
  keyType: t,
  typeName: k.ZodMap,
  ...w(r)
});
class qe extends R {
  _parse(e) {
    const { status: r, ctx: s } = this._processInputParams(e);
    if (s.parsedType !== p.set)
      return f(s, {
        code: h.invalid_type,
        expected: p.set,
        received: s.parsedType
      }), _;
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
          return _;
        u.status === "dirty" && r.dirty(), l.add(u.value);
      }
      return { status: r.value, value: l };
    }
    const o = [...s.data.values()].map((c, l) => a._parse(new ue(s, c, s.path, l)));
    return s.common.async ? Promise.all(o).then((c) => i(c)) : i(o);
  }
  min(e, r) {
    return new qe({
      ...this._def,
      minSize: { value: e, message: m.toString(r) }
    });
  }
  max(e, r) {
    return new qe({
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
qe.create = (t, e) => new qe({
  valueType: t,
  minSize: null,
  maxSize: null,
  typeName: k.ZodSet,
  ...w(e)
});
class Kt extends R {
  get schema() {
    return this._def.getter();
  }
  _parse(e) {
    const { ctx: r } = this._processInputParams(e);
    return this._def.getter()._parse({ data: r.data, path: r.path, parent: r });
  }
}
Kt.create = (t, e) => new Kt({
  getter: t,
  typeName: k.ZodLazy,
  ...w(e)
});
class Gt extends R {
  _parse(e) {
    if (e.data !== this._def.value) {
      const r = this._getOrReturnCtx(e);
      return f(r, {
        received: r.data,
        code: h.invalid_literal,
        expected: this._def.value
      }), _;
    }
    return { status: "valid", value: e.data };
  }
  get value() {
    return this._def.value;
  }
}
Gt.create = (t, e) => new Gt({
  value: t,
  typeName: k.ZodLiteral,
  ...w(e)
});
function jr(t, e) {
  return new Pe({
    values: t,
    typeName: k.ZodEnum,
    ...w(e)
  });
}
class Pe extends R {
  _parse(e) {
    if (typeof e.data != "string") {
      const r = this._getOrReturnCtx(e), s = this._def.values;
      return f(r, {
        expected: S.joinValues(s),
        received: r.parsedType,
        code: h.invalid_type
      }), _;
    }
    if (this._cache || (this._cache = new Set(this._def.values)), !this._cache.has(e.data)) {
      const r = this._getOrReturnCtx(e), s = this._def.values;
      return f(r, {
        received: r.data,
        code: h.invalid_enum_value,
        options: s
      }), _;
    }
    return V(e.data);
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
    return Pe.create(e, {
      ...this._def,
      ...r
    });
  }
  exclude(e, r = this._def) {
    return Pe.create(this.options.filter((s) => !e.includes(s)), {
      ...this._def,
      ...r
    });
  }
}
Pe.create = jr;
class Yt extends R {
  _parse(e) {
    const r = S.getValidEnumValues(this._def.values), s = this._getOrReturnCtx(e);
    if (s.parsedType !== p.string && s.parsedType !== p.number) {
      const n = S.objectValues(r);
      return f(s, {
        expected: S.joinValues(n),
        received: s.parsedType,
        code: h.invalid_type
      }), _;
    }
    if (this._cache || (this._cache = new Set(S.getValidEnumValues(this._def.values))), !this._cache.has(e.data)) {
      const n = S.objectValues(r);
      return f(s, {
        received: s.data,
        code: h.invalid_enum_value,
        options: n
      }), _;
    }
    return V(e.data);
  }
  get enum() {
    return this._def.values;
  }
}
Yt.create = (t, e) => new Yt({
  values: t,
  typeName: k.ZodNativeEnum,
  ...w(e)
});
class dt extends R {
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
      }), _;
    const s = r.parsedType === p.promise ? r.data : Promise.resolve(r.data);
    return V(s.then((n) => this._def.type.parseAsync(n, {
      path: r.path,
      errorMap: r.common.contextualErrorMap
    })));
  }
}
dt.create = (t, e) => new dt({
  type: t,
  typeName: k.ZodPromise,
  ...w(e)
});
class $e extends R {
  innerType() {
    return this._def.schema;
  }
  sourceType() {
    return this._def.schema._def.typeName === k.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
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
            return _;
          const c = await this._def.schema._parseAsync({
            data: o,
            path: s.path,
            parent: s
          });
          return c.status === "aborted" ? _ : c.status === "dirty" || r.value === "dirty" ? He(c.value) : c;
        });
      {
        if (r.value === "aborted")
          return _;
        const o = this._def.schema._parseSync({
          data: i,
          path: s.path,
          parent: s
        });
        return o.status === "aborted" ? _ : o.status === "dirty" || r.value === "dirty" ? He(o.value) : o;
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
        return o.status === "aborted" ? _ : (o.status === "dirty" && r.dirty(), i(o.value), { status: r.value, value: o.value });
      } else
        return this._def.schema._parseAsync({ data: s.data, path: s.path, parent: s }).then((o) => o.status === "aborted" ? _ : (o.status === "dirty" && r.dirty(), i(o.value).then(() => ({ status: r.value, value: o.value }))));
    }
    if (n.type === "transform")
      if (s.common.async === !1) {
        const i = this._def.schema._parseSync({
          data: s.data,
          path: s.path,
          parent: s
        });
        if (!Ne(i))
          return _;
        const o = n.transform(i.value, a);
        if (o instanceof Promise)
          throw new Error("Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.");
        return { status: r.value, value: o };
      } else
        return this._def.schema._parseAsync({ data: s.data, path: s.path, parent: s }).then((i) => Ne(i) ? Promise.resolve(n.transform(i.value, a)).then((o) => ({
          status: r.value,
          value: o
        })) : _);
    S.assertNever(n);
  }
}
$e.create = (t, e, r) => new $e({
  schema: t,
  typeName: k.ZodEffects,
  effect: e,
  ...w(r)
});
$e.createWithPreprocess = (t, e, r) => new $e({
  schema: e,
  effect: { type: "preprocess", transform: t },
  typeName: k.ZodEffects,
  ...w(r)
});
class de extends R {
  _parse(e) {
    return this._getType(e) === p.undefined ? V(void 0) : this._def.innerType._parse(e);
  }
  unwrap() {
    return this._def.innerType;
  }
}
de.create = (t, e) => new de({
  innerType: t,
  typeName: k.ZodOptional,
  ...w(e)
});
class Ze extends R {
  _parse(e) {
    return this._getType(e) === p.null ? V(null) : this._def.innerType._parse(e);
  }
  unwrap() {
    return this._def.innerType;
  }
}
Ze.create = (t, e) => new Ze({
  innerType: t,
  typeName: k.ZodNullable,
  ...w(e)
});
class At extends R {
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
At.create = (t, e) => new At({
  innerType: t,
  typeName: k.ZodDefault,
  defaultValue: typeof e.default == "function" ? e.default : () => e.default,
  ...w(e)
});
class Et extends R {
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
    return it(n) ? n.then((a) => ({
      status: "valid",
      value: a.status === "valid" ? a.value : this._def.catchValue({
        get error() {
          return new X(s.common.issues);
        },
        input: s.data
      })
    })) : {
      status: "valid",
      value: n.status === "valid" ? n.value : this._def.catchValue({
        get error() {
          return new X(s.common.issues);
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
  typeName: k.ZodCatch,
  catchValue: typeof e.catch == "function" ? e.catch : () => e.catch,
  ...w(e)
});
class Xt extends R {
  _parse(e) {
    if (this._getType(e) !== p.nan) {
      const s = this._getOrReturnCtx(e);
      return f(s, {
        code: h.invalid_type,
        expected: p.nan,
        received: s.parsedType
      }), _;
    }
    return { status: "valid", value: e.data };
  }
}
Xt.create = (t) => new Xt({
  typeName: k.ZodNaN,
  ...w(t)
});
class Fs extends R {
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
class Nt extends R {
  _parse(e) {
    const { status: r, ctx: s } = this._processInputParams(e);
    if (s.common.async)
      return (async () => {
        const a = await this._def.in._parseAsync({
          data: s.data,
          path: s.path,
          parent: s
        });
        return a.status === "aborted" ? _ : a.status === "dirty" ? (r.dirty(), He(a.value)) : this._def.out._parseAsync({
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
      return n.status === "aborted" ? _ : n.status === "dirty" ? (r.dirty(), {
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
    return new Nt({
      in: e,
      out: r,
      typeName: k.ZodPipeline
    });
  }
}
class Tt extends R {
  _parse(e) {
    const r = this._def.innerType._parse(e), s = (n) => (Ne(n) && (n.value = Object.freeze(n.value)), n);
    return it(r) ? r.then((n) => s(n)) : s(r);
  }
  unwrap() {
    return this._def.innerType;
  }
}
Tt.create = (t, e) => new Tt({
  innerType: t,
  typeName: k.ZodReadonly,
  ...w(e)
});
var k;
(function(t) {
  t.ZodString = "ZodString", t.ZodNumber = "ZodNumber", t.ZodNaN = "ZodNaN", t.ZodBigInt = "ZodBigInt", t.ZodBoolean = "ZodBoolean", t.ZodDate = "ZodDate", t.ZodSymbol = "ZodSymbol", t.ZodUndefined = "ZodUndefined", t.ZodNull = "ZodNull", t.ZodAny = "ZodAny", t.ZodUnknown = "ZodUnknown", t.ZodNever = "ZodNever", t.ZodVoid = "ZodVoid", t.ZodArray = "ZodArray", t.ZodObject = "ZodObject", t.ZodUnion = "ZodUnion", t.ZodDiscriminatedUnion = "ZodDiscriminatedUnion", t.ZodIntersection = "ZodIntersection", t.ZodTuple = "ZodTuple", t.ZodRecord = "ZodRecord", t.ZodMap = "ZodMap", t.ZodSet = "ZodSet", t.ZodFunction = "ZodFunction", t.ZodLazy = "ZodLazy", t.ZodLiteral = "ZodLiteral", t.ZodEnum = "ZodEnum", t.ZodEffects = "ZodEffects", t.ZodNativeEnum = "ZodNativeEnum", t.ZodOptional = "ZodOptional", t.ZodNullable = "ZodNullable", t.ZodDefault = "ZodDefault", t.ZodCatch = "ZodCatch", t.ZodPromise = "ZodPromise", t.ZodBranded = "ZodBranded", t.ZodPipeline = "ZodPipeline", t.ZodReadonly = "ZodReadonly";
})(k || (k = {}));
const Le = le.create, Ct = Ie.create, Bs = Rt.create, qs = St.create;
he.create;
q.create;
const We = E.create;
ct.create;
lt.create;
ke.create;
const ut = Pe.create;
dt.create;
de.create;
Ze.create;
We({
  type: ut([
    "connection_established",
    "live_health_update",
    "historical_data_update",
    "emergency_alert",
    "error"
  ]),
  data: qs().optional(),
  timestamp: Le().datetime().optional()
});
const Nr = We({
  type: ut(["heart_rate", "walking_steadiness", "steps", "oxygen_saturation"]).describe("metric identifier"),
  value: Ct().describe("numeric value for the metric"),
  unit: Le().optional()
}), Ws = We({
  type: Nr.shape.type,
  value: Ct(),
  processedAt: Le().datetime(),
  validated: Bs(),
  healthScore: Ct().optional(),
  fallRisk: ut(["low", "moderate", "high", "critical"]).optional(),
  alert: We({
    level: ut(["warning", "critical"]),
    message: Le()
  }).nullable().optional()
}), Ir = {
  info: (t, e) => console.log(t, _t(e)),
  warn: (t, e) => console.warn(t, _t(e)),
  error: (t, e) => console.error(t, _t(e))
};
function _t(t) {
  if (!t) return {};
  try {
    const e = ["body", "data", "payload", "health", "value", "name", "email", "phone"], r = {};
    for (const [s, n] of Object.entries(t))
      r[s] = e.includes(s) ? "[redacted]" : n;
    return r;
  } catch {
    return {};
  }
}
function Js(t, e) {
  const r = new Headers(t.headers);
  return r.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload"), r.set("X-Content-Type-Options", "nosniff"), r.set("X-Frame-Options", "DENY"), r.set("Referrer-Policy", "no-referrer"), r.set("Permissions-Policy", "geolocation=(), microphone=(), camera=()"), r.set("Content-Security-Policy", e), new Response(t.body, { status: t.status, headers: r });
}
function Qt(t, e) {
  const r = new Headers(), s = t && e.includes(t) ? t : "";
  return s && (r.set("Access-Control-Allow-Origin", s), r.set("Vary", "Origin"), r.set("Access-Control-Allow-Credentials", "true"), r.set("Access-Control-Allow-Headers", "authorization, content-type"), r.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS")), r;
}
async function Pr(t, e = {}) {
  try {
    const r = t.split(".");
    if (r.length !== 3) return { ok: !1 };
    const s = JSON.parse(atob(r[1])), n = Math.floor(Date.now() / 1e3), a = e.clockSkewSec ?? 60;
    return typeof s.exp == "number" && n > s.exp + a ? { ok: !1 } : typeof s.nbf == "number" && n + a < s.nbf ? { ok: !1 } : e.iss && s.iss !== e.iss ? { ok: !1 } : e.aud && s.aud !== e.aud ? { ok: !1 } : { ok: !0, sub: s.sub, claims: s };
  } catch {
    return { ok: !1 };
  }
}
function nt(t) {
  const e = t.length % 4 === 0 ? "" : "=".repeat(4 - t.length % 4), r = t.replace(/-/g, "+").replace(/_/g, "/") + e, s = atob(r), n = new Uint8Array(s.length);
  for (let a = 0; a < s.length; a++) n[a] = s.charCodeAt(a);
  return n;
}
const er = /* @__PURE__ */ new Map();
async function Ks(t, e) {
  const r = t, s = Date.now(), n = er.get(r);
  if (n && s - n.fetchedAt < n.ttlMs && n.keys[e]) return n.keys[e];
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
    return er.set(r, { fetchedAt: s, ttlMs: 300 * 1e3, keys: o }), o[e] || null;
  } catch {
    return null;
  }
}
async function $r(t, e) {
  try {
    const [r, s, n] = t.split(".");
    if (!r || !s || !n) return { ok: !1 };
    const a = JSON.parse(new TextDecoder().decode(nt(r)));
    if (a.alg !== "RS256" || !a.kid) return { ok: !1 };
    const i = await Ks(e.jwksUrl, a.kid);
    if (!i) return { ok: !1 };
    const o = new TextEncoder().encode(`${r}.${s}`), c = nt(n), l = new Uint8Array(o.length);
    l.set(o);
    const u = new Uint8Array(c.length);
    if (u.set(c), !await crypto.subtle.verify("RSASSA-PKCS1-v1_5", i, u, l)) return { ok: !1 };
    const b = JSON.parse(new TextDecoder().decode(nt(s))), N = Math.floor(Date.now() / 1e3), Z = e.clockSkewSec ?? 60;
    return typeof b.exp == "number" && N > b.exp + Z ? { ok: !1 } : typeof b.nbf == "number" && N + Z < b.nbf ? { ok: !1 } : e.iss && b.iss !== e.iss ? { ok: !1 } : e.aud && b.aud !== e.aud ? { ok: !1 } : { ok: !0, sub: b.sub, claims: b };
  } catch {
    return { ok: !1 };
  }
}
function Gs(t) {
  try {
    const e = t.split(".");
    return e.length < 2 ? null : JSON.parse(new TextDecoder().decode(nt(e[1])));
  } catch {
    return null;
  }
}
async function Ys(t, e) {
  try {
    const r = e.at || (/* @__PURE__ */ new Date()).toISOString(), s = JSON.stringify({ type: e.type, at: r, actor: e.actor ?? "anonymous", resource: e.resource ?? "-", meta: e.meta ?? {} }) + `
`;
    if (t.HEALTH_STORAGE) {
      const n = `audit/events/${r}_${Math.random().toString(36).slice(2)}.json`;
      await t.HEALTH_STORAGE.put(n, s, { httpMetadata: { contentType: "application/json" } });
    }
  } catch (r) {
    Ir.warn("audit_write_failed", { error: r.message });
  }
}
async function Zr(t) {
  const e = Uint8Array.from(atob(t), (r) => r.charCodeAt(0));
  if (e.byteLength !== 32) throw new Error("ENC_KEY must be 32 bytes (base64)");
  return crypto.subtle.importKey("raw", e, { name: "AES-GCM" }, !1, ["encrypt", "decrypt"]);
}
async function Lr(t, e) {
  const r = crypto.getRandomValues(new Uint8Array(12)), s = new TextEncoder().encode(JSON.stringify(e)), n = await crypto.subtle.encrypt({ name: "AES-GCM", iv: r }, t, s), a = new Uint8Array(r.byteLength + n.byteLength);
  return a.set(r, 0), a.set(new Uint8Array(n), r.byteLength), btoa(String.fromCharCode(...a));
}
const re = 1440 * 60, Xs = {
  heart_rate: 30 * re,
  steps: 30 * re,
  walking_steadiness: 180 * re,
  sleep: 90 * re,
  activity: 90 * re,
  fall_event: 365 * re
};
function Qs(t, e) {
  const r = Xs[t] ?? 30 * re;
  return e && e !== "production" ? Math.min(r, 2 * re) : r;
}
const F = new vs(), kt = /* @__PURE__ */ new Map();
function tr(t, e = 60, r = 6e4) {
  const s = Date.now(), n = kt.get(t) || { tokens: e, last: s }, a = s - n.last, i = Math.floor(a / r) * e;
  return n.tokens = Math.min(e, n.tokens + i), n.last = s, n.tokens <= 0 ? (kt.set(t, n), !1) : (n.tokens -= 1, kt.set(t, n), !0);
}
async function en(t, e, r = 60, s = 6e4) {
  try {
    if (!t.env.RATE_LIMITER) return tr(e, r, s);
    const n = t.env.RATE_LIMITER.idFromName(e), a = t.env.RATE_LIMITER.get(n), i = new URL("https://do.local/consume");
    i.searchParams.set("key", e), i.searchParams.set("limit", String(r)), i.searchParams.set("intervalMs", String(s));
    const o = await a.fetch(new Request(i.toString()));
    return o.ok ? !!(await o.json().catch(() => ({ ok: !1 }))).ok : !1;
  } catch {
    return tr(e, r, s);
  }
}
function Mr(t) {
  var n;
  const e = t.req.header("Authorization") || "", r = e.startsWith("Bearer ") ? e.slice(7) : "";
  return (r ? (n = Gs(r)) == null ? void 0 : n.sub : void 0) || t.req.header("CF-Connecting-IP") || "anon";
}
async function tn(t) {
  if (t.env.ENVIRONMENT !== "production") return !0;
  const e = t.req.header("Authorization") || "", r = e.startsWith("Bearer ") ? e.slice(7) : "";
  if (!r) return !1;
  const s = t.env.API_JWKS_URL;
  return s ? (await $r(r, { iss: t.env.API_ISS, aud: t.env.API_AUD, jwksUrl: s })).ok : (await Pr(r, { iss: t.env.API_ISS, aud: t.env.API_AUD })).ok;
}
F.use("*", async (t, e) => {
  const r = t.req.header("Origin") || null, s = (t.env.ALLOWED_ORIGINS || "").split(",").map((c) => c.trim()).filter(Boolean), n = crypto.randomUUID();
  if (t.res = t.newResponse(null), t.req.method === "OPTIONS") {
    const c = Qt(r, s);
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
  ].join("; "), i = Js(t.res, a), o = Qt(r, s);
  return i.headers.set("X-Correlation-Id", n), o.forEach((c, l) => i.headers.set(l, c)), i;
});
F.use("/api/*", async (t, e) => {
  const r = Mr(t);
  return await en(t, r) ? await tn(t) ? e() : t.json({ error: "unauthorized" }, 401) : t.json({ error: "rate_limited" }, 429);
});
F.use("/*", async (t, e) => {
  const r = await t.env.ASSETS.fetch(t.req.raw);
  return r.status === 404 ? e() : r;
});
F.get("/health", (t) => t.json({
  status: "healthy",
  timestamp: (/* @__PURE__ */ new Date()).toISOString(),
  environment: t.env.ENVIRONMENT || "unknown"
}));
F.get("/ws", (t) => t.text("WebSocket endpoint not available on Worker. Use local bridge server.", 426));
F.get("/api/_selftest", async (t) => {
  if (t.env.ENVIRONMENT === "production") return t.json({ error: "not_available" }, 404);
  const e = {};
  try {
    const r = t.env.ENC_KEY;
    if (r) {
      const s = await Zr(r), n = { hello: "world", at: Date.now() }, a = await Lr(s, n);
      e.aes_gcm = { ok: !0, ciphertextLength: a.length };
    } else
      e.aes_gcm = { ok: !1, reason: "no_key" };
  } catch (r) {
    e.aes_gcm = { ok: !1, error: r.message };
  }
  try {
    const r = "eyJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJiYSIsImF1ZCI6ImF1ZCIsImV4cCI6MX0.signature", s = t.env.API_JWKS_URL;
    if (s) {
      const n = await $r(r, { iss: "ba", aud: "aud", jwksUrl: s });
      e.jwt_jwks_negative = { ok: !n.ok };
    } else
      e.jwt_claims_negative = { ok: !(await Pr(r)).ok };
  } catch (r) {
    e.jwt_error = { ok: !1, error: r.message };
  }
  return t.json({ ok: !0, results: e });
});
F.get("/api/_ratelimit", async (t) => {
  if (t.env.ENVIRONMENT === "production") return t.json({ error: "not_available" }, 404);
  const e = new URL(t.req.url).searchParams.get("key") || Mr(t);
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
F.get("/api/_audit", async (t) => {
  if (t.env.ENVIRONMENT === "production") return t.json({ error: "not_available" }, 404);
  if (!t.env.HEALTH_STORAGE) return t.json({ error: "no_storage" }, 500);
  const e = new URL(t.req.url), r = Math.max(1, Math.min(100, Number(e.searchParams.get("limit") || 20))), s = e.searchParams.get("withBodies") === "1";
  try {
    const a = ((await t.env.HEALTH_STORAGE.list({ prefix: "audit/events/", limit: 1e3 })).objects || []).sort((o, c) => o.key < c.key ? 1 : -1).slice(0, r);
    if (!s)
      return t.json({ ok: !0, count: a.length, keys: a.map((o) => o.key) });
    const i = [];
    for (const o of a) {
      const c = await t.env.HEALTH_STORAGE.get(o.key);
      if (c && c.body) {
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
F.get("/api/health-data", async (t) => {
  const e = We({
    from: Le().datetime().optional(),
    to: Le().datetime().optional(),
    metric: Nr.shape.type.optional()
  }), r = new URL(t.req.url), s = Object.fromEntries(r.searchParams.entries()), n = e.safeParse(s);
  return n.success ? t.json({
    ok: !0,
    query: n.data,
    data: []
  }) : t.json({ error: "validation_error", details: n.error.flatten() }, 400);
});
F.post("/api/health-data", async (t) => {
  let e;
  try {
    e = await t.req.json();
  } catch {
    return t.json({ error: "invalid_json" }, 400);
  }
  const r = Ws.safeParse(e);
  if (!r.success)
    return t.json({ error: "validation_error", details: r.error.flatten() }, 400);
  try {
    const s = t.env.HEALTH_KV;
    if (s) {
      const a = `health:${r.data.type}:${r.data.processedAt}`, i = t.env.ENC_KEY ? await Zr(t.env.ENC_KEY) : null, o = i ? await Lr(i, r.data) : JSON.stringify(r.data), c = Qs(r.data.type, t.env.ENVIRONMENT);
      await s.put(a, o, { expirationTtl: c });
    }
    const n = t.res.headers.get("X-Correlation-Id") || "";
    await Ys(t.env, { type: "health_data_created", actor: "api", resource: "kv:health", meta: { type: r.data.type, correlationId: n } });
  } catch (s) {
    return Ir.error("KV write failed", { error: s.message }), t.json({ error: "server_error" }, 500);
  }
  return t.json({ ok: !0, data: r.data }, 201);
});
F.get("*", async (t) => {
  const e = new URL("/index.html", t.req.url);
  return t.env.ASSETS.fetch(new Request(e.toString(), t.req.raw));
});
class on {
  constructor(e) {
    g(this, "storage");
    this.storage = e.storage;
  }
  async fetch(e) {
    const r = new URL(e.url), s = r.searchParams.get("key") || "anon", n = Number(r.searchParams.get("limit") || 60), a = Number(r.searchParams.get("intervalMs") || 6e4), i = r.searchParams.get("probe") === "1", o = Date.now(), c = await this.storage.get(s) || { tokens: n, last: o }, l = o - c.last, u = Math.floor(l / a) * n;
    return c.tokens = Math.min(n, c.tokens + u), c.last = o, !i && c.tokens <= 0 ? (await this.storage.put(s, c), new Response(JSON.stringify({ ok: !1 }), { status: 429, headers: { "content-type": "application/json" } })) : (i || (c.tokens -= 1, await this.storage.put(s, c)), new Response(JSON.stringify({ ok: !0, remaining: c.tokens }), { status: 200, headers: { "content-type": "application/json" } }));
  }
}
export {
  on as RateLimiter,
  F as default
};
//# sourceMappingURL=index.js.map

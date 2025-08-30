var Er = Object.defineProperty;
var Tt = (t) => {
  throw TypeError(t);
};
var Cr = (t, e, r) => e in t ? Er(t, e, { enumerable: !0, configurable: !0, writable: !0, value: r }) : t[e] = r;
var y = (t, e, r) => Cr(t, typeof e != "symbol" ? e + "" : e, r), ft = (t, e, r) => e.has(t) || Tt("Cannot " + r);
var u = (t, e, r) => (ft(t, e, "read from private field"), r ? r.call(t) : e.get(t)), k = (t, e, r) => e.has(t) ? Tt("Cannot add the same private member more than once") : e instanceof WeakSet ? e.add(t) : e.set(t, r), g = (t, e, r, s) => (ft(t, e, "write to private field"), s ? s.call(t, r) : e.set(t, r), r), O = (t, e, r) => (ft(t, e, "access private method"), r);
var jt = (t, e, r, s) => ({
  set _(n) {
    g(t, e, n, r);
  },
  get _() {
    return u(t, e, s);
  }
});
var Nt = (t, e, r) => (s, n) => {
  let a = -1;
  return i(0);
  async function i(o) {
    if (o <= a)
      throw new Error("next() called multiple times");
    a = o;
    let c, d = !1, l;
    if (t[o] ? (l = t[o][0][0], s.req.routeIndex = o) : l = o === t.length && n || void 0, l)
      try {
        c = await l(s, () => i(o + 1));
      } catch (v) {
        if (v instanceof Error && e)
          s.error = v, c = await e(v, s), d = !0;
        else
          throw v;
      }
    else
      s.finalized === !1 && r && (c = await r(s));
    return c && (s.finalized === !1 || d) && (s.res = c), s;
  }
}, Ar = Symbol(), Tr = async (t, e = /* @__PURE__ */ Object.create(null)) => {
  const { all: r = !1, dot: s = !1 } = e, a = (t instanceof dr ? t.raw.headers : t.headers).get("Content-Type");
  return a != null && a.startsWith("multipart/form-data") || a != null && a.startsWith("application/x-www-form-urlencoded") ? jr(t, { all: r, dot: s }) : {};
};
async function jr(t, e) {
  const r = await t.formData();
  return r ? Nr(r, e) : {};
}
function Nr(t, e) {
  const r = /* @__PURE__ */ Object.create(null);
  return t.forEach((s, n) => {
    e.all || n.endsWith("[]") ? Ir(r, n, s) : r[n] = s;
  }), e.dot && Object.entries(r).forEach(([s, n]) => {
    s.includes(".") && ($r(r, s, n), delete r[s]);
  }), r;
}
var Ir = (t, e, r) => {
  t[e] !== void 0 ? Array.isArray(t[e]) ? t[e].push(r) : t[e] = [t[e], r] : e.endsWith("[]") ? t[e] = [r] : t[e] = r;
}, $r = (t, e, r) => {
  let s = t;
  const n = e.split(".");
  n.forEach((a, i) => {
    i === n.length - 1 ? s[a] = r : ((!s[a] || typeof s[a] != "object" || Array.isArray(s[a]) || s[a] instanceof File) && (s[a] = /* @__PURE__ */ Object.create(null)), s = s[a]);
  });
}, nr = (t) => {
  const e = t.split("/");
  return e[0] === "" && e.shift(), e;
}, Zr = (t) => {
  const { groups: e, path: r } = Pr(t), s = nr(r);
  return Lr(s, e);
}, Pr = (t) => {
  const e = [];
  return t = t.replace(/\{[^}]+\}/g, (r, s) => {
    const n = `@${s}`;
    return e.push([n, r]), n;
  }), { groups: e, path: t };
}, Lr = (t, e) => {
  for (let r = e.length - 1; r >= 0; r--) {
    const [s] = e[r];
    for (let n = t.length - 1; n >= 0; n--)
      if (t[n].includes(s)) {
        t[n] = t[n].replace(s, e[r][1]);
        break;
      }
  }
  return t;
}, Qe = {}, Mr = (t, e) => {
  if (t === "*")
    return "*";
  const r = t.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (r) {
    const s = `${t}#${e}`;
    return Qe[s] || (r[2] ? Qe[s] = e && e[0] !== ":" && e[0] !== "*" ? [s, r[1], new RegExp(`^${r[2]}(?=/${e})`)] : [t, r[1], new RegExp(`^${r[2]}$`)] : Qe[s] = [t, r[1], !0]), Qe[s];
  }
  return null;
}, Et = (t, e) => {
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
}, Dr = (t) => Et(t, decodeURI), ar = (t) => {
  const e = t.url, r = e.indexOf(
    "/",
    e.charCodeAt(9) === 58 ? 13 : 8
  );
  let s = r;
  for (; s < e.length; s++) {
    const n = e.charCodeAt(s);
    if (n === 37) {
      const a = e.indexOf("?", s), i = e.slice(r, a === -1 ? void 0 : a);
      return Dr(i.includes("%25") ? i.replace(/%25/g, "%2525") : i);
    } else if (n === 63)
      break;
  }
  return e.slice(r, s);
}, Vr = (t) => {
  const e = ar(t);
  return e.length > 1 && e.at(-1) === "/" ? e.slice(0, -1) : e;
}, ke = (t, e, ...r) => (r.length && (e = ke(e, ...r)), `${(t == null ? void 0 : t[0]) === "/" ? "" : "/"}${t}${e === "/" ? "" : `${(t == null ? void 0 : t.at(-1)) === "/" ? "" : "/"}${(e == null ? void 0 : e[0]) === "/" ? e.slice(1) : e}`}`), ir = (t) => {
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
}, pt = (t) => /[%+]/.test(t) ? (t.indexOf("+") !== -1 && (t = t.replace(/\+/g, " ")), t.indexOf("%") !== -1 ? Et(t, cr) : t) : t, or = (t, e, r) => {
  let s;
  if (!r && e && !/[%+]/.test(e)) {
    let i = t.indexOf(`?${e}`, 8);
    for (i === -1 && (i = t.indexOf(`&${e}`, 8)); i !== -1; ) {
      const o = t.charCodeAt(i + e.length + 1);
      if (o === 61) {
        const c = i + e.length + 2, d = t.indexOf("&", c);
        return pt(t.slice(c, d === -1 ? void 0 : d));
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
    if (s && (c = pt(c)), a = i, c === "")
      continue;
    let d;
    o === -1 ? d = "" : (d = t.slice(o + 1, i === -1 ? void 0 : i), s && (d = pt(d))), r ? (n[c] && Array.isArray(n[c]) || (n[c] = []), n[c].push(d)) : n[c] ?? (n[c] = d);
  }
  return e ? n[e] : n;
}, zr = or, Ur = (t, e) => or(t, e, !0), cr = decodeURIComponent, It = (t) => Et(t, cr), Oe, M, X, ur, lr, yt, te, Jt, dr = (Jt = class {
  constructor(t, e = "/", r = [[]]) {
    k(this, X);
    y(this, "raw");
    k(this, Oe);
    k(this, M);
    y(this, "routeIndex", 0);
    y(this, "path");
    y(this, "bodyCache", {});
    k(this, te, (t) => {
      const { bodyCache: e, raw: r } = this, s = e[t];
      if (s)
        return s;
      const n = Object.keys(e)[0];
      return n ? e[n].then((a) => (n === "json" && (a = JSON.stringify(a)), new Response(a)[t]())) : e[t] = r[t]();
    });
    this.raw = t, this.path = e, g(this, M, r), g(this, Oe, {});
  }
  param(t) {
    return t ? O(this, X, ur).call(this, t) : O(this, X, lr).call(this);
  }
  query(t) {
    return zr(this.url, t);
  }
  queries(t) {
    return Ur(this.url, t);
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
    return (e = this.bodyCache).parsedBody ?? (e.parsedBody = await Tr(this, t));
  }
  json() {
    return u(this, te).call(this, "text").then((t) => JSON.parse(t));
  }
  text() {
    return u(this, te).call(this, "text");
  }
  arrayBuffer() {
    return u(this, te).call(this, "arrayBuffer");
  }
  blob() {
    return u(this, te).call(this, "blob");
  }
  formData() {
    return u(this, te).call(this, "formData");
  }
  addValidatedData(t, e) {
    u(this, Oe)[t] = e;
  }
  valid(t) {
    return u(this, Oe)[t];
  }
  get url() {
    return this.raw.url;
  }
  get method() {
    return this.raw.method;
  }
  get [Ar]() {
    return u(this, M);
  }
  get matchedRoutes() {
    return u(this, M)[0].map(([[, t]]) => t);
  }
  get routePath() {
    return u(this, M)[0].map(([[, t]]) => t)[this.routeIndex].path;
  }
}, Oe = new WeakMap(), M = new WeakMap(), X = new WeakSet(), ur = function(t) {
  const e = u(this, M)[0][this.routeIndex][1][t], r = O(this, X, yt).call(this, e);
  return r ? /\%/.test(r) ? It(r) : r : void 0;
}, lr = function() {
  const t = {}, e = Object.keys(u(this, M)[0][this.routeIndex][1]);
  for (const r of e) {
    const s = O(this, X, yt).call(this, u(this, M)[0][this.routeIndex][1][r]);
    s && typeof s == "string" && (t[r] = /\%/.test(s) ? It(s) : s);
  }
  return t;
}, yt = function(t) {
  return u(this, M)[1] ? u(this, M)[1][t] : t;
}, te = new WeakMap(), Jt), Hr = {
  Stringify: 1
}, hr = async (t, e, r, s, n) => {
  typeof t == "object" && !(t instanceof String) && (t instanceof Promise || (t = t.toString()), t instanceof Promise && (t = await t));
  const a = t.callbacks;
  return a != null && a.length ? (n ? n[0] += t : n = [t], Promise.all(a.map((o) => o({ phase: e, buffer: n, context: s }))).then(
    (o) => Promise.all(
      o.filter(Boolean).map((c) => hr(c, e, !1, s, n))
    ).then(() => n[0])
  )) : Promise.resolve(t);
}, Fr = "text/plain; charset=UTF-8", mt = (t, e) => ({
  "Content-Type": t,
  ...e
}), qe, Ge, q, Se, G, I, Je, Ee, Ce, fe, Ke, Ye, re, be, Kt, Br = (Kt = class {
  constructor(t, e) {
    k(this, re);
    k(this, qe);
    k(this, Ge);
    y(this, "env", {});
    k(this, q);
    y(this, "finalized", !1);
    y(this, "error");
    k(this, Se);
    k(this, G);
    k(this, I);
    k(this, Je);
    k(this, Ee);
    k(this, Ce);
    k(this, fe);
    k(this, Ke);
    k(this, Ye);
    y(this, "render", (...t) => (u(this, Ee) ?? g(this, Ee, (e) => this.html(e)), u(this, Ee).call(this, ...t)));
    y(this, "setLayout", (t) => g(this, Je, t));
    y(this, "getLayout", () => u(this, Je));
    y(this, "setRenderer", (t) => {
      g(this, Ee, t);
    });
    y(this, "header", (t, e, r) => {
      this.finalized && g(this, I, new Response(u(this, I).body, u(this, I)));
      const s = u(this, I) ? u(this, I).headers : u(this, fe) ?? g(this, fe, new Headers());
      e === void 0 ? s.delete(t) : r != null && r.append ? s.append(t, e) : s.set(t, e);
    });
    y(this, "status", (t) => {
      g(this, Se, t);
    });
    y(this, "set", (t, e) => {
      u(this, q) ?? g(this, q, /* @__PURE__ */ new Map()), u(this, q).set(t, e);
    });
    y(this, "get", (t) => u(this, q) ? u(this, q).get(t) : void 0);
    y(this, "newResponse", (...t) => O(this, re, be).call(this, ...t));
    y(this, "body", (t, e, r) => O(this, re, be).call(this, t, e, r));
    y(this, "text", (t, e, r) => !u(this, fe) && !u(this, Se) && !e && !r && !this.finalized ? new Response(t) : O(this, re, be).call(this, t, e, mt(Fr, r)));
    y(this, "json", (t, e, r) => O(this, re, be).call(this, JSON.stringify(t), e, mt("application/json", r)));
    y(this, "html", (t, e, r) => {
      const s = (n) => O(this, re, be).call(this, n, e, mt("text/html; charset=UTF-8", r));
      return typeof t == "object" ? hr(t, Hr.Stringify, !1, {}).then(s) : s(t);
    });
    y(this, "redirect", (t, e) => {
      const r = String(t);
      return this.header(
        "Location",
        /[^\x00-\xFF]/.test(r) ? encodeURI(r) : r
      ), this.newResponse(null, e ?? 302);
    });
    y(this, "notFound", () => (u(this, Ce) ?? g(this, Ce, () => new Response()), u(this, Ce).call(this, this)));
    g(this, qe, t), e && (g(this, G, e.executionCtx), this.env = e.env, g(this, Ce, e.notFoundHandler), g(this, Ye, e.path), g(this, Ke, e.matchResult));
  }
  get req() {
    return u(this, Ge) ?? g(this, Ge, new dr(u(this, qe), u(this, Ye), u(this, Ke))), u(this, Ge);
  }
  get event() {
    if (u(this, G) && "respondWith" in u(this, G))
      return u(this, G);
    throw Error("This context has no FetchEvent");
  }
  get executionCtx() {
    if (u(this, G))
      return u(this, G);
    throw Error("This context has no ExecutionContext");
  }
  get res() {
    return u(this, I) || g(this, I, new Response(null, {
      headers: u(this, fe) ?? g(this, fe, new Headers())
    }));
  }
  set res(t) {
    if (u(this, I) && t) {
      t = new Response(t.body, t);
      for (const [e, r] of u(this, I).headers.entries())
        if (e !== "content-type")
          if (e === "set-cookie") {
            const s = u(this, I).headers.getSetCookie();
            t.headers.delete("set-cookie");
            for (const n of s)
              t.headers.append("set-cookie", n);
          } else
            t.headers.set(e, r);
    }
    g(this, I, t), this.finalized = !0;
  }
  get var() {
    return u(this, q) ? Object.fromEntries(u(this, q)) : {};
  }
}, qe = new WeakMap(), Ge = new WeakMap(), q = new WeakMap(), Se = new WeakMap(), G = new WeakMap(), I = new WeakMap(), Je = new WeakMap(), Ee = new WeakMap(), Ce = new WeakMap(), fe = new WeakMap(), Ke = new WeakMap(), Ye = new WeakMap(), re = new WeakSet(), be = function(t, e, r) {
  const s = u(this, I) ? new Headers(u(this, I).headers) : u(this, fe) ?? new Headers();
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
  const n = typeof e == "number" ? e : (e == null ? void 0 : e.status) ?? u(this, Se);
  return new Response(t, { status: n, headers: s });
}, Kt), A = "ALL", Wr = "all", qr = ["get", "post", "put", "delete", "options", "patch"], fr = "Can not add a route since the matcher is already built.", pr = class extends Error {
}, Gr = "__COMPOSED_HANDLER", Jr = (t) => t.text("404 Not Found", 404), $t = (t, e) => {
  if ("getResponse" in t) {
    const r = t.getResponse();
    return e.newResponse(r.body, r);
  }
  return console.error(t), e.text("Internal Server Error", 500);
}, V, T, gr, z, le, et, tt, Yt, mr = (Yt = class {
  constructor(e = {}) {
    k(this, T);
    y(this, "get");
    y(this, "post");
    y(this, "put");
    y(this, "delete");
    y(this, "options");
    y(this, "patch");
    y(this, "all");
    y(this, "on");
    y(this, "use");
    y(this, "router");
    y(this, "getPath");
    y(this, "_basePath", "/");
    k(this, V, "/");
    y(this, "routes", []);
    k(this, z, Jr);
    y(this, "errorHandler", $t);
    y(this, "onError", (e) => (this.errorHandler = e, this));
    y(this, "notFound", (e) => (g(this, z, e), this));
    y(this, "fetch", (e, ...r) => O(this, T, tt).call(this, e, r[1], r[0], e.method));
    y(this, "request", (e, r, s, n) => e instanceof Request ? this.fetch(r ? new Request(e, r) : e, s, n) : (e = e.toString(), this.fetch(
      new Request(
        /^https?:\/\//.test(e) ? e : `http://localhost${ke("/", e)}`,
        r
      ),
      s,
      n
    )));
    y(this, "fire", () => {
      addEventListener("fetch", (e) => {
        e.respondWith(O(this, T, tt).call(this, e.request, e, void 0, e.request.method));
      });
    });
    [...qr, Wr].forEach((a) => {
      this[a] = (i, ...o) => (typeof i == "string" ? g(this, V, i) : O(this, T, le).call(this, a, u(this, V), i), o.forEach((c) => {
        O(this, T, le).call(this, a, u(this, V), c);
      }), this);
    }), this.on = (a, i, ...o) => {
      for (const c of [i].flat()) {
        g(this, V, c);
        for (const d of [a].flat())
          o.map((l) => {
            O(this, T, le).call(this, d.toUpperCase(), u(this, V), l);
          });
      }
      return this;
    }, this.use = (a, ...i) => (typeof a == "string" ? g(this, V, a) : (g(this, V, "*"), i.unshift(a)), i.forEach((o) => {
      O(this, T, le).call(this, A, u(this, V), o);
    }), this);
    const { strict: s, ...n } = e;
    Object.assign(this, n), this.getPath = s ?? !0 ? e.getPath ?? ar : Vr;
  }
  route(e, r) {
    const s = this.basePath(e);
    return r.routes.map((n) => {
      var i;
      let a;
      r.errorHandler === $t ? a = n.handler : (a = async (o, c) => (await Nt([], r.errorHandler)(o, () => n.handler(o, c))).res, a[Gr] = n.handler), O(i = s, T, le).call(i, n.method, n.path, a);
    }), this;
  }
  basePath(e) {
    const r = O(this, T, gr).call(this);
    return r._basePath = ke(this._basePath, e), r;
  }
  mount(e, r, s) {
    let n, a;
    s && (typeof s == "function" ? a = s : (a = s.optionHandler, s.replaceRequest === !1 ? n = (c) => c : n = s.replaceRequest));
    const i = a ? (c) => {
      const d = a(c);
      return Array.isArray(d) ? d : [d];
    } : (c) => {
      let d;
      try {
        d = c.executionCtx;
      } catch {
      }
      return [c.env, d];
    };
    n || (n = (() => {
      const c = ke(this._basePath, e), d = c === "/" ? 0 : c.length;
      return (l) => {
        const v = new URL(l.url);
        return v.pathname = v.pathname.slice(d) || "/", new Request(v, l);
      };
    })());
    const o = async (c, d) => {
      const l = await r(n(c.req.raw), ...i(c));
      if (l)
        return l;
      await d();
    };
    return O(this, T, le).call(this, A, ke(e, "*"), o), this;
  }
}, V = new WeakMap(), T = new WeakSet(), gr = function() {
  const e = new mr({
    router: this.router,
    getPath: this.getPath
  });
  return e.errorHandler = this.errorHandler, g(e, z, u(this, z)), e.routes = this.routes, e;
}, z = new WeakMap(), le = function(e, r, s) {
  e = e.toUpperCase(), r = ke(this._basePath, r);
  const n = { basePath: this._basePath, path: r, method: e, handler: s };
  this.router.add(e, r, [s, n]), this.routes.push(n);
}, et = function(e, r) {
  if (e instanceof Error)
    return this.errorHandler(e, r);
  throw e;
}, tt = function(e, r, s, n) {
  if (n === "HEAD")
    return (async () => new Response(null, await O(this, T, tt).call(this, e, r, s, "GET")))();
  const a = this.getPath(e, { env: s }), i = this.router.match(n, a), o = new Br(e, {
    path: a,
    matchResult: i,
    env: s,
    executionCtx: r,
    notFoundHandler: u(this, z)
  });
  if (i[0].length === 1) {
    let d;
    try {
      d = i[0][0][0][0](o, async () => {
        o.res = await u(this, z).call(this, o);
      });
    } catch (l) {
      return O(this, T, et).call(this, l, o);
    }
    return d instanceof Promise ? d.then(
      (l) => l || (o.finalized ? o.res : u(this, z).call(this, o))
    ).catch((l) => O(this, T, et).call(this, l, o)) : d ?? u(this, z).call(this, o);
  }
  const c = Nt(i[0], this.errorHandler, u(this, z));
  return (async () => {
    try {
      const d = await c(o);
      if (!d.finalized)
        throw new Error(
          "Context is not finalized. Did you forget to return a Response object or `await next()`?"
        );
      return d.res;
    } catch (d) {
      return O(this, T, et).call(this, d, o);
    }
  })();
}, Yt), st = "[^/]+", Ue = ".*", He = "(?:|/.*)", we = Symbol(), Kr = new Set(".\\+*[^]$()");
function Yr(t, e) {
  return t.length === 1 ? e.length === 1 ? t < e ? -1 : 1 : -1 : e.length === 1 || t === Ue || t === He ? 1 : e === Ue || e === He ? -1 : t === st ? 1 : e === st ? -1 : t.length === e.length ? t < e ? -1 : 1 : e.length - t.length;
}
var pe, me, U, Xt, vt = (Xt = class {
  constructor() {
    k(this, pe);
    k(this, me);
    k(this, U, /* @__PURE__ */ Object.create(null));
  }
  insert(e, r, s, n, a) {
    if (e.length === 0) {
      if (u(this, pe) !== void 0)
        throw we;
      if (a)
        return;
      g(this, pe, r);
      return;
    }
    const [i, ...o] = e, c = i === "*" ? o.length === 0 ? ["", "", Ue] : ["", "", st] : i === "/*" ? ["", "", He] : i.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
    let d;
    if (c) {
      const l = c[1];
      let v = c[2] || st;
      if (l && c[2] && (v === ".*" || (v = v.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:"), /\((?!\?:)/.test(v))))
        throw we;
      if (d = u(this, U)[v], !d) {
        if (Object.keys(u(this, U)).some(
          (S) => S !== Ue && S !== He
        ))
          throw we;
        if (a)
          return;
        d = u(this, U)[v] = new vt(), l !== "" && g(d, me, n.varIndex++);
      }
      !a && l !== "" && s.push([l, u(d, me)]);
    } else if (d = u(this, U)[i], !d) {
      if (Object.keys(u(this, U)).some(
        (l) => l.length > 1 && l !== Ue && l !== He
      ))
        throw we;
      if (a)
        return;
      d = u(this, U)[i] = new vt();
    }
    d.insert(o, r, s, n, a);
  }
  buildRegExpStr() {
    const r = Object.keys(u(this, U)).sort(Yr).map((s) => {
      const n = u(this, U)[s];
      return (typeof u(n, me) == "number" ? `(${s})@${u(n, me)}` : Kr.has(s) ? `\\${s}` : s) + n.buildRegExpStr();
    });
    return typeof u(this, pe) == "number" && r.unshift(`#${u(this, pe)}`), r.length === 0 ? "" : r.length === 1 ? r[0] : "(?:" + r.join("|") + ")";
  }
}, pe = new WeakMap(), me = new WeakMap(), U = new WeakMap(), Xt), ut, Xe, Qt, Xr = (Qt = class {
  constructor() {
    k(this, ut, { varIndex: 0 });
    k(this, Xe, new vt());
  }
  insert(t, e, r) {
    const s = [], n = [];
    for (let i = 0; ; ) {
      let o = !1;
      if (t = t.replace(/\{[^}]+\}/g, (c) => {
        const d = `@\\${i}`;
        return n[i] = [d, c], i++, o = !0, d;
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
    return u(this, Xe).insert(a, e, s, u(this, ut), r), s;
  }
  buildRegExp() {
    let t = u(this, Xe).buildRegExpStr();
    if (t === "")
      return [/^$/, [], []];
    let e = 0;
    const r = [], s = [];
    return t = t.replace(/#(\d+)|@(\d+)|\.\*\$/g, (n, a, i) => a !== void 0 ? (r[++e] = Number(a), "$()") : (i !== void 0 && (s[Number(i)] = ++e), "")), [new RegExp(`^${t}`), r, s];
  }
}, ut = new WeakMap(), Xe = new WeakMap(), Qt), yr = [], Qr = [/^$/, [], /* @__PURE__ */ Object.create(null)], rt = /* @__PURE__ */ Object.create(null);
function vr(t) {
  return rt[t] ?? (rt[t] = new RegExp(
    t === "*" ? "" : `^${t.replace(
      /\/\*$|([.\\+*[^\]$()])/g,
      (e, r) => r ? `\\${r}` : "(?:|/.*)"
    )}$`
  ));
}
function es() {
  rt = /* @__PURE__ */ Object.create(null);
}
function ts(t) {
  var d;
  const e = new Xr(), r = [];
  if (t.length === 0)
    return Qr;
  const s = t.map(
    (l) => [!/\*|\/:/.test(l[0]), ...l]
  ).sort(
    ([l, v], [S, Z]) => l ? 1 : S ? -1 : v.length - Z.length
  ), n = /* @__PURE__ */ Object.create(null);
  for (let l = 0, v = -1, S = s.length; l < S; l++) {
    const [Z, H, E] = s[l];
    Z ? n[H] = [E.map(([L]) => [L, /* @__PURE__ */ Object.create(null)]), yr] : v++;
    let $;
    try {
      $ = e.insert(H, v, Z);
    } catch (L) {
      throw L === we ? new pr(H) : L;
    }
    Z || (r[v] = E.map(([L, _e]) => {
      const Me = /* @__PURE__ */ Object.create(null);
      for (_e -= 1; _e >= 0; _e--) {
        const [F, lt] = $[_e];
        Me[F] = lt;
      }
      return [L, Me];
    }));
  }
  const [a, i, o] = e.buildRegExp();
  for (let l = 0, v = r.length; l < v; l++)
    for (let S = 0, Z = r[l].length; S < Z; S++) {
      const H = (d = r[l][S]) == null ? void 0 : d[1];
      if (!H)
        continue;
      const E = Object.keys(H);
      for (let $ = 0, L = E.length; $ < L; $++)
        H[E[$]] = o[H[E[$]]];
    }
  const c = [];
  for (const l in i)
    c[l] = r[i[l]];
  return [a, c, n];
}
function xe(t, e) {
  if (t) {
    for (const r of Object.keys(t).sort((s, n) => n.length - s.length))
      if (vr(r).test(e))
        return [...t[r]];
  }
}
var se, ne, Pe, _r, xr, er, rs = (er = class {
  constructor() {
    k(this, Pe);
    y(this, "name", "RegExpRouter");
    k(this, se);
    k(this, ne);
    g(this, se, { [A]: /* @__PURE__ */ Object.create(null) }), g(this, ne, { [A]: /* @__PURE__ */ Object.create(null) });
  }
  add(t, e, r) {
    var o;
    const s = u(this, se), n = u(this, ne);
    if (!s || !n)
      throw new Error(fr);
    s[t] || [s, n].forEach((c) => {
      c[t] = /* @__PURE__ */ Object.create(null), Object.keys(c[A]).forEach((d) => {
        c[t][d] = [...c[A][d]];
      });
    }), e === "/*" && (e = "*");
    const a = (e.match(/\/:/g) || []).length;
    if (/\*$/.test(e)) {
      const c = vr(e);
      t === A ? Object.keys(s).forEach((d) => {
        var l;
        (l = s[d])[e] || (l[e] = xe(s[d], e) || xe(s[A], e) || []);
      }) : (o = s[t])[e] || (o[e] = xe(s[t], e) || xe(s[A], e) || []), Object.keys(s).forEach((d) => {
        (t === A || t === d) && Object.keys(s[d]).forEach((l) => {
          c.test(l) && s[d][l].push([r, a]);
        });
      }), Object.keys(n).forEach((d) => {
        (t === A || t === d) && Object.keys(n[d]).forEach(
          (l) => c.test(l) && n[d][l].push([r, a])
        );
      });
      return;
    }
    const i = ir(e) || [e];
    for (let c = 0, d = i.length; c < d; c++) {
      const l = i[c];
      Object.keys(n).forEach((v) => {
        var S;
        (t === A || t === v) && ((S = n[v])[l] || (S[l] = [
          ...xe(s[v], l) || xe(s[A], l) || []
        ]), n[v][l].push([r, a - d + c + 1]));
      });
    }
  }
  match(t, e) {
    es();
    const r = O(this, Pe, _r).call(this);
    return this.match = (s, n) => {
      const a = r[s] || r[A], i = a[2][n];
      if (i)
        return i;
      const o = n.match(a[0]);
      if (!o)
        return [[], yr];
      const c = o.indexOf("", 1);
      return [a[1][c], o];
    }, this.match(t, e);
  }
}, se = new WeakMap(), ne = new WeakMap(), Pe = new WeakSet(), _r = function() {
  const t = /* @__PURE__ */ Object.create(null);
  return Object.keys(u(this, ne)).concat(Object.keys(u(this, se))).forEach((e) => {
    t[e] || (t[e] = O(this, Pe, xr).call(this, e));
  }), g(this, se, g(this, ne, void 0)), t;
}, xr = function(t) {
  const e = [];
  let r = t === A;
  return [u(this, se), u(this, ne)].forEach((s) => {
    const n = s[t] ? Object.keys(s[t]).map((a) => [a, s[t][a]]) : [];
    n.length !== 0 ? (r || (r = !0), e.push(...n)) : t !== A && e.push(
      ...Object.keys(s[A]).map((a) => [a, s[A][a]])
    );
  }), r ? ts(e) : null;
}, er), ae, J, tr, ss = (tr = class {
  constructor(t) {
    y(this, "name", "SmartRouter");
    k(this, ae, []);
    k(this, J, []);
    g(this, ae, t.routers);
  }
  add(t, e, r) {
    if (!u(this, J))
      throw new Error(fr);
    u(this, J).push([t, e, r]);
  }
  match(t, e) {
    if (!u(this, J))
      throw new Error("Fatal error");
    const r = u(this, ae), s = u(this, J), n = r.length;
    let a = 0, i;
    for (; a < n; a++) {
      const o = r[a];
      try {
        for (let c = 0, d = s.length; c < d; c++)
          o.add(...s[c]);
        i = o.match(t, e);
      } catch (c) {
        if (c instanceof pr)
          continue;
        throw c;
      }
      this.match = o.match.bind(o), g(this, ae, [o]), g(this, J, void 0);
      break;
    }
    if (a === n)
      throw new Error("Fatal error");
    return this.name = `SmartRouter + ${this.activeRouter.name}`, i;
  }
  get activeRouter() {
    if (u(this, J) || u(this, ae).length !== 1)
      throw new Error("No active router has been determined yet.");
    return u(this, ae)[0];
  }
}, ae = new WeakMap(), J = new WeakMap(), tr), Ve = /* @__PURE__ */ Object.create(null), ie, N, ge, Ae, j, K, he, rr, kr = (rr = class {
  constructor(t, e, r) {
    k(this, K);
    k(this, ie);
    k(this, N);
    k(this, ge);
    k(this, Ae, 0);
    k(this, j, Ve);
    if (g(this, N, r || /* @__PURE__ */ Object.create(null)), g(this, ie, []), t && e) {
      const s = /* @__PURE__ */ Object.create(null);
      s[t] = { handler: e, possibleKeys: [], score: 0 }, g(this, ie, [s]);
    }
    g(this, ge, []);
  }
  insert(t, e, r) {
    g(this, Ae, ++jt(this, Ae)._);
    let s = this;
    const n = Zr(e), a = [];
    for (let i = 0, o = n.length; i < o; i++) {
      const c = n[i], d = n[i + 1], l = Mr(c, d), v = Array.isArray(l) ? l[0] : c;
      if (v in u(s, N)) {
        s = u(s, N)[v], l && a.push(l[1]);
        continue;
      }
      u(s, N)[v] = new kr(), l && (u(s, ge).push(l), a.push(l[1])), s = u(s, N)[v];
    }
    return u(s, ie).push({
      [t]: {
        handler: r,
        possibleKeys: a.filter((i, o, c) => c.indexOf(i) === o),
        score: u(this, Ae)
      }
    }), s;
  }
  search(t, e) {
    var o;
    const r = [];
    g(this, j, Ve);
    let n = [this];
    const a = nr(e), i = [];
    for (let c = 0, d = a.length; c < d; c++) {
      const l = a[c], v = c === d - 1, S = [];
      for (let Z = 0, H = n.length; Z < H; Z++) {
        const E = n[Z], $ = u(E, N)[l];
        $ && (g($, j, u(E, j)), v ? (u($, N)["*"] && r.push(
          ...O(this, K, he).call(this, u($, N)["*"], t, u(E, j))
        ), r.push(...O(this, K, he).call(this, $, t, u(E, j)))) : S.push($));
        for (let L = 0, _e = u(E, ge).length; L < _e; L++) {
          const Me = u(E, ge)[L], F = u(E, j) === Ve ? {} : { ...u(E, j) };
          if (Me === "*") {
            const Q = u(E, N)["*"];
            Q && (r.push(...O(this, K, he).call(this, Q, t, u(E, j))), g(Q, j, F), S.push(Q));
            continue;
          }
          const [lt, At, De] = Me;
          if (!l && !(De instanceof RegExp))
            continue;
          const W = u(E, N)[lt], Sr = a.slice(c).join("/");
          if (De instanceof RegExp) {
            const Q = De.exec(Sr);
            if (Q) {
              if (F[At] = Q[0], r.push(...O(this, K, he).call(this, W, t, u(E, j), F)), Object.keys(u(W, N)).length) {
                g(W, j, F);
                const ht = ((o = Q[0].match(/\//)) == null ? void 0 : o.length) ?? 0;
                (i[ht] || (i[ht] = [])).push(W);
              }
              continue;
            }
          }
          (De === !0 || De.test(l)) && (F[At] = l, v ? (r.push(...O(this, K, he).call(this, W, t, F, u(E, j))), u(W, N)["*"] && r.push(
            ...O(this, K, he).call(this, u(W, N)["*"], t, F, u(E, j))
          )) : (g(W, j, F), S.push(W)));
        }
      }
      n = S.concat(i.shift() ?? []);
    }
    return r.length > 1 && r.sort((c, d) => c.score - d.score), [r.map(({ handler: c, params: d }) => [c, d])];
  }
}, ie = new WeakMap(), N = new WeakMap(), ge = new WeakMap(), Ae = new WeakMap(), j = new WeakMap(), K = new WeakSet(), he = function(t, e, r, s) {
  const n = [];
  for (let a = 0, i = u(t, ie).length; a < i; a++) {
    const o = u(t, ie)[a], c = o[e] || o[A], d = {};
    if (c !== void 0 && (c.params = /* @__PURE__ */ Object.create(null), n.push(c), r !== Ve || s && s !== Ve))
      for (let l = 0, v = c.possibleKeys.length; l < v; l++) {
        const S = c.possibleKeys[l], Z = d[c.score];
        c.params[S] = s != null && s[S] && !Z ? s[S] : r[S] ?? (s == null ? void 0 : s[S]), d[c.score] = !0;
      }
  }
  return n;
}, rr), ye, sr, ns = (sr = class {
  constructor() {
    y(this, "name", "TrieRouter");
    k(this, ye);
    g(this, ye, new kr());
  }
  add(t, e, r) {
    const s = ir(e);
    if (s) {
      for (let n = 0, a = s.length; n < a; n++)
        u(this, ye).insert(t, s[n], r);
      return;
    }
    u(this, ye).insert(t, e, r);
  }
  match(t, e) {
    return u(this, ye).search(t, e);
  }
}, ye = new WeakMap(), sr), as = class extends mr {
  constructor(t = {}) {
    super(t), this.router = t.router ?? new ss({
      routers: [new rs(), new ns()]
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
var Zt;
(function(t) {
  t.mergeShapes = (e, r) => ({
    ...e,
    ...r
    // second overwrites first
  });
})(Zt || (Zt = {}));
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
]), ee = (t) => {
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
class Y extends Error {
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
            const d = i.path[c];
            c === i.path.length - 1 ? (o[d] = o[d] || { _errors: [] }, o[d]._errors.push(r(i))) : o[d] = o[d] || { _errors: [] }, o = o[d], c++;
          }
        }
    };
    return n(this), s;
  }
  static assert(e) {
    if (!(e instanceof Y))
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
Y.create = (t) => new Y(t);
const _t = (t, e) => {
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
let is = _t;
function os() {
  return is;
}
const cs = (t) => {
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
  const c = s.filter((d) => !!d).slice().reverse();
  for (const d of c)
    o = d(i, { data: e, defaultError: o }).message;
  return {
    ...n,
    path: a,
    message: o
  };
};
function f(t, e) {
  const r = os(), s = cs({
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
      r === _t ? void 0 : _t
      // then global default map
    ].filter((n) => !!n)
  });
  t.common.issues.push(s);
}
class P {
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
    return P.mergeObjectSync(e, s);
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
}), ze = (t) => ({ status: "dirty", value: t }), D = (t) => ({ status: "valid", value: t }), Pt = (t) => t.status === "aborted", Lt = (t) => t.status === "dirty", Te = (t) => t.status === "valid", nt = (t) => typeof Promise < "u" && t instanceof Promise;
var m;
(function(t) {
  t.errToObj = (e) => typeof e == "string" ? { message: e } : e || {}, t.toString = (e) => typeof e == "string" ? e : e == null ? void 0 : e.message;
})(m || (m = {}));
class de {
  constructor(e, r, s, n) {
    this._cachedPath = [], this.parent = e, this.data = r, this._path = s, this._key = n;
  }
  get path() {
    return this._cachedPath.length || (Array.isArray(this._key) ? this._cachedPath.push(...this._path, ...this._key) : this._cachedPath.push(...this._path, this._key)), this._cachedPath;
  }
}
const Mt = (t, e) => {
  if (Te(e))
    return { success: !0, data: e.value };
  if (!t.common.issues.length)
    throw new Error("Validation failed but no issues detected.");
  return {
    success: !1,
    get error() {
      if (this._error)
        return this._error;
      const r = new Y(t.common.issues);
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
class w {
  get description() {
    return this._def.description;
  }
  _getType(e) {
    return ee(e.data);
  }
  _getOrReturnCtx(e, r) {
    return r || {
      common: e.parent.common,
      data: e.data,
      parsedType: ee(e.data),
      schemaErrorMap: this._def.errorMap,
      path: e.path,
      parent: e.parent
    };
  }
  _processInputParams(e) {
    return {
      status: new P(),
      ctx: {
        common: e.parent.common,
        data: e.data,
        parsedType: ee(e.data),
        schemaErrorMap: this._def.errorMap,
        path: e.path,
        parent: e.parent
      }
    };
  }
  _parseSync(e) {
    const r = this._parse(e);
    if (nt(r))
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
      parsedType: ee(e)
    }, n = this._parseSync({ data: e, path: s.path, parent: s });
    return Mt(s, n);
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
      parsedType: ee(e)
    };
    if (!this["~standard"].async)
      try {
        const a = this._parseSync({ data: e, path: [], parent: r });
        return Te(a) ? {
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
    return this._parseAsync({ data: e, path: [], parent: r }).then((a) => Te(a) ? {
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
      parsedType: ee(e)
    }, n = this._parse({ data: e, path: s.path, parent: s }), a = await (nt(n) ? n : Promise.resolve(n));
    return Mt(s, a);
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
    return new Ie({
      schema: this,
      typeName: x.ZodEffects,
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
    return ce.create(this, this._def);
  }
  nullable() {
    return $e.create(this, this._def);
  }
  nullish() {
    return this.nullable().optional();
  }
  array() {
    return B.create(this);
  }
  promise() {
    return ct.create(this, this._def);
  }
  or(e) {
    return it.create([this, e], this._def);
  }
  and(e) {
    return ot.create(this, e, this._def);
  }
  transform(e) {
    return new Ie({
      ...b(this._def),
      schema: this,
      typeName: x.ZodEffects,
      effect: { type: "transform", transform: e }
    });
  }
  default(e) {
    const r = typeof e == "function" ? e : () => e;
    return new wt({
      ...b(this._def),
      innerType: this,
      defaultValue: r,
      typeName: x.ZodDefault
    });
  }
  brand() {
    return new js({
      typeName: x.ZodBranded,
      type: this,
      ...b(this._def)
    });
  }
  catch(e) {
    const r = typeof e == "function" ? e : () => e;
    return new Rt({
      ...b(this._def),
      innerType: this,
      catchValue: r,
      typeName: x.ZodCatch
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
    return Ct.create(this, e);
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
const ds = /^c[^\s-]{8,}$/i, us = /^[0-9a-z]+$/, ls = /^[0-9A-HJKMNP-TV-Z]{26}$/i, hs = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i, fs = /^[a-z0-9_-]{21}$/i, ps = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/, ms = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/, gs = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i, ys = "^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$";
let gt;
const vs = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/, _s = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/, xs = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/, ks = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/, bs = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/, ws = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/, br = "((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))", Rs = new RegExp(`^${br}$`);
function wr(t) {
  let e = "[0-5]\\d";
  t.precision ? e = `${e}\\.\\d{${t.precision}}` : t.precision == null && (e = `${e}(\\.\\d+)?`);
  const r = t.precision ? "+" : "?";
  return `([01]\\d|2[0-3]):[0-5]\\d(:${e})${r}`;
}
function Os(t) {
  return new RegExp(`^${wr(t)}$`);
}
function Ss(t) {
  let e = `${br}T${wr(t)}`;
  const r = [];
  return r.push(t.local ? "Z?" : "Z"), t.offset && r.push("([+-]\\d{2}:?\\d{2})"), e = `${e}(${r.join("|")})`, new RegExp(`^${e}$`);
}
function Es(t, e) {
  return !!((e === "v4" || !e) && vs.test(t) || (e === "v6" || !e) && xs.test(t));
}
function Cs(t, e) {
  if (!ps.test(t))
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
function As(t, e) {
  return !!((e === "v4" || !e) && _s.test(t) || (e === "v6" || !e) && ks.test(t));
}
class oe extends w {
  _parse(e) {
    if (this._def.coerce && (e.data = String(e.data)), this._getType(e) !== p.string) {
      const a = this._getOrReturnCtx(e);
      return f(a, {
        code: h.invalid_type,
        expected: p.string,
        received: a.parsedType
      }), _;
    }
    const s = new P();
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
        gs.test(e.data) || (n = this._getOrReturnCtx(e, n), f(n, {
          validation: "email",
          code: h.invalid_string,
          message: a.message
        }), s.dirty());
      else if (a.kind === "emoji")
        gt || (gt = new RegExp(ys, "u")), gt.test(e.data) || (n = this._getOrReturnCtx(e, n), f(n, {
          validation: "emoji",
          code: h.invalid_string,
          message: a.message
        }), s.dirty());
      else if (a.kind === "uuid")
        hs.test(e.data) || (n = this._getOrReturnCtx(e, n), f(n, {
          validation: "uuid",
          code: h.invalid_string,
          message: a.message
        }), s.dirty());
      else if (a.kind === "nanoid")
        fs.test(e.data) || (n = this._getOrReturnCtx(e, n), f(n, {
          validation: "nanoid",
          code: h.invalid_string,
          message: a.message
        }), s.dirty());
      else if (a.kind === "cuid")
        ds.test(e.data) || (n = this._getOrReturnCtx(e, n), f(n, {
          validation: "cuid",
          code: h.invalid_string,
          message: a.message
        }), s.dirty());
      else if (a.kind === "cuid2")
        us.test(e.data) || (n = this._getOrReturnCtx(e, n), f(n, {
          validation: "cuid2",
          code: h.invalid_string,
          message: a.message
        }), s.dirty());
      else if (a.kind === "ulid")
        ls.test(e.data) || (n = this._getOrReturnCtx(e, n), f(n, {
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
      }), s.dirty()) : a.kind === "datetime" ? Ss(a).test(e.data) || (n = this._getOrReturnCtx(e, n), f(n, {
        code: h.invalid_string,
        validation: "datetime",
        message: a.message
      }), s.dirty()) : a.kind === "date" ? Rs.test(e.data) || (n = this._getOrReturnCtx(e, n), f(n, {
        code: h.invalid_string,
        validation: "date",
        message: a.message
      }), s.dirty()) : a.kind === "time" ? Os(a).test(e.data) || (n = this._getOrReturnCtx(e, n), f(n, {
        code: h.invalid_string,
        validation: "time",
        message: a.message
      }), s.dirty()) : a.kind === "duration" ? ms.test(e.data) || (n = this._getOrReturnCtx(e, n), f(n, {
        validation: "duration",
        code: h.invalid_string,
        message: a.message
      }), s.dirty()) : a.kind === "ip" ? Es(e.data, a.version) || (n = this._getOrReturnCtx(e, n), f(n, {
        validation: "ip",
        code: h.invalid_string,
        message: a.message
      }), s.dirty()) : a.kind === "jwt" ? Cs(e.data, a.alg) || (n = this._getOrReturnCtx(e, n), f(n, {
        validation: "jwt",
        code: h.invalid_string,
        message: a.message
      }), s.dirty()) : a.kind === "cidr" ? As(e.data, a.version) || (n = this._getOrReturnCtx(e, n), f(n, {
        validation: "cidr",
        code: h.invalid_string,
        message: a.message
      }), s.dirty()) : a.kind === "base64" ? bs.test(e.data) || (n = this._getOrReturnCtx(e, n), f(n, {
        validation: "base64",
        code: h.invalid_string,
        message: a.message
      }), s.dirty()) : a.kind === "base64url" ? ws.test(e.data) || (n = this._getOrReturnCtx(e, n), f(n, {
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
    return new oe({
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
    return new oe({
      ...this._def,
      checks: [...this._def.checks, { kind: "trim" }]
    });
  }
  toLowerCase() {
    return new oe({
      ...this._def,
      checks: [...this._def.checks, { kind: "toLowerCase" }]
    });
  }
  toUpperCase() {
    return new oe({
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
oe.create = (t) => new oe({
  checks: [],
  typeName: x.ZodString,
  coerce: (t == null ? void 0 : t.coerce) ?? !1,
  ...b(t)
});
function Ts(t, e) {
  const r = (t.toString().split(".")[1] || "").length, s = (e.toString().split(".")[1] || "").length, n = r > s ? r : s, a = Number.parseInt(t.toFixed(n).replace(".", "")), i = Number.parseInt(e.toFixed(n).replace(".", ""));
  return a % i / 10 ** n;
}
class je extends w {
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
    const n = new P();
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
      }), n.dirty()) : a.kind === "multipleOf" ? Ts(e.data, a.value) !== 0 && (s = this._getOrReturnCtx(e, s), f(s, {
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
    return new je({
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
    return new je({
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
je.create = (t) => new je({
  checks: [],
  typeName: x.ZodNumber,
  coerce: (t == null ? void 0 : t.coerce) || !1,
  ...b(t)
});
class Fe extends w {
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
    const n = new P();
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
    return new Fe({
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
    return new Fe({
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
Fe.create = (t) => new Fe({
  checks: [],
  typeName: x.ZodBigInt,
  coerce: (t == null ? void 0 : t.coerce) ?? !1,
  ...b(t)
});
class xt extends w {
  _parse(e) {
    if (this._def.coerce && (e.data = !!e.data), this._getType(e) !== p.boolean) {
      const s = this._getOrReturnCtx(e);
      return f(s, {
        code: h.invalid_type,
        expected: p.boolean,
        received: s.parsedType
      }), _;
    }
    return D(e.data);
  }
}
xt.create = (t) => new xt({
  typeName: x.ZodBoolean,
  coerce: (t == null ? void 0 : t.coerce) || !1,
  ...b(t)
});
class at extends w {
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
    const s = new P();
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
    return new at({
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
at.create = (t) => new at({
  checks: [],
  coerce: (t == null ? void 0 : t.coerce) || !1,
  typeName: x.ZodDate,
  ...b(t)
});
class Dt extends w {
  _parse(e) {
    if (this._getType(e) !== p.symbol) {
      const s = this._getOrReturnCtx(e);
      return f(s, {
        code: h.invalid_type,
        expected: p.symbol,
        received: s.parsedType
      }), _;
    }
    return D(e.data);
  }
}
Dt.create = (t) => new Dt({
  typeName: x.ZodSymbol,
  ...b(t)
});
class Vt extends w {
  _parse(e) {
    if (this._getType(e) !== p.undefined) {
      const s = this._getOrReturnCtx(e);
      return f(s, {
        code: h.invalid_type,
        expected: p.undefined,
        received: s.parsedType
      }), _;
    }
    return D(e.data);
  }
}
Vt.create = (t) => new Vt({
  typeName: x.ZodUndefined,
  ...b(t)
});
class zt extends w {
  _parse(e) {
    if (this._getType(e) !== p.null) {
      const s = this._getOrReturnCtx(e);
      return f(s, {
        code: h.invalid_type,
        expected: p.null,
        received: s.parsedType
      }), _;
    }
    return D(e.data);
  }
}
zt.create = (t) => new zt({
  typeName: x.ZodNull,
  ...b(t)
});
class Ut extends w {
  constructor() {
    super(...arguments), this._any = !0;
  }
  _parse(e) {
    return D(e.data);
  }
}
Ut.create = (t) => new Ut({
  typeName: x.ZodAny,
  ...b(t)
});
class kt extends w {
  constructor() {
    super(...arguments), this._unknown = !0;
  }
  _parse(e) {
    return D(e.data);
  }
}
kt.create = (t) => new kt({
  typeName: x.ZodUnknown,
  ...b(t)
});
class ue extends w {
  _parse(e) {
    const r = this._getOrReturnCtx(e);
    return f(r, {
      code: h.invalid_type,
      expected: p.never,
      received: r.parsedType
    }), _;
  }
}
ue.create = (t) => new ue({
  typeName: x.ZodNever,
  ...b(t)
});
class Ht extends w {
  _parse(e) {
    if (this._getType(e) !== p.undefined) {
      const s = this._getOrReturnCtx(e);
      return f(s, {
        code: h.invalid_type,
        expected: p.void,
        received: s.parsedType
      }), _;
    }
    return D(e.data);
  }
}
Ht.create = (t) => new Ht({
  typeName: x.ZodVoid,
  ...b(t)
});
class B extends w {
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
      return Promise.all([...r.data].map((i, o) => n.type._parseAsync(new de(r, i, r.path, o)))).then((i) => P.mergeArray(s, i));
    const a = [...r.data].map((i, o) => n.type._parseSync(new de(r, i, r.path, o)));
    return P.mergeArray(s, a);
  }
  get element() {
    return this._def.type;
  }
  min(e, r) {
    return new B({
      ...this._def,
      minLength: { value: e, message: m.toString(r) }
    });
  }
  max(e, r) {
    return new B({
      ...this._def,
      maxLength: { value: e, message: m.toString(r) }
    });
  }
  length(e, r) {
    return new B({
      ...this._def,
      exactLength: { value: e, message: m.toString(r) }
    });
  }
  nonempty(e) {
    return this.min(1, e);
  }
}
B.create = (t, e) => new B({
  type: t,
  minLength: null,
  maxLength: null,
  exactLength: null,
  typeName: x.ZodArray,
  ...b(e)
});
function Re(t) {
  if (t instanceof C) {
    const e = {};
    for (const r in t.shape) {
      const s = t.shape[r];
      e[r] = ce.create(Re(s));
    }
    return new C({
      ...t._def,
      shape: () => e
    });
  } else return t instanceof B ? new B({
    ...t._def,
    type: Re(t.element)
  }) : t instanceof ce ? ce.create(Re(t.unwrap())) : t instanceof $e ? $e.create(Re(t.unwrap())) : t instanceof ve ? ve.create(t.items.map((e) => Re(e))) : t;
}
class C extends w {
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
      const d = this._getOrReturnCtx(e);
      return f(d, {
        code: h.invalid_type,
        expected: p.object,
        received: d.parsedType
      }), _;
    }
    const { status: s, ctx: n } = this._processInputParams(e), { shape: a, keys: i } = this._getCached(), o = [];
    if (!(this._def.catchall instanceof ue && this._def.unknownKeys === "strip"))
      for (const d in n.data)
        i.includes(d) || o.push(d);
    const c = [];
    for (const d of i) {
      const l = a[d], v = n.data[d];
      c.push({
        key: { status: "valid", value: d },
        value: l._parse(new de(n, v, n.path, d)),
        alwaysSet: d in n.data
      });
    }
    if (this._def.catchall instanceof ue) {
      const d = this._def.unknownKeys;
      if (d === "passthrough")
        for (const l of o)
          c.push({
            key: { status: "valid", value: l },
            value: { status: "valid", value: n.data[l] }
          });
      else if (d === "strict")
        o.length > 0 && (f(n, {
          code: h.unrecognized_keys,
          keys: o
        }), s.dirty());
      else if (d !== "strip") throw new Error("Internal ZodObject error: invalid unknownKeys value.");
    } else {
      const d = this._def.catchall;
      for (const l of o) {
        const v = n.data[l];
        c.push({
          key: { status: "valid", value: l },
          value: d._parse(
            new de(n, v, n.path, l)
            //, ctx.child(key), value, getParsedType(value)
          ),
          alwaysSet: l in n.data
        });
      }
    }
    return n.common.async ? Promise.resolve().then(async () => {
      const d = [];
      for (const l of c) {
        const v = await l.key, S = await l.value;
        d.push({
          key: v,
          value: S,
          alwaysSet: l.alwaysSet
        });
      }
      return d;
    }).then((d) => P.mergeObjectSync(s, d)) : P.mergeObjectSync(s, c);
  }
  get shape() {
    return this._def.shape();
  }
  strict(e) {
    return m.errToObj, new C({
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
      typeName: x.ZodObject
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
    for (const s of R.objectKeys(e))
      e[s] && this.shape[s] && (r[s] = this.shape[s]);
    return new C({
      ...this._def,
      shape: () => r
    });
  }
  omit(e) {
    const r = {};
    for (const s of R.objectKeys(this.shape))
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
    return Re(this);
  }
  partial(e) {
    const r = {};
    for (const s of R.objectKeys(this.shape)) {
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
    for (const s of R.objectKeys(this.shape))
      if (e && !e[s])
        r[s] = this.shape[s];
      else {
        let a = this.shape[s];
        for (; a instanceof ce; )
          a = a._def.innerType;
        r[s] = a;
      }
    return new C({
      ...this._def,
      shape: () => r
    });
  }
  keyof() {
    return Rr(R.objectKeys(this.shape));
  }
}
C.create = (t, e) => new C({
  shape: () => t,
  unknownKeys: "strip",
  catchall: ue.create(),
  typeName: x.ZodObject,
  ...b(e)
});
C.strictCreate = (t, e) => new C({
  shape: () => t,
  unknownKeys: "strict",
  catchall: ue.create(),
  typeName: x.ZodObject,
  ...b(e)
});
C.lazycreate = (t, e) => new C({
  shape: t,
  unknownKeys: "strip",
  catchall: ue.create(),
  typeName: x.ZodObject,
  ...b(e)
});
class it extends w {
  _parse(e) {
    const { ctx: r } = this._processInputParams(e), s = this._def.options;
    function n(a) {
      for (const o of a)
        if (o.result.status === "valid")
          return o.result;
      for (const o of a)
        if (o.result.status === "dirty")
          return r.common.issues.push(...o.ctx.common.issues), o.result;
      const i = a.map((o) => new Y(o.ctx.common.issues));
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
        const d = {
          ...r,
          common: {
            ...r.common,
            issues: []
          },
          parent: null
        }, l = c._parseSync({
          data: r.data,
          path: r.path,
          parent: d
        });
        if (l.status === "valid")
          return l;
        l.status === "dirty" && !a && (a = { result: l, ctx: d }), d.common.issues.length && i.push(d.common.issues);
      }
      if (a)
        return r.common.issues.push(...a.ctx.common.issues), a.result;
      const o = i.map((c) => new Y(c));
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
it.create = (t, e) => new it({
  options: t,
  typeName: x.ZodUnion,
  ...b(e)
});
function bt(t, e) {
  const r = ee(t), s = ee(e);
  if (t === e)
    return { valid: !0, data: t };
  if (r === p.object && s === p.object) {
    const n = R.objectKeys(e), a = R.objectKeys(t).filter((o) => n.indexOf(o) !== -1), i = { ...t, ...e };
    for (const o of a) {
      const c = bt(t[o], e[o]);
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
      const i = t[a], o = e[a], c = bt(i, o);
      if (!c.valid)
        return { valid: !1 };
      n.push(c.data);
    }
    return { valid: !0, data: n };
  } else return r === p.date && s === p.date && +t == +e ? { valid: !0, data: t } : { valid: !1 };
}
class ot extends w {
  _parse(e) {
    const { status: r, ctx: s } = this._processInputParams(e), n = (a, i) => {
      if (Pt(a) || Pt(i))
        return _;
      const o = bt(a.value, i.value);
      return o.valid ? ((Lt(a) || Lt(i)) && r.dirty(), { status: r.value, value: o.data }) : (f(s, {
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
ot.create = (t, e, r) => new ot({
  left: t,
  right: e,
  typeName: x.ZodIntersection,
  ...b(r)
});
class ve extends w {
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
      return c ? c._parse(new de(s, i, s.path, o)) : null;
    }).filter((i) => !!i);
    return s.common.async ? Promise.all(a).then((i) => P.mergeArray(r, i)) : P.mergeArray(r, a);
  }
  get items() {
    return this._def.items;
  }
  rest(e) {
    return new ve({
      ...this._def,
      rest: e
    });
  }
}
ve.create = (t, e) => {
  if (!Array.isArray(t))
    throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
  return new ve({
    items: t,
    typeName: x.ZodTuple,
    rest: null,
    ...b(e)
  });
};
class Ft extends w {
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
    const n = this._def.keyType, a = this._def.valueType, i = [...s.data.entries()].map(([o, c], d) => ({
      key: n._parse(new de(s, o, s.path, [d, "key"])),
      value: a._parse(new de(s, c, s.path, [d, "value"]))
    }));
    if (s.common.async) {
      const o = /* @__PURE__ */ new Map();
      return Promise.resolve().then(async () => {
        for (const c of i) {
          const d = await c.key, l = await c.value;
          if (d.status === "aborted" || l.status === "aborted")
            return _;
          (d.status === "dirty" || l.status === "dirty") && r.dirty(), o.set(d.value, l.value);
        }
        return { status: r.value, value: o };
      });
    } else {
      const o = /* @__PURE__ */ new Map();
      for (const c of i) {
        const d = c.key, l = c.value;
        if (d.status === "aborted" || l.status === "aborted")
          return _;
        (d.status === "dirty" || l.status === "dirty") && r.dirty(), o.set(d.value, l.value);
      }
      return { status: r.value, value: o };
    }
  }
}
Ft.create = (t, e, r) => new Ft({
  valueType: e,
  keyType: t,
  typeName: x.ZodMap,
  ...b(r)
});
class Be extends w {
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
      const d = /* @__PURE__ */ new Set();
      for (const l of c) {
        if (l.status === "aborted")
          return _;
        l.status === "dirty" && r.dirty(), d.add(l.value);
      }
      return { status: r.value, value: d };
    }
    const o = [...s.data.values()].map((c, d) => a._parse(new de(s, c, s.path, d)));
    return s.common.async ? Promise.all(o).then((c) => i(c)) : i(o);
  }
  min(e, r) {
    return new Be({
      ...this._def,
      minSize: { value: e, message: m.toString(r) }
    });
  }
  max(e, r) {
    return new Be({
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
Be.create = (t, e) => new Be({
  valueType: t,
  minSize: null,
  maxSize: null,
  typeName: x.ZodSet,
  ...b(e)
});
class Bt extends w {
  get schema() {
    return this._def.getter();
  }
  _parse(e) {
    const { ctx: r } = this._processInputParams(e);
    return this._def.getter()._parse({ data: r.data, path: r.path, parent: r });
  }
}
Bt.create = (t, e) => new Bt({
  getter: t,
  typeName: x.ZodLazy,
  ...b(e)
});
class Wt extends w {
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
Wt.create = (t, e) => new Wt({
  value: t,
  typeName: x.ZodLiteral,
  ...b(e)
});
function Rr(t, e) {
  return new Ne({
    values: t,
    typeName: x.ZodEnum,
    ...b(e)
  });
}
class Ne extends w {
  _parse(e) {
    if (typeof e.data != "string") {
      const r = this._getOrReturnCtx(e), s = this._def.values;
      return f(r, {
        expected: R.joinValues(s),
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
    return D(e.data);
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
    return Ne.create(e, {
      ...this._def,
      ...r
    });
  }
  exclude(e, r = this._def) {
    return Ne.create(this.options.filter((s) => !e.includes(s)), {
      ...this._def,
      ...r
    });
  }
}
Ne.create = Rr;
class qt extends w {
  _parse(e) {
    const r = R.getValidEnumValues(this._def.values), s = this._getOrReturnCtx(e);
    if (s.parsedType !== p.string && s.parsedType !== p.number) {
      const n = R.objectValues(r);
      return f(s, {
        expected: R.joinValues(n),
        received: s.parsedType,
        code: h.invalid_type
      }), _;
    }
    if (this._cache || (this._cache = new Set(R.getValidEnumValues(this._def.values))), !this._cache.has(e.data)) {
      const n = R.objectValues(r);
      return f(s, {
        received: s.data,
        code: h.invalid_enum_value,
        options: n
      }), _;
    }
    return D(e.data);
  }
  get enum() {
    return this._def.values;
  }
}
qt.create = (t, e) => new qt({
  values: t,
  typeName: x.ZodNativeEnum,
  ...b(e)
});
class ct extends w {
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
    return D(s.then((n) => this._def.type.parseAsync(n, {
      path: r.path,
      errorMap: r.common.contextualErrorMap
    })));
  }
}
ct.create = (t, e) => new ct({
  type: t,
  typeName: x.ZodPromise,
  ...b(e)
});
class Ie extends w {
  innerType() {
    return this._def.schema;
  }
  sourceType() {
    return this._def.schema._def.typeName === x.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
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
          return c.status === "aborted" ? _ : c.status === "dirty" || r.value === "dirty" ? ze(c.value) : c;
        });
      {
        if (r.value === "aborted")
          return _;
        const o = this._def.schema._parseSync({
          data: i,
          path: s.path,
          parent: s
        });
        return o.status === "aborted" ? _ : o.status === "dirty" || r.value === "dirty" ? ze(o.value) : o;
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
        if (!Te(i))
          return _;
        const o = n.transform(i.value, a);
        if (o instanceof Promise)
          throw new Error("Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.");
        return { status: r.value, value: o };
      } else
        return this._def.schema._parseAsync({ data: s.data, path: s.path, parent: s }).then((i) => Te(i) ? Promise.resolve(n.transform(i.value, a)).then((o) => ({
          status: r.value,
          value: o
        })) : _);
    R.assertNever(n);
  }
}
Ie.create = (t, e, r) => new Ie({
  schema: t,
  typeName: x.ZodEffects,
  effect: e,
  ...b(r)
});
Ie.createWithPreprocess = (t, e, r) => new Ie({
  schema: e,
  effect: { type: "preprocess", transform: t },
  typeName: x.ZodEffects,
  ...b(r)
});
class ce extends w {
  _parse(e) {
    return this._getType(e) === p.undefined ? D(void 0) : this._def.innerType._parse(e);
  }
  unwrap() {
    return this._def.innerType;
  }
}
ce.create = (t, e) => new ce({
  innerType: t,
  typeName: x.ZodOptional,
  ...b(e)
});
class $e extends w {
  _parse(e) {
    return this._getType(e) === p.null ? D(null) : this._def.innerType._parse(e);
  }
  unwrap() {
    return this._def.innerType;
  }
}
$e.create = (t, e) => new $e({
  innerType: t,
  typeName: x.ZodNullable,
  ...b(e)
});
class wt extends w {
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
wt.create = (t, e) => new wt({
  innerType: t,
  typeName: x.ZodDefault,
  defaultValue: typeof e.default == "function" ? e.default : () => e.default,
  ...b(e)
});
class Rt extends w {
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
    return nt(n) ? n.then((a) => ({
      status: "valid",
      value: a.status === "valid" ? a.value : this._def.catchValue({
        get error() {
          return new Y(s.common.issues);
        },
        input: s.data
      })
    })) : {
      status: "valid",
      value: n.status === "valid" ? n.value : this._def.catchValue({
        get error() {
          return new Y(s.common.issues);
        },
        input: s.data
      })
    };
  }
  removeCatch() {
    return this._def.innerType;
  }
}
Rt.create = (t, e) => new Rt({
  innerType: t,
  typeName: x.ZodCatch,
  catchValue: typeof e.catch == "function" ? e.catch : () => e.catch,
  ...b(e)
});
class Gt extends w {
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
Gt.create = (t) => new Gt({
  typeName: x.ZodNaN,
  ...b(t)
});
class js extends w {
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
class Ct extends w {
  _parse(e) {
    const { status: r, ctx: s } = this._processInputParams(e);
    if (s.common.async)
      return (async () => {
        const a = await this._def.in._parseAsync({
          data: s.data,
          path: s.path,
          parent: s
        });
        return a.status === "aborted" ? _ : a.status === "dirty" ? (r.dirty(), ze(a.value)) : this._def.out._parseAsync({
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
    return new Ct({
      in: e,
      out: r,
      typeName: x.ZodPipeline
    });
  }
}
class Ot extends w {
  _parse(e) {
    const r = this._def.innerType._parse(e), s = (n) => (Te(n) && (n.value = Object.freeze(n.value)), n);
    return nt(r) ? r.then((n) => s(n)) : s(r);
  }
  unwrap() {
    return this._def.innerType;
  }
}
Ot.create = (t, e) => new Ot({
  innerType: t,
  typeName: x.ZodReadonly,
  ...b(e)
});
var x;
(function(t) {
  t.ZodString = "ZodString", t.ZodNumber = "ZodNumber", t.ZodNaN = "ZodNaN", t.ZodBigInt = "ZodBigInt", t.ZodBoolean = "ZodBoolean", t.ZodDate = "ZodDate", t.ZodSymbol = "ZodSymbol", t.ZodUndefined = "ZodUndefined", t.ZodNull = "ZodNull", t.ZodAny = "ZodAny", t.ZodUnknown = "ZodUnknown", t.ZodNever = "ZodNever", t.ZodVoid = "ZodVoid", t.ZodArray = "ZodArray", t.ZodObject = "ZodObject", t.ZodUnion = "ZodUnion", t.ZodDiscriminatedUnion = "ZodDiscriminatedUnion", t.ZodIntersection = "ZodIntersection", t.ZodTuple = "ZodTuple", t.ZodRecord = "ZodRecord", t.ZodMap = "ZodMap", t.ZodSet = "ZodSet", t.ZodFunction = "ZodFunction", t.ZodLazy = "ZodLazy", t.ZodLiteral = "ZodLiteral", t.ZodEnum = "ZodEnum", t.ZodEffects = "ZodEffects", t.ZodNativeEnum = "ZodNativeEnum", t.ZodOptional = "ZodOptional", t.ZodNullable = "ZodNullable", t.ZodDefault = "ZodDefault", t.ZodCatch = "ZodCatch", t.ZodPromise = "ZodPromise", t.ZodBranded = "ZodBranded", t.ZodPipeline = "ZodPipeline", t.ZodReadonly = "ZodReadonly";
})(x || (x = {}));
const Ze = oe.create, St = je.create, Ns = xt.create, Is = kt.create;
ue.create;
B.create;
const We = C.create;
it.create;
ot.create;
ve.create;
const dt = Ne.create;
ct.create;
ce.create;
$e.create;
We({
  type: dt([
    "connection_established",
    "live_health_update",
    "historical_data_update",
    "emergency_alert",
    "error"
  ]),
  data: Is().optional(),
  timestamp: Ze().datetime().optional()
});
const Or = We({
  type: dt(["heart_rate", "walking_steadiness", "steps", "oxygen_saturation"]).describe("metric identifier"),
  value: St().describe("numeric value for the metric"),
  unit: Ze().optional()
}), $s = We({
  type: Or.shape.type,
  value: St(),
  processedAt: Ze().datetime(),
  validated: Ns(),
  healthScore: St().optional(),
  fallRisk: dt(["low", "moderate", "high", "critical"]).optional(),
  alert: We({
    level: dt(["warning", "critical"]),
    message: Ze()
  }).nullable().optional()
}), Le = new as();
Le.use("/*", async (t, e) => {
  const r = await t.env.ASSETS.fetch(t.req.raw);
  return r.status === 404 ? e() : r;
});
Le.get("/health", (t) => t.json({
  status: "healthy",
  timestamp: (/* @__PURE__ */ new Date()).toISOString(),
  environment: t.env.ENVIRONMENT || "unknown"
}));
Le.get("/ws", (t) => t.text("WebSocket endpoint not available on Worker. Use local bridge server.", 426));
Le.get("/api/health-data", async (t) => {
  const e = We({
    from: Ze().datetime().optional(),
    to: Ze().datetime().optional(),
    metric: Or.shape.type.optional()
  }), r = new URL(t.req.url), s = Object.fromEntries(r.searchParams.entries()), n = e.safeParse(s);
  return n.success ? t.json({
    ok: !0,
    query: n.data,
    data: []
  }) : t.json({ error: "validation_error", details: n.error.flatten() }, 400);
});
Le.post("/api/health-data", async (t) => {
  let e;
  try {
    e = await t.req.json();
  } catch {
    return t.json({ error: "invalid_json" }, 400);
  }
  const r = $s.safeParse(e);
  if (!r.success)
    return t.json({ error: "validation_error", details: r.error.flatten() }, 400);
  try {
    const s = t.env.HEALTH_KV;
    if (s) {
      const n = `health:${r.data.type}:${r.data.processedAt}`;
      await s.put(n, JSON.stringify(r.data), { expirationTtl: 3600 * 24 });
    }
  } catch {
    return t.json({ error: "server_error" }, 500);
  }
  return t.json({ ok: !0, data: r.data }, 201);
});
Le.get("*", async (t) => {
  const e = new URL("/index.html", t.req.url);
  return t.env.ASSETS.fetch(new Request(e.toString(), t.req.raw));
});
export {
  Le as default
};
//# sourceMappingURL=index.js.map

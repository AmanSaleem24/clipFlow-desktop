import { app as m, BrowserWindow as g, systemPreferences as x, ipcMain as f, desktopCapturer as D } from "electron";
import { createServer as A } from "node:http";
import { fileURLToPath as H } from "node:url";
import { readFile as j } from "node:fs/promises";
import d from "node:path";
const P = d.dirname(H(import.meta.url));
process.env.APP_ROOT = d.join(P, "..");
process.env.VITE_PUBLIC = process.env.VITE_DEV_SERVER_URL ? d.join(process.env.APP_ROOT, "public") : d.join(process.env.APP_ROOT, "dist");
const T = process.env.VITE_DEV_SERVER_URL, Z = d.join(process.env.APP_ROOT, "dist-electron"), S = d.join(process.env.APP_ROOT, "dist"), _ = process.platform === "darwin", z = !0;
let i = null, r = null, l = null, E = !1, c = null, w = null;
const W = 320, b = 160, U = 640, $ = 720, h = 430, v = 72, I = 210, y = (t, e, n) => Math.min(Math.max(Math.ceil(t), e), n), N = (t) => T ? new URL(t, T).toString() : null, L = (t) => new Promise((e) => {
  setTimeout(e, t);
}), q = (t) => {
  const e = d.extname(t).toLowerCase();
  return {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".mjs": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".ico": "image/x-icon",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf",
    ".map": "application/json; charset=utf-8"
  }[e] || "application/octet-stream";
}, V = (t) => {
  const e = decodeURIComponent(t), n = e === "/" ? "/index.html" : e, o = d.normalize(n).replace(/^([.]{2}[/\\])+/, "");
  return o.startsWith("/") ? o.slice(1) : o;
}, k = async (t, e) => {
  try {
    const n = new URL(t.url || "/", "http://127.0.0.1"), o = V(n.pathname), a = d.join(S, o);
    if (!a.startsWith(S)) {
      e.writeHead(403), e.end("Forbidden");
      return;
    }
    const s = await j(a), u = q(a);
    e.writeHead(200, {
      "Content-Type": u,
      "Cache-Control": "no-cache"
    }), e.end(s);
  } catch {
    e.writeHead(404), e.end("Not found");
  }
}, G = async () => T ? null : w || (await new Promise((t, e) => {
  c = A((n, o) => {
    k(n, o);
  }), c.once("error", e), c.listen(0, "127.0.0.1", () => {
    const n = c == null ? void 0 : c.address();
    if (!n || typeof n == "string") {
      e(new Error("Unable to resolve renderer HTTP server address"));
      return;
    }
    w = `http://127.0.0.1:${n.port}`, console.log("🌐 [renderer] local server started", { origin: w }), t();
  });
}), w), M = async () => {
  c && (await new Promise((t) => {
    c == null || c.close(() => t());
  }), c = null, w = null);
}, R = async (t, e) => {
  if (T) {
    const o = N(e);
    if (!o) throw new Error(`Unable to resolve dev URL for ${e}`);
    const a = 20;
    for (let s = 1; s <= a; s += 1)
      try {
        await t.loadURL(o);
        return;
      } catch (u) {
        if (s === a)
          throw u;
        console.warn(`⏳ [renderer] retrying load (${s}/${a})`, { entryFile: e, url: o }), await L(250);
      }
    return;
  }
  const n = await G();
  if (!n)
    throw new Error(`Unable to resolve renderer origin for ${e}`);
  await t.loadURL(`${n}/${e}`);
}, C = (t, e) => {
  e.once("ready-to-show", () => {
    console.log(`🪟 [${t}] ready-to-show`), e.show();
  }), e.webContents.on("did-fail-load", (n, o, a, s) => {
    console.log(`⚠️ [${t}] did-fail-load`, { errorCode: o, errorDescription: a, validatedURL: s }), console.error(`[${t}] failed to load (${o}): ${a} -> ${s}`), !e.isDestroyed() && !e.isVisible() && e.show();
  }), e.on("closed", () => {
    console.log(`🧹 [${t}] closed`), t === "win" && (i = null), t === "studio" && (r = null), t === "floatingWebCam" && (l = null);
  });
}, O = async () => {
  if (i || r || l) return;
  const t = {
    frame: !1,
    transparent: z,
    alwaysOnTop: !1,
    focusable: !0,
    show: !1,
    icon: d.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      nodeIntegration: !1,
      contextIsolation: !0,
      devTools: !0,
      preload: d.join(P, "preload.mjs")
    }
  };
  i = new g({
    ...t,
    title: "ClipFlow",
    width: 420,
    height: 220,
    minHeight: b,
    minWidth: W,
    useContentSize: !0,
    resizable: !1
  }), r = new g({
    ...t,
    title: "Studio Controls",
    width: h,
    height: v,
    minHeight: v,
    maxHeight: I,
    minWidth: h,
    maxWidth: h,
    useContentSize: !0,
    resizable: !1
  }), l = new g({
    ...t,
    title: "Floating Webcam",
    width: 400,
    height: 200,
    minHeight: 70,
    maxHeight: 400,
    minWidth: 300,
    maxWidth: 400
  }), C("win", i), C("studio", r), C("floatingWebCam", l), i.webContents.on("did-finish-load", () => {
    console.log("✅ [win] did-finish-load"), i == null || i.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), r.webContents.on("did-finish-load", () => {
    console.log("✅ [studio] did-finish-load"), r == null || r.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), l.webContents.on("did-finish-load", () => {
    console.log("✅ [floatingWebCam] did-finish-load"), l == null || l.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), (await Promise.allSettled([
    R(i, "index.html"),
    R(r, "studio.html"),
    R(l, "webcam.html")
  ])).forEach((n, o) => {
    if (n.status === "fulfilled") return;
    console.error(`❌ [${o === 0 ? "win" : o === 1 ? "studio" : "floatingWebCam"}] renderer failed to load`, n.reason);
  }), E = !0;
}, B = () => {
  f.on("closeApp", (t) => {
    console.log("🔌 [ipcMain] closeApp", { senderId: t.sender.id });
    const e = g.fromWebContents(t.sender), n = e == null ? void 0 : e.getTitle();
    e == null || e.destroy();
    const o = g.getAllWindows();
    console.log("📊 [ipcMain] closeApp result", { senderTitle: n, openWindowCount: o.length, isMac: _ }), !_ && o.length === 0 && (console.log("🛑 [app] quitting after closeApp (no open windows)"), m.quit(), i = null, r = null, l = null);
  }), f.on("resize-window", (t, e = {}) => {
    if (console.log("📏 [ipcMain] resize-window request", e), !i || i.isDestroyed()) return;
    const { width: n, height: o } = e;
    if (!Number.isFinite(n) || !Number.isFinite(o)) return;
    const a = y(n, W, U), s = y(o, b, $), [u, p] = i.getContentSize();
    u === a && p === s || (i.setContentSize(a, s, !0), console.log("📐 [ipcMain] resize-window applied", { nextWidth: a, nextHeight: s }));
  }), f.handle("getSources", async (t, e = {}) => {
    console.log("🖥️ [ipcMain] getSources request", e);
    const n = await D.getSources({
      thumbnailSize: { height: 180, width: 320 },
      fetchWindowIcons: !0,
      types: ["window", "screen"],
      ...e
    });
    return console.log("🎞️ [ipcMain] getSources response", { count: n.length }), n;
  }), f.handle(
    "http-request",
    async (t, e) => {
      const n = e.method || "GET", o = new AbortController(), a = setTimeout(() => o.abort(), 15e3);
      try {
        const s = await fetch(e.url, {
          method: n,
          headers: {
            "Content-Type": "application/json",
            ...e.headers || {}
          },
          body: n === "GET" || e.data === void 0 ? void 0 : JSON.stringify(e.data),
          signal: o.signal
        }), u = await s.text();
        let p = null;
        if (u)
          try {
            p = JSON.parse(u);
          } catch {
            p = u;
          }
        return s.ok ? {
          ok: !0,
          status: s.status,
          data: p
        } : {
          ok: !1,
          status: s.status,
          error: typeof p == "string" ? p : `Request failed with status ${s.status}`
        };
      } catch (s) {
        return {
          ok: !1,
          status: 0,
          error: s instanceof Error ? s.message : "Request failed"
        };
      } finally {
        clearTimeout(a);
      }
    }
  ), f.on("media-sources", (t, e) => {
    console.log("📤 [ipcMain] media-sources", e), r == null || r.webContents.send("profile-received", e);
  }), f.on("resize-studio", (t, e = {}) => {
    console.log("🎛️ [ipcMain] resize-studio request", e), !(!r || r.isDestroyed()) && (e.shrink ? (r.setContentSize(h, v, !0), console.log("📉 [ipcMain] resize-studio applied", { width: h, height: v })) : (r.setContentSize(h, I, !0), console.log("📈 [ipcMain] resize-studio applied", { width: h, height: I })));
  }), f.on("hide-plugin", (t, e) => {
    console.log("🙈 [ipcMain] hide-plugin", e), i == null || i.webContents.send("hide-plugin", e);
  });
};
m.on("window-all-closed", async () => {
  console.log("🚪 [app] window-all-closed", { isMac: _ }), _ || (console.log("🛑 [app] quitting from window-all-closed"), await M(), m.quit(), i = null, r = null, l = null, E = !1);
});
m.on("before-quit", async () => {
  await M();
});
m.on("activate", () => {
  const t = g.getAllWindows().length;
  console.log("🔁 [app] activate", { openWindowCount: t }), g.getAllWindows().length === 0 && O().catch((e) => {
    console.error("❌ [app] failed to create window on activate", e);
  });
});
const X = async () => {
  if (process.platform !== "darwin") return;
  const t = x.getMediaAccessStatus("screen");
};
m.whenReady().then(async () => {
  console.log("🚀 [app] whenReady"), await X(), E || (console.log("🧩 [app] initializing IPC + windows"), B(), await O().catch((t) => {
    console.error("❌ [app] failed to create initial windows", t);
  }));
});
export {
  Z as MAIN_DIST,
  S as RENDERER_DIST,
  T as VITE_DEV_SERVER_URL
};

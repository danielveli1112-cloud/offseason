/* OFFSEASON core: shared by the store (index.html) and the editor (admin.html).
   Handles saved data, photos, theme, password and live updates. No need to edit. */
(function (w) {
  "use strict";
  var KEY = "offseason_state_v1", PKEY = "offseason_admin_v1", SKEY = "offseason_session_v1";
  var D = w.OS_DEFAULTS;
  var OS = { KEY: KEY, PKEY: PKEY, SKEY: SKEY, urls: {}, storageOk: true, state: null };
  w.OS = OS;

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function isObj(x) { return x && typeof x === "object" && !Array.isArray(x); }
  function merge(base, over) {
    var out = clone(base);
    if (!isObj(over)) return out;
    Object.keys(over).forEach(function (k) {
      out[k] = (isObj(out[k]) && isObj(over[k])) ? merge(out[k], over[k]) : over[k];
    });
    return out;
  }
  OS.clone = clone; OS.merge = merge;
  OS.uid = function () { return "u" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); };

  /* ---------- saved state (text data) ---------- */
  function readSaved() {
    try { var raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
  }
  OS.defaults = function () { return clone(D); };
  OS.load = function () { OS.state = merge(D, readSaved()); return OS.state; };
  OS.setState = function (s) { OS.state = merge(D, s); return OS.state; };
  try { localStorage.setItem("__t", "1"); localStorage.removeItem("__t"); } catch (e) { OS.storageOk = false; }

  var bc = null;
  try { bc = new BroadcastChannel("offseason"); } catch (e) {}
  var pending = null, timer = null;
  function notify(kind) {
    pending = (pending === "images" || kind === "images") ? "images" : "state";
    clearTimeout(timer);
    timer = setTimeout(function () {
      if (bc) bc.postMessage(pending);
      else { try { localStorage.setItem("offseason_ping", pending + Date.now()); } catch (e) {} }
      pending = null;
    }, 150);
  }
  OS.save = function (kind) {
    try { localStorage.setItem(KEY, JSON.stringify(OS.state)); OS.storageOk = true; } catch (e) { OS.storageOk = false; }
    notify(kind || "state");
    return OS.storageOk;
  };
  OS.onChange = function (fn) {
    if (bc) bc.onmessage = function (e) { fn(e.data); };
    w.addEventListener("storage", function (e) {
      if (!bc && e.key === "offseason_ping") fn("images");
      else if (e.key === KEY && !bc) fn("images");
    });
  };

  /* ---------- photos (IndexedDB) ---------- */
  var dbp = null;
  function db() {
    if (dbp) return dbp;
    dbp = new Promise(function (res) {
      try {
        var r = indexedDB.open("offseason", 1);
        r.onupgradeneeded = function () { r.result.createObjectStore("img"); };
        r.onsuccess = function () { res(r.result); };
        r.onerror = function () { res(null); };
        r.onblocked = function () { res(null); };
      } catch (e) { res(null); }
    });
    return dbp;
  }
  function tx(mode, fn) {
    return db().then(function (d) {
      return new Promise(function (res) {
        if (!d) return res(null);
        try {
          var t = d.transaction("img", mode), rq = fn(t.objectStore("img"));
          t.oncomplete = function () { res(rq ? rq.result : true); };
          t.onerror = t.onabort = function () { res(null); };
        } catch (e) { res(null); }
      });
    });
  }
  function toBuf(blob) {
    return new Promise(function (res, rej) {
      var r = new FileReader();
      r.onload = function () { res(r.result); };
      r.onerror = function () { rej(r.error); };
      r.readAsArrayBuffer(blob);
    });
  }
  OS.putImage = function (id, blob) {
    return toBuf(blob).then(function (buf) {
      return tx("readwrite", function (s) { return s.put({ t: blob.type || "image/jpeg", b: buf }, id); });
    }).then(function (r) {
      if (r === null) return false;
      if (OS.urls[id]) URL.revokeObjectURL(OS.urls[id]);
      OS.urls[id] = URL.createObjectURL(blob);
      return true;
    }, function () { return false; });
  };
  OS.delImage = function (id) {
    if (OS.urls[id]) { URL.revokeObjectURL(OS.urls[id]); delete OS.urls[id]; }
    return tx("readwrite", function (s) { return s["delete"](id); });
  };
  OS.clearImages = function () {
    Object.keys(OS.urls).forEach(function (k) { URL.revokeObjectURL(OS.urls[k]); });
    OS.urls = {};
    return tx("readwrite", function (s) { return s.clear(); });
  };
  function readAll() {
    return db().then(function (d) {
      return new Promise(function (res) {
        var out = {};
        if (!d) return res(out);
        try {
          var t = d.transaction("img", "readonly"), c = t.objectStore("img").openCursor();
          c.onsuccess = function () {
            var cur = c.result;
            if (cur) { out[cur.key] = new Blob([cur.value.b], { type: cur.value.t }); cur["continue"](); }
          };
          t.oncomplete = function () { res(out); };
          t.onerror = t.onabort = function () { res(out); };
        } catch (e) { res(out); }
      });
    });
  }
  OS.allBlobs = readAll;
  OS.loadImages = function () {
    return readAll().then(function (map) {
      Object.keys(OS.urls).forEach(function (k) { URL.revokeObjectURL(OS.urls[k]); });
      OS.urls = {};
      Object.keys(map).forEach(function (k) { OS.urls[k] = URL.createObjectURL(map[k]); });
    });
  };
  OS.src = function (ref) {
    if (!ref) return "";
    ref = String(ref);
    return ref.indexOf("idb:") === 0 ? (OS.urls[ref.slice(4)] || "") : ref;
  };
  OS.compress = function (file, max, q) {
    max = max || 1400; q = q || 0.82;
    return new Promise(function (res, rej) {
      var url = URL.createObjectURL(file), im = new Image();
      im.onload = function () {
        var k = Math.min(1, max / Math.max(im.naturalWidth, im.naturalHeight));
        var c = document.createElement("canvas");
        c.width = Math.max(1, Math.round(im.naturalWidth * k));
        c.height = Math.max(1, Math.round(im.naturalHeight * k));
        var x = c.getContext("2d");
        x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height);
        x.drawImage(im, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        c.toBlob(function (b) { b ? res(b) : rej(new Error("encode")); }, "image/jpeg", q);
      };
      im.onerror = function () { URL.revokeObjectURL(url); rej(new Error("load")); };
      im.src = url;
    });
  };

  OS.ready = OS.load() && OS.loadImages();
  OS.reload = function (withImages) {
    OS.load();
    OS.applyTheme(OS.state.theme);
    return withImages ? OS.loadImages() : Promise.resolve();
  };

  /* ---------- theme ---------- */
  OS.FONTS = {
    head: {
      "Big Shoulders Display": { stack: "'Big Shoulders Display','Arial Narrow',Impact,sans-serif", g: null },
      "Barlow Condensed": { stack: "'Barlow Condensed','Arial Narrow',Impact,sans-serif", g: "Barlow+Condensed:wght@700;800;900" },
      "Oswald": { stack: "'Oswald','Arial Narrow',Impact,sans-serif", g: "Oswald:wght@500;700" },
      "Anton": { stack: "'Anton','Arial Narrow',Impact,sans-serif", g: "Anton" },
      "Archivo": { stack: "'Archivo',system-ui,sans-serif", g: "Archivo:wght@800;900" }
    },
    body: {
      "Archivo": { stack: "'Archivo',system-ui,-apple-system,'Segoe UI',sans-serif", g: null },
      "Inter": { stack: "'Inter',system-ui,-apple-system,'Segoe UI',sans-serif", g: "Inter:wght@400;500;700" },
      "Work Sans": { stack: "'Work Sans',system-ui,-apple-system,'Segoe UI',sans-serif", g: "Work+Sans:wght@400;500;700" }
    }
  };
  OS.PRESETS = {
    "Bone & Ink (current)": { bone: "#E8E5DE", paper: "#F2F0EB", ink: "#0E0E0D", stone: "#7D796F", line: "#C9C5BB" },
    "Concrete": { bone: "#D9D9D6", paper: "#E6E6E3", ink: "#141414", stone: "#6F6F6B", line: "#BDBDB8" },
    "Sand": { bone: "#E6DCCB", paper: "#F0E8DA", ink: "#1B1712", stone: "#85796A", line: "#CFC3AE" },
    "Midnight": { bone: "#121211", paper: "#1B1B19", ink: "#ECE9E2", stone: "#8A867C", line: "#34332F" }
  };
  function ensureFont(f) {
    if (!f || !f.g) return;
    var id = "gf-" + f.g;
    if (document.getElementById(id)) return;
    var l = document.createElement("link");
    l.id = id; l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=" + f.g + "&display=swap";
    document.head.appendChild(l);
  }
  OS.applyTheme = function (t) {
    var r = document.documentElement;
    ["bone", "paper", "ink", "stone", "line"].forEach(function (k) { if (t[k]) r.style.setProperty("--" + k, t[k]); });
    var hf = OS.FONTS.head[t.headFont] || OS.FONTS.head["Big Shoulders Display"];
    var bf = OS.FONTS.body[t.bodyFont] || OS.FONTS.body["Archivo"];
    ensureFont(hf); ensureFont(bf);
    r.style.setProperty("--head", hf.stack);
    r.style.setProperty("--body", bf.stack);
    r.style.setProperty("--radius", (parseInt(t.radius, 10) || 0) + "px");
    r.classList.toggle("nograin", !t.grain);
    var m = document.querySelector('meta[name="theme-color"]');
    if (m && t.bone) m.setAttribute("content", t.bone);
  };

  /* ---------- admin password ---------- */
  function hex(buf) {
    return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ("0" + b.toString(16)).slice(-2); }).join("");
  }
  function weak(s) {
    var h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (var i = 0; i < s.length; i++) {
      var c = s.charCodeAt(i);
      h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
  }
  function derive(pw, salt, alg) {
    if (alg === "pbkdf2" && w.crypto && w.crypto.subtle && w.crypto.subtle.importKey) {
      var enc = new TextEncoder();
      return w.crypto.subtle.importKey("raw", enc.encode(pw), "PBKDF2", false, ["deriveBits"]).then(function (k) {
        return w.crypto.subtle.deriveBits({ name: "PBKDF2", salt: enc.encode(salt), iterations: 100000, hash: "SHA-256" }, k, 256);
      }).then(hex);
    }
    return Promise.resolve(weak(salt + ":" + pw));
  }
  function pwRec() { try { return JSON.parse(localStorage.getItem(PKEY)); } catch (e) { return null; } }
  OS.hasPw = function () { return !!pwRec(); };
  OS.setPw = function (pw) {
    var salt = hex(w.crypto && w.crypto.getRandomValues ? w.crypto.getRandomValues(new Uint8Array(16)) : new Uint8Array(16).map(function () { return Math.random() * 256; }));
    var alg = (w.crypto && w.crypto.subtle && w.crypto.subtle.importKey) ? "pbkdf2" : "weak";
    return derive(pw, salt, alg).then(function (h) {
      try { localStorage.setItem(PKEY, JSON.stringify({ salt: salt, hash: h, alg: alg })); return true; } catch (e) { return false; }
    });
  };
  OS.checkPw = function (pw) {
    var r = pwRec();
    if (!r) return Promise.resolve(false);
    return derive(pw, r.salt, r.alg).then(function (h) { return h === r.hash; });
  };
  OS.wipe = function () {
    try { localStorage.removeItem(KEY); localStorage.removeItem(PKEY); localStorage.removeItem(SKEY); sessionStorage.removeItem(SKEY); } catch (e) {}
    return OS.clearImages();
  };
})(window);

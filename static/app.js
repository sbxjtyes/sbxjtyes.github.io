"use strict";

const state = {
  address: localStorage.getItem("tm_address") || "",
  domains: [],
  retention: parseInt(localStorage.getItem("tm_retention") || "60", 10),
  domain: localStorage.getItem("tm_domain") || "",
  pollTimer: null,
  currentMsg: null,
  showImages: false,
};

const $ = (id) => document.getElementById(id);

// ------------------------------------------------------------------ helpers
function randomLocalpart(n = 10) {
  const alpha = "abcdefghijklmnopqrstuvwxyz";
  const alnum = alpha + "0123456789";
  let s = alpha[Math.floor(Math.random() * alpha.length)];
  for (let i = 1; i < n; i++) s += alnum[Math.floor(Math.random() * alnum.length)];
  return s;
}

function fmtTime(epoch) {
  const d = new Date(epoch * 1000);
  const pad = (x) => String(x).padStart(2, "0");
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const hm = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return sameDay ? hm : `${d.getMonth() + 1}/${d.getDate()} ${hm}`;
}

function escapeHtml(s) {
  return (s || "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

async function api(path, opts) {
  const res = await fetch(path, opts);
  if (!res.ok) throw new Error(`${res.status}`);
  return res.status === 204 ? null : res.json();
}

// ------------------------------------------------------------------ address
function setAddress(addr) {
  state.address = addr;
  localStorage.setItem("tm_address", addr);
  $("address").value = addr;
  refreshInbox();
}

function newAddress(domain) {
  const dom = domain || state.domain || state.domains[0] || "example.com";
  setAddress(`${randomLocalpart()}@${dom}`);
}

// ------------------------------------------------------------------ inbox
async function refreshInbox() {
  if (!state.address) return;
  let data;
  try {
    data = await api(`/api/inbox?address=${encodeURIComponent(state.address)}`);
  } catch (e) {
    return;
  }
  const cutoff = Date.now() / 1000 - state.retention * 60;
  const msgs = data.messages.filter((m) => m.received_at >= cutoff);
  renderMessages(msgs);
  $("count").textContent = msgs.length;
}

function renderMessages(msgs) {
  const list = $("messageList");
  if (!msgs.length) {
    list.innerHTML = `
      <li class="empty-state">
        <div class="empty-illustration">📭</div>
        <div class="empty-title">收件箱为空</div>
        <div class="empty-hint">把上面的地址填到需要验证的网站，邮件会自动出现在这里。</div>
      </li>`;
    return;
  }
  list.innerHTML = "";
  for (const m of msgs) {
    const li = document.createElement("li");
    li.className = "message-item";
    li.innerHTML = `
      <span class="msg-unread-dot ${m.seen ? "seen" : ""}"></span>
      <div class="msg-main">
        <div class="msg-from">${escapeHtml(m.sender || "未知发件人")}</div>
        <div class="msg-subject">${escapeHtml(m.subject || "(无主题)")}</div>
      </div>
      <div class="msg-time">${fmtTime(m.received_at)}</div>`;
    li.addEventListener("click", () => openMessage(m.id));
    list.appendChild(li);
  }
}

// ------------------------------------------------------------------ viewer
async function openMessage(id) {
  let msg;
  try {
    msg = await api(`/api/message/${id}`);
  } catch (e) {
    return;
  }
  state.currentMsg = msg;
  state.showImages = false;
  $("mSubject").textContent = msg.subject || "(无主题)";
  $("mFrom").textContent = msg.sender || "未知";
  $("mTo").textContent = msg.address || state.address;
  $("mDate").textContent = new Date(msg.received_at * 1000).toLocaleString();
  renderBody();
  $("modal").classList.remove("hidden");
  refreshInbox();
}

function renderBody() {
  const msg = state.currentMsg;
  const frame = $("mBodyFrame");
  const textEl = $("mBodyText");
  const imagesBtn = $("imagesBtn");

  if (msg.body_html) {
    const imgSrc = state.showImages ? "img-src https: data: cid:;" : "img-src 'none';";
    const csp =
      `default-src 'none'; style-src 'unsafe-inline'; ${imgSrc} font-src data:;`;
    const doc = `<!DOCTYPE html><html><head>
      <meta charset="utf-8">
      <meta http-equiv="Content-Security-Policy" content="${csp}">
      <base target="_blank">
      <style>body{font-family:-apple-system,"PingFang SC","Microsoft YaHei",sans-serif;
        color:#111;padding:8px;margin:0;line-height:1.6;word-break:break-word;}</style>
      </head><body>${msg.body_html}</body></html>`;
    frame.srcdoc = doc;
    frame.classList.remove("hidden");
    textEl.classList.add("hidden");
    imagesBtn.classList.toggle("hidden", state.showImages);
    imagesBtn.textContent = "🖼 显示图片";
  } else {
    textEl.textContent = msg.body_text || "(空邮件)";
    textEl.classList.remove("hidden");
    frame.classList.add("hidden");
    imagesBtn.classList.add("hidden");
  }
}

function closeModal() {
  $("modal").classList.add("hidden");
  state.currentMsg = null;
}

// ------------------------------------------------------------------ init
async function init() {
  let cfg;
  try {
    cfg = await api("/api/config");
  } catch (e) {
    cfg = { domains: ["example.com"], retention_options: [5, 10, 30, 60], default_retention: 60 };
  }
  state.domains = cfg.domains;
  if (!state.domain || !state.domains.includes(state.domain)) state.domain = state.domains[0];

  // domain select
  const ds = $("domainSelect");
  ds.innerHTML = "";
  for (const d of state.domains) {
    const o = document.createElement("option");
    o.value = d; o.textContent = "@" + d;
    ds.appendChild(o);
  }
  ds.value = state.domain;
  ds.addEventListener("change", () => {
    state.domain = ds.value;
    localStorage.setItem("tm_domain", state.domain);
    newAddress(state.domain);
  });

  // retention select
  const rs = $("retentionSelect");
  rs.innerHTML = "";
  for (const m of cfg.retention_options) {
    const o = document.createElement("option");
    o.value = m; o.textContent = m >= 60 ? `${m / 60} 小时` : `${m} 分钟`;
    rs.appendChild(o);
  }
  if (!cfg.retention_options.includes(state.retention)) state.retention = cfg.default_retention;
  rs.value = state.retention;
  rs.addEventListener("change", () => {
    state.retention = parseInt(rs.value, 10);
    localStorage.setItem("tm_retention", state.retention);
    refreshInbox();
  });

  // buttons
  $("copyBtn").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(state.address); }
    catch (e) {
      const el = $("address"); el.select(); document.execCommand("copy");
    }
    const t = $("copyToast");
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 1200);
  });
  $("changeBtn").addEventListener("click", () => newAddress());
  $("refreshBtn").addEventListener("click", refreshInbox);
  $("destroyBtn").addEventListener("click", async () => {
    if (!confirm("确定删除该地址下的所有邮件？")) return;
    await api(`/api/inbox?address=${encodeURIComponent(state.address)}`, { method: "DELETE" });
    refreshInbox();
  });
  $("modalClose").addEventListener("click", closeModal);
  document.querySelector(".modal-backdrop").addEventListener("click", closeModal);
  $("imagesBtn").addEventListener("click", () => { state.showImages = true; renderBody(); });
  $("deleteOneBtn").addEventListener("click", async () => {
    if (!state.currentMsg) return;
    await api(`/api/message/${state.currentMsg.id}`, { method: "DELETE" });
    closeModal();
    refreshInbox();
  });
  $("injectBtn").addEventListener("click", async () => {
    await api("/api/test-inject", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address: state.address }),
    });
    refreshInbox();
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

  // address
  if (!state.address || !state.address.includes("@")) newAddress();
  else $("address").value = state.address;

  refreshInbox();
  state.pollTimer = setInterval(refreshInbox, 5000);
}

init();

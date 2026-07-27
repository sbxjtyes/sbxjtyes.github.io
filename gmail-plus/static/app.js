"use strict";

const state = {
  local: "",
  domain: "gmail.com",
  tag: localStorage.getItem("gm_tag") || "",
  address: "",
  demo: false,
  pollTimer: null,
  currentMsg: null,
  showImages: false,
};

const $ = (id) => document.getElementById(id);

function randomTag(n = 8) {
  const alnum = "abcdefghijklmnopqrstuvwxyz0123456789";
  let s = "";
  for (let i = 0; i < n; i++) s += alnum[Math.floor(Math.random() * alnum.length)];
  return s;
}

function sanitizeTag(t) {
  return (t || "").toLowerCase().replace(/[^a-z0-9._-]/g, "");
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

function buildAddress() {
  const tag = state.tag || randomTag();
  state.tag = tag;
  state.address = `${state.local}+${tag}@${state.domain}`;
  $("address").value = state.address;
  localStorage.setItem("gm_tag", tag);
  if ($("tagInput").value !== tag) $("tagInput").value = tag;
  refreshInbox();
}

async function refreshInbox() {
  if (!state.address) return;
  let data;
  try {
    data = await api(`/api/inbox?address=${encodeURIComponent(state.address)}`);
  } catch (e) {
    return;
  }
  renderMessages(data.messages);
  $("count").textContent = data.messages.length;
}

function renderMessages(msgs) {
  const list = $("messageList");
  if (!msgs.length) {
    list.innerHTML = `
      <li class="empty-state">
        <div class="empty-illustration">📭</div>
        <div class="empty-title">这个标签还没有邮件</div>
        <div class="empty-hint">把上面的地址填到需要验证的网站，收到的邮件会自动出现在这里。</div>
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
  $("mTo").textContent = state.address;
  $("mDate").textContent = new Date(msg.received_at * 1000).toLocaleString();
  renderBody();
  $("modal").classList.remove("hidden");
}

function renderBody() {
  const msg = state.currentMsg;
  const frame = $("mBodyFrame");
  const textEl = $("mBodyText");
  const imagesBtn = $("imagesBtn");

  if (msg.body_html) {
    const imgSrc = state.showImages ? "img-src https: data: cid:;" : "img-src 'none';";
    const csp = `default-src 'none'; style-src 'unsafe-inline'; ${imgSrc} font-src data:;`;
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

async function init() {
  let cfg;
  try {
    cfg = await api("/api/config");
  } catch (e) {
    cfg = { base_address: "youraccount@gmail.com", local: "youraccount", domain: "gmail.com", demo: true };
  }
  state.local = cfg.local;
  state.domain = cfg.domain;
  state.demo = cfg.demo;
  $("baseAddr").textContent = cfg.base_address;
  if (cfg.demo) $("demoBanner").classList.remove("hidden");

  const tagInput = $("tagInput");
  tagInput.value = state.tag;
  tagInput.addEventListener("input", () => {
    const clean = sanitizeTag(tagInput.value);
    if (clean !== tagInput.value) tagInput.value = clean;
    state.tag = clean;
    if (clean) {
      state.address = `${state.local}+${clean}@${state.domain}`;
      $("address").value = state.address;
      localStorage.setItem("gm_tag", clean);
    }
  });
  tagInput.addEventListener("change", () => { if (!state.tag) buildAddress(); else refreshInbox(); });

  $("changeBtn").addEventListener("click", () => { state.tag = randomTag(); buildAddress(); });

  $("copyBtn").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(state.address); }
    catch (e) { const el = $("address"); el.select(); document.execCommand("copy"); }
    const t = $("copyToast");
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 1200);
  });
  $("refreshBtn").addEventListener("click", refreshInbox);
  $("destroyBtn").addEventListener("click", async () => {
    if (!confirm("把这个标签下的所有邮件移到 Gmail 回收站？（回收站 30 天内可恢复）")) return;
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
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

  buildAddress();
  state.pollTimer = setInterval(refreshInbox, 6000);
}

init();

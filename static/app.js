"use strict";

const state = {
  address: localStorage.getItem("tm_address") || "",
  domains: [],
  retention: parseInt(localStorage.getItem("tm_retention") || "60", 10),
  domain: localStorage.getItem("tm_domain") || "",
  pollTimer: null,
  refreshPromise: null,
  currentMsg: null,
  openingMessageId: null,
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

async function api(path, opts = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(path, { ...opts, signal: controller.signal });
    if (!res.ok) throw new Error(`请求失败（${res.status}）`);
    return res.status === 204 ? null : res.json();
  } catch (error) {
    if (error.name === "AbortError") throw new Error("请求超时，请重试");
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function showFeedback(message, type = "success") {
  const feedback = $("actionStatus");
  feedback.textContent = message;
  feedback.className = `action-status show ${type}`;
  clearTimeout(showFeedback.timer);
  showFeedback.timer = setTimeout(() => {
    feedback.className = "action-status";
  }, 2200);
}

function setButtonBusy(button, busy, label) {
  if (busy) {
    button.dataset.originalHtml = button.innerHTML;
    button.disabled = true;
    button.classList.add("is-busy");
    button.textContent = label;
    return;
  }
  button.disabled = false;
  button.classList.remove("is-busy");
  if (button.dataset.originalHtml) button.innerHTML = button.dataset.originalHtml;
}

function setInboxStatus(text, isError = false) {
  $("autoStatus").innerHTML = `<span class="dot${isError ? " error" : ""}"></span> ${text}`;
}

function prepareEmailHtml(html) {
  const parsed = new DOMParser().parseFromString(html, "text/html");
  parsed.querySelectorAll("script, iframe, object, embed").forEach((node) => node.remove());
  const styles = Array.from(parsed.head.querySelectorAll("style"), (style) => style.cloneNode(true));
  if (styles.length) parsed.body.prepend(...styles);
  for (const link of parsed.querySelectorAll("a[href], area[href]")) {
    const href = link.getAttribute("href").trim();
    if (!/^(https?:|mailto:)/i.test(href)) {
      link.removeAttribute("href");
      continue;
    }
    link.target = "_blank";
    link.rel = "noopener noreferrer";
  }
  return parsed.body.innerHTML;
}

function linkifyText(text) {
  const fragment = document.createDocumentFragment();
  const pattern = /\b(?:https?:\/\/|mailto:|www\.)[^\s<>"']+/gi;
  let cursor = 0;
  for (const match of text.matchAll(pattern)) {
    let url = match[0];
    let trailing = "";
    while (/[),.;:!?]$/.test(url)) {
      trailing = url.slice(-1) + trailing;
      url = url.slice(0, -1);
    }
    fragment.append(document.createTextNode(text.slice(cursor, match.index)));
    if (url) {
      const link = document.createElement("a");
      link.href = /^www\./i.test(url) ? `https://${url}` : url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = url;
      fragment.append(link);
    }
    if (trailing) fragment.append(document.createTextNode(trailing));
    cursor = match.index + match[0].length;
  }
  fragment.append(document.createTextNode(text.slice(cursor)));
  return fragment;
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
async function refreshInbox({ manual = false, force = false } = {}) {
  if (!state.address) return;
  if (state.refreshPromise) {
    if (!force) {
      if (manual) showFeedback("正在刷新收件箱");
      return state.refreshPromise;
    }
    await state.refreshPromise;
  }

  const address = state.address;
  const refreshButton = $("refreshBtn");
  if (manual) setButtonBusy(refreshButton, true, "刷新中...");
  setInboxStatus("正在刷新...");
  state.refreshPromise = (async () => {
    try {
      const data = await api(`/api/inbox?address=${encodeURIComponent(address)}`);
      if (address !== state.address) return;
      const cutoff = Date.now() / 1000 - state.retention * 60;
      const messages = data.messages.filter((message) => message.received_at >= cutoff);
      renderMessages(messages);
      $("count").textContent = messages.length;
      setInboxStatus("刚刚已更新");
      if (manual) showFeedback(`收件箱已更新，共 ${messages.length} 封邮件`);
    } catch (error) {
      if (address !== state.address) return;
      setInboxStatus("刷新失败", true);
      if (manual) showFeedback(error.message || "刷新失败，请重试", "error");
    } finally {
      state.refreshPromise = null;
      if (manual) setButtonBusy(refreshButton, false);
      if (address !== state.address) refreshInbox();
    }
  })();
  return state.refreshPromise;
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
    li.dataset.messageId = m.id;
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
  if (state.openingMessageId) return;
  state.openingMessageId = id;
  const item = document.querySelector(`[data-message-id="${id}"]`);
  item?.classList.add("is-loading");
  showFeedback("正在加载邮件内容");
  try {
    const msg = await api(`/api/message/${id}`);
    state.currentMsg = msg;
    state.showImages = false;
    $("mSubject").textContent = msg.subject || "(无主题)";
    $("mFrom").textContent = msg.sender || "未知";
    $("mTo").textContent = msg.address || state.address;
    $("mDate").textContent = new Date(msg.received_at * 1000).toLocaleString();
    renderBody();
    $("modal").classList.remove("hidden");
    refreshInbox();
  } catch (error) {
    showFeedback(error.message || "邮件加载失败，请重试", "error");
  } finally {
    state.openingMessageId = null;
    item?.classList.remove("is-loading");
  }
}

function renderBody() {
  const msg = state.currentMsg;
  const frame = $("mBodyFrame");
  const textEl = $("mBodyText");
  const imagesBtn = $("imagesBtn");

  if (msg.body_html) {
    const imgSrc = state.showImages ? "img-src https: data: cid:;" : "img-src 'none';";
    const csp =
      `default-src 'none'; style-src 'unsafe-inline'; ${imgSrc} font-src data:; form-action 'none';`;
    const doc = `<!DOCTYPE html><html><head>
      <meta charset="utf-8">
      <meta http-equiv="Content-Security-Policy" content="${csp}">
      <base target="_blank">
      <style>body{font-family:-apple-system,"PingFang SC","Microsoft YaHei",sans-serif;
        color:#111;padding:8px;margin:0;line-height:1.6;word-break:break-word;}</style>
      </head><body>${prepareEmailHtml(msg.body_html)}</body></html>`;
    frame.srcdoc = doc;
    frame.classList.remove("hidden");
    textEl.classList.add("hidden");
    imagesBtn.classList.toggle("hidden", state.showImages);
    imagesBtn.textContent = "🖼 显示图片";
  } else {
    textEl.replaceChildren(linkifyText(msg.body_text || "(空邮件)"));
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
    const button = $("copyBtn");
    setButtonBusy(button, true, "复制中...");
    try {
      await navigator.clipboard.writeText(state.address);
      showFeedback("邮箱地址已复制");
    } catch (error) {
      const input = $("address");
      input.select();
      try {
        if (document.execCommand("copy")) showFeedback("邮箱地址已复制");
        else showFeedback("复制失败，请手动复制", "error");
      } catch (fallbackError) {
        showFeedback("复制失败，请手动复制", "error");
      }
    } finally {
      setButtonBusy(button, false);
    }
  });
  $("changeBtn").addEventListener("click", () => {
    newAddress();
    showFeedback("已生成新的临时邮箱地址");
  });
  $("refreshBtn").addEventListener("click", () => refreshInbox({ manual: true }));
  $("destroyBtn").addEventListener("click", async () => {
    if (!confirm("确定删除该地址下的所有邮件？")) return;
    const button = $("destroyBtn");
    setButtonBusy(button, true, "销毁中...");
    try {
      const result = await api(`/api/inbox?address=${encodeURIComponent(state.address)}`, { method: "DELETE" });
      showFeedback(`已销毁 ${result.deleted || 0} 封邮件`);
      await refreshInbox({ manual: true, force: true });
    } catch (error) {
      showFeedback(error.message || "销毁失败，请重试", "error");
    } finally {
      setButtonBusy(button, false);
    }
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

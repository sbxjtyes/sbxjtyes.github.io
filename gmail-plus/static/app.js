"use strict";

const state = {
  local: "",
  domain: "gmail.com",
  tag: localStorage.getItem("gm_tag") || "",
  address: "",
  demo: false,
  pollTimer: null,
  refreshPromise: null,
  currentMsg: null,
  openingMessageId: null,
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

function buildAddress() {
  const tag = state.tag || randomTag();
  state.tag = tag;
  state.address = `${state.local}+${tag}@${state.domain}`;
  $("address").value = state.address;
  localStorage.setItem("gm_tag", tag);
  if ($("tagInput").value !== tag) $("tagInput").value = tag;
  refreshInbox();
}

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
      renderMessages(data.messages);
      $("count").textContent = data.messages.length;
      setInboxStatus("刚刚已更新");
      if (manual) showFeedback(`收件箱已更新，共 ${data.messages.length} 封邮件`);
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
        <div class="empty-title">这个标签还没有邮件</div>
        <div class="empty-hint">把上面的地址填到需要验证的网站，收到的邮件会自动出现在这里。</div>
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
    $("mTo").textContent = state.address;
    $("mDate").textContent = new Date(msg.received_at * 1000).toLocaleString();
    renderBody();
    $("modal").classList.remove("hidden");
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
    const csp = `default-src 'none'; style-src 'unsafe-inline'; ${imgSrc} font-src data:; form-action 'none';`;
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
  tagInput.addEventListener("change", () => {
    if (!state.tag) buildAddress();
    else {
      refreshInbox({ manual: true });
      showFeedback("已切换到该标签的收件箱");
    }
  });

  $("changeBtn").addEventListener("click", () => {
    state.tag = randomTag();
    buildAddress();
    showFeedback("已生成随机标签");
  });

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
  $("refreshBtn").addEventListener("click", () => refreshInbox({ manual: true }));
  $("destroyBtn").addEventListener("click", async () => {
    if (!confirm("把这个标签下的所有邮件移到 Gmail 回收站？（回收站 30 天内可恢复）")) return;
    const button = $("destroyBtn");
    setButtonBusy(button, true, "清空中...");
    try {
      const result = await api(`/api/inbox?address=${encodeURIComponent(state.address)}`, { method: "DELETE" });
      showFeedback(`已移到回收站 ${result.trashed || 0} 封邮件`);
      await refreshInbox({ manual: true, force: true });
    } catch (error) {
      showFeedback(error.message || "清空失败，请重试", "error");
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
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

  buildAddress();
  state.pollTimer = setInterval(refreshInbox, 6000);
}

init();

/**
 * TempMail on Cloudflare Workers.
 *
 *   email(message)  -> receives mail for *@your-domain, stores it in D1
 *   fetch(request)  -> serves the inbox UI (static assets) + /api/* JSON API
 *   scheduled()     -> purges messages older than the retention window
 *
 * No public server required: Cloudflare's mail servers receive the mail and
 * this Worker runs on their edge.
 */
import PostalMime from "postal-mime";

const MAX_BODY = 600 * 1024; // cap stored html/text to keep D1 rows small

function domains(env) {
  return (env.TEMPMAIL_DOMAINS || "example.com")
    .split(",")
    .map((d) => d.trim())
    .filter(Boolean);
}

function retention(env) {
  return parseInt(env.TEMPMAIL_RETENTION || "60", 10);
}

function truncate(s) {
  if (!s) return "";
  return s.length > MAX_BODY ? s.slice(0, MAX_BODY) : s;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function randomLocalpart(n = 10) {
  const alpha = "abcdefghijklmnopqrstuvwxyz";
  const alnum = alpha + "0123456789";
  let s = alpha[Math.floor(Math.random() * alpha.length)];
  for (let i = 1; i < n; i++) s += alnum[Math.floor(Math.random() * alnum.length)];
  return s;
}

// --------------------------------------------------------------------------
export default {
  // ---- Incoming mail ------------------------------------------------------
  async email(message, env, ctx) {
    const parser = new PostalMime();
    const parsed = await parser.parse(await new Response(message.raw).arrayBuffer());

    const to = String(message.to || "").toLowerCase().trim();
    const subject = parsed.subject || message.headers.get("subject") || "";
    let sender = message.from || "";
    if (parsed.from && parsed.from.address) {
      sender = parsed.from.name
        ? `${parsed.from.name} <${parsed.from.address}>`
        : parsed.from.address;
    }

    await env.DB.prepare(
      "INSERT INTO messages (id, address, sender, subject, body_text, body_html, received_at, seen) " +
        "VALUES (?, ?, ?, ?, ?, ?, ?, 0)"
    )
      .bind(
        crypto.randomUUID().replace(/-/g, ""),
        to,
        sender,
        subject,
        truncate(parsed.text || ""),
        truncate(parsed.html || ""),
        Math.floor(Date.now() / 1000)
      )
      .run();
  },

  // ---- HTTP: UI + API -----------------------------------------------------
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const p = url.pathname;

    if (!p.startsWith("/api/")) {
      // Everything else is served from the bundled static assets (public/).
      return env.ASSETS.fetch(request);
    }

    try {
      if (p === "/api/config" && request.method === "GET") {
        return json({
          domains: domains(env),
          retention_options: [5, 10, 30, 60],
          default_retention: retention(env),
        });
      }

      if (p === "/api/generate" && request.method === "POST") {
        const doms = domains(env);
        const wanted = url.searchParams.get("domain");
        const chosen = wanted && doms.includes(wanted) ? wanted : doms[0];
        return json({ address: `${randomLocalpart()}@${chosen}` });
      }

      if (p === "/api/inbox") {
        const address = (url.searchParams.get("address") || "").toLowerCase().trim();
        if (!address) return json({ error: "address required" }, 400);

        if (request.method === "GET") {
          const { results } = await env.DB.prepare(
            "SELECT id, sender, subject, received_at, seen, " +
              "(body_html IS NOT NULL AND body_html != '') AS has_html " +
              "FROM messages WHERE address = ? ORDER BY received_at DESC"
          )
            .bind(address)
            .all();
          return json({ address, count: results.length, messages: results });
        }
        if (request.method === "DELETE") {
          const r = await env.DB.prepare("DELETE FROM messages WHERE address = ?")
            .bind(address)
            .run();
          return json({ deleted: r.meta.changes || 0 });
        }
      }

      const m = p.match(/^\/api\/message\/([a-f0-9]+)$/);
      if (m) {
        const id = m[1];
        if (request.method === "GET") {
          const row = await env.DB.prepare("SELECT * FROM messages WHERE id = ?")
            .bind(id)
            .first();
          if (!row) return json({ error: "not found" }, 404);
          ctx.waitUntil(
            env.DB.prepare("UPDATE messages SET seen = 1 WHERE id = ?").bind(id).run()
          );
          return json(row);
        }
        if (request.method === "DELETE") {
          const r = await env.DB.prepare("DELETE FROM messages WHERE id = ?")
            .bind(id)
            .run();
          return json({ deleted: r.meta.changes || 0 });
        }
      }

      return json({ error: "not found" }, 404);
    } catch (err) {
      return json({ error: String(err) }, 500);
    }
  },

  // ---- Scheduled cleanup --------------------------------------------------
  async scheduled(event, env, ctx) {
    const cutoff = Math.floor(Date.now() / 1000) - retention(env) * 60;
    await env.DB.prepare("DELETE FROM messages WHERE received_at < ?").bind(cutoff).run();
  },
};

const RESEND_URL = "https://api.resend.com/emails";
const MAX_BODY_BYTES = 20000;

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const allowedOrigins = String(env.ALLOWED_ORIGINS || "").split(",").map(value => value.trim()).filter(Boolean);
    if (!origin || !allowedOrigins.includes(origin)) return new Response("Forbidden", { status: 403 });

    const cors = {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "600",
      "Vary": "Origin"
    };
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (request.method !== "POST") return json({ ok: false, message: "Method not allowed" }, 405, cors);
    const path = new URL(request.url).pathname;
    if (path !== "/" && path !== "/submit") return json({ ok: false, message: "Not found" }, 404, cors);
    if (!String(request.headers.get("Content-Type") || "").toLowerCase().includes("application/json")) {
      return json({ ok: false, message: "Expected JSON" }, 415, cors);
    }

    let raw;
    try {
      raw = await request.text();
      if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) return json({ ok: false, message: "Request too large" }, 413, cors);
    } catch {
      return json({ ok: false, message: "Invalid request" }, 400, cors);
    }

    let data;
    try { data = JSON.parse(raw); } catch { return json({ ok: false, message: "Invalid request" }, 400, cors); }
    if (!data || typeof data !== "object" || Array.isArray(data)) return json({ ok: false, message: "Invalid request" }, 400, cors);
    if (String(data.company || "").trim()) return json({ ok: true, customerConfirmationSent: false }, 202, cors);
    const type = data.type === "test_drive" ? "test_drive" : data.type === "contact" ? "contact" : "";
    const name = bounded(data.name, 120);
    const email = bounded(data.email, 254);
    const phone = bounded(data.phone, 50);
    const vehicle = bounded(data.vehicle, 160);
    const message = bounded(data.message, 5000);
    const accepted = data.privacyAccepted === true || data.privacyAccepted === "true";
    if (!type || name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !accepted || (type === "test_drive" && !vehicle) || (type === "contact" && !message)) {
      return json({ ok: false, message: "Bitte prüfen Sie die Pflichtfelder und Datenschutzhinweise." }, 400, cors);
    }
    if (!env.RESEND_API_KEY || !env.FROM_EMAIL || !env.INTERNAL_RECIPIENT) {
      return json({ ok: false, message: "Formularversand ist noch nicht vollständig eingerichtet." }, 503, cors);
    }

    const inquiryLabel = type === "test_drive" ? "Probefahrtanfrage" : "Kontaktanfrage";
    const subject = type === "test_drive"
      ? "Probefahrtanfrage: " + cleanHeader(vehicle)
      : "Kontaktanfrage über die Website";
    const fields = [
      ["Anfrageart", inquiryLabel],
      ["Name", name],
      ["E-Mail", email],
      ["Telefon", phone || "Keine Angabe"],
      ["Wunschfahrzeug", vehicle || "Keine Angabe"],
      ["Nachricht", message || "Keine Angabe"]
    ];
    const inquiry = {
      schemaVersion: 1,
      type,
      requestType: inquiryLabel,
      receivedAt: new Date().toISOString(),
      name,
      email,
      phone: phone || "",
      vehicle: vehicle || "",
      message
    };
    const inquiryJson = JSON.stringify(inquiry, null, 2);
    const rows = fields.map(([label, value]) => "<tr><th align=\\"left\\" style=\\"padding:8px;border-bottom:1px solid #ddd\\">" + escapeHtml(label) + "</th><td style=\\"padding:8px;border-bottom:1px solid #ddd\\">" + escapeHtml(value) + "</td></tr>").join("");
    const notificationHtml = "<div style=\\"font:16px/1.5 Arial,sans-serif;color:#181818\\"><h2>Neue " + escapeHtml(inquiryLabel) + "</h2><table style=\\"border-collapse:collapse;width:100%\\">" + rows + "</table><h3>Anfrage als JSON</h3><pre style=\\"white-space:pre-wrap;background:#f4f4f4;padding:12px;border-radius:4px\\">" + escapeHtml(inquiryJson) + "</pre></div>";
    const notificationText = fields.map(([label, value]) => label + ": " + value).join("\n") + "\n\nAnfrage als JSON:\n" + inquiryJson;
    const internal = await sendMail(env, {
      from: env.FROM_EMAIL,
      to: [env.INTERNAL_RECIPIENT],
      reply_to: email,
      subject,
      html: notificationHtml,
      text: notificationText
    });
    if (!internal.ok) return json({ ok: false, message: "Ihre Anfrage konnte gerade nicht übermittelt werden. Bitte rufen Sie uns an." }, 502, cors);

    let customerConfirmationSent = false;
    if (String(env.CUSTOMER_CONFIRMATION || "").toLowerCase() === "true") {
      const requestDescription = type === "test_drive" ? "Ihre Probefahrtanfrage zu " + vehicle : "Ihre Nachricht";
      const customerHtml = "<div style=\"font:16px/1.6 Arial,sans-serif;color:#181818\"><p>Guten Tag " + escapeHtml(name) + ",</p><p>vielen Dank für " + escapeHtml(requestDescription) + ". Wir haben Ihre Anfrage erhalten und melden uns schnellstmöglich bei Ihnen zurück.</p><p>Freundliche Grüße<br>Automobile Rosenkranz GmbH</p></div>";
      const customerText = "Guten Tag " + name + ",\n\nvielen Dank für " + requestDescription + ". Wir haben Ihre Anfrage erhalten und melden uns schnellstmöglich bei Ihnen zurück.\n\nFreundliche Grüße\nAutomobile Rosenkranz GmbH";
      const confirmation = await sendMail(env, {
        from: env.FROM_EMAIL,
        to: [email],
        reply_to: env.REPLY_TO_EMAIL || env.INTERNAL_RECIPIENT,
        subject: "Wir haben Ihre Anfrage erhalten",
        html: customerHtml,
        text: customerText
      });
      customerConfirmationSent = confirmation.ok;
    }
    return json({ ok: true, customerConfirmationSent }, 200, cors);
  }
};

async function sendMail(env, payload) {
  try {
    const response = await fetch(RESEND_URL, {
      method: "POST",
      headers: { "Authorization": "Bearer " + env.RESEND_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return { ok: response.ok };
  } catch {
    return { ok: false };
  }
}

function bounded(value, limit) {
  return String(value || "").trim().slice(0, limit);
}
function cleanHeader(value) {
  return String(value || "").replace(/[\r\n]+/g, " ").slice(0, 160);
}
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"
  }[char]));
}
function json(body, status, headers) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
  });
}

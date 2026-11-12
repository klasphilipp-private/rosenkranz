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
    const rows = fields.map(([label, value]) => "<tr><th align=\"left\" style=\"padding:8px;border-bottom:1px solid #ddd\">" + escapeHtml(label) + "</th><td style=\"padding:8px;border-bottom:1px solid #ddd\">" + escapeHtml(value) + "</td></tr>").join("");
    const notificationHtml = "<div style=\"font:16px/1.5 Arial,sans-serif;color:#181818\"><h2>Neue " + escapeHtml(inquiryLabel) + "</h2><table style=\"border-collapse:collapse;width:100%\">" + rows + "</table><h3>Anfrage als JSON</h3><pre style=\"white-space:pre-wrap;background:#f4f4f4;padding:12px;border-radius:4px\">" + escapeHtml(inquiryJson) + "</pre></div>";
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
      const requestTypeLabel = type === "test_drive" ? "Probefahrtanfrage" : "Kontaktanfrage";
      const requestDescription = type === "test_drive" ? "Ihre Probefahrtanfrage für " + vehicle : "Ihre Nachricht an Automobile Rosenkranz";
      const vehicleSummary = type === "test_drive"
        ? "<tr><td style=\"padding:10px 0;color:#666;border-bottom:1px solid #dedbd7\">Wunschfahrzeug</td><td align=\"right\" style=\"padding:10px 0;color:#151515;font-weight:700;border-bottom:1px solid #dedbd7\">" + escapeHtml(vehicle) + "</td></tr>"
        : "";
      const customerHtml = `<!doctype html>
<html lang="de">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Ihre Anfrage bei Automobile Rosenkranz</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f2f1ef;font-family:Arial,Helvetica,sans-serif;color:#151515">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0">Ihre Anfrage ist bei Automobile Rosenkranz eingegangen.</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background-color:#f2f1ef">
      <tr><td align="center" style="padding:32px 14px">
        <table role="presentation" width="640" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:640px;background-color:#ffffff">
          <tr>
            <td style="padding:26px 32px 22px;background-color:#151515;border-bottom:4px solid #c60805">
              <a href="https://www.automobile-rosenkranz.de/" style="display:inline-block;text-decoration:none">
                <img src="https://klasphilipp-private.github.io/rosenkranz/assets/logo-header.png" width="220" alt="Automobile Rosenkranz" style="display:block;width:220px;max-width:100%;height:auto;border:0">
              </a>
              <p style="margin:12px 0 0;color:#c9c9c9;font-size:11px;line-height:1.4;letter-spacing:2px;text-transform:uppercase">Qualität bewegt seit 1992</p>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 32px 28px">
              <p style="margin:0 0 10px;color:#c60805;font-size:12px;line-height:1.4;font-weight:700;letter-spacing:2px;text-transform:uppercase">Eingangsbestätigung</p>
              <h1 style="margin:0 0 18px;color:#151515;font-size:30px;line-height:1.2;font-weight:700">Vielen Dank, ${escapeHtml(name)}.</h1>
              <p style="margin:0 0 22px;color:#4d4d4d;font-size:16px;line-height:1.7">${escapeHtml(requestDescription)} ist bei uns eingegangen. Unser Team meldet sich schnellstmöglich persönlich bei Ihnen.</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background-color:#f4f3f1;border-left:3px solid #c60805">
                <tr><td style="padding:15px 18px">
                  <p style="margin:0 0 10px;color:#c60805;font-size:11px;line-height:1.4;font-weight:700;letter-spacing:1.5px;text-transform:uppercase">Ihre Anfrage</p>
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                    <tr><td style="padding:10px 0;color:#666;border-bottom:1px solid #dedbd7">Anliegen</td><td align="right" style="padding:10px 0;color:#151515;font-weight:700;border-bottom:1px solid #dedbd7">${escapeHtml(requestTypeLabel)}</td></tr>
                    ${vehicleSummary}
                  </table>
                </td></tr>
              </table>
              <p style="margin:22px 0 0;color:#4d4d4d;font-size:15px;line-height:1.7">Diese Nachricht bestätigt den Eingang Ihrer Anfrage. Sie müssen nichts weiter unternehmen. Wenn Sie noch etwas ergänzen möchten, erreichen Sie uns telefonisch oder per E-Mail.</p>
              <p style="margin:24px 0 0;color:#4d4d4d;font-size:15px;line-height:1.7">Freundliche Grüße<br><strong style="color:#151515">Ihr Team von Automobile Rosenkranz</strong></p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px;background-color:#151515;color:#d2d2d2">
              <p style="margin:0 0 8px;color:#ffffff;font-size:16px;font-weight:700">Automobile Rosenkranz GmbH</p>
              <p style="margin:0 0 12px;font-size:14px;line-height:1.65">Holthoffstraße 124<br>45659 Recklinghausen</p>
              <p style="margin:0 0 8px;font-size:14px;line-height:1.7"><a href="tel:+49236191490" style="color:#ffffff;text-decoration:underline;text-decoration-color:#c60805">02361 / 9149-0</a><br><a href="mailto:info@automobile-rosenkranz.de" style="color:#ffffff;text-decoration:underline;text-decoration-color:#c60805">info@automobile-rosenkranz.de</a></p>
              <p style="margin:12px 0 0;color:#a9a9a9;font-size:12px;line-height:1.6">Verkauf: Mo–Fr 08:00–18:30 · Sa 09:00–14:00<br>Service: Mo–Fr 08:00–16:45 · Sa 09:00–14:00</p>
              <p style="margin:18px 0 0;padding-top:14px;border-top:1px solid #393939;color:#929292;font-size:11px;line-height:1.6">Automobile Rosenkranz · Qualität bewegt seit 1992<br><a href="https://klasphilipp-private.github.io/rosenkranz/impressum/" style="color:#d2d2d2;text-decoration:underline">Impressum</a> &nbsp;·&nbsp; <a href="https://klasphilipp-private.github.io/rosenkranz/datenschutz/" style="color:#d2d2d2;text-decoration:underline">Datenschutz</a></p>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
      const customerText = [
        "Guten Tag " + name + ",",
        "",
        "vielen Dank. " + requestDescription + " ist bei uns eingegangen.",
        "Unser Team meldet sich schnellstmöglich persönlich bei Ihnen.",
        "",
        "Anliegen: " + requestTypeLabel,
        ...(type === "test_drive" ? ["Wunschfahrzeug: " + vehicle] : []),
        "",
        "Freundliche Grüße",
        "Ihr Team von Automobile Rosenkranz",
        "",
        "Automobile Rosenkranz GmbH",
        "Holthoffstraße 124",
        "45659 Recklinghausen",
        "Telefon: 02361 / 9149-0",
        "E-Mail: info@automobile-rosenkranz.de",
        "",
        "Verkauf: Mo–Fr 08:00–18:30 · Sa 09:00–14:00",
        "Service: Mo–Fr 08:00–16:45 · Sa 09:00–14:00"
      ].join("\n");
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

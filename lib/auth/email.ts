import { Resend } from "resend";
import { CODE_TTL_MINUTES } from "@/lib/auth/codes";

const ink = "#131613";
const paper = "#faf8f3";
const bg = "#f4f1ea";
const accent = "#0e5d44";
const muted = "#6b6e69";
const hairline = "rgba(19, 22, 19, 0.10)";

function codeEmailHtml(code: string, heading: string, lead: string): string {
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;background:${bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${ink};">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${bg};padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="520" style="max-width:520px;background:${paper};border:1px solid ${hairline};border-radius:16px;overflow:hidden;">
        <tr><td style="padding:26px 32px;border-bottom:1px solid ${hairline};">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
            <td style="background:${ink};color:${paper};width:30px;height:30px;border-radius:8px;font-family:Georgia,serif;font-style:italic;font-size:20px;text-align:center;line-height:30px;">f</td>
            <td style="padding-left:10px;font-weight:600;font-size:15px;">Fastscraping</td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:32px 32px 8px;">
          <h1 style="margin:0 0 10px;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:26px;line-height:1.2;color:${ink};">${heading}</h1>
          <p style="margin:0;font-size:14.5px;line-height:1.6;color:${muted};">${lead}</p>
        </td></tr>
        <tr><td style="padding:24px 32px 8px;">
          <div style="background:${bg};border:1px solid ${hairline};border-radius:12px;padding:20px;text-align:center;">
            <div style="font-family:ui-monospace,'Segoe UI Mono',Menlo,monospace;font-size:34px;letter-spacing:0.34em;color:${ink};font-weight:600;">${code}</div>
          </div>
          <p style="margin:14px 0 0;font-family:ui-monospace,'Segoe UI Mono',Menlo,monospace;font-size:11.5px;color:${muted};text-align:center;">
            Expires in ${CODE_TTL_MINUTES} minutes · one-time use
          </p>
        </td></tr>
        <tr><td style="padding:22px 32px 30px;">
          <p style="margin:0;font-size:13px;line-height:1.6;color:${muted};">
            If you didn't request this, you can ignore this email — nothing changes without the code.
          </p>
        </td></tr>
        <tr><td style="padding:16px 32px 22px;border-top:1px solid ${hairline};background:${bg};">
          <div style="font-family:ui-monospace,'Segoe UI Mono',Menlo,monospace;font-size:11px;color:${muted};">
            Fastscraping · client dashboard<br/>Never share this code with anyone.
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function send(to: string, subject: string, html: string, text: string) {
  // Local convenience: print the code to the server log instead of emailing.
  // Guarded twice so it can never fire in production.
  if (process.env.NODE_ENV !== "production" && process.env.AUTH_EMAIL_DEV_LOG === "1") {
    console.log(`\n[auth-email:DEV] to=${to} :: ${text}\n`);
    return { ok: true as const };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("[auth-email] missing RESEND_API_KEY");
    return { ok: false as const, error: "Email service not configured." };
  }
  const resend = new Resend(apiKey);
  const from = process.env.CONTACT_FROM ?? "Fastscraping <notes@fastscraping.com>";
  const { error } = await resend.emails.send({ from, to, subject, html, text });
  if (error) {
    console.error("[auth-email] resend error", error);
    return { ok: false as const, error: "Could not send the email." };
  }
  return { ok: true as const };
}

export function sendSignupCode(to: string, code: string) {
  return send(
    to,
    "Your Fastscraping verification code",
    codeEmailHtml(
      code,
      "Verify your email.",
      "Enter this code on the signup screen to finish creating your Fastscraping dashboard account.",
    ),
    `Your Fastscraping verification code is ${code}. It expires in ${CODE_TTL_MINUTES} minutes.`,
  );
}

export function sendResetCode(to: string, code: string) {
  return send(
    to,
    "Reset your Fastscraping password",
    codeEmailHtml(
      code,
      "Reset your password.",
      "Enter this code on the password reset screen to choose a new password.",
    ),
    `Your Fastscraping password reset code is ${code}. It expires in ${CODE_TTL_MINUTES} minutes.`,
  );
}

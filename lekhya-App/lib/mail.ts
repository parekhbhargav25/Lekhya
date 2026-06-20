import nodemailer from "nodemailer";

const user = process.env.GMAIL_USER;
const pass = process.env.GMAIL_APP_PASSWORD;

const transporter =
  user && pass
    ? nodemailer.createTransport({
        service: "gmail",
        auth: { user, pass },
      })
    : null;

const FROM = process.env.MAIL_FROM || (user ? `Lekhya <${user}>` : "");

export async function sendVerificationEmail(to: string, code: string) {
  if (!transporter) {
    console.warn(
      `[mail] GMAIL_USER / GMAIL_APP_PASSWORD not set — printing code for ${to}: ${code}`
    );
    return;
  }

  try {
    await transporter.sendMail({
      from: FROM,
      to,
      subject: `Your Lekhya verification code: ${code}`,
      text: `Your Lekhya verification code is ${code}. It expires in 10 minutes.`,
      html: renderEmail(code),
    });
  } catch (err) {
    console.error("[mail] Gmail SMTP error", err);
    throw new Error("Failed to send verification email");
  }
}

function renderEmail(code: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#1a1512;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#1a1512;padding:40px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:24px;overflow:hidden;">
            <tr>
              <td style="padding:40px 40px 16px;">
                <div style="display:inline-flex;align-items:center;gap:8px;">
                  <span style="display:inline-block;width:28px;height:28px;border-radius:9999px;background:linear-gradient(135deg,#8b5cf6,#ec4899,#fbbf24);"></span>
                  <span style="font-size:20px;font-weight:600;color:#0f172a;">Lekhya</span>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 40px 0;">
                <h1 style="margin:0;font-size:28px;font-weight:600;color:#0f172a;letter-spacing:-0.02em;">
                  Verify your email
                </h1>
                <p style="margin:12px 0 0;font-size:14px;line-height:1.6;color:#64748b;">
                  Enter the code below to finish creating your account. This code expires in 10 minutes.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 40px;">
                <div style="background-color:#7b61ff;background-image:linear-gradient(135deg,#7b61ff,#c084fc);border-radius:16px;padding:24px;text-align:center;">
                  <div style="font-size:36px;font-weight:700;letter-spacing:0.4em;color:#ffffff;font-family:'SF Mono',Menlo,monospace;">
                    ${code}
                  </div>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:0 40px 40px;">
                <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">
                  If you didn't request this code, you can safely ignore this email.
                </p>
              </td>
            </tr>
          </table>
          <p style="margin:16px 0 0;font-size:11px;color:#64748b;">© 2025 Lekhya Inc.</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

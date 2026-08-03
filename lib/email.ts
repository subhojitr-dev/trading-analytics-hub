import nodemailer from "nodemailer";
import type { AnalysisRequest } from "./requests";

// Reuses the same Gmail account + App Password already used by every bot in
// tradingbot/*/notifier.py for its own email alerts -- kept as env vars here
// (not hardcoded) to match this project's existing secrets convention.
export async function sendRequestNotification(record: Omit<AnalysisRequest, "id">): Promise<void> {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD?.replace(/\s+/g, ""); // Gmail App Passwords display with spaces
  const to = process.env.NOTIFY_EMAIL || user;

  if (!user || !pass) {
    console.warn("SMTP_USER/SMTP_PASSWORD not set -- skipping request notification email");
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: { user, pass },
  });

  // Fixed, identical subject on every submission -- so a single Gmail filter
  // matching this exact text can reliably catch all of them, regardless of
  // what was actually requested (that detail goes in the body instead).
  const subject = "Trading Analytics Hub: New Request Submitted";
  const lines: string[] = [];

  if (record.stock) {
    lines.push(`Analyze stock: ${record.stock.symbol}`);
    if (record.stock.extraCriteria) lines.push(`  Extra criteria: ${record.stock.extraCriteria}`);
  }

  if (record.optionsTest) {
    lines.push(`Test strategy: ${record.optionsTest.strategy} on ${record.optionsTest.symbol}`);
    if (record.optionsTest.notes) lines.push(`  Notes: ${record.optionsTest.notes}`);
  }

  const submittedAt = new Date(record.submittedAt).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  await transporter.sendMail({
    from: user,
    to,
    subject,
    text:
      `A new request was submitted at ${submittedAt}:\n\n` +
      lines.join("\n") +
      `\n\nView all requests: https://trading-analytics-hub.vercel.app/requests`,
  });
}

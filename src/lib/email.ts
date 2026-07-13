import { Resend } from "resend";
import { DEFAULT_PROPOSAL_TEXT, DEFAULT_VOTE_TEXT } from "./email-templates";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const FROM_EMAIL = process.env.EMAIL_FROM || "onboarding@resend.dev";
const FROM_NAME = process.env.EMAIL_FROM_NAME || "Pick the Place";

function fillTemplate(
  template: string,
  eventTitle: string,
  name: string,
): string {
  return template.replace(/EVENTNAME/g, eventTitle).replace(/NAME/g, name);
}

export async function sendProposalInvite(
  email: string,
  name: string,
  token: string,
  eventTitle: string,
  customText?: string | null,
) {
  const bodyText = customText || DEFAULT_PROPOSAL_TEXT;
  const filled = fillTemplate(bodyText, eventTitle, name);

  if (!resend) {
    console.log(
      `[EMAIL MOCK] Proposal invite to ${email}: ${APP_URL}/propose?token=${token} — "${filled}"`,
    );
    return { success: true, mocked: true };
  }

  const subject = `🌍 Ort vorschlagen – ${eventTitle}`;

  const { data, error } = await resend.emails.send({
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to: email,
    subject,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h1 style="color: #620DFF;">Hallo ${name}!</h1>
        <p>${filled}</p>
        <p>Klicke auf den Button, um deinen Vorschlag einzureichen oder zu sehen, welche Orte schon vorgeschlagen wurden:</p>
        <a href="${APP_URL}/propose?token=${token}" style="display: inline-block; background: #620DFF; color: white; padding: 12px 24px; border-radius: 9999px; text-decoration: none; margin: 16px 0;">
          Ort vorschlagen
        </a>
        <p style="color: #6b7280; font-size: 14px;">Dieser Link ist persönlich und nur für dich bestimmt.</p>
        <hr style="border:none;border-top:1px solid #EDECF3;margin:24px 0 12px;" />
        <p style="color:#9a94ac;font-size:12px;margin:0;">Pick the Place · <span style="color:#620DFF;font-weight:bold;">revenexx</span></p>
      </div>
    `,
  });

  if (error) {
    console.error("Failed to send proposal invite:", error);
    return { success: false, error };
  }

  return { success: true, data };
}

export async function sendVoteInvite(
  email: string,
  name: string,
  token: string,
  roundNumber: number,
  eventTitle: string,
  customText?: string | null,
) {
  const bodyText = (customText || DEFAULT_VOTE_TEXT).replace(
    /ROUND/g,
    String(roundNumber),
  );
  const filled = fillTemplate(bodyText, eventTitle, name);

  if (!resend) {
    console.log(
      `[EMAIL MOCK] Vote invite to ${email}: ${APP_URL}/vote?token=${token} — "${filled}"`,
    );
    return { success: true, mocked: true };
  }

  const subject = `🗳️ Wahlrunde ${roundNumber} – ${eventTitle}`;

  const { data, error } = await resend.emails.send({
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to: email,
    subject,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h1 style="color: #620DFF;">Hallo ${name}!</h1>
        <p>${filled}</p>
        <p>Wähle deinen Favoriten aus den vorgeschlagenen Orten:</p>
        <a href="${APP_URL}/vote?token=${token}" style="display: inline-block; background: #620DFF; color: white; padding: 12px 24px; border-radius: 9999px; text-decoration: none; margin: 16px 0;">
          Jetzt abstimmen
        </a>
        <p style="color: #6b7280; font-size: 14px;">Dieser Link ist persönlich und nur für dich bestimmt.</p>
        <hr style="border:none;border-top:1px solid #EDECF3;margin:24px 0 12px;" />
        <p style="color:#9a94ac;font-size:12px;margin:0;">Pick the Place · <span style="color:#620DFF;font-weight:bold;">revenexx</span></p>
      </div>
    `,
  });

  if (error) {
    console.error("Failed to send vote invite:", error);
    return { success: false, error };
  }

  return { success: true, data };
}

export async function sendPasswordReset(
  email: string,
  name: string,
  resetLink: string,
) {
  if (!resend) {
    console.log(`[EMAIL MOCK] Password reset to ${email}: ${resetLink}`);
    return { success: true, mocked: true };
  }

  const { data, error } = await resend.emails.send({
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to: email,
    subject: "🔑 Passwort zurücksetzen – Pick the Place",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h1 style="color: #620DFF;">Hallo ${name}!</h1>
        <p>Du hast angefragt, dein Admin-Passwort zurückzusetzen. Klicke auf den Button, um ein neues Passwort zu vergeben:</p>
        <a href="${resetLink}" style="display: inline-block; background: #620DFF; color: white; padding: 12px 24px; border-radius: 9999px; text-decoration: none; margin: 16px 0;">
          Passwort zurücksetzen
        </a>
        <p style="color: #6b7280; font-size: 14px;">Dieser Link ist eine Stunde gültig. Wenn du das nicht angefragt hast, kannst du diese E-Mail einfach ignorieren – dein Passwort bleibt unverändert.</p>
        <hr style="border:none;border-top:1px solid #EDECF3;margin:24px 0 12px;" />
        <p style="color:#9a94ac;font-size:12px;margin:0;">Pick the Place · <span style="color:#620DFF;font-weight:bold;">revenexx</span></p>
      </div>
    `,
  });

  if (error) {
    console.error("Failed to send password reset:", error);
    return { success: false, error };
  }

  return { success: true, data };
}

export async function sendResultsNotification(
  email: string,
  name: string,
  token: string,
  winnerName: string,
) {
  if (!resend) {
    console.log(`[EMAIL MOCK] Results to ${email}: ${winnerName} won!`);
    return { success: true, mocked: true };
  }

  const { data, error } = await resend.emails.send({
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to: email,
    subject: `🏆 Ergebnis: Unser nächstes Jahrestreffen findet statt in...`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h1 style="color: #620DFF;">Hallo ${name}!</h1>
        <p>Die Wahl ist entschieden! 🎉</p>
        <p style="font-size: 24px; font-weight: bold; text-align: center; margin: 24px 0; color: #059669;">
          ${winnerName}
        </p>
        <p>Das nächstes Jahrestreffen findet in <strong>${winnerName}</strong> statt.</p>
        <a href="${APP_URL}/results?token=${token}" style="display: inline-block; background: #620DFF; color: white; padding: 12px 24px; border-radius: 9999px; text-decoration: none; margin: 16px 0;">
          Details ansehen
        </a>
        <hr style="border:none;border-top:1px solid #EDECF3;margin:24px 0 12px;" />
        <p style="color:#9a94ac;font-size:12px;margin:0;">Pick the Place · <span style="color:#620DFF;font-weight:bold;">revenexx</span></p>
      </div>
    `,
  });

  if (error) {
    console.error("Failed to send results notification:", error);
    return { success: false, error };
  }

  return { success: true, data };
}

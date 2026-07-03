/**
 * Feste revenexx-Kollegenliste – gemeinsame Quelle für Default-Teilnehmer neuer
 * Events (siehe events-Route) und für die Admin-Zugänge (siehe ensureAdminSeeded).
 * Es gibt nur E-Mails; der Anzeigename wird aus dem Local-Part abgeleitet.
 */
export const COLLEAGUE_EMAILS = [
  "elmar.hepp@revenexx.com",
  "alexander.bystrow@revenexx.com",
  "christopher.voitus@revenexx.com",
  "clemens.bastian@revenexx.com",
  "johannes.heizmann@revenexx.com",
  "jonathan.kraut@revenexx.com",
  "martin.hummel@revenexx.com",
  "martin.mohr@revenexx.com",
  "michael.doehler@revenexx.com",
  "michael.wachs@revenexx.com",
  "patrick.graef@revenexx.com",
  "thomas.mondelli@revenexx.com",
  "tilmann.schaefer@revenexx.com",
  "wolfram.schmale@revenexx.com",
] as const;

/** „elmar.hepp@revenexx.com" → „Elmar Hepp". */
export function colleagueNameFromEmail(email: string): string {
  const localPart = email.split("@")[0] ?? email;
  return localPart
    .split(/[.\-_]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export interface Colleague {
  email: string;
  name: string;
}

export const COLLEAGUES: Colleague[] = COLLEAGUE_EMAILS.map((email) => ({
  email,
  name: colleagueNameFromEmail(email),
}));

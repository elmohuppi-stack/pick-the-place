/**
 * revenexx-Kollegenliste – gemeinsame Quelle für Default-Teilnehmer neuer Events
 * (siehe events-Route) und für die Admin-Zugänge (siehe ensureAdminSeeded).
 *
 * Die Adressen stehen bewusst NICHT im Code, sondern in der nicht eingecheckten
 * Umgebungsvariable `COLLEAGUE_EMAILS` (kommagetrennt), damit sie nicht öffentlich
 * im Repository landen. Nur serverseitig verwendet. Fehlt die Variable, ist die
 * Liste leer (neue Events starten dann ohne vorbefüllte Teilnehmer).
 *
 * Beispiel .env:
 *   COLLEAGUE_EMAILS="vorname.nachname@example.com,zweite.person@example.com"
 */

/** „elmar.hepp@revenexx.com" → „Elmar Hepp". */
export function colleagueNameFromEmail(email: string): string {
  const localPart = email.split("@")[0] ?? email;
  return localPart
    .split(/[.\-_]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** E-Mails aus `COLLEAGUE_EMAILS` parsen (Trennung per Komma/Semikolon/Whitespace). */
export function getColleagueEmails(): string[] {
  const raw = process.env.COLLEAGUE_EMAILS ?? "";
  return raw
    .split(/[,;\s]+/)
    .map((e) => e.trim())
    .filter(Boolean);
}

export interface Colleague {
  email: string;
  name: string;
}

/** Abgeleitete Kollegenliste `{ email, name }[]` aus der Umgebungsvariable. */
export function getColleagues(): Colleague[] {
  return getColleagueEmails().map((email) => ({
    email,
    name: colleagueNameFromEmail(email),
  }));
}

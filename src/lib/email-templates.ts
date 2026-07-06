/**
 * Standard-Einladungstexte – Single Source of Truth für den Versand
 * (`lib/email`) und den Vorschlagstext im Editor (`email-manager`).
 *
 * Platzhalter: EVENTNAME (Event-Titel), NAME (Teilnehmer), ROUND (Wahlrunde).
 * Bewusst frei von Server-Abhängigkeiten, damit auch Client-Komponenten
 * die Texte importieren können.
 */
export const DEFAULT_PROPOSAL_TEXT =
  "Du bist eingeladen, einen Ort für das Event EVENTNAME vorzuschlagen.";

export const DEFAULT_VOTE_TEXT =
  "Runde ROUND der Ortswahl für EVENTNAME ist gestartet! Wähle deinen Favoriten.";

/**
 * Ersetzt für die Editor-Vorschau die Platzhalter durch konkrete Werte:
 * EVENTNAME → Event-Titel, ROUND → Rundennummer (falls angegeben).
 * NAME bleibt stehen (pro Empfänger unterschiedlich).
 */
export function fillPreview(
  template: string,
  eventTitle: string,
  roundNumber?: number,
): string {
  const withName = template.replace(/EVENTNAME/g, eventTitle);
  return roundNumber == null
    ? withName
    : withName.replace(/ROUND/g, String(roundNumber));
}

import type { Metadata } from "next";
import { LegalShell } from "@/components/ui/LegalShell";
import { getLegalInfo } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Datenschutzerklärung",
};

export default function DatenschutzPage() {
  const l = getLegalInfo();

  return (
    <LegalShell title="Datenschutzerklärung">
      <section>
        <h2>1. Verantwortlicher</h2>
        <p>
          Verantwortlich für die Datenverarbeitung auf dieser Website ist:
          <br />
          {l.company}
          <br />
          {l.address}, {l.city}
          <br />
          E-Mail: <a href={`mailto:${l.email}`}>{l.email}</a>
        </p>
      </section>

      <section>
        <h2>2. Welche Daten wir verarbeiten</h2>
        <p>
          Diese Anwendung dient dazu, gemeinsam einen Ort für eine
          Veranstaltung auszuwählen. Dabei verarbeiten wir:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Teilnehmerdaten:</strong> Name und E-Mail-Adresse, um
            Einladungen zu versenden und Vorschläge bzw. Stimmen zuzuordnen.
          </li>
          <li>
            <strong>Vorschläge und Stimmen:</strong> die von Teilnehmenden
            eingereichten Ortsvorschläge und abgegebenen Stimmen.
          </li>
          <li>
            <strong>Server-Logfiles:</strong> beim Aufruf technisch
            notwendige Daten (z. B. IP-Adresse, Zeitpunkt, aufgerufene Seite),
            die der Auslieferung und Sicherheit dienen.
          </li>
        </ul>
      </section>

      <section>
        <h2>3. Zweck und Rechtsgrundlage</h2>
        <p>
          Die Verarbeitung erfolgt zur Organisation und Durchführung der
          Ortsabstimmung. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO
          (berechtigtes Interesse an der Organisation der Veranstaltung) sowie,
          soweit einschlägig, Art. 6 Abs. 1 lit. b DSGVO.
        </p>
      </section>

      <section>
        <h2>4. Empfänger und Auftragsverarbeiter</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>E-Mail-Versand:</strong> Für den Versand der Einladungen
            nutzen wir Resend (Resend, Inc., USA). Dabei werden Name und
            E-Mail-Adresse der Empfänger übermittelt. Es besteht ein Vertrag
            zur Auftragsverarbeitung; die Übermittlung in die USA erfolgt auf
            Grundlage geeigneter Garantien (Standardvertragsklauseln).
          </li>
          <li>
            <strong>Hosting:</strong> Die Anwendung wird bei{" "}
            {l.hosting ?? "unserem Hosting-Dienstleister"} betrieben, der die
            Daten in unserem Auftrag verarbeitet.
          </li>
        </ul>
      </section>

      <section>
        <h2>5. Cookies</h2>
        <p>
          Wir setzen ausschließlich technisch notwendige Cookies ein: ein
          Cookie zur Anmeldung im Admin-Bereich sowie ein Cookie zur
          Speicherung der gewählten Darstellung (hell/dunkel). Es findet kein
          Tracking und keine Analyse zu Werbezwecken statt.
        </p>
      </section>

      <section>
        <h2>6. Speicherdauer</h2>
        <p>
          Wir speichern personenbezogene Daten nur so lange, wie es für den
          genannten Zweck erforderlich ist. Nach Abschluss der Veranstaltung
          bzw. auf Anfrage werden die Daten gelöscht.
        </p>
      </section>

      <section>
        <h2>7. Ihre Rechte</h2>
        <p>
          Sie haben das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung
          (Art. 16), Löschung (Art. 17), Einschränkung der Verarbeitung
          (Art. 18), Datenübertragbarkeit (Art. 20) sowie Widerspruch
          (Art. 21). Wenden Sie sich hierzu an{" "}
          <a href={`mailto:${l.email}`}>{l.email}</a>. Zudem haben Sie das
          Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu beschweren.
        </p>
      </section>
    </LegalShell>
  );
}

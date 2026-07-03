import type { Metadata } from "next";
import { LegalShell } from "@/components/ui/LegalShell";
import { getLegalInfo } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Impressum",
};

export default function ImpressumPage() {
  const l = getLegalInfo();

  return (
    <LegalShell title="Impressum — § 5 TMG">
      <p className="text-xs text-theme-muted mb-4">
        Angaben gemäß § 5 TMG sowie Verantwortliche im Sinne des § 18 Abs. 2
        MStV.
      </p>

      <section>
        <h2>Anbieter</h2>
        <p>
          {l.company}
          <br />
          {l.address}, {l.city}
        </p>
        {l.phone && <p className="mt-1">Telefon: {l.phone}</p>}
        <p>
          E-Mail: <a href={`mailto:${l.email}`}>{l.email}</a>
        </p>
      </section>

      <section>
        <h2>Vertretungsberechtigt</h2>
        <p>{l.representative}</p>
      </section>

      {l.register && (
        <section>
          <h2>Registereintrag</h2>
          <p>{l.register}</p>
        </section>
      )}

      {l.vatId && (
        <section>
          <h2>Umsatzsteuer-Identifikationsnummer</h2>
          <p>Gemäß § 27a UStG: {l.vatId}</p>
        </section>
      )}

      <section>
        <h2>Verantwortlich für den Inhalt</h2>
        <p>
          Nach § 18 Abs. 2 MStV:
          <br />
          {l.representative}
          <br />
          {l.company}
          <br />
          {l.address}, {l.city}
        </p>
      </section>

      <section>
        <h2>Streitbeilegung</h2>
        <p>
          Die Europäische Kommission stellt eine Plattform zur
          Online-Streitbeilegung (OS) bereit:{" "}
          <a
            href="https://ec.europa.eu/consumers/odr"
            target="_blank"
            rel="noopener noreferrer"
          >
            ec.europa.eu/consumers/odr
          </a>
          . Unsere E-Mail-Adresse finden Sie oben im Impressum.
        </p>
        <p className="mt-2">
          Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren
          vor einer Verbraucherschlichtungsstelle teilzunehmen.
        </p>
      </section>

      <section>
        <h2>Haftung für Inhalte</h2>
        <p>
          Als Diensteanbieter sind wir gemäß § 7 Abs. 1 TMG für eigene Inhalte
          auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach
          §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht
          verpflichtet, übermittelte oder gespeicherte fremde Informationen zu
          überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige
          Tätigkeit hinweisen.
        </p>
        <p className="mt-2">
          Verpflichtungen zur Entfernung oder Sperrung der Nutzung von
          Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt.
          Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der
          Kenntnis einer konkreten Rechtsverletzung möglich.
        </p>
      </section>

      <section>
        <h2>Haftung für Links</h2>
        <p>
          Unser Angebot enthält Links zu externen Websites Dritter, auf deren
          Inhalte wir keinen Einfluss haben. Deshalb können wir für diese
          fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der
          verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der
          Seiten verantwortlich.
        </p>
      </section>

      <section>
        <h2>Urheberrecht</h2>
        <p>
          Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen
          Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung,
          Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der
          Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des
          jeweiligen Autors bzw. Erstellers. Downloads und Kopien dieser Seite
          sind nur für den privaten, nicht kommerziellen Gebrauch gestattet.
        </p>
      </section>

      <section>
        <h2>Stand</h2>
        <p>Letzte Aktualisierung: Juli 2026.</p>
      </section>
    </LegalShell>
  );
}

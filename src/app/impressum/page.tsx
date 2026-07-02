import type { Metadata } from "next";
import { LegalShell } from "@/components/ui/LegalShell";
import { getLegalInfo } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Impressum",
};

export default function ImpressumPage() {
  const l = getLegalInfo();

  return (
    <LegalShell title="Impressum">
      <section>
        <h2>Angaben gemäß § 5 DDG</h2>
        <p>
          {l.company}
          <br />
          {l.address}
          <br />
          {l.city}
        </p>
      </section>

      <section>
        <h2>Vertreten durch</h2>
        <p>{l.representative}</p>
      </section>

      <section>
        <h2>Kontakt</h2>
        <p>
          E-Mail: <a href={`mailto:${l.email}`}>{l.email}</a>
          {l.phone && (
            <>
              <br />
              Telefon: {l.phone}
            </>
          )}
        </p>
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
          <p>
            Umsatzsteuer-ID gemäß § 27 a Umsatzsteuergesetz:
            <br />
            {l.vatId}
          </p>
        </section>
      )}

      <section>
        <h2>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
        <p>
          {l.representative}
          <br />
          {l.company}
          <br />
          {l.address}, {l.city}
        </p>
      </section>
    </LegalShell>
  );
}

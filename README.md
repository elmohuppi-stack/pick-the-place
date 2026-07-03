# Pick the Place 🎯

Gemeinsam einen Ort zum Treffen finden – einfach per Abstimmung.

Das Tool begleitet eine Gruppe von der **Vorschlagsphase** („Wo sollen wir uns treffen?") über die **Abstimmung** bis zur **Ergebnispräsentation**. Ideal für Freunde, Familien, Vereine oder Kollegen, die gemeinsam einen Ort auswählen möchten.

---

## Features

- **Phasen-gesteuerter Ablauf** – Vorbereitung → Vorschläge → Abstimmung → Ergebnis, gesteuert über einen Phasen-Stepper im event-zentrierten Workspace
- **Vorschlagsphase** – Jeder Teilnehmer kann Orte vorschlagen
- **Abstimmungsrunden** – Mehrere Durchgänge möglich; Runden enden automatisch, wenn alle aktiven Teilnehmer abgestimmt haben
- **Live-Verfolgung der laufenden Runde** – Der Admin sieht im Runden-Tab in Echtzeit den Teilnahme-Fortschritt („X von Y haben abgestimmt", inkl. Enthaltungen und noch offener Teilnehmer) sowie den Zwischenstand pro Ort mit hervorgehobener Führung; aktualisiert sich automatisch
- **Stichwahl bei Bedarf** – Gibt es keine absolute Mehrheit (>50 %), lässt sich eine Stichwahl zwischen den stärksten Orten starten
- **Ergebnisse & Sieger-Banner** – Prozentuale Auswertung; Sieger bzw. Favorit werden prominent dargestellt (auch im Dashboard)
- **Aktivitäts-Protokoll** – Timeline pro Event: wer wurde wann eingeladen (inkl. fehlgeschlagener E-Mails) und wer hat wann abgestimmt
- **Admin-Bereich** – Event-Verwaltung mit Tabs für Teilnehmer, Orte, Runden, E-Mail-Versand und Protokoll
- **Teilnehmer aktivieren/deaktivieren** – Deaktivierte Teilnehmer bleiben erhalten, werden aber nicht eingeladen und zählen nicht zur Abstimmung
- **Magic Links** – Teilnehmer loggen sich ohne Passwort über einen persönlichen, phasenabhängigen Link ein (Vorschlag / Abstimmung / Ergebnis)
- **E-Mail-Benachrichtigungen** – Einladungen zur Vorschlags- und Abstimmungsphase (via Resend)
- **Opt-Out** – Teilnehmer können in der Vorschlagsphase auf einen Vorschlag verzichten
- **Echtes Login/Logout** – Admin-Login mit Session-Cookie und Abmelden
- **Event-Datum** – Optionaler Termin pro Event
- **Dark Mode** – Automatisch je nach Systempräferenz

### revenexx-spezifisch

Das Tool ist primär ein internes revenexx-Werkzeug:

- Die feste **Kollegenliste** (`src/lib/colleagues.ts`) wird bei jedem neuen Event automatisch als Teilnehmer vorbefüllt – pro Event deaktivier- oder erweiterbar.
- Alle Kollegen können sich als Admin anmelden. Sie werden mit dem gemeinsamen Initial-Passwort aus `ADMIN_PASSWORD` angelegt (nur falls noch nicht vorhanden – bereits geänderte Passwörter bleiben erhalten); jeder kann sein Passwort anschließend selbst ändern.

---

## Tech Stack

| Technologie        | Beschreibung                               |
| ------------------ | ------------------------------------------ |
| **Next.js 16**     | React-Framework mit App-Router             |
| **TypeScript**     | Typensicherheit                            |
| **Tailwind CSS 4** | Utility-first Styling                      |
| **Prisma 7**       | ORM mit SQLite (via libSQL)                |
| **SQLite**         | Datenbank (kein separater DB-Server nötig) |
| **Resend**         | E-Mail-Versand                             |
| **JWT**            | Admin-Authentifizierung                    |
| **bcryptjs**       | Passwort-Hashing                           |
| **Docker**         | Containerisierung für Produktion           |

---

## Ablauf

1. **Event erstellen** – Admin legt ein Event an (z. B. „Jahrestreffen 2026")
2. **Teilnehmer prüfen** – Kollegen sind automatisch als Teilnehmer vorbefüllt; nicht relevante deaktivieren oder weitere hinzufügen
3. **Vorschlagsphase aktivieren** – Teilnehmer erhalten einen Magic Link und schlagen Orte vor
4. **Abstimmungsrunde starten** – Admin startet eine Runde, Teilnehmer stimmen ab (endet automatisch, wenn alle aktiven Teilnehmer abgestimmt haben); der Admin verfolgt Fortschritt und Zwischenstand live im Runden-Tab
5. **Ergebnisse ansehen** – Sieger (>50 %) bzw. Favorit werden prominent angezeigt
6. **Stichwahl (optional)** – Ohne absolute Mehrheit kann eine Stichwahl zwischen den stärksten Orten gestartet werden
7. **Event abschließen** – Endzustand; der gesamte Ablauf bleibt im Protokoll nachvollziehbar

---

## Entwicklung

### Voraussetzungen

- Node.js 20+
- npm

### Setup

```bash
# Abhängigkeiten installieren
npm install

# Prisma Client generieren & Datenbank migrieren
cp .env.example .env        # Umgebungsvariablen anpassen
npx prisma migrate dev      # Datenbank erstellen

# Dev-Server starten
npm run dev
```

Der Dev-Server läuft auf [http://localhost:3000](http://localhost:3000).

### Nützliche Befehle

| Befehl                   | Beschreibung                          |
| ------------------------ | ------------------------------------- |
| `npm run dev`            | Dev-Server starten                    |
| `npm run build`          | Production-Build erstellen            |
| `npm run start`          | Production-Server starten             |
| `npm run lint`           | ESLint ausführen                      |
| `npx prisma studio`      | Prisma Studio (GUI für die Datenbank) |
| `npx prisma migrate dev` | Migration nach Schema-Änderung        |
| `npx prisma generate`    | Prisma Client neu generieren          |

### Umgebungsvariablen

| Variable              | Beschreibung                                                              |
| --------------------- | ------------------------------------------------------------------------- |
| `DATABASE_URL`        | Pfad zur SQLite-Datenbank                                                 |
| `ADMIN_PASSWORD`      | Gemeinsames Initial-Passwort für alle Kollegen-Admins (erforderlich)      |
| `ADMIN_EMAIL`         | Optionaler zusätzlicher Admin (außerhalb der Kollegenliste)               |
| `ADMIN_NAME`          | Anzeigename für den optionalen `ADMIN_EMAIL`                              |
| `JWT_SECRET`          | Secret für JWT-Tokens (erforderlich)                                      |
| `RESEND_API_KEY`      | API-Key für Resend (fehlt er, werden E-Mails nur geloggt statt versendet) |
| `EMAIL_FROM`          | Absenderadresse für E-Mails                                               |
| `EMAIL_FROM_NAME`     | Absendername für E-Mails                                                  |
| `NEXT_PUBLIC_APP_URL` | Öffentliche App-URL (für Magic Links in E-Mails)                          |
| `LEGAL_*`             | Pflichtangaben für Impressum & Datenschutz (siehe `.env.example`)         |

> Hinweis: Admin-Zugänge werden beim ersten Login angelegt (Kollegenliste + optional `ADMIN_EMAIL`). Ein geändertes `ADMIN_PASSWORD` wirkt nur für noch nicht existierende Accounts – bereits angelegte behalten ihr Passwort.

---

## Deployment

### Produktion (Docker)

```bash
# Mit Docker Compose
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

Das Docker-Image führt beim Start automatisch `prisma migrate deploy` aus, um die Datenbank auf dem neuesten Stand zu halten.

### Infrastruktur

- **Server:** Hetzner (single root server)
- **Proxy:** Host-Nginx leitet Subdomains auf interne Docker-Ports weiter
- **TLS:** Let's Encrypt via Certbot
- **DNS:** Spaceship (A @ und A \* auf Server-IP)

---

## Projektstruktur

```
src/
├── app/
│   ├── page.tsx                        # Landing Page
│   ├── propose/                        # Vorschlagsseite (öffentlich, Magic Link)
│   ├── vote/                           # Abstimmungsseite (öffentlich, Magic Link)
│   ├── results/                        # Ergebnis-Seite (öffentlich, Magic Link)
│   ├── impressum/ · datenschutz/       # Rechtliche Seiten
│   ├── admin/
│   │   ├── login/                      # Admin-Login (+ Passwort-Reset-Link)
│   │   └── (protected)/                # Geschützter Bereich (Session erforderlich)
│   │       ├── layout.tsx              # Sidebar + Logout
│   │       ├── page.tsx                # Dashboard (Event-Übersicht)
│   │       ├── users/                  # Admin-Benutzer verwalten
│   │       └── events/[id]/            # Event-Workspace mit Tabs:
│   │           ├── event-workspace.tsx #   Übersicht + Phasen-Stepper
│   │           ├── participant-manager #   Teilnehmer
│   │           ├── location-manager    #   Orte
│   │           ├── round-manager       #   Runden
│   │           ├── email-manager       #   E-Mails
│   │           └── activity-log        #   Protokoll
│   └── api/                            # API-Routen (events, participants, votes,
│                                       #   rounds, results, email, activity, admin …)
├── components/                         # Shared UI-Komponenten
├── lib/                                # Hilfsfunktionen (auth, email, prisma,
│                                       #   colleagues, event-status, log, format)
└── generated/prisma/                   # Auto-generierter Prisma Client
```

---

## Lizenz

Privat – nicht öffentlich lizenziert.

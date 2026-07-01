# Pick the Place 🎯

Gemeinsam einen Ort zum Treffen finden – einfach per Abstimmung.

Das Tool begleitet eine Gruppe von der **Vorschlagsphase** („Wo sollen wir uns treffen?") über die **Abstimmung** bis zur **Ergebnispräsentation**. Ideal für Freunde, Familien, Vereine oder Kollegen, die gemeinsam einen Ort auswählen möchten.

---

## Features

- **Vorschlagsphase** – Jeder Teilnehmer kann Orte vorschlagen
- **Abstimmungsrunden** – Mehrere Durchgänge mit unterschiedlichen Orten möglich
- **Ergebnisse** – Übersichtliche Darstellung mit Stimmenanteilen
- **Admin-Bereich** – Event-Verwaltung, Teilnehmer, Orte, Runden, E-Mail-Versand
- **Magic Links** – Teilnehmer loggen sich ohne Passwort über einen Link ein
- **E-Mail-Benachrichtigungen** – Einladungen zur Vorschlags- und Abstimmungsphase
- **Opt-Out** – Teilnehmer können sich selbst austragen
- **Dark Mode** – Automatisch je nach Systempräferenz

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
2. **Vorschlagsphase aktivieren** – Teilnehmer erhalten einen Magic Link und schlagen Orte vor
3. **Abstimmungsrunde starten** – Admin startet eine Runde, Teilnehmer stimmen ab
4. **Ergebnisse ansehen** – Nach Ende der Runde werden die Ergebnisse prozentual angezeigt
5. **Mehrere Runden** – Beliebig viele Durchgänge möglich

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

| Variable              | Beschreibung                |
| --------------------- | --------------------------- |
| `DATABASE_URL`        | Pfad zur SQLite-Datenbank   |
| `ADMIN_EMAIL`         | Admin-Login E-Mail          |
| `ADMIN_PASSWORD`      | Admin-Login Passwort        |
| `ADMIN_NAME`          | Admin-Anzeigename           |
| `JWT_SECRET`          | Secret für JWT-Tokens       |
| `RESEND_API_KEY`      | API-Key für Resend          |
| `EMAIL_FROM`          | Absenderadresse für E-Mails |
| `EMAIL_FROM_NAME`     | Absendername für E-Mails    |
| `NEXT_PUBLIC_APP_URL` | Öffentliche App-URL         |

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
│   ├── page.tsx                    # Landing Page
│   ├── propose/                    # Vorschlagsseite (öffentlich)
│   ├── vote/                       # Abstimmungsseite (öffentlich)
│   ├── results/                    # Ergebnis-Seite (öffentlich)
│   ├── admin/                      # Admin-Bereich (geschützt)
│   │   ├── page.tsx                # Dashboard
│   │   ├── login/                  # Admin-Login
│   │   ├── participants/           # Teilnehmer verwalten
│   │   ├── locations/              # Orte verwalten
│   │   ├── rounds/                 # Runden verwalten
│   │   └── email/                  # E-Mails versenden
│   └── api/                        # API-Routen
├── components/                     # Shared UI-Komponenten
├── lib/                            # Hilfsfunktionen (auth, email, prisma)
├── types/                          # TypeScript-Typen
└── generated/prisma/               # Auto-generierter Prisma Client
```

---

## Lizenz

Privat – nicht öffentlich lizenziert.

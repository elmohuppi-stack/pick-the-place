# Pick the Place – Abstimmungs-App für das Jahrestreffen

**TL;DR:** Mobile-friendly Web-App für ~14 Kollegen, um in mehreren Wahlgängen per **Vorschlag → Voting → Elimination** einen Ort fürs Jahrestreffen zu bestimmen. Inklusive Admin-Bereich, E-Mail-Einladungen (Magic Links via Resend) und Hetzner-Deployment.

---

## Tech Stack

| Komponente           | Entscheidung                                                              |
| -------------------- | ------------------------------------------------------------------------- |
| **Framework**        | Next.js 15 (App Router) + TypeScript                                      |
| **Styling**          | Tailwind CSS v4 – mobile-first, modern                                    |
| **Datenbank**        | SQLite via Prisma ORM                                                     |
| **E-Mail**           | Resend (100 E-Mails/Tag kostenlos)                                        |
| **Auth**             | Magic Links (eindeutiger Token pro Teilnehmer in URL)                     |
| **Echtzeit-Updates** | ❌ Manuelles Neuladen (für ~14 Personen völlig ausreichend)               |
| **Elimination**      | System schlägt Orte <50% der Höchststimmen vor → Admin bestätigt/passt an |
| **Deployment**       | Docker + Caddy (SSL) auf Hetzner CX22 (~5 €/Monat)                        |

---

## Datenmodell

```prisma
model Event {
  id          String   @id @default(uuid())
  title       String
  slug        String   @unique
  description String?
  status      EventStatus @default(setup)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  participants Participant[]
  locations    Location[]
  votingRounds VotingRound[]
}

model Participant {
  id        String   @id @default(uuid())
  eventId   String
  name      String
  email     String
  authToken String   @unique // Magic-Link-Token
  createdAt DateTime @default(now())

  event      Event      @relation(fields: [eventId], references: [id])
  locations  Location[]
  votes      Vote[]
  emailLogs  EmailLog[]

  @@unique([eventId, email])
}

model Location {
  id          String   @id @default(uuid())
  eventId     String
  name        String
  description String?
  proposedById String
  isActive    Boolean  @default(true) // false wenn vom Admin entfernt
  createdAt   DateTime @default(now())

  event       Event       @relation(fields: [eventId], references: [id])
  proposedBy  Participant @relation(fields: [proposedById], references: [id])
  votes       Vote[]
}

model VotingRound {
  id          String          @id @default(uuid())
  eventId     String
  roundNumber Int
  status      RoundStatus     @default(pending)
  startsAt    DateTime?
  endsAt      DateTime?
  createdAt   DateTime        @default(now())

  event Event @relation(fields: [eventId], references: [id])
  votes Vote[]
}

model Vote {
  id             String   @id @default(uuid())
  votingRoundId  String
  participantId  String
  locationId     String
  createdAt      DateTime @default(now())

  votingRound VotingRound @relation(fields: [votingRoundId], references: [id])
  participant Participant @relation(fields: [participantId], references: [id])
  location    Location    @relation(fields: [locationId], references: [id])

  @@unique([votingRoundId, participantId]) // eine Stimme pro Person & Runde
}

model EmailLog {
  id            String   @id @default(uuid())
  participantId String
  type          EmailType
  sentAt        DateTime @default(now())

  participant Participant @relation(fields: [participantId], references: [id])
}

enum EventStatus {
  setup
  proposal
  voting
  results
  closed
}

enum RoundStatus {
  pending
  active
  closed
}

enum EmailType {
  proposal_invite
  vote_invite
  results
}
```

---

## Seiten / Routen

### Öffentliche Seiten (mobile-first)

| Route                | Zweck                                                                                                   |
| -------------------- | ------------------------------------------------------------------------------------------------------- |
| `/`                  | Landing Page – zeigt aktuelle Phase an                                                                  |
| `/propose?token=XYZ` | Ort vorschlagen – Liste vorhandener Vorschläge + Formular für neuen Vorschlag + "Kein Vorschlag"-Button |
| `/vote?token=XYZ`    | Aktuelle Wahlrunde – Liste der aktiven Orte zum Auswählen                                               |
| `/results?token=XYZ` | Ergebnisse der aktuellen/letzten Runde mit Visualisierung                                               |

### Admin-Seiten

| Route                 | Zweck                                                                     |
| --------------------- | ------------------------------------------------------------------------- |
| `/admin/login`        | Admin-Login (Credentials aus `.env`)                                      |
| `/admin`              | Dashboard – Event-Status, Übersicht über Teilnehmer & Runden              |
| `/admin/participants` | Teilnehmer CRUD (Name, E-Mail hinzufügen/entfernen)                       |
| `/admin/locations`    | Vorschläge verwalten (ansehen, für Runde (de)aktivieren)                  |
| `/admin/rounds`       | Runden verwalten: Start/Ende setzen, Orte eliminieren, neue Runde anlegen |
| `/admin/email`        | E-Mail-Einladungen versenden (Proposal / Voting / Ergebnisse)             |

---

## App-Flow (User Journey)

### 1. Setup-Phase

1. Admin logged in → legt Event an (z. B. "Jahrestreffen 2026")
2. Admin fügt Teilnehmer hinzu (Name + E-Mail)
3. System generiert pro Teilnehmer einen eindeutigen `authToken`

### 2. Proposal-Phase (Vorschlagsrunde)

1. Admin setzt Event-Status auf `proposal` + optionales Enddatum
2. Admin klickt "Einladungen senden" → E-Mails mit Magic Link `.../propose?token=XYZ`
3. Teilnehmer klicken Link → sehen:
   - Liste bereits vorgeschlagener Orte (mit Absender)
   - Formular "Neuen Ort vorschlagen" (Name + Beschreibung)
   - Button "Kein Vorschlag" (Opt-out)
4. Admin sieht Übersicht: alle Vorschläge + wer hat verzichtet

### 3. Voting-Runde 1

1. Admin wählt aus den Vorschlägen die Locations für Runde 1 aus
2. Admin setzt Enddatum + startet Runde
3. Admin sendet Voting-Einladungen → E-Mails mit Link `.../vote?token=XYZ`
4. Teilnehmer wählen genau einen Favoriten aus der Liste
5. Sobald **alle gewählt haben** **ODER** die Deadline erreicht ist → Ergebnisse anzeigen

### 4. Elimination & nächste Runde

1. Admin sieht Ergebnisse mit Balkendiagramm
2. System schlägt vor: **alle Orte unter 50% der Höchststimmen entfernen**
3. Admin kann manuell Orte wieder hinzufügen oder weitere entfernen
4. Admin startet nächste Runde mit der reduzierten Liste
5. Wiederholung ab Schritt 3, bis ein Ort **> 50 %** der Stimmen hat (eindeutiger Favorit)

### 5. Abschluss

- Sieger wird präsentiert
- Admin kann Event schließen oder archivieren

---

## UI/UX-Design (Modern & Mobile-First)

- **Farbpalette**: Sanfte Gradienten (Blau/Violett/Türkis), klare Kontraste
- **Komponenten**: Große Touch-Targets, Karten-Layout, Bottom-Navigation auf Mobil
- **Schrift**: Inter (Google Fonts) oder system-ui für Performance
- **Dark Mode**: Optional via Tailwind `darkMode: 'class'`
- **Animationen**: Tailwind `animate-*` utilities für sanfte Übergänge
- **Proposal-Seite**: Grid/Karten-Ansicht der Vorschläge + Floating-Action-Button
- **Voting-Seite**: Große Karten zum Antippen, Haken bei Auswahl, Confirm-Button
- **Ergebnisse**: Balkendiagramm (pur CSS, keine Library) mit Prozentanzeige
- **Admin-Dashboard**: Tabellen + Action-Buttons, voll responsiv

---

## Projektstruktur

```
pick-the-place/
├── .env.example
├── .gitignore
├── Dockerfile
├── docker-compose.yml
├── Caddyfile
├── next.config.ts
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── public/
│   └── favicon.ico
└── src/
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx
    │   ├── propose/page.tsx
    │   ├── vote/page.tsx
    │   ├── results/page.tsx
    │   └── admin/
    │       ├── login/page.tsx
    │       ├── page.tsx                 // Dashboard
    │       ├── participants/page.tsx
    │       ├── locations/page.tsx
    │       ├── rounds/page.tsx
    │       └── email/page.tsx
    ├── components/
    │   ├── ui/
    │   │   ├── Button.tsx
    │   │   ├── Card.tsx
    │   │   ├── Input.tsx
    │   │   ├── Modal.tsx
    │   │   └── Badge.tsx
    │   ├── LocationCard.tsx
    │   ├── ParticipantList.tsx
    │   ├── VoteChart.tsx
    │   ├── EmailForm.tsx
    │   ├── RoundTimeline.tsx
    │   └── Navbar.tsx
    ├── lib/
    │   ├── prisma.ts                    // Prisma Client Singleton
    │   ├── email.ts                     // Resend-Mailer
    │   ├── auth.ts                      // Token-Validation, Admin-Auth
    │   └── utils.ts
    └── types/
        └── index.ts
```

---

## Deployment (Hetzner)

### Infrastruktur

- **VPS**: Hetzner CX22 (2 vCPU, 4 GB RAM, 40 GB SSD) ~ 5 €/Monat
- **OS**: Ubuntu 24.04 LTS
- **Reverse Proxy**: Caddy (automatisches Let's Encrypt SSL)
- **Container**: Docker + Docker Compose
- **CI/CD**: Manuell via `git pull && docker compose up --build -d` (optional später GitHub Actions)

### Docker-Setup

```yaml
# docker-compose.yml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    env_file: .env
    volumes:
      - data:/app/data # SQLite-Datenbank persistent
    restart: unless-stopped

  caddy:
    image: caddy:latest
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
    restart: unless-stopped

volumes:
  data:
  caddy_data:
```

---

## Implementierungs-Phasen

### Phase 1 – Grundgerüst

- [ ] Next.js-Projekt aufsetzen (`create-next-app`)
- [ ] Tailwind CSS + PostCSS konfigurieren
- [ ] Prisma + SQLite initialisieren, Schema definieren, erste Migration
- [ ] Docker + Docker Compose + Caddy vorbereiten
- [ ] `.env.example` mit allen benötigten Variablen anlegen
- [ ] Basis-Layout (`layout.tsx`) mit mobile-first Container

### Phase 2 – Admin-Auth

- [ ] Admin-Login-Seite (Credentials aus `.env`)
- [ ] Admin-Session (JWT oder iron-session)
- [ ] Middleware für Admin-Routen-Schutz
- [ ] Magic-Link-Token-Generierung & -Validierung
- [ ] Middleware für öffentliche Routen (token-check)

### Phase 3 – Teilnehmerverwaltung

- [ ] Teilnehmer-CRUD im Admin (hinzufügen, auflisten, entfernen)
- [ ] Bulk-Import per Textarea (optional)

### Phase 4 – Vorschlagsrunde

- [ ] Proposal-Seite (öffentlich, token-geschützt)
- [ ] Liste vorhandener Vorschläge anzeigen
- [ ] Formular für neuen Vorschlag
- [ ] "Kein Vorschlag"-Button (Opt-out)
- [ ] Admin-Ansicht: alle Vorschläge + Opt-out-Status

### Phase 5 – E-Mail-Versand

- [ ] Resend-Client in `lib/email.ts`
- [ ] E-Mail-Templates (HTML) für:
  - Proposal-Einladung
  - Voting-Einladung
  - Ergebnis-Benachrichtigung
- [ ] Admin-E-Mail-Formular mit Empfänger-Auswahl

### Phase 6 – Voting-System

- [ ] Voting-Seite (öffentlich, token-geschützt)
- [ ] Aktive Orte anzeigen
- [ ] Einen Favoriten auswählen + absenden
- [ ] Doppelstimmen-Schutz (UNIQUE-Constraint + UI-Hinweis)
- [ ] Deadline-Check (bei Aufruf prüfen, ob Runde abgelaufen)
- [ ] Admin: Runde starten/stoppen, Enddatum setzen

### Phase 7 – Ergebnisse & Elimination

- [ ] Ergebnisse-Seite mit CSS-Balkendiagramm
- [ ] Admin: Ergebnisse einsehen
- [ ] Admin: Eliminations-UI – Systemvorschlag (≤50%) + manuelle Anpassung
- [ ] Admin: Neue Runde aus reduzierter Liste anlegen
- [ ] Sieger-Verkündung bei eindeutigem Favorit (>50%)

### Phase 8 – Finalisierung & Deployment

- [ ] Responsive Design-Feinschliff (iPhone/Android-Test)
- [ ] Ladezustände, Leere-Zustände, Error-States
- [ ] Seed-Skript für Testdaten
- [ ] Docker-Image lokal bauen & testen
- [ ] Hetzner VPS einrichten (Ubuntu, Docker, Firewall)
- [ ] Domain konfigurieren (A-Record)
- [ ] Deployen: git push → ssh → docker compose up
- [ ] Produktions-Testlauf

---

## Verifikation

1. `npm run build` läuft fehlerfrei
2. `docker compose up` startet App + Caddy ohne Fehler
3. Admin kann Teilnehmer anlegen, E-Mails versenden
4. Magic Link führt zur korrekten Seite
5. Vorschlag wird in der Liste aller Teilnehmer sichtbar
6. Abstimmung: 1 Stimme pro Person pro Runde (UNIQUE-Constraint + UI)
7. Deadline: Seite zeigt "Abstimmung beendet" nach Enddatum
8. Elimination: Orte ≤50% werden vorgeschlagen, Admin kann anpassen
9. App ist auf dem Handy vollständig bedienbar
10. Deployment: Seite erreichbar via Domain + HTTPS

---

## Offene Fragen

- **Domain** – Hast du schon eine Domain oder brauchst du eine neue?
- **GitHub** – Soll das Projekt in einem privaten GitHub-Repo liegen (für `git pull`-Deployment)?
- **CI/CD** – Soll ein GitHub Actions Workflow für Auto-Deployment eingerichtet werden?
- **Design** – Soll ich vorab ein grobes UI-Mockup skizzieren, oder reichen die Beschreibungen oben?

---

## Nicht enthalten (bewusst ausgeklammert)

- ❌ Multi-Tenant / mehrere Events parallel (zunächst nur ein Admin-Ereignis)
- ❌ OAuth/GitHub-Login
- ❌ Push-Benachrichtigungen
- ❌ Echtzeit-Updates via WebSocket
- ❌ i18n / Mehrsprachigkeit
- ❌ Komplexe Wahlverfahren (Schulze, Ranked-Choice etc.)

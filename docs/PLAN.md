# Plan: Event-zentrischer Admin-Workspace für pick-the-place

## Context

**Was die App macht:** Ein Admin legt Events an, lädt Teilnehmer per Magic-Link ein, Teilnehmer schlagen Orte vor, der Admin wählt aktive Orte aus, startet Abstimmungsrunden, Teilnehmer stimmen ab, Ergebnisse werden pro Runde berechnet. Datenmodell (Event → Participant → Location → VotingRound → Vote) ist solide.

**Das Kernproblem:** Die Admin-Oberfläche ist **feature-first** statt **event-first** organisiert. Der Admin wählt einen Feature-Tab (Teilnehmer / Orte / Runden / E-Mails) und muss dann auf *jeder* Seite sein Event neu finden — und das **inkonsistent**: Teilnehmer und E-Mails nutzen ein "Event:"-Dropdown, Orte und Runden stapeln *alle* Events untereinander. Standard-Tools (Doodle, Eventbrite, Meetup, Notion) machen es umgekehrt: erst das Event wählen, dann liegt alles dazu an einem Ort.

**Bestätigte Folgeprobleme:**
- Dashboard-Karten verlinken auf `/admin/rounds?eventId=…`, aber die Runden-Seite ignoriert `eventId` → kaputte Verlinkung.
- Kein geführter Ablauf / kein "nächster Schritt". Der Admin muss die Reihenfolge kennen und rohe englische Status (`setup`/`proposal`/`voting`/`results`) in deutscher UI entschlüsseln.
- Aktionen eines Workflows sind über 4 Tabs verstreut.
- **Korrektheits-Bug:** Rundenergebnisse mappen die *aktuell* aktiven Orte auf *alle* vergangenen Runden → das Deaktivieren von Orten zwischen Runden verfälscht rückwirkend alte Ergebnisse (genau der Stichwahl-Fall).

**Gewünschtes Ergebnis:** Ein **Event-Workspace** unter `/admin/events/[id]` als zentraler Arbeitsbereich pro Event, mit Phasen-Stepper und "Nächster Schritt"-CTA. Bestehende, bereits event-bezogene Manager-Komponenten werden wiederverwendet. Zusätzlich die gefundenen Bugs beheben.

---

## Teil A — Event-Workspace (UX-Kern)

### A1. Neue Workspace-Seite
**Neu:** `src/app/admin/(protected)/events/[id]/page.tsx` (Server-Komponente).
- Lädt das Event mit allen Relationen (participants, locations inkl. proposedBy, votingRounds inkl. _count votes) — analog zur Query in `rounds/page.tsx`, aber gefiltert auf `params.id`.
- 404/redirect auf `/admin`, wenn Event nicht existiert.
- Rendert Header (Titel, Beschreibung, Phasen-Stepper) + Tab-Navigation + aktiven Tab-Inhalt.

### A2. Phasen-Stepper + "Nächster Schritt"-Panel
**Neu:** `src/app/admin/(protected)/events/[id]/phase-stepper.tsx` (Client).
- Zeigt die 4 Phasen als horizontalen Stepper mit deutschen Labels:
  `Vorbereitung` (setup) → `Vorschläge` (proposal) → `Abstimmung` (voting) → `Ergebnis` (results); `Abgeschlossen` (closed) als Endzustand.
- Zentrale Status↔Label-Mapping-Funktion (neu in `src/lib/event-status.ts`), damit die englischen Enums *nirgends* mehr roh in der UI erscheinen. Auch im Dashboard-Badge und in `round-manager.tsx` verwenden.
- **"Nächster Schritt"-Panel** direkt darunter mit *einer* primären Aktion, abgeleitet aus Status + Daten:
  - `setup`, 0 Teilnehmer → "Teilnehmer hinzufügen"
  - `setup`, ≥1 Teilnehmer → "Vorschlagsphase starten" (+ optional Vorschlags-Einladungen senden)
  - `proposal` → "Vorschläge werden gesammelt · Orte prüfen · Abstimmung starten"
  - `voting` (aktive Runde) → "Abstimmung läuft — beenden wenn fertig"
  - `results` **mit** Mehrheitssieger (>50 %) → "Sieger steht fest: <Ort> · Event abschließen"
  - `results` **ohne** Mehrheitssieger → primär "Stichwahl starten" (siehe C1) + sekundär "Event trotzdem abschließen"
- Aktionen rufen die **bestehenden** Endpunkte (`PATCH /api/events/status`, `POST /api/rounds`) auf — Logik aus `round-manager.tsx` wiederverwenden.

### A3. Tab-Navigation im Workspace, bestehende Manager einbetten
Tabs: `Übersicht · Teilnehmer · Orte · Runden · E-Mails` (via `?tab=`-Searchparam, damit teilbar/refresh-fest).
Die bestehenden Manager sind bereits event-bezogen und werden mit einer festen `eventId` gemountet:
- **Orte:** `location-manager.tsx` nimmt schon ein einzelnes `event` → direkt einbetten.
- **Runden:** `round-manager.tsx` nimmt schon ein einzelnes `event` → direkt einbetten (die redundanten Phasen-Buttons hier entfernen, da sie ins Stepper-Panel wandern).
- **Teilnehmer:** Inneren Teil von `participants/page.tsx` in `ParticipantManager({ eventId })` extrahieren (Dropdown + Event-Fetch entfernen; Liste/Hinzufügen/Bulk/Link-kopieren behalten).
- **E-Mails:** Inneren Teil von `email/page.tsx` in `EmailManager({ event })` extrahieren (Dropdown entfernen).
- **Übersicht:** kompakte Kennzahlen (Teilnehmer/Orte/Runden), Kurzstatus, Schnell-Links in die Tabs.

### A4. Dashboard & Sidebar auf event-first umstellen
- `dashboard page.tsx`: Karten verlinken auf `/admin/events/${event.id}` (Fix der kaputten Verlinkung). Status-Badge über das neue Label-Mapping (deutsch).
- `layout.tsx navItems`: Sidebar auf die *globalen* Bereiche reduzieren — **Dashboard** und **Benutzer**. Teilnehmer/Orte/Runden/E-Mails leben künftig im Workspace pro Event.
- Alte Feature-Seiten (`participants/`, `locations/`, `rounds/`, `email/`): entweder entfernen oder auf den Workspace weiterleiten. **Empfehlung:** entfernen, sobald ihr Inhalt in wiederverwendbare Manager-Komponenten extrahiert ist (A3), um Doppelpflege zu vermeiden.

---

## Teil C — Stichwahl bei Bedarf (Runden-Modell, Option 3)

**Ziel:** Eine Runde ist der Standard. Nur wenn keine Runde einen Mehrheitssieger (>50 %) hat, wird eine Stichwahl angeboten. Das bestehende Multi-Runden-Datenmodell und die Endpunkte bleiben unverändert — es kommt nur Ableitungs-Logik + eine Aktion dazu.

### C1. "Stichwahl starten"-Aktion
Neue Client-Funktion (im Workspace, z. B. in `phase-stepper.tsx` oder einer kleinen `runoff.ts`-Helper):
1. Ergebnisse der zuletzt geschlossenen Runde lesen (`GET /api/results?eventId=…`), Orte nach Stimmen sortieren.
2. Top-N bestimmen (Standard: die 2 stimmenstärksten; bei Gleichstand auf Platz 2 alle Gleichplatzierten mitnehmen).
3. Für jeden Ort `isActive` setzen: Top-N aktiv, Rest inaktiv — via `PATCH /api/locations?id=…` (bestehender Endpunkt).
4. `POST /api/rounds` erzeugt die neue Runde; da Runden ihren Ballot aus den aktuell aktiven Orten ableiten, enthält Runde 2 automatisch nur die Stichwahl-Orte. `/vote` zeigt Teilnehmern nur diese.

Der Admin muss also **keine Orte mehr manuell deaktivieren** — das ist der Kernvorteil gegenüber heute.

### C2. Mehrheitssieger-Erkennung
Kleiner Helper (z. B. in `src/lib/event-status.ts` oder `runoff.ts`): aus den Ergebnissen der neuesten geschlossenen Runde ermitteln, ob ein Ort >50 % hat. Steuert Text/CTA im "Nächster Schritt"-Panel (A2, `results`-Fälle) und den Sieger-Banner in der Übersicht.

## Teil B — Korrektheits-Bugfixes

### B1. Rundenergebnisse aus tatsächlich abgegebenen Stimmen berechnen
Nötig, damit die Stichwahl (C) korrekt anzeigt: `src/app/api/results/route.ts` berechnet je Runde aktuell gegen die *jetzt* aktiven Orte — nach einer Stichwahl würde Runde 1 sonst nur noch die Stichwahl-Orte zeigen.
- Query anpassen: `votes: { include: { location: true } }`.
- Pro Runde nach `locationId` gruppieren und aus `vote.location` Name/Beschreibung ziehen (`__optout__` ausfiltern). So bleibt jede Runde korrekt, egal wie sich aktive Orte danach ändern.
- Folge-Anpassung in `round-manager.tsx`: Mapping übernimmt die neue Struktur.

### B2. Dead Code entfernen
`round-manager.tsx`: `const activeLocations = event.locations.filter((l) => true)` → direkt `event.locations` verwenden.

### B3. JWT-Fallback-Secret entfernen
`src/lib/auth.ts`: hartkodiertes `"fallback-secret-change-me"` entfernen; fehlt `JWT_SECRET`, gezielt fehlschlagen (Startup-Check statt stillem Fallback).

### B4. (Notiz, niedrige Priorität)
Öffentliche Endpunkte `api/results` und `api/rounds/active` prüfen nur `eventId`, keine Auth. Falls Ergebnisse nicht öffentlich sein sollen: an einen Teilnehmer-Token binden. Nur umsetzen, wenn gewünscht — sonst als bekannte Einschränkung dokumentieren.

---

## Wiederverwendete Bausteine
- Manager-Komponenten sind bereits event-bezogen: `location-manager.tsx`, `round-manager.tsx` (direkt einbettbar).
- Endpunkte bleiben unverändert nutzbar: `POST/PATCH/DELETE /api/rounds`, `PATCH /api/events/status`, `POST /api/email`, `/api/events/templates`, `/api/participants`, `PATCH /api/locations`.
- Neu: nur eine kleine `src/lib/event-status.ts` (Label/Farb/Reihenfolge-Mapping) — ersetzt die duplizierten Status-Ternaries in dashboard und round-manager.

## Reihenfolge der Umsetzung
1. `event-status.ts` (Labels + Mehrheitssieger-Helper) + Dashboard/Badge darauf umstellen (sichtbarer Sofort-Effekt, geringes Risiko).
2. B1 (Ergebnisse aus abgegebenen Stimmen) — Basis für die Stichwahl-Anzeige.
3. Manager extrahieren: `ParticipantManager`, `EmailManager` (verhaltensgleich zu heute).
4. Workspace-Seite `events/[id]` + Tabs + Phasen-Stepper/CTA bauen, Manager einbetten.
5. Stichwahl-Aktion C1 + Sieger-Erkennung C2 ins "Nächster Schritt"-Panel.
6. Dashboard-Link + Sidebar auf event-first; alte Feature-Seiten entfernen/weiterleiten.
7. Restliche Bugfixes B2–B3.

## Verifikation (Ende-zu-Ende)
- App lokal starten (Next dev; DB `data/dev.db`), als Admin einloggen.
- Neues Event anlegen → Dashboard-Karte führt in den Workspace (nicht mehr auf Runden).
- Kompletter Durchlauf im Workspace **ohne Tab-Wechsel über die Sidebar**: Teilnehmer hinzufügen → Vorschlagsphase starten → (per Magic-Link im `/propose` einen Ort vorschlagen) → Ort aktivieren → Abstimmungsrunde starten → per `/vote` abstimmen → Runde beenden → Ergebnis. Bei jedem Schritt zeigt das "Nächster Schritt"-Panel die passende Aktion.
- **Sieger-Fall (C2):** Runde mit klarem Mehrheitssieger (>50 %) → Panel zeigt "Sieger steht fest" + "Event abschließen", **keine** Stichwahl.
- **Stichwahl-Fall (C1):** Runde ohne Mehrheit (z. B. 3 Orte, 40/35/25 %) → Panel bietet "Stichwahl starten"; danach enthält die neue Runde nur die Top-Orte, `/vote` zeigt Teilnehmern nur diese, und die alte Runde behält im Verlauf ihre ursprünglichen Orte/Stimmen (B1).
- Keine rohen englischen Status-Strings mehr in der UI (Dashboard, Workspace, Runden).
- `npm run build` / Lint grün.

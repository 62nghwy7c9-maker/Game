# Wochenkompass — Anleitung

Wochenkompass ist deine persönliche Planungs-App gegen das tägliche „Pingpong":
Wochenplanung mit festen Zeitblöcken, eine Blitz-Inbox für alles Spontane,
Tages-Top-3, ein wöchentliches Rückblick-Ritual und ein PDF-Import für
Wettkampfprotokolle. **Alle Daten bleiben auf deinem Gerät** — kein Konto,
kein Server, keine Cloud.

---

## 1. Die App online schalten (einmalig, ca. 2 Minuten)

Die App wird kostenlos über GitHub Pages bereitgestellt. Das musst du einmal aktivieren:

1. Öffne dein Repository: `https://github.com/62nghwy7c9-maker/Game`
2. Klicke oben auf **Settings** (Zahnrad).
3. Wähle links im Menü **Pages**.
4. Bei „Build and deployment" → **Source**: „Deploy from a branch" auswählen.
5. Bei **Branch**: den Branch `claude/time-blocking-context-switching-dpnsyp` auswählen,
   daneben den Ordner **`/docs`**, dann **Save**.
6. Nach 1–2 Minuten ist die App erreichbar unter:

   **https://62nghwy7c9-maker.github.io/Game/**

Jede spätere Änderung am Branch aktualisiert die App automatisch.
Wenn eine neue Version bereitsteht, zeigt die App unten einen Hinweis
„Neue Version verfügbar — Neu laden".

## 2. Auf dem Handy installieren

Die App ist eine PWA — sie lässt sich wie eine normale App auf den
Startbildschirm legen und funktioniert danach auch **offline**.

**iPhone (Safari):** Seite öffnen → Teilen-Symbol (Quadrat mit Pfeil) →
„Zum Home-Bildschirm" → „Hinzufügen".

**Android (Chrome):** Seite öffnen → Drei-Punkte-Menü → „App installieren"
(oder „Zum Startbildschirm hinzufügen").

**PC (Chrome/Edge):** In der Adressleiste erscheint ein Installations-Symbol
(Monitor mit Pfeil) — anklicken und installieren.

Tipp: Auf Android öffnet ein langer Druck auf das App-Symbol die
Schnellaktion **„Schnell erfassen"** — direkt in die Inbox tippen.

## 3. Deine Daten & Backups (wichtig!)

- Alle Daten liegen **nur in dem Browser/Gerät**, in dem du sie eingegeben hast.
  Handy und PC haben also **getrennte Datenbestände** — es gibt (noch) keinen
  automatischen Abgleich.
- Mach regelmäßig ein Backup: **Mehr → Einstellungen → Backup exportieren**.
  Die JSON-Datei kannst du z. B. in deiner Cloud oder per Mail ablegen.
- Mit **Backup importieren** stellst du den Stand wieder her — auch auf einem
  anderen Gerät (so „ziehst du um"). Achtung: Der Import ersetzt die dortigen Daten.
- Der Wochenrückblick erinnert dich, wenn das letzte Backup zu lange her ist.

## 4. Notfall-Variante ohne GitHub Pages

Im Ordner `docs/offline/` liegt **`wochenkompass.html`** — eine einzelne Datei,
die du herunterladen und direkt im Browser öffnen kannst (Doppelklick).
Keine Installation, kein Offline-Cache, aber voll funktionsfähig;
die Daten werden auch hier lokal im Browser gespeichert.

## 5. So arbeitest du mit der App

**Einmal pro Woche (Sonntagabend, 15–30 min): Wochenrückblick**
„Mehr → Wochenrückblick" führt dich durch: Statistik ansehen → drei Fragen
beantworten → Inbox leeren → Standardwoche auf die nächste Woche anwenden →
Top-3 für Montag setzen. Das ist das wichtigste Ritual der App.

**Jederzeit: Erfassen statt springen**
Wenn dir etwas einfällt oder etwas „reinplatzt": **+**-Knopf → eintippen → weiter
mit dem, was du gerade getan hast. Nicht sofort erledigen, nicht merken müssen.

**1–2× täglich: Triage**
Inbox öffnen → „Triage starten". Für jeden Eintrag gibt es vier Wege:
- **Sofort erledigt** — war eine 2-Minuten-Sache, abhaken.
- **In nächsten Pufferblock** — kommt automatisch in deinen nächsten Puffer.
- **In Wochenplanung** — entscheidest du beim Wochenrückblick.
- **Bereich & Datum** — gezielt einem Lebensbereich und Tag zuordnen.

**Morgens: Top-3 setzen**
Auf „Heute" die 1–3 Dinge festlegen, die den Tag zum Erfolg machen —
egal wie viel Pingpong danach kommt.

**Wochenplan & Standardwoche**
Unter „Woche" siehst du deine Blöcke und **echte freie Zeitfenster**.
Tipp auf eine freie Fläche legt einen Block an. Deine wiederkehrende
Idealwoche pflegst du unter „Einstellungen → Standardwoche" (oder du richtest
eine Woche schön ein und tippst „Als Vorlage speichern").
Blocktypen: **Fokus** (geschützt), **Puffer** (für Ungeplantes — bitte
mehrere pro Woche!), Training, Admin-Batch, Termin, Sonstiges.

**Nach dem Wettkampf: Protokoll-Import**
„Mehr → Protokoll-Import": PDF auswählen → Kopfzeile antippen → Spalten
zuordnen → nach deinem Verein filtern → CSV herunterladen (öffnet in Excel)
oder in die Zwischenablage kopieren. Einmal als „Format" gespeichert, wird
dasselbe Protokoll-Layout beim nächsten Mal automatisch erkannt.
Hinweis: Gescannte PDFs ohne Textebene (reine Fotos) werden noch nicht unterstützt.

## 6. Für Entwickler / spätere Claude-Sessions

```bash
cd app
npm install
npm run dev        # Entwicklungsserver
npm test           # Unit-Tests (vitest)
npm run build:all  # Prod-Build nach ../docs + Single-File nach ../docs/offline
npm run e2e        # Playwright-E2E (erwartet Chromium unter /opt/pw-browsers/chromium)
```

- Der Build in `docs/` wird mitcommittet — GitHub Pages liefert ihn direkt aus.
- Neue Protokoll-Formate: Parser-Datei unter `src/pdf/parsers/` anlegen und in
  `registry.ts` registrieren (`detect()` + `parse()`).
- Datenschema-Änderungen: `CURRENT_SCHEMA_VERSION` erhöhen und Migration in
  `src/lib/migrations.ts` ergänzen.

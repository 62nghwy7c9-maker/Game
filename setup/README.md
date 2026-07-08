# Claude-Code-Stack für UE5 Game-Dev — Setup-Paket

Komplettes, lokal ausführbares Setup für den Claude-Code-Stack mit Unreal Engine 5
(realistische Umgebungen + Charaktere): Meshy, Blender-MCP, Context7, optional
Rodin/Hyper3D, plus Unreal-Plugins.

> **Warum ein Script statt Direkt-Setup?** Die Cloud-Session von Claude Code läuft
> in einem ephemeren Linux-Container ohne UE5/Blender und ohne Zugriff auf deinen
> Rechner. Alles hier Registrierte wäre nach Session-Ende verloren. Dieses Paket
> führt exakt dieselben Schritte **auf deinem Rechner** aus — dort, wo UE5 läuft.
> API-Keys werden **lokal abgefragt** und tauchen nie in Chat, Logs oder Git auf.

---

## Schnellstart

**macOS / Linux:**
```bash
cd <dieses-repo>/setup
./setup.sh
```

**Windows (PowerShell als Administrator empfohlen, wegen winget):**
```powershell
cd <dieses-repo>\setup
Set-ExecutionPolicy -Scope Process Bypass
.\setup.ps1
```

Das Script arbeitet die Phasen 1–4 unten automatisch ab, **zeigt jeden
Installationsbefehl vor der Ausführung an** und fragt nach Bestätigung.
Es stoppt mit klarer Fehlermeldung, sobald eine Voraussetzung fehlt, die nur du
liefern kannst (z. B. ein API-Key).

Was du bereithalten solltest:

| Eingabe | Woher |
|---|---|
| `MESHY_API_KEY` | meshy.ai/dashboard → Settings → API Keys |
| `RODIN_API_KEY` (optional) | hyper3d.ai — leer lassen, wenn ohne |
| UE-Projektpfad | z. B. `~/Projekte/MeinSpiel` (Ordner mit der `.uproject`-Datei) |
| VibeUE-Key (optional) | vibeue.com — wird nur im UE-Editor eingetragen, nicht im Script |

---

## Phase 1 — Voraussetzungen (automatisch)

Geprüft und bei Bedarf installiert (brew / winget / apt):

- Node.js ≥ 18 + npm
- Python ≥ 3.11
- uv / uvx
- git
- Claude Code CLI (`claude --version`)
- Blender (für den Blender-MCP-Server)

Das Script gibt eine Tabelle aus: `Tool | gefunden? | Version | Aktion`.

## Phase 2 — MCP-Server (automatisch)

Registriert mit `--scope user` (gilt für alle deine Projekte):

| Server | Zweck | Paket (verifiziert) |
|---|---|---|
| `meshy` | Text/Image-to-3D, Charaktere, Rigging, Umgebungs-Assets | npm `@meshy-ai/meshy-mcp-server` (v0.4.0) |
| `blender` | Cleanup, Import, Szenenaufbau | PyPI `blender-mcp` (v1.6.4) via `uvx` |
| `context7` | Aktuelle UE-/Engine-API-Docs, verhindert veraltete Aufrufe | npm `@upstash/context7-mcp` (v3.2.3) |
| `rodin` (optional) | Hyper3D-Generierung — läuft über die Hyper3D-Integration **im Blender-MCP** (Key wird im Blender-Addon-Panel eingetragen), ein separater offizieller Rodin-MCP-Server existiert nicht als verifiziertes npm/PyPI-Paket | — |

> **Hinweis zur Befehls-Syntax:** In der ursprünglichen Vorlage stand
> `... -- npx -y @meshy-ai/meshy-mcp-server -e MESHY_API_KEY=...` — das ist
> falsch platziert: alles nach `--` geht an `npx`, nicht an `claude`. Korrekt ist
> `claude mcp add --scope user --env MESHY_API_KEY=... meshy -- npx -y @meshy-ai/meshy-mcp-server`.
> Das Script verwendet die korrekte Form.

Nach jedem Add wird die Verbindung mit `claude mcp list` getestet.

## Phase 3 — Unreal-Plugins (teils automatisch, teils Editor)

Automatisch durch das Script:

- `.mcp.json` und `.claude/settings.json` im UE-Projekt werden **gemergt, nicht
  überschrieben** (vorhandene Einträge haben Vorrang; siehe
  `merge-claude-config.mjs`). Keys landen als `${MESHY_API_KEY}`-Referenz in der
  Datei, nie als Klartext.

Manuell in Claude Code (auf deinem Rechner) auszuführen:

```
/plugin marketplace add EpicGames/unreal-engine-skills-for-claude-code-plugin
/plugin install unreal-engine-skills@unreal-engine-skills-for-claude-code-plugin
```

*(Repo-Name wie angegeben; von der Cloud-Session aus nicht verifizierbar —
Epic-Repos erfordern einen mit Epic verknüpften GitHub-Account. Schlägt der
Marketplace-Add fehl: GitHub-Account unter epicgames.com/account/connections
verknüpfen.)*

### Manuelle Checkliste (nur im UE-Editor möglich)

1. ☐ **UnrealClaude-Plugin** installieren: Plugin-Quelle als Git-URL beziehen und
   in `<Projekt>/Plugins/` klonen (UE hat keinen Unity-artigen Package Manager —
   Git-Plugins werden in den `Plugins`-Ordner gelegt und beim nächsten
   Editor-Start kompiliert).
2. ☐ **VibeUE-Plugin** installieren und den Key von vibeue.com in den
   Plugin-Einstellungen eintragen (nur falls du VibeUE nutzt).
3. ☐ In UE aktivieren: Edit → Plugins → **„ModelContextProtocol"** und
   **„AllToolsets"** anhaken → Restart.
4. ☐ In der UE-Konsole (`~`-Taste): `ModelContextProtocol.StartServer`
5. ☐ UE-Editor **und** Claude Code neu starten, damit alle Server geladen werden.

## Phase 4 — Verifikation (automatisch)

- `claude mcp list` mit Live-Status aller Server
- Finale Statusübersicht: ✅ automatisch erledigt | ⏳ manuell zu tun | ❌ fehlgeschlagen + Grund

### Smoke-Tests (nach Abschluss in Claude Code eintippen)

**UE (setzt aktivierte Editor-Plugins + laufenden MCP-Server voraus):**
```
Liste alle Blueprints in Content/Characters und ihre Parent-Klasse.
```

**Meshy (Preview-Modus, verbraucht keine Credits):**
```
Erzeuge mit Meshy einen Text-to-3D-Testjob im Preview-Modus:
"a weathered wooden barrel, game-ready, low poly" — nur Preview,
kein Refine, und melde mir Task-ID und Status.
```

---

## Sicherheit

- Keys werden per verdeckter Eingabe (`read -s` / `SecureString`) abgefragt und
  nur an `claude mcp add --env` übergeben (landen in deiner lokalen
  `~/.claude.json`, wie von Claude Code vorgesehen).
- In Projekt-Dateien (`.mcp.json`) stehen nur `${VAR}`-Referenzen, nie Klartext.
- Die Scripts loggen niemals Key-Werte.

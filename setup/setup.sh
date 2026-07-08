#!/usr/bin/env bash
# Claude-Code-Stack für UE5 Game-Dev — Setup (macOS / Linux)
# Phasen: 1) Voraussetzungen  2) MCP-Server  3) UE-Projekt-Konfig  4) Verifikation
# Regeln: jeden Installationsbefehl vorher anzeigen; keine Secrets loggen;
#         bei fehlender Voraussetzung stoppen statt Platzhalter verwenden.
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OS="$(uname -s)"

bold() { printf '\033[1m%s\033[0m\n' "$*"; }
ok()   { printf '  ✅ %s\n' "$*"; }
warn() { printf '  ⏳ %s\n' "$*"; }
fail() { printf '  ❌ %s\n' "$*"; }
die()  { printf '\n❌ ABBRUCH: %s\n' "$*" >&2; exit 1; }

# Installationsbefehl anzeigen, bestätigen lassen, ausführen.
confirm_run() {
  local desc="$1"; shift
  echo
  bold "→ $desc"
  printf '  Befehl: %s\n' "$*"
  read -r -p "  Ausführen? [j/N] " ans
  case "$ans" in
    [jJyY]*) "$@" ;;
    *) echo "  Übersprungen."; return 1 ;;
  esac
}

pkg_install() { # pkg_install <paketname-brew> <paketname-apt>
  if [ "$OS" = "Darwin" ]; then
    command -v brew >/dev/null 2>&1 || die "Homebrew fehlt. Installiere es zuerst: https://brew.sh"
    confirm_run "Installiere $1 via Homebrew" brew install "$1"
  else
    command -v apt-get >/dev/null 2>&1 || die "apt-get nicht gefunden. Installiere '$2' manuell mit deinem Paketmanager."
    confirm_run "Installiere $2 via apt" sudo apt-get install -y "$2"
  fi
}

ver_ge() { [ "$(printf '%s\n%s' "$2" "$1" | sort -V | head -1)" = "$2" ]; }

# ---------------------------------------------------------------- Phase 1
bold "═══ PHASE 1 — Voraussetzungen prüfen ═══"
declare -a REPORT=()

check_tool() { # check_tool <anzeige> <cmd> <version-cmd> <minversion|-> <brew> <apt>
  local name="$1" cmd="$2" vcmd="$3" minv="$4" brewp="$5" aptp="$6" v="" action="keine"
  if command -v "$cmd" >/dev/null 2>&1; then
    v="$(eval "$vcmd" 2>/dev/null | head -1)"
    local vnum; vnum="$(echo "$v" | grep -oE '[0-9]+\.[0-9]+(\.[0-9]+)?' | head -1)"
    if [ "$minv" != "-" ] && [ -n "$vnum" ] && ! ver_ge "$vnum" "$minv"; then
      action="Update nötig (≥$minv)"
      pkg_install "$brewp" "$aptp" && v="$(eval "$vcmd" 2>/dev/null | head -1)" && action="aktualisiert"
    fi
    REPORT+=("$name | ✅ | $v | $action")
  else
    if [ -n "$brewp" ]; then
      if pkg_install "$brewp" "$aptp" && command -v "$cmd" >/dev/null 2>&1; then
        REPORT+=("$name | ✅ | $(eval "$vcmd" 2>/dev/null | head -1) | installiert")
      else
        REPORT+=("$name | ❌ | – | Installation übersprungen/fehlgeschlagen")
        MISSING="${MISSING:-} $name"
      fi
    else
      REPORT+=("$name | ❌ | – | manuell installieren")
      MISSING="${MISSING:-} $name"
    fi
  fi
}

MISSING=""
check_tool "Node.js" node "node --version" "18" "node" "nodejs"
check_tool "npm" npm "npm --version" "-" "node" "npm"
check_tool "Python" python3 "python3 --version" "3.11" "python@3.12" "python3"
check_tool "uv/uvx" uvx "uv --version" "-" "uv" "uv"
if ! command -v uvx >/dev/null 2>&1; then
  confirm_run "Installiere uv (offizielles Install-Script von astral.sh)" \
    sh -c 'curl -LsSf https://astral.sh/uv/install.sh | sh' && export PATH="$HOME/.local/bin:$PATH"
fi
check_tool "git" git "git --version" "-" "git" "git"
check_tool "Blender" blender "blender --version" "-" "blender" "blender"
if [ "$OS" = "Darwin" ] && ! command -v blender >/dev/null 2>&1 && [ -x "/Applications/Blender.app/Contents/MacOS/Blender" ]; then
  REPORT+=("Blender | ✅ | (in /Applications) | keine")
fi
check_tool "Claude CLI" claude "claude --version" "-" "" ""

echo
bold "Tool | gefunden? | Version | Aktion"
printf '%s\n' "-----------------------------------------------"
for line in "${REPORT[@]}"; do printf '%s\n' "$line"; done

command -v claude >/dev/null 2>&1 || die "Claude Code CLI fehlt. Installieren mit: npm install -g @anthropic-ai/claude-code — danach Script erneut starten."
[ -n "$MISSING" ] && die "Fehlende Tools:$MISSING — bitte installieren, dann Script erneut starten."

# ---------------------------------------------------------------- Phase 2
echo
bold "═══ PHASE 2 — MCP-Server registrieren (--scope user) ═══"

mcp_add() { # mcp_add <name> <beschreibung> [env KEY=VAL]... -- <command...>
  local name="$1" desc="$2"; shift 2
  local envs=()
  while [ "$1" != "--" ]; do envs+=(--env "$1"); shift; done
  shift
  if claude mcp get "$name" >/dev/null 2>&1; then
    read -r -p "  MCP-Server '$name' existiert bereits. Ersetzen? [j/N] " ans
    case "$ans" in [jJyY]*) claude mcp remove "$name" --scope user >/dev/null 2>&1 || claude mcp remove "$name" >/dev/null 2>&1 ;; *) warn "$name: bestehende Konfiguration behalten"; return 0 ;; esac
  fi
  bold "→ $desc"
  # Befehl anzeigen — env-Werte maskiert, keine Secrets im Log:
  printf '  Befehl: claude mcp add --scope user'
  local e; for e in "${envs[@]}"; do case "$e" in --env) printf ' --env';; *) printf ' %s=****' "${e%%=*}";; esac; done
  printf ' %s -- %s\n' "$name" "$*"
  if claude mcp add --scope user "${envs[@]}" "$name" -- "$@"; then ok "$name registriert"; else fail "$name: Registrierung fehlgeschlagen"; fi
}

# Meshy — Key verdeckt abfragen (STOPP wenn leer)
if [ -z "${MESHY_API_KEY:-}" ]; then
  read -r -s -p "MESHY_API_KEY (Eingabe unsichtbar; von meshy.ai/dashboard → Settings → API Keys): " MESHY_API_KEY; echo
fi
[ -n "$MESHY_API_KEY" ] || die "MESHY_API_KEY fehlt — ohne Key kann Meshy nicht registriert werden. Key holen, dann erneut starten (oder als Umgebungsvariable MESHY_API_KEY setzen)."
mcp_add meshy "Meshy (Charaktere/Rigging + Umgebungs-Assets)" \
  "MESHY_API_KEY=$MESHY_API_KEY" -- npx -y @meshy-ai/meshy-mcp-server

# Blender-MCP
mcp_add blender "Blender-Hub (Cleanup, Import, Szenenaufbau)" -- uvx blender-mcp
echo "  Hinweis: Zusätzlich muss das Blender-Addon (addon.py von github.com/ahujasid/blender-mcp)"
echo "  in Blender installiert und dort 'Connect to MCP server' aktiviert sein."

# Context7
mcp_add context7 "Context7 (aktuelle UE/Engine-API-Docs)" -- npx -y @upstash/context7-mcp

# Rodin/Hyper3D (optional)
if [ -z "${RODIN_API_KEY:-}" ]; then
  read -r -s -p "RODIN/HYPER3D_API_KEY (optional, Enter = überspringen): " RODIN_API_KEY; echo
fi
if [ -n "${RODIN_API_KEY:-}" ]; then
  warn "Rodin/Hyper3D: es gibt keinen verifizierten eigenständigen Rodin-MCP-Server auf npm/PyPI."
  echo "     Hyper3D ist in blender-mcp integriert: Key im Blender-Addon-Panel unter 'Hyper3D Rodin' eintragen."
  RODIN_NOTE="⏳ Rodin-Key im Blender-Addon-Panel eintragen (Hyper3D-Integration von blender-mcp)"
else
  RODIN_NOTE="✅ Rodin übersprungen (kein Key angegeben)"
fi

echo
bold "Verbindungstest aller Server:"
claude mcp list || warn "claude mcp list meldete Fehler — Details oben"

# ---------------------------------------------------------------- Phase 3
echo
bold "═══ PHASE 3 — UE-Projekt konfigurieren ═══"
read -r -p "Pfad zum UE-Projekt (Ordner mit .uproject-Datei): " UE_PROJECT
UE_PROJECT="${UE_PROJECT/#\~/$HOME}"
[ -d "$UE_PROJECT" ] || die "Pfad '$UE_PROJECT' existiert nicht. Bitte korrekten Projektpfad angeben und erneut starten."
ls "$UE_PROJECT"/*.uproject >/dev/null 2>&1 || warn "Keine .uproject-Datei in '$UE_PROJECT' gefunden — fahre trotzdem fort."

node "$SCRIPT_DIR/merge-claude-config.mjs" "$UE_PROJECT" || die ".mcp.json/.claude/settings.json-Merge fehlgeschlagen (Details oben)."

echo
bold "Manuell in Claude Code ausführen (Epic-Plugin):"
echo "  /plugin marketplace add EpicGames/unreal-engine-skills-for-claude-code-plugin"
echo "  /plugin install unreal-engine-skills@unreal-engine-skills-for-claude-code-plugin"

echo
bold "MANUELLE CHECKLISTE (nur im UE-Editor möglich):"
cat <<'EOF'
  1) ☐ UnrealClaude-Plugin: Git-Repo in <Projekt>/Plugins/ klonen, Editor neu starten (kompiliert beim Start)
  2) ☐ VibeUE-Plugin installieren + Key von vibeue.com in den Plugin-Einstellungen eintragen (falls genutzt)
  3) ☐ Edit → Plugins → "ModelContextProtocol" + "AllToolsets" aktivieren → Restart
  4) ☐ UE-Konsole (~): ModelContextProtocol.StartServer
  5) ☐ UE-Editor UND Claude Code neu starten, damit alle Server laden
EOF

# ---------------------------------------------------------------- Phase 4
echo
bold "═══ PHASE 4 — Abschluss-Verifikation ═══"
claude mcp list

echo
bold "Smoke-Tests (in Claude Code eintippen):"
echo '  UE:    "Liste alle Blueprints in Content/Characters und ihre Parent-Klasse."'
echo '  Meshy: "Erzeuge mit Meshy einen Text-to-3D-Testjob im Preview-Modus:'
echo '          a weathered wooden barrel, game-ready, low poly — nur Preview, kein Refine,'
echo '          melde Task-ID und Status." (Preview verbraucht keine Credits)'

echo
bold "FINALE STATUSÜBERSICHT"
echo "  ✅ Voraussetzungen geprüft/installiert (Tabelle oben)"
echo "  ✅ MCP-Server registriert: meshy, blender, context7 (Status siehe 'claude mcp list' oben)"
echo "  $RODIN_NOTE"
echo "  ✅ .mcp.json + .claude/settings.json im Projekt gemergt"
echo "  ⏳ Epic-Plugin per Slash-Befehlen installieren (siehe oben)"
echo "  ⏳ Editor-Checkliste 1–5 abarbeiten"
echo "  ⏳ Blender-Addon (addon.py) installieren + 'Connect to MCP server'"
echo
bold "Fertig. Bei Fehlern: Meldung oben lesen — jede nennt Ursache + Fix."

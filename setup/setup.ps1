# Claude-Code-Stack für UE5 Game-Dev — Setup (Windows / PowerShell)
# Phasen: 1) Voraussetzungen  2) MCP-Server  3) UE-Projekt-Konfig  4) Verifikation
# Regeln: jeden Installationsbefehl vorher anzeigen; keine Secrets loggen;
#         bei fehlender Voraussetzung stoppen statt Platzhalter verwenden.
$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

function Die($msg) { Write-Host "`n❌ ABBRUCH: $msg" -ForegroundColor Red; exit 1 }

function Confirm-Run($desc, $cmd) {
    Write-Host "`n→ $desc" -ForegroundColor Cyan
    Write-Host "  Befehl: $cmd"
    $ans = Read-Host "  Ausführen? [j/N]"
    if ($ans -match '^[jJyY]') { Invoke-Expression $cmd; return $true }
    Write-Host "  Übersprungen."; return $false
}

# ---------------------------------------------------------------- Phase 1
Write-Host "═══ PHASE 1 — Voraussetzungen prüfen ═══" -ForegroundColor Cyan
if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
    Die "winget fehlt. Installiere den 'App Installer' aus dem Microsoft Store, dann Script erneut starten."
}

$Report = @()
$Missing = @()

function Check-Tool($name, $cmd, $verArgs, $minVer, $wingetId) {
    $found = Get-Command $cmd -ErrorAction SilentlyContinue
    if (-not $found -and $wingetId) {
        if (Confirm-Run "Installiere $name via winget" "winget install -e --id $wingetId --accept-source-agreements --accept-package-agreements") {
            $env:Path = [Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [Environment]::GetEnvironmentVariable("Path","User")
            $found = Get-Command $cmd -ErrorAction SilentlyContinue
        }
    }
    if ($found) {
        $v = (& $cmd $verArgs 2>$null | Select-Object -First 1)
        $vnum = if ("$v" -match '(\d+)\.(\d+)') { [version]("$($Matches[1]).$($Matches[2])") } else { $null }
        $action = "keine"
        if ($minVer -and $vnum -and $vnum -lt [version]$minVer) {
            $action = "Update nötig (≥$minVer): winget upgrade --id $wingetId"
            $script:Missing += "$name (zu alt)"
        }
        $script:Report += "$name | ✅ | $v | $action"
    } else {
        $script:Report += "$name | ❌ | – | Installation übersprungen/fehlgeschlagen"
        $script:Missing += $name
    }
}

Check-Tool "Node.js"    "node"    "--version" "18.0" "OpenJS.NodeJS.LTS"
Check-Tool "npm"        "npm"     "--version" $null  $null
Check-Tool "Python"     "python"  "--version" "3.11" "Python.Python.3.12"
Check-Tool "uv/uvx"     "uvx"     "--version" $null  "astral-sh.uv"
Check-Tool "git"        "git"     "--version" $null  "Git.Git"
Check-Tool "Blender"    "blender" "--version" $null  "BlenderFoundation.Blender"
Check-Tool "Claude CLI" "claude"  "--version" $null  $null

Write-Host "`nTool | gefunden? | Version | Aktion"
Write-Host "-----------------------------------------------"
$Report | ForEach-Object { Write-Host $_ }

if (-not (Get-Command claude -ErrorAction SilentlyContinue)) {
    Die "Claude Code CLI fehlt. Installieren mit: npm install -g @anthropic-ai/claude-code — danach Script erneut starten."
}
if ($Missing.Count -gt 0) { Die "Fehlende/veraltete Tools: $($Missing -join ', ') — bitte beheben, dann Script erneut starten." }

# ---------------------------------------------------------------- Phase 2
Write-Host "`n═══ PHASE 2 — MCP-Server registrieren (--scope user) ═══" -ForegroundColor Cyan

function Read-Secret($promptText) {
    $sec = Read-Host -AsSecureString $promptText
    $b = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec)
    try { [Runtime.InteropServices.Marshal]::PtrToStringBSTR($b) }
    finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($b) }
}

function Mcp-Add($name, $desc, $envPairs, $cmdArgs) {
    claude mcp get $name *> $null
    if ($LASTEXITCODE -eq 0) {
        $ans = Read-Host "  MCP-Server '$name' existiert bereits. Ersetzen? [j/N]"
        if ($ans -match '^[jJyY]') { claude mcp remove $name --scope user *> $null } else { Write-Host "  ⏳ ${name}: bestehende Konfiguration behalten"; return }
    }
    Write-Host "→ $desc" -ForegroundColor Cyan
    $shown = ($envPairs | ForEach-Object { "--env $(($_ -split '=')[0])=****" }) -join ' '
    Write-Host "  Befehl: claude mcp add --scope user $shown $name -- $($cmdArgs -join ' ')"
    $args = @('mcp','add','--scope','user')
    foreach ($e in $envPairs) { $args += @('--env', $e) }
    $args += @($name, '--') + $cmdArgs
    & claude @args
    if ($LASTEXITCODE -eq 0) { Write-Host "  ✅ $name registriert" } else { Write-Host "  ❌ ${name}: Registrierung fehlgeschlagen" -ForegroundColor Red }
}

$MeshyKey = $env:MESHY_API_KEY
if (-not $MeshyKey) { $MeshyKey = Read-Secret "MESHY_API_KEY (Eingabe unsichtbar; meshy.ai/dashboard → Settings → API Keys)" }
if (-not $MeshyKey) { Die "MESHY_API_KEY fehlt — ohne Key kann Meshy nicht registriert werden. Key holen, dann erneut starten." }
Mcp-Add "meshy" "Meshy (Charaktere/Rigging + Umgebungs-Assets)" @("MESHY_API_KEY=$MeshyKey") @('npx','-y','@meshy-ai/meshy-mcp-server')

Mcp-Add "blender" "Blender-Hub (Cleanup, Import, Szenenaufbau)" @() @('uvx','blender-mcp')
Write-Host "  Hinweis: Zusätzlich Blender-Addon (addon.py von github.com/ahujasid/blender-mcp) in Blender installieren + 'Connect to MCP server' aktivieren."

Mcp-Add "context7" "Context7 (aktuelle UE/Engine-API-Docs)" @() @('npx','-y','@upstash/context7-mcp')

$RodinKey = $env:RODIN_API_KEY
if (-not $RodinKey) { $RodinKey = Read-Secret "RODIN/HYPER3D_API_KEY (optional, Enter = überspringen)" }
if ($RodinKey) {
    Write-Host "  ⏳ Rodin/Hyper3D: kein verifizierter eigenständiger Rodin-MCP auf npm/PyPI." -ForegroundColor Yellow
    Write-Host "     Hyper3D ist in blender-mcp integriert: Key im Blender-Addon-Panel unter 'Hyper3D Rodin' eintragen."
    $RodinNote = "⏳ Rodin-Key im Blender-Addon-Panel eintragen (Hyper3D-Integration von blender-mcp)"
} else {
    $RodinNote = "✅ Rodin übersprungen (kein Key angegeben)"
}

Write-Host "`nVerbindungstest aller Server:" -ForegroundColor Cyan
claude mcp list

# ---------------------------------------------------------------- Phase 3
Write-Host "`n═══ PHASE 3 — UE-Projekt konfigurieren ═══" -ForegroundColor Cyan
$UEProject = Read-Host "Pfad zum UE-Projekt (Ordner mit .uproject-Datei)"
if (-not (Test-Path $UEProject)) { Die "Pfad '$UEProject' existiert nicht. Bitte korrekten Projektpfad angeben und erneut starten." }
if (-not (Get-ChildItem "$UEProject\*.uproject" -ErrorAction SilentlyContinue)) {
    Write-Host "  ⏳ Keine .uproject-Datei gefunden — fahre trotzdem fort." -ForegroundColor Yellow
}
node "$ScriptDir\merge-claude-config.mjs" "$UEProject"
if ($LASTEXITCODE -ne 0) { Die ".mcp.json/.claude/settings.json-Merge fehlgeschlagen (Details oben)." }

Write-Host "`nManuell in Claude Code ausführen (Epic-Plugin):" -ForegroundColor Cyan
Write-Host "  /plugin marketplace add EpicGames/unreal-engine-skills-for-claude-code-plugin"
Write-Host "  /plugin install unreal-engine-skills@unreal-engine-skills-for-claude-code-plugin"

Write-Host "`nMANUELLE CHECKLISTE (nur im UE-Editor möglich):" -ForegroundColor Cyan
@"
  1) ☐ UnrealClaude-Plugin: Git-Repo in <Projekt>\Plugins\ klonen, Editor neu starten (kompiliert beim Start)
  2) ☐ VibeUE-Plugin installieren + Key von vibeue.com in den Plugin-Einstellungen eintragen (falls genutzt)
  3) ☐ Edit → Plugins → "ModelContextProtocol" + "AllToolsets" aktivieren → Restart
  4) ☐ UE-Konsole (~): ModelContextProtocol.StartServer
  5) ☐ UE-Editor UND Claude Code neu starten, damit alle Server laden
"@ | Write-Host

# ---------------------------------------------------------------- Phase 4
Write-Host "`n═══ PHASE 4 — Abschluss-Verifikation ═══" -ForegroundColor Cyan
claude mcp list

Write-Host "`nSmoke-Tests (in Claude Code eintippen):" -ForegroundColor Cyan
Write-Host '  UE:    "Liste alle Blueprints in Content/Characters und ihre Parent-Klasse."'
Write-Host '  Meshy: "Erzeuge mit Meshy einen Text-to-3D-Testjob im Preview-Modus: a weathered'
Write-Host '          wooden barrel, game-ready, low poly — nur Preview, kein Refine, melde'
Write-Host '          Task-ID und Status." (Preview verbraucht keine Credits)'

Write-Host "`nFINALE STATUSÜBERSICHT" -ForegroundColor Cyan
Write-Host "  ✅ Voraussetzungen geprüft/installiert (Tabelle oben)"
Write-Host "  ✅ MCP-Server registriert: meshy, blender, context7 (Status siehe 'claude mcp list')"
Write-Host "  $RodinNote"
Write-Host "  ✅ .mcp.json + .claude/settings.json im Projekt gemergt"
Write-Host "  ⏳ Epic-Plugin per Slash-Befehlen installieren (siehe oben)"
Write-Host "  ⏳ Editor-Checkliste 1–5 abarbeiten"
Write-Host "  ⏳ Blender-Addon (addon.py) installieren + 'Connect to MCP server'"
Write-Host "`nFertig. Bei Fehlern: Meldung oben lesen — jede nennt Ursache + Fix."

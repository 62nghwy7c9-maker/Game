#!/usr/bin/env node
// Merged .mcp.json und .claude/settings.json in ein UE-Projekt.
// Regel: bestehende Einträge werden NIE überschrieben (vorher lesen, dann mergen).
// Secrets stehen nur als ${VAR}-Referenz in den Dateien, nie als Klartext.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const project = process.argv[2];
if (!project) {
  console.error("Aufruf: node merge-claude-config.mjs <UE-Projektpfad>");
  process.exit(1);
}

function readJson(path) {
  if (!existsSync(path)) return {};
  const raw = readFileSync(path, "utf8").trim();
  if (raw === "") return {};
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error(`❌ ${path} enthält kein gültiges JSON (${e.message}).`);
    console.error("   Fix: Datei manuell reparieren oder sichern und entfernen, dann erneut ausführen.");
    process.exit(1);
  }
}

// Deep-Merge: Werte aus `add` nur dort einfügen, wo `base` nichts hat.
function mergeMissing(base, add) {
  for (const [k, v] of Object.entries(add)) {
    if (!(k in base)) {
      base[k] = v;
    } else if (v && typeof v === "object" && !Array.isArray(v) &&
               base[k] && typeof base[k] === "object" && !Array.isArray(base[k])) {
      mergeMissing(base[k], v);
    } // sonst: bestehenden Wert behalten
  }
  return base;
}

// --- .mcp.json (projekt-scope MCP-Server; Claude Code expandiert ${VAR}) ---
const mcpPath = join(project, ".mcp.json");
const mcp = readJson(mcpPath);
const before = JSON.stringify(mcp);
mergeMissing(mcp, {
  mcpServers: {
    meshy: {
      command: "npx",
      args: ["-y", "@meshy-ai/meshy-mcp-server"],
      env: { MESHY_API_KEY: "${MESHY_API_KEY}" },
    },
    blender: { command: "uvx", args: ["blender-mcp"] },
    context7: { command: "npx", args: ["-y", "@upstash/context7-mcp"] },
  },
});
writeFileSync(mcpPath, JSON.stringify(mcp, null, 2) + "\n");
console.log(`✅ ${mcpPath} ${before === "{}" ? "erstellt" : "gemergt (bestehende Einträge unangetastet)"}`);

// --- .claude/settings.json ---
const claudeDir = join(project, ".claude");
mkdirSync(claudeDir, { recursive: true });
const settingsPath = join(claudeDir, "settings.json");
const settings = readJson(settingsPath);
const sBefore = JSON.stringify(settings);
mergeMissing(settings, {
  enableAllProjectMcpServers: true,
});
writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + "\n");
console.log(`✅ ${settingsPath} ${sBefore === "{}" ? "erstellt" : "gemergt (bestehende Einträge unangetastet)"}`);

console.log("ℹ️  Hinweis: MESHY_API_KEY muss als Umgebungsvariable gesetzt sein, wenn Claude Code");
console.log("   im Projekt gestartet wird (die user-scope-Registrierung aus Phase 2 hat den Key bereits).");

"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT = path.join(ROOT, "browser-e2e.html");
const SCRIPTS = ["core.js", "app.js"];

function buildBundle() {
  let html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  const references = [...html.matchAll(/<script src="(core\.js|app\.js)" defer><\/script>/g)];
  if (references.map((match) => match[1]).join("\0") !== SCRIPTS.join("\0")
      || (html.match(/<script\b/g) || []).length !== SCRIPTS.length) {
    throw new Error("The browser page must reference core.js and app.js in order.");
  }

  const scripts = SCRIPTS.map((name) => {
    const source = fs.readFileSync(path.join(ROOT, name), "utf8").replace(/\r\n?/g, "\n");
    if (/<\/script/i.test(source)) throw new Error(`Cannot safely inline ${name}.`);
    const digest = crypto.createHash("sha256").update(source, "utf8").digest("base64");
    return { name, source, digest };
  });

  const policy = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src ${scripts.map(({ digest }) => `'sha256-${digest}'`).join(" ")}; base-uri 'none'; form-action 'none'">`;
  const policyMatch = html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)">/);
  if (!policyMatch || policyMatch[1] !== "default-src 'none'; style-src 'unsafe-inline'; script-src 'self'; base-uri 'none'; form-action 'none'") {
    throw new Error("The source page security policy changed; review the bundle builder.");
  }
  html = html.replace(policyMatch[0], policy);

  for (const { name, source } of scripts) {
    const tag = `<script src="${name}" defer></script>`;
    if (!html.includes(tag)) throw new Error(`The source page no longer references ${name} as expected.`);
    html = html.replace(tag, `<script>${source}</script>`);
  }
  return html;
}

function main() {
  const expected = buildBundle();
  if (process.argv[2] === "--check") {
    if (!fs.existsSync(OUTPUT) || fs.readFileSync(OUTPUT, "utf8") !== expected) {
      console.error("browser-e2e.html is stale; regenerate it from index.html, core.js, and app.js.");
      process.exitCode = 1;
      return;
    }
    console.log("Standalone browser E2E bundle matches the reviewed app sources.");
    return;
  }
  if (process.argv.length > 2) throw new Error("Usage: node tools/build-browser-e2e.cjs [--check]");
  fs.writeFileSync(OUTPUT, expected, "utf8");
  console.log("Wrote browser-e2e.html.");
}

if (require.main === module) main();

module.exports = { buildBundle };

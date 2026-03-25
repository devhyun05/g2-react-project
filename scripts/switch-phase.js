import fs from "node:fs";
import path from "node:path";

const phase = process.argv[2];
const valid = ["phase1", "phase2", "phase3"];
if (!valid.includes(phase)) {
  console.error("Usage: node scripts/switch-phase.js <phase1|phase2|phase3>");
  process.exit(1);
}

const root = process.cwd();
const source = path.join(root, "phases", phase);
const targetPairs = [
  ["src", ["src"]],
  ["tests", ["tests"]],
];

for (const [entry, include] of targetPairs) {
  const srcPath = path.join(source, entry);
  const dstPath = path.join(root, entry);
  if (!fs.existsSync(srcPath)) {
    console.log(`[skip] ${srcPath} not found`);
    continue;
  }

  if (fs.existsSync(dstPath)) {
    fs.rmSync(dstPath, { recursive: true, force: true });
  }

  fs.cpSync(srcPath, dstPath, { recursive: true });
  console.log(`[copied] ${entry} <- ${srcPath}`);
}

for (const file of ["README.md", "index.html", "style.css", "package.json"]) {
  const srcFile = path.join(source, file);
  const dstFile = path.join(root, file);
  if (!fs.existsSync(srcFile)) {
    continue;
  }
  fs.copyFileSync(srcFile, dstFile);
  console.log(`[copied] ${file}`);
}

console.log(`Phase switched to ${phase}`);

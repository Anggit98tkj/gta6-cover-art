// Vice Poster Maker entry point.
//
// This program packages the app for make.fun: it copies app/ and
// screenshots/ from next to this file into the output directory and
// writes dossier.json there using the vendored make.fun helper.
// The grader runs it with no arguments; locally you can point the
// output elsewhere, e.g.:
//   MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

// Limits the dossier builder enforces, matching the scorer's caps:
// at most 4 screenshots of 256 KiB each, app/ at most 993 files and
// 48 MiB total, no single path under app/ longer than 1000 bytes,
// and text files capped at 160 KiB each.
const DOSSIER_LIMITS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
};

function repoRoot() {
  return fileURLToPath(new URL('.', import.meta.url));
}

function destinationDir() {
  return process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
}

function copyTree(from, to) {
  cpSync(from, to, { recursive: true });
}

function stageAssets(root, outDir) {
  mkdirSync(outDir, { recursive: true });
  copyTree(join(root, 'app'), join(outDir, 'app'));
  const shots = join(root, 'screenshots');
  if (existsSync(shots)) {
    mkdirSync(join(outDir, 'screenshots'), { recursive: true });
    copyTree(shots, join(outDir, 'screenshots'));
  }
}

function emitDossier(outDir) {
  const json = buildDossier(outDir, DOSSIER_LIMITS);
  writeFileSync(join(outDir, 'dossier.json'), json);
}

const root = repoRoot();
const outDir = destinationDir();
stageAssets(root, outDir);
emitDossier(outDir);
console.log(`Vice Poster Maker packaged into ${outDir} (app/, screenshots/, dossier.json).`);

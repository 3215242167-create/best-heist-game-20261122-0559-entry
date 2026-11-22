// Night at the Vault — hand-in program for the make.fun heist contest.
//
// Running this copies the finished game (game/) and its screenshots
// (screenshots/) from this repository into the output folder, then asks the
// vendored make.fun library to summarise that folder into dossier.json, the
// document the contest judge reads. The grader's container mounts the output
// at /output; anywhere else, point MAKEFUN_OUTPUT_DIR at a folder instead:
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoDir = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outDir, { recursive: true });
cpSync(join(repoDir, 'game'), join(outDir, 'game'), { recursive: true });
if (existsSync(join(repoDir, 'screenshots'))) {
  cpSync(join(repoDir, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
}

// The caps below mirror the scorer's own limits: at most 4 screenshots of
// 256 KiB each, at most 993 game files totalling 48 MiB, no game path longer
// than 1000 bytes, and the dossier's source text capped at 160 KiB.
const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);

console.log(`handed in: game + screenshots copied to ${outDir}, dossier.json written`);

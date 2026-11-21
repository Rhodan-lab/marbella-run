import {
  cpSync, lstatSync, mkdirSync, readdirSync, readFileSync,
  realpathSync, renameSync, rmSync, writeFileSync,
} from 'node:fs';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier, htmlFacts, sourceImports } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const caps = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 204800 },
  game_max_files: 993,
  game_max_bytes: 48 * 1024 * 1024,
  game_path_max_bytes: 1000,
};
const packageEntries = ['game', 'screenshots', 'dossier.json'];

function inventoryTree(dir: string, enforceGameCaps = false) {
  if (!lstatSync(dir).isDirectory()) throw new Error(`${dir} must be a directory`);
  let entries = 0;
  let files = 0;
  let bytes = 0;

  function visit(folder: string) {
    for (const name of readdirSync(folder)) {
      const path = join(folder, name);
      const stat = lstatSync(path);
      entries++;
      if (enforceGameCaps && entries > caps.game_max_files) {
        throw new Error('game/ exceeds the 993-entry limit (files and directories)');
      }
      if (stat.isDirectory()) {
        visit(path);
      } else if (stat.isFile()) {
        files++;
        bytes += stat.size;
        if (enforceGameCaps && bytes > caps.game_max_bytes) throw new Error('game/ exceeds 48 MiB');
      } else {
        throw new Error(`Only regular files and directories can be packaged: ${path}`);
      }
    }
  }

  visit(dir);
  return { entries, files, bytes };
}

function validateEntryPage(path: string) {
  const stat = lstatSync(path);
  if (!stat.isFile()) throw new Error('game/index.html must be a regular file');
  if (stat.size > 1024 * 1024) throw new Error('game/index.html exceeds 1 MiB');
  const html = readFileSync(path, 'utf8');
  const remote = html.match(/https?:\/\/[^\s"'<>]*/i);
  if (remote) throw new Error(`game/index.html contains an HTTP(S) URL: ${remote[0]}`);

  for (const { type, text } of htmlFacts(html).scripts) {
    if (type && !/^(?:module|(?:text|application)\/(?:java|ecma)script)$/.test(type)) continue;
    const specifiers = [...sourceImports(text)];
    for (const match of text.matchAll(/\bimport\s*\(\s*(['"`])([^'"`\r\n]+)\1\s*[,)]/g)) {
      if (!match[2].includes('${')) specifiers.push(match[2]);
    }
    for (const specifier of specifiers) {
      if (!/^(?:\.{1,2}\/|\/|[a-z][a-z\d+.-]*:)/i.test(specifier)) {
        throw new Error(`game/index.html contains a bare import specifier: ${JSON.stringify(specifier)}`);
      }
    }
  }
}

function overlaps(a: string, b: string) {
  const contains = (parent: string, child: string) => {
    const delta = relative(parent, child);
    return delta !== '..' && !delta.startsWith('..' + sep) && !isAbsolute(delta);
  };
  return contains(a, b) || contains(b, a);
}

function validateOutputDirectory(out: string) {
  // Walk back to the nearest existing directory so symlink aliases are checked
  // before mkdir can create anything inside the source tree.
  let ancestor = out;
  while (!lstatSync(ancestor, { throwIfNoEntry: false })) ancestor = resolve(ancestor, '..');
  const canonical = resolve(realpathSync(ancestor), relative(ancestor, out));
  if (!lstatSync(realpathSync(ancestor)).isDirectory()) {
    throw new Error(`MAKEFUN_OUTPUT_DIR must identify a directory: ${out}`);
  }
  for (const name of packageEntries) {
    const source = join(realpathSync(here), name);
    if (overlaps(canonical, source) || overlaps(join(canonical, name), source)) {
      throw new Error(`MAKEFUN_OUTPUT_DIR overlaps repository path ${source}`);
    }
  }
}

function publishPackage(stage: string, out: string) {
  const backup = join(stage, 'previous');
  mkdirSync(backup);
  const moved: string[] = [];
  const installed: string[] = [];
  try {
    for (const name of packageEntries) {
      const target = join(out, name);
      if (lstatSync(target, { throwIfNoEntry: false })) {
        renameSync(target, join(backup, name));
        moved.push(name);
      }
    }
    for (const name of packageEntries) {
      renameSync(join(stage, name), join(out, name));
      installed.push(name);
    }
  } catch (error) {
    for (const name of installed.reverse()) renameSync(join(out, name), join(stage, name));
    for (const name of moved.reverse()) renameSync(join(backup, name), join(out, name));
    throw error;
  }
  rmSync(backup, { recursive: true });
}

function run() {
  if (process.argv.length !== 2) throw new Error('Usage: node main.ts (no arguments)');
  const destination = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
  if (!destination.trim()) throw new Error('MAKEFUN_OUTPUT_DIR must be a nonblank directory path');
  const out = resolve(destination);
  validateOutputDirectory(out);

  const game = join(here, 'game');
  const screenshots = join(here, 'screenshots');
  const gameInventory = inventoryTree(game, true);
  validateEntryPage(join(game, 'index.html'));
  const screenshotInventory = inventoryTree(screenshots);

  mkdirSync(out, { recursive: true });
  const stage = join(out, '.marbella-staging');
  try {
    mkdirSync(stage);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EEXIST') {
      throw new Error(`Another package is running or left a staging directory at ${stage}`);
    }
    throw error;
  }
  try {
    cpSync(game, join(stage, 'game'), { recursive: true });
    cpSync(screenshots, join(stage, 'screenshots'), { recursive: true });
    writeFileSync(join(stage, 'dossier.json'), buildDossier(stage, caps));
    publishPackage(stage, out);
  } finally {
    // Preserve any previous output that could not be restored.
    const backup = join(stage, 'previous');
    if (!lstatSync(backup, { throwIfNoEntry: false }) || readdirSync(backup).length === 0) {
      rmSync(stage, { recursive: true });
    }
  }
  console.log(JSON.stringify({
    output: out,
    game: gameInventory,
    screenshots: screenshotInventory,
    'dossier.json': { files: 1 },
    totalFiles: gameInventory.files + screenshotInventory.files + 1,
  }));
}

try {
  run();
} catch (error) {
  console.error(`Marbella Run packaging failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}

'use strict';
// node publicar.js "o que mudou"   -> "upar": manda a sala para o GitHub e atualiza todo mundo.
//  - mudou só apps/ (ou docs/preview): todo mundo recebe em segundos, sem reinstalar.
//  - mudou a casca (main.js, preload.js, sync.js, ui/, package.json): sobe a versão sozinho, o GitHub
//    gera o instalador (Actions, ~3 min) e a galeria de cada um se reinstala sozinha. Mesmo link de download.
// O .git fica FORA da sala (~/.galeria-git) para o GameForge não sincronizar isso com os outros.
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const env = { ...process.env, GIT_DIR: path.join(os.homedir(), '.galeria-git'), GIT_WORK_TREE: __dirname };
const git = (...a) => execFileSync('git', a, { cwd: __dirname, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] }).trim();
const msg = process.argv.slice(2).find(a => !a.startsWith('--')) || 'atualização';
const force = process.argv.includes('--instalador'); // força instalador novo mesmo sem mudar a casca

git('add', '-A');
if (git('status', '--porcelain')) git('commit', '-m', msg);

let last = '';
try { last = git('describe', '--tags', '--abbrev=0'); } catch { /* ainda sem tag */ }
const shellChanged = force || !last || git('diff', '--name-only', last, 'HEAD').split('\n')
  .some(f => /^(main|preload|sync)\.js$|^ui\/|^package\.json$/.test(f));

if (!shellChanged) {
  git('push', 'origin', 'HEAD:main');
  console.log('Publicado. Os apps se atualizam em todos os PCs em segundos.');
} else {
  const pkgFile = path.join(__dirname, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgFile, 'utf8'));
  const v = pkg.version.split('.').map(Number);
  v[2]++;
  pkg.version = v.join('.');
  fs.writeFileSync(pkgFile, JSON.stringify(pkg, null, 2) + '\n');
  git('add', '-A');
  git('commit', '-m', `v${pkg.version}: ${msg}`);
  git('tag', `v${pkg.version}`);
  git('push', 'origin', 'HEAD:main', `v${pkg.version}`);
  console.log(`Publicado como v${pkg.version}. O instalador novo fica pronto em ~3 min e a galeria se atualiza sozinha.`);
}

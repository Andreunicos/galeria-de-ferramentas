'use strict';
// node publicar.js "o que mudou"   -> manda a sala para o GitHub.
// Mudou só algo em apps/: todo mundo recebe em segundos, sem tag.
// Mudou a casca (main.js, ui/…): suba a "version" no package.json, rode isto e depois: node publicar.js --tag
// O .git fica FORA da sala (~/.galeria-git) para o GameForge não sincronizar isso com os outros.
const { execFileSync } = require('child_process');
const os = require('os');
const path = require('path');

const env = { ...process.env, GIT_DIR: path.join(os.homedir(), '.galeria-git'), GIT_WORK_TREE: __dirname };
const git = (...a) => execFileSync('git', a, { cwd: __dirname, env, stdio: 'inherit' });

if (process.argv[2] === '--tag') {
  const tag = 'v' + require('./package.json').version;
  git('tag', tag);
  git('push', 'origin', tag); // dispara o build do instalador no GitHub Actions
} else {
  git('add', '-A');
  try { git('commit', '-m', process.argv[2] || 'atualização'); } catch { console.log('nada novo para publicar'); }
  git('push', 'origin', 'HEAD:main');
}

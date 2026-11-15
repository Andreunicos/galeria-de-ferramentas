'use strict';
// Baixa de apps/ do GitHub só o que mudou (compara o sha git de cada arquivo) e apaga o que sumiu.
// Usa a API de blobs (sem cache de CDN: a atualização aparece na hora). Sem token: 60 consultas/h por IP.
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const gitSha = buf => crypto.createHash('sha1').update(`blob ${buf.length}\0`).update(buf).digest('hex');

async function get(url) {
  const r = await fetch(url, { headers: { 'User-Agent': 'galeria-de-ferramentas', Accept: 'application/vnd.github+json' } });
  if (!r.ok) throw new Error(r.status === 403 ? 'limite do GitHub atingido, tente em alguns minutos' : `GitHub respondeu ${r.status}`);
  return r.json();
}

async function localFiles(dir, rel = '') {
  const out = new Map();
  for (const e of await fs.readdir(path.join(dir, rel), { withFileTypes: true }).catch(() => [])) {
    const r = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) for (const [k, v] of await localFiles(dir, r)) out.set(k, v);
    else out.set(r, gitSha(await fs.readFile(path.join(dir, r))));
  }
  return out;
}

// Devolve os ids dos apps que mudaram (novo, alterado ou removido).
async function sync(repo, branch, dir) {
  const t = await get(`https://api.github.com/repos/${repo}/git/trees/${branch}?recursive=1`);
  if (t.truncated) throw new Error('repositório grande demais para sincronizar');
  const remote = new Map(t.tree.filter(x => x.type === 'blob' && x.path.startsWith('apps/')).map(x => [x.path.slice(5), x.sha]));
  const local = await localFiles(dir);
  const changed = new Set();

  for (const [rel, sha] of remote) {
    if (local.get(rel) === sha) continue;
    const b = await get(`https://api.github.com/repos/${repo}/git/blobs/${sha}`);
    const dest = path.join(dir, rel);
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.writeFile(dest + '.part', Buffer.from(b.content, 'base64')); // só aparece completo
    await fs.rename(dest + '.part', dest);
    changed.add(rel.split('/')[0]);
  }
  for (const rel of local.keys()) {
    if (remote.has(rel)) continue;
    await fs.rm(path.join(dir, rel), { force: true });
    changed.add(rel.split('/')[0]);
  }
  return [...changed];
}

module.exports = { sync, gitSha };

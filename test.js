'use strict';
// npm test — sync (GitHub simulado) + conversão real do Conversor WAV com o ffmpeg.
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { sync, gitSha } = require('./sync');

(async () => {
  assert.strictEqual(gitSha(Buffer.from('hello\n')), 'ce013625030ba8dba906f756967f9e9ca394464a');

  // GitHub falso: 2 arquivos em apps/ e 1 fora (tem que ser ignorado)
  const files = { 'apps/a/app.json': '{"name":"A"}', 'apps/a/x.txt': 'v1', 'README.md': 'x' };
  const tree = () => ({ truncated: false, tree: Object.entries(files).map(([p, c]) => ({ type: 'blob', path: p, sha: gitSha(Buffer.from(c)) })) });
  global.fetch = async url => {
    const blob = Object.values(files).find(c => url.endsWith(gitSha(Buffer.from(c))));
    const body = url.includes('/git/trees/') ? tree() : { content: Buffer.from(blob).toString('base64') };
    return { ok: true, status: 200, json: async () => body };
  };
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'galeria-'));
  assert.deepStrictEqual((await sync('o/r', 'main', dir)).sort(), ['a']);
  assert.strictEqual(fs.readFileSync(path.join(dir, 'a/x.txt'), 'utf8'), 'v1');
  assert.deepStrictEqual(await sync('o/r', 'main', dir), []);          // nada mudou
  files['apps/a/x.txt'] = 'v2';
  assert.deepStrictEqual(await sync('o/r', 'main', dir), ['a']);       // alterado
  assert.strictEqual(fs.readFileSync(path.join(dir, 'a/x.txt'), 'utf8'), 'v2');
  delete files['apps/a/x.txt'];
  assert.deepStrictEqual(await sync('o/r', 'main', dir), ['a']);       // removido
  assert.ok(!fs.existsSync(path.join(dir, 'a/x.txt')));

  // conversão real: mp3 gerado pelo ffmpeg -> WAV 16-bit 44.1 kHz
  const ffmpegPath = require('ffmpeg-static');
  const { execFileSync } = require('child_process');
  const src = path.join(dir, 'tom.mp3');
  execFileSync(ffmpegPath, ['-loglevel', 'error', '-f', 'lavfi', '-i', 'sine=d=0.5', src]);
  const b = require('./apps/conversor-wav/backend.js')({ ffmpegPath });
  const r = await b.convert({ src, rel: 'tom.mp3', outRoot: null, presetId: '16bit-44k', tagged: false, trash: false });
  assert.strictEqual(r.status, 'ok');
  const wav = fs.readFileSync(r.out);
  assert.strictEqual(wav.toString('latin1', 0, 4), 'RIFF');
  assert.strictEqual(wav.readUInt32LE(24), 44100);
  assert.strictEqual((await b.convert({ src, rel: 'tom.mp3', outRoot: null, presetId: '16bit-44k', tagged: false })).status, 'skipped');
  assert.strictEqual((await b.expand([dir])).length, 1); // o .wav não conta como "para converter"

  fs.rmSync(dir, { recursive: true, force: true });
  console.log('ok');
})().catch(e => { console.error(e); process.exit(1); });

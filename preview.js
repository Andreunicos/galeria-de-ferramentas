'use strict';
// Faz o navegador (preview do GameForge) fingir ser o app: define window.galeria.
// Sem backend: o que depende de arquivos/ffmpeg só funciona no app instalado.
// Lista de apps = apps/apps.json (lista de nomes de pasta; mantenha em dia ao criar um app).
const NO_BACKEND = () => Promise.reject(new Error('Só funciona no app instalado (o preview não tem backend).'));

if (!document.getElementById('grid')) {
  // página sem a grade da galeria = um app aberto no iframe (o próprio preview também roda em iframe)
  window.galeria = { call: NO_BACKEND, setBusy() {}, pathsFromFiles: () => [] };
} else {
  const handlers = { status: [], apps: [], nav: [] };
  const emit = (ch, p) => handlers[ch].forEach(cb => cb(p));
  const listApps = async () => {
    const ids = await (await fetch('apps/apps.json')).json();
    const apps = [];
    for (const id of ids) {
      try { apps.push({ ...(await (await fetch(`apps/${id}/app.json`)).json()), id }); } catch { /* app.json faltando: some da lista */ }
    }
    return apps;
  };

  window.galeria = {
    version: async () => '(preview)',
    apps: listApps,
    status: async () => ({ state: 'dev' }),
    check: async () => emit('apps', await listApps()),
    install: async () => {},
    on: (ch, cb) => handlers[ch].push(cb),
    async open(id) {
      const app = (await listApps()).find(a => a.id === id);
      if (!app) return;
      // injeta preview.js no app (que lá dentro define o galeria sem backend) e aponta a base para a pasta dele
      const html = await (await fetch(`apps/${id}/index.html`)).text();
      const inject = `<base href="${new URL(`apps/${id}/`, location.href)}"><script src="${new URL('preview.js', location.href)}"></script>`;
      const f = document.createElement('iframe');
      f.id = 'frame';
      f.srcdoc = html.replace(/<head[^>]*>/i, m => m + inject);
      document.body.appendChild(f);
      emit('nav', app);
    },
    async home() { document.getElementById('frame')?.remove(); emit('nav', null); },
  };
}

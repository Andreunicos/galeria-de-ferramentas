'use strict';
// API única para a casca da galeria e para os apps (window.galeria).
const { contextBridge, ipcRenderer, webUtils } = require('electron');
const inv = (ch, ...a) => ipcRenderer.invoke(ch, ...a);

contextBridge.exposeInMainWorld('galeria', {
  // casca
  version: () => inv('g:version'),
  apps: () => inv('g:apps'),
  status: () => inv('g:status'),
  open: id => inv('g:open', id),
  home: () => inv('g:home'),
  check: () => inv('g:check'),
  install: () => inv('g:install'),
  on: (ch, cb) => ipcRenderer.on(ch, (_e, p) => cb(p)), // canais: status, apps, nav
  // apps
  call: (name, ...args) => inv('app:call', name, ...args), // chama uma função do backend.js do app
  setBusy: b => ipcRenderer.send('g:busy', !!b), // há trabalho em andamento: não reinicia para atualizar
  pathsFromFiles: files => [...files].map(f => webUtils.getPathForFile(f)), // arrastar e soltar
});

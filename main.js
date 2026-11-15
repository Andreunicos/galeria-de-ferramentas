'use strict';
const { app, BrowserWindow, WebContentsView, Menu, dialog, ipcMain, nativeTheme, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');
const { sync } = require('./sync');

const cfg = require('./package.json').galeria;
const HEADER = 52; // altura da barra da galeria (ui/ui.css); o app aberto ocupa o resto
const dev = !app.isPackaged;
const webPrefs = { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true };

let win = null, view = null, openId = null;
let busy = false, status = { state: 'idle' }, appsChanged = [], syncError = '';
let appsDir;
const owners = new Map();   // id do webContents -> id do app (quem pode chamar o backend)
const backends = new Map(); // id do app -> funções do backend.js

if (!app.requestSingleInstanceLock()) app.quit();
app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });

// ---------- apps ----------
// dev: usa ./apps direto (sem sincronizar, para não apagar o que você está editando).
// instalado: cópia em AppData; começa com a que veio no instalador e depois sincroniza com o GitHub.
function prepareApps() {
  appsDir = dev ? path.join(__dirname, 'apps') : path.join(app.getPath('userData'), 'apps');
  if (!dev && !fs.existsSync(appsDir)) fs.cpSync(path.join(process.resourcesPath, 'apps'), appsDir, { recursive: true });
}

function listApps() {
  return fs.readdirSync(appsDir, { withFileTypes: true }).filter(d => d.isDirectory()).flatMap(d => {
    try { return [{ ...JSON.parse(fs.readFileSync(path.join(appsDir, d.name, 'app.json'), 'utf8')), id: d.name }]; }
    catch { return []; } // pasta sem app.json (ex.: sobrou vazia) não aparece
  }).sort((a, b) => (a.order ?? 99) - (b.order ?? 99) || a.name.localeCompare(b.name));
}

function backendFor(id) {
  if (!backends.has(id)) {
    const a = listApps().find(x => x.id === id);
    const file = a && a.backend && path.resolve(appsDir, id, a.backend);
    if (file && !file.startsWith(path.join(appsDir, id) + path.sep)) throw new Error('backend fora da pasta do app');
    const ffmpeg = require('ffmpeg-static').replace('app.asar', 'app.asar.unpacked');
    backends.set(id, file ? require(file)({ dialog, shell, win, ffmpegPath: ffmpeg, appDir: path.join(appsDir, id) }) : null);
  }
  return backends.get(id);
}

function openApp(id) {
  if (!listApps().some(a => a.id === id)) return;
  closeApp();
  view = new WebContentsView({ webPreferences: webPrefs });
  openId = id;
  owners.set(view.webContents.id, id);
  win.contentView.addChildView(view);
  layout();
  const wc = view.webContents;
  wc.setWindowOpenHandler(({ url }) => { if (/^https?:/.test(url)) shell.openExternal(url); return { action: 'deny' }; });
  wc.on('will-navigate', e => e.preventDefault());
  wc.loadFile(path.join(appsDir, id, 'index.html'));
  send('nav', listApps().find(a => a.id === id));
}

function closeApp() {
  if (!view) return;
  owners.delete(view.webContents.id);
  win.contentView.removeChildView(view);
  view.webContents.close();
  view = openId = null;
  busy = false;
  send('nav', null);
}

function layout() {
  if (!view || !win) return;
  const [width, height] = win.getContentSize();
  view.setBounds({ x: 0, y: HEADER, width, height: height - HEADER });
}

// ---------- janela ----------
function createWindow() {
  win = new BrowserWindow({
    width: 1040, height: 800, minWidth: 720, minHeight: 560,
    title: 'Galeria de Ferramentas',
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#14161a' : '#f6f7f9',
    webPreferences: webPrefs,
  });
  win.loadFile(path.join(__dirname, 'ui', 'index.html'));
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', e => e.preventDefault());
  win.on('resize', layout);
  win.on('closed', () => { win = null; });
  win.webContents.once('did-finish-load', () => setTimeout(check, 800));
}

const send = (ch, p) => { if (win && !win.isDestroyed()) win.webContents.send(ch, p); };
const setStatus = s => { status = s; send('status', s); };

// ---------- atualização: apps (GitHub, na hora) + a própria galeria (GitHub Releases) ----------
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;
autoUpdater.on('update-not-available', () => setStatus(syncError ? { state: 'error', message: syncError } : { state: 'uptodate', apps: appsChanged }));
autoUpdater.on('update-available', i => setStatus({ state: 'downloading', version: i.version, percent: 0 }));
autoUpdater.on('download-progress', p => setStatus({ state: 'downloading', version: status.version, percent: Math.round(p.percent) }));
autoUpdater.on('update-downloaded', i => {
  setStatus({ state: 'ready', version: i.version });
  if (!busy) setTimeout(() => autoUpdater.quitAndInstall(true, true), 2500); // nada em andamento: reinicia sozinho
});
autoUpdater.on('error', e => setStatus({ state: 'error', message: String((e && e.message) || e).split('\n')[0] }));

async function check() {
  if (['checking', 'downloading', 'ready'].includes(status.state)) return;
  setStatus({ state: 'checking' });
  appsChanged = []; syncError = '';
  if (dev) return setStatus({ state: 'dev' });
  try { appsChanged = await sync(cfg.repo, cfg.branch, appsDir); }
  catch (e) { syncError = e.message; }
  if (appsChanged.length) {
    for (const id of appsChanged) backends.delete(id);
    for (const k of Object.keys(require.cache)) if (k.startsWith(appsDir)) delete require.cache[k];
    send('apps', listApps());
    if (openId && appsChanged.includes(openId)) {
      if (!listApps().some(a => a.id === openId)) closeApp();
      else if (!busy) view.webContents.reloadIgnoringCache();
    }
  }
  try { await autoUpdater.checkForUpdates(); } catch { /* o evento 'error' já avisa a interface */ }
}

// ---------- IPC ----------
ipcMain.handle('g:version', () => app.getVersion());
ipcMain.handle('g:apps', () => listApps());
ipcMain.handle('g:status', () => status);
ipcMain.handle('g:open', (_e, id) => openApp(id));
ipcMain.handle('g:home', () => closeApp());
ipcMain.handle('g:check', () => check());
ipcMain.handle('g:install', () => autoUpdater.quitAndInstall(true, true));
ipcMain.on('g:busy', (e, b) => { if (owners.has(e.sender.id)) busy = !!b; });

ipcMain.handle('app:call', (e, name, ...args) => {
  const id = owners.get(e.sender.id);
  if (!id) throw new Error('só apps abertos na galeria podem chamar o backend');
  const fn = (backendFor(id) || {})[name];
  if (typeof fn !== 'function') throw new Error(`${id}: função "${name}" não existe no backend`);
  return fn(...args);
});

app.setAppUserModelId('com.andreunicos.galeria');
app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  prepareApps();
  createWindow();
  setInterval(check, 30 * 60 * 1000); // enquanto aberta, confere de 30 em 30 min
});
app.on('window-all-closed', () => app.quit());

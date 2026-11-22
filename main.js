const { app, BrowserWindow, ipcMain, Menu, screen, nativeImage } = require('electron');
const path = require('path');

// Mettre à jour le site Vercel = mettre à jour le logiciel.
const APP_URL = 'https://notif-kappa.vercel.app';

if (!app.requestSingleInstanceLock()) app.quit();
let win, role = 'login', big = false, folded = false;

const OPEN = { agent: [320, 370], admin: [440, 600] }; // fenêtre ouverte
const BUB = [72, 72];                                  // bulle
const BIG = [1100, 760], LOGIN = [420, 600];

// how : 'dock' = coin haut-droit · 'center' = centré · 'anchor' = garde le coin haut-droit actuel
function layout(how) {
  if (!win) return;
  let [w, h] = role === 'login' ? LOGIN : (role === 'admin' && big && !folded) ? BIG : folded ? BUB : OPEN[role];
  const b = win.getBounds(), a = screen.getDisplayMatching(b).workArea;
  let x, y;
  if (how === 'center') { x = a.x + (a.width - w) / 2; y = a.y + (a.height - h) / 2; }
  else if (how === 'anchor') { x = b.x + b.width - w; y = b.y; }
  else { x = a.x + a.width - w - 20; y = a.y + 40; }
  x = Math.max(a.x, Math.min(x, a.x + a.width - w));
  y = Math.max(a.y, Math.min(y, a.y + a.height - h));
  win.setBounds({ x: Math.round(x), y: Math.round(y), width: w, height: h });
}

function create() {
  Menu.setApplicationMenu(null);
  win = new BrowserWindow({
    width: LOGIN[0], height: LOGIN[1], frame: false, transparent: true, hasShadow: false, resizable: false,
    backgroundColor: '#00000000', alwaysOnTop: true, icon: path.join(__dirname, 'icon.png'),
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true,
      backgroundThrottling: false, autoplayPolicy: 'no-user-gesture-required' }
  });
  win.setAlwaysOnTop(true, 'screen-saver'); // toujours épinglé
  layout('center');
  win.loadURL(APP_URL);

  win.webContents.on('did-fail-load', (_e, _c, _d, _u, isMainFrame) => {
    if (isMainFrame) win.loadFile('index.html'); // secours hors ligne
  });
  win.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith(APP_URL) && !url.startsWith('file:')) e.preventDefault();
  });
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('before-input-event', (e, i) => {
    if (i.type !== 'keyDown') return;
    if (i.key === 'F5' || (i.control && i.key.toLowerCase() === 'r')) { win.webContents.reloadIgnoringCache(); e.preventDefault(); }
    else if (i.key === 'F12' || (i.control && i.shift && i.key.toLowerCase() === 'i')) win.webContents.toggleDevTools();
  });
}

ipcMain.on('mode', (_, m) => {
  role = m; big = false; folded = false;
  layout(role === 'login' ? 'center' : 'dock');
  win.setAlwaysOnTop(true, 'screen-saver');
});
ipcMain.handle('fold', (_, f) => { folded = f === undefined ? !folded : !!f; layout('anchor'); return folded; });
ipcMain.on('size', () => { big = !big; folded = false; layout(big ? 'center' : 'dock'); });
ipcMain.on('drag', (_, dx, dy) => { // déplacement de la bulle à la souris
  const [x, y] = win.getPosition();
  win.setPosition(Math.round(x + dx), Math.round(y + dy));
});
ipcMain.on('close', () => app.quit());
ipcMain.on('unread', (_, n, icon) => { // pastille rouge avec le nombre sur l'icône de la barre des tâches
  if (!win) return;
  try { win.setOverlayIcon(n && icon ? nativeImage.createFromDataURL(icon) : null, n ? n + ' alerte(s) non lue(s)' : ''); } catch (e) {}
  if (n > 0 && !win.isFocused()) win.flashFrame(true);
});
app.on('second-instance', () => { if (win) { win.restore(); win.focus(); } });
app.whenReady().then(create);
app.on('window-all-closed', () => app.quit());

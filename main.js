const { app, BrowserWindow, ipcMain, Menu, screen } = require('electron');
const path = require('path');

// >>> Mets ici l'adresse de ton site Vercel. Mettre à jour le site = mettre à jour le logiciel.
const APP_URL = 'https://notif-kappa.vercel.app';

if (!app.requestSingleInstanceLock()) app.quit();
let win, pinned = true, big = false;

function dock(w, h) { // coin haut-droit de l'écran
  const { workArea: a } = screen.getPrimaryDisplay();
  win.setMinimumSize(300, 300);
  win.setSize(w, h);
  win.setPosition(a.x + a.width - w - 20, a.y + 40);
}

function create() {
  Menu.setApplicationMenu(null);
  win = new BrowserWindow({
    width: 420, height: 620, autoHideMenuBar: true, alwaysOnTop: true,
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true }
  });
  win.setAlwaysOnTop(true, 'screen-saver');
  win.loadURL(APP_URL);

  // Pas d'internet ou site inaccessible : version embarquée en secours
  win.webContents.on('did-fail-load', (_e, _c, _d, _u, isMainFrame) => {
    if (isMainFrame) win.loadFile('index.html');
  });
  // La fenêtre ne peut pas quitter ton site
  win.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith(APP_URL) && !url.startsWith('file:')) e.preventDefault();
  });
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  // F12 ou Ctrl+Maj+I : console de diagnostic
  win.webContents.on('before-input-event', (e, i) => {
    if (i.type === 'keyDown' && (i.key === 'F12' || (i.control && i.shift && i.key.toLowerCase() === 'i'))) win.webContents.toggleDevTools();
  });
  // F5 / Ctrl+R = recharger (récupère la dernière version du site)
  win.webContents.on('before-input-event', (e, i) => {
    if (i.type === 'keyDown' && (i.key === 'F5' || (i.control && i.key.toLowerCase() === 'r'))) {
      win.webContents.reloadIgnoringCache(); e.preventDefault();
    }
  });
}

ipcMain.on('mode', (_, m) => {
  if (!win) return;
  win.setResizable(true);
  if (m === 'agent') dock(340, 440);
  else if (m === 'admin') { big = false; dock(480, 680); }
  else { win.setSize(420, 620); win.center(); }
  win.setAlwaysOnTop(pinned, 'screen-saver');
});
ipcMain.handle('pin', () => { pinned = !pinned; win.setAlwaysOnTop(pinned, 'screen-saver'); return pinned; });
ipcMain.on('size', () => { // admin : compact <-> grand
  big = !big;
  if (big) { win.setSize(1100, 760); win.center(); } else dock(480, 680);
});
ipcMain.on('unread', (_, n) => {
  app.setBadgeCount(n);
  if (n > 0 && win && !win.isFocused()) win.flashFrame(true);
});
app.on('second-instance', () => { if (win) { win.restore(); win.focus(); } });
app.whenReady().then(create);
app.on('window-all-closed', () => app.quit());

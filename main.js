const { app, BrowserWindow, ipcMain, Menu, screen, nativeImage } = require('electron');
const path = require('path');

// Mettre à jour le site Vercel = mettre à jour le logiciel.
const APP_URL = 'https://notif-kappa.vercel.app';

if (!app.requestSingleInstanceLock()) app.quit();
let win, role = 'login', big = false, folded = false;

// Tailles de la zone de contenu : [largeur, hauteur]
const OPEN = { agent: [320, 370], admin: [440, 600] };
const FOLD = [320, 72];
const BIG = [1100, 760];

function layout() {
  if (!win) return;
  win.setResizable(true);
  win.setMinimumSize(200, 40);
  if (role === 'login') { win.setContentSize(420, 600); win.center(); return; }
  if (role === 'admin' && big && !folded) { win.setContentSize(...BIG); win.center(); return; }
  const [w, h] = folded ? FOLD : OPEN[role];
  win.setContentSize(w, h);
  const { workArea: a } = screen.getPrimaryDisplay(); // coin haut-droit de l'écran
  const [ow] = win.getSize();
  win.setPosition(a.x + a.width - ow - 20, a.y + 40);
}

function create() {
  Menu.setApplicationMenu(null);
  win = new BrowserWindow({
    width: 420, height: 640, autoHideMenuBar: true, alwaysOnTop: true, minimizable: false, maximizable: false,
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, backgroundThrottling: false, autoplayPolicy: 'no-user-gesture-required' }
  });
  win.setAlwaysOnTop(true, 'screen-saver');
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
  layout();
  win.setAlwaysOnTop(true, 'screen-saver'); // toujours épinglé, sans option pour le retirer
});
ipcMain.handle('fold', () => { folded = !folded; layout(); return folded; });
ipcMain.on('size', () => { big = !big; folded = false; layout(); });
ipcMain.on('unread', (_, n, icon) => { // pastille rouge avec le nombre sur l'icône de la barre des tâches
  if (!win) return;
  try { win.setOverlayIcon(n && icon ? nativeImage.createFromDataURL(icon) : null, n ? n + ' alerte(s) non lue(s)' : ''); } catch (e) {}
  if (n > 0 && !win.isFocused()) win.flashFrame(true);
});
app.on('second-instance', () => { if (win) { win.restore(); win.focus(); } });
app.whenReady().then(create);
app.on('window-all-closed', () => app.quit());

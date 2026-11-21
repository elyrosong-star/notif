const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
if (!app.requestSingleInstanceLock()) app.quit();
let win;
function create() {
  Menu.setApplicationMenu(null);
  win = new BrowserWindow({
    width: 420, height: 620, autoHideMenuBar: true, icon: path.join(__dirname, 'icon.png'),
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true }
  });
  win.loadFile('index.html');
}
// Agent = petit flottant toujours au premier plan ; admin = grande fenêtre
ipcMain.on('mode', (_, m) => {
  if (!win) return;
  if (m === 'agent') {
    win.setResizable(true); win.setMinimumSize(300, 300);
    win.setSize(340, 440); win.setAlwaysOnTop(true, 'screen-saver');
    const { workArea } = require('electron').screen.getPrimaryDisplay();
    win.setPosition(workArea.x + workArea.width - 360, workArea.y + 40);
  } else if (m === 'admin') {
    win.setAlwaysOnTop(false); win.setMinimumSize(700, 500); win.setSize(1100, 760); win.center();
  } else { win.setAlwaysOnTop(false); win.setSize(420, 620); win.center(); }
});
ipcMain.on('unread', (_, n) => {
  app.setBadgeCount(n);
  if (n > 0 && win && !win.isFocused()) win.flashFrame(true);
});
app.on('second-instance', () => { if (win) { win.restore(); win.focus(); } });
app.whenReady().then(create);
app.on('window-all-closed', () => app.quit());

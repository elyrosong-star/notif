const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('native', {
  mode: m => ipcRenderer.send('mode', m),
  unread: (n, icon) => ipcRenderer.send('unread', n, icon),
  fold: () => ipcRenderer.invoke('fold'),
  size: () => ipcRenderer.send('size')
});

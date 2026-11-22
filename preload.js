const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('native', {
  mode: m => ipcRenderer.send('mode', m),
  unread: (n, icon) => ipcRenderer.send('unread', n, icon),
  fold: f => ipcRenderer.invoke('fold', f),
  size: () => ipcRenderer.send('size'),
  drag: (dx, dy) => ipcRenderer.send('drag', dx, dy),
  close: () => ipcRenderer.send('close')
});

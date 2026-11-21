const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('native', {
  mode: m => ipcRenderer.send('mode', m),
  unread: n => ipcRenderer.send('unread', n),
  pin: () => ipcRenderer.invoke('pin'),
  size: () => ipcRenderer.send('size')
});

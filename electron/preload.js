const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onUpdateAvailable: (callback) => ipcRenderer.on('update-available', (_event, info) => callback(info)),
  onUpdateDownloaded: (callback) => ipcRenderer.on('update-downloaded', (_event, info) => callback(info)),
  onDownloadProgress: (callback) => ipcRenderer.on('download-progress', (_event, progressObj) => callback(progressObj)),
  onUpdateError: (callback) => ipcRenderer.on('update-error', (_event, message) => callback(message)),
  startDownload: () => ipcRenderer.send('start-download'),
  quitAndInstall: () => ipcRenderer.send('quit-and-install'),
  setAutostart: (enable) => ipcRenderer.invoke('set-autostart', enable),
  getAutostart: () => ipcRenderer.invoke('get-autostart'),
  setTheme: (isDark) => ipcRenderer.send('set-theme', isDark)
});

const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  // Auth
  loginSuccess: (session) => ipcRenderer.invoke('login-success', session),
  getSession:   ()        => ipcRenderer.invoke('get-session'),

  // Utils
  openUrl: (url) => ipcRenderer.invoke('open-url', url),

  // Check if running inside Electron
  isElectron: true,
})
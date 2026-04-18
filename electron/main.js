import { app, BrowserWindow, ipcMain } from 'electron';
import pkg from 'electron-updater';
const { autoUpdater } = pkg;
import path from 'path';
import http from 'http';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure paths for the bundled app
process.env.DB_FILE_PATH = path.join(app.getPath('userData'), 'db.json');
process.env.APP_ROOT = path.join(__dirname, '..');
process.env.NODE_ENV = app.isPackaged ? 'production' : process.env.NODE_ENV || 'development';

let mainWindow;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`[Browser Console] ${message} (${sourceId}:${line})`);
  });

  try {
    if (process.env.NODE_ENV === 'development') {
      mainWindow.loadURL('http://localhost:3000');
    } else {
      const serverPath = path.join(__dirname, '../dist-server/server.js');
      const fileUrl = pathToFileURL(serverPath).href;
      await import(fileUrl);
      
      // Chờ cho server express thực sự khởi động thay vì dùng setTimeout cứng
      const checkServer = () => {
        http.get('http://localhost:3000', (res) => {
          if (res.statusCode === 200) {
            mainWindow.loadURL('http://localhost:3000');
          } else {
            setTimeout(checkServer, 200);
          }
        }).on('error', () => {
          setTimeout(checkServer, 200);
        });
      };
      
      checkServer();
    }
  } catch (error) {
    console.error('Failed to start server or load window:', error);
  }
}

app.whenReady().then(() => {
  createWindow();

  // Cấu hình Auto Updater
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('update-available', (info) => {
    if (mainWindow) mainWindow.webContents.send('update-available', info);
  });

  autoUpdater.on('download-progress', (progressObj) => {
    if (mainWindow) mainWindow.webContents.send('download-progress', progressObj);
  });

  autoUpdater.on('update-downloaded', (info) => {
    if (mainWindow) mainWindow.webContents.send('update-downloaded', info);
  });

  ipcMain.on('quit-and-install', () => {
    autoUpdater.quitAndInstall();
  });

  // Kiểm tra cập nhật ngầm
  autoUpdater.checkForUpdatesAndNotify();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

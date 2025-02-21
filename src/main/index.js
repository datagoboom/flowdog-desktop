// main/index.js
import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { exec } from 'child_process'
import { promisify } from 'util'
import { storageHandlers } from './handlers/storageHandlers'
import database from './services/database'
import { createTray } from './tray'
import axios from 'axios'
import { initializeStorage } from './handlers/storageHandlers'
import { setupDashboardHandlers } from './handlers/dashboardHandlers'
import { authHandlers } from './handlers/authHandlers'

const execAsync = promisify(exec)

let mainWindow = null
let tray = null

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: true,
    frame: true,
    // dev tools 
    devTools: true,
    autoHideMenuBar: false,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
      allowRunningInsecureContent: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  // Restrict navigation to prevent phishing
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const allowedOrigins = ['http://localhost:5173']; // Add your allowed origins
    const parsedUrl = new URL(url);
    if (!allowedOrigins.includes(parsedUrl.origin)) {
      event.preventDefault();
    }
  });

  // Safe external link handling
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:') || url.startsWith('http:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // Handle window close to minimize to tray instead
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault()
      mainWindow.hide()
    }
    return false
  })

  // Create tray icon
  tray = createTray(mainWindow)

  // Register IPC handlers
  storageHandlers.registerHandlers(ipcMain)
}

function registerHandlers() {
  // Register each storage handler
  Object.entries(storageHandlers).forEach(([channel, handler]) => {
    ipcMain.handle(channel, handler)
  })

  // Register auth handlers
  Object.entries(authHandlers).forEach(([channel, handler]) => {
    ipcMain.handle(channel, handler)
  })

  // Register dashboard handlers
  setupDashboardHandlers(ipcMain)
}

// Add HTTP request handler
ipcMain.handle('nodes.http.request', async (event, config) => {
  try {
    const response = await axios(config);
    return {
      success: true,
      data: {
        status: response.status,
        headers: response.headers,
        data: response.data
      }
    };
  } catch (error) {
    return {
      success: false,
      error: {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      }
    };
  }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // Initialize database first
  try {
    await database.initialize()
    console.log('Database initialized successfully')
  } catch (error) {
    console.error('Failed to initialize database:', error)
    app.quit()
    return
  }

  // Initialize storage and register handlers
  await initializeStorage()
  registerHandlers()

  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // Add window control handlers
  ipcMain.on('minimize-window', () => {
    BrowserWindow.getFocusedWindow()?.minimize()
  })

  ipcMain.on('maximize-window', () => {
    const win = BrowserWindow.getFocusedWindow()
    if (win?.isMaximized()) {
      win.unmaximize()
    } else {
      win?.maximize()
    }
  })

  ipcMain.on('close-window', () => {
    BrowserWindow.getFocusedWindow()?.close()
  })

  createWindow()

  // Handle quit through dock icon (macOS)
  app.on('before-quit', () => {
    app.isQuitting = true
  })

  // Handle window activation
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    } else {
      mainWindow.show()
    }
  })
})

// Don't quit when all windows are closed (stay in tray)
app.on('window-all-closed', (e) => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.

// main/index.js
import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import fs from 'fs/promises'
import path from 'path'
import database from './services/databaseService'
import { createTray } from './tray'
import { flowHandlers } from './handlers/flowHandlers'
import { connectionHandlers } from './handlers/connectionHandlers'
import { integrationHandlers } from './handlers/integrationHandlers'
import { nodeTemplateHandlers } from './handlers/nodeTemplateHandlers'
import { dashboardHandlers } from './handlers/dashboardHandlers'
import { authHandlers } from './handlers/authHandlers'
import { databaseHandlers } from './handlers/databaseHandlers'
import { dialogHandlers } from './handlers/dialogHandlers'
import { nodeHandlers } from './handlers/nodeHandlers'
import { envHandlers } from './handlers/envHandlers'

let mainWindow = null
let tray = null

// Initialize storage directories
async function initializeStorage() {
  const userDataPath = app.getPath('userData')
  const dirs = ['flows', 'integrations', 'nodeTemplates', 'dashboards', 'environments']
  
  for (const dir of dirs) {
    try {
      await fs.mkdir(path.join(userDataPath, dir), { recursive: true })
    } catch (error) {
      console.error(`Failed to create ${dir} directory:`, error)
    }
  }
}

function registerHandlers() {
  const handlers = {
    ...flowHandlers,
    ...connectionHandlers,
    ...integrationHandlers,
    ...nodeTemplateHandlers,
    ...dashboardHandlers,
    ...authHandlers,
    ...databaseHandlers,
    ...dialogHandlers,
    ...nodeHandlers,
    ...envHandlers
  };

  Object.entries(handlers).forEach(([channel, handler]) => {
    console.log(`Registering handler for channel: ${channel}`);
    ipcMain.handle(channel, handler);
  });
}

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
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  try {
    // Initialize database
    await database.initialize()
    console.log('Database initialized successfully')

    // Initialize storage directories
    await initializeStorage()
    console.log('Storage directories initialized successfully')

    // Register IPC handlers
    registerHandlers()
    console.log('IPC handlers registered successfully')

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
  } catch (error) {
    console.error('Failed to initialize application:', error)
    app.quit()
  }
})

// Don't quit when all windows are closed (stay in tray)
app.on('window-all-closed', (e) => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.

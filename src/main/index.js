import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { exec } from 'child_process'
import { promisify } from 'util'
import { nodeHandlers } from './handlers/nodeHandlers'
import { storageHandlers } from './handlers/storageHandlers'
import { databaseHandlers } from './handlers/databaseHandlers'
import database from './services/database'
import { dialogHandlers } from './handlers/dialogHandlers'

const execAsync = promisify(exec)

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
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
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function registerHandlers(ipcMain) {
  // Register handlers in specific order to ensure proper overrides
  const handlers = {
    ...nodeHandlers,
    ...storageHandlers,
    ...dialogHandlers,
    ...databaseHandlers
  }

  Object.entries(handlers).forEach(([channel, handler]) => {
    console.log(`Registering handler for channel: ${channel}`);
    // Modify handler registration to properly handle IPC arguments
    ipcMain.handle(channel, (event, ...args) => handler(...args));
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // Initialize database first
  try {
    await database.initialize();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    app.quit();
    return;
  }

  // Register all handlers
  registerHandlers(ipcMain)

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

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.

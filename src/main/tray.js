import { Tray, Menu, app, nativeImage } from 'electron';
import path from 'path';

let tray = null;

export function createTray(mainWindow) {
  try {
    // Get the correct path based on whether we're in dev or production
    const iconPath = app.isPackaged
      ? path.join(process.resourcesPath, 'assets', 'tray.png')
      : path.join(app.getAppPath(), 'src', 'renderer', 'assets', 'tray.png');

    // Create tray with icon
    tray = new Tray(iconPath);

    // Create context menu
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show FlowDog',
        click: () => {
          mainWindow.show();
        }
      },
      {
        label: 'New Workflow',
        click: () => {
          mainWindow.show();
          mainWindow.webContents.send('menu-new-workflow');
        }
      },
      { type: 'separator' },
      {
        label: 'Recent Flows',
        submenu: [] // We can populate this dynamically
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => {
          app.quit();
        }
      }
    ]);

    // Set tooltip and context menu
    tray.setToolTip('FlowDog');
    tray.setContextMenu(contextMenu);

    // Handle click (show/hide window)
    tray.on('click', () => {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
      }
    });

    return tray;
  } catch (error) {
    console.error('Failed to create tray:', error);
    throw error;
  }
}

export function updateTrayMenu(recentFlows = []) {
  if (!tray) return;

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show FlowDog',
      click: () => {
        mainWindow.show();
      }
    },
    {
      label: 'New Workflow',
      click: () => {
        mainWindow.show();
        mainWindow.webContents.send('menu-new-workflow');
      }
    },
    { type: 'separator' },
    {
      label: 'Recent Flows',
      submenu: recentFlows.map(flow => ({
        label: flow.name,
        click: () => {
          mainWindow.show();
          mainWindow.webContents.send('menu-open-flow', flow.id);
        }
      }))
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
} 
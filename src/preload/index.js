import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  invoke: async (channel, ...args) => {
    return await ipcRenderer.invoke(channel, ...args)
  },
  send: (channel, ...args) => {
    ipcRenderer.send(channel, ...args)
  },
  on: (channel, func) => {
    ipcRenderer.on(channel, (_, ...args) => func(...args))
  },
  off: (channel, func) => {
    ipcRenderer.removeListener(channel, func)
  },
  storage: {
    testConnection: async (config) => {
      // Log the config before sending
      console.log('Preload: sending test config:', {
        ...config,
        password: config?.password ? '[REDACTED]' : undefined
      });

      // Ensure we're sending a plain object
      const plainConfig = {
        type: config.type,
        ...(config.type === 'sqlite' 
          ? { file: config.file }
          : {
              host: config.host,
              port: config.port,
              database: config.database,
              username: config.username,
              password: config.password,
              ssl: config.ssl
            })
      };

      console.log('Preload: sending plain config:', {
        ...plainConfig,
        password: plainConfig?.password ? '[REDACTED]' : undefined
      });

      const result = await ipcRenderer.invoke('storage.test-connection', plainConfig);
      
      console.log('Preload: received result:', result);
      return result;
    },
    saveConnection: (data) => ipcRenderer.invoke('storage.save-connection', data),
    listConnections: () => ipcRenderer.invoke('storage.list-connections'),
    deleteConnection: (id) => ipcRenderer.invoke('storage.delete-connection', id),
    saveFlow: (data) => ipcRenderer.invoke('storage.save-flow', data),
    openFlow: (id) => ipcRenderer.invoke('storage.open-flow', id),
    saveEnv: (data) => ipcRenderer.invoke('storage.save-env', data),
    openEnv: (id) => ipcRenderer.invoke('storage.open-env', id),
    listEnv: () => ipcRenderer.invoke('storage.list-env')
  },
  dialog: {
    openFile: (options) => ipcRenderer.invoke('dialog.open-file', options),
    saveFile: (options) => ipcRenderer.invoke('dialog.save-file', options)
  },
  database: {
    executeQuery: (connectionId, query, parameters) => 
      ipcRenderer.invoke('database.execute-query', connectionId, query, parameters)
  },
  nodes: {
    database: {
      query: (connectionId, query, parameters) => 
        ipcRenderer.invoke('nodes.database.query', connectionId, query, parameters)
    }
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'api', {
    invoke: (channel, data) => {
      // whitelist channels
      const validChannels = [
        'storage.save-flow',
        'storage.open-flow',
        'storage.list-flows',
        'storage.delete-flow',
        // ... other valid channels ...
      ];
      if (validChannels.includes(channel)) {
        return ipcRenderer.invoke(channel, data);
      }
    },
    // ... other methods ...
  }
);

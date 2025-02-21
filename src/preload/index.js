// preload/index.js
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

      const result = await ipcRenderer.invoke('storage.test-connection', plainConfig);
      
      return result;
    },
    saveConnection: (data) => ipcRenderer.invoke('storage.save-connection', data),
    listConnections: () => ipcRenderer.invoke('storage.list-connections'),
    deleteConnection: (id) => ipcRenderer.invoke('storage.delete-connection', id),
    saveFlow: (data) => ipcRenderer.invoke('storage.save-flow', data),
    openFlow: (id) => ipcRenderer.invoke('storage.open-flow', id),
    saveEnv: (data) => ipcRenderer.invoke('storage.save-env', data),
    openEnv: (id) => ipcRenderer.invoke('storage.open-env', id),
    listEnv: () => ipcRenderer.invoke('storage.list-env'),
    saveIntegration: (data) => ipcRenderer.invoke('storage.save-integration', data),
    getIntegration: (id) => ipcRenderer.invoke('storage.get-integration', id),
    listIntegrations: () => ipcRenderer.invoke('storage.list-integrations'),
    saveNodeTemplate: async (template) => {
      console.log('Preload: Saving node template:', template);
      return await ipcRenderer.invoke('storage.save-node-template', template);
    },
    listNodeTemplates: async () => {
      const result = await ipcRenderer.invoke('storage.list-node-templates');
      return result;
    },
    deleteNodeTemplate: async (templateId) => {
      console.log('Preload: Deleting node template:', templateId);
      return await ipcRenderer.invoke('storage.delete-node-template', templateId);
    }
  },
  dialog: {
    openFile: (options) => ipcRenderer.invoke('dialog.open-file', options),
    saveFile: (options) => ipcRenderer.invoke('dialog.save-file', options)
  },
  database: {
    executeQuery: (connectionId, query, parameters) => 
      ipcRenderer.invoke('database.execute-query', connectionId, query, parameters)
  },
  dashboard: {
    save: (data) => ipcRenderer.invoke('dashboard.save', data),
    list: () => ipcRenderer.invoke('dashboard.list'),
    delete: (id) => ipcRenderer.invoke('dashboard.delete', id),
    get: (id) => ipcRenderer.invoke('dashboard.get', id)
  },
  nodes: {
    database: {
      query: (connectionId, query, parameters) => 
        ipcRenderer.invoke('nodes.database.query', connectionId, query, parameters)
    },
    http: {
      request: (config) => ipcRenderer.invoke('nodes.http.request', config)
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

// Use a more unique namespace to avoid conflicts
contextBridge.exposeInMainWorld(
  'electronAPI',
  {
    // Command operations
    executeCommand: (command, options) => 
      ipcRenderer.invoke('nodes.command.execute', command, options),

    // File operations
    saveFile: (path, content) => 
      ipcRenderer.invoke('nodes.file.save', path, content),
    openFile: (path) => 
      ipcRenderer.invoke('nodes.file.open', path),

    // HTTP operations
    httpRequest: (config) => 
      ipcRenderer.invoke('nodes.http.request', config),

    // Flow storage operations
    saveFlow: (flowData) => 
      ipcRenderer.invoke('storage.save-flow', flowData),
    openFlow: (flowId) => 
      ipcRenderer.invoke('storage.open-flow', flowId),
    listFlows: () => 
      ipcRenderer.invoke('storage.list-flows'),
    deleteFlow: (flowId) => 
      ipcRenderer.invoke('storage.delete-flow', flowId),

    // Connection operations
    saveConnection: (connectionData) => 
      ipcRenderer.invoke('storage.save-connection', connectionData),
    listConnections: () => 
      ipcRenderer.invoke('storage.list-connections'),
    deleteConnection: (connectionId) => 
      ipcRenderer.invoke('storage.delete-connection', connectionId),
    testConnection: (connectionData) => 
      ipcRenderer.invoke('storage.test-connection', connectionData),

    // Integration operations
    saveIntegration: (data) => 
      ipcRenderer.invoke('storage.save-integration', data),
    getIntegration: (id) => 
      ipcRenderer.invoke('storage.get-integration', id),
    listIntegrations: () => 
      ipcRenderer.invoke('storage.list-integrations'),
    deleteIntegration: (id) => 
      ipcRenderer.invoke('storage.delete-integration', id),

    // Dashboard operations with validation
    listDashboards: () => {
      const result = ipcRenderer.invoke('dashboard.list');
      return result;
    },
    saveDashboard: (data) => {
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid data format');
      }
      return ipcRenderer.invoke('dashboard.save', data);
    },
    deleteDashboard: (id) => {
      if (typeof id !== 'string' || !/^[a-zA-Z0-9-_]+$/.test(id)) {
        throw new Error('Invalid dashboard ID');
      }
      return ipcRenderer.invoke('dashboard.delete', id);
    },
    getDashboard: (id) => {
      if (typeof id !== 'string' || !/^[a-zA-Z0-9-_]+$/.test(id)) {
        throw new Error('Invalid dashboard ID');
      }
      return ipcRenderer.invoke('dashboard.get', id);
    }
  }
);

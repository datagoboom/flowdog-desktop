import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Whitelist of valid channels for security
const validChannels = [
  // Auth endpoints
  'auth:check-setup',
  'auth:setup',
  'auth:login',

  // Flow endpoints
  'flow:save',
  'flow:get',
  'flow:list',
  'flow:delete',

  // Connection endpoints
  'connection:test',
  'connection:save',
  'connection:list',
  'connection:delete',

  // Environment endpoints
  'env:save',
  'env:get',
  'env:list',

  // Integration endpoints
  'integration:save',
  'integration:get',
  'integration:list',
  'integration:delete',

  // Node template endpoints
  'node-template:save',
  'node-template:list',
  'node-template:delete',

  // Dialog endpoints
  'dialog:open',
  'dialog:save',

  // Database endpoints
  'database:execute',

  // Dashboard endpoints
  'dashboard:save',
  'dashboard:list',
  'dashboard:delete',
  'dashboard:get',

  // Node operation endpoints
  'nodes:database:query',
  'nodes:http:request'
];

// Validation utilities
const validateId = (id) => {
  if (typeof id !== 'string' || !/^[a-zA-Z0-9-_]+$/.test(id)) {
    throw new Error('Invalid ID format');
  }
  return id;
};

const validateObject = (obj) => {
  if (!obj || typeof obj !== 'object') {
    throw new Error('Invalid data format');
  }
  return obj;
};

// Main API definition
const api = {
  invoke: async (channel, ...args) => {
    if (!validChannels.includes(channel)) {
      throw new Error(`Invalid channel: ${channel}`);
    }
    return await ipcRenderer.invoke(channel, ...args);
  },

  // Event handling
  on: (channel, func) => {
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (_, ...args) => func(...args));
    }
  },
  
  off: (channel, func) => {
    if (validChannels.includes(channel)) {
      ipcRenderer.removeListener(channel, func);
    }
  },

  // Grouped API endpoints
  connection: {
    test: async (config) => {
      console.log('Testing connection:', { ...config, password: '[REDACTED]' });
      return await api.invoke('connection:test', validateObject(config));
    },
    save: (data) => api.invoke('connection:save', validateObject(data)),
    list: () => api.invoke('connection:list'),
    delete: (id) => api.invoke('connection:delete', validateId(id))
  },

  flow: {
    save: (data) => api.invoke('flow:save', validateObject(data)),
    get: (id) => api.invoke('flow:get', validateId(id)),
    list: () => api.invoke('flow:list'),
    delete: (id) => api.invoke('flow:delete', validateId(id))
  },

  env: {
    save: (data) => api.invoke('env:save', validateObject(data)),
    get: (id) => api.invoke('env:get', validateId(id)),
    list: () => api.invoke('env:list')
  },

  integration: {
    save: (data) => api.invoke('integration:save', validateObject(data)),
    get: (id) => api.invoke('integration:get', validateId(id)),
    list: () => api.invoke('integration:list'),
    delete: (id) => api.invoke('integration:delete', validateId(id))
  },

  nodeTemplate: {
    save: async (template) => {
      console.log('Saving node template:', template);
      return await api.invoke('node-template:save', validateObject(template));
    },
    list: () => api.invoke('node-template:list'),
    delete: (id) => api.invoke('node-template:delete', validateId(id))
  },

  dialog: {
    openFile: (options) => api.invoke('dialog:open', options),
    saveFile: (options) => api.invoke('dialog:save', options)
  },

  database: {
    executeQuery: (connectionId, query, parameters) => 
      api.invoke('database:execute', validateId(connectionId), query, parameters)
  },

  dashboard: {
    save: (data) => api.invoke('dashboard:save', validateObject(data)),
    list: () => api.invoke('dashboard:list'),
    delete: (id) => api.invoke('dashboard:delete', validateId(id)),
    get: (id) => api.invoke('dashboard:get', validateId(id))
  },

  nodes: {
    database: {
      query: (connectionId, query, parameters) => 
        api.invoke('nodes:database:query', validateId(connectionId), query, parameters)
    },
    http: {
      request: (config) => api.invoke('nodes:http:request', validateObject(config))
    }
  },

  auth: {
    checkSetup: () => api.invoke('auth:check-setup'),
    setup: async (setupData) => {
      console.log('Setup:', setupData);
      return await api.invoke('auth:setup', validateObject(setupData));
    },
    login: (credentials) => api.invoke('auth:login', validateObject(credentials))
  }
};

// Expose APIs based on context isolation
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI);
    contextBridge.exposeInMainWorld('api', api);
  } catch (error) {
    console.error(error);
  }
} else {
  window.electron = electronAPI;
  window.api = api;
}
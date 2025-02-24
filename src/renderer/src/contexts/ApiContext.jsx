import React, { createContext, useContext, useCallback } from 'react';

const ApiContext = createContext(null);

export function ApiProvider({ children }) {
  // Nodes API
  const executeCommand = useCallback(async (command, options) => {
    return await window.api.invoke('nodes:command:execute', command, options);
  }, []);

  // Add httpRequest function
  const httpRequest = useCallback(async (config) => {
    return await window.api.invoke('nodes:http:request', config);
  }, []);

  // Storage API for flows
  const saveFlow = useCallback(async (flowData) => {
    console.log('ApiContext saveFlow called with:', flowData);
    return await window.api.invoke('flow:save', flowData);
  }, []);

  const listFlows = useCallback(async () => {
    return await window.api.invoke('flow:list');
  }, []);

  const getFlow = useCallback(async (flowId) => {
    return await window.api.invoke('flow:get', flowId);
  }, []);

  const deleteFlow = useCallback(async (flowId) => {
    return await window.api.invoke('flow:delete', flowId);
  }, []);

  // Connection API
  const saveConnection = useCallback(async (connectionData) => {
    console.log('ApiContext: sending connection data:', {
      ...connectionData,
      config: {
        ...connectionData.config,
        password: connectionData.config?.password ? '[REDACTED]' : undefined
      }
    });
    return await window.api.invoke('connection:save', connectionData);
  }, []);

  const listConnections = useCallback(async () => {
    return await window.api.invoke('connection:list');
  }, []);

  const deleteConnection = useCallback(async (connectionId) => {
    return await window.api.invoke('connection:delete', connectionId);
  }, []);

  const testConnection = useCallback(async (connectionData) => {
    return await window.api.invoke('connection:test', connectionData);
  }, []);

  // Integration API
  const saveIntegration = useCallback(async (data) => {
    return await window.api.invoke('integration:save', data);
  }, []);   

  const getIntegration = useCallback(async (id) => {
    return await window.api.invoke('integration:get', id);
  }, []);

  const listIntegrations = useCallback(async () => {
    return await window.api.invoke('integration:list');
  }, []);

  const deleteIntegration = useCallback(async (id) => {
    return await window.api.invoke('integration:delete', id);
  }, []);

  // Dashboard API
  const saveDashboard = useCallback(async (dashboard) => {
    return await window.api.invoke('dashboard:save', dashboard);
  }, []);

  const deleteDashboard = useCallback(async (dashboardId) => {
    return await window.api.invoke('dashboard:delete', dashboardId);
  }, []);

  const getDashboard = useCallback(async (dashboardId) => {
    return await window.api.invoke('dashboard:get', dashboardId);
  }, []);

  const listDashboards = useCallback(async () => {
    return await window.api.invoke('dashboard:list');
  }, []);

  // Node Template API
  const saveNodeTemplate = useCallback(async (template) => {
    return await window.api.invoke('node-template:save', template);
  }, []);

  const listNodeTemplates = useCallback(async () => {
    return await window.api.invoke('node-template:list');
  }, []);

  const deleteNodeTemplate = useCallback(async (templateId) => {
    return await window.api.invoke('node-template:delete', templateId);
  }, []);

  // Auth API
  const checkSetup = useCallback(async () => {
    return await window.api.invoke('auth:check-setup');
  }, []);

  const setup = useCallback(async (setupData) => {
    return await window.api.invoke('auth:setup', setupData);
  }, []);

  const login = useCallback(async (credentials) => {
    return await window.api.invoke('auth:login', credentials);
  }, []);

  // User API
  const getUserInfo = useCallback(async () => {
    return await window.api.invoke('user:get-info');
  }, []);

  const updateUserInfo = useCallback(async (data) => {
    return await window.api.invoke('user:update-info', data);
  }, []);

  const changeUserPassword = useCallback(async (data) => {
    return await window.api.invoke('user:change-password', data);
  }, []);

  const getUserSettings = useCallback(async () => {
    return await window.api.invoke('user:get-settings');
  }, []);

  const updateUserSettings = useCallback(async (config) => {
    return await window.api.invoke('user:update-settings', config);
  }, []);

  // Environment API
  const saveEnvironment = useCallback(async (data) => {
    return await window.api.invoke('env:save', data);
  }, []);

  const getEnvironment = useCallback(async (id) => {
    return await window.api.invoke('env:get', id);
  }, []);

  const listEnvironments = useCallback(async () => {
    return await window.api.invoke('env:list');
  }, []);

  const deleteEnvironment = useCallback(async (id) => {
    return await window.api.invoke('env:delete', id);
  }, []);

  const updateEnvironmentVariables = useCallback(async (id, variables) => {
    return await window.api.invoke('env:save', {
      id,
      variables
    });
  }, []);

  // File API
  const saveFile = useCallback(async (path, content, options) => {
    return await window.api.invoke('nodes:file:save', path, content, options);
  }, []);

  const openFile = useCallback(async (path) => {
    return await window.api.invoke('nodes:file:open', path);
  }, []);

  const appendFile = useCallback(async (path, content, options) => {
    return await window.api.invoke('nodes:file:append', path, content, options);
  }, []);

  const deleteFile = useCallback(async (path) => {
    return await window.api.invoke('nodes:file:delete', path);
  }, []);

  const selectDirectory = useCallback(async (options) => {
    return await window.api.invoke('nodes:file:select-directory', options);
  }, []);

  const api = {
    nodes: {
      command: {
        execute: executeCommand
      },
      http: {
        request: httpRequest
      }
    },
    flow: {
      save: saveFlow,
      get: getFlow,
      list: listFlows,
      delete: deleteFlow
    },
    connection: {
      save: saveConnection,
      list: listConnections,
      delete: deleteConnection,
      test: testConnection
    },
    integration: {
      save: saveIntegration,
      get: getIntegration,
      list: listIntegrations,
      delete: deleteIntegration
    },
    nodeTemplate: {
      save: saveNodeTemplate,
      list: listNodeTemplates,
      delete: deleteNodeTemplate
    },
    dashboard: {
      save: saveDashboard,
      delete: deleteDashboard,
      get: getDashboard,
      list: listDashboards
    },
    auth: {
      checkSetup: checkSetup,
      setup: setup,
      login: login
    },
    user: {
      getInfo: getUserInfo,
      updateInfo: updateUserInfo,
      changePassword: changeUserPassword,
      getSettings: getUserSettings,
      updateSettings: updateUserSettings
    },
    env: {
      save: saveEnvironment,
      get: getEnvironment,
      list: listEnvironments,
      delete: deleteEnvironment,
      updateVariables: updateEnvironmentVariables
    },
    file: {
      save: saveFile,
      open: openFile,
      append: appendFile,
      delete: deleteFile,
      selectDirectory: selectDirectory
    }
  };

  return (
    <ApiContext.Provider value={api}>
      {children}
    </ApiContext.Provider>
  );
}

export function useApi() {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
} 
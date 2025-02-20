import React, { createContext, useContext, useCallback } from 'react';

const ApiContext = createContext();

export function ApiProvider({ children }) {
  // Nodes API
  const executeCommand = useCallback(async (command, options) => {
    return await window.api.invoke('nodes.command.execute', command, options);
  }, []);

  const saveFile = useCallback(async (path, content) => {
    return await window.api.invoke('nodes.file.save', path, content);
  }, []);

  const openFile = useCallback(async (path) => {
    return await window.api.invoke('nodes.file.open', path);
  }, []);

  // Add httpRequest function
  const httpRequest = useCallback(async (config) => {
    return await window.api.invoke('nodes.http.request', config);
  }, []);

  // Storage API for flows
  const saveFlow = useCallback(async (flowData) => {
    console.log('ApiContext saveFlow called with:', flowData);
    return await window.api.invoke('storage.save-flow', flowData);
  }, []);

  const openFlow = useCallback(async (flowId) => {
    return await window.api.invoke('storage.open-flow', flowId);
  }, []);

  const listFlows = useCallback(async () => {
    return await window.api.invoke('storage.list-flows');
  }, []);

  const deleteFlow = useCallback(async (flowId) => {
    return await window.api.invoke('storage.delete-flow', flowId);
  }, []);

  // Database Connections API
  const saveConnection = useCallback(async (connectionData) => {
    console.log('ApiContext: sending connection data:', {
      ...connectionData,
      config: {
        ...connectionData.config,
        password: connectionData.config?.password ? '[REDACTED]' : undefined
      }
    });
    return await window.api.invoke('storage.save-connection', connectionData);
  }, []);

  const listConnections = useCallback(async () => {
    return await window.api.invoke('storage.list-connections');
  }, []);

  const deleteConnection = useCallback(async (connectionId) => {
    return await window.api.invoke('storage.delete-connection', connectionId);
  }, []);

  const testConnection = useCallback(async (connectionData) => {
    return await window.api.invoke('storage.test-connection', connectionData);
  }, []);

  // Integration API
  const saveIntegration = useCallback(async (data) => {
    return await window.api.invoke('storage.save-integration', data);
  }, []);   

  const getIntegration = useCallback(async (id) => {
    return await window.api.invoke('storage.get-integration', id);
  }, []);

  const listIntegrations = useCallback(async () => {
    return await window.api.invoke('storage.list-integrations');
  }, []);

  const deleteIntegration = useCallback(async (id) => {
    return await window.api.invoke('storage.delete-integration', id);
  }, []);

  const api = {
    nodes: {
      command: {
        execute: executeCommand
      },
      file: {
        save: saveFile,
        open: openFile
      },
      http: {
        request: httpRequest
      }
    },
    storage: {
      saveFlow,
      openFlow,
      listFlows,
      deleteFlow,
      saveConnection,
      listConnections,
      deleteConnection,
      testConnection,
      saveIntegration,
      getIntegration,
      listIntegrations,
      deleteIntegration
    },
    auth: {
      checkSetup: () => window.api.invoke('auth.check-setup'),
      
      setup: ({ username, password }) => 
        window.api.invoke('auth.setup', { username, password }),
      
      login: ({ username, password }) => 
        window.api.invoke('auth.login', { username, password }),
      
      updateUser: (userData) => 
        window.api.invoke('auth.update-user', userData)
    },
    http: {
      request: async (requestData) => {
        console.log('Making HTTP request through API context:', requestData);
        return await window.api.http.request(requestData);
      }
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
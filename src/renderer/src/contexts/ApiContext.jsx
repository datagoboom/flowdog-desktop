import React, { createContext, useContext, useCallback } from 'react';

const ApiContext = createContext(null);

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

  // Storage API for flows
  const saveFlow = useCallback(async (flowData) => {
    console.log('ApiContext saveFlow called with:', flowData); // Debug log
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

  const api = {
    nodes: {
      command: {
        execute: executeCommand
      },
      file: {
        save: saveFile,
        open: openFile
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
      testConnection
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
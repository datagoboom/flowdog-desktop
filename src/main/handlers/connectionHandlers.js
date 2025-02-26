import database from '../services/databaseService';
import { responder } from '../utils/helpers';

export const connectionHandlers = {
  'connection:save': async (event, connectionData) => {
    try {
      console.log('Connection handler: saving connection:', {
        ...connectionData,
        config: connectionData.config ? {
          ...connectionData.config,
          password: connectionData.config.password ? '[REDACTED]' : undefined
        } : undefined
      });

      if (!connectionData?.name || !connectionData?.type) {
        throw new Error('Connection name and type are required');
      }

      const result = await database.saveConnection(connectionData);
      if (!result.success) {
        throw new Error(result.error || 'Failed to save connection');
      }

      return responder(true, result.id);
    } catch (error) {
      console.error('Failed to save connection:', error);
      return responder(false, null, error.message);
    }
  },

  'connection:list': async (event) => {
    try {
      const connections = await database.listConnections();
      return responder(true, connections);
    } catch (error) {
      console.error('Failed to list connections:', error);
      return responder(false, null, error.message);
    }
  },

  'connection:delete': async (event, id) => {
    try {
      await database.deleteConnection(id);
      return responder(true);
    } catch (error) {
      console.error('Failed to delete connection:', error);
      return responder(false, null, error.message);
    }
  },

  'connection:test': async (event, config) => {
    try {
      console.log('Testing connection:', {
        type: config?.type,
        ...config,
        password: config?.password ? '[REDACTED]' : undefined
      });

      if (!config?.type) {
        throw new Error(`Database type is required. Received: ${JSON.stringify(config)}`);
      }

      const result = await database.testConnection(config);
      return responder(result.success, result.data, result.error);
    } catch (error) {
      console.error('Connection test failed:', error);
      return responder(false, null, error.message);
    }
  }
}; 
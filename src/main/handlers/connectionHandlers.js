import database from '../services/databaseService';

export const connectionHandlers = {
  'connection:save': async (_, connectionData) => {
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

      return { success: true, data: result.id };
    } catch (error) {
      console.error('Failed to save connection:', error);
      return { success: false, error: error.message };
    }
  },

  'connection:list': async () => {
    try {
      const connections = await database.listConnections();
      return { success: true, data: connections };
    } catch (error) {
      console.error('Failed to list connections:', error);
      return { success: false, error: error.message };
    }
  },

  'connection:delete': async (_, id) => {
    try {
      await database.deleteConnection(id);
      return { success: true };
    } catch (error) {
      console.error('Failed to delete connection:', error);
      return { success: false, error: error.message };
    }
  },

  'connection:test': async (_, config) => {
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
      return result;
    } catch (error) {
      console.error('Connection test failed:', error);
      return { success: false, error: error.message };
    }
  }
}; 
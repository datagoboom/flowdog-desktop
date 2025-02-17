import database from '../services/database'
import { v4 as uuidv4 } from 'uuid'
import { randomUUID } from 'crypto'
import { Client } from 'pg'
import mysql from 'mysql2/promise'
import { open } from 'sqlite'
import sqlite3 from 'sqlite3'

export const storageHandlers = {
  'storage.save-flow': async (flowData) => {
    try {
      const id = flowData.id || uuidv4()
      await database.saveFlow({ ...flowData, id })
      return { success: true, data: { id } }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  'storage.open-flow': async (flowId) => {
    try {
      const flow = await database.getFlow(flowId)
      if (!flow) {
        throw new Error('Flow not found')
      }
      return { success: true, data: flow }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  'storage.save-env': async (envData) => {
    try {
      const id = envData.id || uuidv4()
      await database.saveEnv({ ...envData, id })
      return { success: true, data: { id } }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  'storage.open-env': async (envId) => {
    try {
      const env = await database.getEnv(envId)
      if (!env) {
        throw new Error('Environment not found')
      }
      return { success: true, data: env }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  'storage.list-env': async () => {
    try {
      const envs = await database.listEnv()
      return { success: true, data: envs }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  'storage.test-connection': async (event, config) => {
    try {
      // Log the raw input
      console.log('Raw input in main process:', { event, config });
      
      // Log the actual config object
      console.log('Config in main process:', {
        type: config?.type,
        ...config,
        password: config?.password ? '[REDACTED]' : undefined
      });

      // Ensure config is properly structured
      const testConfig = typeof config === 'string' ? JSON.parse(config) : config;

      if (!testConfig?.type) {
        console.error('Missing database type:', testConfig);
        throw new Error(`Database type is required. Received: ${JSON.stringify(testConfig)}`);
      }

      switch (testConfig.type) {
        case 'sqlite': {
          if (!testConfig.file) {
            throw new Error('SQLite database file path is required');
          }

          console.log('Testing SQLite connection:', testConfig.file);
          const db = await open({
            filename: testConfig.file,
            driver: sqlite3.Database
          });
          
          await db.get('SELECT 1');
          await db.close();
          console.log('SQLite connection test successful');
          return { success: true };
        }

        case 'postgres': {
          const client = new Client({
            host: testConfig.host,
            port: parseInt(testConfig.port),
            database: testConfig.database,
            user: testConfig.username,
            password: testConfig.password,
            ssl: testConfig.ssl
          });
          
          await client.connect();
          await client.query('SELECT 1');
          await client.end();
          return { success: true };
        }

        case 'mysql': {
          const connection = await mysql.createConnection({
            host: testConfig.host,
            port: parseInt(testConfig.port),
            database: testConfig.database,
            user: testConfig.username,
            password: testConfig.password,
            ssl: testConfig.ssl
          });
          
          await connection.execute('SELECT 1');
          await connection.end();
          return { success: true };
        }

        default:
          throw new Error(`Unsupported database type: ${testConfig.type}`);
      }
    } catch (error) {
      console.error('Connection test failed in main process:', error);
      return { success: false, error: error.message };
    }
  },

  'storage.save-connection': async (connectionData) => {
    try {
      // Validate input
      if (!connectionData || typeof connectionData !== 'object') {
        console.error('Invalid connection data:', connectionData);
        throw new Error('Invalid connection data format');
      }

      console.log('Storage handler: received connection data:', {
        ...connectionData,
        config: connectionData.config ? {
          ...connectionData.config,
          password: connectionData.config.password ? '[REDACTED]' : undefined
        } : undefined
      });

      // Save to database
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

  'storage.list-connections': async () => {
    try {
      const connections = await database.listConnections();
      return { success: true, data: connections };
    } catch (error) {
      console.error('Failed to list connections:', error);
      return { success: false, error: error.message };
    }
  },

  'storage.delete-connection': async (event, id) => {
    try {
      await database.deleteConnection(id);
      return { success: true };
    } catch (error) {
      console.error('Failed to delete connection:', error);
      return { success: false, error: error.message };
    }
  }
} 
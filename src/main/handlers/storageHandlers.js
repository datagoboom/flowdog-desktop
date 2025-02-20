import database from '../services/database'
import { v4 as uuidv4 } from 'uuid'
import { randomUUID } from 'crypto'
import { Client } from 'pg'
import mysql from 'mysql2/promise'
import { open } from 'sqlite'
import sqlite3 from 'sqlite3'
import { readFile, writeFile, mkdir, readdir, unlink } from 'fs/promises'
import path from 'path'
import { app } from 'electron'
import fs from 'fs/promises'

// Create a flows directory in the app's user data folder
const flowsDir = path.join(app.getPath('userData'), 'flows')
const ensureFlowsDir = async () => {
  try {
    await fs.mkdir(flowsDir, { recursive: true })
  } catch (error) {
    console.error('Failed to create flows directory:', error)
  }
}

// Add to existing storageHandlers object
const nodeTemplatesDir = path.join(app.getPath('userData'), 'nodeTemplates');

const ensureNodeTemplatesDir = async () => {
  try {
    await fs.mkdir(nodeTemplatesDir, { recursive: true });
  } catch (error) {
    console.error('Failed to create node templates directory:', error);
  }
};

export const storageHandlers = {
  'storage.save-flow': async (event, flowData) => {
    try {
      console.log('Main process received flow data:', flowData); // Debug log
      
      await ensureFlowsDir();
      
      // Ensure flowData is an object
      if (!flowData || typeof flowData !== 'object') {
        console.error('Invalid flow data:', flowData); // Debug log
        throw new Error(`Invalid flow data received: ${JSON.stringify(flowData)}`);
      }
      
      // Create a new object with the data
      const flow = {
        id: flowData.id || Date.now().toString(),
        name: flowData.name || 'Untitled Flow',
        description: flowData.description || '',
        nodes: flowData.nodes || [],
        edges: flowData.edges || [],
        timestamp: Date.now()
      };
      
      console.log('Saving flow:', flow); // Debug log
      
      // Save to a JSON file
      const filePath = path.join(flowsDir, `${flow.id}.json`);
      await writeFile(filePath, JSON.stringify(flow, null, 2));
      
      return { success: true, flowId: flow.id };
    } catch (error) {
      console.error('Failed to save flow:', error);
      throw error;
    }
  },

  'storage.list-flows': async (_) => {
    try {
      await ensureFlowsDir()
      
      // Read all JSON files in the flows directory
      const files = await fs.readdir(flowsDir)
      const flows = []
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(flowsDir, file)
          const content = await readFile(filePath, 'utf-8')
          const flowData = JSON.parse(content)
          flows.push({
            id: flowData.id,
            name: flowData.name,
            description: flowData.description,
            timestamp: flowData.timestamp,
            nodes: flowData.nodes,
            edges: flowData.edges
          })
        }
      }
      
      // Sort by timestamp, newest first
      return flows.sort((a, b) => b.timestamp - a.timestamp)
    } catch (error) {
      console.error('Failed to list flows:', error)
      throw error
    }
  },

  'storage.open-flow': async (event, flowId) => {
    try {
      if (!flowId || typeof flowId !== 'string') {
        throw new Error(`Invalid flow ID: ${flowId}`);
      }

      const filePath = path.join(flowsDir, `${flowId}.json`);
      const content = await readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.error('Failed to open flow:', error);
      throw error;
    }
  },

  'storage.delete-flow': async (_, flowId) => {
    try {
      const filePath = path.join(flowsDir, `${flowId}.json`)
      await fs.unlink(filePath)
      return { success: true }
    } catch (error) {
      console.error('Failed to delete flow:', error)
      throw error
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
  },

  'storage.save-node-template': async (event, template) => {
    try {
      await ensureNodeTemplatesDir();
      
      const templateWithId = {
        ...template,
        id: template.id || Date.now().toString(),
        timestamp: Date.now()
      };
      
      const filePath = path.join(nodeTemplatesDir, `${templateWithId.id}.json`);
      await fs.writeFile(filePath, JSON.stringify(templateWithId, null, 2));
      
      return { success: true, templateId: templateWithId.id };
    } catch (error) {
      console.error('Failed to save node template:', error);
      return { success: false, error: error.message };
    }
  },

  'storage.list-node-templates': async () => {
    try {
      await ensureNodeTemplatesDir();
      
      const files = await fs.readdir(nodeTemplatesDir);
      console.log('Template files found:', files);
      
      const templates = [];
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(nodeTemplatesDir, file);
          console.log('Reading template file:', filePath);
          const content = await fs.readFile(filePath, 'utf-8');
          console.log('Template content:', content);
          templates.push(JSON.parse(content));
        }
      }
      
      const sortedTemplates = templates.sort((a, b) => b.timestamp - a.timestamp);
      console.log('Returning templates:', sortedTemplates);
      
      return { 
        success: true, 
        data: sortedTemplates
      };
    } catch (error) {
      console.error('Failed to list node templates:', error);
      return { success: false, error: error.message };
    }
  },

  'storage.delete-node-template': async (event, templateId) => {
    try {
      const filePath = path.join(nodeTemplatesDir, `${templateId}.json`);
      await fs.unlink(filePath);
      return { success: true };
    } catch (error) {
      console.error('Failed to delete node template:', error);
      return { success: false, error: error.message };
    }
  },

  'storage.save-integration': async (_, data) => {
    try {
      const { id, config } = data;
      
      // Get or create integration record
      let integration = await database.models.Integration.findOne({
        where: { id }
      });

      if (integration) {
        integration.config = config; // Config is already encrypted from renderer
        await integration.save();
      } else {
        integration = await database.models.Integration.create({
          id,
          config // Config is already encrypted from renderer
        });
      }

      return {
        success: true,
        data: {
          id: integration.id,
          createdAt: integration.createdAt,
          updatedAt: integration.updatedAt
        }
      };
    } catch (error) {
      console.error('Failed to save integration:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  'storage.get-integration': async (_, id) => {
    try {
      const integration = await database.models.Integration.findOne({
        where: { id }
      });

      return {
        success: true,
        data: integration
      };
    } catch (error) {
      console.error('Failed to get integration:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  'storage.list-integrations': async () => {
    try {
      const integrations = await database.models.Integration.findAll();

      return {
        success: true,
        data: integrations
      };
    } catch (error) {
      console.error('Failed to list integrations:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  'storage.delete-integration': async (_, id) => {
    try {
      await database.deleteIntegration(id);
      return { success: true };
    } catch (error) {
      console.error('Failed to delete integration:', error);
      return { success: false, error: error.message };
    }
  }
}

// Register flow storage handlers
export function registerStorageHandlers(ipcMain, db) {
  // ... existing handlers ...

  // List all saved flows
  ipcMain.handle('storage.list-flows', async () => {
    try {
      const flows = await db.models.Flow.findAll({
        order: [['updatedAt', 'DESC']]
      });
      return flows.map(flow => ({
        id: flow.id,
        name: flow.name,
        description: flow.description,
        timestamp: flow.updatedAt,
        data: flow.data
      }));
    } catch (error) {
      console.error('Failed to list flows:', error);
      throw error;
    }
  });

  // Delete a flow
  ipcMain.handle('storage.delete-flow', async (event, flowId) => {
    try {
      const result = await db.models.Flow.destroy({
        where: { id: flowId }
      });
      return { success: true, deletedCount: result };
    } catch (error) {
      console.error('Failed to delete flow:', error);
      throw error;
    }
  });

  ipcMain.handle('storage.save-integration', async (_, data) => {
    try {
      const { id, config } = data;
      
      // Get or create integration record
      let integration = await db.models.Integration.findOne({
        where: { id }
      });

      if (integration) {
        integration.config = config; // Config is already encrypted from renderer
        await integration.save();
      } else {
        integration = await db.models.Integration.create({
          id,
          config // Config is already encrypted from renderer
        });
      }

      return {
        success: true,
        data: {
          id: integration.id,
          createdAt: integration.createdAt,
          updatedAt: integration.updatedAt
        }
      };
    } catch (error) {
      console.error('Failed to save integration:', error);
      return {
        success: false,
        error: error.message
      };
    }
  });

  ipcMain.handle('storage.get-integration', async (_, id) => {
    try {
      const integration = await db.models.Integration.findOne({
        where: { id }
      });

      return {
        success: true,
        data: integration
      };
    } catch (error) {
      console.error('Failed to get integration:', error);
      return {
        success: false,
        error: error.message
      };
    }
  });

  ipcMain.handle('storage.list-integrations', async () => {
    try {
      const integrations = await db.models.Integration.findAll();

      return {
        success: true,
        data: integrations
      };
    } catch (error) {
      console.error('Failed to list integrations:', error);
      return {
        success: false,
        error: error.message
      };
    }
  });
}

// Add initialization function
export async function initializeStorage() {
  await ensureNodeTemplatesDir();
}

module.exports = {
  registerStorageHandlers
}; 
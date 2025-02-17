import { Client } from 'pg'
import mysql from 'mysql2/promise'
import sqlite3 from 'sqlite3'
import { open } from 'sqlite'
import database from '../services/database'
import { Sequelize, QueryTypes } from 'sequelize'

// Helper to safely escape values based on their type
function escapeValue(value) {
  if (value === null || value === undefined) {
    return 'NULL';
  }
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'boolean') {
    return value ? 1 : 0;
  }
  // Escape strings using Sequelize's escape function
  return `'${value.toString().replace(/'/g, "''")}'`;
}

// Helper to interpolate template with escaped values
function interpolateQuery(query, input = {}) {
  return query.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
    // Navigate the input object using the path
    const value = path.trim().split('.').reduce((obj, key) => obj?.[key], input);
    return escapeValue(value);
  });
}

// Helper to determine query type
function getQueryType(query) {
  const normalizedQuery = query.trim().toLowerCase();
  if (normalizedQuery.startsWith('select') || normalizedQuery === 'show tables') {
    return QueryTypes.SELECT;
  }
  if (normalizedQuery.startsWith('insert')) {
    return QueryTypes.INSERT;
  }
  if (normalizedQuery.startsWith('update')) {
    return QueryTypes.UPDATE;
  }
  if (normalizedQuery.startsWith('delete')) {
    return QueryTypes.DELETE;
  }
  return QueryTypes.RAW;
}

export const databaseHandlers = {
  'storage.test-connection': async (event, config) => {
    try {
      // Log the raw input
      console.log('Testing connection with config:', {
        ...config,
        password: config?.password ? '[REDACTED]' : undefined
      });

      if (!config?.type) {
        throw new Error(`Database type is required. Received: ${JSON.stringify(config)}`);
      }

      switch (config.type) {
        case 'sqlite': {
          if (!config.file) {
            throw new Error('SQLite database file path is required');
          }

          console.log('Testing SQLite connection:', config.file);
          const db = await open({
            filename: config.file,
            driver: sqlite3.Database
          });
          
          await db.get('SELECT 1');
          await db.close();
          console.log('SQLite connection test successful');
          return { success: true };
        }

        case 'postgres': {
          const client = new Client({
            host: config.host,
            port: parseInt(config.port),
            database: config.database,
            user: config.username,
            password: config.password,
            ssl: config.ssl
          });
          
          await client.connect();
          await client.query('SELECT 1');
          await client.end();
          return { success: true };
        }

        case 'mysql': {
          const connection = await mysql.createConnection({
            host: config.host,
            port: parseInt(config.port),
            database: config.database,
            user: config.username,
            password: config.password,
            ssl: config.ssl
          });
          
          await connection.execute('SELECT 1');
          await connection.end();
          return { success: true };
        }

        default:
          throw new Error(`Unsupported database type: ${config.type}`);
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  },

  'storage.save-connection': async (connectionData) => {
    try {
      console.log('Saving connection data:', {
        ...connectionData,
        password: connectionData.password ? '[REDACTED]' : undefined
      })

      await database.saveConnection(connectionData)
      console.log('Connection saved successfully with ID:', connectionData.id)
      
      return { success: true }
    } catch (error) {
      console.error('Failed to save connection:', error)
      return { 
        success: false, 
        error: error.message 
      }
    }
  },

  'storage.list-connections': async () => {
    try {
      const connections = await database.listConnections()
      return { 
        success: true, 
        data: connections 
      }
    } catch (error) {
      return { 
        success: false, 
        error: error.message 
      }
    }
  },

  'storage.delete-connection': async (connectionId) => {
    try {
      await database.deleteConnection(connectionId)
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error.message 
      }
    }
  },

  'dialog.open-file': async (options) => {
    const { dialog } = require('electron')
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openFile'],
        ...options
      })
      
      return { 
        success: !result.canceled, 
        filePath: result.filePaths[0] 
      }
    } catch (error) {
      return { 
        success: false, 
        error: error.message 
      }
    }
  },

  'nodes.database.query': async (params) => {
    try {
      const { connectionId, query, input = {} } = params;

      console.log('Processing query template:', {
        query,
        input: JSON.stringify(input, (key, value) => 
          key === 'password' ? '[REDACTED]' : value
        )
      });

      // Get the connection details
      const connection = await database.getConnection(connectionId);
      if (!connection) {
        throw new Error(`Connection not found: ${connectionId}`);
      }

      // Handle system queries and interpolation
      let finalQuery = query;
      if (query.trim().toLowerCase() === 'show tables') {
        switch (connection.type) {
          case 'sqlite':
            finalQuery = `SELECT name as table_name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`;
            break;
          case 'postgres':
            finalQuery = `SELECT tablename as table_name FROM pg_catalog.pg_tables WHERE schemaname != 'pg_catalog' AND schemaname != 'information_schema'`;
            break;
          case 'mysql':
            finalQuery = 'SHOW TABLES';
            break;
          default:
            throw new Error(`Unsupported database type for system query: ${connection.type}`);
        }
      } else {
        finalQuery = interpolateQuery(query, input);
      }

      console.log('Executing query:', finalQuery);

      // Create Sequelize instance
      let sequelize;
      switch (connection.type) {
        case 'sqlite': {
          sequelize = new Sequelize({
            dialect: 'sqlite',
            storage: connection.config.file,
            logging: console.log
          });
          break;
        }
        case 'postgres': {
          sequelize = new Sequelize({
            dialect: 'postgres',
            host: connection.config.host,
            port: connection.config.port,
            database: connection.config.database,
            username: connection.config.username,
            password: connection.config.password,
            ssl: connection.config.ssl,
            logging: console.log
          });
          break;
        }
        case 'mysql': {
          sequelize = new Sequelize({
            dialect: 'mysql',
            host: connection.config.host,
            port: connection.config.port,
            database: connection.config.database,
            username: connection.config.username,
            password: connection.config.password,
            ssl: connection.config.ssl,
            logging: console.log
          });
          break;
        }
        default:
          throw new Error(`Unsupported database type: ${connection.type}`);
      }

      try {
        // Determine query type and execute
        const queryType = getQueryType(finalQuery);
        console.log('Query type:', queryType);

        // For DDL queries (CREATE, ALTER, DROP), use RAW type
        if (finalQuery.trim().toLowerCase().startsWith('create') ||
            finalQuery.trim().toLowerCase().startsWith('alter') ||
            finalQuery.trim().toLowerCase().startsWith('drop')) {
          await sequelize.query(finalQuery, { type: QueryTypes.RAW });
          return {
            success: true,
            data: {
              rowCount: 0,
              rows: [],
              fields: [],
              message: 'Query executed successfully'
            }
          };
        }

        // For other queries
        const [results, metadata] = await sequelize.query(finalQuery, {
          type: queryType
        });

        // Handle different result types
        if (queryType === QueryTypes.SELECT) {
          return {
            success: true,
            data: {
              rowCount: Array.isArray(results) ? results.length : 1,
              rows: Array.isArray(results) ? results : [results],
              fields: metadata?.fields || []
            }
          };
        } else {
          // For INSERT, UPDATE, DELETE
          return {
            success: true,
            data: {
              rowCount: typeof metadata === 'number' ? metadata : 0,
              rows: [],
              fields: [],
              message: `Affected ${typeof metadata === 'number' ? metadata : 0} rows`
            }
          };
        }
      } finally {
        await sequelize.close();
      }
    } catch (error) {
      console.error('Database query failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Add this function to handle special queries
function getSystemQuery(query, dbType) {
  const normalizedQuery = query.trim().toLowerCase();
  
  if (normalizedQuery === 'show tables') {
    switch (dbType) {
      case 'sqlite':
        return `SELECT name as table_name FROM sqlite_master WHERE type='table'`;
      case 'postgres':
        return `SELECT tablename as table_name FROM pg_catalog.pg_tables WHERE schemaname != 'pg_catalog' AND schemaname != 'information_schema'`;
      case 'mysql':
        return 'SHOW TABLES';
      default:
        throw new Error(`Unsupported database type for system query: ${dbType}`);
    }
  }
  
  return query;
} 
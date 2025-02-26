import database from '../services/databaseService'
import { Sequelize, QueryTypes } from 'sequelize'
import { responder } from '../utils/helpers'

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
  'connection:test': async (_, config) => {
    console.log('Testing connection with config:', {
      ...config,
      password: config.password ? '[REDACTED]' : undefined
    });

    try {
      if (!config?.type) {
        throw new Error('Database type is required');
      }

      const sequelize = new Sequelize({
        dialect: config.type,
        host: config.host,
        port: parseInt(config.port),
        database: config.database,
        username: config.username,
        password: config.password,
        ssl: config.ssl,
        logging: false
      });

      await sequelize.authenticate();
      await sequelize.close();
      
      return { success: true };
    } catch (error) {
      console.error('Connection test failed:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  },

  'connection:save': async (_, connectionData) => {
    try {
      await database.saveConnection(connectionData)
      return { success: true }
    } catch (error) {
      console.error('Failed to save connection:', error)
      return { 
        success: false, 
        error: error.message 
      }
    }
  },

  'connection:list': async () => {
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

  'connection:delete': async (_, connectionId) => {
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

  'database:query': async (params) => {
    try {
      const { connectionId, query, input = {} } = params;

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
  },

  'database:validate': async (event, { connectionId, query }) => {
    try {
      if (!connectionId || !query) {
        throw new Error('Connection ID and query are required');
      }

      // Validate query without executing
      const isValid = await database.validateQuery(connectionId, query);
      return responder(true, { isValid });
    } catch (error) {
      console.error('Query validation failed:', error);
      return responder(false, null, error.message);
    }
  },

  'database:tables': async (event, connectionId) => {
    try {
      if (!connectionId) {
        throw new Error('Connection ID is required');
      }

      const tables = await database.listTables(connectionId);
      return responder(true, tables);
    } catch (error) {
      console.error('Failed to list tables:', error);
      return responder(false, null, error.message);
    }
  },

  'database:columns': async (event, { connectionId, table }) => {
    try {
      if (!connectionId || !table) {
        throw new Error('Connection ID and table name are required');
      }

      const columns = await database.listColumns(connectionId, table);
      return responder(true, columns);
    } catch (error) {
      console.error('Failed to list columns:', error);
      return responder(false, null, error.message);
    }
  },

  'database:schema': async (event, connectionId) => {
    try {
      if (!connectionId) {
        throw new Error('Connection ID is required');
      }

      const schema = await database.getSchema(connectionId);
      return responder(true, schema);
    } catch (error) {
      console.error('Failed to get schema:', error);
      return responder(false, null, error.message);
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
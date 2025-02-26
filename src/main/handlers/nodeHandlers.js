import { exec } from 'child_process'
import { promisify } from 'util'
import { readFile, writeFile } from 'fs/promises'
import axios from 'axios'  // Make sure to install axios if not already installed
import { responder } from '../utils/helpers';
import database from '../services/databaseService';
const execAsync = promisify(exec)

export const nodeHandlers = {
  'node:execute': async (event, { nodeId, nodeType, config, input }) => {
    try {
      if (!nodeType) {
        return responder(false, null, 'Node type is required');
      }

      // Execute node based on type
      switch (nodeType) {
        case 'database':
          return await executeDatabaseNode(config, input);
        case 'http':
          return await executeHttpNode(config, input);
        case 'transform':
          return await executeTransformNode(config, input);
        default:
          return responder(false, null, `Unsupported node type: ${nodeType}`);
      }
    } catch (error) {
      console.error('Node execution failed:', error);
      return responder(false, null, error.message);
    }
  },

  'node:validate': async (event, { nodeType, config }) => {
    try {
      if (!nodeType || !config) {
        return responder(false, null, 'Node type and config are required');
      }

      // Validate node configuration based on type
      switch (nodeType) {
        case 'database':
          return await validateDatabaseNode(config);
        case 'http':
          return await validateHttpNode(config);
        case 'transform':
          return await validateTransformNode(config);
        default:
          return responder(false, null, `Unsupported node type: ${nodeType}`);
      }
    } catch (error) {
      console.error('Node validation failed:', error);
      return responder(false, null, error.message);
    }
  },

  'node:test': async (event, { nodeType, config, input }) => {
    try {
      if (!nodeType || !config) {
        return responder(false, null, 'Node type and config are required');
      }

      // Test node with sample input
      const result = await executeNodeTest(nodeType, config, input);
      return responder(true, result);
    } catch (error) {
      console.error('Node test failed:', error);
      return responder(false, null, error.message);
    }
  },

  'nodes:file:save': async (_, path, content) => {
    try {
      await writeFile(path, content)
      return responder(true, null, null);
    } catch (error) {
      return responder(false, null, error.message);
    }
  },

  'nodes:file:open': async (_, path) => {
    try {
      const content = await readFile(path, 'utf-8')
      return responder(true, content, null);
    } catch (error) {
      return responder(false, null, error.message);
    }
  },

  'nodes:http:request': async (_, config) => {
    try {
        const {
          method = 'GET',
          url,
          headers = {},
          params = {},
          data = null,
          timeout = 30000,
          validateStatus = null
        } = config

        console.log('HTTP Request structure:', config);
  
        const response = await axios({
          method,
          url,
          headers,
          params,
          data,
          timeout,
          validateStatus
        })
  
        return responder(true, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
            data: response.data
        }, null)
      } catch (error) {
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          return responder(false, null, {
              status: error.response.status,
              statusText: error.response.statusText,
              headers: error.response.headers,
              data: error.response.data
          }, null)
        } else if (error.request) {
          // The request was made but no response was received
          return {
            success: false,
            error: {
              message: 'No response received',
              request: error.request
            }
          }
        } else {
          // Something happened in setting up the request
          return responder(false, null, {
              message: error.message
          }, null)
        }
    }
  },

  'nodes:database:query': async (_, connectionId, query, parameters) => {
    try {
      // ... existing database query logic ...
      return responder(true, result, null);
    } catch (error) {
      return responder(false, null, error.message);
    }
  }
} 

// Helper functions for node execution
async function executeDatabaseNode(config, input) {
  try {
    if (!config.connectionId || !config.query) {
      throw new Error('Database connection ID and query are required');
    }

    const result = await database.executeQuery(
      config.connectionId,
      config.query,
      input?.parameters
    );

    return responder(true, result);
  } catch (error) {
    return responder(false, null, error.message);
  }
}

async function executeHttpNode(config, input) {
  try {
    if (!config.url) {
      throw new Error('HTTP URL is required');
    }

    const response = await fetch(config.url, {
      method: config.method || 'GET',
      headers: config.headers || {},
      body: config.method !== 'GET' ? JSON.stringify(input) : undefined
    });

    const data = await response.json();
    return responder(true, data);
  } catch (error) {
    return responder(false, null, error.message);
  }
}

async function executeTransformNode(config, input) {
  try {
    if (!config.transform) {
      throw new Error('Transform function is required');
    }

    // Execute transform function in a safe context
    const result = await executeTransform(config.transform, input);
    return responder(true, result);
  } catch (error) {
    return responder(false, null, error.message);
  }
}

// Helper functions for node validation
async function validateDatabaseNode(config) {
  try {
    if (!config.connectionId) {
      throw new Error('Database connection ID is required');
    }
    if (!config.query) {
      throw new Error('Database query is required');
    }
    return responder(true);
  } catch (error) {
    return responder(false, null, error.message);
  }
}

async function validateHttpNode(config) {
  try {
    if (!config.url) {
      throw new Error('HTTP URL is required');
    }
    if (config.method && !['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(config.method)) {
      throw new Error('Invalid HTTP method');
    }
    return responder(true);
  } catch (error) {
    return responder(false, null, error.message);
  }
}

async function validateTransformNode(config) {
  try {
    if (!config.transform) {
      throw new Error('Transform function is required');
    }
    // Validate transform function syntax
    new Function('input', config.transform);
    return responder(true);
  } catch (error) {
    return responder(false, null, 'Invalid transform function');
  }
}

// Helper function for node testing
async function executeNodeTest(nodeType, config, input) {
  switch (nodeType) {
    case 'database':
      return await executeDatabaseNode(config, input);
    case 'http':
      return await executeHttpNode(config, input);
    case 'transform':
      return await executeTransformNode(config, input);
    default:
      throw new Error(`Unsupported node type: ${nodeType}`);
  }
} 
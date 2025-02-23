import { exec } from 'child_process'
import { promisify } from 'util'
import { readFile, writeFile } from 'fs/promises'
import axios from 'axios'  // Make sure to install axios if not already installed
import { responder } from '../utils/helpers';
const execAsync = promisify(exec)

export const nodeHandlers = {
  'nodes:command:execute': async (_, command, options) => {
    try {
      const {
        workingDirectory = process.cwd(),
        timeout = 30000,
        environmentVars = []
      } = options || {}

      // Prepare environment variables
      const env = { ...process.env }
      for (const envVar of environmentVars) {
        if (envVar.key && envVar.value) {
          env[envVar.key] = envVar.value
        }
      }

      const { stdout, stderr } = await execAsync(command, {
        cwd: workingDirectory,
        env,
        timeout
      })

      return responder(true, { stdout, stderr, command, workingDirectory }, null);
    } catch (error) {
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
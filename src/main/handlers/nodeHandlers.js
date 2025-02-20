import { exec } from 'child_process'
import { promisify } from 'util'
import { readFile, writeFile } from 'fs/promises'
import axios from 'axios'  // Make sure to install axios if not already installed

const execAsync = promisify(exec)

export const nodeHandlers = {
  'nodes.command.execute': async (command, options) => {
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

      return {
        success: true,
        data: { stdout, stderr, command, workingDirectory }
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  'nodes.file.save': async (path, content) => {
    try {
      await writeFile(path, content)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  'nodes.file.open': async (path) => {
    try {
      const content = await readFile(path, 'utf-8')
      return { success: true, data: content }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  'nodes.http.request': async (config) => {
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

      const response = await axios({
        method,
        url,
        headers,
        params,
        data,
        timeout,
        validateStatus
      })

      return {
        success: true,
        data: {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          data: response.data
        }
      }
    } catch (error) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        return {
          success: false,
          error: {
            status: error.response.status,
            statusText: error.response.statusText,
            headers: error.response.headers,
            data: error.response.data
          }
        }
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
        return {
          success: false,
          error: {
            message: error.message
          }
        }
      }
    }
  }
} 
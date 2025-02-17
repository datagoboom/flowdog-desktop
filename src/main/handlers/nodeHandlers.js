import { exec } from 'child_process'
import { promisify } from 'util'
import { readFile, writeFile } from 'fs/promises'

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
  }
} 
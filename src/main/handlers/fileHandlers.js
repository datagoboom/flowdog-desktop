import { dialog } from 'electron';
import fs from 'fs/promises';
import path from 'path';
import { responder } from '../utils/helpers';

export const fileHandlers = {
  'file:save': async (_, { filePath, data, options = {} }) => {
    try {
      // If no filePath provided, open save dialog
      if (!filePath) {
        const { canceled, filePath: selectedPath } = await dialog.showSaveDialog({
          defaultPath: options.defaultPath,
          filters: options.filters || [
            { name: 'All Files', extensions: ['*'] }
          ]
        });

        if (canceled || !selectedPath) {
          return responder(false, null, 'Save cancelled');
        }

        filePath = selectedPath;
      }

      // Convert data to string if it's an object
      const content = typeof data === 'object' ? JSON.stringify(data, null, 2) : data;
      
      await fs.writeFile(filePath, content, 'utf8');
      
      return responder(true, { filePath });
    } catch (error) {
      console.error('Failed to save file:', error);
      return responder(false, null, error.message);
    }
  },

  'file:open': async (_, options = {}) => {
    try {
      const { canceled, filePaths } = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: options.filters || [
          { name: 'All Files', extensions: ['*'] }
        ]
      });

      if (canceled || filePaths.length === 0) {
        return responder(false, null, 'Open cancelled');
      }

      const filePath = filePaths[0];
      const content = await fs.readFile(filePath, 'utf8');
      
      // Try to parse JSON if specified
      let data = content;
      if (options.parseJson) {
        try {
          data = JSON.parse(content);
        } catch (e) {
          return responder(false, null, 'Invalid JSON file');
        }
      }

      return responder(true, { filePath, data });
    } catch (error) {
      console.error('Failed to open file:', error);
      return responder(false, null, error.message);
    }
  },

  'file:append': async (_, { filePath, data }) => {
    try {
      if (!filePath) {
        return responder(false, null, 'No file path provided');
      }

      const content = typeof data === 'object' ? JSON.stringify(data) : data;
      await fs.appendFile(filePath, content + '\n', 'utf8');
      
      return responder(true, { filePath });
    } catch (error) {
      console.error('Failed to append to file:', error);
      return responder(false, null, error.message);
    }
  },

  'file:delete': async (_, filePath) => {
    try {
      if (!filePath) {
        return responder(false, null, 'No file path provided');
      }

      await fs.unlink(filePath);
      
      return responder(true, { filePath });
    } catch (error) {
      console.error('Failed to delete file:', error);
      return responder(false, null, error.message);
    }
  },

  'file:select-directory': async (_, options = {}) => {
    try {
      const { canceled, filePaths } = await dialog.showOpenDialog({
        properties: ['openDirectory'],
        defaultPath: options.defaultPath
      });

      if (canceled || filePaths.length === 0) {
        return responder(false, null, 'Directory selection cancelled');
      }

      return responder(true, { directoryPath: filePaths[0] });
    } catch (error) {
      console.error('Failed to select directory:', error);
      return responder(false, null, error.message);
    }
  }
}; 
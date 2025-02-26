import { dialog } from 'electron';
import fs from 'fs/promises';
import path from 'path';
import { responder } from '../utils/helpers';

export const fileHandlers = {
  'file:save': async (event, { filePath, data, options = {} }) => {
    try {
      // If no filePath provided, open save dialog
      if (!filePath) {
        const { canceled, filePath: selectedPath } = await dialog.showSaveDialog({
          title: options.title || 'Save File',
          defaultPath: options.defaultPath,
          filters: options.filters || [
            { name: 'All Files', extensions: ['*'] }
          ],
          properties: options.properties || []
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

  'file:append': async (event, { filePath, data, options = {} }) => {
    try {
      if (!filePath) {
        return responder(false, null, 'No file path provided');
      }

      // Convert data to string if it's an object
      const content = typeof data === 'object' ? JSON.stringify(data, null, 2) : data;
      
      // Add newline if requested
      const finalContent = options.addNewline ? content + '\n' : content;
      
      // Create file if it doesn't exist
      await fs.appendFile(filePath, finalContent, 'utf8');
      
      return responder(true, { filePath });
    } catch (error) {
      console.error('Failed to append to file:', error);
      return responder(false, null, error.message);
    }
  },

  'file:open': async (event, options = {}) => {
    try {
      const { canceled, filePaths } = await dialog.showOpenDialog({
        title: options.title || 'Open File',
        defaultPath: options.defaultPath,
        filters: options.filters || [
          { name: 'All Files', extensions: ['*'] }
        ],
        properties: ['openFile', ...(options.properties || [])]
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

  'file:select-directory': async (event, options = {}) => {
    try {
      const { canceled, filePaths } = await dialog.showOpenDialog({
        title: options.title || 'Select Directory',
        defaultPath: options.defaultPath,
        properties: ['openDirectory', 'createDirectory'],
        ...options
      });

      if (canceled || filePaths.length === 0) {
        return responder(false, null, 'Directory selection cancelled');
      }

      return responder(true, { directoryPath: filePaths[0] });
    } catch (error) {
      console.error('Failed to select directory:', error);
      return responder(false, null, error.message);
    }
  },

  'file:exists': async (event, filePath) => {
    try {
      await fs.access(filePath);
      return responder(true, true);
    } catch {
      return responder(true, false);
    }
  },

  'file:delete': async (event, filePath) => {
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
  }
}; 
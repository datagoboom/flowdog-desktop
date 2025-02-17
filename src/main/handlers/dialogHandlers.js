import { dialog } from 'electron';
import { writeFile } from 'fs/promises';

export const dialogHandlers = {
  'dialog.open-file': async (event, options) => {
    try {
      const result = await dialog.showOpenDialog(options);
      return {
        success: !result.canceled,
        filePath: result.filePaths[0]
      };
    } catch (error) {
      console.error('Failed to open file dialog:', error);
      return { success: false, error: error.message };
    }
  },

  'dialog.save-file': async (event, options) => {
    try {
      const result = await dialog.showSaveDialog(options);
      
      if (result.canceled) {
        return { success: false };
      }

      // Create empty SQLite database file
      if (result.filePath.endsWith('.db') || 
          result.filePath.endsWith('.sqlite') || 
          result.filePath.endsWith('.sqlite3')) {
        await writeFile(result.filePath, ''); // Creates empty file
      }

      return {
        success: true,
        filePath: result.filePath
      };
    } catch (error) {
      console.error('Failed to save file:', error);
      return { success: false, error: error.message };
    }
  }
}; 
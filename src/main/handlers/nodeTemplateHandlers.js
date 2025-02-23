import { app } from 'electron';
import path from 'path';
import fs from 'fs/promises';

const nodeTemplatesDir = path.join(app.getPath('userData'), 'nodeTemplates');

const ensureNodeTemplatesDir = async () => {
  try {
    await fs.mkdir(nodeTemplatesDir, { recursive: true });
  } catch (error) {
    console.error('Failed to create node templates directory:', error);
  }
};

export const nodeTemplateHandlers = {
  'node-template:save': async (_, template) => {
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

  'node-template:list': async () => {
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

  'node-template:delete': async (_, templateId) => {
    try {
      const filePath = path.join(nodeTemplatesDir, `${templateId}.json`);
      await fs.unlink(filePath);
      return { success: true };
    } catch (error) {
      console.error('Failed to delete node template:', error);
      return { success: false, error: error.message };
    }
  }
}; 
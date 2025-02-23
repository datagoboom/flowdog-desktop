import { app } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import { responder } from '../utils/helpers';
// Create a flows directory in the app's user data folder
const flowsDir = path.join(app.getPath('userData'), 'flows');

const ensureFlowsDir = async () => {
  try {
    await fs.mkdir(flowsDir, { recursive: true });  
    return responder(true, null, null);
  } catch (error) {
    console.error('Failed to create flows directory:', error);
    return responder(false, null, error.message);
  }
};

export const flowHandlers = {
  'flow:save': async (event, flowData) => {
    try {
      console.log('Main process received flow data:', flowData);
      
      await ensureFlowsDir();
      
      if (!flowData || typeof flowData !== 'object') {
        console.error('Invalid flow data:', flowData);
        throw new Error(`Invalid flow data received: ${JSON.stringify(flowData)}`);
      }
      
      const flow = {
        id: flowData.id || Date.now().toString(),
        name: flowData.name || 'Untitled Flow',
        description: flowData.description || '',
        nodes: flowData.nodes || [],
        edges: flowData.edges || [],
        timestamp: Date.now()
      };
      
      const filePath = path.join(flowsDir, `${flow.id}.json`);
      await fs.writeFile(filePath, JSON.stringify(flow, null, 2));
      
      return responder(true, { flowId: flow.id }, null);
    } catch (error) {
      console.error('Failed to save flow:', error);
      return responder(false, null, error.message);
    }
  },

  'flow:list': async () => {
      try {
          await ensureFlowsDir();
          
          const files = await fs.readdir(flowsDir);
          const flows = [];
      
      for (const file of files) {
          if (file.endsWith('.json')) {
          const filePath = path.join(flowsDir, file);
          const content = await fs.readFile(filePath, 'utf-8');
          const flowData = JSON.parse(content);
          flows.push({
            id: flowData.id,
            name: flowData.name,
            description: flowData.description,
            timestamp: flowData.timestamp,
            nodes: flowData.nodes,
            edges: flowData.edges
          });
        }
      }
      
      return responder(true, flows.sort((a, b) => b.timestamp - a.timestamp), null);
    } catch (error) {
      console.error('Failed to list flows:', error);
      return responder(false, null, error.message);
    }
  },

  'flow:get': async (event, flowId) => {
    try {
      if (!flowId || typeof flowId !== 'string') {
        return responder(false, null, `Invalid flow ID: ${flowId}`);
      }

      const filePath = path.join(flowsDir, `${flowId}.json`);
      const content = await fs.readFile(filePath, 'utf-8');
      const flowData = JSON.parse(content);
      return responder(true, flowData, null);
    } catch (error) {
      console.error('Failed to open flow:', error);
      return responder(false, null, error.message);
    }
  },

  'flow:delete': async (_, flowId) => {
    try {
      const filePath = path.join(flowsDir, `${flowId}.json`);
      await fs.unlink(filePath);
      return responder(true, null, null);
    } catch (error) {
      console.error('Failed to delete flow:', error);
      return responder(false, null, error.message);
    }
  }
}; 
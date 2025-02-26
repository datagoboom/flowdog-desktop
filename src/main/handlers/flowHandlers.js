import database from '../services/databaseService';
import { responder } from '../utils/helpers';
import fs from 'fs/promises';
import path from 'path';
import { app } from 'electron';
import { v4 as uuidv4 } from 'uuid';

// Create flows directory if it doesn't exist
const ensureFlowsDir = async () => {
  const flowsDir = path.join(app.getPath('userData'), 'flows');
  await fs.mkdir(flowsDir, { recursive: true });
  return flowsDir;
};

export const flowHandlers = {
  'flow:save': async (event, flowData) => {
    try {
      if (!flowData || typeof flowData !== 'object') {
        return responder(false, null, 'Invalid flow data');
      }

      const flowId = flowData.id || uuidv4();
      const userId = event.user.id;
      const flowsDir = await ensureFlowsDir();

      const [flowInfo] = await database.models.FlowInfo.upsert({
        id: flowId,
        name: flowData.name,
        description: flowData.description || '',
        user_id: userId
      });

      // Save flow data to file
      const filePath = path.join(flowsDir, `${flowId}.json`);
      const fileData = {
        id: flowId,
        name: flowData.name,
        description: flowData.description,
        nodes: flowData.nodes || [],
        edges: flowData.edges || []
      };

      await fs.writeFile(filePath, JSON.stringify(fileData, null, 2));

      return responder(true, {
        id: flowId,
        name: flowInfo.name,
        description: flowInfo.description,
        created_at: flowInfo.created_at,
        updatedAt: flowInfo.updatedAt
      });
    } catch (error) {
      console.error('Failed to save flow:', error);
      return responder(false, null, error.message);
    }
  },

  'flow:load': async (event, flowId) => {
    try {
      if (!flowId) {
        return responder(false, null, 'Flow ID is required');
      }

      // Check database for flow info
      const flowInfo = await database.models.FlowInfo.findOne({
        where: {
          id: flowId,
          user_id: event.user.id
        }
      });

      if (!flowInfo) {
        return responder(false, null, 'Flow not found');
      }

      // Load flow data from file
      const filePath = path.join(await ensureFlowsDir(), `${flowId}.json`);
      const fileContent = await fs.readFile(filePath, 'utf8');
      const flowData = JSON.parse(fileContent);

      return responder(true, {
        ...flowData,
        created_at: flowInfo.created_at,
        updatedAt: flowInfo.updatedAt
      });
    } catch (error) {
      console.error('Failed to load flow:', error);
      return responder(false, null, error.message);
    }
  },

  'flow:list': async (event) => {
    try {
      const flows = await database.models.FlowInfo.findAll({
        where: { user_id: event.user.id },
        order: [['updatedAt', 'DESC']]
      });

      console.log("Flow List, flows", flows.dataValues)

      return responder(true, flows);
    } catch (error) {
      console.error('Failed to list flows:', error);
      return responder(false, null, error.message);
    }
  },

  'flow:delete': async (event, flowId) => {
    try {
      if (!flowId) {
        return responder(false, null, 'Flow ID is required');
      }

      // Delete from database
      const deleted = await database.models.FlowInfo.destroy({
        where: {
          id: flowId,
          user_id: event.user.id
        }
      });

      if (!deleted) {
        return responder(false, null, 'Flow not found');
      }

      // Delete flow file
      const filePath = path.join(await ensureFlowsDir(), `${flowId}.json`);
      await fs.unlink(filePath).catch(() => {
        // Ignore file not found errors
      });

      return responder(true);
    } catch (error) {
      console.error('Failed to delete flow:', error);
      return responder(false, null, error.message);
    }
  },

  'flow:duplicate': async (event, flowId) => {
    try {
      if (!flowId) {
        return responder(false, null, 'Flow ID is required');
      }

      // Load original flow
      const originalFlow = await database.models.FlowInfo.findOne({
        where: {
          id: flowId,
          user_id: event.user.id
        }
      });

      if (!originalFlow) {
        return responder(false, null, 'Flow not found');
      }

      // Load flow data from file
      const originalFilePath = path.join(await ensureFlowsDir(), `${flowId}.json`);
      const fileContent = await fs.readFile(originalFilePath, 'utf8');
      const flowData = JSON.parse(fileContent);

      // Create new flow with copied data
      const newFlowId = uuidv4();
      const newFlow = await database.models.FlowInfo.create({
        id: newFlowId,
        name: `${originalFlow.name} (Copy)`,
        description: originalFlow.description,
        user_id: event.user.id
      });

      // Save new flow file
      const newFilePath = path.join(await ensureFlowsDir(), `${newFlowId}.json`);
      const newFileData = {
        ...flowData,
        id: newFlowId,
        name: newFlow.name
      };

      await fs.writeFile(newFilePath, JSON.stringify(newFileData, null, 2));

      return responder(true, {
        id: newFlowId,
        name: newFlow.name,
        description: newFlow.description,
        created_at: newFlow.created_at,
        updatedAt: newFlow.updatedAt
      });
    } catch (error) {
      console.error('Failed to duplicate flow:', error);
      return responder(false, null, error.message);
    }
  },
  'flow:get': async (event, flowId) => {
    try {
      // this will have to validate the flow id in FlowInfo table and then get the file
      const flow = await database.models.FlowInfo.findOne({ where: { id: flowId } });
      const filePath = path.join(await ensureFlowsDir(), `${flowId}.json`);
      const fileContent = await fs.readFile(filePath, 'utf8');
      const flowData = JSON.parse(fileContent);
      return responder(true, flowData);
    } catch (error) {
      return responder(false, null, error.message);
    }
  },
  'flow:import': async (event, { flow }) => {
    try {
      // Generate a new ID for the flow
      const newFlow = {
        ...flow,
        id: uuidv4(),
        // Ensure we have a timestamp
        timestamp: flow.timestamp || Date.now(),
        // Reset any environment-specific IDs
        nodes: flow.nodes.map(node => ({
          ...node,
          data: {
            ...node.data,
            // Reset any connection IDs or environment-specific data
            connectionId: undefined
          }
        }))
      };

      // Save to database
      const result = await database.models.FlowInfo.create(newFlow);

      // Save to file
      const filePath = path.join(await ensureFlowsDir(), `${newFlow.id}.json`);
      await fs.writeFile(filePath, JSON.stringify(newFlow, null, 2));

      return responder(true, result);
    } catch (error) {
      console.error('Flow import failed:', error);
      return responder(false, null, error.message);
    }
  }
}; 
import { responder } from '../utils/helpers';
import database from '../services/databaseService';
import { flowExecutionService } from '../services/flowExecutionService';

export const executionHandlers = {
  'execution:start': async (event, { flowId, nodes, edges, environment, scheduledTime }) => {
    try {
      if (!flowId || !nodes || !edges) {
        return responder(false, null, 'Flow ID, nodes, and edges are required');
      }

      console.log("Event data for execution:start", event)

      const executionId = await flowExecutionService.startExecution(flowId, {
        nodes,
        edges,
        environment,
        scheduledTime,
        userId: event.user.id,
        triggerType: 'manual'
      });

      return responder(true, { executionId });
    } catch (error) {
      console.error('Failed to start execution:', error);
      return responder(false, null, error.message);
    }
  },

  'execution:cancel': async (event, executionId) => {
    try {
      if (!executionId) {
        return responder(false, null, 'Execution ID is required');
      }

      await flowExecutionService.cancelExecution(executionId);
      return responder(true);
    } catch (error) {
      console.error('Failed to cancel execution:', error);
      return responder(false, null, error.message);
    }
  },

  'execution:status': async (event, executionId) => {
    try {
      if (!executionId) {
        return responder(false, null, 'Execution ID is required');
      }

      const execution = await flowExecutionService.getExecution(executionId);
      if (!execution) {
        return responder(false, null, 'Execution not found');
      }

      return responder(true, execution);
    } catch (error) {
      console.error('Failed to get execution status:', error);
      return responder(false, null, error.message);
    }
  },

  'execution:list': async (event, filters = {}) => {
    try {
      const executions = await flowExecutionService.listExecutions({
        ...filters,
        userId: event.user.id
      });

      return responder(true, executions);
    } catch (error) {
      console.error('Failed to list executions:', error);
      return responder(false, null, error.message);
    }
  },

  'execution:history': async (event, { flowId, limit = 10, offset = 0 }) => {
    try {
      if (!flowId) {
        return responder(false, null, 'Flow ID is required');
      }

      const history = await database.models.Execution.findAll({
        where: {
          flow_id: flowId,
          user_id: event.user.id
        },
        order: [['created_at', 'DESC']],
        limit,
        offset
      });

      return responder(true, history);
    } catch (error) {
      console.error('Failed to get execution history:', error);
      return responder(false, null, error.message);
    }
  }
}; 
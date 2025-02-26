import { EventEmitter } from 'events';
import FlowExecutor from '../../renderer/src/executor/FlowExecutor';
import database from '../services/databaseService';
import FlowRunner from './FlowRunner';

export class FlowExecutionService extends EventEmitter {
  constructor() {
    super();
    this.activeExecutions = new Map(); // executionId -> execution info
    this.executionQueue = [];
    this.scheduledExecutions = new Map();
    this.flowRunner = new FlowRunner();
  }

  async startExecution(flowId, {
    nodes,
    edges,
    environment,
    scheduledTime = null,
    triggerType = 'manual',
    userId
  }) {
    console.log('Starting execution with:', { flowId, userId, triggerType });
    
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create execution record in database first
    const executionRecord = await database.models.Execution.create({
      id: executionId,
      flow_id: flowId,
      user_id: userId,
      status: 'pending',
      trigger_type: triggerType,
      scheduled_time: scheduledTime,
      start_time: null,
      end_time: null,
      error: null
    });

    console.log('Created execution record:', executionRecord.toJSON());

    const executionInfo = {
      id: executionId,
      flowId,
      userId,
      status: 'pending',
      startTime: null,
      endTime: null,
      error: null,
      triggerType,
      scheduledTime,
      progress: 0,
      executingNodeIds: new Set()
    };

    this.activeExecutions.set(executionId, executionInfo);
    this.emit('executionCreated', executionInfo);

    // If scheduled, add to queue
    if (scheduledTime && scheduledTime > Date.now()) {
      this.queueExecution(executionId, scheduledTime);
      return executionId;
    }

    // Execute immediately
    await this.executeFlow(executionId, {
      nodes,
      edges,
      environment,
      userId
    });

    return executionId;
  }

  queueExecution(executionId, scheduledTime) {
    const timeout = setTimeout(() => {
      this.executeFlow(executionId);
    }, scheduledTime - Date.now());

    this.executionQueue.push({ executionId, timeout });
  }

  async executeFlow(executionId, { nodes, edges, environment, userId }) {
    try {
      // Update execution record to 'running' status and set start time
      await database.models.Execution.update({
        status: 'running',
        start_time: new Date()
      }, {
        where: { id: executionId }
      });

      // Get execution info from memory
      const executionInfo = this.activeExecutions.get(executionId);
      if (!executionInfo) {
        throw new Error('Execution not found');
      }

      // Update memory state
      executionInfo.status = 'running';
      executionInfo.startTime = new Date();
      this.emit('executionUpdated', executionInfo);

      try {
        // Execute the flow using the FlowRunner instance
        const result = await this.flowRunner.execute(nodes, edges, environment);

        // Update execution record to 'completed' status
        await database.models.Execution.update({
          status: 'completed',
          end_time: new Date()
        }, {
          where: { id: executionId }
        });

        // Update memory state
        executionInfo.status = 'completed';
        executionInfo.endTime = new Date();
        this.emit('executionUpdated', executionInfo);

        return result;

      } catch (error) {
        // Update execution record with error status
        await database.models.Execution.update({
          status: 'error',
          end_time: new Date(),
          error: error.message
        }, {
          where: { id: executionId }
        });

        // Update memory state
        executionInfo.status = 'error';
        executionInfo.endTime = new Date();
        executionInfo.error = error.message;
        this.emit('executionUpdated', executionInfo);

        throw error;
      }
    } catch (error) {
      console.error('Flow execution failed:', error);
      throw error;
    }
  }

  cancelExecution(executionId) {
    const executionInfo = this.activeExecutions.get(executionId);
    if (!executionInfo) return;

    // Remove from queue if scheduled
    const queuedExecution = this.executionQueue.find(q => q.executionId === executionId);
    if (queuedExecution) {
      clearTimeout(queuedExecution.timeout);
      this.executionQueue = this.executionQueue.filter(q => q.executionId !== executionId);
    }

    executionInfo.status = 'cancelled';
    executionInfo.endTime = Date.now();
    this.emit('executionCancelled', executionInfo);
  }

  getExecution(executionId) {
    return this.activeExecutions.get(executionId);
  }

  listExecutions(filters = {}) {
    return Array.from(this.activeExecutions.values())
      .filter(exec => {
        if (filters.flowId && exec.flowId !== filters.flowId) return false;
        if (filters.status && exec.status !== filters.status) return false;
        if (filters.userId && exec.userId !== filters.userId) return false;
        return true;
      });
  }
}

export const flowExecutionService = new FlowExecutionService(); 
import FlowExecutor from '../../renderer/src/executor/FlowExecutor';
import fetch from 'node-fetch';
// impiort backend IPC handlers so we can used them without window.api 
import {httpHandlers} from '../handlers/httpHandlers';
import {databaseHandlers} from '../handlers/databaseHandlers';

export default class FlowRunner {
  constructor() {
    // Initialize state tracking
    this.executingNodeIds = new Set();
    this.nodeData = new Map();
    this.lastOutput = null;
    this.lastInput = null;
    this.environment = new Map();
    this.history = [];
  }

  // Required methods for FlowExecutor
  addToHistory = (entry) => {
    this.history.push(entry);
    console.log('Added to history:', entry);
  };

  addLog = (message) => {
    console.log('Flow log:', message);
  };

  setExecutingNodeIds = (nodeIds) => {
    this.executingNodeIds = new Set(nodeIds);
    console.log('Executing nodes:', Array.from(this.executingNodeIds));
  };

  updateNodeData = (nodeId, data) => {
    this.nodeData.set(nodeId, data);
    console.log('Updated node data:', { nodeId, data });
  };

  setLastOutput = (output) => {
    this.lastOutput = output;
    console.log('Last output:', output);
  };

  setLastInput = (input) => {
    this.lastInput = input;
    console.log('Last input:', input);
  };

  setEnvironmentVariable = (key, value) => {
    this.environment.set(key, value);
    console.log('Set environment variable:', { key, value });
  };

  // Backend-specific HTTP request handler
  httpRequest = async (config) => {
    try {
      // Create a dummy event object since we're not in an IPC context
      const dummyEvent = {};
      
      const response = await httpHandlers['http:request'](config);
      
      if (!response.success) {
        throw new Error(response.error || 'HTTP request failed');
      }

      return response.data;

    } catch (error) {
      console.error('HTTP request failed:', error);
      throw error;
    }
  };

  // Placeholder for database query
  databaseQuery = async (query) => {
    let res = await databaseHandlers['database:query'](query);
    return res;
  };

  // Placeholder for command execute
  commandExecute = async (command) => {
    console.log('Command execute:', command);
    return { success: true, output: '' };
  };

  // Placeholder for decrypt
  decrypt = (value) => {
    console.log('Decrypting value:', value);
    return value;
  };

  // Add sequence tracking
  updateNodeSequence = (nodeId, sequence) => {
    console.log('Updating node sequence:', { nodeId, sequence });
  };

  incrementSequence = () => {
    console.log('Incrementing sequence');
  };

  async execute(nodes, edges, environment = {}) {
    try {
      console.log('Starting flow execution with:', { 
        nodeCount: nodes?.length, 
        edgeCount: edges?.length,
        nodes,
        edges
      });

      // Ensure nodes and edges are arrays
      const safeNodes = Array.isArray(nodes) ? nodes : [];
      const safeEdges = Array.isArray(edges) ? edges : [];

      // Create a new FlowExecutor instance with all required parameters
      const executor = new FlowExecutor(
        safeNodes,
        safeEdges,
        this.addToHistory,
        this.addLog,
        this.setExecutingNodeIds,
        this.updateNodeData,
        this.setLastOutput,
        this.setLastInput,
        this.setEnvironmentVariable,
        environment,
        this.httpRequest,
        this.databaseQuery,
        this.commandExecute,
        this.decrypt
      );

      // Execute the flow with sequence tracking functions
      const result = await executor.execute(
        this.updateNodeSequence,
        this.incrementSequence
      );

      console.log('Flow execution completed:', result);
      return result;

    } catch (error) {
      console.error('Flow execution failed:', error);
      throw error;
    }
  }
} 
import { findNextNodes } from '../utils/graphUtils';
import xml from '../utils/xml';
import regex from '../utils/regex';
import Handlebars from 'handlebars';
import formatter from '../utils/formatter';
import JQParser from '../utils/jq';
import HttpNode from './basic/HttpNode';
import FormatNode from './basic/FormatNode';
import FileNode from './basic/FileNode';
import ParserNode from './basic/ParserNode';
import ConditionalNode from './basic/ConditionalNode';
import IteratorNode from './basic/IteratorNode';
import TestNode from './basic/TestNode';
import CommandNode from './basic/CommandNode';
import DatabaseQueryNode from './basic/DatabaseQueryNode';
import RSSNode from './basic/RSSNode';
import PromptNode from './basic/PromptNode';
import CounterNode from './basic/CounterNode';
import TextDisplayNode from './basic/TextDisplayNode';
import CollectorNode from './basic/CollectorNode';
const jq = new JQParser();

export default class FlowExecutor {
  constructor(nodes, edges, addToHistory, addLog, setExecutingNodeIds, updateNodeData, setLastOutput, setLastInput, setEnvironmentVariable, environment, httpRequest) {
    this.nodes = nodes;
    this.edges = edges;
    this.addAction = addToHistory;
    this.addLog = addLog;
    this.setExecutingNodeIds = setExecutingNodeIds;
    this.updateNodeData = updateNodeData;
    this.setLastOutput = setLastOutput;
    this.setLastInput = setLastInput;
    this.setEnvironmentVariable = setEnvironmentVariable;
    this.nodeOutputs = new Map();
    this.executionSequence = 1;
    this.loggedNodes = new Set();
    this.lastInput = null;
    this.stepDelay = 300;
    this.window = window;
    
    // Iterator state
    this.iteratorState = new Map(); // Map of nodeId -> { currentIndex, items }
    // Initialize executingNodes Set
    this.executingNodes = new Set();
    this.environment = environment;
    this.localEnvironment = { ...environment }; // Add local copy of environment
    this.httpNode = new HttpNode(
      this.getEnvVar.bind(this),
      this.setEnvironmentVariable,
      this.localEnvironment,
      (config) => httpRequest(config)
    );
    this.formatNode = new FormatNode(this.updateNodeData);
    this.fileNode = new FileNode(this.window);
    this.parserNode = new ParserNode();
    this.conditionalNode = new ConditionalNode(
      this.getEnvVar.bind(this),
      this.setEnvironmentVariable,
      this.localEnvironment
    );
    this.iteratorNode = new IteratorNode(this.updateNodeData, this.getEnvVar.bind(this));
    this.testNode = new TestNode();
    this.commandNode = new CommandNode();
    this.databaseQueryNode = new DatabaseQueryNode();
    this.counterNode = new CounterNode(this.updateNodeData);
    this.rssNode = new RSSNode(
      this.getEnvVar.bind(this),
      this.setEnvironmentVariable,
      this.localEnvironment,
      (config) => httpRequest(config)
    );
    this.promptNode = new PromptNode(
      this.getEnvVar.bind(this),
      this.setEnvironmentVariable,
      this.localEnvironment,
      (config) => httpRequest(config),
      this.updateNodeData
    );
    this.textDisplayNode = new TextDisplayNode(
      this.getEnvVar.bind(this),
      this.setEnvironmentVariable,
      this.localEnvironment,
      this.updateNodeData
    );
    this.collectorNode = new CollectorNode(
      this.getEnvVar.bind(this),
      this.setEnvironmentVariable,
      this.localEnvironment,
      this.updateNodeData
    );

    // Node executor mapping
    this.executors = {
      http: this.httpNode,
      format: this.formatNode,
      file: this.fileNode,
      parser: this.parserNode,
      conditional: this.conditionalNode,
      iterator: this.iteratorNode,
      test: this.testNode,
      command: this.commandNode,
      databaseQuery: this.databaseQueryNode,
      rss: this.rssNode,
      prompt: this.promptNode,
      counter: this.counterNode,
      textDisplay: this.textDisplayNode,
      collector: this.collectorNode
    };
  }

  // Update getEnvVar to use local environment
  getEnvVar(varName) {
    const name = varName.startsWith('$') ? varName.slice(1) : varName;
    return this.localEnvironment?.variables?.[name];
  }

  logAction(nodeType, status, message, details = null) {
    if (this.addAction) {
      const action = {
        type: nodeType.toUpperCase(),
        status,
        message,
        data: details,
        timestamp: new Date().toISOString()
      };
      this.addAction(action);
    }
  }

  async delay() {
    return new Promise(resolve => setTimeout(resolve, this.stepDelay));
  }

  async execute(updateNodeSequence, incrementSequence) {
    this.nodeOutputs.clear();
    this.resetIteratorState();
    
    try {
      // Get all nodes by levels
      const nodeLevels = this.getNodesByLevel();
      
      // Execute nodes level by level
      for (const level of nodeLevels) {
        
        // First, execute non-iterator nodes in this level
        const nonIteratorNodes = level.filter(nodeId => {
          const node = this.nodes.find(n => n.id === nodeId);
          return node.type !== 'iterator';
        });
  
        if (nonIteratorNodes.length > 0) {
          await Promise.all(nonIteratorNodes.map(nodeId => 
            this.executeNodeAtLevel(nodeId, updateNodeSequence, incrementSequence)
          ));
        }
  
        // Then handle iterator nodes sequentially
        const iteratorNodes = level.filter(nodeId => {
          const node = this.nodes.find(n => n.id === nodeId);
          return node.type === 'iterator';
        });
  
        for (const iteratorNodeId of iteratorNodes) {
          await this.executeIteratorAndDescendants(
            iteratorNodeId,
            updateNodeSequence,
            incrementSequence
          );
        }
      }
      
      return this.lastInput;
    } catch (error) {
      console.error('Workflow execution failed:', error);
      throw error;
    }
  }

  getNodesByLevel() {
    const levels = [];
    const visited = new Set();
    
    // Find start nodes (nodes with no incoming edges)
    const startNodes = this.nodes
      .filter(node => !this.edges.some(edge => edge.target === node.id))
      .map(node => node.id);
    
    if (startNodes.length > 0) {
      levels.push(startNodes);
      startNodes.forEach(nodeId => visited.add(nodeId));
    }

    // Build subsequent levels
    while (true) {
      const currentLevel = [];
      
      // Find nodes whose dependencies are all in previous levels
      this.nodes.forEach(node => {
        if (visited.has(node.id)) return;
        
        const dependencies = this.edges
          .filter(edge => edge.target === node.id)
          .map(edge => edge.source);
        
        if (dependencies.every(depId => visited.has(depId))) {
          currentLevel.push(node.id);
        }
      });
      
      if (currentLevel.length === 0) break;
      
      levels.push(currentLevel);
      currentLevel.forEach(nodeId => visited.add(nodeId));
    }
    
    return levels;
  }

  validateConditionalEdges(nodeId, sourceNodes) {
    // get edge name(s) connected to this node (edges where target is this node)
    const conditionalEdges = this.edges
      .filter(edge => edge.target === nodeId)
      .filter(edge => edge.source.includes('COND_'));

    // get input that comes from a conditional node
    let inputs = this.lastInput[nodeId]
    let conditionalInputNodes = Object.keys(inputs).filter(key => key.includes('COND_'));

    conditionalEdges.forEach(edge => {
      let srcHandle = edge.sourceHandle;
      let condInput = sourceNodes.find(node => node.id === edge.source);
      if(condInput && condInput.data.response.outputPath !== srcHandle) {
        let lastInput = this.lastInput
        lastInput[nodeId][edge.source] = null;
        this.setLastInput(lastInput);
        console.log("New Last Input: ", this.lastInput);
      } else {
        console.log("Cond Input is VALID ", condInput);
      }
    });
  }

  async executeNodeAtLevel(nodeId, updateNodeSequence, incrementSequence) {
    const node = this.nodes.find(n => n.id === nodeId);
    if (!node) return;

    try {
      // Update executing nodes set
      this.executingNodes.add(nodeId);
      this.setExecutingNodeIds(new Set(this.executingNodes));
      await this.delay();
      
      // Update sequence
      updateNodeSequence(nodeId, this.executionSequence);
      this.executionSequence = incrementSequence();

      // Get input data from previous nodes
      const sourceNodeIds = this.edges
        .filter(edge => edge.target === nodeId)
        .map(edge => edge.source);
      
      const sourceNodes = this.nodes
        .filter(n => sourceNodeIds.includes(n.id))
        .map(n => ({
          id: n.id,
          type: n.type,
          data: this.nodeOutputs.get(n.id)
        }));

      // Create input context
      this.lastInput = {
        [nodeId]: sourceNodes.reduce((acc, source) => ({
          ...acc,
          [source.id]: source.data
        }), {})
      };
      
      // Update context if available
      if (this.setLastInput) {
        this.setLastInput(this.lastInput);
      }

      // Validate conditional edges before execution
      this.validateConditionalEdges(nodeId, sourceNodes);

      // Execute node using the appropriate executor
      const executor = this.executors[node.type];
      if (!executor) {
        throw new Error(`No executor found for node type: ${node.type}`);
      }

      const output = await executor.execute(node.data, this.lastInput[nodeId], sourceNodes, nodeId);
      this.nodeOutputs.set(nodeId, output);
      // Log output for visualization/debugging
      if (this.setLastOutput) {
        this.setLastOutput({
          nodeId: node.id,
          type: node.type,
          data: output,
          timestamp: new Date().toISOString(),
          iteration: output?.iteration || this.lastInput[nodeId]?.iteration,
          workflowContext: {
            iterationId: output?.iteration?.current ? `iteration_${output.iteration.current}` : undefined,
            parentNodeId: sourceNodes[0]?.id,
            sequence: node.type === 'iterator' ? 'start' : 
                     this.lastInput[nodeId]?.iteration ? `step_${this.lastInput[nodeId].iteration.current}` : undefined
          }
        });
      }

      // Get iteration info from input or result
      const iterationInfo = output?.iteration || this.lastInput[nodeId]?.iteration;
      
      // Create unique log key based on current node and iteration
      const logKey = `${node.type.toUpperCase()}_${node.id}${
        iterationInfo ? `_iter_${iterationInfo.current}` : ''
      }`;

      // Log the execution result
      const logEntry = {
        name: node.data.name || node.id,
        source: logKey,
        sourceNodes: sourceNodes.map(n => n.id).join(', '),
        data: output,
        timestamp: new Date().toISOString(),
        iteration: iterationInfo
      };

      this.addLog(logEntry);
      this.loggedNodes.add(logKey);

      // Handle iterator nodes
      if (output?.isIterator) {
        // For now, we'll handle iterators sequentially within their level
        // This might need to be revisited for more complex iterator scenarios
        const iterationOutput = await this.handleIteratorNode(
          node,
          output,
          updateNodeSequence,
          incrementSequence
        );
        this.nodeOutputs.set(nodeId, iterationOutput);
      }

      // Clear this node from executing set
      this.executingNodes.delete(nodeId);
      this.setExecutingNodeIds(new Set(this.executingNodes));

      return output;
    } catch (error) {
      console.error(`Error executing node ${nodeId}:`, error);
      // Clear executing state on error
      this.executingNodes.delete(nodeId);
      this.setExecutingNodeIds(new Set(this.executingNodes));
      throw error;
    }
  }

  // Helper method for handling iterator nodes
  async handleIteratorNode(node, output, updateNodeSequence, incrementSequence) {
    if (!output?.iteration?.hasMore) {
      return output;
    }
  
    return output; // Return the current iteration output
  }


  async executeIteratorAndDescendants(nodeId, updateNodeSequence, incrementSequence) {
    const node = this.nodes.find(n => n.id === nodeId);
    if (!node) return;
  
    try {
      // Get all downstream nodes
      const downstreamNodes = this.getDownstreamNodes(nodeId);
      
      // Get initial iterator output
      let currentOutput = await this.executeNodeAtLevel(nodeId, updateNodeSequence, incrementSequence);
      
      // If not an iterator or no output, return
      if (!currentOutput?.isIterator) return currentOutput;
  
      // Continue while the iterator has more items
      while (currentOutput?.shouldContinue) {
        // Store the current item's output
        const iterationOutput = currentOutput;
        
        // Process all downstream nodes for this iteration
        for (const downstreamId of downstreamNodes) {
          const downstreamNode = this.nodes.find(n => n.id === downstreamId);
          if (!downstreamNode) continue;
  
          // If downstream node is an iterator, handle nested iteration
          if (downstreamNode.type === 'iterator') {
            let innerOutput = await this.executeNodeAtLevel(
              downstreamId,
              updateNodeSequence,
              incrementSequence
            );
            
            // Process all items in the inner iterator
            while (innerOutput?.shouldContinue) {
              innerOutput = await this.executeNodeAtLevel(
                downstreamId,
                updateNodeSequence,
                incrementSequence
              );
            }
          } else {
            // For non-iterator nodes, execute once with current iteration data
            await this.executeNodeAtLevel(
              downstreamId,
              updateNodeSequence,
              incrementSequence
            );
          }
        }
  
        // Get next item from iterator
        currentOutput = await this.executeNodeAtLevel(
          nodeId,
          updateNodeSequence,
          incrementSequence
        );
      }
  
      return currentOutput;
    } catch (error) {
      console.error(`Error executing iterator node ${nodeId}:`, error);
      throw error;
    }
  }
  // Update resetIteratorState to use the iterator node's method
  resetIteratorState(nodeId) {
    if (nodeId) {
      this.iteratorNode.resetState(nodeId);
    } else {
      for (const [type, executor] of Object.entries(this.executors)) {
        if (executor.resetState) {
          executor.resetState();
        }
      }
    }
  }

  // Helper functions
  getDownstreamNodes(nodeId, visited = new Set()) {
    visited.add(nodeId);
    
    const directDownstream = this.edges
      .filter(edge => edge.source === nodeId)
      .map(edge => edge.target);
      
    directDownstream.forEach(id => {
      if (!visited.has(id)) {
        const furtherDownstream = this.getDownstreamNodes(id, visited);
        directDownstream.push(...furtherDownstream);
      }
    });
    
    return Array.from(new Set(directDownstream));
  }

  decodeHTMLEntities(text) {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  }

  simplifyXmlObject(obj) {
    // Base case: if we have a content property, return its value
    if (obj && typeof obj === 'object' && 'content' in obj) {
      return obj.content;
    }

    // If we have children array, process each child
    if (obj && obj.children && Array.isArray(obj.children)) {
      const result = {};
      
      // Process each child
      obj.children.forEach(child => {
        // Get the first (and should be only) key of the child object
        const key = Object.keys(child)[0];
        
        // If we already have this key and it's not an array, convert to array
        if (key in result) {
          if (!Array.isArray(result[key])) {
            result[key] = [result[key]];
          }
          result[key].push(this.simplifyXmlObject(child[key]));
        } else {
          // Otherwise just process the child
          result[key] = this.simplifyXmlObject(child[key]);
        }
      });
      
      return result;
    }

    // If it's an object but not one of the above cases, process each property
    if (obj && typeof obj === 'object') {
      const result = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.simplifyXmlObject(value);
      }
      return result;
    }

    // Default case: return the value as is
    return obj;
  }
}
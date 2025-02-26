import { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { initStorage, saveState, loadState, clearState } from '../utils/storageUtils';
import FlowExecutor from '../executor/FlowExecutor';
import { 
  applyNodeChanges, 
  applyEdgeChanges, 
  addEdge 
} from 'reactflow';
import { findPreviousNodes } from '../utils/graphUtils';
import { useLogger } from './LoggerContext';
import { useApi } from './ApiContext';
import { useAuth } from './AuthContext';
import { v4 as uuidv4 } from 'uuid';
const STORAGE_KEY = 'workflow_data';

// Add this constant for state properties we want to persist
const PERSISTED_STATE_KEYS = [
  'nodes',
  'edges',
  'nodeCounter',
  'nodeSequence',
];

const LOCAL_STORAGE_KEYS = {
  NODES: 'flowNodes',
  EDGES: 'flowEdges',
  ENVIRONMENT: 'flowEnvironment'
};

export const FlowContext = createContext(null);

export const useFlow = () => {
  const context = useContext(FlowContext);
  if (!context) {
    throw new Error('useFlow must be used within a FlowProvider');
  }
  return context;
};


export const FlowProvider = ({ children }) => {
  const api = useApi();
  const httpRequest = api.http.request;
  const commandExecute = api.nodes.command.execute;
  const databaseQuery = api.database.query;
  const { decrypt } = useAuth();

  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [history, setHistory] = useState([]);
  const [nodeCounter, setNodeCounter] = useState({});
  const [selectedNode, setSelectedNode] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executingNodeIds, setExecutingNodeIds] = useState(new Set());
  const [executor, setExecutor] = useState(null);
  const [sequence, setSequence] = useState(1);
  const [nodeSequence, setNodeSequence] = useState({});
  const { addLog } = useLogger();
  const [storage, setStorage] = useState({});
  const [utilityDrawerOpen, setUtilityDrawerOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [autoOpenDrawer, setAutoOpenDrawer] = useState(true);
  const [autoCloseDrawer, setAutoCloseDrawer] = useState(false);

  // Change ref to state
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Add new state for options
  const [edgeType, setEdgeType] = useState('smoothstep');
  const [stepDelay, setStepDelay] = useState(300);
  const [background, setBackground] = useState('dots');
  const [showMinimap, setShowMinimap] = useState(true);
  const [lastInput, setLastInput] = useState(null);
  const [lastOutput, setLastOutput] = useState(null);

  // Initialize environment from localStorage
  const [environment, setEnvironment] = useState(() => {
    const savedEnv = localStorage.getItem(LOCAL_STORAGE_KEYS.ENVIRONMENT);
    return savedEnv ? JSON.parse(savedEnv) : { variables: {} };
  });

  // Add redo stack
  const [redoStack, setRedoStack] = useState([]);

  const [environments, setEnvironments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load environments on mount
  useEffect(() => {
    loadEnvironments();
  }, []);

  const loadEnvironments = async () => {
    try {
      setLoading(true);
      const response = await api.env.list();
      
      if (response.success) {
        // If no environments exist, create a default one
        if (response.response.length === 0) {
          const defaultEnv = {
            id: uuidv4(),
            name: 'Default Environment',
            variables: {}
          };
          
          const createResponse = await api.env.save(defaultEnv);
          if (createResponse.success) {
            setEnvironments([createResponse.response]);
            setEnvironment(createResponse.response);
          }
        } else {
          setEnvironments(response.response);
          // If we have environments but none selected, select the first one
          if (!environment) {
            setEnvironment(response.response[0]);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load environments:', error);
      setEnvironments([]); // Ensure environments is always an array even on error
    } finally {
      setLoading(false);
    }
  };

  const createEnvironment = useCallback(async (name) => {
    try {
      const newEnv = {
        id: uuidv4(),
        name,
        variables: {}
      };

      const response = await api.env.save(newEnv);
      if (response.success) {
        setEnvironments(prev => [...prev, response.response]);
        setEnvironment(response.response);
      }
    } catch (error) {
      console.error('Failed to create environment:', error);
    }
  }, [api.env]);

  const switchEnvironment = useCallback(async (envId) => {
    try {
      const response = await api.env.get(envId);
      if (response.success) {
        setEnvironment(response.response);
      }
    } catch (error) {
      console.error('Failed to switch environment:', error);
    }
  }, [api.env]);

  const saveEnvironment = useCallback(async () => {
    if (!environment) return;

    try {
      const response = await api.env.save(environment);
      if (response.success) {
        // Update environments list with the updated environment
        setEnvironments(prev => 
          prev.map(env => 
            env.id === environment.id ? response.response : env
          )
        );
      }
    } catch (error) {
      console.error('Failed to save environment:', error);
    }
  }, [environment, api.env]);

  const deleteEnvironment = useCallback(async (envId) => {
    try {
      const response = await api.env.delete(envId);
      if (response.success) {
        setEnvironments(prev => prev.filter(env => env.id !== envId));
        if (environment?.id === envId) {
          const remainingEnvs = environments.filter(env => env.id !== envId);
          setEnvironment(remainingEnvs.length > 0 ? remainingEnvs[0] : null);
        }
      }
    } catch (error) {
      console.error('Failed to delete environment:', error);
    }
  }, [environment, environments, api.env]);

  const setEnvironmentVariable = useCallback((name, value) => {
    if (!environment) return;

    setEnvironment(prev => {
      const newVariables = { ...prev.variables };
      if (value === undefined) {
        delete newVariables[name];
      } else {
        newVariables[name] = value;
      }

      return {
        ...prev,
        variables: newVariables
      };
    });
  }, [environment]);

  useEffect(() => {
    if (!initialLoadComplete || !storage) return;
  
    const stateToSave = {
      nodes,
      edges,
      nodeCounter,
      nodeSequence,
      timestamp: Date.now(),
    };
  
    // Only save if there's actual state to save
    if (nodes.length > 0 || edges.length > 0 || 
        Object.keys(nodeCounter).length > 0 || 
        Object.keys(nodeSequence).length > 0) {
      
      saveState(storage, stateToSave);
    }
  }, [nodes, edges, nodeCounter, nodeSequence, initialLoadComplete, storage]);

  // Save nodes and edges to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.NODES, JSON.stringify(nodes));
  }, [nodes]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.EDGES, JSON.stringify(edges));
  }, [edges]);

  // Initialize nodes and edges from localStorage
  useEffect(() => {
    const savedNodes = localStorage.getItem(LOCAL_STORAGE_KEYS.NODES);
    const savedEdges = localStorage.getItem(LOCAL_STORAGE_KEYS.EDGES);
    
    if (savedNodes) {
      setNodes(JSON.parse(savedNodes));
    }
    if (savedEdges) {
      setEdges(JSON.parse(savedEdges));
    }
  }, []);

  useEffect(() => {
    if (initialLoadComplete) return;
  
    const initialize = async () => {

      const storageSystem = await initStorage();
      setStorage(storageSystem);
      
      const savedState = await loadState(storageSystem);
      if (savedState) {

        PERSISTED_STATE_KEYS.forEach(key => {
          if (savedState[key]) {
            switch (key) {
              case 'nodes':
                setNodes(savedState[key]);
                break;
              case 'edges':
                setEdges(savedState[key]);
                break;
              case 'nodeCounter':
                setNodeCounter(savedState[key]);
                break;
              case 'nodeSequence':
                setNodeSequence(savedState[key]);
                break;
            }
          }
        });
      }
      
      setInitialLoadComplete(true);
    };
  
    initialize();
  }, [initialLoadComplete]);

  // Update clearWorkflow to clear all persisted state
  const clearWorkflow = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setSelectedNode(null);
    setNodeSequence({});
    setNodeCounter({});
    if (storage) {
      clearState(storage);
    }
  }, [storage]);

  // Clear redo stack when new actions occur
  const addToHistory = useCallback((entry) => {
    setHistory(prev => [...prev, entry]);
    setRedoStack([]); // Clear redo stack on new action
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const undoHistory = useCallback(() => {
    if (!history.length) return;
    
    const lastAction = history[history.length - 1];
    
    // Save action to redo stack before undoing
    setRedoStack(prev => [...prev, lastAction]);
    
    switch (lastAction.type) {
      case 'nodeAdd':
        console.log('undoing nodeAdd', lastAction);
        if (lastAction.node) {
          setNodes(nodes => nodes.filter(n => n.id !== lastAction.nodeId));
        }
        break;
      case 'nodeRemove':
        if (lastAction.node) {
          setNodes(nodes => [...nodes, lastAction.node]);
        }
        break;
      case 'nodePosition':
        if (lastAction.nodeId && lastAction.oldPosition) {
          setNodes(nodes => nodes.map(node => 
            node.id === lastAction.nodeId 
              ? { ...node, position: lastAction.oldPosition }
              : node
          ));
        }
        break;
      case 'edgeAdd':
        if (lastAction.edge) {
          setEdges(edges => edges.filter(e => e.id !== lastAction.edge.id));
        }
        break;
      case 'edgeRemove':
        if (lastAction.edge) {
          setEdges(edges => [...edges, lastAction.edge]);
        }
        break;
      default:
        console.warn('Unknown history action type:', lastAction.type);
    }

    setHistory(prev => prev.slice(0, -1));
  }, [history]);

  const redoHistory = useCallback(() => {
    if (!redoStack.length) return;
    
    const actionToRedo = redoStack[redoStack.length - 1];
    
    switch (actionToRedo.type) {
      case 'nodeAdd':
        if (actionToRedo.node) {
          setNodes(nodes => [...nodes, actionToRedo.node]);
        }
        break;
      case 'nodeRemove':
        if (actionToRedo.node) {
          setNodes(nodes => nodes.filter(n => n.id !== actionToRedo.node.id));
        }
        break;
      case 'nodePosition':
        if (actionToRedo.nodeId && actionToRedo.newPosition) {
          setNodes(nodes => nodes.map(node => 
            node.id === actionToRedo.nodeId 
              ? { ...node, position: actionToRedo.newPosition }
              : node
          ));
        }
        break;
      case 'edgeAdd':
        if (actionToRedo.edge) {
          setEdges(edges => [...edges, actionToRedo.edge]);
        }
        break;
      case 'edgeRemove':
        if (actionToRedo.edge) {
          setEdges(edges => edges.filter(e => e.id !== actionToRedo.edge.id));
        }
        break;
    }

    // Move action back to history
    setHistory(prev => [...prev, actionToRedo]);
    setRedoStack(prev => prev.slice(0, -1));
  }, [redoStack]);

  const generateNodeId = useCallback((type) => {
    // Map node types to 4 letter prefixes
    const typeToPrefix = {
      http: 'HTTP',
      parser: 'PRSR',
      conditional: 'COND',
      iterator: 'ITER',
      fileop: 'FILE',
      prompt: 'PRMT',
      test: 'TEST',
      databaseQuery: 'DBQ',
      format: 'FRMT',
      command: 'CMD',
      rss: 'RSS',
      counter: 'CNTR',
      textDisplay: 'TEXT',
      collector: 'CLCT'
    };

    // Use exact type match instead of toLowerCase()
    const prefix = typeToPrefix[type] || 'NODE';
    const nextCount = (nodeCounter[prefix] || 0) + 1;
    
    setNodeCounter(prev => ({
      ...prev,
      [prefix]: nextCount
    }));
    
    return `${prefix}_${String(nextCount).padStart(2, '0')}`;
  }, [nodeCounter]);

  const updateNodeData = useCallback((nodeId, field, value) => {

    
    setNodes(prevNodes => {
      const newNodes = prevNodes.map(node => {
        if (node.id === nodeId) {
          // Create a new node object with updated data
          const newNode = {
            ...node,
            data: {
              ...node.data,
              [field]: value
            }
          };
          
          // Also update selectedNode if this is the selected node
          if (selectedNode?.id === nodeId) {
            setSelectedNode(newNode);
          }
          
          return newNode;
        }
        return node;
      });
      
      return newNodes;
    });
  }, [selectedNode]);

  const clearSelection = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const updateNodeSequence = useCallback((nodeId, newSequence) => {
    setNodes(prevNodes => {
      const newNodes = prevNodes.map(node => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              sequence: newSequence
            }
          };
        }
        return node;
      });
      return newNodes;
    });
  }, []);

  const incrementSequence = useCallback(() => {
    setSequence(prev => prev + 1);
  }, []);

  const resetSequences = useCallback(() => {
    setNodes(prevNodes => 
      prevNodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          sequence: null
        }
      }))
    );
    setSequence(1);
  }, []);

  const startExecution = useCallback(async () => {
    setIsExecuting(true);
    setExecutingNodeIds(new Set());
    try {
      const executor = new FlowExecutor(
        nodes,
        edges,
        addToHistory,
        addLog,
        setExecutingNodeIds,
        updateNodeData,
        setLastOutput,
        setLastInput,
        setEnvironmentVariable,
        environment,
        httpRequest,
        databaseQuery,
        commandExecute,
        decrypt
      );
      
      const result = await executor.execute(updateNodeSequence, incrementSequence);
      setIsExecuting(false);
      setExecutingNodeIds(new Set());

      
    } catch (error) {
      console.error('Execution failed:', error);
      setIsExecuting(false);
      setExecutingNodeIds(new Set());
    }
  }, [
    nodes,
    edges,
    addToHistory,
    addLog,
    updateNodeSequence,
    incrementSequence,
    updateNodeData,
    setLastOutput,
    setLastInput,
    setEnvironmentVariable,
    environment,
    httpRequest,
    databaseQuery,
    commandExecute,
    decrypt
  ]);

  const pauseExecution = useCallback(() => {
    setIsExecuting(false);
  }, []);

  const stopExecution = useCallback(() => {
    setIsExecuting(false);
    setExecutor(null);
    resetSequences();
  }, [resetSequences]);

  // Handle node changes from React Flow
  const onNodesChange = useCallback((changes) => {
    setNodes((nds) => applyNodeChanges(changes, nds))
    
    changes.forEach(change => {
      let node = null;
      console.log(change.type);
      if (change.type === 'dimensions') {
        node = nodes.find(n => n.id === change.id);
        if (node) { 
          addToHistory({
            type: 'nodeAdd',
            nodeId: change.id,
            node,
            timestamp: Date.now()
          });
        }
      } else if (change.type === 'remove') {
        node = nodes.find(n => n.id === change.id);
        if (node) {
          addToHistory({
            type: 'nodeRemove',
            nodeId: change.id,
            node,
            timestamp: Date.now()
          });
        }
      } else if (change.type === 'position') {
        node = nodes.find(n => n.id === change.id);
        if (node?.position && change.position) {
          addToHistory({
            type: 'nodePosition',
            nodeId: change.id,
            oldPosition: { 
              x: node.position.x || 0, 
              y: node.position.y || 0 
            },
            newPosition: { 
              x: change.position.x || 0, 
              y: change.position.y || 0 
            },
            timestamp: Date.now()
          });
        }
      }
    });
  }, [nodes, addToHistory]);

  // Handle edge changes from React Flow
  const onEdgesChange = useCallback((changes) => {
    setEdges((eds) => applyEdgeChanges(changes, eds));
    
    // Track edge additions and removals
    changes.forEach(change => {
      if (change.type === 'add') {
        setHistory(prev => [...prev, {
          type: 'edgeAdd',
          edge: change.item,
          timestamp: Date.now()
        }]);
      } else if (change.type === 'remove') {
        setHistory(prev => [...prev, {
          type: 'edgeRemove',
          edgeId: change.id,
          edge: edges.find(e => e.id === change.id), // Store full edge for restoration
          timestamp: Date.now()
        }]);
      }
    });
  }, [edges]);

  // Handle new connections
  const onConnect = useCallback((connection) => {
    setEdges((eds) => addEdge(connection, eds));
    setHistory(prev => [...prev, {
      type: 'edgeAdd',
      edge: connection,
      timestamp: Date.now()
    }]);
  }, []);

  const setStartNode = useCallback((nodeId) => {
    setNodes(prevNodes => {
      return prevNodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          isStartNode: node.id === nodeId
        }
      }));
    });
  }, []);

  const updateDiagramState = useCallback(() => {
    // This function will be called whenever the diagram state changes
    console.log('Diagram state updated');
  }, []);

  // Get input data for a node by looking at its previous nodes' outputs
  const getNodeInputData = useCallback((nodeId) => {
    const previousNodes = findPreviousNodes(nodeId, nodes, edges);
    
    const inputData = previousNodes.reduce((acc, node) => {
      if (node.data?.response) {
        if (typeof node.data.response === 'object' && node.data.response !== null) {
          return { ...acc, ...node.data.response };
        }
        return { ...acc, [node.id]: node.data.response };
      }
      return acc;
    }, {});

    return inputData;
  }, [nodes, edges]);

  // Add a method to get the last output for a specific node
  const getNodeOutput = useCallback((nodeId) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) {
      console.warn(`Node not found: ${nodeId}`);
      return null;
    }
    
    // Return the node's last output from its data
    return node.data?.result?.response || null;
  }, [nodes]);

  // Update keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Check for Undo (CTRL/CMD + Z)
      if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        undoHistory();
      }
      if ((event.ctrlKey || event.metaKey) && event.key === 'Z') {
        event.preventDefault();
        redoHistory();
      }
    };

    // Add event listener
    window.addEventListener('keydown', handleKeyDown);

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [undoHistory, redoHistory]);

  useEffect(() => {
    const executor = new FlowExecutor(
      nodes,
      edges,
      addToHistory,
      addLog,
      setExecutingNodeIds,
      updateNodeData,
      setLastOutput,
      setLastInput,
      setEnvironmentVariable,
      environment,
      httpRequest
    );
    setExecutor(executor);
  }, [nodes, edges, environment, httpRequest, decrypt, addToHistory, addLog, setExecutingNodeIds, updateNodeData, setLastOutput, setLastInput, setEnvironmentVariable]);

  const value = useMemo(() => ({
    nodes,
    edges,
    setNodes,
    setEdges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    history,
    redoStack,
    selectedNode,
    setSelectedNode,
    addToHistory,
    clearHistory,
    generateNodeId,
    updateNodeData,
    clearSelection,
    isExecuting,
    executingNodeIds,
    setIsExecuting,
    startExecution,
    pauseExecution,
    stopExecution,
    updateNodeSequence,
    incrementSequence,
    sequence,
    resetSequences,
    setStartNode,
    updateDiagramState,
    nodeSequence,
    setNodeSequence,
    getNodeInputData,
    clearWorkflow,
    edgeType,
    setEdgeType,
    stepDelay,
    setStepDelay,
    background,
    setBackground,
    showMinimap,
    setShowMinimap,
    environment,
    setEnvironmentVariable,
    removeEnvironmentVariable: deleteEnvironment,
    clearEnvironment: deleteEnvironment,
    setEnvironmentDescription: createEnvironment,
    lastInput,
    lastOutput,
    setLastOutput,
    utilityDrawerOpen,
    setUtilityDrawerOpen,
    sidebarOpen,
    setSidebarOpen,
    autoOpenDrawer,
    setAutoOpenDrawer,
    autoCloseDrawer,
    setAutoCloseDrawer,
    getNodeOutput,
    undoHistory,
    redoHistory,
    environments,
    loading,
    createEnvironment,
    switchEnvironment,
    saveEnvironment,
    deleteEnvironment,
  }), [
    nodes,
    edges,
    setNodes,
    setEdges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    history,
    redoStack,
    selectedNode,
    setSelectedNode,
    addToHistory,
    clearHistory,
    generateNodeId,
    updateNodeData,
    clearSelection,
    isExecuting,
    executingNodeIds,
    setIsExecuting,
    startExecution,
    pauseExecution,
    stopExecution,
    updateNodeSequence,
    incrementSequence,
    sequence,
    resetSequences,
    setStartNode,
    updateDiagramState,
    nodeSequence,
    setNodeSequence,
    getNodeInputData,
    clearWorkflow,
    edgeType,
    stepDelay,
    setStepDelay,
    background,
    showMinimap,
    environment,
    setEnvironmentVariable,
    deleteEnvironment,
    lastInput,
    lastOutput,
    setLastOutput,
    utilityDrawerOpen,
    setUtilityDrawerOpen,
    sidebarOpen,
    setSidebarOpen,
    autoOpenDrawer,
    setAutoOpenDrawer,
    autoCloseDrawer,
    setAutoCloseDrawer,
    getNodeOutput,
    undoHistory,
    redoHistory,
    environments,
    loading,
    createEnvironment,
    switchEnvironment,
    saveEnvironment,
  ]);

  return (
    <FlowContext.Provider value={value}>
      {children}
    </FlowContext.Provider>
  );
};

export default FlowProvider;
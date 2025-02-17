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
import { openDB } from 'idb';

const STORAGE_KEY = 'workflow_data';

// Add this constant for state properties we want to persist
const PERSISTED_STATE_KEYS = [
  'nodes',
  'edges',
  'nodeCounter',
  'nodeSequence',
];

const DB_NAME = 'workflow_db';
const STORE_NAME = 'workflow_store';
const DB_VERSION = 1;

const LOCAL_STORAGE_KEYS = {
  NODES: 'flowNodes',
  EDGES: 'flowEdges',
  ENVIRONMENT: 'flowEnvironment'
};

export const DiagramContext = createContext(null);

export const useDiagram = () => {
  const context = useContext(DiagramContext);
  if (!context) {
    throw new Error('useDiagram must be used within a DiagramProvider');
  }
  return context;
};

export const DiagramProvider = ({ children }) => {
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
  const [autoCloseDrawer, setAutoCloseDrawer] = useState(true);

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

  useEffect(() => {
    // track lastInput changes
    console.log('lastInput changed:', lastInput);
  }, [lastInput]);
  
  // Update environment variable and persist to localStorage
  const setEnvironmentVariable = useCallback((name, value) => {
    setEnvironment(prev => {
      const newEnv = {
        ...prev,
        variables: {
          ...prev.variables,
          [name]: value
        }
      };

      // Remove the variable if value is undefined
      if (value === undefined) {
        delete newEnv.variables[name];
      }

      // Save to localStorage
      localStorage.setItem(LOCAL_STORAGE_KEYS.ENVIRONMENT, JSON.stringify(newEnv));
      return newEnv;
    });
  }, []);

  const removeEnvironmentVariable = useCallback((key) => {
    setEnvironment(prev => {
      const newVars = { ...prev.variables };
      delete newVars[key];
      return {
        ...prev,
        variables: newVars
      };
    });
  }, []);

  const clearEnvironment = useCallback(() => {
    setEnvironment({
      variables: {},
      description: 'Default Environment'
    });
  }, []);

  const setEnvironmentDescription = useCallback((description) => {
    setEnvironment(prev => ({
      ...prev,
      description
    }));
  }, []);

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

  // Create a new executor instance when nodes, edges, or environment changes
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
      environment
    );
    setExecutor(executor);
  }, [nodes, edges, environment]);

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


  const addToHistory = useCallback((entry) => {
    setHistory(prev => [...prev, entry]);
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

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
      rss: 'RSS'
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
        environment
      );
      
      const result = await executor.execute(updateNodeSequence, incrementSequence);
      setIsExecuting(false);
      setExecutingNodeIds(new Set());
      
    } catch (error) {
      console.error('Execution failed:', error);
      setIsExecuting(false);
      setExecutingNodeIds(new Set());
    }
  }, [nodes, edges, addToHistory, addLog, updateNodeSequence, incrementSequence, updateNodeData, setLastOutput, setLastInput, setEnvironmentVariable, environment]);

  const pauseExecution = useCallback(() => {
    setIsExecuting(false);
  }, []);

  const stopExecution = useCallback(() => {
    setIsExecuting(false);
    setExecutor(null);
    resetSequences();
  }, [resetSequences]);

  // Handle node changes from React Flow
  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  // Handle edge changes from React Flow
  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  // Handle new connections
  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    []
  );

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

    console.log('Input data for node', nodeId, ':', inputData);
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

  const value = useMemo(() => ({
    nodes,
    edges,
    setNodes,
    setEdges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    history,
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
    removeEnvironmentVariable,
    clearEnvironment,
    setEnvironmentDescription,
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
  }), [
    nodes,
    edges,
    setNodes,
    setEdges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    history,
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
    removeEnvironmentVariable,
    clearEnvironment,
    setEnvironmentDescription,
    lastInput,
    lastOutput,
    utilityDrawerOpen,
    setUtilityDrawerOpen,
    sidebarOpen,
    setSidebarOpen,
    autoOpenDrawer,
    setAutoOpenDrawer,
    autoCloseDrawer,
    setAutoCloseDrawer,
    getNodeOutput,
  ]);

  return (
    <DiagramContext.Provider value={value}>
      {children}
    </DiagramContext.Provider>
  );
};

export default DiagramProvider;
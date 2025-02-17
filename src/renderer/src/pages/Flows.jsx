import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import ReactFlow, { 
  Controls, 
  Background,
  ReactFlowProvider,
  useReactFlow,
  MiniMap
} from 'reactflow';
import 'reactflow/dist/style.css';
import { cn } from '../utils';
import { useTheme } from '../contexts/ThemeContext';
import DiagramPalette from '../components/diagram/DiagramPalette';
import PositionableEdge from '../components/diagram/PositionableEdge';
import { DiagramProvider, useDiagram } from '../contexts/DiagramContext';
import { LoggerProvider } from '../contexts/LoggerContext';
import UtilityDrawer from '../components/diagram/utility/UtilityDrawer';
import ContextMenu from '../components/diagram/ContextMenu';
import { paletteItems, getNodeTypes } from '../constants/nodeTypes';

function DiagramContent() {
  const reactFlowWrapper = useRef(null);
  const { screenToFlowPosition } = useReactFlow();
  const { 
    nodes, 
    setNodes, 
    edges, 
    setEdges, 
    onNodesChange, 
    onEdgesChange, 
    onConnect,
    setSelectedNode,
    updateNodeData,
    updateDiagramState,
    background,
    sidebarOpen,
  } = useDiagram();
  const { isDark } = useTheme();
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  
  const nodeTypes = useMemo(() => getNodeTypes(), []);
  const edgeTypes = useMemo(() => ({
    default: PositionableEdge,
  }), []);

  const onDrop = useCallback((event) => {
    event.preventDefault();

    const itemData = event.dataTransfer.getData('application/diagram-node');
    if (!itemData || !reactFlowWrapper.current || !reactFlowInstance) return;

    const item = JSON.parse(itemData);
    const position = reactFlowInstance.screenToFlowPosition({
      x: event.clientX,
      y: event.clientY
    });

    const newNode = {
      id: item.id,
      type: item.type,
      position,
      data: {
        ...item.data,
        onChange: updateNodeData
      }
    };

    setNodes((nds) => nds.concat(newNode));
    updateDiagramState();
  }, [reactFlowInstance, setNodes, updateDiagramState, updateNodeData]);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Add node selection handler
  const onSelectionChange = useCallback(({ nodes: selectedNodes }) => {
    // We'll only show config for single node selection

    if (selectedNodes?.length === 1 && selectedNodes[0]?.id !== undefined) {
      setSelectedNode(selectedNodes[0]);
    } else {
      setSelectedNode(null);
    }
  }, [setSelectedNode]);

  // Add node click handler for single node selection
  const onNodeClick = useCallback((_, node) => {
    setSelectedNode(node);
  }, [setSelectedNode]);

  // Handle context menu
  const onContextMenu = useCallback(
    (event, element) => {
      event.preventDefault();
      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      
      setContextMenu({
        id: element.id,
        type: element.type, // 'node' or 'edge'
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });
    },
    []
  );

  const onEdgeUpdate = useCallback((oldEdge, newConnection) => {
    onEdgesChange([
      { 
        type: 'remove', 
        id: oldEdge.id 
      }
    ]);
    onConnect(newConnection);
  }, [onEdgesChange, onConnect]);

  return (<div className={cn(
    "h-full absolute top-0 left-0 m-0 p-0",
    sidebarOpen ? "w-[calc(100vw-200px)]" : "w-[calc(100vw-72px)]"
  )}>
      <div className="absolute inset-0 bg-[var(--background)]">

        <UtilityDrawer/>
        <div className="absolute inset-0" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onEdgeUpdate={onEdgeUpdate}
            onInit={setReactFlowInstance}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onSelectionChange={onSelectionChange}
            onNodeClick={onNodeClick}
            onNodeContextMenu={(_, node) => onContextMenu(_, { ...node, type: 'node' })}
            fitView={false}
            defaultViewport={{ x: 0, y: 0, zoom: 1 }}
            minZoom={0.5}
            maxZoom={2}
            className={cn(
              "m-0 p-0",
              isDark ? 'bg-slate-800' : 'bg-[#ffffff]'
            )}
            snapToGrid={true}
            snapGrid={[10, 10]}
            deleteKeyCode="Delete"
            multiSelectionKeyCode="Control"
            selectionKeyCode="Shift"
            connectOnClick={true}
            connectionMode="strict"
            edgesUpdatable={true}
            edgesFocusable={true}
            selectNodesOnDrag={false}
          >
            {background !== 'none' && (
              <Background
                variant={background}
                gap={20}
                size={1}
                color={
                  isDark  
                  ? background === 'dots' ? "rgba(203, 213, 225, 0.5)" : "rgba(203, 213, 225, 0.1)"
                  : background === 'dots' ? "rgba(0, 0, 0, 0.8)" : "rgba(0, 0, 0, 0.2)"
                }
              />
            )}
          </ReactFlow>

          <div className={cn(
            "absolute top-0 z-10 transition-all duration-300",
            "left-0"
          )}>
            <DiagramPalette items={paletteItems} />
          </div>

          {contextMenu && (
            <ContextMenu
              x={contextMenu.x}
              y={contextMenu.y}
              type={contextMenu.type}  // Verify this is being passed
              onClose={() => setContextMenu(null)}
              onDelete={() => {
                console.log('Deleting:', contextMenu.type, contextMenu.id);  // Debug log
                if (contextMenu.type === 'edge') {
                  onEdgesChange([{ 
                    type: 'remove', 
                    id: contextMenu.id 
                  }]);
                } else {
                  onNodesChange([{ 
                    type: 'remove', 
                    id: contextMenu.id 
                  }]);
                }
                setContextMenu(null);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function Diagrams() {
  return (
    <ReactFlowProvider>
        <DiagramContent />
    </ReactFlowProvider>
  );
} 
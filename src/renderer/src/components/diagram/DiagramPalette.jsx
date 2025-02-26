import { memo, useState, useMemo, useEffect } from 'react';
import { Controls } from 'reactflow';
import { 
  Play, 
  Loader2,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Undo2,
  Redo2,
  Save,
  Trash,
  FolderOpen,
  FilePlus,
} from 'lucide-react';
import { cn } from '../../utils';
import { useFlow } from '../../contexts/FlowContext';
import { useTheme } from '../../contexts/ThemeContext';
import Button from '../common/Button';
import Select from '../common/Select';
import Toggle from '../common/ToggleButton';
import Input from '../common/Input';
import { NODE_TYPES, NODE_CATEGORIES } from '../../constants/nodeTypes';
import { useApi } from '../../contexts/ApiContext';
import IconButton from '../common/IconButton';
import SaveFlowModal from './modals/SaveFlowModal';
import OpenFlowModal from './modals/OpenFlowModal';
import ConfirmDialog from './modals/ConfirmDialog';

const DiagramPalette = memo(({ items = [] }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOptionsExpanded, setIsOptionsExpanded] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [openModalVisible, setOpenModalVisible] = useState(false);
  const [pendingNewWorkflow, setPendingNewWorkflow] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [templates, setTemplates] = useState([]);

  const { 
    nodes,
    edges,
    isExecuting, 
    startExecution,
    generateNodeId,
    edgeType,
    setEdgeType,
    background,
    setBackground,
    clearWorkflow,
    autoOpenDrawer,
    setAutoOpenDrawer,
    autoCloseDrawer,
    setAutoCloseDrawer,
    stepDelay,
    setStepDelay,
    undoHistory,
    redoHistory,
    history,
    redoStack,
    setNodes,
    setEdges,
  } = useFlow();
  const { isDark } = useTheme();
  const api = useApi();

  const groupedItems = useMemo(() => {
    if (!searchQuery) {
      // Group by category when no search
      const groups = Object.entries(NODE_CATEGORIES).map(([categoryId, category]) => ({
        id: categoryId,
        category: category.label,
        color: category.color,
        items: items.filter(item => {
          const nodeType = NODE_TYPES[item.type];
          return nodeType && nodeType.category === categoryId;
        }).map(item => ({
          ...item,
          id: `${categoryId}-${item.type}`
        }))
      }));

      // Add templates as a separate category if we have any
      if (templates.length > 0) {
        groups.push({
          id: 'templates',
          category: 'Templates',
          color: 'blue',
          items: templates.map(template => ({
            id: `template-${template.id}`,
            type: template.type,
            label: template.name,
            description: template.description,
            isTemplate: true,
            templateData: template
          }))
        });
      }

      return groups;
    }

    // When searching, show flat list of filtered items
    const filteredItems = [
      ...items.map(item => ({
        ...item,
        id: `search-${item.type}`
      })),
      ...templates.map(template => ({
        id: `search-template-${template.id}`,
        type: template.type,
        label: template.name,
        description: template.description,
        isTemplate: true,
        templateData: template
      }))
    ].filter(item => 
      item.label.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return [{
      id: 'search-results',
      category: 'Search Results',
      items: filteredItems
    }];
  }, [items, searchQuery, templates]);

  const handleDragStart = (event, item) => {
    if (item.isTemplate) {
      // Handle template drag
      const nodeData = {
        id: generateNodeId(item.type),
        type: item.type,
        data: {
          ...item.templateData.data,
          label: item.label,
          description: item.description
        }
      };
      event.dataTransfer.setData('application/diagram-node', JSON.stringify(nodeData));
    } else {
      // Handle regular node drag (existing code)
      const nodeId = generateNodeId(item.type);
      const nodeData = {
        id: nodeId,
        type: item.type,
        data: {
          label: item.label,
          description: item.description,
          color: NODE_TYPES[item.type]?.color,
          ...NODE_TYPES[item.type]?.defaultData
        }
      };
      event.dataTransfer.setData('application/diagram-node', JSON.stringify(nodeData));
    }
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleSave = async () => {
    try {
      // Check if flow exists in storage
      const flowData = localStorage.getItem('currentFlow');
      if (!flowData) {
        // First time save - show modal
        setSaveModalOpen(true);
        return;
      }

      // Regular save - update existing flow
      const parsedFlow = JSON.parse(flowData);
      await api.flow.save({
        ...parsedFlow,
        nodes,
        edges,
        timestamp: Date.now()
      });

    } catch (error) {
      console.error('Failed to save workflow:', error);
    }
  };

  const handleNewWorkflow = async () => {
    if (nodes.length > 0) {
      setPendingAction('new');
      setConfirmDialogOpen(true);
      return;
    }
    
    // No changes to save, just create new
    clearWorkflow();
    localStorage.removeItem('currentFlow');
  };

  const handleSaveNew = async (flowInfo) => {
    try {
      console.log('Saving flow with data:', flowInfo);
      
      const flowData = {
        ...flowInfo,
        nodes,
        edges,
        timestamp: Date.now()
      };
      
      console.log('Full flow data being sent:', flowData);
      
      const result = await api.flow.save(flowData);
      
      if (result.success) {
        // Update the flow with the assigned ID
        flowData.id = result.flowId;
        localStorage.setItem('currentFlow', JSON.stringify(flowData));
        setSaveModalOpen(false);

        if (pendingNewWorkflow) {
          clearWorkflow();
          localStorage.removeItem('currentFlow');
          setPendingNewWorkflow(false);
        }
      }
    } catch (error) {
      console.error('Failed to save workflow:', error);
    }
  };

  const loadFlow = async (flow) => {
    try {
      clearWorkflow();
      // Pass just the ID to openFlow
      const loadedFlow = await api.flow.get(flow.dataValues.id);
      console.log('loadedFlow', loadedFlow);
      
      if (loadedFlow.success) {
        // Set nodes and edges from the loaded flow
        setNodes(loadedFlow.response.nodes || []);
        setEdges(loadedFlow.response.edges || []);
        localStorage.setItem('currentFlow', JSON.stringify(loadedFlow.response));
        setOpenModalVisible(false);
      }
    } catch (error) {
      console.error('Failed to open workflow:', error);
    }
  };

  const handleOpenFlow = async (flow) => {
    console.log('handleOpenFlow', flow);
    if (nodes.length > 0) {
      setPendingAction({ type: 'open', flow });
      setConfirmDialogOpen(true);
      return;
    }
    
    // No changes to save, just open
    await loadFlow(flow);
  };

  const handleConfirmResponse = async (saveChanges) => {
    try {
      if (saveChanges) {
        // User clicked Yes - save changes
        const currentFlow = localStorage.getItem('currentFlow');
        if (currentFlow) {
          // Update existing flow
          const flowData = JSON.parse(currentFlow);
          await api.flow.save({
            ...flowData,
            nodes,
            edges,
            timestamp: Date.now()
          });
        } else {
          // New unsaved workflow
          setPendingNewWorkflow(true);
          setSaveModalOpen(true);
          return;
        }
      }
      // User clicked No - proceed without saving
      
      if (pendingAction === 'new') {
        clearWorkflow();
        localStorage.removeItem('currentFlow');
      } else if (pendingAction?.type === 'open') {
        await loadFlow(pendingAction.flow);
      }
    } catch (error) {
      console.error('Failed to handle action:', error);
    } finally {
      setConfirmDialogOpen(false);
      setPendingAction(null);
    }
  };

  const canExecute = nodes.length > 0;

  useEffect(() => {
    console.log('DiagramPalette mounted, loading templates...');
    loadTemplates();

    // Add listener for template saves
    const handleTemplateSaved = () => {
      console.log('Template saved event received, reloading templates...');
      loadTemplates();
    };

    window.addEventListener('template-saved', handleTemplateSaved);
    return () => window.removeEventListener('template-saved', handleTemplateSaved);
  }, []);

  const loadTemplates = async () => {
    try {
      const result = await api.nodeTemplate.list();
      
      if (result.success && Array.isArray(result.data)) {
        setTemplates(result.data);
      } else {
        console.error('Invalid template data:', result);
        setTemplates([]);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      setTemplates([]);
    }
  };

  // Add this to verify templates state updates
  useEffect(() => {
    console.log('Templates state updated:', templates);
  }, [templates]);

  return (
    <>
      <div className={cn(
        expanded ? "w-[320px]" : "w-[50px]",
        "h-[calc(100vh-40px)]",
        "flex flex-col",
        "bg-[var(--background)]",
        "border border-slate-600",
        "shadow-lg overflow-hidden transition-all duration-300 ease-in-out border-t-0 border-b-0",
        isDark ? "bg-slate-800" : "bg-slate-300"
      )}>
        {/* Action Buttons */}
        <div className="h-[50px] p-3 border-b border-[var(--border)] flex items-center justify-center gap-2 bg-slate-800">
          

          <Button
            size="xs"
            variant="attached"
            color="green"
            fullWidth
            onClick={startExecution}
            disabled={!canExecute || isExecuting}
          >
            {isExecuting ? <Loader2 className="animate-spin" /> : <Play className="w-4 h-4" />}
          </Button>

          <Button
            size="xs"
            variant="attached"
            color="blue"
            fullWidth
            onClick={undoHistory}
            disabled={isExecuting || !history.length}
          >
            <Undo2 className="w-4 h-4" />
          </Button>

          <Button
            size="xs"
            variant="attached"
            color="blue"
            fullWidth
            onClick={redoHistory}
            disabled={isExecuting || !redoStack?.length}
          >
            <Redo2 className="w-4 h-4" />
          </Button>

          <Button
            size="xs"
            variant="attached"
            color="white"
            fullWidth
            onClick={handleNewWorkflow}
            disabled={isExecuting}
          >
            <FilePlus className="w-4 h-4" />
          </Button>

          <Button
            size="xs"
            variant="attached"
            color="yellow"
            fullWidth
            onClick={handleSave}
            disabled={!canExecute || isExecuting}
          >
            <Save className="w-4 h-4" />
          </Button>

          <Button
            size="xs"
            variant="attached"
            color="purple"
            fullWidth
            onClick={() => setOpenModalVisible(true)}
            disabled={isExecuting}
          >
            <FolderOpen className="w-4 h-4" />
          </Button>

          <Button
            size="xs"
            variant="attached"
            color="red"
            fullWidth
            onClick={() => {
              if (window.confirm('Are you sure you want to clear the workflow? This cannot be undone.')) {
                clearWorkflow();
              }
            }}
            disabled={!canExecute || isExecuting}
          >
            <Trash className="w-4 h-4" />
          </Button>
        </div>

        {/* Node Types Header */}
        <div className="h-[50px] p-3 border-b border-[var(--border)] flex items-center w-full relative">
          {expanded && <h3 className="font-medium text-organge-500">Node Types</h3>}
          <div 
            className="absolute right-0 top-0 h-full border-l border-slate-800 w-[50px] bg-slate-400 flex items-center justify-center"
            onClick={() => setExpanded(!expanded)}
          >
            <ChevronLeft 
              size={20} 
              className={cn(
                "text-slate-700 transition-all duration-300 ease-in-out",
                !expanded && "rotate-180"
              )}
            />
          </div>
        </div>

        {/* Search Bar */}
        <div className="h-[50px] p-3 border-b flex items-center">
          {expanded && (
            <Input
              placeholder="Search nodes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              variant="filled"
              fullWidth
            />
          )}
        </div>

        {/* Nodes Section */}
        <div className="flex-1 overflow-y-auto" style={{ height: 'calc(60% - 150px)' }}>
          {expanded && (
            <div className="space-y-4 p-2">
            {groupedItems.map(group => (
              <div key={group.id} className="space-y-2">
                {/* Category Header */}
                <div className={cn(
                  "text-xs font-bold dark:font-light font-mono px-2",
                  isDark ? `text-semantic-${group.color || 'slate'}` : `text-slate-900`
                )}>
                  {group.category}
                </div>

                {/* Category Items */}
                {group.items.length === 0 ? (
                  <div className="text-center text-sm text-slate-500 py-2">
                    No nodes available
                  </div>
                ) : (
                  group.items.map((item) => {
                    const Icon = item.icon;
                    const nodeType = NODE_TYPES[item.type];
                    const color = nodeType?.category ? NODE_CATEGORIES[nodeType.category].color : 'slate';
                    
                    return (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, item)}
                        className={cn(
                          "flex items-center gap-3 p-3",
                          isDark ? "bg-slate-700" : "bg-slate-100",
                          "border-8 border-double border-slate-300 dark:border-slate-800",
                          "rounded-md cursor-move",
                          "transition-all duration-200 ease-in-out",
                          `hover:scale-102`
                        )}
                      >
                        {Icon && (
                          <div className={cn(
                            "w-8 h-8",
                            "flex items-center justify-center",
                            "rounded",
                            `text-semantic-${color}`
                          )}>
                            <Icon size={20} />
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-sm">{item.label}</div>
                          <div className="text-xs text-[var(--foreground)]/60">
                            {item.description}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Options Section */}
        <div className={cn(
          "transition-all duration-300 ease-in-out",
          "border-t border-[var(--border)]"
        )}>
          {expanded && (
          <div 
            className={cn(
              "h-[50px] p-3 flex items-center",
              "justify-between cursor-pointer",
              "hover:bg-slate-700/50",
              "border-b border-[var(--border)]"
            )}
            onClick={() => setIsOptionsExpanded(!isOptionsExpanded)}
          >
            <h3 className="font-medium">Options</h3>
            <ChevronDown
              className={cn(
                "transition-transform duration-300",
                !isOptionsExpanded && "rotate-180"
              )}
              size={20}
            />
          </div>
          )}

          {/* Options Content */}
          <div className={cn(
            "overflow-hidden transition-all duration-300",
            isOptionsExpanded ? "h-[220px]" : "h-0"
          )}>
            <div className="p-3 space-y-4 overflow-y-auto h-full">
              <div>
                <label className="text-sm mb-1 block">Line Style</label>
                <Select
                  value={edgeType || 'smoothstep'}
                  onChange={(value) => setEdgeType(value)}
                  options={[
                    { value: 'default', label: 'Bezier' },
                    { value: 'straight', label: 'Straight' },
                    { value: 'step', label: 'Step' },
                    { value: 'smoothstep', label: 'Smooth Step' },
                    { value: 'simplebezier', label: 'Simple Bezier' },
                  ]}
                  variant="filled"
                  fullWidth
                />
              </div>
              <div>
                <label className="text-sm mb-1 block">Background</label>
                <Select
                  value={background}
                  onChange={(value) => setBackground(value)}
                  options={[
                    { value: 'lines', label: 'Lines' },
                    { value: 'dots', label: 'Dots' },
                    { value: 'none', label: 'None' },
                  ]}
                  variant="filled"
                  fullWidth
                />
              </div>
              <div>
                <label className="text-sm mb-1 block">Step Delay (ms)</label>
                <Input
                  type="number"
                  min={0}
                  max={5000}
                  value={stepDelay}
                  onChange={(e) => setStepDelay(Math.max(0, parseInt(e.target.value) || 0))}
                  variant="filled"
                  fullWidth
                />
              </div>
              <div>
                <label className="text-sm mb-1 block">Auto Open Drawer on Node Select</label>
                <Toggle
                  selected={autoOpenDrawer}
                  onClick={() => setAutoOpenDrawer(!autoOpenDrawer)}
                />
                <label className="text-sm mb-1 block">Auto Close Drawer</label>
                <Toggle
                  selected={autoCloseDrawer}
                  onClick={() =>  setAutoCloseDrawer(!autoCloseDrawer)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="h-[50px] p-3 border-t border-[var(--border)] flex items-center justify-center w-full bg-slate-200 opacity-80">
          {expanded && <div className="flex items-center gap-2 h-[40px] w-full">
            <Controls 
              className="!flex !flex-row !bg-transparent !shadow-none"
            style={{ 
              display: 'flex',
              gap: '8px',
              padding: 0,
              transform: 'none',
              color: 'white'
            }}
            />
          </div>}
        </div>
      </div>

      <SaveFlowModal
        isOpen={saveModalOpen}
        onClose={() => {
          setSaveModalOpen(false);
          if (pendingNewWorkflow) {
            // If user cancels save during new workflow, just clear everything
            clearWorkflow();
            localStorage.removeItem('currentFlow');
            setPendingNewWorkflow(false);
          }
        }}
        onSave={handleSaveNew}
      />

      <OpenFlowModal
        isOpen={openModalVisible}
        onClose={() => setOpenModalVisible(false)}
        onOpen={handleOpenFlow}
      />

      <ConfirmDialog
        isOpen={confirmDialogOpen}
        onClose={() => {
          setConfirmDialogOpen(false);
          setPendingAction(null);
        }}
        title="Save Changes?"
        message="Do you want to save changes to the current workflow?"
        onYes={() => handleConfirmResponse(true)}
        onNo={() => handleConfirmResponse(false)}
        onCancel={() => {
          setConfirmDialogOpen(false);
          setPendingAction(null);
        }}
      />
    </>
  );
});

DiagramPalette.displayName = 'DiagramPalette';

export default DiagramPalette;
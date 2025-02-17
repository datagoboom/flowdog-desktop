import { memo, useState, useMemo } from 'react';
import { Controls } from 'reactflow';
import { 
  Play, 
  Loader2,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Trash,
} from 'lucide-react';
import { cn } from '../../utils';
import { useDiagram } from '../../contexts/DiagramContext';
import { useTheme } from '../../contexts/ThemeContext';
import Button from '../common/Button';
import Select from '../common/Select';
import Toggle from '../common/ToggleButton';
import Input from '../common/Input';
import { NODE_TYPES, NODE_CATEGORIES } from '../../constants/nodeTypes';

const DiagramPalette = memo(({ items = [] }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOptionsExpanded, setIsOptionsExpanded] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const { 
    nodes,
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
  } = useDiagram();
  const { isDark } = useTheme();

  const groupedItems = useMemo(() => {
    if (!searchQuery) {
      // Group by category when no search
      return Object.entries(NODE_CATEGORIES).map(([categoryId, category]) => ({
        category: category.label,
        color: category.color,
        items: items.filter(item => {
          const nodeType = NODE_TYPES[item.type];
          return nodeType && nodeType.category === categoryId;
        })
      }));
    }

    // When searching, show flat list of filtered items
    const query = searchQuery.toLowerCase();
    const filteredItems = items.filter(item => 
      item.label.toLowerCase().includes(query) || 
      item.description.toLowerCase().includes(query)
    );
    
    return [{
      category: 'Search Results',
      items: filteredItems
    }];
  }, [items, searchQuery]);

  const handleDragStart = (event, item) => {
    // Generate a unique ID for the new node
    const nodeId = generateNodeId(item.type);
    
    const nodeData = {
      id: nodeId,
      type: item.type,
      data: {
        label: item.label,
        description: item.description,
        color: NODE_TYPES[item.type]?.color,

        ...(item.type === 'http' && {
          method: 'GET',
          url: '',
          headers: [],
          params: []
        }),
        ...(item.type === 'format' && {
          template: ''
        }),
        ...(item.type === 'fileop' && {
          operation: 'read',
          fileName: ''
        }),
        ...(item.type === 'parser' && {
          parser: 'json',
          mode: 'json',
          template: 'data',
        }),
        ...(item.type === 'iterator' && {
          outputList: []
        })
      }
    };

    event.dataTransfer.setData('application/diagram-node', JSON.stringify(nodeData));
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleClearWorkflow = () => {
    if (window.confirm('Are you sure you want to clear the workflow? This cannot be undone.')) {
      clearWorkflow();
    }
  };

  // Check if we have any nodes to execute
  const canExecute = nodes.length > 0;

  return (
    <div className={cn(
      expanded ? "w-[280px]" : "w-[50px]",
      "h-[calc(100vh-40px)]",
      "flex flex-col",
      "bg-[var(--background)]",
      "border border-slate-600",
      "shadow-lg overflow-hidden transition-all duration-300 ease-in-out border-t-0 border-b-0",
      isDark ? "bg-slate-800" : "bg-slate-300"
    )}>
      {/* Execute Button */}
      <div className="h-[50px] p-3 border-b border-[var(--border)] flex items-center bg-aqua-500 dark:bg-slate-800 dark:hover:bg-slate-700">
        <Button
          size="sm"
          variant="text"
          color={isDark ? "aqua" : "white"}
          fullWidth
          startIcon={isExecuting ? <Loader2 className="animate-spin" /> : <Play />}
          onClick={startExecution}
          disabled={!canExecute || isExecuting}
        >
         {expanded ? "Execute" : ""}
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
            <div key={group.category} className="space-y-2">
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
                      key={item.type}
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

      {/* Clear Workflow Button */}
      <div className="h-[50px] p-3 border-t border-[var(--border)] flex items-center justify-center bg-red-700 dark:bg-slate-800 dark:hover:bg-slate-700">
        <Button 
          size="sm"
          variant="text"
          color="red"
          onClick={handleClearWorkflow}
          startIcon={<Trash size={20} />}
          fullWidth
        >
          {expanded ? "Clear Workflow" : ""}
        </Button>
      </div>
    </div>
  );
});

DiagramPalette.displayName = 'DiagramPalette';

export default DiagramPalette;
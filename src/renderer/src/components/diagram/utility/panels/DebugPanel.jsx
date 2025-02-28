import { memo, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useFlow } from '../../../../contexts/FlowContext';
import { Body1, Body2 } from '../../../common/Typography';
import { cn } from '../../../../utils';

// Properties to exclude from the debug view
const EXCLUDED_PROPS = new Set([
  'selected', 'dragging', 'positionAbsolute', 'width', 'height'
]);

const TreeNode = memo(({ label, value, depth = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(true);  // Default to expanded
  
  // Filter and transform the value if it's a node
  const processValue = (val) => {
    if (typeof val === 'object' && val !== null) {
      const processed = {};
      Object.entries(val).forEach(([key, v]) => {
        if (!EXCLUDED_PROPS.has(key)) {
          processed[key] = v;
        }
      });
      return processed;
    }
    return val;
  };

  // Handle different value types
  if (value === null) return (
    <div style={{ marginLeft: `${depth * 20}px` }} className="text-slate-400">
      {label}: null
    </div>
  );
  
  if (typeof value !== 'object') return (
    <div style={{ marginLeft: `${depth * 20}px` }}>
      {label}: <span className={cn(
        typeof value === 'string' && 'text-green-600 dark:text-green-400',
        typeof value === 'number' && 'text-blue-600 dark:text-blue-400',
        typeof value === 'boolean' && 'text-purple-600 dark:text-purple-400'
      )}>{JSON.stringify(value)}</span>
    </div>
  );
  
  const processedValue = processValue(value);
  
  if (Array.isArray(processedValue)) {
    return (
      <div style={{ marginLeft: `${depth * 20}px` }}>
        <div 
          className="flex items-center gap-1 cursor-pointer hover:text-semantic-blue"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          {label}: Array({processedValue.length})
        </div>
        {isExpanded && processedValue.map((item, index) => (
          <TreeNode 
            key={index}
            label={`[${index}]`}
            value={item}
            depth={depth + 1}
          />
        ))}
      </div>
    );
  }
  
  return (
    <div style={{ marginLeft: `${depth * 20}px` }}>
      <div 
        className="flex items-center gap-1 cursor-pointer hover:text-semantic-blue"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        {label}: Object
      </div>
      {isExpanded && Object.entries(processedValue).map(([key, val]) => (
        <TreeNode 
          key={key}
          label={key}
          value={val}
          depth={depth + 1}
        />
      ))}
    </div>
  );
});

const DebugPanel = memo(() => {
  const { nodes, edges, environment } = useFlow();

  return (
    <div className="space-y-4">
      <Body1 className="font-medium">Debug Panel</Body1>
      
      {/* Flow Structure Section */}
      <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-sm font-mono h-[100%] overflow-y-auto">
        <Body2 className="font-medium mb-2 border-b border-slate-200 dark:border-slate-700 pb-2">
          Flow Structure
        </Body2>
        <div>
          <div className="space-y-1">
            <TreeNode label="nodes" value={nodes} />
            <TreeNode label="edges" value={edges} />
          </div>
        </div>
      </div>

      
    </div>
  );
});

DebugPanel.displayName = 'DebugPanel';
TreeNode.displayName = 'TreeNode';

export default DebugPanel;
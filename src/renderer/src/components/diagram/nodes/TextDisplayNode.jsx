import { memo, useCallback, useMemo, useEffect, useState} from 'react';
import { Handle, Position } from 'reactflow';
import { FileText } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import { cn } from '../../../utils';
import {useDiagram} from '../../../contexts/DiagramContext';

const TextDisplayNode = memo(({ data, selected, id, isConnectable }) => {
  const { isDark } = useTheme();
  const {lastOutput} = useDiagram();
  const [displayText, setDisplayText] = useState('');


  // Calculate styles based on maxHeight and maxWidth
  const containerStyle = useMemo(() => ({
    maxHeight: data.maxHeight ? `${data.maxHeight}px` : '400px',
    maxWidth: data.maxWidth ? `${data.maxWidth}px` : '600px',
  }), [data.maxHeight, data.maxWidth]);

  const onResizeStart = useCallback((event) => {
    // Prevent dragging while resizing
    event.currentTarget.closest('.react-flow__node').setAttribute('draggable', 'false');
  }, []);

  const onResizeEnd = useCallback((event) => {
    // Re-enable dragging after resize
    event.currentTarget.closest('.react-flow__node').setAttribute('draggable', 'true');
  }, []);

  useEffect(() => {
    if(lastOutput.nodeId === id){
        setDisplayText(lastOutput.data?.response?.outputText);
    }
  }, [lastOutput]);
  
  return (
    <div
      style={containerStyle}
      className={cn(
        "relative min-w-[200px] min-h-[100px]",
        "rounded-xl",
        isDark
          ? "border border-slate-700 bg-slate-800/50"
          : "border border-slate-200 bg-slate-50/50",
        "shadow-lg backdrop-blur-sm",
        "transition-all duration-200",
        "resize overflow-hidden",
        "react-flow__resize-control",
        selected && (isDark
          ? "ring-2 ring-slate-500 ring-offset-2 ring-offset-slate-900"
          : "ring-2 ring-slate-400 ring-offset-2 ring-offset-white"
        ),
      )}
    >
      {/* Glass Highlight Effect */}
      <div className={cn(
        "absolute inset-0 pointer-events-none",
        "bg-gradient-to-br",
        isDark
          ? "from-slate-700/50 via-slate-800/20 to-transparent"
          : "from-white/50 via-slate-100/20 to-transparent",
        "rounded-xl",
        "opacity-30",
      )} />

      {/* Header */}
      <div className={cn(
        "flex items-center gap-2 px-4 py-2",
        isDark
          ? "border-b border-slate-700 bg-slate-800"
          : "border-b border-slate-200 bg-white/50",
        "backdrop-blur-md",
      )}>
        <FileText 
          size={16} 
          className={isDark ? "text-slate-400" : "text-slate-500"} 
        />
        <span className={cn(
          "font-medium text-sm",
          isDark ? "text-slate-300" : "text-slate-600"
        )}>
          {data.name || 'Display'}
        </span>
      </div>

      {/* Updated Content with horizontal overflow hidden */}
      <div className="p-4 h-full overflow-y-auto overflow-x-hidden bg-slate-100 dark:bg-slate-900/70">
        <pre className={cn(
          "font-mono text-sm",
          "whitespace-pre-wrap",
          "leading-relaxed",
          isDark 
            ? "text-aqua-300" 
            : "text-slate-600",
        )}>
          {displayText || 'No output text available'}
        </pre>
      </div>

      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        id={`${id}-target`}
        isConnectable={isConnectable}
        className={cn(
          "w-3 h-3 -translate-x-0.5",
          isDark
            ? "bg-slate-700 border-slate-600"
            : "bg-slate-100 border-slate-300",
          "border-2",
          "backdrop-blur-sm",
          "shadow-sm",
        )}
      />

      {/* Updated Resize Handle */}
      <div 
        className={cn(
          "absolute bottom-2 right-2 w-4 h-4",
          "cursor-se-resize",
          "opacity-30 hover:opacity-70",
          "transition-opacity",
          "react-flow__resize-handle",
          "react-flow__resize-handle-bottom-right"
        )}
        onMouseDown={onResizeStart}
        onMouseUp={onResizeEnd}
        onTouchStart={onResizeStart}
        onTouchEnd={onResizeEnd}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={cn(
            "w-4 h-4",
            isDark ? "text-slate-400" : "text-slate-500"
          )}
        >
          <path d="M22 22L12 22M22 12L22 22" />
        </svg>
      </div>
    </div>
  );
});

TextDisplayNode.displayName = 'TextDisplayNode';

export default TextDisplayNode; 
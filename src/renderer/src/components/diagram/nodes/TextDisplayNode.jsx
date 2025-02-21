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

   useEffect(() => {
    if(lastOutput?.nodeId === id){
        setDisplayText(lastOutput.data?.response?.outputText);
    }
  }, [lastOutput]);
  
  return (
    <div
      style={containerStyle}
      className={cn(
        "bg-slate-100 dark:bg-slate-900/70",
        "relative min-w-[200px]",
        "rounded-xl",
        isDark
          ? "border border-slate-700 bg-slate-800/50"
          : "border border-slate-200 bg-slate-50/50",
        "shadow-lg backdrop-blur-sm",
        "transition-all duration-200",
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
        "rounded-xl",
        isDark
          ? "from-slate-700/50 via-slate-800/20 to-transparent"
          : "from-white/50 via-slate-100/20 to-transparent",
        "rounded-xl",
        "opacity-30",
      )} />


      {/* Updated Content with horizontal overflow hidden */}
      <div className="overflow-y-auto overflow-x-hidden">
        <pre className={cn(
          "font-mono text-sm p-4",
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
          "",
          isDark
            ? "bg-slate-700 border-slate-600"
            : "bg-slate-100 border-slate-300",
          "border-2",
          "shadow-sm",
        )}
      />

      
    </div>
  );
});

TextDisplayNode.displayName = 'TextDisplayNode';

export default TextDisplayNode; 
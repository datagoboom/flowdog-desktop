import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { FileJson } from 'lucide-react';
import BaseNode from './BaseNode';
import { useTheme } from '../../../contexts/ThemeContext';
import { cn } from '../../../utils';

const ParserNode = memo(({ data, selected, id, isConnectable }) => {
  const { isDark } = useTheme();

  return (
    <>
      <BaseNode
        id={id}
        type="parser"
        icon={FileJson}
        color="purple"
        selected={selected}
        data={data}
        isConnectable={isConnectable}
      />
      <Handle
        type="target"
        position={Position.Left}
        id={`${id}-target`}
        isConnectable={isConnectable}
        className={cn(
          "w-3 h-3",
          "border-2 border-cyan-500",
          "bg-cyan-700"
        )}
      />
      
      
      <Handle
        type="source"
        position={Position.Right}
        id={`${id}-source`}
        isConnectable={isConnectable}
        className={cn(
          "w-3 h-3",
          "border-2 border-green-500",
          "bg-green-700"
        )}
      />
    </>
  );
});

ParserNode.displayName = 'ParserNode';

export default ParserNode; 
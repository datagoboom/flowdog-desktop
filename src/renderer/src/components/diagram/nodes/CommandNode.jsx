import { memo } from 'react';
import { Terminal } from 'lucide-react';
import { Handle, Position } from 'reactflow';
import BaseNode from './BaseNode';
import { useTheme } from '../../../contexts/ThemeContext';
import { cn } from '../../../utils';

const CommandNode = memo(({ data, selected, id, isConnectable }) => {
  const { isDark } = useTheme();

  return (
    <>
      
      <BaseNode
        id={id}
        type="command"
        selected={selected}
        data={data}
        isConnectable={isConnectable}
      >
        {data.command && data.command.slice(0, 20) + (data.command.length > 20 ? '...' : '')}
      </BaseNode>
      
      <Handle
        type="target"
        position={Position.Left}
        id={`${id}-target`}
        isConnectable={isConnectable}
        className={cn(
          "w-3 h-3",
          isDark ? "bg-gray-700" : "bg-gray-200"
        )}
      />
      <Handle
        type="source"
        position={Position.Right}
        id={`${id}-source`}
        isConnectable={isConnectable}
        className={cn(
          "w-3 h-3",
          isDark ? "bg-gray-700" : "bg-gray-200"
        )}
      />
    </>
  );
});

CommandNode.displayName = 'CommandNode';

export default CommandNode; 
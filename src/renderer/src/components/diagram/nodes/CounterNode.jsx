import { memo } from 'react';
import { Hash } from 'lucide-react';
import { Handle, Position } from 'reactflow';
import BaseNode from './BaseNode';
import { useTheme } from '../../../contexts/ThemeContext';
import { cn } from '../../../utils';

const CounterNode = memo(({ data, selected, id, isConnectable }) => {
  const { isDark } = useTheme();
  
  // Format the counter display text
  const counterDisplay = `Count: ${data?.incrementor || 0}${data?.limit ? ` / ${data.limit}` : ''}`;
  
  return (
    <>
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
      
      <BaseNode
        id={id}
        type="counter"
        icon={Hash}
        color={data.color}
        selected={selected}
        data={data}
        isConnectable={isConnectable}
      >
        {counterDisplay}
      </BaseNode>
      
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

CounterNode.displayName = 'CounterNode';

export default CounterNode;
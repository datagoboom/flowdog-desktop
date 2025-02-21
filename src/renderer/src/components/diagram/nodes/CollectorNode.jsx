import { memo } from 'react';
import { ListPlus } from 'lucide-react';
import { Handle, Position } from 'reactflow';
import BaseNode from './BaseNode';
import { useTheme } from '../../../contexts/ThemeContext';
import { cn } from '../../../utils';

const CollectorNode = memo(({ data, selected, id, isConnectable }) => {
  const { isDark } = useTheme();

  return (
    <>
      <BaseNode
        id={id}
        type="collector"
        icon={ListPlus}
        color="emerald"
        selected={selected}
        data={data}
        isConnectable={isConnectable}
      >
        {data.collection?.length > 0 ? `Items: ${data.collection?.length}` : ''}
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

CollectorNode.displayName = 'CollectorNode';

export default CollectorNode; 
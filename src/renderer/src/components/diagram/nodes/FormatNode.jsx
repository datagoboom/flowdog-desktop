import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { FileCode } from 'lucide-react';
import BaseNode from './BaseNode';
import { useTheme } from '../../../contexts/ThemeContext';
import { cn } from '../../../utils';

const FormatNode = memo(({ data, selected, id, isConnectable }) => {
  const { isDark } = useTheme();

  return (
    <>
      <BaseNode
        id={id}
        type="format"
        icon={FileCode}
        selected={selected}
        data={data}
      />
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

FormatNode.displayName = 'FormatNode';

export default FormatNode; 
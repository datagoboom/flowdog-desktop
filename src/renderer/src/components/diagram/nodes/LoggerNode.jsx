import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { FileText } from 'lucide-react';
import BaseNode from './BaseNode';
import { useTheme } from '../../../contexts/ThemeContext';
import { cn } from '../../../utils';

const LoggerNode = memo(({ data, selected, id, isConnectable }) => {
  const { isDark } = useTheme();

  const inputHandleStyle = cn(
    "w-3 h-3",
    isDark ? "bg-cyan-700 border-cyan-500" : "bg-cyan-100 border-cyan-500"
  );

  return (
    <>
      <BaseNode
        id={id}
        type="logger"
        icon={FileText}
        color={data?.color}
        selected={selected}
        data={data}
        isConnectable={isConnectable}
      />
      
      <Handle
        type="target"
        position={Position.Top}
        id={`${id}-top`}
        isConnectable={isConnectable}
        className={inputHandleStyle}
      />

      <Handle
        type="target"
        position={Position.Bottom}
        id={`${id}-bottom`}
        isConnectable={isConnectable}
        className={inputHandleStyle}
      />

      <Handle
        type="target"
        position={Position.Right}
        id={`${id}-right`}
        isConnectable={isConnectable}
        className={inputHandleStyle}
      />

      <Handle
        type="target"
        position={Position.Left}
        id={`${id}-left`}
        isConnectable={isConnectable}
        className={inputHandleStyle}
      />
    </>
  );
});

LoggerNode.displayName = 'LoggerNode';

export default LoggerNode; 
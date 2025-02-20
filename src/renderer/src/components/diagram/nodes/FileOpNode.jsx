import { memo } from 'react';
import { FileText } from 'lucide-react';
import { Handle, Position } from 'reactflow';
import BaseNode from './BaseNode';
import { useTheme } from '../../../contexts/ThemeContext';
import { cn } from '../../../utils';

const FileOpNode = memo(({ data, selected, id }) => {
  const { isDark } = useTheme();

  return (
    <>
    <BaseNode
      id={id}
      type="fileop"
      icon={FileText}
      color="orange"
      isConnectable={true}
      selected={selected}
      data={data}
    />

    <Handle
        type="target"
        position={Position.Left}
        id={`${id}-target`}
        isConnectable={true}
        className={cn(
          "handle-left",
          isDark && "handle-input-dark",
          !isDark && "handle-input-light"
        )}
      />
      
      <Handle
        type="source"
        position={Position.Right}
        id={`${id}-source`}
        isConnectable={true}
        className={cn(
          "handle-right",
          isDark && "handle-output-dark",
          !isDark && "handle-output-light"
        )}
      />
    </>
  );

});

FileOpNode.displayName = 'FileOpNode';

export default FileOpNode; 
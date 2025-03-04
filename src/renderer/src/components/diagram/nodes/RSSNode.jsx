import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Rss } from 'lucide-react';
import BaseNode from './BaseNode';
import { useTheme } from '../../../contexts/ThemeContext';
import { cn } from '../../../utils';

const RSSNode = memo(({ data, selected, id, isConnectable }) => {
  const { isDark } = useTheme();

  return (
    <>
      <BaseNode
        id={id}
        type="rss"
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
          "handle-left",
          isDark && "handle-input-dark",
          !isDark && "handle-input-light"
        )}
      />
      <Handle
        type="source"
        position={Position.Right}
        id={`${id}-source`}
        isConnectable={isConnectable}
        className={cn(
          "handle-right",
          isDark && "handle-output-dark",
          !isDark && "handle-output-light"
        )}
      />
    </>
  );
});

RSSNode.displayName = 'RSSNode';

export default RSSNode; 
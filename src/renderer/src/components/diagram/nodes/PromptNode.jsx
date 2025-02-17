import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Sparkles } from 'lucide-react';
import { cn } from '../../../utils';
import BaseNode from './BaseNode';
import { useTheme } from '../../../contexts/ThemeContext';

const PromptNode = memo(({ 
  data, 
  selected,
  id,
  isConnectable 
}) => {
  const { isDark } = useTheme();

  return (
    <>
      <BaseNode
        id={id}
        type="prompt"
        selected={selected}
        data={data}
        isConnectable={isConnectable}
        icon={<Sparkles size={16} className="text-semantic-purple" />}
        label="Prompt"
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

PromptNode.displayName = 'PromptNode';

export default PromptNode; 
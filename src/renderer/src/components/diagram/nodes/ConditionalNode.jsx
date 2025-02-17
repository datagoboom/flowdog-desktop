import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { GitBranch } from 'lucide-react';
import BaseNode from './BaseNode';
import { useTheme } from '../../../contexts/ThemeContext';
import { cn } from '../../../utils';

const ConditionalNode = memo(({ data, selected, id, isConnectable }) => {
  const { isDark } = useTheme();
  const conditions = data.conditions || [];
  
  // Calculate positions for output handles
  const getHandlePosition = (index, total) => {
    // Space them evenly in the top 75% of the node
    const availableSpace = 75;
    const spacing = availableSpace / Math.max(1, total);
    return 12.5 + (index * spacing); // Start at 12.5% to center in the available space
  };

  return (
    <>
      
      <BaseNode
        id={id}
        type="conditional"
        icon={GitBranch}
        color="orange"
        selected={selected}
        data={data}
        isConnectable={isConnectable}
      />
      
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        id={`${id}-target`}
        isConnectable={isConnectable}
        className="handle-left handle-input-dark"
      />

      {conditions.length == 1 && (
        <Handle
          key={`condition-0`}
          type="source"
          position={Position.Right}
          id={`output-0`}
          isConnectable={isConnectable}
          className="handle-right handle-output-dark"
        />
      )}
      {conditions.length > 1 && conditions.map((_, index) => (
        <Handle
          key={`condition-${index}`}
          type="source"
          position={Position.Right}
          id={`output-${index + 1}`}
          isConnectable={isConnectable}
          className="handle-right handle-output-dark"
          style={{
            top: `${getHandlePosition(index, conditions.length - 1)}%`
          }}
        />
      ))}

      {/* Else Handle - Shows up when there's at least one condition */}
      {conditions.length > 0 && (
        <Handle
          type="source"
          position={Position.Bottom}
          id="output-else"
          isConnectable={isConnectable}
          className="handle-bottom handle-output-dark handle-red-dark"
        />
      )}
    </>
  );
});

ConditionalNode.displayName = 'ConditionalNode';

export default ConditionalNode; 
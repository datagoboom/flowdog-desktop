import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { GitBranch } from 'lucide-react';
import BaseNode from './BaseNode';

const ConditionalNode = memo(({ data, selected, id, isConnectable }) => {
  return (
    <>
      <BaseNode
        id={id}
        type="conditional"
        icon={GitBranch}
        color="yellow"
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

      {/* True Path (Top) */}
      <Handle
        type="source"
        position={Position.Right}
        id="output-true"
        isConnectable={isConnectable}
        className="handle-right handle-output-dark"
        style={{ top: '25%' }}
      />

      {/* False Path (Bottom) */}
      <Handle
        type="source"
        position={Position.Right}
        id="output-false"
        isConnectable={isConnectable}
        className="handle-right handle-output-dark handle-red-dark"
        style={{ top: '75%' }}
      />
    </>
  );
});

ConditionalNode.displayName = 'ConditionalNode';

export default ConditionalNode;
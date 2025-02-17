import { memo } from 'react';
import { FileText } from 'lucide-react';
import { Handle, Position } from 'reactflow';
import BaseNode from './BaseNode';
import { useTheme } from '../../../contexts/ThemeContext';
import { cn } from '../../../utils';

const FileOpNode = memo(({ data, isConnectable, selected, id }) => {
  const { isDark } = useTheme();

  return (
    <BaseNode
      id={id}
      type="fileop"
      icon={FileText}
      color="orange"
      isConnectable={isConnectable}
      selected={selected}
      data={data}
      handles={[
        {
          type: "target",
          position: Position.Left,
          id: `${id}-target`,
          className: cn(
            "w-3 h-3",
            isDark ? "bg-gray-700" : "bg-gray-200"
          )
        },
        {
          type: "source",
          position: Position.Right,
          id: `${id}-source`,
          className: cn(
            "w-3 h-3",
            isDark ? "bg-gray-700" : "bg-gray-200"
          )
        }
      ]}
    />
  );
});

FileOpNode.displayName = 'FileOpNode';

export default FileOpNode; 
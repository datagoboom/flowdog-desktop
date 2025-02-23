import { useState, useCallback, useContext } from 'react';
import { FlowContext } from '../../../contexts/FlowContext';

const NodeLabel = ({ id, isSelected }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(id);
  const { renameNode } = useContext(FlowContext);

  const handleDoubleClick = useCallback(() => {
    setIsEditing(true);
    setEditValue(id);
  }, [id]);

  const handleBlur = useCallback(() => {
    if (editValue !== id) {
      const success = renameNode(id, editValue);
      if (!success) {
        setEditValue(id); // Reset if rename failed
      }
    }
    setIsEditing(false);
  }, [id, editValue, renameNode]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.target.blur();
    } else if (e.key === 'Escape') {
      setEditValue(id);
      setIsEditing(false);
    }
  }, [id]);

  return (
    <div className="absolute -top-6 left-0 right-0 text-center">
      {isEditing ? (
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={`
            px-1 py-0.5 text-sm rounded border
            ${isSelected ? 'border-blue-500' : 'border-gray-300'}
            focus:outline-none focus:border-blue-500
            dark:bg-gray-800 dark:border-gray-600
          `}
          autoFocus
        />
      ) : (
        <span
          onDoubleClick={handleDoubleClick}
          className={`
            px-1 py-0.5 text-sm rounded cursor-pointer
            ${isSelected ? 'text-blue-500' : 'text-gray-600'}
            hover:bg-gray-100 dark:hover:bg-gray-700
            dark:text-gray-300
          `}
        >
          {id}
        </span>
      )}
    </div>
  );
};

export default NodeLabel; 
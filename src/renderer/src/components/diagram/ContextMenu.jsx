import { memo, useCallback } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const ContextMenu = memo(({ x, y, onDelete, onClose, type }) => {
  const { isDark } = useTheme();

  const handleDelete = useCallback(() => {
    onDelete();
    onClose();
  }, [onDelete, onClose]);

  const getDeleteText = () => {
    console.log('Context menu type:', type);  // Debug log
    return type === 'edge' ? 'Delete Connection' : 'Delete Node';
  };

  return (
    <div
      className={`absolute z-50 min-w-[160px] py-1 rounded-lg shadow-lg ${
        isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
      }`}
      style={{
        left: x,
        top: y,
      }}
    >
      <button
        className={`w-full px-4 py-2 text-left text-sm ${
          isDark 
            ? 'text-red-400 hover:bg-gray-700' 
            : 'text-red-600 hover:bg-gray-50'
        }`}
        onClick={handleDelete}
      >
        {getDeleteText()}
      </button>
    </div>
  );
});

ContextMenu.displayName = 'ContextMenu';

export default ContextMenu; 
import { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';

const TreeView = ({ data, path = '', onSelect }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getType = (value) => {
    if (Array.isArray(value)) return 'array';
    if (value === null) return 'null';
    return typeof value;
  };

  const getPreview = (value) => {
    const type = getType(value);
    switch (type) {
      case 'string':
        return `"${value.length > 50 ? value.slice(0, 47) + '...' : value}"`;
      case 'array':
        return `Array(${value.length})`;
      case 'object':
        return value === null ? 'null' : 'Object';
      default:
        return String(value);
    }
  };

  const handleClick = (e) => {
    e.stopPropagation();
    if (typeof data === 'object' && data !== null) {
      setIsExpanded(!isExpanded);
    }
    if (path && onSelect) {
      onSelect(path);
    }
  };

  const renderValue = () => {
    const type = getType(data);

    if (type === 'object' && data !== null) {
      return (
        <>
          <div 
            onClick={handleClick}
            className="flex items-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 p-1 rounded"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 mr-1" />
            ) : (
              <ChevronRight className="w-4 h-4 mr-1" />
            )}
            <span className="text-semantic-purple font-medium">
              {path.split('.').pop() || 'root'}
            </span>
            <span className="ml-2 text-slate-500">
              {type === 'array' ? `Array(${Object.keys(data).length})` : `Object`}
            </span>
          </div>
          
          {isExpanded && (
            <div className="ml-4 border-l dark:border-slate-700 pl-2">
              {Object.entries(data).map(([key, value]) => (
                <TreeView
                  key={key}
                  data={value}
                  path={path ? `${path}.${key}` : key}
                  onSelect={onSelect}
                />
              ))}
            </div>
          )}
        </>
      );
    }

    return (
      <div 
        onClick={handleClick}
        className="flex items-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 p-1 rounded"
      >
        <span className="text-semantic-purple font-medium">
          {path.split('.').pop()}:
        </span>
        <span className="ml-2 text-semantic-green">{getPreview(data)}</span>
      </div>
    );
  };

  return <div className="font-mono text-sm">{renderValue()}</div>;
};

export default TreeView; 
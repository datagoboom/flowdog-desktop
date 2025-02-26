import { memo, useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Plus, X, Save } from 'lucide-react';
import { useFlow } from '../../../../contexts/FlowContext';
import { Body1, Body2 } from '../../../common/Typography';
import { cn } from '../../../../utils';
import Input from '../../../common/Input';
import Button from '../../../common/Button';
import Select from '../../../common/Select';

// Properties to exclude from the debug view
const EXCLUDED_PROPS = new Set([
  'selected', 'dragging', 'positionAbsolute', 'width', 'height'
]);

const TreeNode = memo(({ label, value, depth = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(true);  // Default to expanded
  
  // Filter and transform the value if it's a node
  const processValue = (val) => {
    if (typeof val === 'object' && val !== null) {
      const processed = {};
      Object.entries(val).forEach(([key, v]) => {
        if (!EXCLUDED_PROPS.has(key)) {
          processed[key] = v;
        }
      });
      return processed;
    }
    return val;
  };

  // Handle different value types
  if (value === null) return (
    <div style={{ marginLeft: `${depth * 20}px` }} className="text-slate-400">
      {label}: null
    </div>
  );
  
  if (typeof value !== 'object') return (
    <div style={{ marginLeft: `${depth * 20}px` }}>
      {label}: <span className={cn(
        typeof value === 'string' && 'text-green-600 dark:text-green-400',
        typeof value === 'number' && 'text-blue-600 dark:text-blue-400',
        typeof value === 'boolean' && 'text-purple-600 dark:text-purple-400'
      )}>{JSON.stringify(value)}</span>
    </div>
  );
  
  const processedValue = processValue(value);
  
  if (Array.isArray(processedValue)) {
    return (
      <div style={{ marginLeft: `${depth * 20}px` }}>
        <div 
          className="flex items-center gap-1 cursor-pointer hover:text-semantic-blue"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          {label}: Array({processedValue.length})
        </div>
        {isExpanded && processedValue.map((item, index) => (
          <TreeNode 
            key={index}
            label={`[${index}]`}
            value={item}
            depth={depth + 1}
          />
        ))}
      </div>
    );
  }
  
  return (
    <div style={{ marginLeft: `${depth * 20}px` }}>
      <div 
        className="flex items-center gap-1 cursor-pointer hover:text-semantic-blue"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        {label}: Object
      </div>
      {isExpanded && Object.entries(processedValue).map(([key, val]) => (
        <TreeNode 
          key={key}
          label={key}
          value={val}
          depth={depth + 1}
        />
      ))}
    </div>
  );
});

const EnvironmentVariableRow = memo(({ name, value, onChange, onDelete }) => {
  return (
    <div className="flex items-center gap-2 mb-2">
      <Input
        value={name}
        onChange={(e) => onChange('name', e.target.value)}
        placeholder="Variable name"
        variant="filled"
        className="flex-1"
      />
      <Input
        value={value}
        onChange={(e) => onChange('value', e.target.value)}
        placeholder="Value"
        variant="filled"
        className="flex-1"
      />
      <Button
        variant="text"
        color="red"
        size="sm"
        onClick={onDelete}
        className="shrink-0"
      >
        <X size={16} />
      </Button>
    </div>
  );
});

const DebugPanel = memo(() => {
  const { 
    nodes, 
    edges, 
    environment, 
    environments,
    setEnvironmentVariable, 
    createEnvironment,
    switchEnvironment,
    saveEnvironment,
    deleteEnvironment 
  } = useFlow();
  
  const [variables, setVariables] = useState([]);
  const [newEnvName, setNewEnvName] = useState('');
  const [showNewEnvInput, setShowNewEnvInput] = useState(false);

  // Update variables when environment changes
  useEffect(() => {
    if (environment) {
      setVariables(
        Object.entries(environment.variables || {}).map(([name, value]) => ({ name, value }))
      );
    }
  }, [environment]);

  const handleVariableChange = (index, field, value) => {
    const newVariables = [...variables];
    const variable = newVariables[index];
    
    if (field === 'name' && variable.name) {
      setEnvironmentVariable(variable.name, undefined); // Delete old variable
    }
    
    newVariables[index] = { ...variable, [field]: value };
    setVariables(newVariables);
    
    if (newVariables[index].name && newVariables[index].value !== undefined) {
      setEnvironmentVariable(newVariables[index].name, newVariables[index].value);
    }
  };

  const handleAddVariable = () => {
    setVariables([...variables, { name: '', value: '' }]);
  };

  const handleDeleteVariable = (index) => {
    const variable = variables[index];
    if (variable.name) {
      setEnvironmentVariable(variable.name, undefined);
    }
    setVariables(variables.filter((_, i) => i !== index));
  };

  const handleCreateEnvironment = () => {
    if (newEnvName.trim()) {
      createEnvironment(newEnvName.trim());
      setNewEnvName('');
      setShowNewEnvInput(false);
    }
  };

  return (
    <div className="space-y-4">
      <Body1 className="font-medium">Debug Panel</Body1>
      
      {/* Flow Structure Section */}
      <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-sm font-mono h-[30vh] overflow-y-auto">
        <Body2 className="font-medium mb-2 border-b border-slate-200 dark:border-slate-700 pb-2">
          Flow Structure
        </Body2>
        <div>
          <div className="space-y-1">
            <TreeNode label="nodes" value={nodes} />
            <TreeNode label="edges" value={edges} />
          </div>
        </div>
      </div>

      {/* Environment Management Section */}
      <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-sm h-[50vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
          <Body2 className="font-medium">Environment Variables</Body2>
          <div className="flex items-center gap-2">
            <Select
              value={environment?.id || ''}
              onChange={(e) => switchEnvironment(e.target.value)}
              className="w-48"
            >
              {environments?.map(env => (
                <option key={env.id} value={env.id}>{env.name}</option>
              ))}
            </Select>
            <Button
              variant="light"
              color="green"
              size="sm"
              onClick={() => setShowNewEnvInput(true)}
              startIcon={<Plus size={16} />}
            >
              New
            </Button>
            <Button
              variant="light"
              color="blue"
              size="sm"
              onClick={() => saveEnvironment()}
              startIcon={<Save size={16} />}
            >
              Save
            </Button>
          </div>
        </div>

        {showNewEnvInput && (
          <div className="flex items-center gap-2 mb-4">
            <Input
              value={newEnvName}
              onChange={(e) => setNewEnvName(e.target.value)}
              placeholder="Environment name"
              variant="filled"
              className="flex-1"
              onKeyPress={(e) => e.key === 'Enter' && handleCreateEnvironment()}
            />
            <Button
              variant="filled"
              color="green"
              size="sm"
              onClick={handleCreateEnvironment}
            >
              Create
            </Button>
            <Button
              variant="text"
              color="red"
              size="sm"
              onClick={() => {
                setNewEnvName('');
                setShowNewEnvInput(false);
              }}
            >
              <X size={16} />
            </Button>
          </div>
        )}

        <div className="space-y-2">
          {variables.map((variable, index) => (
            <EnvironmentVariableRow
              key={index}
              name={variable.name}
              value={variable.value}
              onChange={(field, value) => handleVariableChange(index, field, value)}
              onDelete={() => handleDeleteVariable(index)}
            />
          ))}
          <Button
            variant="light"
            color="blue"
            size="sm"
            onClick={handleAddVariable}
            startIcon={<Plus size={16} />}
            className="w-full"
          >
            Add Variable
          </Button>
        </div>
      </div>
    </div>
  );
});

DebugPanel.displayName = 'DebugPanel';
EnvironmentVariableRow.displayName = 'EnvironmentVariableRow';

export default DebugPanel; 
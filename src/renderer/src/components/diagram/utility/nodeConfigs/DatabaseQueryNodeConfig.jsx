import { memo, useState, useMemo, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { useDiagram } from '../../../../contexts/DiagramContext';
import { useApi } from '../../../../contexts/ApiContext';
import { Body2, Caption } from '../../../common/Typography';
import Button from '../../../common/Button';
import Input from '../../../common/Input';
import CodeEditor from '../../../common/CodeEditor';

const ParameterRow = memo(({ parameter, onUpdate, onDelete }) => {
  return (
    <div className="flex gap-2">
      <Input
        value={parameter.name}
        onChange={(e) => onUpdate({ ...parameter, name: e.target.value })}
        placeholder="Parameter name"
        variant="filled"
        className="flex-1"
      />
      <Input
        value={parameter.value}
        onChange={(e) => onUpdate({ ...parameter, value: e.target.value })}
        placeholder="Value template"
        variant="filled"
        className="flex-1"
      />
      <Button
        variant="text"
        color="red"
        size="sm"
        onClick={onDelete}
      >
        <X size={16} />
      </Button>
    </div>
  );
});

const DatabaseQueryNodeConfig = memo(({ node }) => {
  const { updateNodeData, lastOutput } = useDiagram();
  const api = useApi();
  const [isExpanded, setIsExpanded] = useState(false);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);

  // Initialize query if it doesn't exist
  useEffect(() => {
    if (!node.data.query) {
      updateNodeData(node.id, 'query', '');
    }
  }, [node.id]);

  // Load available connections
  useEffect(() => {
    const loadConnections = async () => {
      try {
        const result = await api.storage.listConnections();
        if (result.success) {
          setConnections(result.data || []);
        }
      } catch (error) {
        console.error('Failed to load connections:', error);
      } finally {
        setLoading(false);
      }
    };
    loadConnections();
  }, [api.storage]);

  // Debug logging
  useEffect(() => {
    console.log('Node data updated:', {
      ...node.data,
      query: node.data.query || 'not set'
    });
  }, [node.data]);

  // Get query results from lastOutput
  const queryResult = useMemo(() => {
    if (!lastOutput || lastOutput.nodeId !== node.id) return null;
    return lastOutput.data?.response;
  }, [lastOutput, node.id]);

  const handleConnectionChange = (connectionId) => {
    updateNodeData(node.id, 'connectionId', connectionId);
  };

  const handleAddParameter = () => {
    const parameters = [...(node.data.parameters || [])];
    parameters.push({
      id: `param-${Date.now()}`,
      name: '',
      value: ''
    });
    updateNodeData(node.id, 'parameters', parameters);
  };

  const handleUpdateParameter = (index, updatedParam) => {
    const parameters = [...(node.data.parameters || [])];
    parameters[index] = updatedParam;
    updateNodeData(node.id, 'parameters', parameters);
  };

  const handleDeleteParameter = (index) => {
    const parameters = [...(node.data.parameters || [])];
    parameters.splice(index, 1);
    updateNodeData(node.id, 'parameters', parameters);
  };

  const handleQueryChange = (value) => {
    console.log('Query changed to:', value);
    updateNodeData(node.id, 'query', value);
  };

  const selectedConnection = connections.find(conn => conn.id === node.data.connectionId);

  return (
    <div className="space-y-4">
      {/* Connection Selector */}
      <div className="space-y-2">
        <Body2 className="font-medium">Database Connection</Body2>
        {loading ? (
          <Caption>Loading connections...</Caption>
        ) : connections.length === 0 ? (
          <div className="text-center p-4 border border-dashed border-slate-300 dark:border-slate-600 rounded-md">
            <Caption>No database connections configured.</Caption>
            <Button
              variant="light"
              size="sm"
              className="mt-2"
              onClick={() => {
                // TODO: Navigate to settings page
              }}
            >
              Configure Connections
            </Button>
          </div>
        ) : (
          <select
            value={node.data.connectionId || ''}
            onChange={(e) => handleConnectionChange(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
          >
            <option value="">Select a connection</option>
            {connections.map((conn) => (
              <option key={conn.id} value={conn.id}>
                {conn.name} ({conn.type})
              </option>
            ))}
          </select>
        )}
        {selectedConnection && (
          <Caption className="text-slate-500">
            {selectedConnection.type} • {selectedConnection.host || selectedConnection.file}
          </Caption>
        )}
      </div>

      {/* Query Editor */}
      <div className="space-y-2">
        <Body2 className="font-medium">SQL Query</Body2>
        <CodeEditor
          value={node.data.query || ''}
          updateField="query"
          node={node}
          language="sql"
          placeholder=""
          className="min-h-[100px]"
        />
        <Caption className="text-slate-500">
          Current query: {node.data.query || 'No query set'}
        </Caption>
      </div>

      {/* Parameters */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Body2 className="font-medium">Query Parameters</Body2>
          <Button
            variant="light"
            color="green"
            size="sm"
            onClick={handleAddParameter}
            startIcon={<Plus size={16} />}
          >
            Add Parameter
          </Button>
        </div>
        
        <div className="space-y-2">
          {(node.data.parameters || []).map((param, index) => (
            <ParameterRow
              key={param.id}
              parameter={param}
              onUpdate={(updatedParam) => handleUpdateParameter(index, updatedParam)}
              onDelete={() => handleDeleteParameter(index)}
            />
          ))}
        </div>
      </div>

      {/* Query Results */}
      {queryResult && (
        <div className="space-y-2">
          <div 
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <Body2 className="font-medium">Query Results</Body2>
            <span className="text-xs text-slate-500">
              ({queryResult.rowCount || 0} rows)
            </span>
          </div>
          
          {isExpanded && (
            <div className="bg-slate-100 dark:bg-slate-800 rounded-md p-2 overflow-auto max-h-[300px]">
              <pre className="text-xs">
                {JSON.stringify(queryResult.rows, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default DatabaseQueryNodeConfig; 
import { memo, useCallback, useEffect, useState, useMemo } from 'react';
import { Plus, X, Play, Info } from 'lucide-react';
import { cn } from '../../../../utils';
import { useDiagram } from '../../../../contexts/DiagramContext';
import Input from '../../../common/Input';
import Select from '../../../common/Select';
import Button from '../../../common/Button';
import { Body2, Caption } from '../../../common/Typography';
import { executeHttpAction } from '../../../../actions';
import FileUpload from '../../../common/FileUpload';
import JQParser from '../../../../utils/jq';
import CodeEditor from '../../../common/CodeEditor';
import { useApi } from '../../../../contexts/ApiContext';
const jq = new JQParser();

const HTTP_METHODS = [
  { value: 'GET', label: 'GET' },
  { value: 'POST', label: 'POST' },
  { value: 'PUT', label: 'PUT' },
  { value: 'PATCH', label: 'PATCH' },
  { value: 'DELETE', label: 'DELETE' }
];

const CONTENT_TYPES = [
  { value: 'json', label: 'JSON' },
  { value: 'xml', label: 'XML' },
  { value: 'form', label: 'Form' },
  { value: 'text', label: 'Text' },
  { value: 'html', label: 'HTML' },
  { value: 'upload', label: 'Upload' },
];

const CONTENT_TYPE_HEADERS = {
  json: 'application/json',
  xml: 'application/xml',
  form: 'application/x-www-form-urlencoded',
  text: 'text/plain',
  html: 'text/html',
  upload: 'multipart/form-data'
};

const CloseButton = ({ onClick }) => (
  <Button
    variant="text"
    color="red"
    size="sm"
    className="min-w-[32px] hover:bg-semantic-red/10"
    onClick={onClick}
  >
    <X size={16} className="text-semantic-red" />
  </Button>
);

// Check if we're in template mode at cursor position
const isTemplating = (value, position) => {
  if (!position || !value) return false;
  
  // Find the last '{{' before cursor
  const lastOpenBrace = value.lastIndexOf('{{', position);
  if (lastOpenBrace === -1) return false;

  // Find the next '}}' after cursor
  const nextCloseBrace = value.indexOf('}}', position);
  
  // We're in template mode if we found '{{' and either haven't found '}}' or cursor is before it
  return lastOpenBrace !== -1 && (nextCloseBrace === -1 || position <= nextCloseBrace);
};

const EnvironmentVariableRow = memo(({ variable, onUpdate, onDelete }) => {
  const { environment } = useDiagram();
  const [selectedVar, setSelectedVar] = useState(variable.variable || '');
  const [newVarName, setNewVarName] = useState(variable.newVariableName || '');

  // Get existing environment variables for the dropdown
  const envVarOptions = useMemo(() => {
    const existingVars = Object.keys(environment.variables || {}).map(name => ({
      value: name,
      label: name
    }));
    return [
      { value: 'CREATE_NEW', label: 'Create New Variable' },
      ...existingVars
    ];
  }, [environment.variables]);

  return (
    <div className="flex items-center gap-2">
      <Select
        value={selectedVar}
        onChange={(value) => {
          setSelectedVar(value);
          onUpdate({
            ...variable,
            variable: value,
            newVariableName: value === 'CREATE_NEW' ? newVarName : ''
          });
        }}
        options={envVarOptions}
        placeholder="Select variable"
        className="flex-1"
        variant="glass"
        size="sm"
      />
      
      {selectedVar === 'CREATE_NEW' && (
        <Input
          value={newVarName}
          onChange={(e) => {
            setNewVarName(e.target.value);
            onUpdate({
              ...variable,
              variable: selectedVar,
              newVariableName: e.target.value
            });
          }}
          placeholder="New variable name"
          variant="filled"
          className="flex-1"
          size="sm"
        />
      )}
      
      <Input
        value={variable.value || ''}
        onChange={(e) => onUpdate({ ...variable, value: e.target.value })}
        placeholder="Value template"
        variant="filled"
        className="flex-1"
        size="sm"
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

const HTTPNodeConfig = memo(({ node }) => {
  const { updateNodeData, lastInput, environment, setEnvironmentVariable } = useDiagram();
  const api = useApi();
  const [testData, setTestData] = useState(null);
  const [activeField, setActiveField] = useState(null);
  const [cursorPosition, setCursorPosition] = useState(null);
  const [lastInputCache, setLastInputCache] = useState(null);

  console.log('API context:', api);

  // Update lastInputCache whenever lastInput changes
  useEffect(() => {
    if (lastInput?.[node.id]) {
      setLastInputCache(lastInput[node.id]);
    }
  }, [lastInput, node.id]);

  // Get input data for this node
  const inputData = useMemo(() => lastInput?.[node.id], [lastInput, node.id]);

  // Format URL with template values
  const formatUrl = useCallback((url, data) => {
    if (!url || !data) return url;
    
    return url.replace(/\{\{(.*?)\}\}/g, (match, path) => {
      try {
        const value = jq.evaluate(path.trim(), data);
        // Handle different types of values
        if (typeof value === 'object') {
          return JSON.stringify(value);
        }
        return value?.toString() || '';
      } catch (error) {
        console.error('Error evaluating template:', error);
        return match;
      }
    });
  }, []);

  // Handle URL change with template processing
  const handleUrlChange = useCallback((value, selectionStart) => {
    setCursorPosition(selectionStart);
    
    if (isTemplating(value, selectionStart)) {
      setActiveField('url');
    } else {
      setActiveField(null);
    }

    updateNodeData(node.id, 'url', value);
  }, [node.id, updateNodeData]);

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback((path, field) => {
    if (!activeField || cursorPosition === null) return;
    
    const currentValue = node.data[field] || '';
    const template = `${path}}}`;  // Only add closing braces
    
    // Find the last '{{' before cursor
    const lastOpenBrace = currentValue.lastIndexOf('{{', cursorPosition);
    
    // Insert the template after the '{{'
    const newValue = currentValue.substring(0, lastOpenBrace + 2) + 
                    template + 
                    currentValue.substring(cursorPosition);

    updateNodeData(node.id, field, newValue);
    setActiveField(null);
  }, [activeField, cursorPosition, node.id, updateNodeData]);

  // Modified input change handler with debug logging
  const handleInputChange = useCallback((field, value, selectionStart) => {

    setCursorPosition(selectionStart);
    
    const templateCheck = isTemplating(value, selectionStart);

    
    if (templateCheck) {

      setActiveField(field);
    } else {
      setActiveField(null);
    }

    updateNodeData(node.id, field, value);
  }, [node.id, updateNodeData, isTemplating]);

  // Modified header change handler
  const handleHeaderChange = useCallback((headerId, field, value, selectionStart) => {
    const headers = [...(node.data?.headers || [])];
    const headerIndex = headers.findIndex(h => (h.id || h.key) === headerId);
    
    if (headerIndex !== -1) {
      if (field === 'value') {
        setCursorPosition(selectionStart);
        const templateCheck = isTemplating(value, selectionStart);
        if (templateCheck) {
          setActiveField(`headers.${headerId}`);
        } else if (value.indexOf('{{', selectionStart) === -1) {
          setActiveField(null);
        }
      }
      
      headers[headerIndex] = { ...headers[headerIndex], [field]: value };
      updateNodeData(node.id, 'headers', headers);
    }
  }, [node.id, node.data?.headers, updateNodeData, isTemplating]);

  const handleMethodChange = useCallback((method) => {
    handleInputChange('method', method);
  }, [handleInputChange, node.data.method]);

  const handleParamChange = useCallback((paramId, field, value) => {
    const newParams = (node.data.params || []).map(param => {
      if (param.id === paramId) {
        return { ...param, [field]: value };
      }
      return param;
    });
    handleInputChange('params', newParams);
  }, [node.data.params, handleInputChange]);

  const handleRemoveHeader = useCallback((headerId) => {
    const headers = [...(node.data?.headers || [])];
    const filteredHeaders = headers.filter(h => (h.id || h.key) !== headerId);
    handleInputChange('headers', filteredHeaders);
  }, [node.data?.headers, handleInputChange]);

  const handleRemoveParam = useCallback((paramId) => {
    const newParams = (node.data.params || []).filter(param => param.id !== paramId);
    handleInputChange('params', newParams);
  }, [node.data.params, handleInputChange]);

  const handleAddParam = useCallback(() => {
    const newParams = [...(node.data.params || []), { id: `param-${Date.now()}`, key: '', value: '' }];
    handleInputChange('params', newParams);
  }, [node.data.params, handleInputChange]);

  const handleAddHeader = useCallback(() => {
    const headers = [...(node.data?.headers || [])];
    headers.push({
      id: `header-${Date.now()}`,
      key: '',
      value: ''
    });
    handleInputChange('headers', headers);
  }, [node.data?.headers, handleInputChange]);

  const handleFormDataChange = useCallback((file) => {
    const newFormData = [...(node.data.formData || []), file];
    handleInputChange('formData', newFormData);
  }, [node.data.formData, handleInputChange]);

  const handleContentTypeChange = (value) => {
    // Get current headers array
    const headers = [...(node.data?.headers || [])];

    // Remove any existing content-type header
    const filteredHeaders = headers.filter(h => h.key.toLowerCase() !== 'content-type');

    // Add new content-type header
    const newHeaders = [
      ...filteredHeaders,
      {
        id: 'content-type-header',  // Use consistent ID for content-type
        key: 'Content-Type',
        value: CONTENT_TYPE_HEADERS[value]
      }
    ];

    updateNodeData(node.id, 'headers', newHeaders);
    updateNodeData(node.id, 'contentType', value);
  };

  const handleTest = async () => {
    console.log('Starting test with API:', api);
    setTestData(null);
    try {
      // Format URL with any template values using lastInputCache
      const formattedUrl = formatUrl(node.data.url, lastInputCache);
      
      if (!api?.nodes?.http?.request) {
        throw new Error('HTTP API not available');
      }

      // Prepare headers
      const headers = (node.data.headers || []).reduce((acc, header) => ({
        ...acc,
        [header.key]: formatUrl(header.value, lastInputCache)
      }), {});

      // Prepare body based on content type
      let body = node.data.body;
      if (node.data.contentType === 'form') {
        // Handle form data
        try {
          // Convert form string to URLSearchParams
          const formData = new URLSearchParams();
          const lines = body.split('\n');
          lines.forEach(line => {
            if (line.trim()) {
              const [key, value] = line.split('=');
              if (key && value) {
                formData.append(key.trim(), value.trim());
              }
            }
          });
          body = formData.toString();
        } catch (error) {
          console.error('Error parsing form data:', error);
          throw new Error(`Invalid form data: ${error.message}`);
        }
      } else if (node.data.contentType === 'json' && typeof body === 'string') {
        try {
          // Validate JSON
          JSON.parse(body);
        } catch (error) {
          throw new Error(`Invalid JSON body: ${error.message}`);
        }
      }

      console.log('Executing test request with data:', {
        method: node.data.method,
        url: formattedUrl,
        headers,
        body,
        contentType: node.data.contentType
      });
      
      const result = await api.nodes.http.request({
        method: node.data.method,
        url: formattedUrl,
        headers,
        data: body,
        contentType: node.data.contentType
      });

      console.log('Test request result:', result);
      
      if (result.success) {
        setTestData({
          success: true,
          response: {
            status: result.data.status,
            headers: result.data.headers,
            data: result.data.data
          },
          output: result.data
        });
      } else {
        throw new Error(result.error?.message || JSON.stringify(result.error) || 'Request failed');
      }
    } catch (error) {
      console.error('Test request failed:', error);
      setTestData({
        success: false,
        error: {
          message: error.message || 'Request failed',
          details: error.response?.data 
            ? JSON.stringify(error.response.data, null, 2)
            : error.stack
        }
      });
    }
  };

  const renderTestResults = () => {
    if (!testData) return null;

    return (
      <div className="space-y-4 mt-6 pt-6 border-t">
        <Body2 className="font-medium">Test Results</Body2>
        
        {/* Status */}
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-2 h-2 rounded-full",
            testData.success ? "bg-semantic-green" : "bg-semantic-red"
          )} />
          <Body2>
            Status: {testData.response?.status || 'Error'}
          </Body2>
        </div>

        {/* Error Message */}
        {testData.error && (
          <div className="p-4 bg-semantic-red/10 text-semantic-red rounded-md">
            <div className="font-medium mb-2">{testData.error.message}</div>
            {testData.error.details && (
              <pre className="text-xs whitespace-pre-wrap overflow-auto">
                {testData.error.details}
              </pre>
            )}
          </div>
        )}

        {/* Response Headers */}
        {testData.response?.headers && (
          <div className="space-y-2">
            <Body2 className="font-medium text-sm">Response Headers</Body2>
            <pre className="text-xs p-3 bg-slate-50 dark:bg-slate-800/50 rounded-md overflow-auto max-h-32">
              {JSON.stringify(testData.response.headers, null, 2)}
            </pre>
          </div>
        )}

        {/* Response Data */}
        {testData.response?.data && (
          <div className="space-y-2">
            <Body2 className="font-medium text-sm">Response Data</Body2>
            <pre className="text-xs p-3 bg-slate-50 dark:bg-slate-800/50 rounded-md overflow-auto max-h-96">
              {typeof testData.response.data === 'string' 
                ? testData.response.data 
                : JSON.stringify(testData.response.data, null, 2)}
            </pre>
          </div>
        )}
      </div>
    );
  };

  // Add debug display with more details
  const debugInfo = (
    <div className="p-2 mb-4 bg-slate-100 dark:bg-slate-800 rounded text-xs font-mono space-y-1">
      <div>Node ID: {node.id}</div>
      <div>Type: {node.type}</div>
      <div className="text-xs text-slate-400 mt-1">
        Last updated: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );

  const renderBodyInput = () => {
    const contentType = node.data?.contentType || 'json';

    switch (contentType) {
      case 'upload':
        return (
          <FileUpload
            value={node.data?.body?.file}
            onChange={(file) => {
              updateNodeData(node.id, 'body', {
                file: file,
                filename: file.name,
                type: file.type,
                size: file.size
              });
            }}
            onClear={() => {
              updateNodeData(node.id, 'body', null);
            }}
            maxSize={10 * 1024 * 1024} // 10MB limit
          />
        );
      default:
        return (
          <Body2 className="font-medium">
            <CodeEditor
              value={node.data.body || ''}
              language="json"
              node={node}
              updateField="body"
              placeholder='{"key": "value"}'
            />

            debug: 
            {node.data.body}
          </Body2>
        );
    }
  };
  // Modified to include "Create New" option
  const envVarOptions = useMemo(() => {
    const existingVars = Object.keys(environment.variables || {}).map(key => ({
      value: key,
      label: key
    }));

    return [
      ...existingVars,
      { value: 'CREATE_NEW', label: '+ Create New', className: 'text-semantic-green' }
    ];
  }, [environment.variables]);

  // Modified handler for environment variable changes
  const handleEnvVarChange = useCallback((varId, field, value, selectionStart) => {
    const envVars = [...(node.data?.environmentVars || [])];
    const varIndex = envVars.findIndex(v => v.id === varId);
    
    if (varIndex !== -1) {
      if (field === 'variable') {
        if (value === 'CREATE_NEW') {
          // Initialize new variable with empty name
          envVars[varIndex] = { 
            ...envVars[varIndex],
            variable: 'CREATE_NEW',
            newVariableName: '' // Store the new name here
          };
        } else {
          // Clear newVariableName when selecting existing variable
          const { newVariableName, ...rest } = envVars[varIndex];
          envVars[varIndex] = { 
            ...rest,
            variable: value 
          };
        }
      } else if (field === 'newVariableName') {
        // Update the new variable name
        envVars[varIndex] = { 
          ...envVars[varIndex],
          newVariableName: value 
        };
      } else {
        // Handle other fields (like 'value')
        envVars[varIndex] = { 
          ...envVars[varIndex], 
          [field]: value 
        };
        
        if (field === 'value' && selectionStart !== undefined) {
          setCursorPosition(selectionStart);
          if (isTemplating(value, selectionStart)) {
            setActiveField(`envVars.${varId}`);
          } else {
            setActiveField(null);
          }
        }
      }
      
      updateNodeData(node.id, 'environmentVars', envVars);
    }
  }, [node.id, updateNodeData, setCursorPosition, setActiveField]);

  // Render variable name input or select based on state
  const renderVariableField = (envVar) => {
    if (envVar.variable === 'CREATE_NEW') {
      return (
        <Input
          value={envVar.newVariableName || ''}
          onChange={(e) => handleEnvVarChange(envVar.id, 'newVariableName', e.target.value)}
          placeholder="New variable name"
          variant="filled"
          size="sm"
          className="flex-1"
        />
      );
    }

    return (
      <Select
        value={envVar.variable}
        onChange={(value) => handleEnvVarChange(envVar.id, 'variable', value)}
        options={envVarOptions}
        placeholder="Select variable"
        variant="glass"
        size="sm"
        className="flex-1"
      />
    );
  };

  // Modified add handler to initialize with empty variable
  const handleAddEnvVar = useCallback(() => {
    const envVars = [...(node.data?.environmentVars || [])];
    envVars.push({
      id: `env-${Date.now()}`,
      variable: '',
      value: ''
    });
    updateNodeData(node.id, 'environmentVars', envVars);
  }, [node.id, node.data?.environmentVars, updateNodeData]);

  const handleDeleteEnvironmentVar = (index) => {
    const newEnvironmentVars = [...(node.data.environmentVars || [])];
    newEnvironmentVars.splice(index, 1);
    updateNodeData(node.id, 'environmentVars', newEnvironmentVars);
  };

  const handleUpdateEnvironmentVar = (index, updatedVar) => {
    const newEnvironmentVars = [...(node.data.environmentVars || [])];
    newEnvironmentVars[index] = updatedVar;
    updateNodeData(node.id, 'environmentVars', newEnvironmentVars);
  };

  return (
    <div className="space-y-6 relative">
      {/* Method & URL */}
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="w-[150px]">
            <Select
              variant="glass"
              value={node.data.method || 'GET'}
              onChange={handleMethodChange}
              options={HTTP_METHODS}
              size="sm"
            />
          </div>
          <div className="flex-1 relative">
            <Input
              variant="filled"
              size="md"
              fullWidth
              value={node.data.url || ''}
              onChange={(e) => handleUrlChange(e.target.value, e.target.selectionStart)}
              placeholder="https://api.example.com/endpoint"
              showSuggestions={false}
            />
            
          </div>
        </div>
      </div>

      {/* Headers */}
      <div className="space-y-2">
        <div className="flex flex-row items-center justify-between">
          <Body2 className="font-medium flex flex-row items-center justify-center">
            <span>Headers</span>
            <Button variant="light" color="green" circular size="xs" startIcon={<Plus size={16} />} onClick={handleAddHeader} className="ml-2"/>
          </Body2>
        </div>
        
        {node.data?.headers?.map((header) => (
          <div key={header.id} className="flex gap-2">
            <Input
              value={header.key}
              onChange={(e) => handleHeaderChange(header.id, 'key', e.target.value)}
              placeholder="Header name"
              variant="filled"
              size="sm"
              className="flex-1"
            />
            <Input
              value={header.value}
              onChange={(e) => handleHeaderChange(header.id, 'value', e.target.value, e.target.selectionStart)}
              placeholder="Value"
              variant="filled"
              size="sm"
              className="flex-1"
              showSuggestions={activeField === `headers.${header.id}` && inputData}
              suggestions={[]}
              onSuggestionSelect={(path) => handleSuggestionSelect(path, `headers.${header.id}`)}
            />
            <CloseButton onClick={() => handleRemoveHeader(header.id)} />
          </div>
        ))}
      </div>

      {/* Query Parameters */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Body2 className="font-medium flex flex-row items-center justify-center">
            Query Parameters
            <Button variant="light" color="green" circular size="xs" startIcon={<Plus size={16} />} onClick={handleAddParam} className="ml-2"/>
          </Body2>
        </div>
        
        {(node.data?.params || []).map((param) => (
          <div key={param.id} className="flex gap-2">
            <Input
              value={param.key}
              onChange={(e) => handleParamChange(param.id, 'key', e.target.value)}
              placeholder="Parameter name"
              variant="filled"
              size="sm"
              className="flex-1"
            />
            <Input
              value={param.value}
              onChange={(e) => handleParamChange(param.id, 'value', e.target.value)}
              placeholder="Value"
              variant="filled"
              size="sm"
              className="flex-1"
            />
            <CloseButton onClick={() => handleRemoveParam(param.id)} />
          </div>
        ))}
      </div>

      {/* Body - Only for POST/PUT/PATCH */}
      {['POST', 'PUT', 'PATCH'].includes(node.data.method) && (
        <div className="space-y-2">
          {/* Content Type */}
          <div>
            <Body2>Content Type</Body2>
            <Select
              value={node.data?.contentType || ''}
              onChange={handleContentTypeChange}
              options={CONTENT_TYPES}
              variant="glass"
              size="sm"
            />
          </div>
          {renderBodyInput()}
        </div>
      )}

      {/* Environment Variables Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Body2 className="font-medium">Environment Variables</Body2>
          <Button
            variant="light"
            color="green"
            size="sm"
            onClick={handleAddEnvVar}
            startIcon={<Plus size={16} />}
          >
            Add Variable
          </Button>
        </div>
        
        <div className="space-y-2">
          {(node.data.environmentVars || []).map((envVar, index) => (
            <EnvironmentVariableRow
              key={index}
              variable={envVar}
              onUpdate={(updatedVar) => handleUpdateEnvironmentVar(index, updatedVar)}
              onDelete={() => handleDeleteEnvironmentVar(index)}
            />
          ))}
        </div>
      </div>

      {/* Test section */}
      <div className="space-y-2">
        <Button
          color="purple"
          fullWidth={true}
          startIcon={<Play size={16} />}
          onClick={handleTest}
          disabled={!node.data.url}
        >
          Test Request
        </Button>
      </div>
      {/* Test Results */}
      {renderTestResults()}

      {/* Debug Info */}
      {debugInfo}

      {/* Last Input Data Display */}
      {lastInputCache && (
        <div className="space-y-2">
          <Body2 className="font-medium">Last Input Data</Body2>
          <pre className="text-xs bg-slate-100 dark:bg-slate-800 rounded-md p-2 overflow-auto max-h-[200px]">
            {JSON.stringify(lastInputCache, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
});

HTTPNodeConfig.displayName = 'HTTPNodeConfig';

export default HTTPNodeConfig; 
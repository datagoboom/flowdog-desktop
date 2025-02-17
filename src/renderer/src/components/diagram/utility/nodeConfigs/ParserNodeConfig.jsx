import { memo, useCallback, useState, useEffect } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useDiagram } from '../../../../contexts/DiagramContext';
import Select from '../../../common/Select';
import Input from '../../../common/Input';
import { Body2 } from '../../../common/Typography';

const PARSER_MODES = [
  { value: 'json', label: 'JSON' },
  { value: 'xml', label: 'XML' },
  { value: 'text', label: 'Plain Text (Coming Soon)', disabled: true }
];

const ParserNodeConfig = memo(({ node }) => {
  const { updateNodeData, lastInput } = useDiagram();
  const [isReferenceExpanded, setIsReferenceExpanded] = useState(false);
  const [lastInputCache, setLastInputCache] = useState(null);

  useEffect(() => {
    if (lastInput?.[node.id]) {
      setLastInputCache(lastInput[node.id]);
    }
  }, [lastInput, node.id]);

  const handleInputChange = useCallback((field, value) => {
    updateNodeData(node.id, field, value);
  }, [node.id, updateNodeData]);

  const handleModeChange = useCallback((mode) => {
    handleInputChange('mode', mode);
    // Set default expression based on mode
    const defaultExpr = mode === 'xml' ? '//root' : 'HTTP_01.response.data';
    handleInputChange('template', defaultExpr);
  }, [handleInputChange]);

  const renderExpressionHelp = () => {
    if (node.data.mode === 'xml') {
      return (
        <div className="text-xs text-[var(--foreground)]/60 space-y-1">
          <p>XPath Examples:</p>
          <ul className="list-disc list-inside">
            <li><code>//book</code> - Get all book elements</li>
            <li><code>//book[@category='fiction']</code> - Get books with category 'fiction'</li>
            <li><code>//book/title</code> - Get all book titles</li>
            <li><code>//book[price&gt;30]/title</code> - Get titles of books over $30</li>
            <li><code>//book[1]</code> - Get the first book</li>
          </ul>
        </div>
      );
    }
  
    return (
      <div className="text-xs text-[var(--foreground)]/60 space-y-2">
        <p>Expression Examples:</p>
        <ul className="list-disc list-inside space-y-1">
          <li><code>HTTP_01.response.data</code> - Get the entire data array</li>
          <li><code>HTTP_01.response.data[].name</code> - Get names from all items</li>
          <li><code>HTTP_01.response.data[0]</code> - Get first item in array</li>
          <li><code>PARSER_01.response.status</code> - Get response status</li>
        </ul>
  
        <button 
          className="flex items-center gap-1 text-semantic-blue hover:underline mt-2"
          onClick={() => setIsReferenceExpanded(!isReferenceExpanded)}
        >
          {isReferenceExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          Expression Reference
        </button>
  
        {isReferenceExpanded && (
        <div className="max-w-2xl mx-auto p-4 space-y-6">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Object Access</h2>
            <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-md font-mono text-sm">
              <pre>{`HTTP_01.response.data    // Access nested object\nHTTP_01.response.status  // Get single value\nsource.path.to.field    // Deep object traversal`}</pre>
            </div>
          </div>
         
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Array Operations</h2>
            <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-md font-mono text-sm">
              <pre>{`data[]                   // Get entire array\ndata[].name             // Get field from each item\ndata[0]                 // Get first array item\ndata[1].field          // Get field from second item`}</pre>
            </div>
          </div>
         
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Common Patterns</h2>
            <ul className="space-y-1 font-mono text-sm">
              <li><code className="bg-slate-100 dark:bg-slate-800 px-1">HTTP_01.response.data[].id</code> - Extract all IDs</li>
              <li><code className="bg-slate-100 dark:bg-slate-800 px-1">HTTP_01.response.data[0]</code> - First item</li>
              <li><code className="bg-slate-100 dark:bg-slate-800 px-1">HTTP_01.response.headers</code> - Get headers object</li>
              <li><code className="bg-slate-100 dark:bg-slate-800 px-1">PARSER_01.response.data[].email</code> - Get all emails</li>
            </ul>
          </div>
         
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Response Examples</h2>
            <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-md font-mono text-sm">
              <pre>{`// Get status code\nHTTP_01.response.status\n\n// Get all user IDs\nHTTP_01.response.data[].id\n\n// Get first user's name\nHTTP_01.response.data[0].name`}</pre>

            </div>
          </div>
        </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
     {/* Expression Input */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Body2 className="font-medium">
            JQ Expression
          </Body2>
          
        </div>
        <Input
          value={node.data.template || ''}
          onChange={(e) => handleInputChange('template', e.target.value)}
          placeholder='HTTP_01.response.data'
          variant="filled"
        />
        {renderExpressionHelp()}
      </div>

      {/* Preview */}
      {node.data.result && (
        <div className="space-y-2">
          <Body2 className="font-medium">Result Preview</Body2>
          <pre className="p-4 bg-slate-100 dark:bg-slate-800 rounded-md overflow-auto max-h-96 text-sm">
            {typeof node.data.result === 'string' 
              ? node.data.result 
              : JSON.stringify(node.data.result, null, 2)
            }
          </pre>
        </div>
      )}

      {/* Error Display */}
      {node.data.error && (
        <div className="p-4 mt-4 text-sm text-semantic-red bg-semantic-red/10 rounded-md">
          {node.data.error}
        </div>
      )}

      {/* Last Input Section */}
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

ParserNodeConfig.displayName = 'ParserNodeConfig';

export default ParserNodeConfig; 
import { memo, useCallback, useState, useMemo, useEffect } from 'react';
import { Plus, X, Info, Check, ChevronDown, ChevronRight } from 'lucide-react';
import { useFlow } from '../../../../contexts/FlowContext';
import { Body2 } from '../../../common/Typography';
import Button from '../../../common/Button';
import Input from '../../../common/Input';
import Select from '../../../common/Select';
import Switch from '../../../common/Switch';
import { cn } from '../../../../utils';
import { v4 as uuidv4 } from 'uuid';

const TEST_TYPES = [
  { value: 'status', label: 'Status Code' },
  { value: 'headers', label: 'Headers' },
  { value: 'body', label: 'Response Body' }
];

const OPERATORS = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Not Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'not_contains', label: 'Does Not Contain' },
  { value: 'greater_than', label: 'Greater Than' },
  { value: 'less_than', label: 'Less Than' },
  { value: 'exists', label: 'Exists' },
  { value: 'not_exists', label: 'Does Not Exist' }
];

const TestCaseRow = ({ test, onUpdate, onDelete, index, sourceNodes, nodeId }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { lastOutput } = useFlow();
  
  const testResult = useMemo(() => {
    if (!lastOutput || lastOutput.nodeId !== nodeId) return null;
    const results = lastOutput.data?.response?.results || [];
    return results.find(r => r.id === test.id);
  }, [lastOutput, nodeId, test.id]);

  const handleChange = (field, value) => {
    onUpdate(index, { ...test, [field]: value });
  };

  const sourceNodeOptions = sourceNodes.map(node => ({
    value: node.id,
    label: `${node.data?.name || 'Unnamed Node'} (${node.id})`
  }));

  // Get status indicator component
  const StatusIndicator = () => {
    if (!test.sourceNodeId) return null;
    if (!testResult) {
      return <div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0" title="Not yet run" />;
    }
    const icon = testResult.success ? 
      <Check size={16} className="text-green-500 shrink-0" /> : 
      <X size={16} className="text-red-500 shrink-0" />;
    const text = testResult.success ? "Pass" : "Fail";
    const textColor = testResult.success ? "text-green-500" : "text-red-500";
    
    return (
      <div className="flex items-center gap-1">
        {icon}
        <span className={`text-xs ${textColor}`}>{text}</span>
      </div>
    );
  };

  return (
    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg space-y-3">
      {/* Header with name and actions */}
      <div className="flex items-center gap-2">
        <Input
          value={test.name || ''}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="Test name"
          variant="solid"
          className="flex-1"
        />
        <StatusIndicator />
        <Button
          variant="text"
          color="red"
          size="sm"
          onClick={() => onDelete(index)}
        >
          <X size={16} />
        </Button>
      </div>

      {/* Source Node Selection */}
      <Select
        value={test.sourceNodeId}
        onChange={(value) => handleChange('sourceNodeId', value)}
        options={sourceNodeOptions}
        placeholder="Select source node"
        className="w-full"
        variant="glass"
        size="sm"
      />

      {/* Test Configuration Section */}
      {test.type === 'status' ? (
        // Status Code Test - Single Row
        <div className="flex gap-2">
          <Select
            value={test.type}
            onChange={(value) => handleChange('type', value)}
            options={TEST_TYPES}
            placeholder="Test type"
            variant="glass"
            size="sm"
            className="w-32"
          />
          <Select
            value={test.operator}
            onChange={(value) => handleChange('operator', value)}
            options={OPERATORS}
            placeholder="Operator"
            variant="glass"
            size="sm"
            className="w-40"
          />
          <Input
            value={test.expected || ''}
            onChange={(e) => handleChange('expected', e.target.value)}
            placeholder="Status code"
            variant="solid"
            className="w-24"
          />
        </div>
      ) : (
        // Headers and Body Tests - Two Rows
        <div className="space-y-2">
          <Select
            value={test.type}
            onChange={(value) => handleChange('type', value)}
            options={TEST_TYPES}
            placeholder="Test type"
            variant="glass"
            size="sm"
            className="w-full"
          />
          <div className="flex gap-2">
            <Input
              value={test.type === 'headers' ? test.header : test.path}
              onChange={(e) => handleChange(test.type === 'headers' ? 'header' : 'path', e.target.value)}
              placeholder={test.type === 'headers' ? 'Header name' : 'JSON path'}
              variant="solid"
              className="flex-1"
            />
            <Select
              value={test.operator}
              onChange={(value) => handleChange('operator', value)}
              options={OPERATORS}
              placeholder="Operator"
              variant="glass"
              size="sm"
              className="w-40"
            />
            {test.operator !== 'exists' && test.operator !== 'not_exists' && (
              <Input
                value={test.expected || ''}
                onChange={(e) => handleChange('expected', e.target.value)}
                placeholder="Expected value"
                variant="solid"
                className="flex-1"
              />
            )}
          </div>
        </div>
      )}

      {/* Stop on Failure Switch */}
      <div className="flex items-center gap-2 pt-2">
        <Switch
          checked={test.stopOnFailure}
          onChange={(e) => handleChange('stopOnFailure', e.target.checked)}
        />
        <Body2>Stop on failure</Body2>
      </div>

      {/* Test Results Section */}
      {test.sourceNodeId && testResult && (
        <>
          <div 
            className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded p-2 flex items-center gap-2"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            <span className="text-sm text-slate-500">
              {testResult.error ? `Error: ${testResult.error}` : 
               testResult.success ? "Test passed" : "Test failed"}
            </span>
          </div>

          {isExpanded && (
            <div className="mt-2 p-3 bg-slate-100 dark:bg-slate-700/50 rounded-md space-y-2 text-sm">
              {testResult.error ? (
                <div className="text-red-500 text-xs bg-red-100 dark:bg-red-900/30 p-2 rounded">
                  {testResult.error}
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Expected:</span>
                    <code className="px-2 py-1 bg-slate-200 dark:bg-slate-800 rounded text-xs">
                      {testResult.expected}
                    </code>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Actual:</span>
                    <code className="px-2 py-1 bg-slate-200 dark:bg-slate-800 rounded text-xs">
                      {testResult.actual}
                    </code>
                  </div>
                  {testResult.message && (
                    <div className="text-xs bg-slate-200 dark:bg-slate-800 p-2 rounded">
                      {testResult.message}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

const TestNodeConfig = memo(({ node }) => {
  const { updateNodeData, nodes, edges, lastOutput, executingNodeIds} = useFlow();
  const [localTestData, setLocalTestData] = useState(null);

  const isExecuting = executingNodeIds?.has?.(node.id) || false;
  
  // Updated source nodes detection using edges
  const sourceNodes = useMemo(() => {
    // Find all edges that target this node
    const inputEdges = edges.filter(edge => edge.target === node.id);
    
    // Get the source nodes for these edges
    return nodes.filter(n => inputEdges.some(edge => edge.source === n.id));
  }, [nodes, edges, node.id]);

  const testResults = useMemo(() => {
    if (!lastOutput || lastOutput.nodeId !== node.id) return null;
    
    let testData = {
        ...localTestData,
        results: lastOutput.data?.response?.results || [],
        passed: lastOutput.data?.response?.success || false,
    }
    setLocalTestData(testData);
    return testData;
  }, [lastOutput, node.id]);

  const getResultById = (id) => {
    console.log("test results", testResults);
    return testResults?.results?.find(result => result.id === id);
  };

  const handleAddTest = useCallback(() => {
    const tests = [...(node.data.tests || [])];
    const testId = uuidv4(); // Generate a unique ID
    tests.push({
      id: testId,
      name: `Test Case ${tests.length + 1}`,
      type: 'status',
      operator: 'equals',
      expected: '200',
      stopOnFailure: false,
      sourceNodeId: sourceNodes.length === 1 ? sourceNodes[0].id : null // Auto-select if only one source
    });
    updateNodeData(node.id, 'tests', tests);
  }, [node.id, node.data.tests, updateNodeData, sourceNodes]);

  const handleUpdateTest = useCallback((index, updatedTest) => {
    const tests = [...(node.data.tests || [])];
    tests[index] = updatedTest;
    updateNodeData(node.id, 'tests', tests);
  }, [node.id, node.data.tests, updateNodeData]);

  const handleDeleteTest = useCallback((index) => {
    const tests = [...(node.data.tests || [])].filter((_, i) => i !== index);
    updateNodeData(node.id, 'tests', tests);
  }, [node.id, node.data.tests, updateNodeData]);

  const handleSettingChange = useCallback((setting, value) => {
    updateNodeData(node.id, setting, value);
  }, [node.id, updateNodeData]);

  return (
    <div className="space-y-6">
      {/* Settings Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Body2 className="font-medium">Test Settings</Body2>
        </div>
        
        <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
          <div className="flex items-center justify-between">
            <Body2>Require all tests to pass</Body2>
            <Switch
              checked={node.data.requireAll}
              onChange={(e) => handleSettingChange('requireAll', e.target.checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Body2>Continue on failure</Body2>
            <Switch
              checked={node.data.continueOnFailure}
              onChange={(e) => handleSettingChange('continueOnFailure', e.target.checked)}
            />
          </div>

          <div className="space-y-2">
            <Body2>Timeout (ms)</Body2>
            <Input
              type="number"
              value={node.data.timeout || 5000}
              onChange={(e) => handleSettingChange('timeout', parseInt(e.target.value))}
              min={0}
              max={30000}
              variant="solid"
            />
          </div>
        </div>
      </div>

      {/* Test Cases Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Body2 className="font-medium">Test Cases</Body2>
          <Button
            variant="light"
            color="green"
            size="sm"
            onClick={handleAddTest}
            startIcon={<Plus size={16} />}
          >
            Add Test Case
          </Button>
        </div>

        <div className="space-y-4">
          {(!node.data.tests || node.data.tests.length === 0) && (
            <div className="text-center p-8 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
              <Body2 className="text-slate-500">No test cases added yet</Body2>
            </div>
          )}

          {(node.data.tests || []).map((test, index) => (
            <TestCaseRow
              key={index}
              test={test}
              index={index}
              onUpdate={handleUpdateTest}
              onDelete={() => handleDeleteTest(index)}
              sourceNodes={sourceNodes}
              nodeId={node.id}
            />
          ))}
        </div>
      </div>

      {/* Help Section */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
        <div className="flex items-start gap-2">
          <Info size={16} className="text-blue-500 mt-0.5" />
          <div className="space-y-2">
            <Body2 className="font-medium">Using Test Cases</Body2>
            <ul className="text-sm space-y-1 text-slate-600 dark:text-slate-300">
              <li>• Use dot notation for nested body paths (e.g., data.user.name)</li>
              <li>• Headers are case-insensitive</li>
              <li>• Use template variables with {'{{}}'} syntax</li>
              <li>• Status codes can use ranges (e.g., 2xx, {'>='}400)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Test Results */}
      {node.data.result && (
        <div className="space-y-2">
          <Body2 className="font-medium">Last Test Results</Body2>
          <pre className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-xs overflow-auto">
            {JSON.stringify(node.data.result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
});

TestNodeConfig.displayName = 'TestNodeConfig';

export default TestNodeConfig;
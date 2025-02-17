import { memo, useState, useEffect, useCallback } from 'react';import { RefreshCw } from 'lucide-react';
import { Body2 } from '../../../common/Typography';
import Input from '../../../common/Input';
import Select from '../../../common/Select';
import { useDiagram } from '../../../../contexts/DiagramContext';

const ITERATOR_MODES = [
  { value: 'input', label: 'Input Iteration' },
  { value: 'custom', label: 'Custom List' }
];

const DELIMITER_OPTIONS = [
  { delimiter: "\n", value: 'newline', label: 'New Line' },
  { delimiter: ',', value: 'comma', label: 'Comma (,)' },
  { delimiter: ';', value: 'semicolon', label: 'Semicolon (;)' },
  { delimiter: '\t', value: 'tab', label: 'Tab' },
  { delimiter: 'custom', value: 'custom', label: 'Custom Delimiter' }
];

const IteratorNodeConfig = memo(({ node }) => {
  const { updateNodeData, lastInput } = useDiagram();
  const [inputSource, setInputSource] = useState(null);
  const [delimiter, setDelimiter] = useState(DELIMITER_OPTIONS[0].delimiter);
  const [delimiterValue, setDelimiterValue] = useState(DELIMITER_OPTIONS[0].value);
  const [customDelimiter, setCustomDelimiter] = useState('');
  const [customList, setCustomList] = useState(node.data?.rawText || '');
  const [previewItems, setPreviewItems] = useState([]);

  // Handle mode changes
  const handleModeChange = useCallback((value) => {
    updateNodeData(node.id, 'mode', value);
    if (value === 'input') {
      // Clear custom list data when switching to input mode
      updateNodeData(node.id, 'outputList', []);
      updateNodeData(node.id, 'rawText', '');
    } else {
      // Restore custom list when switching to custom mode
      const items = customList.split(delimiter).map(item => item.trim()).filter(Boolean);
      updateNodeData(node.id, 'outputList', items);
      updateNodeData(node.id, 'rawText', customList);
    }
  }, [node.id, customList, delimiter, updateNodeData]);

  // Handle text input without losing focus
  const handleTextAreaChange = (e) => {
    const newValue = e.target.value;
    setCustomList(newValue);
    
    // Update preview immediately
    const activeDelimiter = delimiterValue === 'custom' ? customDelimiter : delimiter;
    const items = newValue.split(activeDelimiter).map(item => item.trim()).filter(Boolean);
    setPreviewItems(items);
  };

  // Debounced node update for custom mode
  useEffect(() => {
    if (node.data?.mode === 'custom') {
      const timer = setTimeout(() => {
        updateNodeData(node.id, 'rawText', customList);
        updateNodeData(node.id, 'outputList', previewItems);
      }, 500); // Reduced debounce time

      return () => clearTimeout(timer);
    }
  }, [customList, previewItems, node.id, node.data?.mode]);

  // Sync with external changes
  useEffect(() => {
    if (node.data?.mode === 'custom' && node.data?.rawText !== undefined) {
      setCustomList(node.data.rawText || '');
      // Update preview items if rawText changes externally
      const activeDelimiter = delimiterValue === 'custom' ? customDelimiter : delimiter;
      const items = (node.data.rawText || '').split(activeDelimiter).map(item => item.trim()).filter(Boolean);
      setPreviewItems(items);
    }
  }, [node.data?.rawText, node.data?.mode, delimiter, delimiterValue, customDelimiter]);

  const handleDelimiterChange = useCallback((value) => {
    const selectedDelimiter = DELIMITER_OPTIONS.find(option => option.value === value);
    setDelimiter(selectedDelimiter.delimiter);
    setDelimiterValue(value);
    
    // Update preview with new delimiter
    const newDelimiter = value === 'custom' ? customDelimiter : selectedDelimiter.delimiter;
    const items = customList.split(newDelimiter).map(item => item.trim()).filter(Boolean);
    setPreviewItems(items);
  }, [customList, customDelimiter]);

  // Handle input source change
  const handleInputSourceChange = useCallback((value) => {
    setInputSource(value);
    updateNodeData(node.id, 'inputSource', value);
  }, [updateNodeData]);

  // Initialize input mode
  useEffect(() => {
    if (!node.data?.mode) {
      updateNodeData(node.id, 'mode', 'input');
    }
  }, []);

  // Handle input mode data
  useEffect(() => {
    if (lastInput && node.id && lastInput[node.id] && node.data?.mode === 'input') {
      const sourceData = lastInput[node.id][node.data.inputSource]?.response;
      if (Array.isArray(sourceData)) {
        setPreviewItems(sourceData);
        updateNodeData(node.id, 'outputList', sourceData);
      }
    }
  }, [lastInput, node.data?.inputSource, node.data?.mode]);

  // Get available input sources
  const getInputSources = useCallback(() => {
    if (!lastInput || !lastInput[node.id]) return [];
  
    return Object.entries(lastInput[node.id])
      .map(([nodeId, data]) => ({
        value: nodeId,
        label: `${nodeId} ${data?.response && Array.isArray(data.response) ? 
          `(${data.response.length} items)` : ''}`,
        disabled: !(data?.response && Array.isArray(data.response))
      }));
  }, [lastInput, node.id]);

  return (
    <div className="space-y-4">
      {/* Mode Selection */}
      <div>
        <Body2 className="font-medium mb-1">Iterator Mode</Body2>
        <Select
          variant="filled"
          value={node.data?.mode}
          onChange={handleModeChange}
          options={ITERATOR_MODES}
        />

        {node.data?.mode === 'input' && (
          <Select
            value={inputSource}
            onChange={handleInputSourceChange}
            options={getInputSources()}
          />
        )}
      </div>

      {/* Preview Items */}
      {previewItems.length > 0 && (
        <div>
          <div className="flex items-center justify-between">
            <Body2 className="font-medium">Items to Iterate</Body2>
            <span className="text-xs text-[var(--foreground)]/60">
              {previewItems.length} items
            </span>
          </div>
          <pre className="mt-1 text-xs bg-slate-100 dark:bg-slate-800 rounded-md p-2 max-h-48 overflow-auto">
            {JSON.stringify(previewItems, null, 2)}
          </pre>
        </div>
      )}

      {/* Custom List Mode */}
      {node.data?.mode === 'custom' && (
        <>
          <div>
            <Body2 className="font-medium mb-1">Delimiter</Body2>
            <Select
              value={delimiterValue}
              onChange={handleDelimiterChange}
              options={DELIMITER_OPTIONS}
            />
          </div>

          {delimiterValue === 'custom' && (
            <div>
              <Body2 className="font-medium mb-1">Custom Delimiter</Body2>
              <Input
                value={customDelimiter}
                onChange={(e) => setCustomDelimiter(e.target.value)}
                placeholder="Enter custom delimiter"
              />
            </div>
          )}

          <div>
            <Body2 className="font-medium mb-1">Input List</Body2>
            <textarea
              className="w-full p-2 h-32 rounded border border-slate-200 dark:border-slate-700 bg-transparent font-mono text-sm"
              value={customList}
              onChange={handleTextAreaChange}
              placeholder={
                delimiter === "\n" 
                  ? 'item1\nitem2\nitem3'
                  : delimiter === ","
                  ? 'item1,item2,item3'
                  : 'Enter items separated by selected delimiter'
              }
            />
          </div>
        </>
      )}

      {/* Current Item Preview */}
      {node.data?.result && (
        <div>
          <Body2 className="font-medium mb-1">Last Iteration Item</Body2>
          <pre className="p-2 bg-slate-100 dark:bg-slate-800 rounded text-sm">
            {JSON.stringify(node.data.result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
});

IteratorNodeConfig.displayName = 'IteratorNodeConfig';

export default IteratorNodeConfig;
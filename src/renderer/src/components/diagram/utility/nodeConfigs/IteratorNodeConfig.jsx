import { memo, useState, useEffect, useCallback } from 'react';import { RefreshCw } from 'lucide-react';
import { Body2 } from '../../../common/Typography';
import Input from '../../../common/Input';
import Select from '../../../common/Select';
import { useFlow } from '../../../../contexts/FlowContext';

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
  const { updateNodeData, lastInput } = useFlow();
  const [arrayPath, setArrayPath] = useState(node.data?.arrayPath || '');
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
      const items = customList.split('\n').map(item => item.trim()).filter(Boolean);
      updateNodeData(node.id, 'outputList', items);
      updateNodeData(node.id, 'rawText', customList);
    }
  }, [node.id, customList, updateNodeData]);

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
          className="mb-2"
        />

        {node.data?.mode === 'input' && (
          <div>
            <Body2 className="font-medium mb-1">Array Path</Body2>
            <Input
              value={arrayPath}
              onChange={(e) => {
                const value = e.target.value;
                setArrayPath(value);
                updateNodeData(node.id, 'arrayPath', value);
              }}
              placeholder="RSS_04.response.items[]"
              helperText="Path to the array in the input data (e.g., RSS_04.response.items[])"
            />
          </div>
        )}
      </div>

      {/* Custom List Mode */}
      {node.data?.mode === 'custom' && (
        <div>
          <Body2 className="font-medium mb-1">Input List</Body2>
          <textarea
            className="w-full p-2 h-32 rounded border border-slate-200 dark:border-slate-700 bg-transparent font-mono text-sm"
            value={customList}
            onChange={(e) => {
              const newValue = e.target.value;
              setCustomList(newValue);
              const items = newValue.split('\n').map(item => item.trim()).filter(Boolean);
              setPreviewItems(items);
              updateNodeData(node.id, 'rawText', newValue);
              updateNodeData(node.id, 'outputList', items);
            }}
            placeholder="Enter items, one per line"
          />
        </div>
      )}

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
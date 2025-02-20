import { memo, useCallback } from 'react';
import { useDiagram } from '../../../../contexts/DiagramContext';
import Input from '../../../common/Input';
import Button from '../../../common/Button';
import { Body2 } from '../../../common/Typography';
import { RotateCcw } from 'lucide-react';

const CounterNodeConfig = memo(({ node }) => {
  const { updateNodeData, selectedNode } = useDiagram();

  // Make sure we're using the correct node's data
  const nodeData = node?.data || {};
  
  const handleLimitChange = useCallback((e) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value > 0) {
      updateNodeData(node.id, 'limit', value);
    }
  }, [node.id, updateNodeData]);

  const handleReset = useCallback(() => {
    updateNodeData(node.id, 'incrementor', 0);
  }, [node.id, updateNodeData]);

  // Get the current count from this specific node's data
  const currentCount = nodeData.incrementor || 0;
  const limit = nodeData.limit || Infinity;
  const hasReachedLimit = currentCount >= limit;

  return (
    <div className="space-y-6 p-4">
      <div>
        <Body2 className="font-medium mb-2">Counter Limit</Body2>
        <Input
          type="number"
          min="1"
          value={limit === Infinity ? '' : limit}
          onChange={handleLimitChange}
          placeholder="No limit"
          variant="filled"
          size="sm"
          fullWidth
        />
      </div>

      <div className="space-y-2">
        <Body2 className="font-medium">Current Count: {currentCount}</Body2>
        {hasReachedLimit && (
          <div className="text-semantic-red text-sm">
            Limit reached! Counter is paused.
          </div>
        )}
        <Button
          variant="light"
          color="blue"
          size="sm"
          startIcon={<RotateCcw size={16} />}
          onClick={handleReset}
          fullWidth
        >
          Reset Counter
        </Button>
      </div>

      {/* Debug Info */}
      <div className="p-2 mb-4 bg-slate-100 dark:bg-slate-800 rounded text-xs font-mono space-y-1">
        <div>Node ID: {node.id}</div>
        <div>Type: {node.type}</div>
        <div>Count: {currentCount}</div>
        <div>Limit: {limit === Infinity ? 'None' : limit}</div>
        <div className="text-xs text-slate-400 mt-1">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
});

CounterNodeConfig.displayName = 'CounterNodeConfig';

export default CounterNodeConfig; 
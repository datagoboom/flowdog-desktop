import { memo, useCallback, useState, useEffect } from 'react';
import { useDiagram } from '../../../../contexts/DiagramContext';
import Input from '../../../common/Input';
import Box from '../../../common/Box';
import { Body2 } from '../../../common/Typography';
import ToggleButton from '../../../common/ToggleButton';
import Button from '../../../common/Button';
import { Trash, Info } from 'lucide-react';
import Tooltip from '../../../common/Tooltip';

const CollectorNodeConfig = memo(({ node }) => {
  const { updateNodeData } = useDiagram();
  
  // Initialize state from node data directly to avoid unnecessary updates
  const [makeUnique, setMakeUnique] = useState(node.data.makeUnique ?? true);
  const [batchMode, setBatchMode] = useState(node.data.batch ?? false);
  const [batchSize, setBatchSize] = useState(node.data.batch_size ?? 10);

  const handlePathChange = useCallback((e) => {
    updateNodeData(node.id, 'path', e.target.value);
  }, [node.id, updateNodeData]);

  const handleClearCollection = useCallback(() => {
    updateNodeData(node.id, 'collection', []);
  }, [node.id, updateNodeData]);

  const handleMakeUniqueChange = useCallback(() => {
    const newValue = !makeUnique;
    setMakeUnique(newValue);
    updateNodeData(node.id, 'makeUnique', newValue);
  }, [makeUnique, node.id, updateNodeData]);

  const handleBatchModeChange = useCallback(() => {
    const newValue = !batchMode;
    setBatchMode(newValue);
    updateNodeData(node.id, 'batch', newValue);
    updateNodeData(node.id, 'batch_size', batchSize);
  }, [batchMode, batchSize, node.id, updateNodeData]);

  const handleBatchSizeChange = useCallback((e) => {
    const value = Math.max(1, parseInt(e.target.value) || 1);
    setBatchSize(value);
    updateNodeData(node.id, 'batch_size', value);
  }, [node.id, updateNodeData]);

  return (
    <div className="space-y-6 p-4 h-full">
      <div className="border-b border-slate-500 pb-4 space-y-4">
        <Input
          label="Collection Path"
          value={node.data.path || ''}
          onChange={handlePathChange}
          className="w-full mb-2"
        />
        
        <div className="flex justify-start items-center gap-4">
          <div className="flex items-center">
            <Body2 className="mr-2">Make Unique</Body2>
            <ToggleButton
              selected={makeUnique}
              onClick={handleMakeUniqueChange}
            />
          </div>

          <div className="flex items-center">
            <Body2 className="mr-2">Batch Mode</Body2>
            <ToggleButton
              selected={batchMode}
              onClick={handleBatchModeChange}
            />
            <Tooltip content="When enabled, collector will output batches of items when batch size is met, then clear the collection">
              <Info className="w-4 h-4 ml-2 text-slate-400" />
            </Tooltip>
          </div>
        </div>

        {batchMode && (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              label="Batch Size"
              value={batchSize}
              onChange={handleBatchSizeChange}
              min={1}
              className="w-32"
            />
            <Body2 className="text-slate-400 text-sm">
              Items in batch: {node.data.collection?.length || 0} / {batchSize}
            </Body2>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center">
        <Body2>Collection {node.data.collection?.length > 0 ? `(${node.data.collection?.length})` : ''}</Body2>
        <Button variant="filled" color="red" size="sm" onClick={handleClearCollection}>
          <Trash className="w-4 h-4" />
          Clear
        </Button>
      </div>

      <div className="h-[50vh] overflow-y-auto bg-slate-800 border border-slate-500 rounded-md p-2">
        {node.data.collection?.map((item, index) => (
          <div key={index} className="bg-slate-900 border border-slate-500 rounded-md p-2 mb-2">{item}</div>
        ))}
      </div>
    </div>
  );
});

CollectorNodeConfig.displayName = 'CollectorNodeConfig';

export default CollectorNodeConfig; 
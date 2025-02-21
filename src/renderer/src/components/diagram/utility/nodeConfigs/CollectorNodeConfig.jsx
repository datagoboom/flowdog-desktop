import { memo, useCallback, useState, useEffect } from 'react';
import { useDiagram } from '../../../../contexts/DiagramContext';
import Input from '../../../common/Input';
import Box from '../../../common/Box';
import { Body2 } from '../../../common/Typography';
import ToggleButton from '../../../common/ToggleButton';
import Button from '../../../common/Button';
import { Trash } from 'lucide-react';

const CollectorNodeConfig = memo(({ node }) => {
  const { updateNodeData } = useDiagram();
  const [makeUnique, setMakeUnique] = useState(node.data.makeUnique || true);

  const handlePathChange = useCallback((e) => {
    updateNodeData(node.id, 'path', e.target.value);
  }, [node.id, updateNodeData]);

  const handleClearCollection = useCallback(() => {
    updateNodeData(node.id, 'collection', []);
  }, [node.id, updateNodeData]);

  const handleMakeUniqueChange = useCallback(() => {
    setMakeUnique(!makeUnique);
  }, [makeUnique]);

  useEffect(() => {
    updateNodeData(node.id, 'makeUnique', makeUnique);
    console.log('Make unique state:', makeUnique);
  }, [makeUnique]);

  return (
    <div className="space-y-6 p-4 h-full">
      <div className="h-[120px] border-b border-slate-500">
        <Input
          label="Collection Path"
          value={node.data.path || ''}
          onChange={handlePathChange}
          className="w-full mb-2"
        />
        <div className="flex justify-start items-center mt-2">
          <Body2 className="mr-2">Make Unique</Body2>
          <ToggleButton
            selected={makeUnique}
            onClick={handleMakeUniqueChange}
          />
        </div>
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
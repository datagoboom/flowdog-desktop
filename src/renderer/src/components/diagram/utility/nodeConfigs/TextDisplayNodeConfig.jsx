import { memo, useCallback, useEffect, useState } from 'react';
import { useDiagram } from '../../../../contexts/DiagramContext';
import { Body2 } from '../../../common/Typography';
import TextArea from '../../../common/TextArea';
import Input from '../../../common/Input';

const TextDisplayNodeConfig = memo(({ node }) => {
  const { updateNodeData, lastOutput } = useDiagram();
  const [outputText, setOutputText] = useState('');
  const handleInputTextChange = useCallback((e) => {
    updateNodeData(node.id, 'inputText', e.target.value);
  }, [node.id, updateNodeData]);

  const handleMaxHeightChange = useCallback((e) => {
    const value = parseInt(e.target.value) || 0;
    updateNodeData(node.id, 'maxHeight', value);
  }, [node.id, updateNodeData]);

  const handleMaxWidthChange = useCallback((e) => {
    const value = parseInt(e.target.value) || 0;
    updateNodeData(node.id, 'maxWidth', value);
  }, [node.id, updateNodeData]);

  useEffect(() => {
    if(lastOutput.nodeId === node.id){
        setOutputText(lastOutput.data?.response?.outputText);
    }
  }, [lastOutput]);
  

  return (
    <div className="space-y-6 p-4">
      <div>
        <Body2 className="font-medium mb-2">Input Text</Body2>
        <TextArea
          value={node.data.inputText || ''}
          onChange={handleInputTextChange}
          placeholder="Enter text to display. You can use {{nodeId.path}} for templating."
          variant="filled"
          rows={8}
          fullWidth
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Body2 className="font-medium mb-2">Max Height (px)</Body2>
          <Input
            type="number"
            value={node.data.maxHeight || ''}
            onChange={handleMaxHeightChange}
            placeholder="Default: 400"
            min="0"
            variant="filled"
          />
        </div>
        <div>
          <Body2 className="font-medium mb-2">Max Width (px)</Body2>
          <Input
            type="number"
            value={node.data.maxWidth || ''}
            onChange={handleMaxWidthChange}
            placeholder="Default: 600"
            min="0"
            variant="filled"
          />
        </div>
      </div>

      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
        <Body2 className="font-medium mb-2">Template Variables</Body2>
        <p className="text-sm text-slate-500">
          Use <code>{'{{nodeId.path}}'}</code> to insert values from other nodes
          <br />
          Use <code>{'{{$ENV_VAR}}'}</code> to insert environment variables
        </p>
      </div>

      <div>
        <Body2 className="font-medium mb-2">Output Text</Body2>
        <TextArea
          value={outputText || ''}
          placeholder="Output text will be displayed here"
          variant="filled"
          rows={8}
          fullWidth
        />
      </div>
    </div>
  );
});

TextDisplayNodeConfig.displayName = 'TextDisplayNodeConfig';

export default TextDisplayNodeConfig; 
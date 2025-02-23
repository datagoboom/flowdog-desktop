import { memo, useState } from 'react';
import { Body2 } from '../../../common/Typography';
import { useFlow } from '../../../../contexts/FlowContext';
import TextArea from '../../../common/TextArea';
import Input from '../../../common/Input';
import Button from '../../../common/Button';
import Box from '../../../common/Box';
import { Plus, Trash2, Terminal, Timer, Folder, Variable } from 'lucide-react';
import TreeView from '../../../common/TreeView';

const CommandNodeConfig = memo(({ node }) => {
  const { updateNodeData } = useFlow();
  const [newVarName, setNewVarName] = useState('');
  const [newVarValue, setNewVarValue] = useState('');

  const handleCommandChange = (e) => {
    updateNodeData(node.id, 'command', e.target.value);
  };

  const handleWorkingDirChange = (e) => {
    updateNodeData(node.id, 'workingDirectory', e.target.value);
  };

  const handleTimeoutChange = (e) => {
    const timeout = parseInt(e.target.value) || 30000;
    updateNodeData(node.id, 'timeout', timeout);
  };

  const handleAddEnvVar = () => {
    if (!newVarName || !newVarValue) return;
    const currentVars = node.data?.environmentVars || [];
    updateNodeData(node.id, 'environmentVars', [
      ...currentVars,
      {
        variable: 'CREATE_NEW',
        newVariableName: newVarName,
        value: newVarValue
      }
    ]);
    setNewVarName('');
    setNewVarValue('');
  };

  const handleRemoveEnvVar = (index) => {
    const currentVars = node.data?.environmentVars || [];
    updateNodeData(
      node.id, 
      'environmentVars', 
      currentVars.filter((_, i) => i !== index)
    );
  };

  return (
    <div className="space-y-6">
      {/* Command Section */}
      <Box padding={4} blur={2} opacity={2} className="space-y-4">
        <div className="flex items-center gap-2">
          <Terminal size={16} className="text-slate-500" />
          <Body2 className="font-medium">Command</Body2>
        </div>
        <TextArea
          value={node.data?.command || ''}
          onChange={handleCommandChange}
          placeholder="Enter command (e.g., 'echo {{input}}')"
          variant="glass"
          rows={4}
          helper="Use {{variable}} for dynamic values"
        />
      </Box>

      {/* Options Section */}
      <Box padding={4} blur={2} opacity={2} className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Timer size={16} className="text-slate-500" />
          <Body2 className="font-medium">Options</Body2>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            startIcon={Folder}
            value={node.data?.workingDirectory || ''}
            onChange={handleWorkingDirChange}
            placeholder="/path/to/working/directory"
            variant="glass"
            helper="Working Directory"
          />
          <Input
            type="number"
            value={node.data?.timeout || 30000}
            onChange={handleTimeoutChange}
            placeholder="30000"
            variant="glass"
            helper="Timeout (ms)"
          />
        </div>
      </Box>

      {/* Environment Variables Section */}
      <Box padding={4} blur={2} opacity={2} className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Variable size={16} className="text-slate-500" />
          <Body2 className="font-medium">Environment Variables</Body2>
        </div>

        <div className="flex gap-2">
          <Input
            value={newVarName}
            onChange={(e) => setNewVarName(e.target.value)}
            placeholder="Variable Name"
            variant="glass"
            className="flex-1"
          />
          <Input
            value={newVarValue}
            onChange={(e) => setNewVarValue(e.target.value)}
            placeholder="Value Template"
            variant="glass"
            className="flex-1"
          />
          <Button
            variant="glass"
            size="md"
            onClick={handleAddEnvVar}
            disabled={!newVarName || !newVarValue}
            startIcon={<Plus size={16} />}
          >
            Add
          </Button>
        </div>

        <div className="space-y-2 mt-4">
          {(node.data?.environmentVars || []).map((envVar, index) => (
            <Box 
              key={index} 
              padding={3} 
              blur={1} 
              opacity={1}
              className="flex items-center justify-between"
            >
              <div className="flex-1">
                <Body2 className="font-medium">
                  {envVar.variable === 'CREATE_NEW' ? 
                    envVar.newVariableName : 
                    envVar.variable}
                </Body2>
                <div className="text-sm text-slate-500">{envVar.value}</div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                color="red"
                onClick={() => handleRemoveEnvVar(index)}
                startIcon={<Trash2 size={16} />}
              />
            </Box>
          ))}
        </div>
      </Box>

      {/* Output Section */}
      {node.data?.result && (
        <Box padding={4} blur={2} opacity={2} className="space-y-4">
          <Body2 className="font-medium">Output</Body2>
          <TreeView 
            data={node.data.result}
            onSelect={() => {}}
          />
        </Box>
      )}
    </div>
  );
});

CommandNodeConfig.displayName = 'CommandNodeConfig';

export default CommandNodeConfig;
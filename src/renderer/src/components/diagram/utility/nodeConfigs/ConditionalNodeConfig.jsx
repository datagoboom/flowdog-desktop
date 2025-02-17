import { memo, useCallback, useMemo, useEffect, useState } from 'react';
import { Plus, X, Info } from 'lucide-react';
import { useDiagram } from '../../../../contexts/DiagramContext';
import Select from '../../../common/Select';
import Input from '../../../common/Input';
import Button from '../../../common/Button';
import { Body2 } from '../../../common/Typography';

const OPERATORS = [
  { value: '==', label: 'equals' },
  { value: '>=', label: 'greater than or equal to' },
  { value: '<=', label: 'less than or equal to' },
  { value: 'contains', label: 'contains' }
];

const ConditionalNodeConfig = memo(({ node }) => {
  const { updateNodeData, lastInput } = useDiagram();
  const [lastInputCache, setLastInputCache] = useState(null);

  useEffect(() => {
    if (lastInput?.[node.id]) {
      setLastInputCache(lastInput[node.id]);
    }
  }, [lastInput, node.id]);

  const inputData = useMemo(() => lastInput?.[node.id], [lastInput, node.id]);

  const handleInputChange = useCallback((field, value) => {
    updateNodeData(node.id, field, value);
  }, [node.id, updateNodeData]);

  const handleConditionChange = useCallback((index, field, value) => {
    const conditions = [...(node.data.conditions || [])];
    conditions[index] = {
      ...conditions[index],
      [field]: value
    };
    handleInputChange('conditions', conditions);
  }, [node.data.conditions, handleInputChange]);

  const handleAddCondition = useCallback(() => {
    const conditions = [...(node.data.conditions || [])];
    if (conditions.length < 3) {
      conditions.push({
        field: '',
        operator: '==',
        value: ''
      });
      handleInputChange('conditions', conditions);
    }
  }, [node.data.conditions, handleInputChange]);

  const handleRemoveCondition = useCallback((index) => {
    const conditions = [...(node.data.conditions || [])].filter((_, i) => i !== index);
    handleInputChange('conditions', conditions);
  }, [node.data.conditions, handleInputChange]);

  const getConditionLabel = (index) => {
    if (index === 0) return 'If';
    return 'Else if';
  };

  // Template variables help section
  const templateHelp = (
    <div className="p-4 mt-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
      <div className="flex items-start gap-2">
        <Info size={16} className="text-slate-500 mt-0.5" />
        <div className="text-sm space-y-1">
          <p className="font-medium text-slate-500">Template Variables</p>
          <p className="text-slate-500">
            You can use template variables in both field and value inputs:
          </p>
          <ul className="list-disc list-inside text-slate-500">
            <li><code>{'{{data.field}}'}</code> - Access data from previous nodes</li>
            <li><code>{'{{response.status}}'}</code> - HTTP response status</li>
            <li><code>{'{{response.body.field}}'}</code> - Response body fields</li>
          </ul>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Conditions */}
      <div className="space-y-4">
        {(node.data.conditions || []).map((condition, index) => (
          <div key={index} className="space-y-2 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            <div className="flex items-center justify-between">
              <Body2 className="font-medium">
                {getConditionLabel(index)}
              </Body2>
              <Button
                variant="text"
                color="red"
                size="sm"
                onClick={() => handleRemoveCondition(index)}
              >
                <X size={16} />
              </Button>
            </div>

            <div className="flex gap-2">
              <Input
                value={condition.field || ''}
                onChange={(e) => handleConditionChange(index, 'field', e.target.value)}
                placeholder="{{data.field}}"
                variant="filled"
                className="flex-1"
              />
              <Select
                value={condition.operator || '=='}
                onChange={(value) => handleConditionChange(index, 'operator', value)}
                options={OPERATORS}
                className="w-48"
              />
              <Input
                value={condition.value || ''}
                onChange={(e) => handleConditionChange(index, 'value', e.target.value)}
                placeholder="{{data.value}}"
                variant="filled"
                className="flex-1"
              />
            </div>
          </div>
        ))}

        {/* Else Section - Only shows if there's at least one condition */}
        {(node.data.conditions || []).length > 0 && (
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            <Body2 className="font-medium text-slate-500">
              Else (bottom output)
            </Body2>
            <p className="text-sm text-slate-500 mt-1">
              This path will be taken if no conditions match
            </p>
          </div>
        )}

        {/* Add Condition Button */}
        {(node.data.conditions || []).length < 3 && (
          <Button
            variant="light"
            color="purple"
            size="sm"
            startIcon={<Plus size={16} />}
            onClick={handleAddCondition}
            fullWidth
          >
            Add {(node.data.conditions || []).length === 0 ? 'If Condition' : 'Else If Condition'}
          </Button>
        )}
      </div>

      {/* Help Text */}
      {(node.data.conditions || []).length === 0 && (
        <div className="text-sm text-slate-500 text-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
          Start by adding an "If" condition. Additional conditions will be evaluated in order.
        </div>
      )}

      {/* Template Variables Help */}
      {templateHelp}

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

ConditionalNodeConfig.displayName = 'ConditionalNodeConfig';

export default ConditionalNodeConfig; 
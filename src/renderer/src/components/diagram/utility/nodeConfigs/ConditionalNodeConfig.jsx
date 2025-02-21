import { memo, useCallback, useEffect, useState } from 'react';
import { Plus, X, Info } from 'lucide-react';
import { useDiagram } from '../../../../contexts/DiagramContext';
import Select from '../../../common/Select';
import Input from '../../../common/Input';
import Button from '../../../common/Button';
import { Body2 } from '../../../common/Typography';
import Switch from '../../../common/Switch';

// Import operators from the executor
const OPERATORS = {
  '===': { label: 'equals (strict)', requiresValue: true },
  '==': { label: 'equals', requiresValue: true },
  '!==': { label: 'not equals (strict)', requiresValue: true },
  '!=': { label: 'not equals', requiresValue: true },
  '>': { label: 'greater than', requiresValue: true, numeric: true },
  '>=': { label: 'greater than or equal', requiresValue: true, numeric: true },
  '<': { label: 'less than', requiresValue: true, numeric: true },
  '<=': { label: 'less than or equal', requiresValue: true, numeric: true },
  'contains': { label: 'contains', requiresValue: true, string: true },
  '!contains': { label: 'does not contain', requiresValue: true, string: true },
  'startsWith': { label: 'starts with', requiresValue: true, string: true },
  'endsWith': { label: 'ends with', requiresValue: true, string: true },
  'matches': { label: 'matches regex', requiresValue: true, string: true },
  'isNull': { label: 'is null', requiresValue: false },
  'notNull': { label: 'is not null', requiresValue: false },
  'isEmpty': { label: 'is empty', requiresValue: false },
  'notEmpty': { label: 'is not empty', requiresValue: false }
};

const OPERATOR_OPTIONS = Object.entries(OPERATORS).map(([value, config]) => ({
  value,
  label: config.label
}));

const ConditionalNodeConfig = memo(({ node }) => {
  const { updateNodeData, lastInput } = useDiagram();
  const [lastInputCache, setLastInputCache] = useState(null);

  useEffect(() => {
    if (lastInput?.[node.id]) {
      setLastInputCache(lastInput[node.id]);
    }
  }, [lastInput, node.id]);

  // Initialize ignoreEmptyInput with default value if not set
  useEffect(() => {
    if (node.data.ignoreEmptyInput === undefined) {
      updateNodeData(node.id, 'ignoreEmptyInput', true);
    }
  }, [node.id, node.data.ignoreEmptyInput, updateNodeData]);

  const handleIgnoreEmptyInputChange = useCallback((checked) => {
    updateNodeData(node.id, 'ignoreEmptyInput', checked);
  }, [node.id, updateNodeData]);

  const handleConditionChange = useCallback((index, field, value) => {
    const conditions = [...(node.data.conditions || [])];
    conditions[index] = {
      ...conditions[index],
      [field]: value
    };

    // Clear value if operator doesn't require it
    if (field === 'operator' && !OPERATORS[value]?.requiresValue) {
      conditions[index].value = '';
    }

    updateNodeData(node.id, 'conditions', conditions);
  }, [node.id, node.data.conditions, updateNodeData]);

  const handleAddCondition = useCallback(() => {
    const conditions = [...(node.data.conditions || [])];
    conditions.push({
      field: '',
      operator: '==',
      value: ''
    });
    updateNodeData(node.id, 'conditions', conditions);
  }, [node.id, node.data.conditions, updateNodeData]);

  const handleRemoveCondition = useCallback((index) => {
    const conditions = [...(node.data.conditions || [])].filter((_, i) => i !== index);
    updateNodeData(node.id, 'conditions', conditions);
  }, [node.id, node.data.conditions, updateNodeData]);

  return (
    <div className="space-y-6">
      {/* Settings */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <Body2 className="font-medium">Ignore Empty Input</Body2>
            <p className="text-sm text-slate-500">Skip evaluation for null or undefined inputs</p>
          </div>
          <Switch
            checked={node.data.ignoreEmptyInput ?? true}
            onChange={handleIgnoreEmptyInputChange}
          />
        </div>
      </div>

      {/* Conditions */}
      <div className="space-y-4">
        {(node.data.conditions || []).map((condition, index) => (
          <div key={index} className="space-y-2 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            <div className="flex items-center justify-between">
              <Body2 className="font-medium">
                {index === 0 ? 'If' : 'Or if'}
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

            <div className="space-y-2">
              <Input
                value={condition.field || ''}
                onChange={(e) => handleConditionChange(index, 'field', e.target.value)}
                placeholder="Field (e.g., data.status)"
                variant="filled"
                fullWidth
              />
              
              <Select
                value={condition.operator || '=='}
                onChange={(value) => handleConditionChange(index, 'operator', value)}
                options={OPERATOR_OPTIONS}
                fullWidth
              />
              
              {OPERATORS[condition.operator]?.requiresValue && (
                <Input
                  value={condition.value || ''}
                  onChange={(e) => handleConditionChange(index, 'value', e.target.value)}
                  placeholder="Value"
                  variant="filled"
                  fullWidth
                />
              )}
            </div>
          </div>
        ))}

        {/* Output Paths Description */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg space-y-2">
          <div className="flex items-start gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500 mt-1" />
            <div>
              <Body2 className="font-medium">True Path (Top)</Body2>
              <p className="text-sm text-slate-500">Taken if any condition is true</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 mt-1" />
            <div>
              <Body2 className="font-medium">False Path (Bottom)</Body2>
              <p className="text-sm text-slate-500">Taken if all conditions are false</p>
            </div>
          </div>
        </div>

        {/* Add Condition Button */}
        <Button
          variant="light"
          color="purple"
          size="sm"
          startIcon={<Plus size={16} />}
          onClick={handleAddCondition}
          fullWidth
        >
          Add Condition
        </Button>
      </div>

      {/* Template Help */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
        <div className="flex items-start gap-2">
          <Info size={16} className="text-slate-500 mt-0.5" />
          <div className="text-sm space-y-1">
            <p className="font-medium text-slate-500">Available Data</p>
            <p className="text-slate-500">
              You can reference data from previous nodes using their IDs:
            </p>
            <ul className="list-disc list-inside text-slate-500">
              <li><code>data.fieldName</code> - Access direct data</li>
              <li><code>response.status</code> - HTTP status codes</li>
              <li><code>response.data.field</code> - Response data</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Last Input Preview */}
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
import { memo, useCallback, useRef } from 'react';
import { useDiagram } from '../../../../contexts/DiagramContext';
import Select from '../../../common/Select';
import { Body2 } from '../../../common/Typography';
import TreeView from '../../../common/TreeView';
import xml from '../../../../utils/xml';

const FORMAT_TYPES = [
  { value: 'json', label: 'JSON' },
  { value: 'text', label: 'Text' },
  { value: 'xml', label: 'XML' }
];

const FormatNodeConfig = memo(({ node }) => {
  const { updateNodeData } = useDiagram();
  const textareaRef = useRef(null);

  // Get the last input data from lastInput
  const sourceData = node.data?.lastInput;
  
  console.log('FormatNodeConfig - node data:', node.data);
  console.log('FormatNodeConfig - source data:', sourceData);

  const handleInputChange = useCallback((field, value) => {
    updateNodeData(node.id, field, value);
  }, [node.id, updateNodeData]);

  const insertTemplate = (path) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Create the jq template string
    const template = `{{${path}}}`;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const after = text.substring(end);

    handleInputChange('template', before + template + after);
    
    // Reset cursor position
    setTimeout(() => {
      textarea.focus();
      const newCursor = start + template.length;
      textarea.setSelectionRange(newCursor, newCursor);
    }, 0);
  };

  const getStructuredData = () => {
    if (!sourceData) {
      console.log('No source data available');
      return null;
    }
    
    try {
      // Process each source node's data
      const processedData = Object.entries(sourceData).reduce((acc, [nodeId, data]) => {
        // If the data contains XML content, parse it
        if (data?.response?.headers?.['content-type']?.includes('xml') && 
            typeof data.response.data === 'string') {
          try {
            const xmlDoc = xml.parse(data.response.data);
            data.response.data = xml.toObject(xmlDoc);
          } catch (e) {
            console.error('Error parsing XML for node', nodeId, e);
          }
        }

        return {
          ...acc,
          [nodeId]: data
        };
      }, {});

      console.log('Processed source data:', processedData);
      return processedData;
    } catch (e) {
      console.error('Error processing source data:', e);
      return sourceData;
    }
  };

  return (
    <div className="space-y-4">
      {/* Format Type Selection */}
      <div>
        <Body2 className="font-medium mb-2">Format Type</Body2>
        <Select
          value={node.data?.formatType || 'json'}
          onChange={(value) => handleInputChange('formatType', value)}
          options={FORMAT_TYPES}
        />
      </div>

      {/* Input Data Preview */}
      <div>
        <Body2 className="font-medium mb-2">
          Source Data Structure
          <span className="text-xs text-slate-500 ml-2">
            (click fields to add to template)
          </span>
        </Body2>
        <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-md overflow-x-auto max-h-96 overflow-y-auto">
          {getStructuredData() ? (
            <TreeView 
              data={getStructuredData()} 
              onSelect={insertTemplate}
            />
          ) : (
            <div className="text-sm text-slate-500">
              No source data available
            </div>
          )}
        </div>
      </div>

      {/* Template Input */}
      <div>
        <Body2 className="font-medium mb-2">Template</Body2>
        <textarea
          ref={textareaRef}
          value={node.data?.template || ''}
          onChange={(e) => handleInputChange('template', e.target.value)}
          placeholder="Enter your template here, example: {{HTTP_01.response.data}}"
          className="w-full h-48 p-2 font-mono text-sm border rounded-md"
        />
      </div>
    </div>
  );
});

FormatNodeConfig.displayName = 'FormatNodeConfig';

export default FormatNodeConfig;
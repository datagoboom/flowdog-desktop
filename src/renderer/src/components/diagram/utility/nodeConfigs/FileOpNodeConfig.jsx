import { memo, useCallback } from 'react';
import { useFlow } from '../../../../contexts/FlowContext';
import { Body2 } from '../../../common/Typography';
import Select from '../../../common/Select';
import Input from '../../../common/Input';

const OPERATION_TYPES = [
  { value: 'read', label: 'Read File' },
  { value: 'write', label: 'Write File' }
];

const FileOpNodeConfig = memo(({ node }) => {
  const { updateNodeData } = useFlow();

  const handleInputChange = (field, value) => {
    updateNodeData(node.id, field, value);
  };

  const handleFileUpload = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      handleInputChange('content', content);
      handleInputChange('fileName', file.name);
    };
    reader.readAsText(file);
  }, [handleInputChange]);

  return (
    <div className="space-y-6">
      {/* Operation Type Selection */}
      <div>
        <Body2 className="font-medium mb-2">Operation Type</Body2>
        <Select
          value={node.data?.operation || 'read'}
          onChange={(value) => handleInputChange('operation', value)}
          options={OPERATION_TYPES}
        />
      </div>

      {/* File Upload for Read Operation */}
      {node.data?.operation === 'read' && (
        <div>
          <Body2 className="font-medium mb-2">Upload File</Body2>
          <div className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <input
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              id={`file-upload-${node.id}`}
            />
            <label
              htmlFor={`file-upload-${node.id}`}
              className="cursor-pointer text-sm text-gray-600 dark:text-gray-300"
            >
              {node.data?.fileName ? (
                <span>Selected: {node.data.fileName}</span>
              ) : (
                <span>Click to upload a file</span>
              )}
            </label>
          </div>
        </div>
      )}

      {/* Filename Input for Write Operation */}
      {node.data?.operation === 'write' && (
        <div>
          <Body2 className="font-medium mb-2">Output Filename</Body2>
          <Input
            value={node.data?.fileName || ''}
            onChange={(e) => handleInputChange('fileName', e.target.value)}
            placeholder="output.txt"
          />
        </div>
      )}

      {/* Content Preview */}
      {node.data?.content && (
        <div>
          <Body2 className="font-medium mb-2">Content Preview</Body2>
          <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-md text-sm font-mono max-h-32 overflow-auto">
            {typeof node.data.content === 'string' 
              ? node.data.content.substring(0, 200) + (node.data.content.length > 200 ? '...' : '')
              : 'Content is not text'}
          </div>
        </div>
      )}
    </div>
  );
});

FileOpNodeConfig.displayName = 'FileOpNodeConfig';

export default FileOpNodeConfig; 
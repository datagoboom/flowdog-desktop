import { useState, useEffect } from 'react';
import Input from '../../../common/Input';
import Select from '../../../common/Select';
import { Body2 } from '../../../common/Typography';
import { useFlow } from '../../../../contexts/FlowContext';

const RSSNodeConfig = ({ node }) => {
  const { updateNodeData } = useFlow();

  const handleChange = (field, value) => {
    updateNodeData(node.id, field, value);
  };

  return (
    <div className="space-y-4">
      <div>
        <Body2>Feed URL</Body2>
        <Input
          value={node.data.url || ''}
          onChange={(e) => handleChange('url', e.target.value)}
          placeholder="https://example.com/feed.xml"
        />
      </div>

      <div>
        <Body2>Max Items</Body2>
        <Input
          type="number"
          min={1}
          max={100}
          value={node.data.maxItems || 10}
          onChange={(e) => handleChange('maxItems', Math.max(1, parseInt(e.target.value) || 1))}
        />
      </div>

      <div>
        <Body2>Sort By</Body2>
        <Select
          value={node.data.sortBy || 'published'}
          onChange={(value) => handleChange('sortBy', value)}
          options={[
            { value: 'published', label: 'Published Date' },
            { value: 'created', label: 'Created Date' },
            { value: 'title', label: 'Title' }
          ]}
        />
      </div>

      <div>
        <Body2>Sort Direction</Body2>
        <Select
          value={node.data.sortDirection || 'desc'}
          onChange={(value) => handleChange('sortDirection', value)}
          options={[
            { value: 'desc', label: 'Descending' },
            { value: 'asc', label: 'Ascending' }
          ]}
        />
      </div>
    </div>
  );
};

export default RSSNodeConfig; 
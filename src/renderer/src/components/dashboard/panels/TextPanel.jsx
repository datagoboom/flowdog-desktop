import { useState, useEffect } from 'react';
import { useFlows } from '../../../contexts/FlowContext';

export function TextPanel({ panel, onUpdate }) {
  const [data, setData] = useState(panel.last_data?.data || {});
  const { executeFlow } = useFlows();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await executeFlow(panel.flow_id);
        setData(result);
        onUpdate(panel.id, { last_data: { timestamp: Date.now(), data: result }});
      } catch (error) {
        console.error('Failed to fetch panel data:', error);
      }
    };

    fetchData();
    // Set up interval based on schedule
    // This is a simple implementation - you might want to use a proper cron parser
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [panel.flow_id, panel.id]);

  const formatData = (data) => {
    if (!data) return 'No data';
    
    try {
      const template = panel.config.template || '{{value}}';
      return template.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] || '');
    } catch (error) {
      return 'Error formatting data';
    }
  };

  return (
    <div className="p-4 h-full">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-medium">{panel.name}</h3>
        <button
          onClick={() => onUpdate(panel.id)}
          className="text-gray-400 hover:text-gray-600"
        >
          <span className="sr-only">Edit</span>
          {/* Add edit icon */}
        </button>
      </div>
      <div className="text-2xl font-bold text-center my-4">
        {formatData(data)}
      </div>
    </div>
  );
} 
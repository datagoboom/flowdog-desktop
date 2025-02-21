import { useState, useEffect } from 'react';
import { useFlows } from '../../../contexts/FlowContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const DEFAULT_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD',
  '#D4A5A5', '#9B6B6B', '#E9D985', '#556270', '#6C5B7B'
];

export function PieChartPanel({ panel, onUpdate }) {
  const [data, setData] = useState(panel.last_data?.data || []);
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
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [panel.flow_id, panel.id]);

  const colors = panel.config.colors || DEFAULT_COLORS;

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
      <div className="h-[calc(100%-2rem)]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey={panel.config.valueField}
              nameKey={panel.config.labelField}
              cx="50%"
              cy="50%"
              outerRadius="80%"
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
} 
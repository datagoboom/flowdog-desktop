import { useState, useEffect } from 'react';
import { useFlows } from '../../../contexts/FlowContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function SeriesChartPanel({ panel, onUpdate }) {
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
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={panel.config.xAxis} />
            <YAxis />
            <Tooltip />
            {panel.config.yAxis.map((axis, index) => (
              <Line
                key={axis}
                type="monotone"
                dataKey={axis}
                stroke={`hsl(${(index * 137.5) % 360}, 70%, 50%)`}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
} 
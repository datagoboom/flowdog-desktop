import { useState, useEffect } from 'react';
import { useApi } from '../contexts/ApiContext';
import { Body1, H2, Caption } from '../components/common/Typography';
import StatBox from '../components/common/StatBox';

const Dashboard = () => {
  const api = useApi();
  const [flows, setFlows] = useState([]);

  useEffect(() => {
    api.flow.list().then(response => {
      console.log('Dashboard - Flows: ', response);
      if (response.success) {
        setFlows(response.data || []);
      } else {
        console.error('Failed to load flows:', response.error);
        setFlows([]);
      }
    });
  }, [api]);

  return (
    <div className="flex h-[100vh] w-full flex-col border-l border-r border-slate-200 dark:border-slate-700">
        <div className="flex flex-row min-h-[150px] p-4 border-b border-slate-200 dark:border-slate-700">
            <StatBox 
                value={flows.length}
                caption="Total Flows"
                captionAlign="center"
                className="rounded-lg"
            />
        </div>
        <div className="flex-1 p-4">
        
        </div>
    </div>
  );
}

export default Dashboard;
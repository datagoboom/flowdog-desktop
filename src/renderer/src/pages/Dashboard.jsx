import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import Button from '../components/common/Button';
import FlowTable from '../components/dashboard/FlowTable';
import { Body1, H4 } from '../components/common/Typography';

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="p-6 space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <H4>Dashboard</H4>
          <Body1 className="text-slate-500 dark:text-slate-400">
            Manage and monitor your flows
          </Body1>
        </div>
        <Button
          variant="filled"
          color="blue"
          size="md"
          startIcon={<Plus className="w-4 h-4" />}
          onClick={() => navigate('/flows/new')}
        >
          New Flow
        </Button>
      </div>
        <FlowTable />
    </div>
  );
};

export default Dashboard;
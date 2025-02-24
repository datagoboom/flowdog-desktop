import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Clock } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useApi } from '../../contexts/ApiContext';
import Table from '../common/Table';
import IconButton from '../common/IconButton';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../../utils'
const FlowTable = () => {
  const { isDark } = useTheme();
  const api = useApi();
  const navigate = useNavigate();
  const [flows, setFlows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadFlows();
  }, []);

  const loadFlows = async () => {
    try {
      setLoading(true);
      const response = await api.flow.list();
      console.log(response);
      // Transform the flows data to include placeholder data for now
      const enrichedFlows = response.data.map(flow => ({
        ...flow,
        status: getRandomStatus(), // Placeholder
        lastRun: new Date(Date.now() - Math.random() * 10000000000), // Random past date
        nextRun: new Date(Date.now() + Math.random() * 10000000000), // Random future date
      }));
      setFlows(enrichedFlows);
      setError(null);
    } catch (err) {
      setError('Failed to load flows');
      console.error('Error loading flows:', err);
    } finally {
      setLoading(false);
    }
  };

  // Placeholder function to generate random statuses
  const getRandomStatus = () => {
    const statuses = ['Active', 'Inactive', 'Error', 'Running'];
    return statuses[Math.floor(Math.random() * statuses.length)];
  };

  const handleRunFlow = async (flowId) => {
    try {
      // TODO: Implement flow execution
      console.log('Running flow:', flowId);
    } catch (err) {
      console.error('Error running flow:', err);
    }
  };

  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'success';
      case 'error':
        return 'error';
      case 'running':
        return 'warning';
      default:
        return null;
    }
  };

  const columns = [
    {
      key: 'actions',
      label: '',
      render: (_, row) => (
        <IconButton
          icon={<Play className="w-4 h-4" />}
          variant="light"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleRunFlow(row.id);
          }}
          className={cn(
            "hover:text-blue-500",
            isDark ? "text-slate-400" : "text-slate-600"
          )}
        />
      )
    },
    {
      key: 'name',
      label: 'Name',
      render: (name) => (
        <span className="font-medium">
          {name}
        </span>
      )
    },
    {
      key: 'description',
      label: 'Description',
      render: (description) => (
        <span className={cn(
          "text-sm",
          isDark ? "text-slate-400" : "text-slate-600"
        )}>
          {description || 'No description'}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (status) => (
        <span className={cn(
          "px-2 py-1 rounded-full text-xs font-medium border",
          status?.toLowerCase() === 'active' && cn(
            "border-green-500",
            isDark 
              ? "text-green-400" 
              : "bg-green-100 text-green-800"
          ),
          status?.toLowerCase() === 'inactive' && cn(
            "border-slate-500",
            isDark 
              ? "text-slate-400" 
              : "bg-slate-100 text-slate-800"
          ),
          status?.toLowerCase() === 'error' && cn(
            "border-red-500",
            isDark 
              ? "text-red-400" 
              : "bg-red-100 text-red-800"
          ),
          status?.toLowerCase() === 'running' && cn(
            "border-yellow-500",
            isDark 
              ? "text-yellow-400" 
              : "bg-yellow-100 text-yellow-800"
          )
        )}>
          {status}
        </span>
      )
    },
    {
      key: 'lastRun',
      label: 'Last Run',
      render: (date) => (
        <div className="flex items-center gap-1 text-sm">
          <Clock size={14} className="text-slate-400" />
          {date ? formatDistanceToNow(date, { addSuffix: true }) : 'Never'}
        </div>
      )
    },
    {
      key: 'nextRun',
      label: 'Next Run',
      render: (date) => (
        <div className="flex items-center gap-1 text-sm">
          <Clock size={14} className="text-slate-400" />
          {date ? formatDistanceToNow(date, { addSuffix: true }) : 'Not scheduled'}
        </div>
      )
    }
  ];

  if (loading) {
    return <div>Loading flows...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <Table
      data={flows}
      columns={columns}
      pageSize={10}
      getRowStatus={(row) => getStatusStyle(row.status)}
      onRowClick={(row) => navigate(`/flows/${row.id}`)}
      className="shadow-sm"
      emptyMessage="No flows found. Create a new flow to get started."
    />
  );
};

export default FlowTable; 
import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import Button from '../components/common/Button';
import FlowTable from '../components/dashboard/FlowTable';
import ExecutionTable from '../components/dashboard/ExecutionTable';
import { Body1, H4 } from '../components/common/Typography';

const Dashboard = () => {
  const navigate = useNavigate();
  const [flows, setFlows] = useState([]);
  const [executions, setExecutions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();

    // Set up polling interval
    const interval = setInterval(loadData, 5000);
    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load both flows and executions
      const [flowsResponse, executionsResponse] = await Promise.all([
        window.api.invoke('flow:list'),
        window.api.invoke('execution:list')
      ]);

      if (flowsResponse.success) {
        setFlows(flowsResponse.response);
      }

      if (executionsResponse.success) {
        setExecutions(executionsResponse.response);
      }

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteFlow = async (flowId) => {
    try {
      console.log('Starting flow execution for ID:', flowId);

      // First, load the flow data
      const flowResponse = await window.api.invoke('flow:load', flowId);
      
      if (!flowResponse.success) {
        throw new Error(flowResponse.error || 'Failed to load flow data');
      }

      console.log("Sending data to execution:start", {
        flowId: flowId,
        flow: flowResponse.response
      });

      // Now start execution with the loaded flow data
      const executionResponse = await window.api.invoke('execution:start', {
        flowId: flowId,
        nodes: flowResponse.response.nodes,
        edges: flowResponse.response.edges,
        environment: {} // Optional: add environment variables if needed
      });

      if (!executionResponse.success) {
        throw new Error(executionResponse.error || 'Failed to start flow execution');
      }

      console.log('Flow execution started:', executionResponse);
    } catch (error) {
      console.error('Failed to execute flow:', error);
      // Show error to user
    }
  };

  // Combine flow and execution data
  const flowsWithExecutions = useMemo(() => {
    return flows.map(flow => {
      const flowExecutions = executions.filter(exec => exec.flowId === flow.id);
      const lastExecution = flowExecutions[0]; // Assuming executions are sorted by date
      
      const executionStats = flowExecutions.reduce((stats, exec) => {
        stats.total++;
        stats[exec.status] = (stats[exec.status] || 0) + 1;
        
        // Calculate average duration
        if (exec.startTime && exec.endTime) {
          const duration = new Date(exec.endTime) - new Date(exec.startTime);
          stats.totalDuration += duration;
          stats.executionsWithDuration++;
        }
        return stats;
      }, {
        total: 0,
        completed: 0,
        error: 0,
        running: 0,
        pending: 0,
        totalDuration: 0,
        executionsWithDuration: 0
      });

      return {
        ...flow,
        lastExecution,
        executionStats: {
          ...executionStats,
          averageDuration: executionStats.executionsWithDuration 
            ? executionStats.totalDuration / executionStats.executionsWithDuration 
            : 0,
          successRate: executionStats.total 
            ? (executionStats.completed / executionStats.total) * 100 
            : 0
        }
      };
    });
  }, [flows, executions]);

  // Sort executions by date for the ExecutionTable
  const sortedExecutions = useMemo(() => {
    return [...executions].sort((a, b) => 
      new Date(b.startTime) - new Date(a.startTime)
    );
  }, [executions]);

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

      {/* Tables Section */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <H4 className="mb-4">Flows</H4>
          <FlowTable 
            flows={flowsWithExecutions} 
            loading={loading}
            onRefresh={loadData}
            onExecuteFlow={handleExecuteFlow}
          />
        </div>
        <div>
          <H4 className="mb-4">Recent Executions</H4>
          <ExecutionTable 
            executions={sortedExecutions}
            flows={flows}
            loading={loading}
            onRefresh={loadData}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
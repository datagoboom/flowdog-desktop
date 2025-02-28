import { formatDistanceToNow } from 'date-fns';
import { Play, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import Table from '../common/Table';
import Button from '../common/Button';
import { cn } from '../../utils';

const FlowTable = ({ flows = [], loading = false, onRefresh, onExecuteFlow }) => {

  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (_, flow) => {
        // Handle both direct name and dataValues.name
        const flowName = flow.name || (flow.dataValues && flow.dataValues.name);
        return <span className="font-medium">{flowName}</span>;
      }
    },
    {
      key: 'status',
      label: 'Last Run Status',
      render: (_, flow) => {
        const lastExecution = flow.lastExecution;
        if (!lastExecution) {
          return (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>Never run</span>
            </div>
          );
        }

        const statusConfig = {
          pending: { icon: Clock, className: 'text-yellow-500' },
          running: { icon: Play, className: 'text-blue-500' },
          completed: { icon: CheckCircle, className: 'text-green-500' },
          error: { icon: XCircle, className: 'text-red-500' },
          cancelled: { icon: AlertCircle, className: 'text-slate-500' }
        };

        const StatusIcon = statusConfig[lastExecution.status]?.icon || Clock;
        return (
          <div className="flex items-center gap-2">
            <StatusIcon className={cn('w-4 h-4', statusConfig[lastExecution.status]?.className)} />
            <span className="capitalize">{lastExecution.status}</span>
          </div>
        );
      }
    },
    {
      key: 'lastRun',
      label: 'Last Run',
      render: (_, flow) => {
        const lastExecution = flow.lastExecution;
        if (!lastExecution?.startTime) return 'Never';
        
        return (
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4 text-slate-400" />
            {formatDistanceToNow(new Date(lastExecution.startTime), { addSuffix: true })}
          </div>
        );
      }
    },
    {
      key: 'executionCount',
      label: 'Total Runs',
      render: (_, flow) => flow.executionStats?.total || 0
    },
    {
      key: 'actions',
      label: '',
      render: (_, flow) => {
        // Get the correct flow ID
        const flowId = flow.id || (flow.dataValues && flow.dataValues.id);

        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                if (flowId) {
                  console.log('Executing flow:', flowId); // Debug log
                  onExecuteFlow(flowId);
                }
              }}
              disabled={flow.lastExecution?.status === 'running'}
              className={cn(
                "hover:text-blue-500",
                "text-slate-600 dark:text-slate-400"
              )}
            >
              <Play className="w-4 h-4" />
            </Button>
          </div>
        );
      }
    }
  ];

  const getRowStatus = (flow) => {
    const status = flow.lastExecution?.status;
    switch (status) {
      case 'completed': return 'success';
      case 'error': return 'error';
      case 'running': return 'warning';
      default: return null;
    }
  };


  return (
    <Table
      data={flows}
      columns={columns}
      loading={loading}
      pageSize={10}
      getRowStatus={getRowStatus}
      emptyMessage="No flows found"
      sortable={true}
      onRefresh={onRefresh}
    />
  );
};

export default FlowTable; 
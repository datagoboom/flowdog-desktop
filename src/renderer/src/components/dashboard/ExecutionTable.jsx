import { formatDistanceToNow } from 'date-fns';
import { Play, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import Table from '../common/Table';
import { cn } from '../../utils';

const ExecutionTable = ({ executions = [], flows = [], loading = false, onRefresh }) => {
  const columns = [
    {
      key: 'status',
      label: 'Status',
      render: (status) => {
        const statusConfig = {
          pending: { icon: Clock, className: 'text-yellow-500' },
          running: { icon: Play, className: 'text-blue-500' },
          completed: { icon: CheckCircle, className: 'text-green-500' },
          error: { icon: XCircle, className: 'text-red-500' },
          cancelled: { icon: AlertCircle, className: 'text-slate-500' }
        };

        const StatusIcon = statusConfig[status]?.icon || Clock;
        return (
          <div className="flex items-center gap-2">
            <StatusIcon className={cn('w-4 h-4', statusConfig[status]?.className)} />
            <span className="capitalize">{status}</span>
          </div>
        );
      }
    },
    {
      key: 'flowId',
      label: 'Flow',
      render: (flowId) => {
        const flow = flows.find(f => {
          const flowId1 = f.id || (f.dataValues && f.dataValues.id);
          return flowId1 === flowId;
        });
        const flowName = flow?.name || (flow?.dataValues && flow.dataValues.name);
        console.log('Flow lookup:', { flowId, flow, flowName });
        return flowName || 'Unknown Flow';
      }
    },
    {
      key: 'startTime',
      label: 'Started',
      render: (startTime) => startTime ? (
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4 text-slate-400" />
          {formatDistanceToNow(new Date(startTime), { addSuffix: true })}
        </div>
      ) : 'Not started'
    },
    {
      key: 'duration',
      label: 'Duration',
      render: (_, execution) => {
        if (!execution.startTime) return '-';
        if (!execution.endTime && execution.status === 'running') {
          return 'Running...';
        }
        if (!execution.endTime) return '-';
        
        const start = new Date(execution.startTime);
        const end = new Date(execution.endTime);
        const durationMs = end - start;
        const seconds = Math.floor(durationMs / 1000);
        
        if (seconds < 60) return `${seconds}s`;
        const minutes = Math.floor(seconds / 60);
        return `${minutes}m ${seconds % 60}s`;
      }
    },
    {
      key: 'triggerType',
      label: 'Trigger',
      render: (triggerType) => (
        <span className="capitalize">{triggerType || 'manual'}</span>
      )
    }
  ];

  const getRowStatus = (execution) => {
    switch (execution.status) {
      case 'completed': return 'success';
      case 'error': return 'error';
      case 'running': return 'warning';
      default: return null;
    }
  };

  return (
    <Table
      data={executions}
      columns={columns}
      loading={loading}
      pageSize={10}
      getRowStatus={getRowStatus}
      emptyMessage="No executions found"
      sortable={true}
      onRefresh={onRefresh}
    />
  );
};

export default ExecutionTable; 
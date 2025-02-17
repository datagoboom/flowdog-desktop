import { useState, useEffect } from 'react';
import { BarChart3, Activity, CheckCircle2, XCircle, Clock, ArrowRight } from 'lucide-react';
import moment from 'moment';
import { Body1, Body2, Caption } from '../components/common/Typography';
import { loadState } from '../utils/storageUtils';

const Dashboard = () => {
  const [metrics, setMetrics] = useState({
    totalWorkflows: 0,
    totalRuns: 0,
    successRate: 0,
    recentRuns: []
  });

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const storage = await loadState();
        const workflows = Object.values(storage || {});
        
        // Calculate metrics
        const runs = workflows.flatMap(w => w.history || []);
        const successfulRuns = runs.filter(r => r.success).length;
        
        setMetrics({
          totalWorkflows: workflows.length,
          totalRuns: runs.length,
          successRate: runs.length ? (successfulRuns / runs.length) * 100 : 0,
          recentRuns: runs
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 5)
            .map(run => ({
              ...run,
              workflowName: workflows.find(w => w.id === run.workflowId)?.name || 'Unknown Workflow',
              timestamp: moment(run.timestamp).format('MMM d, yyyy HH:mm')
            }))
        });
      } catch (error) {
        console.error('Error loading metrics:', error);
      }
    };
    
    loadMetrics();
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Body1 className="font-bold">Dashboard</Body1>
          <Caption className="text-slate-500">Workflow Analytics & Metrics</Caption>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Workflows */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 text-purple-500 mb-2">
            <BarChart3 size={20} />
            <Body2 className="font-medium">Total Workflows</Body2>
          </div>
          <div className="text-2xl font-bold">{metrics.totalWorkflows}</div>
        </div>

        {/* Total Runs */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 text-blue-500 mb-2">
            <Activity size={20} />
            <Body2 className="font-medium">Total Runs</Body2>
          </div>
          <div className="text-2xl font-bold">{metrics.totalRuns}</div>
        </div>

        {/* Success Rate */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 text-green-500 mb-2">
            <CheckCircle2 size={20} />
            <Body2 className="font-medium">Success Rate</Body2>
          </div>
          <div className="text-2xl font-bold">
            {metrics.successRate.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Recent Runs */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <Body2 className="font-medium">Recent Workflow Runs</Body2>
        </div>
        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          {metrics.recentRuns.map((run, index) => (
            <div key={index} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                {run.success ? (
                  <CheckCircle2 size={20} className="text-green-500" />
                ) : (
                  <XCircle size={20} className="text-red-500" />
                )}
                <div>
                  <Body2 className="font-medium">{run.workflowName}</Body2>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Clock size={14} />
                    {format(run.timestamp, 'MMM d, yyyy HH:mm')}
                  </div>
                </div>
              </div>
              <ArrowRight size={16} className="text-slate-400" />
            </div>
          ))}
          
          {metrics.recentRuns.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              <Body2>No workflow runs yet</Body2>
              <Caption>Run a workflow to see execution history</Caption>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

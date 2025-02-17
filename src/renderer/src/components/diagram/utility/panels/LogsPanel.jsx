import { memo } from 'react';
import { FileText } from 'lucide-react';
import { useLogger } from '../../../../contexts/LoggerContext';
import Button from '../../../common/Button';
import { Body1, Body2, Caption } from '../../../common/Typography';
import Typography from '../../../common/Typography';
import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import moment from 'moment';

const LogsPanel = memo(() => {
  const { logs, clearLogs } = useLogger();
  const [expandedLogs, setExpandedLogs] = useState({});

  if (logs.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center">
        <FileText size={32} className="text-slate-400 mb-4" />
        <Body1 className="font-medium mb-2">No logs yet</Body1>
        <Body2 className="text-slate-500 mb-6">
          Execute the workflow to see data at specific points during execution.
        </Body2>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
        <Body1 className="font-medium">Execution Logs</Body1>
        <Button variant="light" color="red" size="sm" onClick={clearLogs}>
          Clear
        </Button>
      </div>

      <div className="flex-1 overflow-auto flex flex-col w-full">
        {logs.map((log) => {
          const iterationLabel = log.iteration 
            ? `Iteration ${log.iteration.current}/${log.iteration.total}`
            : '';

          return (
            <div
              key={log.id}
              className="p-4 border-b border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800/50"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-full">
                  <Body2 className="font-medium flex items-center gap-2">
                    <span>Execution @ {moment(log.timestamp).format('HH:mm:ss')}</span>
                    {iterationLabel && (
                      <span className="text-xs px-2 py-1 bg-slate-200 dark:bg-slate-700 rounded">
                        {iterationLabel}
                      </span>
                    )}
                    <Typography variant="caption" color="green">
                      {log.type} {log.name}
                    </Typography>
                  </Body2>

                  {log.sources && (
                    <Caption className="text-slate-500">
                      Source{log.sourceIds?.length > 1 ? 's' : ''}: {log.sources}
                    </Caption>
                  )}

                  {log.sourceData && Object.entries(log.sourceData).map(([source, data]) => (
                    <div key={source} className="mt-2">
                      <Caption className="text-slate-600 font-medium">
                        Data from {source}:
                      </Caption>
                      <pre className="text-xs p-3 bg-slate-500 text-slate-100 dark:bg-slate-800 rounded-md overflow-auto max-h-96 mt-1">
                        {JSON.stringify(data, null, 2)}
                      </pre>
                    </div>
                  ))}

                  {/* Output Data */}
                  {log.data && (
                    <div className="mt-2">
                      <Caption className="text-slate-600 font-medium">
                        Output:
                      </Caption>
                      <pre className="text-xs p-3 bg-slate-500 text-slate-100 dark:bg-slate-800 rounded-md overflow-auto max-h-96 mt-1">
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>

              {/* Debug Info */}
              <div className="flex-col items-center justify-between mb-2">
                <div className="w-full">
                  <button
                    className="w-full text-left text-xs p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md transition-colors"
                    onClick={() => setExpandedLogs(prev => ({
                      ...prev,
                      [log.id]: !prev[log.id]
                    }))}
                  >
                    <span className="flex items-center gap-2">
                      Debug Data {expandedLogs[log.id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </span>
                  </button>
                </div>

                {expandedLogs[log.id] && (
                  <div className="w-full">
                    <pre className="text-xs text-green-300 p-3 bg-slate-600 dark:bg-slate-900 rounded-md overflow-y-auto overflow-x-hidden max-h-96 mt-1">
                      {JSON.stringify({
                        ...log,
                        data: undefined,
                        sourceData: undefined
                      }, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

LogsPanel.displayName = 'LogsPanel';

export default LogsPanel; 
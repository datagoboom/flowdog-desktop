import { memo, useState } from 'react';
import { Settings, Trash2, MoreVertical, RefreshCw } from 'lucide-react';
import Button from '../common/Button';
import IconButton from '../common/IconButton';
import { Body2, Caption } from '../common/Typography';
import { formatDistanceToNow } from 'date-fns';

// Panel type components
const PanelTypes = {
  text: ({ data }) => (
    <div className="p-4">
      <pre className="whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>
    </div>
  ),
  series_chart: ({ data }) => (
    <div className="p-4">
      {/* TODO: Implement chart visualization */}
      <div className="text-center text-slate-500">Chart visualization coming soon</div>
    </div>
  ),
  pie_chart: ({ data }) => (
    <div className="p-4">
      {/* TODO: Implement pie chart visualization */}
      <div className="text-center text-slate-500">Pie chart visualization coming soon</div>
    </div>
  )
};

const DashboardPanel = memo(({ 
  panel, 
  onUpdate, 
  onDelete,
  onRefresh 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const PanelContent = PanelTypes[panel.type] || PanelTypes.text;

  const handleRefresh = async () => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      await onRefresh?.(panel);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Panel Header */}
      <div className="flex items-center justify-between p-3 border-b border-slate-200 dark:border-slate-700">
        <div>
          <Body2 className="font-medium">{panel.name}</Body2>
          {panel.schedule && (
            <Caption className="text-slate-500">
              Updates: {panel.schedule}
            </Caption>
          )}
        </div>

        <div className="flex items-center gap-1">
          {panel.last_data?.timestamp && (
            <Caption className="text-slate-500 mr-2">
              Updated {formatDistanceToNow(panel.last_data.timestamp, { addSuffix: true })}
            </Caption>
          )}
          
          <IconButton
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            loading={isLoading}
          >
            <RefreshCw className="w-4 h-4" />
          </IconButton>
          
          <IconButton
            variant="ghost"
            size="sm"
            onClick={() => {/* TODO: Open panel settings */}}
          >
            <Settings className="w-4 h-4" />
          </IconButton>
          
          <IconButton
            variant="ghost"
            size="sm"
            color="red"
            onClick={() => onDelete(panel.id)}
          >
            <Trash2 className="w-4 h-4" />
          </IconButton>
        </div>
      </div>

      {/* Panel Content */}
      <div className="flex-1 overflow-hidden">
        <PanelContent data={panel.last_data?.data} />
      </div>

      {/* Error State */}
      {panel.error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800">
          <Caption className="text-red-600 dark:text-red-400">
            {panel.error}
          </Caption>
        </div>
      )}
    </div>
  );
});

DashboardPanel.displayName = 'DashboardPanel';

export default DashboardPanel; 
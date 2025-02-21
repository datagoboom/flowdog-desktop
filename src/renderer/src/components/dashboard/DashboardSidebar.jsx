import { memo } from 'react';
import { Plus, Search, Settings, Trash2 } from 'lucide-react';
import { Body1, Body2, Caption } from '../common/Typography';
import Input from '../common/Input';
import Button from '../common/Button';
import IconButton from '../common/IconButton';
import { useDashboards } from '../../contexts/DashboardContext';
import { useState } from 'react';

const DashboardSidebar = memo(() => {
  const { 
    dashboards, 
    activeDashboard, 
    setActiveDashboard,
    deleteDashboard 
  } = useDashboards();
  
  const [searchTerm, setSearchTerm] = useState('');

  const filteredDashboards = dashboards?.filter(dashboard =>
    dashboard.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dashboard.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (e, dashboardId) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this dashboard?')) {
      await deleteDashboard(dashboardId);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <Body1 className="font-bold mb-4">Dashboards</Body1>
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search dashboards..."
          leftIcon={<Search className="w-4 h-4" />}
          fullWidth
          variant="filled"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredDashboards?.map(dashboard => (
          <div
            key={dashboard.id}
            className={`
              p-3 cursor-pointer
              hover:bg-slate-100 dark:hover:bg-slate-800
              ${activeDashboard?.id === dashboard.id ? 'bg-slate-100 dark:bg-slate-800' : ''}
            `}
            onClick={() => setActiveDashboard(dashboard)}
          >
            <div className="flex items-center justify-between">
              <div>
                <Body2 className="font-medium">{dashboard.name}</Body2>
                {dashboard.description && (
                  <Caption className="text-slate-500">{dashboard.description}</Caption>
                )}
              </div>
              <div className="flex gap-1">
                <IconButton
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    // TODO: Open dashboard settings
                  }}
                >
                  <Settings className="w-4 h-4" />
                </IconButton>
                <IconButton
                  variant="ghost"
                  size="sm"
                  color="red"
                  onClick={(e) => handleDelete(e, dashboard.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </IconButton>
              </div>
            </div>
          </div>
        ))}

        {filteredDashboards?.length === 0 && (
          <div className="p-4 text-center text-slate-500">
            {searchTerm ? 'No dashboards match your search' : 'No dashboards yet'}
          </div>
        )}
      </div>
    </div>
  );
});

DashboardSidebar.displayName = 'DashboardSidebar';

export default DashboardSidebar; 
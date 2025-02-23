import { memo } from 'react';
import { Plus, Search, Settings, Trash2, Pencil } from 'lucide-react';
import { Body1, Body2, Caption } from '../common/Typography';
import Input from '../common/Input';
import Button from '../common/Button';
import IconButton from '../common/IconButton';
import { useDashboards } from '../../contexts/DashboardContext';
import { useState } from 'react';
import CreateDashboardModal from './modals/CreateDashboardModal';

const DashboardSidebar = memo(({ isOpen }) => {
  const { 
    dashboards, 
    activeDashboard, 
    setActiveDashboard,
    createDashboard,
    deleteDashboard 
  } = useDashboards();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false); 

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

  const handleCreateDashboard = async (dashboardData) => {
    try {
      await createDashboard(dashboardData);
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error('Failed to create dashboard:', error);
    }
  };

  return (
    <div className={`h-[calc(100vh-50px)] flex flex-col ${isOpen ? 'w-[260px]' : 'w-[50px]'} transition-all duration-200`}>
      {isOpen && <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <Body1 className="font-bold mb-4">Dashboards</Body1>
        <Button
          variant="outlined"
          color="green"
          className="w-full"
          size="sm"
          leftIcon={<Plus className="h-5 w-5" />}
          onClick={() => setIsCreateModalOpen(true)}
        >
          <Plus className="h-5 w-5" />
          New Dashboard
        </Button>
        
        <div className="mt-4">
          <Input
            placeholder="Search dashboards..."
            value={searchTerm}
            fullWidth
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search className="h-5 w-5" />}
          />
        </div>
      </div>}

      {isOpen && <div className="flex-1 overflow-y-auto">
        {filteredDashboards?.map(dashboard => (
          <div
            key={dashboard.id}
            className={`
              p-4 cursor-pointer flex items-center justify-between
              bg-white dark:bg-slate-800
              border-b border-slate-200 dark:border-slate-700 even:bg-slate-100 dark:even:bg-slate-800/70
              hover:bg-slate-100 dark:hover:bg-slate-700/70 transition-colors duration-200
              ${activeDashboard?.id === dashboard.id ? 'bg-blue-50' : ''}
            `}
            onClick={() => setActiveDashboard(dashboard)}
          >
            <span className="truncate">{dashboard.name}</span>
            <div className="flex gap-1">
              <IconButton
                icon={<Pencil className="h-4 w-4" />}
                variant="text"
                color="blue"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  // TODO: Open dashboard settings
                }}
              />
              <IconButton
                icon={<Trash2 className="h-4 w-4" />}
                variant="text"
                color="red"
                size="sm"
                onClick={(e) => handleDelete(e, dashboard.id)}
              />
            </div>
          </div>
        ))}

        {filteredDashboards?.length === 0 && (
          <div className="p-4 text-center text-slate-500">
            {searchTerm ? 'No dashboards match your search' : 'No dashboards yet'}
          </div>
        )}
      </div>}

      {isCreateModalOpen && (
        <CreateDashboardModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreate={handleCreateDashboard}
        />
      )}
    </div>
  );
});

DashboardSidebar.displayName = 'DashboardSidebar';

export default DashboardSidebar; 
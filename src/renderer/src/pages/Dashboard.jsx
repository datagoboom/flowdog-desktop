import { useState, useEffect } from 'react';
import { Plus, PanelLeft, Settings } from 'lucide-react';
import { Body1, Body2, Caption } from '../components/common/Typography';
import Button from '../components/common/Button';
import { loadState } from '../utils/storageUtils';
import DashboardGrid from '../components/dashboard/DashboardGrid';
import DashboardSidebar from '../components/dashboard/DashboardSidebar';
import CreateDashboardModal from '../components/dashboard/modals/CreateDashboardModal';
import { useDashboards } from '../contexts/DashboardContext';

const Dashboard = () => {
  const [showSidebar, setShowSidebar] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { 
    dashboards,
    activeDashboard,
    setActiveDashboard,
    createDashboard
  } = useDashboards();

  const handleCreateDashboard = async (dashboardData) => {
    await createDashboard(dashboardData);
    setShowCreateModal(false);
  };

  return (
    <div className="h-full flex">
      {/* Sidebar */}
      {showSidebar && (
        <div className="w-64 border-r border-slate-200 dark:border-slate-700 flex flex-col">
          <DashboardSidebar 
            dashboards={dashboards}
            activeDashboard={activeDashboard}
            onSelectDashboard={setActiveDashboard}
            onCreateNew={() => setShowCreateModal(true)}
          />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSidebar(!showSidebar)}
            >
              <PanelLeft className="w-4 h-4" />
            </Button>
            
            <div>
              <Body1 className="font-bold">
                {activeDashboard?.name || 'Select a Dashboard'}
              </Body1>
              <Caption className="text-slate-500">
                {activeDashboard?.description || 'Create or select a dashboard to view metrics'}
              </Caption>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeDashboard && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {/* TODO: Open dashboard settings */}}
              >
                <Settings className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="filled"
              color="primary"
              size="sm"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="w-4 h-4" />
              New Dashboard
            </Button>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="flex-1 p-6 overflow-auto">
          {activeDashboard ? (
            <DashboardGrid 
              dashboard={activeDashboard}
              onUpdatePanel={() => {/* TODO */}}
              onDeletePanel={() => {/* TODO */}}
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Body1 className="font-medium mb-2">No Dashboard Selected</Body1>
                <Caption className="text-slate-500">
                  Select a dashboard from the sidebar or create a new one
                </Caption>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <CreateDashboardModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateDashboard}
      />
    </div>
  );
};

export default Dashboard;

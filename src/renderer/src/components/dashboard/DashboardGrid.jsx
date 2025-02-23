import { memo, useEffect, useState } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import DashboardPanel from './DashboardPanel';
import { Plus } from 'lucide-react';
import Button from '../common/Button';
import { useDashboards } from '../../contexts/DashboardContext';
const ResponsiveGridLayout = WidthProvider(Responsive);

const DashboardGrid = memo(() => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { activeDashboard, updateDashboard } = useDashboards();
  const [layouts, setLayouts] = useState([]);

  useEffect(() => {
    if (activeDashboard?.panels) {
      console.log('Active dashboard panels:', activeDashboard.panels); // Debug log
    }
  }, [activeDashboard]);

  if (!activeDashboard) return null;
  if (!Array.isArray(activeDashboard.panels)) {
    console.error('Dashboard panels is not an array:', activeDashboard);
    return null;
  }

  const renderPanel = (panel) => {
    if (!panel || !panel.id) {
      console.error('Invalid panel:', panel);
      return null;
    }

    // Default size if not specified
    const size = Array.isArray(panel.size) ? panel.size : [2, 1];
    const position = Array.isArray(panel.position) ? panel.position : [0, 0];

    return (
      <div key={panel.id} data-grid={{
        x: position[0],
        y: position[1],
        w: size[0],
        h: size[1],
        minW: 1,
        minH: 1
      }}>
        <DashboardPanel
          panel={panel}
          onUpdate={(updatedPanel) => {
            const updatedPanels = activeDashboard.panels.map(p => 
              p.id === updatedPanel.id ? updatedPanel : p
            );
            updateDashboard(activeDashboard.id, {
              panels: updatedPanels
            });
          }}
          onDelete={(panelId) => {
            const updatedPanels = activeDashboard.panels.filter(p => p.id !== panelId);
            updateDashboard(activeDashboard.id, {
              panels: updatedPanels
            });
          }}
        />
      </div>
    );
  };

  return (
    <div className="h-full">
      <ResponsiveGridLayout
        className="layout"
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={100}
        margin={[16, 16]}
        onLayoutChange={(layout) => {
          console.log('Layout changed:', layout); // Debug log
          setLayouts(layout);
        }}
      >
        {activeDashboard.panels.map(renderPanel)}
      </ResponsiveGridLayout>

      <Button
        variant="filled"
        color="blue"
        className="fixed bottom-6 right-6"
        onClick={() => setIsDrawerOpen(true)}
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Panel
      </Button>
    </div>
  );
});

DashboardGrid.displayName = 'DashboardGrid';

export default DashboardGrid; 
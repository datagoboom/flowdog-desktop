import { useMemo } from 'react';
import { TextPanel } from './panels/TextPanel';
import { SeriesChartPanel } from './panels/SeriesChartPanel';
import { PieChartPanel } from './panels/PieChartPanel';
import { memo } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import DashboardPanel from './DashboardPanel';
import { Plus } from 'lucide-react';
import Button from '../common/Button';

const ResponsiveGridLayout = WidthProvider(Responsive);

const PANEL_COMPONENTS = {
  text: TextPanel,
  series_chart: SeriesChartPanel,
  pie_chart: PieChartPanel
};

const GRID_COLS = 4; // Maximum grid width
const PANEL_BASE_SIZE = 'min-w-[300px] min-h-[200px]';

const DashboardGrid = memo(({ 
  dashboard, 
  onUpdatePanel, 
  onDeletePanel,
  onAddPanel 
}) => {
  if (!dashboard?.panels?.length) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-slate-500 mb-4">
            This dashboard is empty. Add a panel to get started.
          </div>
          <Button
            variant="filled"
            color="primary"
            onClick={onAddPanel}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Panel
          </Button>
        </div>
      </div>
    );
  }

  // Create a grid matrix to track panel positions
  const gridMatrix = useMemo(() => {
    const matrix = Array(GRID_COLS).fill(null).map(() => Array(GRID_COLS).fill(null));
    
    dashboard.panels.forEach(panel => {
      // Find first available position for panel
      let placed = false;
      for (let y = 0; y < GRID_COLS && !placed; y++) {
        for (let x = 0; x < GRID_COLS && !placed; x++) {
          if (canPlacePanel(matrix, x, y, panel.size[0], panel.size[1])) {
            placePanel(matrix, x, y, panel);
            placed = true;
          }
        }
      }
    });
    
    return matrix;
  }, [dashboard.panels]);

  const handleLayoutChange = (layout) => {
    // Update panel positions when layout changes
    const updatedPanels = dashboard.panels.map(panel => {
      const layoutItem = layout.find(item => item.i === panel.id);
      if (layoutItem) {
        return {
          ...panel,
          position: [layoutItem.x, layoutItem.y],
          size: [layoutItem.w, layoutItem.h]
        };
      }
      return panel;
    });

    onUpdatePanel(updatedPanels);
  };

  return (
    <div className="h-full">
      <ResponsiveGridLayout
        className="layout"
        layouts={gridMatrix}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={100}
        onLayoutChange={handleLayoutChange}
        isDraggable
        isResizable
        compactType="vertical"
        margin={[12, 12]}
      >
        {dashboard.panels.map(panel => {
          const PanelComponent = PANEL_COMPONENTS[panel.type] || TextPanel;
          
          return (
            <div
              key={panel.id}
              className={`
                ${PANEL_BASE_SIZE}
                col-span-${panel.size[0]}
                row-span-${panel.size[1]}
                bg-white dark:bg-slate-800 rounded-lg shadow-sm
              `}
            >
              <PanelComponent
                panel={panel}
                onUpdate={(updatedPanel) => onUpdatePanel(updatedPanel)}
                onDelete={() => onDeletePanel(panel.id)}
              />
            </div>
          );
        })}
      </ResponsiveGridLayout>

      <Button
        variant="filled"
        color="primary"
        className="fixed bottom-6 right-6"
        onClick={onAddPanel}
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Panel
      </Button>
    </div>
  );
});

DashboardGrid.displayName = 'DashboardGrid';

// Helper functions for grid management
function canPlacePanel(matrix, x, y, width, height) {
  if (x + width > GRID_COLS || y + height > GRID_COLS) return false;
  
  for (let i = y; i < y + height; i++) {
    for (let j = x; j < x + width; j++) {
      if (matrix[i][j] !== null) return false;
    }
  }
  
  return true;
}

function placePanel(matrix, x, y, panel) {
  for (let i = y; i < y + panel.size[1]; i++) {
    for (let j = x; j < x + panel.size[0]; j++) {
      matrix[i][j] = panel.id;
    }
  }
}

export default DashboardGrid; 
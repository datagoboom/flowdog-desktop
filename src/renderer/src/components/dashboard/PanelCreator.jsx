import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Button from '../common/Button';
import Input from '../common/Input';
import { X, Type, LineChart, PieChart, Table2 } from 'lucide-react';
import Box from '../common/Box';
import { useDashboards } from '../../contexts/DashboardContext';

const PANEL_TYPES = [
  { 
    value: 'text', 
    label: 'Text Display',
    icon: <Type className="w-5 h-5" />,
    description: 'Display text, numbers, or status information',
    defaultSize: [1, 1] // Small and compact
  },
  { 
    value: 'series_chart', 
    label: 'Series Chart',
    icon: <LineChart className="w-5 h-5" />,
    description: 'Visualize time series data as a line, bar, or area chart',
    defaultSize: [3, 1] // Wide enough for time series
  },
  { 
    value: 'pie_chart', 
    label: 'Pie Chart',
    icon: <PieChart className="w-5 h-5" />,
    description: 'Show data as parts of a whole',
    defaultSize: [2, 2] // Square for equal proportions
  },
  { 
    value: 'table', 
    label: 'Table',
    icon: <Table2 className="w-5 h-5" />,
    description: 'Display structured data in rows and columns',
    defaultSize: [3, 2] // Wide enough for columns, tall enough for rows
  }
];

const DEFAULT_CONFIGS = {
  text: {
    type: 'text',
    format: 'plain',
    template: '{{value}}'
  },
  series_chart: {
    type: 'series_chart',
    chartType: 'line',
    xAxis: 'timestamp',
    yAxis: ['value']
  },
  pie_chart: {
    type: 'pie_chart',
    valueField: 'value',
    labelField: 'label'
  },
  table: {
    type: 'table',
    columns: [],
    sortable: true,
    pagination: true,
    pageSize: 10
  }
};

const DEFAULT_SCHEDULE = '*/5 * * * *';

const validateCron = (schedule) => {
  const cronRegex = /^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/;
  return cronRegex.test(schedule);
};

const CreatePanelDrawer = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    flowId: uuidv4(), // Initialize with a valid UUID
    type: '',
    schedule: DEFAULT_SCHEDULE
  });

  const [error, setError] = useState(null);

  const { activeDashboard, updateDashboard } = useDashboards();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    if (!activeDashboard) {
      setError('No active dashboard');
      return;
    }
    
    if (!validateCron(formData.schedule)) {
      setError('Invalid cron schedule format');
      return;
    }

    const selectedType = PANEL_TYPES.find(type => type.value === formData.type);
    if (!selectedType || !selectedType.defaultSize) {
      setError('Invalid panel type');
      return;
    }
    
    const newPanel = {
      id: uuidv4(),
      name: formData.name,
      flow_id: formData.flowId,
      type: formData.type,
      size: [...selectedType.defaultSize],
      config: DEFAULT_CONFIGS[formData.type],
      schedule: formData.schedule,
      last_data: {
        timestamp: Date.now(),
        data: {}
      }
    };

    try {
      await updateDashboard(activeDashboard.id, {
        panels: [...(activeDashboard.panels || []), newPanel]
      });
      
      onClose();
      setFormData({
        name: '',
        flowId: uuidv4(), // Reset with a new UUID
        type: '',
        schedule: DEFAULT_SCHEDULE
      });
    } catch (error) {
      setError(error.message || 'Failed to create panel');
      console.error('Failed to create panel:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div 
        className={`
          border-l border-slate-200 dark:border-slate-600
          fixed right-0 top-0 bottom-0 
          w-full z-50
          flex flex-col
          bg-white dark:bg-slate-800 
          shadow-xl
          transform transition-transform duration-500
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
          sm:max-w-xl
        `}
      >
        {/* Header */}
        <Box className="px-6 py-4 border-l-0 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Create New Panel</h2>
            <Button
              variant="text"
              color="gray"
              onClick={onClose}
              className="p-1"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </Box>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Visualization Type Selection */}
            <div>
              <label className="block text-sm font-medium mb-3">
                Choose Visualization
              </label>
              <div className="grid grid-cols-1 gap-3">
                {PANEL_TYPES.map(type => (
                  <button
                    key={type.value}
                    type="button"
                    className={`
                      p-4 rounded-lg border-2 text-left
                      hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20
                      transition-colors duration-200
                      ${formData.type === type.value 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                        : 'border-slate-200 dark:border-slate-700'
                      }
                    `}
                    onClick={() => setFormData(prev => ({ ...prev, type: type.value }))}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      {type.icon}
                      <span className="font-medium">{type.label}</span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {type.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Basic Info */}
            <div>
              <label className="block text-sm font-medium">
                Panel Name
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium">
                Update Schedule (cron)
              </label>
              <Input
                type="text"
                value={formData.schedule}
                onChange={(e) => setFormData(prev => ({ ...prev, schedule: e.target.value }))}
                className="mt-1"
                required
              />
              <p className="mt-1 text-sm text-slate-500">
                Format: */5 * * * * (every 5 minutes)
              </p>
            </div>
          </form>
        </div>

        {/* Footer */}
        <Box className="border-t border-slate-200 dark:border-slate-700 px-6 py-4">
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="text"
              color="red"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="filled"
              color="blue"
              onClick={handleSubmit}
              disabled={!formData.type || !formData.name}
            >
              Create Panel
            </Button>
          </div>
        </Box>
      </div>
    </>
  );
};

export default CreatePanelDrawer;
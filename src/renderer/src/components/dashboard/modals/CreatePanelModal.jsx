import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useFlows } from '../../../contexts/FlowContext';
import { Dialog } from '@headlessui/react';

const PANEL_TYPES = [
  { id: 'text', name: 'Text Display' },
  { id: 'series_chart', name: 'Series Chart' },
  { id: 'pie_chart', name: 'Pie Chart' }
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
  }
};

export function CreatePanelModal({ isOpen, onClose, onCreatePanel }) {
  const { flows } = useFlows();
  const [name, setName] = useState('');
  const [selectedFlow, setSelectedFlow] = useState('');
  const [panelType, setPanelType] = useState('text');
  const [size, setSize] = useState([1, 1]);
  const [schedule, setSchedule] = useState('*/5 * * * *');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const newPanel = {
      id: uuidv4(),
      name,
      size,
      flow_id: selectedFlow,
      type: panelType,
      config: DEFAULT_CONFIGS[panelType],
      schedule
    };

    onCreatePanel(newPanel);
    onClose();
    
    // Reset form
    setName('');
    setSelectedFlow('');
    setPanelType('text');
    setSize([1, 1]);
    setSchedule('*/5 * * * *');
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-sm rounded bg-white p-6">
          <Dialog.Title className="text-lg font-medium mb-4">Create New Panel</Dialog.Title>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Flow</label>
              <select
                value={selectedFlow}
                onChange={(e) => setSelectedFlow(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              >
                <option value="">Select a flow</option>
                {flows.map((flow) => (
                  <option key={flow.id} value={flow.id}>
                    {flow.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Panel Type</label>
              <select
                value={panelType}
                onChange={(e) => setPanelType(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              >
                {PANEL_TYPES.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Size</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  max="4"
                  value={size[0]}
                  onChange={(e) => setSize([parseInt(e.target.value), size[1]])}
                  className="mt-1 block w-20 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                />
                <span className="mt-1">×</span>
                <input
                  type="number"
                  min="1"
                  max="4"
                  value={size[1]}
                  onChange={(e) => setSize([size[0], parseInt(e.target.value)])}
                  className="mt-1 block w-20 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Schedule (cron)</label>
              <input
                type="text"
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Create
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 
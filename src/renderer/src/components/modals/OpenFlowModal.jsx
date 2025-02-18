import { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { FolderOpen, FileJson, Clock, Trash2 } from 'lucide-react';
import { useApi } from '../../contexts/ApiContext';
import { formatDistanceToNow } from 'date-fns';
import IconButton from '../common/IconButton';

const OpenFlowModal = ({ isOpen, onClose, onOpen }) => {
  const [flows, setFlows] = useState([]);
  const [loading, setLoading] = useState(true);
  const { storage: { listFlows, deleteFlow } } = useApi();

  useEffect(() => {
    if (isOpen) {
      loadFlows();
    }
  }, [isOpen]);

  const loadFlows = async () => {
    try {
      setLoading(true);
      const savedFlows = await listFlows();
      setFlows(savedFlows);
    } catch (error) {
      console.error('Failed to load flows:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (flowId) => {
    if (window.confirm('Are you sure you want to delete this flow?')) {
      try {
        await deleteFlow(flowId);
        await loadFlows(); // Refresh list
      } catch (error) {
        console.error('Failed to delete flow:', error);
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Open Flow"
      icon={<FolderOpen className="w-5 h-5" />}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            Loading saved flows...
          </div>
        ) : flows.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            No saved flows found
          </div>
        ) : (
          <div className="grid gap-2">
            {flows.map((flow) => (
              <div
                key={flow.id}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <div 
                  className="flex items-center gap-3 flex-1 cursor-pointer"
                  onClick={() => onOpen(flow)}
                >
                  <FileJson className="w-5 h-5 text-blue-500" />
                  <div>
                    <div className="font-medium">{flow.name}</div>
                    {flow.description && (
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        {flow.description}
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(flow.timestamp), { addSuffix: true })}
                    </div>
                  </div>
                </div>
                
                <IconButton
                  size="sm"
                  variant="ghost"
                  color="red"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(flow.id);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </IconButton>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default OpenFlowModal; 
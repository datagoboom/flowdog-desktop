import { useState, useEffect } from 'react';
import Modal from '../../common/Modal';
import { FolderOpen, FileJson, Clock, Trash2, Search } from 'lucide-react';
import { useApi } from '../../../contexts/ApiContext';
import { formatDistanceToNow } from 'date-fns';
import IconButton from '../../common/IconButton';
import Input from '../../common/Input';

const OpenFlowModal = ({ isOpen, onClose, onOpen }) => {
  const [flows, setFlows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const api = useApi();

  useEffect(() => {
    if (isOpen) {
      loadFlows();
    }
  }, [isOpen]);

  const loadFlows = async () => {
    try {
      setLoading(true);
      const result = await api.flow.list();
      if (result.success) {
        setFlows(result.data || []);
      } else {
        console.error('Failed to load flows:', result.error);
        setFlows([]);
      }
    } catch (error) {
      console.error('Failed to load flows:', error);
      setFlows([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (flowId) => {
    if (window.confirm('Are you sure you want to delete this flow?')) {
      try {
        const result = await api.flow.delete(flowId);
        if (result.success) {
          await loadFlows(); // Refresh list
        } else {
          console.error('Failed to delete flow:', result.error);
        }
      } catch (error) {
        console.error('Failed to delete flow:', error);
      }
    }
  };

  const filteredFlows = flows.filter(flow => 
    flow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (flow.description && flow.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Open Flow"
      icon={<FolderOpen className="w-5 h-5" />}
      maxWidth="max-w-xl"
    >
      <div className="space-y-4 h-full">
        <div className="h-full sticky top-0 py-2 z-10">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search flows..."
            leftIcon={<Search className="w-4 h-4" />}
            fullWidth
            variant="filled"
          />
        </div>

        {loading ? (
          <div className="text-center py-8">
            Loading saved flows...
          </div>
        ) : filteredFlows.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            {searchTerm ? 'No flows match your search' : 'No saved flows found'}
          </div>
        ) : (
          <div className="pr-2 -mr-2">
            <div className="grid gap-2 overflow-y-auto h-[50vh] border-t border-b border-slate-400 dark:border-slate-400 px-4">
              {filteredFlows.map((flow) => (
                <div
                  key={flow.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
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
          </div>
        )}
      </div>
    </Modal>
  );
};

export default OpenFlowModal; 
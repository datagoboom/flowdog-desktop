import { useState } from 'react';
import Modal from '../../common/Modal';
import Input from '../../common/Input';
import Button from '../../common/Button';
import { Save } from 'lucide-react';
import { useFlow } from '../../../contexts/FlowContext';
import { useApi } from '../../../contexts/ApiContext';

const SaveFlowModal = ({ isOpen, onClose }) => {
  const { nodes, edges } = useFlow();
  const { flow } = useApi();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    
    try {
      setSaving(true);
      await flow.save({
        name: name.trim(),
        description: description.trim(),
        nodes,
        edges
      });
      
      setName('');
      setDescription('');
      onClose();
    } catch (error) {
      console.error('Failed to save flow:', error);
      // TODO: Add error handling/notification
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Save Flow"
      icon={<Save className="w-5 h-5" />}
    >
      <div className="space-y-4">
        <div>
          <label className="text-sm mb-1 block">Flow Name</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter flow name"
            autoFocus
          />
        </div>
        
        <div>
          <label className="text-sm mb-1 block">Description (optional)</label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter flow description"
          />
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button
            variant="text"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            variant="filled"
            color="blue"
            onClick={handleSave}
            disabled={!name.trim() || saving}
            loading={saving}
            startIcon={<Save className="w-4 h-4" />}
          >
            Save Flow
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default SaveFlowModal; 
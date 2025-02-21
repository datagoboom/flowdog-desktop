import { useState } from 'react';
import Modal from '../../common/Modal';
import Input from '../../common/Input';
import Button from '../../common/Button';
import { Save } from 'lucide-react';

const SaveFlowModal = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      description: description.trim(),
      timestamp: Date.now()
    });
    onClose();
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
          >
            Cancel
          </Button>
          <Button
            variant="filled"
            color="blue"
            onClick={handleSave}
            disabled={!name.trim()}
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
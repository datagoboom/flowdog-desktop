import { useState } from 'react';
import Modal from '../../common/Modal';
import Input from '../../common/Input';
import Button from '../../common/Button';
import { LayoutDashboard } from 'lucide-react';

const CreateDashboardModal = ({ isOpen, onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsSubmitting(true);
      await onCreate({
        name: name.trim(),
        description: description.trim()
      });
      
      // Reset form
      setName('');
      setDescription('');
    } catch (error) {
      console.error('Failed to create dashboard:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Dashboard"
      icon={<LayoutDashboard className="w-5 h-5" />}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Dashboard Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Dashboard"
          required
          autoFocus
        />

        <Input
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional dashboard description"
        />

        <div className="flex justify-end gap-2 mt-6">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="filled"
            color="primary"
            disabled={!name.trim() || isSubmitting}
            loading={isSubmitting}
          >
            Create Dashboard
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateDashboardModal; 
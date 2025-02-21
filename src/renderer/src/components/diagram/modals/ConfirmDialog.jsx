import Modal from '../../common/Modal';
import Button from '../../common/Button';
import { AlertTriangle } from 'lucide-react';

const ConfirmDialog = ({ 
  isOpen, 
  onClose,
  title = "Confirm Action",
  message,
  onYes,
  onNo,
  onCancel = onClose,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      icon={<AlertTriangle className="w-5 h-5 text-yellow-500" />}
    >
      <div className="space-y-4">
        <p className="text-slate-600 dark:text-slate-300">
          {message}
        </p>
        
        <div className="flex justify-end gap-2">
          <Button
            variant="text"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            variant="text"
            color="red"
            onClick={onNo}
          >
            No
          </Button>
          <Button
            variant="filled"
            color="blue"
            onClick={onYes}
          >
            Yes
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog; 
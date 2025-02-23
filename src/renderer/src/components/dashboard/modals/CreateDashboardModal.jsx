import { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import Button from '../../common/Button';
import Input from '../../common/Input';
import { useDashboards } from '../../../contexts/DashboardContext';

const CreateDashboardModal = ({ isOpen, onClose }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const { createDashboard } = useDashboards();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await createDashboard({
        name,
        description,
        panels: [],
        created_at: Date.now(),
        updated_at: Date.now()
      });
      
      onClose();
      setName('');
      setDescription('');
    } catch (error) {
      console.error('Failed to create dashboard:', error);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto bg-slate-900/20">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full text-slate-900 dark:text-white max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-slate-700 p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6"
                >
                  Create New Dashboard
                </Dialog.Title>

                <form onSubmit={handleSubmit}>
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium">
                        Dashboard Name
                      </label>
                      <Input
                        type="text"
                        value={name}
                        fullWidth
                        onChange={(e) => setName(e.target.value)}
                        className="mt-1"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium">
                        Description
                      </label>
                      <Input
                        type="text"
                        fullWidth
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end gap-2">
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
                    >
                      Create Dashboard
                    </Button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}; 

export default CreateDashboardModal;
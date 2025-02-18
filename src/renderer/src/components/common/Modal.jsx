import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X } from 'lucide-react';
import { cn } from '../../utils';

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  icon,
  maxWidth = 'max-w-md'
}) => {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog 
        as="div" 
        className="relative z-50"
        onClose={onClose}
      >
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
        </Transition.Child>

        {/* Modal */}
        <div className="fixed inset-0 overflow-y-auto">
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
              <Dialog.Panel 
                className={cn(
                  "w-full transform overflow-hidden rounded-lg bg-white dark:bg-slate-800 p-6 text-left align-middle shadow-xl transition-all",
                  maxWidth
                )}
              >
                {/* Header */}
                <Dialog.Title
                  as="div"
                  className="flex items-center justify-between mb-4"
                >
                  <div className="flex items-center gap-2">
                    {icon && (
                      <span className="text-slate-500 dark:text-slate-400">
                        {icon}
                      </span>
                    )}
                    <h3 className="text-lg font-medium leading-6 text-slate-900 dark:text-white">
                      {title}
                    </h3>
                  </div>
                  <button
                    type="button"
                    className="rounded-full p-1 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    onClick={onClose}
                  >
                    <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                  </button>
                </Dialog.Title>

                {/* Content */}
                <div className="mt-2">
                  {children}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default Modal; 
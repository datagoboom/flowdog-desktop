import { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { X } from 'lucide-react';
import { Body1, Body2 } from '../../common/Typography';
import { cn } from '../../../utils';

export default function SaveNodeModal({ isOpen, onClose, onSave, nodeType }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      await onSave({ name, description });
      onClose();
    } catch (error) {
      console.error('Failed to save template:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className={cn(
          "mx-auto max-w-sm rounded-lg",
          "bg-white dark:bg-slate-800",
          "p-6 shadow-xl"
        )}>
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-medium">
              Save Node Template
            </Dialog.Title>
            <button
              onClick={onClose}
              className={cn(
                "rounded-full p-1",
                "hover:bg-slate-100 dark:hover:bg-slate-700",
                "transition-colors"
              )}
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Template Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={`${nodeType.label} Template`}
                className={cn(
                  "w-full px-3 py-2",
                  "rounded-md",
                  "border border-slate-200 dark:border-slate-700",
                  "bg-white dark:bg-slate-900",
                  "focus:outline-none focus:ring-2",
                  "focus:ring-blue-500 dark:focus:ring-blue-400"
                )}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe this template..."
                rows={3}
                className={cn(
                  "w-full px-3 py-2",
                  "rounded-md",
                  "border border-slate-200 dark:border-slate-700",
                  "bg-white dark:bg-slate-900",
                  "focus:outline-none focus:ring-2",
                  "focus:ring-blue-500 dark:focus:ring-blue-400"
                )}
              />
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={onClose}
                className={cn(
                  "px-4 py-2 rounded-md",
                  "text-slate-700 dark:text-slate-300",
                  "hover:bg-slate-100 dark:hover:bg-slate-700",
                  "transition-colors"
                )}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!name.trim() || saving}
                className={cn(
                  "px-4 py-2 rounded-md",
                  "bg-blue-500 hover:bg-blue-600",
                  "text-white",
                  "transition-colors",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {saving ? 'Saving...' : 'Save Template'}
              </button>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 
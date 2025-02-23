import { memo, useEffect, useState } from 'react';
import { cn } from '../../../../utils';
import { useTheme } from '../../../../contexts/ThemeContext';
import { NODE_TYPES } from '../../../../constants/nodeTypes';
import { Body1, Body2 } from '../../../common/Typography';
import { useFlow } from '../../../../contexts/FlowContext';
import { Info, Loader, Save } from 'lucide-react';
import SaveNodeModal from '../../modals/SaveNodeModal';

const NodeInfo = memo(({ node }) => {
  if (!node) node = {};
  const { isDark } = useTheme(); 
  const { updateNodeData } = useFlow();
  const nodeType = NODE_TYPES[node.type];
  const [fakeLoading, setFakeLoading] = useState(false)
  const [saving, setSaving] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  const handleNameChange = (e) => {
    updateNodeData(node.id, 'name', e.target.value);
  };

  const handleSaveNode = async ({ name, description }) => {
    try {
      setSaving(true);
      console.log('Saving node template...', { name, description });
      
      const nodeTemplate = {
        type: node.type,
        data: { ...node.data },
        name: name,
        description: description,
        timestamp: Date.now()
      };
      
      console.log('Node template data:', nodeTemplate);

      const result = await window.api.storage.saveNodeTemplate(nodeTemplate);
      console.log('Save result:', result);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      // Add this to refresh templates in DiagramPalette
      window.dispatchEvent(new Event('template-saved'));
      
    } catch (error) {
      console.error('Failed to save node template:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!nodeType) {
    return (
      <div className="p-4 text-center text-slate-400">
        <Body2>
          {node.type ? 'No valid node selected' : 'No node selected'}
        </Body2>
      </div>
    );
  }

  const ConfigComponent = nodeType.config;

  return (
    <>
      <div className="space-y-4">
        {/* Node Header Info */}
        <div className="pb-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {nodeType.icon && (
                <nodeType.icon 
                  size={20} 
                  className={`text-semantic-${nodeType.color}`}
                />
              )}
              <Body1 className="font-semibold">
                {nodeType.label} Node
              </Body1>
            </div>
            <button
              onClick={() => setIsSaveModalOpen(true)}
              disabled={saving}
              className={cn(
                "p-2 rounded-md",
                "hover:bg-slate-100 dark:hover:bg-slate-800",
                "transition-colors",
                "text-slate-500 hover:text-slate-700",
                "dark:text-slate-400 dark:hover:text-slate-200"
              )}
            >
              {saving ? (
                <Loader className="animate-spin" size={20} />
              ) : (
                <Save size={20} />
              )}
            </button>
          </div>
          <div className="text-slate-500">
            <Body2>ID: {node.id}</Body2>
          </div>
          <div className="mt-2">
            <input
              type="text"
              className={cn(
                "w-full px-2 py-1",
                "bg-transparent",
                "border border-slate-200 dark:border-slate-700",
                "rounded",
                "text-sm",
                "focus:outline-none focus:ring-1",
                `focus:ring-semantic-${nodeType.color}`,
                "placeholder:text-slate-400"
              )}
              value={node.data?.name || ''}
              onChange={handleNameChange}
              placeholder={"Enter a name (optional)"}
            />
          </div>
        </div>

        {/* Node Description */}
        <div className="px-1">
          <Body2 className="text-slate-500">{nodeType.description}</Body2>
        </div>

        {/* Node Configuration */}
        <div className="space-y-4">
          {ConfigComponent ? (
            <ConfigComponent node={node} />
          ) : (
            <div className="text-center text-slate-400 mt-4">
              <Body2>Configuration not available for this node type</Body2>
            </div>
          )}
        </div>
      </div>

      <SaveNodeModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onSave={handleSaveNode}
        nodeType={nodeType}
      />
    </>
  );
});

NodeInfo.displayName = 'NodeInfo';
NodeInfo.info = {
  label: 'Node Info',
  icon: Info,
  description: 'View information about the selected node',
  color: 'purple',
}

export default NodeInfo; 
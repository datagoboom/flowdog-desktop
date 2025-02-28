import { useState, memo, useEffect, useRef } from 'react';
import { useFlow } from '../../../contexts/FlowContext';
import { cn } from '../../../utils';
import { useTheme } from '../../../contexts/ThemeContext';
import { Body1, Body2 } from '../../common/Typography';
import NodeInfo from './panels/NodeInfo';
import DebugPanel from './panels/DebugPanel';
import LogsPanel from './panels/LogsPanel';
import EnvironmentManager from './panels/EnvironmentManager';
import UtilitySidebar from './UtilitySidebar';
import SidebarItem from '../../common/SidebarItem';
import { Info, FileText, Bug, Settings } from 'lucide-react';

const UtilityDrawer = memo(() => {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('info');
  const { isDark } = useTheme();
  const { selectedNode, autoOpenDrawer, autoCloseDrawer } = useFlow();
  const drawerRef = useRef(null);
  const lastNodeRef = useRef(null);

  useEffect(() => {
    if (selectedNode && autoOpenDrawer) {
      lastNodeRef.current = selectedNode.id;
      setIsOpen(true);
      setActiveTab('info');
    }
  }, [selectedNode, autoOpenDrawer]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  const handleBlur = (e) => {

    if (autoCloseDrawer && 
        !e.currentTarget.contains(e.relatedTarget) && 
        (!e.relatedTarget || !e.relatedTarget.closest('.react-flow__node'))) {
      setIsOpen(false);
    }
  };

  return (
    <div
      id="utility-drawer"
      ref={drawerRef}
      className={cn(
        "fixed top-0 right-0 h-full",
        "bg-slate-300 dark:bg-slate-900",
        "border-l border-slate-200 dark:border-slate-700",
        "transition-all duration-250 ease-in-out",
        "z-50",
        "flex flex-row",
        isOpen ? `w-[30vw] min-w-[500px]` : `w-[72px]`
      )}
      onBlur={handleBlur}
      tabIndex={0}
    >
      <UtilitySidebar
        position="left"
        open={isOpen}
        callback={handleToggle}
      >
        <SidebarItem
          utility={true}
          icon={<Info size={20} />}
          text="Node Info"
          active={activeTab === 'info'}
          onClick={() => handleTabClick('info')}
        />
        <SidebarItem
          utility={true}
          icon={<FileText size={20} />}
          text="Logs"
          active={activeTab === 'logs'}
          onClick={() => handleTabClick('logs')}
        />
        <SidebarItem
          utility={true}
          icon={<Bug size={20} />}
          text="Debug"
          active={activeTab === 'debug'}
          onClick={() => handleTabClick('debug')}
        />
        <SidebarItem
          utility={true}
          icon={<Settings size={20} />}
          text="Environment"
          active={activeTab === 'environment'}
          onClick={() => handleTabClick('environment')}
        />
      </UtilitySidebar>
      
      {isOpen && (
        <div className="flex-1 min-w-0">
          <div className="h-full overflow-y-auto">
            <div className="p-4">
              {activeTab === 'info' && <NodeInfo node={selectedNode} />}
              {activeTab === 'logs' && <LogsPanel />}
              {activeTab === 'debug' && <DebugPanel />}
              {activeTab === 'environment' && <EnvironmentManager />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

UtilityDrawer.displayName = 'UtilityDrawer';

export default UtilityDrawer;
import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../common/Sidebar';
import Box from '../common/Box';
import SidebarItem from '../common/SidebarItem';
import {
  Home,
  Waves,
  Settings,
} from 'lucide-react';

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  const navigationItems = [
    {
      icon: <Home className="w-5 h-5" />,
      text: 'Dashboard',
      path: '/',
    },
    {
      icon: <Waves className="w-5 h-5" />,
      text: 'Flows',
      path: '/flows',
    },
    {
      icon: <Settings className="w-5 h-5" />,
      text: 'Settings',
      path: '/settings',
    },
  ];


  return (
    <div className="relative flex h-[calc(100vh-40px)] overflow-hidden text-dark-text bg-white dark:bg-slate-900">
      {/* Sidebar with darker background */}
      <Sidebar>
        {navigationItems.map((item) => (
          <SidebarItem
            showToggle={true}
            key={item.path}
            icon={item.icon}
            text={item.text}
            active={location.pathname === item.path}
            onClick={() => navigate(item.path)}
          />
        ))}
      </Sidebar>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0" id="main-content">
        {/* Page Content */}
        <Box
          id="page-content"
          className={`
            flex-1
            transition-all
            duration-300
            border-none
            ${sidebarExpanded ? 'ml-0' : '-ml-[200px]'}
          `.trim()}
        >
          <div className="w-full" id="page-content-inner">
            <Outlet />
          </div>
        </Box>
      </div>
    </div>
  );
};

export default Layout; 
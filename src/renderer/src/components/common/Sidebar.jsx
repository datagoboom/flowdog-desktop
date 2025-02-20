import { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '../../contexts/ThemeContext';
import Box from './Box';
import IconButton from './IconButton';
import { useDiagram } from '../../contexts/DiagramContext';
import { ThemeToggle } from './ThemeToggle';
import { LogOut } from 'lucide-react';
import {ChevronLeft, ChevronRight} from 'lucide-react';
import { Sun, Moon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Sidebar = ({
  children,
  position = 'left',
  showToggle = true,
  width = {
    expanded: 200,
    collapsed: 72,
  },
  className = '',
  ...props
}) => {
  const { sidebarOpen, setSidebarOpen } = useDiagram();
  const [isOpen, setIsOpen] = useState(sidebarOpen);
  const { isDark, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    setSidebarOpen(isOpen);
  }, [isOpen]);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = () => {
    console.log('Logging out...');
    logout();
    // TODO: redirect to login page
    navigate('/login');
  };

  return (
    <Box
      className={`
        flex
        flex-col
        h-[calc(100vh-40px)]
        sticky
        top-0
        left-0
        transition-all
        duration-200
        ease-in-out
        overflow-x-hidden
        overflow-y-auto
        bg-slate-700
        border-0
        ${className}
      `.trim()}
      style={{
        width: isOpen ? width.expanded : width.collapsed,
      }}
      opacity={10}
      blur={2}
      {...props}
    >
      <div className="flex-1 py-2 text-slate-300">
        {children}
      </div>
      <div 
        onClick={toggleSidebar}
        className={`
          absolute
          right-0
          top-1/2
          -translate-y-1/2
          flex
          justify-center
        items-center
        w-[30px]
        h-[60px]
        border-l border-t border-b border-slate-700
        cursor-pointer
        bg-slate-00
        hover:bg-slate-700
        rounded-l-md
      `}>
        {isOpen && <ChevronLeft size={20} color="white" />}
        {!isOpen && <ChevronRight size={20}  color="white" />}
      </div>

      {!isOpen && (
        <div className="flex justify-center items-center p-2 cursor-pointer">
          {isDark ? <Sun size={20} onClick={toggleTheme} color="yellow" /> : <Moon size={20} onClick={toggleTheme} color="white" />}
        </div>
      )}

      {/* Bottom Controls */}
      <div className="p-2 border-t border-slate-700 flex items-center justify-between">
        <IconButton
          icon={<LogOut size={20} />}
          variant="text"
          size="sm"
          className="text-slate-300 hover:bg-slate-800"
          onClick={handleLogout}
        />
        {isOpen && <ThemeToggle />}
      </div>
    </Box>
  );
};

Sidebar.propTypes = {
  children: PropTypes.node.isRequired,
  position: PropTypes.oneOf(['left', 'right']),
  showToggle: PropTypes.bool,
  width: PropTypes.shape({
    expanded: PropTypes.number,
    collapsed: PropTypes.number,
  }),
  className: PropTypes.string,
};

export default Sidebar; 
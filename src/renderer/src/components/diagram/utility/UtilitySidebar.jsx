import { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '../../../contexts/ThemeContext';
import Box from '../../common/Box';
import {ChevronLeft, ChevronRight} from 'lucide-react';

const UtilitySidebar = ({
  children,
  position = 'right',
  className = '',
  width = 72,
  callback,
  open = true,
  ...props
}) => {

  const [isOpen, setIsOpen] = useState(open);
  const [activePanel, setActivePanel] = useState(null);
  const {isDark} = useTheme()

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (callback) callback();
  }

  useEffect(() => {
    setIsOpen(open);
  }, [open]);


  return (
    <Box
      className={`
        flex
        flex-col
        h-screen
        sticky
        top-0
        ${position === 'left' ? 'left-0' : 'right-0'}
        overflow-x-hidden
        overflow-y-auto
        bg-slate-700
        border-l-0
        border-slate-700
        ${className}
      `.trim()}
      style={{
        width: width,
      }}
      opacity={10}
      blur={2}
      rounded="none"
      {...props}
    >
      <div className="flex-1 py-2 text-slate-300">
        {children}
      </div>
      <div
      onClick={handleToggle} 
      className={`
        absolute
        left-0
        top-1/2
        -translate-y-1/2
        flex
        justify-center
        items-center
        w-[30px]
        h-[60px]
        border-r border-t border-b
        border-slate-700
        cursor-pointer
        bg-slate-800
        hover:bg-slate-700
        rounded-r-md
      `}>
        {isOpen ? <ChevronRight size={20} color="white" /> : <ChevronLeft size={20} color="white" />}
      </div>

    </Box>
  );
};

UtilitySidebar.propTypes = {
  children: PropTypes.node.isRequired,
  position: PropTypes.oneOf(['left', 'right']),
  width: PropTypes.number,
  className: PropTypes.string,
  callback: PropTypes.func,
  open: PropTypes.bool,
};

export default UtilitySidebar; 
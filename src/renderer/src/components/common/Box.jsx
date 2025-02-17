import {useEffect} from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '../../contexts/ThemeContext';
import { cn } from '../../utils'

const BLUR_LEVELS = {
  0: 'backdrop-blur-none',
  1: 'backdrop-blur-sm', // 4px
  2: 'backdrop-blur-md', // 8px
  3: 'backdrop-blur-lg', // 12px
  4: 'backdrop-blur-xl', // 16px
  5: 'backdrop-blur-2xl', // 24px
  6: 'backdrop-blur-3xl', // 48px
};

const OPACITY_LEVELS = {
  0: 'bg-opacity-0',
  1: 'bg-opacity-5',
  2: 'bg-opacity-10',
  3: 'bg-opacity-20',
  4: 'bg-opacity-30',
  5: 'bg-opacity-40',
  6: 'bg-opacity-50',
  7: 'bg-opacity-60',
  8: 'bg-opacity-70',
  9: 'bg-opacity-80',
  10: 'bg-opacity-90',
};

const Box = ({
  children,
  className = '',
  blur = 5,
  opacity = 10,
  selected = false, 
  border = true,
  borderOpacity = 2,
  shadow = true,
  rounded = 'lg',
  padding = 4,
  as: Component = 'div',
  ...props
}) => {
  const { isDark } = useTheme();

  const baseClasses = cn(
    "transition-all duration-200 overflow-hidden border-2",
    BLUR_LEVELS[blur],
    OPACITY_LEVELS[opacity],
    
    // Border styles
    border && cn(
      "border",
      "border-slate-400",
      OPACITY_LEVELS[borderOpacity]
    ),
    
    // Shadow styles
    shadow && "shadow-md",
    shadow && (isDark ? "shadow-slate-900" : "shadow-slate-300"),
    
    // Padding
    padding && `p-${padding}`,
    
    // Background colors - increased contrast for light mode
    isDark ? "bg-slate-800" : "bg-slate-100",
    
    // Selection styles
    selected && "ring-1",
    selected && (isDark ? "ring-semantic-yellow" : "ring-slate-500")
  );
    
  return (
    <Component
      className={cn(baseClasses, className)}
      {...props}
    >
      {children}
    </Component>
  );
};

Box.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  blur: PropTypes.oneOf([0, 1, 2, 3, 4, 5, 6]),
  opacity: PropTypes.oneOf([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
  border: PropTypes.bool,
  borderOpacity: PropTypes.oneOf([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
  shadow: PropTypes.bool,
  rounded: PropTypes.oneOf(['none', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', 'full']),
  padding: PropTypes.oneOf([0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16]),
  as: PropTypes.elementType,
};

export default Box; 
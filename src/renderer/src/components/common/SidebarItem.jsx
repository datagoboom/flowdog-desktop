import { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '../../contexts/ThemeContext';
import { useDiagram } from '../../contexts/DiagramContext';
import { Body1 } from './Typography';
import Ripple from './Ripple';
import { cn } from '../../utils';

const SidebarItem = forwardRef(({
  icon,
  text,
  active = false,
  disabled = false,
  showTextWhenCollapsed = false,
  utility = false,
  showToggle = true,
  isOpen: isOpenProp,
  notification = false,
  className = '',
  onClick,
  ...props
}, ref) => {
  const diagramContext = useDiagram();
  const { isDark } = useTheme();
  const { ripples, addRipple } = Ripple({ color: "rgba(255, 255, 255, 0.2)", duration: 1000 });

  // Use prop for utility variant, context for default
  const effectiveIsOpen = utility ? isOpenProp : diagramContext.sidebarOpen;

  const handleClick = (event) => {
    if (!disabled) {
      addRipple(event);
      onClick?.(event);
    }
  };

  return (
    <div
      ref={ref}
      className={cn(
        "relative",
        "group",
        "px-3",
        "py-2",
        "mx-2",
        "rounded-lg",
        "cursor-pointer",
        "transition-all",
        "duration-200",
        "overflow-hidden",
        disabled ? 'opacity-50 cursor-not-allowed' : '',
        className
      )}
      onClick={handleClick}
      {...props}
    >
      <div className={cn(
        "flex",
        "items-center",
        "gap-3",
        effectiveIsOpen ? '' : 'justify-center'
      )}>
        <div className="relative">
          {icon && (
            <span className={cn(
              "flex-shrink-0",
              !effectiveIsOpen ? (active ? 'text-orange-500' : 'text-aqua-800') : (active ? 'text-aqua-500' : 'text-aqua-800')
            )}>
              {icon}
            </span>
          )}
          {notification && (
            <div className={cn(
              "absolute",
              "-top-1",
              "-right-1",
              "w-2.5",
              "h-2.5",
              "rounded-full",
              "bg-red-400",
              "border-2",
              "border-slate-900",
              "animate-pulse"
            )} />
          )}
        </div>
        
        {(effectiveIsOpen || showTextWhenCollapsed) && (
          <Body1
            className={cn(
              "whitespace-nowrap",
              "transition-opacity",
              "duration-200",
              "text-slate-400",
              effectiveIsOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
              active ? 'text-orange-500 font-medium' : '',
              !effectiveIsOpen && showTextWhenCollapsed ? 'absolute left-full ml-2 px-2 py-1 rounded-md backdrop-blur-md bg-black/50' : ''
            )}
          >
            {text}
          </Body1>
        )}
      </div>
      {effectiveIsOpen && ripples}
    </div>
  );
});

SidebarItem.displayName = 'SidebarItem';

SidebarItem.propTypes = {
  icon: PropTypes.node,
  text: PropTypes.string,
  active: PropTypes.bool,
  disabled: PropTypes.bool,
  showTextWhenCollapsed: PropTypes.bool,
  utility: PropTypes.bool,
  showToggle: PropTypes.bool,
  isOpen: PropTypes.bool,
  notification: PropTypes.bool,
  className: PropTypes.string,
  onClick: PropTypes.func,
};

export default SidebarItem; 
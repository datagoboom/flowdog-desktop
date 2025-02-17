import { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '../../contexts/ThemeContext';

const NavbarItem = forwardRef(({
  children,
  icon,
  active = false,
  disabled = false,
  className = '',
  mobileFullWidth = true,
  onClick,
  ...props
}, ref) => {
  const { isDark } = useTheme();

  const handleClick = (event) => {
    if (!disabled && onClick) {
      onClick(event);
    }
  };

  return (
    <div
      ref={ref}
      className={`
        relative
        group
        px-3
        py-2
        rounded-lg
        transition-all
        duration-200
        ${active ? (
          isDark ? 'bg-dark-background/50' : 'bg-light-background/50'
        ) : (
          'hover:bg-dark-background/30 dark:hover:bg-light-background/10'
        )}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${mobileFullWidth ? 'w-full md:w-auto' : ''}
        ${className}
      `.trim()}
      onClick={handleClick}
      {...props}
    >
      <div className="flex items-center gap-2">
        {icon && (
          <span className={`
            flex-shrink-0
            ${active ? 'text-blue-500' : ''}
          `}>
            {icon}
          </span>
        )}
        <span className={`
          whitespace-nowrap
          font-medium
          ${active ? 'text-blue-500' : ''}
        `}>
          {children}
        </span>
      </div>
    </div>
  );
});

NavbarItem.displayName = 'NavbarItem';

NavbarItem.propTypes = {
  children: PropTypes.node.isRequired,
  icon: PropTypes.node,
  active: PropTypes.bool,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  mobileFullWidth: PropTypes.bool,
  onClick: PropTypes.func,
};

export default NavbarItem; 
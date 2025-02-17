import { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '../../contexts/ThemeContext';
import { cn } from '../../utils';

const ToggleButton = forwardRef(({
  selected = false,
  disabled = false,
  color = 'blue',
  size = 'md',
  className = '',
  ...props
}, ref) => {
  const { isDark } = useTheme();

  const sizes = {
    xs: 'w-8 h-4',
    sm: 'w-10 h-5',
    md: 'w-12 h-6',
    lg: 'w-14 h-7',
    xl: 'w-16 h-8',
  };

  const thumbSizes = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-7 h-7',
  };

  const colors = {
    blue: {
      selected: 'bg-blue-500',
      thumb: 'bg-white',
      track: isDark ? 'bg-slate-700' : 'bg-slate-200',
    },
    green: {
      selected: 'bg-green-500',
      thumb: 'bg-white',
      track: isDark ? 'bg-slate-700' : 'bg-slate-200',
    },
    red: {
      selected: 'bg-red-500',
      thumb: 'bg-white',
      track: isDark ? 'bg-slate-700' : 'bg-slate-200',
    },
    purple: {
      selected: 'bg-purple-500',
      thumb: 'bg-white',
      track: isDark ? 'bg-slate-700' : 'bg-slate-200',
    },
    orange: {
      selected: 'bg-orange-500',
      thumb: 'bg-white',
      track: isDark ? 'bg-slate-700' : 'bg-slate-200',
    },
  };

  return (
    <button
      ref={ref}
      type="button"
      role="switch"
      aria-checked={selected}
      disabled={disabled}
      className={cn(
        'relative inline-flex flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out',
        disabled && 'opacity-50 cursor-not-allowed',
        selected ? colors[color].selected : colors[color].track,
        sizes[size],
        className
      )}
      {...props}
    >
      <span
        className={cn(
          'pointer-events-none inline-block transform rounded-full transition duration-200 ease-in-out',
          colors[color].thumb,
          thumbSizes[size],
          selected ? 'translate-x-full' : 'translate-x-0',
          'shadow-lg',
          'absolute top-[2px] left-[2px]'
        )}
      />
    </button>
  );
});

ToggleButton.displayName = 'ToggleButton';

ToggleButton.propTypes = {
  selected: PropTypes.bool,
  disabled: PropTypes.bool,
  color: PropTypes.oneOf(['blue', 'green', 'red', 'purple', 'orange']),
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
  className: PropTypes.string,
};

export default ToggleButton; 
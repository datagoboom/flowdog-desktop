import { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '../../contexts/ThemeContext';
import { Body2 } from './Typography';

const Switch = forwardRef(({
  label,
  error,
  helper,
  disabled = false,
  className = '',
  containerClassName = '',
  size = 'md',
  color = 'blue',
  ...props
}, ref) => {
  const { isDark } = useTheme();

  const sizes = {
    sm: {
      switch: 'w-8 h-4',
      thumb: 'w-3 h-3',
      translate: 'translate-x-4',
      label: 'text-sm'
    },
    md: {
      switch: 'w-11 h-6',
      thumb: 'w-5 h-5',
      translate: 'translate-x-5',
      label: 'text-base'
    },
    lg: {
      switch: 'w-14 h-7',
      thumb: 'w-6 h-6',
      translate: 'translate-x-7',
      label: 'text-lg'
    }
  };

  const colors = {
    blue: 'checked:bg-blue-500',
    green: 'checked:bg-green-500',
    red: 'checked:bg-red-500',
    purple: 'checked:bg-purple-500',
    orange: 'checked:bg-orange-500',
  };

  return (
    <div className={`${containerClassName}`.trim()}>
      <label className={`
        inline-flex
        items-center
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `.trim()}>
        <div className="relative">
          <input
            type="checkbox"
            ref={ref}
            disabled={disabled}
            className="sr-only"
            {...props}
          />
          
          <div className={`
            ${sizes[size].switch}
            backdrop-blur-sm
            ${isDark ? 'bg-dark-comment/30' : 'bg-light-comment/30'}
            rounded-full
            ${colors[color]}
            transition-colors
            duration-200
            ${className}
          `.trim()} />
          
          <div className={`
            absolute
            top-0.5
            left-0.5
            ${sizes[size].thumb}
            bg-white
            rounded-full
            shadow-lg
            transition-transform
            duration-200
            ${props.checked ? sizes[size].translate : 'translate-x-0'}
            backdrop-blur-xl
            ${isDark ? 'bg-opacity-90' : 'bg-opacity-100'}
          `} />
        </div>
        
        {label && (
          <span className={`
            ml-3
            ${sizes[size].label}
            ${isDark ? 'text-dark-foreground' : 'text-light-foreground'}
          `.trim()}>
            {label}
          </span>
        )}
      </label>

      {(error || helper) && (
        <Body2
          className={`
            mt-1
            ${error ? 'text-red-500' : isDark ? 'text-dark-comment' : 'text-light-comment'}
          `.trim()}
        >
          {error || helper}
        </Body2>
      )}
    </div>
  );
});

Switch.displayName = 'Switch';

Switch.propTypes = {
  label: PropTypes.string,
  error: PropTypes.string,
  helper: PropTypes.string,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  containerClassName: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  color: PropTypes.oneOf(['blue', 'green', 'red', 'purple', 'orange']),
  checked: PropTypes.bool,
};

export default Switch; 
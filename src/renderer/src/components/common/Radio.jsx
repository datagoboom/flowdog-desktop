import { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '../../contexts/ThemeContext';
import { Body2 } from './Typography';

const Radio = forwardRef(({
  label,
  error,
  helper,
  disabled = false,
  className = '',
  containerClassName = '',
  size = 'md',
  ...props
}, ref) => {
  const { isDark } = useTheme();

  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const dotSizes = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3'
  };

  const labelSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
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
            type="radio"
            ref={ref}
            disabled={disabled}
            className={`
              appearance-none
              rounded-full
              border-2
              ${isDark ? 'border-dark-comment' : 'border-light-comment'}
              ${isDark ? 'bg-dark-background' : 'bg-light-background'}
              checked:border-blue-500
              disabled:opacity-50
              disabled:cursor-not-allowed
              transition-all
              duration-200
              ${sizes[size]}
              ${className}
            `.trim()}
            {...props}
          />
          <div className={`
            absolute
            inset-0
            pointer-events-none
            flex
            items-center
            justify-center
            transition-opacity
            ${props.checked ? 'opacity-100' : 'opacity-0'}
          `}>
            <div className={`
              rounded-full
              bg-blue-500
              ${dotSizes[size]}
            `} />
          </div>
        </div>
        
        {label && (
          <span className={`
            ml-2
            ${labelSizes[size]}
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

Radio.displayName = 'Radio';

Radio.propTypes = {
  label: PropTypes.string,
  error: PropTypes.string,
  helper: PropTypes.string,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  containerClassName: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  checked: PropTypes.bool,
};

export default Radio; 
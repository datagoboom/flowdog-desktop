import { forwardRef, useState, memo } from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '../../contexts/ThemeContext';
import { Body2 } from './Typography';
import { cn } from '../../utils';

const Select = memo(({
  label,
  error,
  helper,
  options = [],
  fullWidth = false,
  disabled = false,
  className = '',
  containerClassName = '',
  size = 'md',
  variant = 'outlined',
  placeholder = 'Select an option',
  value,
  onChange,
  ...props
}) => {
  const { isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const sizes = {
    sm: 'h-8 text-sm px-2',
    md: 'h-10 text-base px-3',
    lg: 'h-12 text-lg px-4'
  };

  const variants = {
    outlined: `
      border-2
      ${isDark ? 'border-dark-comment' : 'border-light-comment'}
      focus:border-blue-500
    `,
    filled: `
      ${isDark ? 'bg-slate-700' : 'bg-slate-200'}
      border-transparent
      focus:border-blue-500
    `,
    glass: `
      backdrop-blur-sm
      ${isDark ? 'bg-dark-background/30' : 'bg-light-background/30'}
      border
      ${isDark ? 'border-dark-comment/30' : 'border-light-comment/30'}
      focus:border-blue-500
    `
  };

  const baseSelectClasses = `
    w-full
    outline-none
    rounded-lg
    transition-all
    duration-200
    disabled:opacity-50
    disabled:cursor-not-allowed
    appearance-none
    bg-no-repeat
    bg-[url('data:image/svg+xml;charset=US-ASCII,<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 7.5L10 12.5L15 7.5" stroke="%236B7280" stroke-width="1.67" stroke-linecap="round" stroke-linejoin="round"/></svg>')]
    bg-[center_right_0.5rem]
    ${isDark ? 'text-dark-foreground' : 'text-light-foreground'}
    ${variants[variant]}
    ${sizes[size]}
    ${error ? 'border-red-500 focus:border-red-500' : ''}
  `;

  const handleChange = (e) => {
    const newValue = e.target.value;
    onChange(newValue);
  };

  return (
    <div className={`
      ${fullWidth ? 'w-full' : 'max-w-sm'}
      ${containerClassName}
    `.trim()}>
      {label && (
        <label className={`
          block
          mb-1.5
          text-sm
          font-medium
          ${isDark ? 'text-dark-foreground' : 'text-light-foreground'}
          ${disabled ? 'opacity-50' : ''}
        `.trim()}>
          {label}
        </label>
      )}
      
      <select
        value={value || ''}
        onChange={handleChange}
        disabled={disabled}
        className={`
          ${baseSelectClasses}
          ${className}
        `.trim()}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option 
            key={option.value} 
            value={option.value}
            className={isDark ? "bg-slate-800" : "bg-white"}
          >
            {option.label}
          </option>
        ))}
      </select>

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

Select.displayName = 'Select';

Select.propTypes = {
  label: PropTypes.string,
  error: PropTypes.string,
  helper: PropTypes.string,
  options: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
  })),
  fullWidth: PropTypes.bool,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  containerClassName: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  variant: PropTypes.oneOf(['outlined', 'filled', 'glass']),
  placeholder: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func,
};

export default Select; 
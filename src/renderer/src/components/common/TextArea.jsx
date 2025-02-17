import { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '../../contexts/ThemeContext';
import { Body2 } from './Typography';

const TextArea = forwardRef(({
  label,
  error,
  helper,
  fullWidth = false,
  disabled = false,
  className = '',
  containerClassName = '',
  variant = 'outlined',
  rows = 4,
  maxRows = 8,
  minRows = 2,
  autoResize = false,
  ...props
}, ref) => {
  const { isDark } = useTheme();

  const variants = {
    outlined: `
      border-2
      ${isDark ? 'border-slate-700' : 'border-slate-300'}
      focus:border-blue-500
    `,
    filled: `
      ${isDark ? 'bg-slate-800' : 'bg-slate-200'}
      border-transparent
      focus:border-blue-500
    `,
    glass: `
      backdrop-blur-sm
      ${isDark ? 'bg-slate-800' : 'bg-slate-200'}
      border
      ${isDark ? 'border-slate-700' : 'border-slate-300'}
      focus:border-blue-500
    `
  };

  const baseTextAreaClasses = `
    w-full
    outline-none
    rounded-lg
    p-3
    transition-all
    duration-200
    disabled:opacity-50
    disabled:cursor-not-allowed
    resize-${autoResize ? 'y' : 'none'}
    ${isDark ? 'text-slate-300' : 'text-slate-900'}
    ${isDark ? 'placeholder:text-slate-500' : 'placeholder:text-slate-500'}
    ${variants[variant]}
    ${error ? 'border-red-500 focus:border-red-500' : ''}
  `;

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
          ${isDark ? 'text-slate-300' : 'text-slate-900'}
          ${disabled ? 'opacity-50' : ''}
        `.trim()}>
          {label}
        </label>
      )}
      
      <textarea
        ref={ref}
        disabled={disabled}
        rows={rows}
        className={`
          ${baseTextAreaClasses}
          ${className}
        `.trim()}
        style={{
          minHeight: minRows ? `${minRows * 1.5}rem` : undefined,
          maxHeight: maxRows ? `${maxRows * 1.5}rem` : undefined,
        }}
        {...props}
      />

      {(error || helper) && (
        <Body2
          className={`
            mt-1
            ${error ? 'text-red-500' : 'text-slate-500'}
          `.trim()}
        >
          {error || helper}
        </Body2>
      )}
    </div>
  );
});

TextArea.displayName = 'TextArea';

TextArea.propTypes = {
  label: PropTypes.string,
  error: PropTypes.string,
  helper: PropTypes.string,
  fullWidth: PropTypes.bool,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  containerClassName: PropTypes.string,
  variant: PropTypes.oneOf(['outlined', 'filled', 'glass']),
  rows: PropTypes.number,
  maxRows: PropTypes.number,
  minRows: PropTypes.number,
  autoResize: PropTypes.bool,
};

export default TextArea; 
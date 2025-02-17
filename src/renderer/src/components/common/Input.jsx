import { forwardRef, useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '../../contexts/ThemeContext';
import Box from './Box';
import { Body2 } from './Typography';
import { cn } from '../../utils';
import { Search, X } from 'lucide-react';

const Input = forwardRef(({
  label,
  error,
  helper,
  startAdornment,
  endAdornment,
  fullWidth = false,
  disabled = false,
  className = '',
  containerClassName = '',
  size = 'md',
  variant = 'outlined',
  suggestions = [],
  onSuggestionSelect,
  showSuggestions = false,
  startIcon: StartIcon,
  endIcon: EndIcon,
  onClear,
  ...props
}, ref) => {
  const { isDark } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Handle clicks outside of input and dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        (!inputRef.current || !inputRef.current.contains(event.target)) &&
        (!dropdownRef.current || !dropdownRef.current.contains(event.target))
      ) {
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset selected index when suggestions change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [suggestions]);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!showSuggestions || !suggestions.length) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          onSuggestionSelect?.(suggestions[selectedIndex]);
          setIsFocused(false);
        }
        break;
      case 'Escape':
        setIsFocused(false);
        break;
    }
  };

  const sizes = {
    sm: 'h-8 text-sm px-2',
    md: 'h-10 text-base px-3',
    lg: 'h-12 text-lg px-4'
  };

  const variants = {
    minimal: `
      border-0
      ${isDark ? 'bg-slate-700/30' : 'bg-slate-200/30'}
      focus:border-blue-500
    `,
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
      ${isDark ? 'bg-slate-700/30' : 'bg-slate-200/30'}
      border
      ${isDark ? 'border-slate-700' : 'border-slate-200'}
      focus:border-blue-500
    `
  };

  const baseStyles = cn(
    "relative transition-colors duration-200",
    "bg-white dark:bg-slate-800",
    "border rounded-md",
    "focus:outline-none focus:ring-2",
    {
      'w-full': fullWidth,
      'border-slate-300 dark:border-slate-600': !error,
      'border-semantic-red': error,
      'focus:border-blue-500 focus:ring-blue-500/20': !error,
      'focus:border-semantic-red focus:ring-semantic-red/20': error,
      'px-3 py-2 text-sm': size === 'md',
      'px-2 py-1 text-xs': size === 'sm',
      'px-4 py-3 text-base': size === 'lg',
      'bg-slate-100 dark:bg-slate-700': variant === 'filled',
      'bg-transparent': variant === 'ghost',
    }
  );

  return (
    <div className={cn("relative", fullWidth && "w-full", containerClassName)}>
      {label && (
        <label className={cn(
          "block mb-1.5 text-sm font-medium",
          isDark ? 'text-dark-foreground' : 'text-light-foreground',
          disabled && 'opacity-50'
        )}>
          {label}
        </label>
      )}

      <div className="relative">
        <div className="relative flex items-center">
          {StartIcon && (
            <StartIcon className="absolute left-3 text-slate-400" size={16} />
          )}
          <input
            ref={inputRef}
            disabled={disabled}
            className={cn(
              baseStyles,
              StartIcon && "pl-9",
              EndIcon && "pr-9",
              className
            )}
            onFocus={() => setIsFocused(true)}
            onKeyDown={handleKeyDown}
            {...props}
          />
          {EndIcon && (
            <div className="absolute right-3">
              {onClear ? (
                <button
                  type="button"
                  onClick={onClear}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full"
                >
                  <X size={14} className="text-slate-400" />
                </button>
              ) : (
                <EndIcon className="text-slate-400" size={16} />
              )}
            </div>
          )}
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && isFocused && suggestions.length > 0 && (
          <div
            ref={dropdownRef}
            className={cn(
              "absolute z-50 w-full mt-1",
              "bg-white dark:bg-slate-800",
              "border border-slate-200 dark:border-slate-700",
              "max-h-[300px] overflow-auto"
            )}
          >
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className={cn(
                  "px-3 py-2 text-sm cursor-pointer",
                  "hover:bg-slate-100 dark:hover:bg-slate-700",
                  selectedIndex === index && "bg-slate-100 dark:bg-slate-700",
                  "transition-colors duration-150"
                )}
                onClick={() => {
                  onSuggestionSelect?.(suggestion);
                  setIsFocused(false);
                }}
              >
                {suggestion}
              </div>
            ))}
          </div>
        )}
      </div>

      {(error || helper) && (
        <Body2 className={cn(
          "mt-1",
          error ? 'text-red-500' : isDark ? 'text-dark-comment' : 'text-light-comment'
        )}>
          {error || helper}
        </Body2>
      )}
    </div>
  );
});

Input.displayName = 'Input';

Input.propTypes = {
  label: PropTypes.string,
  error: PropTypes.string,
  helper: PropTypes.string,
  startAdornment: PropTypes.node,
  endAdornment: PropTypes.node,
  fullWidth: PropTypes.bool,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  containerClassName: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  variant: PropTypes.oneOf(['outlined', 'filled', 'glass']),
  suggestions: PropTypes.array,
  onSuggestionSelect: PropTypes.func,
  showSuggestions: PropTypes.bool,
  startIcon: PropTypes.node,
  endIcon: PropTypes.node,
  onClear: PropTypes.func,
};

export default Input; 
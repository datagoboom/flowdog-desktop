import { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '../../contexts/ThemeContext';

const Button = forwardRef(({
  children,
  variant = 'filled',
  color = 'blue',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  circular = false,
  startIcon,
  endIcon,
  className = '',
  ...props
}, ref) => {
  const { isDark } = useTheme();

  const variants = {
    attached: `
      p-0
      rounded-none
      border-none
      bg-opacity-10 
      hover:bg-opacity-20
      active:bg-opacity-30
      h-full
       ${color !== 'white' ? `text-semantic-${color}` : 'text-white'}
    `,
    filled: `
      ${isDark ? 'bg-opacity-90' : 'bg-opacity-100'}
      hover:bg-opacity-80
      active:bg-opacity-70
      text-white
      shadow-sm
      hover:shadow-md
    `,
    light: `
      bg-opacity-10
      hover:bg-opacity-20
      active:bg-opacity-30
    `,
    outlined: `
      border-2
      bg-transparent
      hover:bg-opacity-10
      active:bg-opacity-20
    `,
    glass: `
      backdrop-blur-md
      ${isDark ? 'bg-dark-background/30' : 'bg-light-background/30'}
      hover:bg-opacity-40
      active:bg-opacity-50
      border
      border-opacity-20
    `,
    text: `
    ${color !== 'white' ? `text-semantic-${color}` : 'text-white'}
      bg-transparent
      hover:bg-opacity-10
      active:bg-opacity-20
    `,
  };

  const sizes = circular ? {
    xs: 'w-6 h-6 p-0',
    sm: 'w-8 h-8 p-0',
    md: 'w-10 h-10 p-0',
    lg: 'w-12 h-12 p-0',
    xl: 'w-14 h-14 p-0',
  } : {
    xs: 'px-2.5 py-1.5 text-xs',
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-5 py-2.5 text-lg',
    xl: 'px-6 py-3 text-xl',
  };

  const baseClasses = `
    inline-flex
    items-center
    justify-center
    gap-2
    font-medium
    transition-all
    duration-200
    ${circular ? 'rounded-full aspect-square p-0' : 'rounded-lg'}
    ${fullWidth ? 'w-full' : ''}
    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    ${loading ? 'cursor-wait' : ''}
    ${sizes[size]}
  `;

  const colorClasses = variant !== undefined ? `
    ${variant === 'filled' ? `bg-${color}-500` : ''}
    ${variant === 'outlined' ? `border-${color}-500 text-${color}-500` : ''}
    ${variant === 'light' ? `bg-${color}-500 text-${color}-500` : ''}
    ${variant === 'text' ? `text-${color}${color == 'white' ? '' : '-500'}` : ''}
  ` : '';

  const LoadingSpinner = () => (
    <svg
      className="animate-spin h-5 w-5"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`
        ${baseClasses}
        ${variants[variant]}
        ${colorClasses}
        ${className}
      `.trim()}
      {...props}
    >
      {loading && <LoadingSpinner />}
      {!loading && startIcon && (
        <span className="inline-flex shrink-0">{startIcon}</span>
      )}
      {(!circular || !startIcon) && children}
      {!loading && endIcon && (
        <span className="inline-flex shrink-0">{endIcon}</span>
      )}
    </button>
  );
});

Button.displayName = 'Button';

Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['filled', 'light', 'outlined', 'glass', 'text']),
  color: PropTypes.oneOf(['blue', 'green', 'red', 'purple', 'orange']),
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
  fullWidth: PropTypes.bool,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  circular: PropTypes.bool,
  startIcon: PropTypes.node,
  endIcon: PropTypes.node,
  className: PropTypes.string,
};

export default Button; 
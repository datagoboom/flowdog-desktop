import { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '../../contexts/ThemeContext';

const IconButton = forwardRef(({
  icon,
  variant = 'filled',
  color = 'blue',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  ...props
}, ref) => {
  const { isDark } = useTheme();

  const variants = {
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
      bg-transparent
      hover:bg-opacity-10
      active:bg-opacity-20
    `,
  };

  const colors = {
    blue: {
      base: 'blue-500',
      hover: 'blue-600',
      active: 'blue-700',
    },
    green: {
      base: 'green-500',
      hover: 'green-600',
      active: 'green-700',
    },
    red: {
      base: 'red-500',
      hover: 'red-600',
      active: 'red-700',
    },
    purple: {
      base: 'purple-500',
      hover: 'purple-600',
      active: 'purple-700',
    },
    orange: {
      base: 'orange-500',
      hover: 'orange-600',
      active: 'orange-700',
    },
  };

  const sizes = {
    xs: 'p-1 w-7 h-7',
    sm: 'p-1.5 w-8 h-8',
    md: 'p-2 w-10 h-10',
    lg: 'p-2.5 w-12 h-12',
    xl: 'p-3 w-14 h-14',
  };

  const iconSizes = {
    xs: 'w-4 h-4',
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-7 h-7',
    xl: 'w-8 h-8',
  };

  const baseClasses = `
    inline-flex
    items-center
    justify-center
    rounded-full
    transition-all
    duration-200
    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    ${loading ? 'cursor-wait' : ''}
    ${sizes[size]}
  `;

  const colorClasses = variant !== 'glass' ? `
    ${variant === 'filled' ? `bg-${colors[color].base}` : ''}
    ${variant === 'outlined' ? `border-${colors[color].base} text-${colors[color].base}` : ''}
    ${variant === 'light' ? `bg-${colors[color].base} text-${colors[color].base}` : ''}
    ${variant === 'text' ? `text-${colors[color].base}` : ''}
  ` : '';

  const LoadingSpinner = () => (
    <svg
      className={`animate-spin ${iconSizes[size]}`}
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
      {loading ? (
        <LoadingSpinner />
      ) : (
        <span className={iconSizes[size]}>{icon}</span>
      )}
    </button>
  );
});

IconButton.displayName = 'IconButton';

IconButton.propTypes = {
  icon: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['filled', 'light', 'outlined', 'glass', 'text']),
  color: PropTypes.oneOf(['blue', 'green', 'red', 'purple', 'orange']),
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  className: PropTypes.string,
};

export default IconButton; 
import { useState } from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '../../contexts/ThemeContext';

const Image = ({
  src,
  alt,
  fallback = '📷',
  className = '',
  rounded = 'none',
  aspectRatio = 'auto',
  objectFit = 'cover',
  blur = true,
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const { isDark } = useTheme();

  const handleLoad = () => setIsLoading(false);
  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const baseClasses = `
    transition-all
    duration-300
    ${rounded ? `rounded-${rounded}` : ''}
    ${isLoading ? 'opacity-50 animate-pulse' : 'opacity-100'}
    ${blur ? 'hover:blur-sm' : ''}
  `;

  const containerClasses = `
    relative
    ${aspectRatio !== 'auto' ? `aspect-${aspectRatio}` : ''}
    ${className}
  `;

  if (hasError) {
    return (
      <div 
        className={`
          ${containerClasses}
          flex
          items-center
          justify-center
          bg-opacity-50
          ${isDark ? 'bg-dark-background' : 'bg-light-background'}
          ${baseClasses}
        `.trim()}
      >
        <span className="text-4xl">{fallback}</span>
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      <img
        src={src}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        className={`
          ${baseClasses}
          w-full
          h-full
          object-${objectFit}
        `.trim()}
        {...props}
      />
    </div>
  );
};

Image.propTypes = {
  src: PropTypes.string.isRequired,
  alt: PropTypes.string.isRequired,
  fallback: PropTypes.string,
  className: PropTypes.string,
  rounded: PropTypes.oneOf(['none', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', 'full']),
  aspectRatio: PropTypes.oneOf(['auto', 'square', 'video', '4/3', '16/9']),
  objectFit: PropTypes.oneOf(['contain', 'cover', 'fill', 'none', 'scale-down']),
  blur: PropTypes.bool,
};

export default Image; 
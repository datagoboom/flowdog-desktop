import PropTypes from 'prop-types';
import { useTheme } from '../../contexts/ThemeContext';

const Divider = ({
  orientation = 'horizontal',
  thickness = 1,
  opacity = 2,
  spacing = 4,
  className = '',
  text,
  ...props
}) => {
  const { isDark } = useTheme();

  const OPACITY_LEVELS = {
    1: 'opacity-5',
    2: 'opacity-10',
    3: 'opacity-20',
    4: 'opacity-30',
    5: 'opacity-40',
  };

  const baseClasses = `
    ${isDark ? 'bg-dark-foreground' : 'bg-light-foreground'}
    ${OPACITY_LEVELS[opacity]}
    transition-all
    duration-200
  `;

  if (orientation === 'vertical') {
    return (
      <div
        className={`
          inline-block
          h-full
          px-${spacing}
          ${className}
        `.trim()}
        {...props}
      >
        <div
          className={`
            ${baseClasses}
            w-${thickness}
            h-full
          `.trim()}
        />
      </div>
    );
  }

  if (text) {
    return (
      <div
        className={`
          flex
          items-center
          gap-4
          py-${spacing}
          ${className}
        `.trim()}
        {...props}
      >
        <div className={`${baseClasses} h-${thickness} flex-grow`} />
        <span className={`
          text-sm
          whitespace-nowrap
          ${isDark ? 'text-dark-comment' : 'text-light-comment'}
        `}>
          {text}
        </span>
        <div className={`${baseClasses} h-${thickness} flex-grow`} />
      </div>
    );
  }

  return (
    <div
      className={`
        py-${spacing}
        ${className}
      `.trim()}
      {...props}
    >
      <div
        className={`
          ${baseClasses}
          h-${thickness}
          w-full
        `.trim()}
      />
    </div>
  );
};

Divider.propTypes = {
  orientation: PropTypes.oneOf(['horizontal', 'vertical']),
  thickness: PropTypes.oneOf([1, 2, 3, 4]),
  opacity: PropTypes.oneOf([1, 2, 3, 4, 5]),
  spacing: PropTypes.oneOf([0, 1, 2, 3, 4, 5, 6, 8, 10]),
  className: PropTypes.string,
  text: PropTypes.string,
};

export default Divider; 
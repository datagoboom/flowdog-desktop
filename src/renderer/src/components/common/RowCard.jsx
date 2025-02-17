import PropTypes from 'prop-types';
import Box from './Box';
import { Body1, Body2 } from './Typography';
import Image from './Image';

const RowCard = ({
  children,
  className = '',
  hover = true,
  blur = 2,
  opacity = 6,
  compact = false,
  ...props
}) => {
  return (
    <Box
      className={`
        flex
        items-center
        gap-4
        ${compact ? 'p-2' : 'p-4'}
        ${hover ? 'hover:scale-101 hover:shadow-lg' : ''}
        transition-all
        duration-200
        ${className}
      `.trim()}
      blur={blur}
      opacity={opacity}
      {...props}
    >
      {children}
    </Box>
  );
};

const RowCardMedia = ({
  src,
  alt,
  size = 'md',
  className = '',
  ...props
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  return (
    <div className={`flex-shrink-0 ${sizeClasses[size]} ${className}`.trim()}>
      <Image
        src={src}
        alt={alt}
        rounded="lg"
        className="w-full h-full"
        {...props}
      />
    </div>
  );
};

const RowCardContent = ({
  title,
  subtitle,
  className = '',
  children,
  ...props
}) => {
  return (
    <div 
      className={`
        flex-grow
        min-w-0
        ${className}
      `.trim()}
      {...props}
    >
      {title && (
        <div className="truncate">
          {typeof title === 'string' ? (
            <Body1 className="font-semibold">{title}</Body1>
          ) : title}
        </div>
      )}
      {subtitle && (
        <div className="truncate">
          {typeof subtitle === 'string' ? (
            <Body2 className="text-light-comment dark:text-dark-comment">{subtitle}</Body2>
          ) : subtitle}
        </div>
      )}
      {children}
    </div>
  );
};

const RowCardAction = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div 
      className={`
        flex-shrink-0
        flex
        items-center
        gap-2
        ${className}
      `.trim()}
      {...props}
    >
      {children}
    </div>
  );
};

// PropTypes
RowCard.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  hover: PropTypes.bool,
  blur: PropTypes.number,
  opacity: PropTypes.number,
  compact: PropTypes.bool,
};

RowCardMedia.propTypes = {
  src: PropTypes.string.isRequired,
  alt: PropTypes.string.isRequired,
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
  className: PropTypes.string,
};

RowCardContent.propTypes = {
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  subtitle: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  className: PropTypes.string,
  children: PropTypes.node,
};

RowCardAction.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

// Compound components
RowCard.Media = RowCardMedia;
RowCard.Content = RowCardContent;
RowCard.Action = RowCardAction;

export default RowCard; 
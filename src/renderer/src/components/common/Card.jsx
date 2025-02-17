import PropTypes from 'prop-types';
import Box from './Box';
import Stack from './Stack';
import { H4, Body1 } from './Typography';
import Divider from './Divider';
import Image from './Image';
import { cn } from '../../utils';
import { useTheme } from '../../contexts/ThemeContext';
const Card = ({
  variant = 'default',
  children,
  className = '',
  hover = true,
  blur = 2,
  opacity = 6,
  ...props
}) => {
  const { isDark } = useTheme();

  return (
    <Box
      className={`
        ${variant === 'node' ? 'p-[4px]' : ''}
        ${variant === 'node' && isDark ? 'bg-slate-800' : 'bg-slate-300'}
        ${className}
      `.trim()}
      blur={blur}
      opacity={opacity}
      {...props}
    >
      {variant === 'default' && children}
      {variant === 'node' && (
        <div className={cn(
          "border border-dashed",
          isDark ? "border-white/20" : "border-slate-400",
          isDark ? "bg-slate-700/20" : "bg-white",
          "rounded-md",
          "w-full h-full flex items-center justify-center",
          "p-0.5"
        )}
        >
          {children}
        </div>
      )}
    </Box>
  );
};

const CardHeader = ({
  title,
  subtitle,
  image,
  action,
  className = '',
  ...props
}) => {
  return (
    <div className={`space-y-4 ${className}`.trim()} {...props}>
      {image && (
        <div className="-mx-4 -mt-4 mb-4">
          <Image
            {...image}
            className="w-full"
            rounded="t-lg"
          />
        </div>
      )}
      <div className="flex justify-between items-start gap-4">
        <Stack spacing={1}>
          {title && (typeof title === 'string' ? <H4>{title}</H4> : title)}
          {subtitle && (typeof subtitle === 'string' ? <Body1>{subtitle}</Body1> : subtitle)}
        </Stack>
        {action && (
          <div className="flex-shrink-0">
            {action}
          </div>
        )}
      </div>
    </div>
  );
};

const CardContent = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div className={`py-2 ${className}`.trim()} {...props}>
      {children}
    </div>
  );
};

const CardFooter = ({
  children,
  className = '',
  divider = true,
  ...props
}) => {
  return (
    <>
      {divider && <Divider spacing={2} />}
      <div 
        className={`
          flex
          items-center
          justify-between
          gap-4
          pt-2
          ${className}
        `.trim()}
        {...props}
      >
        {children}
      </div>
    </>
  );
};

// PropTypes
Card.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  hover: PropTypes.bool,
  blur: PropTypes.number,
  opacity: PropTypes.number,
};

CardHeader.propTypes = {
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  subtitle: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  image: PropTypes.shape(Image.propTypes),
  action: PropTypes.node,
  className: PropTypes.string,
};

CardContent.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

CardFooter.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  divider: PropTypes.bool,
};

// Compound components
Card.Header = CardHeader;
Card.Content = CardContent;
Card.Footer = CardFooter;

export default Card; 
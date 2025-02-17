import PropTypes from 'prop-types';
import { useTheme } from '../../contexts/ThemeContext';
import { cn } from '../../utils';

const variants = {
  h1: 'text-4xl font-bold',
  h2: 'text-3xl font-bold',
  h3: 'text-2xl font-bold',
  h4: 'text-xl font-semibold',
  h5: 'text-lg font-semibold',
  h6: 'text-base font-semibold',
  body1: 'text-base',
  body2: 'text-sm',
  caption: 'text-xs',
  overline: 'text-xs uppercase tracking-wider',
};

const Text = ({
  variant = 'body1',
  color,
  component,
  children = null,
  className = '',
  ...props
}) => {
  const { isDark } = useTheme();
  const Component = component || defaultElements[variant] || 'span';
  
  return (
    <Component
      className={cn(
        variants[variant],
        !color && (isDark ? 'text-dark-foreground' : 'text-light-foreground'),
        color && `text-semantic-${color}`,
        'transition-colors',
        className
      )}
      {...props}
    >
      {children || ''}
    </Component>
  );
};

// Convenience components
export const H1 = (props) => <Text variant="h1" component="h1" {...props} />;
export const H2 = (props) => <Text variant="h2" component="h2" {...props} />;
export const H3 = (props) => <Text variant="h3" component="h3" {...props} />;
export const H4 = (props) => <Text variant="h4" component="h4" {...props} />;
export const H5 = (props) => <Text variant="h5" component="h5" {...props} />;
export const H6 = (props) => <Text variant="h6" component="h6" {...props} />;
export const Body1 = (props) => <Text variant="body1" component="p" {...props} />;
export const Body2 = (props) => <Text variant="body2" component="p" {...props} />;
export const Caption = (props) => <Text variant="caption" component="span" {...props} />;
export const Overline = (props) => <Text variant="overline" component="span" {...props} />;

const defaultElements = {
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  h5: 'h5',
  h6: 'h6',
  body1: 'p',
  body2: 'p',
  caption: 'span',
  overline: 'span',
};

Text.propTypes = {
  variant: PropTypes.oneOf([
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'body1', 'body2', 'caption', 'overline'
  ]),
  component: PropTypes.elementType,
  className: PropTypes.string,
};

export default Text; 
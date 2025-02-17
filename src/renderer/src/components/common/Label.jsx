import { memo } from 'react';
import { cn } from '../../utils';
import PropTypes from 'prop-types';

const Label = memo(({ 
  children, 
  color = 'slate', // default color
  className,
  ...props 
}) => {
  const colorClasses = {
    slate: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    cyan: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-1',
        'rounded text-xs font-medium',
        colorClasses[color],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
});

Label.displayName = 'Label';

Label.propTypes = {
  children: PropTypes.node.isRequired,
  color: PropTypes.oneOf(['slate', 'red', 'green', 'blue', 'yellow', 'purple', 'cyan']),
  className: PropTypes.string
};

export default Label; 
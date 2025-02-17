import PropTypes from 'prop-types';

const SPACING = {
  0: 'space-y-0',
  1: 'space-y-1',
  2: 'space-y-2',
  3: 'space-y-3',
  4: 'space-y-4',
  5: 'space-y-5',
  6: 'space-y-6',
  8: 'space-y-8',
  10: 'space-y-10',
  12: 'space-y-12',
  16: 'space-y-16',
};

const Stack = ({
  children,
  spacing = 4,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`
        flex
        flex-col
        ${SPACING[spacing]}
        ${className}
      `.trim()}
      {...props}
    >
      {children}
    </div>
  );
};

Stack.propTypes = {
  children: PropTypes.node.isRequired,
  spacing: PropTypes.oneOf([0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16]),
  className: PropTypes.string,
};

export default Stack; 
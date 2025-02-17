import PropTypes from 'prop-types';

const GRID_SPACING = {
  0: 'gap-0',
  1: 'gap-1',
  2: 'gap-2',
  3: 'gap-3',
  4: 'gap-4',
  5: 'gap-5',
  6: 'gap-6',
  8: 'gap-8',
  10: 'gap-10',
};

const GRID_COLS = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
  7: 'grid-cols-7',
  8: 'grid-cols-8',
  9: 'grid-cols-9',
  10: 'grid-cols-10',
  11: 'grid-cols-11',
  12: 'grid-cols-12',
};

const GRID_SPANS = {
  1: 'col-span-1',
  2: 'col-span-2',
  3: 'col-span-3',
  4: 'col-span-4',
  5: 'col-span-5',
  6: 'col-span-6',
  7: 'col-span-7',
  8: 'col-span-8',
  9: 'col-span-9',
  10: 'col-span-10',
  11: 'col-span-11',
  12: 'col-span-12',
  full: 'col-span-full',
};

const BREAKPOINTS = ['sm', 'md', 'lg', 'xl', '2xl'];

export const Grid = ({ 
  children, 
  container = false,
  spacing = 4,
  cols = 12,
  className = '',
  ...props 
}) => {
  if (!container) {
    return <div className={className} {...props}>{children}</div>;
  }

  return (
    <div 
      className={`
        grid
        ${GRID_SPACING[spacing]}
        ${GRID_COLS[cols]}
        ${className}
      `.trim()}
      {...props}
    >
      {children}
    </div>
  );
};

export const GridItem = ({ 
  children, 
  span = 12,
  sm,
  md,
  lg,
  xl,
  xxl,
  className = '',
  ...props 
}) => {
  const responsiveClasses = [
    GRID_SPANS[span],
    sm && `sm:${GRID_SPANS[sm]}`,
    md && `md:${GRID_SPANS[md]}`,
    lg && `lg:${GRID_SPANS[lg]}`,
    xl && `xl:${GRID_SPANS[xl]}`,
    xxl && `2xl:${GRID_SPANS[xxl]}`,
  ].filter(Boolean).join(' ');

  return (
    <div 
      className={`
        ${responsiveClasses}
        ${className}
      `.trim()}
      {...props}
    >
      {children}
    </div>
  );
};

Grid.propTypes = {
  children: PropTypes.node.isRequired,
  container: PropTypes.bool,
  spacing: PropTypes.oneOf([0, 1, 2, 3, 4, 5, 6, 8, 10]),
  cols: PropTypes.oneOf([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]),
  className: PropTypes.string,
};

GridItem.propTypes = {
  children: PropTypes.node.isRequired,
  span: PropTypes.oneOf([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 'full']),
  sm: PropTypes.oneOf([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 'full']),
  md: PropTypes.oneOf([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 'full']),
  lg: PropTypes.oneOf([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 'full']),
  xl: PropTypes.oneOf([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 'full']),
  xxl: PropTypes.oneOf([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 'full']),
  className: PropTypes.string,
}; 
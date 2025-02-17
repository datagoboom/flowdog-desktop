import PropTypes from 'prop-types';
import { Children, cloneElement } from 'react';

const ButtonGroup = ({
  children,
  variant,
  color,
  size,
  vertical = false,
  fullWidth = false,
  className = '',
  ...props
}) => {
  const childrenArray = Children.toArray(children);

  const groupClasses = `
    inline-flex
    ${vertical ? 'flex-col' : 'flex-row'}
    ${fullWidth ? 'w-full' : ''}
  `;

  const getChildClasses = (index) => {
    if (vertical) {
      if (index === 0) return 'rounded-t-lg rounded-b-none';
      if (index === childrenArray.length - 1) return 'rounded-b-lg rounded-t-none';
      return 'rounded-none';
    }
    
    if (index === 0) return 'rounded-r-none';
    if (index === childrenArray.length - 1) return 'rounded-l-none';
    return 'rounded-none';
  };

  return (
    <div
      className={`
        ${groupClasses}
        ${className}
      `.trim()}
      {...props}
    >
      {Children.map(children, (child, index) => {
        if (!child) return null;

        return cloneElement(child, {
          variant: variant || child.props.variant,
          color: color || child.props.color,
          size: size || child.props.size,
          className: `
            ${child.props.className || ''}
            ${getChildClasses(index)}
            ${vertical ? '' : index !== 0 ? '-ml-px' : ''}
          `.trim(),
        });
      })}
    </div>
  );
};

ButtonGroup.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['filled', 'light', 'outlined', 'glass', 'text']),
  color: PropTypes.oneOf(['blue', 'green', 'red', 'purple', 'orange']),
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
  vertical: PropTypes.bool,
  fullWidth: PropTypes.bool,
  className: PropTypes.string,
};

export default ButtonGroup; 
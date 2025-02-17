import { Children, cloneElement } from 'react';
import PropTypes from 'prop-types';

const ToggleButtonGroup = ({
  children,
  value,
  onChange,
  exclusive = false,
  color,
  size,
  vertical = false,
  fullWidth = false,
  className = '',
  ...props
}) => {
  const handleChange = (event, buttonValue) => {
    if (!onChange) return;

    let newValue;
    if (exclusive) {
      newValue = buttonValue === value ? '' : buttonValue;
    } else {
      newValue = Array.isArray(value) ? [...value] : [];
      const index = newValue.indexOf(buttonValue);
      if (index === -1) {
        newValue.push(buttonValue);
      } else {
        newValue.splice(index, 1);
      }
    }

    onChange(event, newValue);
  };

  const childrenArray = Children.toArray(children);

  const isSelected = (buttonValue) => {
    if (exclusive) {
      return buttonValue === value;
    }
    return Array.isArray(value) && value.includes(buttonValue);
  };

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
        inline-flex
        ${vertical ? 'flex-col' : 'flex-row'}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `.trim()}
      role="group"
      {...props}
    >
      {Children.map(children, (child, index) => {
        if (!child) return null;

        return cloneElement(child, {
          color: color || child.props.color,
          size: size || child.props.size,
          selected: isSelected(child.props.value),
          onChange: (event) => handleChange(event, child.props.value),
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

ToggleButtonGroup.propTypes = {
  children: PropTypes.node.isRequired,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string),
  ]),
  onChange: PropTypes.func,
  exclusive: PropTypes.bool,
  color: PropTypes.oneOf(['blue', 'green', 'red', 'purple', 'orange']),
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
  vertical: PropTypes.bool,
  fullWidth: PropTypes.bool,
  className: PropTypes.string,
};

export default ToggleButtonGroup; 
import { forwardRef, useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '../../contexts/ThemeContext';
import { Body2 } from './Typography';

const Slider = forwardRef(({
  label,
  error,
  helper,
  min = 0,
  max = 100,
  step = 1,
  defaultValue,
  value: controlledValue,
  onChange,
  disabled = false,
  showValue = true,
  className = '',
  containerClassName = '',
  color = 'blue',
  size = 'md',
  marks = false,
  ...props
}, ref) => {
  const { isDark } = useTheme();
  const [localValue, setLocalValue] = useState(defaultValue ?? min);
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : localValue;
  const trackRef = useRef(null);

  const sizes = {
    sm: {
      track: 'h-1',
      thumb: 'w-3 h-3',
      label: 'text-sm'
    },
    md: {
      track: 'h-2',
      thumb: 'w-4 h-4',
      label: 'text-base'
    },
    lg: {
      track: 'h-3',
      thumb: 'w-5 h-5',
      label: 'text-lg'
    }
  };

  const colors = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
  };

  const percentage = ((value - min) / (max - min)) * 100;

  const handleChange = (e) => {
    const newValue = Number(e.target.value);
    if (!isControlled) {
      setLocalValue(newValue);
    }
    onChange?.(newValue);
  };

  const renderMarks = () => {
    if (!marks) return null;
    
    const markValues = Array.isArray(marks) 
      ? marks 
      : Array.from({ length: (max - min) / step + 1 }, (_, i) => min + (i * step));

    return (
      <div className="absolute w-full flex justify-between px-1 mt-2">
        {markValues.map((markValue) => (
          <div
            key={markValue}
            className={`
              w-1
              h-1
              rounded-full
              ${isDark ? 'bg-dark-comment' : 'bg-light-comment'}
              ${value >= markValue ? colors[color] : ''}
            `}
          />
        ))}
      </div>
    );
  };

  return (
    <div className={`${containerClassName}`.trim()}>
      <div className="flex items-center justify-between mb-2">
        {label && (
          <label className={`
            ${sizes[size].label}
            font-medium
            ${isDark ? 'text-dark-foreground' : 'text-light-foreground'}
            ${disabled ? 'opacity-50' : ''}
          `.trim()}>
            {label}
          </label>
        )}
        {showValue && (
          <span className={`
            ${sizes[size].label}
            ${isDark ? 'text-dark-comment' : 'text-light-comment'}
          `.trim()}>
            {value}
          </span>
        )}
      </div>

      <div className="relative">
        <div
          ref={trackRef}
          className={`
            absolute
            top-1/2
            -translate-y-1/2
            left-0
            ${sizes[size].track}
            rounded-full
            backdrop-blur-sm
            ${isDark ? 'bg-dark-comment/30' : 'bg-light-comment/30'}
            w-full
          `}
        >
          <div
            className={`
              absolute
              left-0
              top-0
              h-full
              rounded-full
              ${colors[color]}
              transition-all
              duration-100
            `}
            style={{ width: `${percentage}%` }}
          />
        </div>

        <input
          ref={ref}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          className={`
            appearance-none
            bg-transparent
            w-full
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            relative
            ${sizes[size].track}
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:${sizes[size].thumb}
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:${colors[color]}
            [&::-webkit-slider-thumb]:shadow-lg
            [&::-webkit-slider-thumb]:transition-transform
            [&::-webkit-slider-thumb]:duration-200
            [&::-webkit-slider-thumb]:hover:scale-110
            [&::-moz-range-thumb]:${sizes[size].thumb}
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:${colors[color]}
            [&::-moz-range-thumb]:border-0
            [&::-moz-range-thumb]:shadow-lg
            [&::-moz-range-thumb]:transition-transform
            [&::-moz-range-thumb]:duration-200
            [&::-moz-range-thumb]:hover:scale-110
            ${className}
          `.trim()}
          {...props}
        />

        {renderMarks()}
      </div>

      {(error || helper) && (
        <Body2
          className={`
            mt-1
            ${error ? 'text-red-500' : isDark ? 'text-dark-comment' : 'text-light-comment'}
          `.trim()}
        >
          {error || helper}
        </Body2>
      )}
    </div>
  );
});

Slider.displayName = 'Slider';

Slider.propTypes = {
  label: PropTypes.string,
  error: PropTypes.string,
  helper: PropTypes.string,
  min: PropTypes.number,
  max: PropTypes.number,
  step: PropTypes.number,
  defaultValue: PropTypes.number,
  value: PropTypes.number,
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
  showValue: PropTypes.bool,
  className: PropTypes.string,
  containerClassName: PropTypes.string,
  color: PropTypes.oneOf(['blue', 'green', 'red', 'purple', 'orange']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  marks: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.arrayOf(PropTypes.number)
  ]),
};

export default Slider; 
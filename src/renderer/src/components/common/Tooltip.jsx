import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '../../contexts/ThemeContext';

const Tooltip = ({
  children,
  content,
  side = 'top',
  align = 'center',
  delay = 0,
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const timeoutRef = useRef(null);
  const tooltipRef = useRef(null);
  const { isDark } = useTheme();

  const calculatePosition = (targetRect) => {
    if (!tooltipRef.current) return { x: 0, y: 0 };

    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    let x = 0;
    let y = 0;

    switch (side) {
      case 'top':
        y = targetRect.top - tooltipRect.height - 8;
        break;
      case 'bottom':
        y = targetRect.bottom + 8;
        break;
      case 'left':
        x = targetRect.left - tooltipRect.width - 8;
        break;
      case 'right':
        x = targetRect.right + 8;
        break;
    }

    switch (align) {
      case 'start':
        if (side === 'top' || side === 'bottom') {
          x = targetRect.left;
        } else {
          y = targetRect.top;
        }
        break;
      case 'center':
        if (side === 'top' || side === 'bottom') {
          x = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
        } else {
          y = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
        }
        break;
      case 'end':
        if (side === 'top' || side === 'bottom') {
          x = targetRect.right - tooltipRect.width;
        } else {
          y = targetRect.bottom - tooltipRect.height;
        }
        break;
    }

    // Keep tooltip within viewport
    x = Math.max(8, Math.min(x, window.innerWidth - tooltipRect.width - 8));
    y = Math.max(8, Math.min(y, window.innerHeight - tooltipRect.height - 8));

    return { x, y };
  };

  const handleMouseEnter = (e) => {
    if (delay) {
      timeoutRef.current = setTimeout(() => {
        const rect = e.currentTarget.getBoundingClientRect();
        setPosition(calculatePosition(rect));
        setIsVisible(true);
      }, delay);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      setPosition(calculatePosition(rect));
      setIsVisible(true);
    }
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      
      {isVisible && (
        <div
          ref={tooltipRef}
          className={`
            fixed
            z-50
            px-2
            py-1
            text-sm
            rounded-md
            shadow-lg
            whitespace-nowrap
            transition-opacity
            duration-200
            ${isDark ? 'bg-dark-paper text-dark-text' : 'bg-light-paper text-light-text'}
            ${className}
          `.trim()}
          style={{
            left: position.x,
            top: position.y,
          }}
        >
          {content}
        </div>
      )}
    </div>
  );
};

Tooltip.propTypes = {
  children: PropTypes.node.isRequired,
  content: PropTypes.node.isRequired,
  side: PropTypes.oneOf(['top', 'right', 'bottom', 'left']),
  align: PropTypes.oneOf(['start', 'center', 'end']),
  delay: PropTypes.number,
  className: PropTypes.string,
};

export default Tooltip; 
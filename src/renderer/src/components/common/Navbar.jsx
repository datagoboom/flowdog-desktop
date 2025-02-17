import { useState } from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '../../contexts/ThemeContext';
import Box from './Box';
import IconButton from './IconButton';
import { H4 } from './Typography';

const Navbar = ({
  brand,
  logo,
  children,
  actions,
  sticky = true,
  blur = 2,
  opacity = 8,
  className = '',
  height = 64,
  mobileBreakpoint = 'md',
  ...props
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isDark } = useTheme();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <Box
      as="nav"
      className={`
        ${sticky ? 'sticky top-0 z-50' : ''}
        ${className}
      `.trim()}
      blur={blur}
      opacity={opacity}
      {...props}
    >
      <div
        className="px-4 mx-auto"
        style={{ height }}
      >
        <div className="flex items-center justify-between h-full">
          {/* Brand/Logo Section */}
          <div className="flex items-center gap-3">
            {logo && (
              <div className="flex-shrink-0">
                {logo}
              </div>
            )}
            {brand && (
              <H4 className="font-semibold whitespace-nowrap">
                {brand}
              </H4>
            )}
          </div>

          {/* Desktop Navigation */}
          <div className={`
            hidden
            ${mobileBreakpoint}:flex
            items-center
            gap-1
          `}>
            {children}
          </div>

          {/* Actions Section */}
          <div className={`
            hidden
            ${mobileBreakpoint}:flex
            items-center
            gap-2
          `}>
            {actions}
          </div>

          {/* Mobile Menu Button */}
          <div className={`${mobileBreakpoint}:hidden`}>
            <IconButton
              icon={
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {isMobileMenuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              }
              variant="text"
              onClick={toggleMobileMenu}
            />
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`
          ${mobileBreakpoint}:hidden
          ${isMobileMenuOpen ? 'block' : 'hidden'}
          py-2
          space-y-1
        `}>
          {children}
          <div className="pt-2 mt-2 border-t border-light-comment/20 dark:border-dark-comment/20">
            {actions}
          </div>
        </div>
      </div>
    </Box>
  );
};

Navbar.propTypes = {
  brand: PropTypes.node,
  logo: PropTypes.node,
  children: PropTypes.node,
  actions: PropTypes.node,
  sticky: PropTypes.bool,
  blur: PropTypes.number,
  opacity: PropTypes.number,
  className: PropTypes.string,
  height: PropTypes.number,
  mobileBreakpoint: PropTypes.oneOf(['sm', 'md', 'lg', 'xl', '2xl']),
};

export default Navbar; 
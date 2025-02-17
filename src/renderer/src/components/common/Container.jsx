import PropTypes from 'prop-types';

const Container = ({ 
  children, 
  maxWidth = 'max-w-7xl', // default to Tailwind's max-w-7xl (1280px)
  padding = 'px-4 sm:px-6 lg:px-8', // responsive padding
  className = '',
  fluid = false, // if true, container will be full width
}) => {
  return (
    <div
      className={`
        mx-auto
        w-full
        ${fluid ? 'max-w-none' : maxWidth}
        ${padding}
        ${className}
      `.trim()}
    >
      {children}
    </div>
  );
};

Container.propTypes = {
  children: PropTypes.node.isRequired,
  maxWidth: PropTypes.string,
  padding: PropTypes.string,
  className: PropTypes.string,
  fluid: PropTypes.bool,
};

export default Container; 
import { memo } from 'react';
import PropTypes from 'prop-types';
import Box from './Box';
import { H1, Caption } from './Typography';

const StatBox = memo(({ 
  value = 0, 
  caption = '', 
  thresholds = {}, 
  captionAlign = 'center',
  className = '' 
}) => {
  const getColor = () => {
    // Convert thresholds to sorted array of [color, value] pairs
    const sortedThresholds = Object.entries(thresholds)
      .sort((a, b) => b[1] - a[1]);
    
    // Find first threshold that value exceeds
    const matchingThreshold = sortedThresholds
      .find(([_, threshold]) => value >= threshold);
    
    return matchingThreshold ? matchingThreshold[0] : 'inherit';
  };

  return (
    <Box className={`flex flex-col justify-center items-center h-full ${className}`}>
      <H1 style={{ color: getColor() }}>{value}</H1>
      <div style={{ textAlign: captionAlign }} className="w-full">
        {typeof caption === 'string' ? <Caption>{caption}</Caption> : caption}
      </div>
    </Box>
  );
});

StatBox.propTypes = {
  value: PropTypes.number,
  caption: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
  thresholds: PropTypes.objectOf(PropTypes.number),
  captionAlign: PropTypes.oneOf(['center', 'left', 'right']),
  className: PropTypes.string
};

export default StatBox;
import { memo } from 'react';

const ProgressBar = memo(({ progress, color = 'blue', className = '' }) => {
  // Ensure progress is between 0 and 100
  const percentage = Math.min(Math.max(progress, 0), 100);

  return (
    <div 
      className={`
        absolute 
        bottom-0 
        left-0 
        w-full 
        h-2 
        overflow-hidden
        rounded-b
        ${className}
      `}
    >
      <div
        className={`
          h-full 
          transition-all 
          duration-300 
          ease-in-out
          bg-semantic-${color}/50
        `}
        style={{
          width: `${percentage}%`,
          backgroundImage: `linear-gradient(90deg, var(--color-${color}, currentColor) 0%, var(--color-${color}, currentColor) 100%)`,
          opacity: 0.5
        }}
      />
    </div>
  );
});

ProgressBar.displayName = 'ProgressBar';

export default ProgressBar; 
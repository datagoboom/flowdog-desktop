import { memo, useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import { cn } from '../../../utils';
import Box from '../../common/Box';
import { Body2 } from '../../common/Typography';
import { useDiagram } from '../../../contexts/DiagramContext';
import Typography from '../../common/Typography';
import * as Icons from 'lucide-react';
import { NODE_TYPES, getNodeColor } from '../../../constants/nodeTypes';
import ProgressBar from '../../common/ProgressBar';

const BaseNode = memo(({ 
  id,
  type,
  isConnectable,
  selected,
  children,
  data = {},
  className,
  ...props 
}) => {
  const { isDark } = useTheme();
  const { lastOutput } = useDiagram();
  const nodeType = NODE_TYPES[type] || {};
  const Icon = nodeType?.icon;

  // Check if we should show progress with null safety
  const showProgress = lastOutput?.data?.progress?.percentage !== undefined && lastOutput?.nodeId === id;
  const [localProgress, setLocalProgress] = useState(0);
  const [localSuccess, setLocalSuccess] = useState(false);
  const [color, setColor] = useState('slate');


  useEffect(() => {
    if (lastOutput && lastOutput.data?.progress?.percentage && lastOutput.nodeId === id) {
      setLocalProgress(lastOutput.data?.progress?.percentage);
      if(lastOutput.data?.progress?.percentage === 100) {
        setTimeout(() => {
          setLocalProgress(0);
        }, 1000);
      }
    }
  }, [lastOutput]);

  useEffect(() => {
    setColor(getNodeColor(type));
  }, [getNodeColor(type)]);

  
  // variable holding the svg for the vertical lines
  const vertLines = <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" className="w-[80px] h-[80px]">
    <defs>
        <clipPath id="viewportClip">
          <rect width="120" height="120" />
        </clipPath>
        <mask id="circleMask">
          <rect width="120" height="120" fill="white"/>
          <circle cx="45" cy="58" r="25" fill="black"/>
        </mask>
      </defs>

      <circle cx="45" cy="58" r="25" style={{stroke: `var(--color-${color}-${isDark ? 400 : 100})`}} fill="none" strokeWidth={2}/>
    

    <g clipPath="url(#viewportClip)" mask="url(#circleMask)">
      <line x1="0" y1="0" x2="0" y2="120" style={{stroke: `var(--color-${color}-${isDark ? 400 : 100})`, strokeWidth: 1,}} strokeDasharray="4 4" />
      <line x1="20" y1="0" x2="20" y2="120" style={{stroke: `var(--color-${color}-${isDark ? 400 : 100})`, strokeWidth: 1}} strokeDasharray="4 4" />
      <line x1="40" y1="0" x2="40" y2="120" style={{stroke: `var(--color-${color}-${isDark ? 400 : 100})`, strokeWidth: 1}} strokeDasharray="4 4" />
      <line x1="60" y1="0" x2="60" y2="120" style={{stroke: `var(--color-${color}-${isDark ? 400 : 200})`, strokeWidth: 1}} strokeDasharray="4 4" />
      <line x1="80" y1="0" x2="80" y2="120" style={{stroke: `var(--color-${color}-${isDark ? 400 : 200})`, strokeWidth: 1}} strokeDasharray="4 4" />
      <line x1="100" y1="0" x2="100" y2="120" style={{stroke: `var(--color-${color}-${isDark ? 400 : 200})`, strokeWidth: 1}} strokeDasharray="4 4" />
      <line x1="120" y1="0" x2="120" y2="120" style={{stroke: `var(--color-${color}-${isDark ? 400 : 200})`, strokeWidth: 1}} strokeDasharray="4 4" />
      <line x1="10" y1="0" x2="10" y2="120" style={{stroke: `var(--color-${color}-${isDark ? 400 : 200})`, strokeWidth: 1}} strokeDasharray="4 4" strokeDashoffset="4" />
      <line x1="30" y1="0" x2="30" y2="120" style={{stroke: `var(--color-${color}-${isDark ? 400 : 200})`, strokeWidth: 1}} strokeDasharray="4 4" strokeDashoffset="4" />
      <line x1="50" y1="0" x2="50" y2="120" style={{stroke: `var(--color-${color}-${isDark ? 400 : 200})`, strokeWidth: 1}} strokeDasharray="4 4" strokeDashoffset="4" />
      <line x1="70" y1="0" x2="70" y2="120" style={{stroke: `var(--color-${color}-${isDark ? 400 : 200})`, strokeWidth: 1}} strokeDasharray="4 4" strokeDashoffset="4" />
      <line x1="90" y1="0" x2="90" y2="120" style={{stroke: `var(--color-${color}-${isDark ? 400 : 200})`, strokeWidth: 1}} strokeDasharray="4 4" strokeDashoffset="4" />
      <line x1="110" y1="0" x2="110" y2="120" style={{stroke: `var(--color-${color}-${isDark ? 400 : 200})`, strokeWidth: 1}} strokeDasharray="4 4" strokeDashoffset="4" />
    </g>
  </svg>

  return (
      <Box
        borderOpacity={10}
        blur={1}
        padding={0}
        selected={selected}
        className={cn(
          "h-[80px]",
          "w-[220px]",
          "flex flex-col justify-between",
          "border-b rounded-3xl",
          "transition-all duration-200",
          isDark && selected && 'shadow-lg shadow-[0px_0px_10px_5px_rgba(246,211,45,0.15)]',
          !isDark && selected && 'shadow-lg shadow-[0px_0px_10px_5px_rgba(100,116,139,0.25)]'
        )}
      >
        {localSuccess && <div className="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full"></div>}

        <div className={cn(
          'h-full flex flex-row justify-center',
          'transition-all duration-200',
          isDark ? 'bg-slate-800' : 'bg-slate-100',
          !selected && 'border-slate-200 dark:border-slate-400',
          isDark && selected && 'border-semantic-yellow',
          !isDark && selected && 'border-slate-500'
        )}>
          
          <div className={cn(
            `w-[80px] h-full overflow-hidden border-r dark:bg-slate-900/80`,
            'transition-all duration-200',
            !selected && 'border-slate-400 dark:border-slate-400',
            selected && `dark:border-semantic-yellow border-slate-500`
          )}
          style={{
            backgroundColor: !isDark ? `var(--color-${color}-400)` : ``,
          }}
          >
            <div className="absolute top-0 left-0 w-[60px] h-[50%] dark:bg-slate-200/10"></div>
            <div className="absolute left-[20px] top-[28px] z-10">
              {Icon && 
                <Icon size={20} 
                  className={cn(
                    `text-white`,
                    selected && 'animate-spin-ease-in-out',
                    data?.testResults?.passed === false && 'text-red-500'
                  )} 
                />}
            </div>
            {vertLines}
          </div>
          <div className="w-full h-full flex flex-col justify-center dark:bg-slate-900/50">
            
            <div id="node-text-container" className="flex flex-col justify-center p-2 h-full">
              <Typography variant="caption" color="slate">{id || ''}</Typography>
              <Typography variant="caption" color="yellow">{data?.name?.slice(0, 30) || ''}</Typography> 
              <Typography variant="caption" color="slate">{children}</Typography>
            </div>
            <div className={cn(
              'h-[10px] w-full relative',
              'bg-slate-200 dark:bg-slate-900/50',
            )}>
              {showProgress && (
                  <ProgressBar 
                    progress={localProgress} 
                    className="w-full rounded-l-none"
                    color={color}
                  />
              )}
            </div>
          </div>

        </div>

        
      </Box>

  );
});

BaseNode.displayName = 'BaseNode';

export default BaseNode; 
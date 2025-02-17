import { memo } from 'react';
import { getBezierPath, getStraightPath, getSmoothStepPath, getSimpleBezierPath } from 'reactflow';
import PropTypes from 'prop-types';
import { cn } from '../../utils';
import { useTheme } from '../../contexts/ThemeContext';
import { useDiagram } from '../../contexts/DiagramContext';

const DiagramEdge = memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd
}) => {
  const { isExecuting, edgeType } = useDiagram();
  const { isDark } = useTheme();

  // Get the path based on the edge type
  const getEdgePath = () => {
    const params = {
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    };

    switch (edgeType) {
      case 'straight':
        return getStraightPath(params);
      case 'step':
        return getSmoothStepPath({
          ...params,
          borderRadius: 0
        });
      case 'smoothstep':
        return getSmoothStepPath({
          ...params,
          borderRadius: 10
        });
      case 'simplebezier':
        return getSimpleBezierPath(params);
      case 'default':
      default:
        return getBezierPath(params);
    }
  };

  const [edgePath] = getEdgePath();

  return (
    <path
      id={id}
      d={edgePath}
      markerEnd={markerEnd}
      style={{
        ...style,
        strokeWidth: 4,
        strokeDasharray: isExecuting ? '4 8' : '0 0',
        opacity: 0.75,
      }}
      interactionWidth={12}
      reconnectable={true}
      className={cn(
        "react-flow__edge-path",
        isExecuting ? "animate-dash" : "",
        isExecuting ? "stroke-semantic-yellow" : "stroke-cyan-500"
      )}
      fill="none"
    />
  );
});

DiagramEdge.displayName = 'DiagramEdge';

DiagramEdge.propTypes = {
  id: PropTypes.string.isRequired,
  sourceX: PropTypes.number.isRequired,
  sourceY: PropTypes.number.isRequired,
  targetX: PropTypes.number.isRequired,
  targetY: PropTypes.number.isRequired,
  sourcePosition: PropTypes.string.isRequired,
  targetPosition: PropTypes.string.isRequired,
  style: PropTypes.object,
  markerEnd: PropTypes.string,
  interactionWidth: PropTypes.number,
  type: PropTypes.oneOf(['default', 'straight', 'step', 'smoothstep', 'simplebezier'])
};

export default DiagramEdge; 
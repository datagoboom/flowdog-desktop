import { memo, useMemo, useCallback, useRef, useState } from 'react';
import {
  EdgeLabelRenderer,
  getBezierPath,
  getSmoothStepPath,
  getStraightPath,
  useReactFlow,
} from 'reactflow';
import PropTypes from 'prop-types';
import { cn } from '../../utils';
import { useTheme } from '../../contexts/ThemeContext';
import { useFlow } from '../../contexts/FlowContext';
import ClickableBaseEdge from './ClickableBaseEdge';

const PositionableEdge = memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  selected,
  data,
}) => {
  const reactFlowInstance = useReactFlow();
  const { isExecuting, edgeType} = useFlow();
  const { isDark } = useTheme();
  const positionHandlers = data?.positionHandlers ?? [];
  const dragHandleRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const params = {
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  };

  // Memoize path function selection based on edgeType from context
  const pathFunction = useMemo(() => {
    switch (edgeType) {
      case 'straight':
        return getStraightPath;
      case 'smoothstep':
        return getSmoothStepPath;
      case 'step':
        return getSmoothStepPath;
      default:
        return getBezierPath;
    }
  }, [edgeType]);

  // Helper to determine if a segment is more vertical than horizontal
  const isVerticalSegment = useCallback((start, end) => {
    const dx = Math.abs(end.x - start.x);
    const dy = Math.abs(end.y - start.y);
    const THRESHOLD = 10; // Increased from 10 for better detection
    const RATIO_THRESHOLD = 1.2; // More forgiving ratio (was implicitly 2)
  
    // If the segment is very short, we should maintain previous orientation
    // or use the general direction of the full path
    if (dx + dy < THRESHOLD) {
      // Could look at overall source->target orientation
      const globalDx = Math.abs(targetX - sourceX);
      const globalDy = Math.abs(targetY - sourceY);
      return globalDy > globalDx;
    }
  
    // If one dimension is clearly dominant, use that
    if (dy > dx * RATIO_THRESHOLD) return true;  // clearly vertical
    if (dx > dy * RATIO_THRESHOLD) return false; // clearly horizontal
  
    // For segments that are close to 45 degrees:
    // If it's more vertical than the previous segment, keep it vertical
    // If it's the first segment, use the global direction
    const globalDx = Math.abs(targetX - sourceX);
    const globalDy = Math.abs(targetY - sourceY);
    return dy >= dx || globalDy > globalDx;
  }, [sourceX, sourceY, targetX, targetY]);

  // Calculate segment points for orientation detection
  const segmentPoints = useMemo(() => {
    const points = [];
    const allPoints = [
      { x: sourceX, y: sourceY },
      ...positionHandlers,
      { x: targetX, y: targetY }
    ];

    for (let i = 0; i < allPoints.length - 1; i++) {
      points.push({
        start: allPoints[i],
        end: allPoints[i + 1],
        isVertical: isVerticalSegment(allPoints[i], allPoints[i + 1])
      });
    }

    return points;
  }, [sourceX, sourceY, targetX, targetY, positionHandlers, isVerticalSegment]);

  const handleEdgeClick = useCallback((event, segmentIndex) => {
    const position = reactFlowInstance.screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });

    reactFlowInstance.setEdges((edges) => {
      const edgeIndex = edges.findIndex((edge) => edge.id === id);
      if (edgeIndex === -1) return edges;

      const newEdges = [...edges];
      const newHandlers = [...(newEdges[edgeIndex].data?.positionHandlers || [])];
      
      // Get the segment's orientation and points
      const segment = segmentPoints[segmentIndex];
      const isVertical = segment.isVertical;
      const start = segment.start;
      const end = segment.end;

      // Determine flow direction
      const flowingDown = end.y > start.y;
      const flowingRight = end.x > start.x;

      // Set source/target positions based on flow direction
      const sourcePosition = isVertical 
        ? (flowingDown ? 'bottom' : 'top')    // Inverted for vertical
        : (flowingRight ? 'right' : 'left');
      
      const targetPosition = isVertical
        ? (flowingDown ? 'top' : 'bottom')    // Inverted for vertical
        : (flowingRight ? 'left' : 'right');

      // Add the new handler with the appropriate position and orientation
      newHandlers.splice(segmentIndex, 0, {
        x: position.x,
        y: position.y,
        sourcePosition,
        targetPosition
      });

      newEdges[edgeIndex] = {
        ...newEdges[edgeIndex],
        data: {
          ...newEdges[edgeIndex].data,
          positionHandlers: newHandlers
        }
      };

      return newEdges;
    });
  }, [id, reactFlowInstance, segmentPoints]);

  // Memoize edge segments calculation with orientation
  const edgeSegmentsArray = useMemo(() => {
    const segments = [];
    const edgeSegmentsCount = positionHandlers.length + 1;

    for (let i = 0; i < edgeSegmentsCount; i++) {
      let segmentSourceX, segmentSourceY, segmentTargetX, segmentTargetY;
      let segmentSourcePos, segmentTargetPos;

      if (i === 0) {
        segmentSourceX = sourceX;
        segmentSourceY = sourceY;
        segmentSourcePos = sourcePosition;
      } else {
        const handler = positionHandlers[i - 1];
        segmentSourceX = handler.x;
        segmentSourceY = handler.y;
        segmentSourcePos = handler.sourcePosition || 'right';
      }

      if (i === edgeSegmentsCount - 1) {
        segmentTargetX = targetX;
        segmentTargetY = targetY;
        segmentTargetPos = targetPosition;
      } else {
        const handler = positionHandlers[i];
        segmentTargetX = handler.x;
        segmentTargetY = handler.y;
        segmentTargetPos = handler.targetPosition || 'left';
      }

      const [edgePath, labelX, labelY] = pathFunction({
        sourceX: segmentSourceX,
        sourceY: segmentSourceY,
        sourcePosition: segmentSourcePos,
        targetX: segmentTargetX,
        targetY: segmentTargetY,
        targetPosition: segmentTargetPos,
        borderRadius: edgeType === 'step' ? 0 : undefined
      });
      segments.push({ 
        edgePath, 
        labelX, 
        labelY,
        sourcePos: segmentSourcePos,
        targetPos: segmentTargetPos
      });
    }

    return segments;
  }, [sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, positionHandlers, pathFunction, edgeType]);

  const startDragging = useCallback((event, handlerIndex) => {
    const handleDrag = (moveEvent) => {
      const position = reactFlowInstance.screenToFlowPosition({
        x: moveEvent.clientX,
        y: moveEvent.clientY,
      });

      reactFlowInstance.setEdges((edges) => {
        const edgeIndex = edges.findIndex((edge) => edge.id === id);
        if (edgeIndex === -1) return edges;

        const newEdges = [...edges];
        const newHandlers = [...newEdges[edgeIndex].data.positionHandlers];
        newHandlers[handlerIndex] = {
          ...newHandlers[handlerIndex],
          x: position.x,
          y: position.y,
          active: true
        };

        newEdges[edgeIndex] = {
          ...newEdges[edgeIndex],
          data: {
            ...newEdges[edgeIndex].data,
            positionHandlers: newHandlers
          }
        };

        return newEdges;
      });
    };

    const stopDragging = () => {
      window.removeEventListener('mousemove', handleDrag);
      window.removeEventListener('mouseup', stopDragging);
      
      // Reset active state
      reactFlowInstance.setEdges((edges) => {
        const edgeIndex = edges.findIndex((edge) => edge.id === id);
        if (edgeIndex === -1) return edges;

        const newEdges = [...edges];
        const newHandlers = newEdges[edgeIndex].data.positionHandlers.map(
          handler => ({ ...handler, active: false })
        );

        newEdges[edgeIndex] = {
          ...newEdges[edgeIndex],
          data: {
            ...newEdges[edgeIndex].data,
            positionHandlers: newHandlers
          }
        };

        return newEdges;
      });
    };

    window.addEventListener('mousemove', handleDrag);
    window.addEventListener('mouseup', stopDragging);
  }, [id, reactFlowInstance]);

  const handleDelete = useCallback((event, handlerIndex) => {
    event.preventDefault();
    event.stopPropagation();

    reactFlowInstance.setEdges((edges) => {
      const edgeIndex = edges.findIndex((edge) => edge.id === id);
      if (edgeIndex === -1) return edges;

      const newEdges = [...edges];
      const newHandlers = [...newEdges[edgeIndex].data.positionHandlers];
      newHandlers.splice(handlerIndex, 1);

      newEdges[edgeIndex] = {
        ...newEdges[edgeIndex],
        data: {
          ...newEdges[edgeIndex].data,
          positionHandlers: newHandlers
        }
      };

      return newEdges;
    });
  }, [id, reactFlowInstance]);

  const EdgeHandler = memo(({ x, y, handlerIndex, active, isVertical, onDragStart, onDelete }) => (
    <EdgeLabelRenderer>
      <div
        className="nopan nodrag"
        style={{
          position: 'absolute',
          transform: `translate(-50%, -50%) translate(${x}px,${y}px)`,
          pointerEvents: 'all',
        }}
      >
        <div
          className={cn(
            "relative flex items-center justify-center",
            "w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-300",
            "border-2 border-cyan-500 dark:border-cyan-600",
            "shadow-sm cursor-move",
            "transition-colors duration-200",
            active && "scale-110"
          )}
          onMouseDown={onDragStart}
          onContextMenu={onDelete}
        />
      </div>
    </EdgeLabelRenderer>
  ));

  return (
    <>
      {edgeSegmentsArray.map(({ edgePath }, index) => (
        <ClickableBaseEdge
          onClick={(event) => handleEdgeClick(event, index)}
          key={`edge${id}_segment${index}`}
          path={edgePath}
          markerEnd={markerEnd}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{
            ...style,
            strokeWidth: 2,
            opacity: 0.75,
            stroke: isExecuting ? 'var(--color-yellow)' : 'var(--color-cyan)',
            ...(isExecuting && {
              strokeDasharray: '4 4',
              animation: 'dash 0.25s linear infinite'
            })
          }}
          className={cn(
            "react-flow__edge-path",
            selected && "!stroke-semantic-yellow"
          )}
        />
      ))}
      
      {(selected || isHovered) && positionHandlers.map((handler, index) => (
        <EdgeHandler
          key={`edge${id}_handler${index}`}
          {...handler}
          handlerIndex={index}
          isVertical={segmentPoints[index]?.isVertical}
          onDragStart={(e) => startDragging(e, index)}
          onDelete={(e) => handleDelete(e, index)}
        />
      ))}
    </>
  );
});

PositionableEdge.displayName = 'PositionableEdge';

PositionableEdge.propTypes = {
  id: PropTypes.string.isRequired,
  sourceX: PropTypes.number.isRequired,
  sourceY: PropTypes.number.isRequired,
  targetX: PropTypes.number.isRequired,
  targetY: PropTypes.number.isRequired,
  sourcePosition: PropTypes.string.isRequired,
  targetPosition: PropTypes.string.isRequired,
  style: PropTypes.object,
  markerEnd: PropTypes.string,
  selected: PropTypes.bool,
  data: PropTypes.shape({
    positionHandlers: PropTypes.arrayOf(PropTypes.shape({
      x: PropTypes.number,
      y: PropTypes.number,
      active: PropTypes.bool,
      sourcePosition: PropTypes.string,
      targetPosition: PropTypes.string
    }))
  })
};

export default PositionableEdge; 
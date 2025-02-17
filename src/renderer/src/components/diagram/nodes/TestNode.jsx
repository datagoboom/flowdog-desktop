import { memo, useMemo, useState} from 'react';
import { Handle, Position } from 'reactflow';
import { Check, X } from 'lucide-react';
import { cn } from '../../../utils';
import BaseNode from './BaseNode';
import { useTheme } from '../../../contexts/ThemeContext';
import { useDiagram } from '../../../contexts/DiagramContext';

const TestNode = memo(({ data, selected, id, isConnectable }) => {
  const { isDark } = useTheme();
  const { lastOutput, executingNodeIds} = useDiagram();

  const [localTestData, setLocalTestData] = useState(null);
  
  // Get execution status from the diagram context
  const isExecuting = executingNodeIds?.has?.(id) || false;
  
  // Get test results from lastOutput, handling the nested structure
  const testResults = useMemo(() => {
    if (!lastOutput || lastOutput.nodeId !== id) return null;
    
    let testData = {
        ...localTestData,
        results: lastOutput.data?.response?.results || [],
        passed: lastOutput.data?.response?.success || false,
    }
    setLocalTestData(testData);
    return testData;
  }, [lastOutput, id]);
  

  // Dynamic styling based on test results
  const getStatusStyles = () => {
    if (isExecuting) {
      return "animate-pulse bg-yellow-500/20";
    }
    if (localTestData?.passed === true) {
      return "bg-green-500/20 dark:bg-green-500/30";
    }
    if (localTestData?.passed === false) {
      return "bg-red-500/20 dark:bg-red-500/30";
    }
    return "";
  };

  const getIconColor = () => {
    if (isExecuting) return "text-yellow-500";
    if (localTestData?.passed === true) return "text-green-500";
    if (localTestData?.passed === false) return "text-red-500";
    return "text-slate-500";
  };

  const getBorderColor = () => {
    if (isExecuting) return "border-yellow-500";
    if (localTestData?.passed === true) return "border-green-500";
    if (localTestData?.passed === false) return "border-red-500";
    return "border-slate-200 dark:border-slate-700";
  };

  // Get summary of test results
  const getTestSummary = () => {
    if (!localTestData?.results) return '';
    const passed = localTestData.results.filter(r => r.success).length;
    const total = localTestData.results.length;
    return ` (${passed}/${total})`;
  };

  return (
    <>
      <BaseNode
        id={id}
        type="test"
        selected={selected}
        data={{
          ...data,
          testResults: localTestData,
        }}
        className={cn(
          "transition-all duration-300",
          getStatusStyles(),
        )}
      >
        <div className="flex items-center gap-2">
          {localTestData?.passed ? <Check size={16} className={cn("transition-colors", getIconColor())} /> : ''}
          <div className="flex flex-col">

            {localTestData && (
              <span className={cn(
                "text-xs",
                localTestData?.passed ? "text-green-500" : "text-red-500"
              )}>

                {getTestSummary()}
              </span>
            )}
          </div>
        </div>
      </BaseNode>

      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        id={`${id}-target`}
        isConnectable={isConnectable}
        className={cn(
          "w-3 h-3",
          "border-2",
          isDark ? "bg-slate-700" : "bg-slate-200",
          getBorderColor()
        )}
      />

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id={`${id}-source`}
        isConnectable={isConnectable}
        className={cn(
          "w-3 h-3",
          "border-2",
          isDark ? "bg-slate-700" : "bg-slate-200",
        )}
      />
    </>
  );
});

TestNode.displayName = 'TestNode';

export default TestNode;
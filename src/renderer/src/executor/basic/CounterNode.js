import formatter from '../../utils/formatter';

export default class CounterNode {
    constructor(updateNodeData) {
      this.updateNodeData = updateNodeData;
      this.lastIterationContext = null;
      this.counterCache = new Map(); // Cache for counter values
    }
  
    async execute(data, inputData = null, sourceNodes, nodeId) {
      try {
        // Get the current incrementor value from cache or node data
        let incrementor = this.counterCache.get(nodeId) ?? parseInt(data.incrementor || 0, 10);
        
        // Get iteration context from source nodes
        const iteratorNode = sourceNodes?.find(node => 
          node.data?.iteration && 
          typeof node.data.iteration.current === 'number'
        );
        
        const currentIteration = iteratorNode?.data?.iteration?.current;

        // Debug logging
        console.log('Counter execution:', {
          currentIteration,
          lastContext: this.lastIterationContext,
          incrementor,
          nodeId,
          cached: this.counterCache.get(nodeId),
          inputData: inputData
        });

        // Only increment if we're in a new iteration or not in an iteration
        if (currentIteration === undefined || 
            this.lastIterationContext !== currentIteration) {
          
          // Store the current iteration
          this.lastIterationContext = currentIteration;
          
          // Count non-null inputs
          let validInputs = 0;
          if (inputData) {
            Object.values(inputData).forEach(input => {
              if (input !== null && input !== undefined) {
                validInputs++;
              }
            });
          }
          
          // Check if limit is reached before incrementing
          if (data.limit && incrementor >= data.limit) {
            return formatter.errorResponse('Counter limit reached');
          }

          // Increment the counter by the number of valid inputs
          const newValue = incrementor + validInputs;
          
          // Update both cache and node data
          this.counterCache.set(nodeId, newValue);
          await this.updateNodeData(nodeId, 'incrementor', newValue);

          // Verify the update
          console.log('Counter updated:', {
            oldValue: incrementor,
            newValue,
            nodeId,
            cached: this.counterCache.get(nodeId),
            validInputs
          });

          return formatter.standardResponse({
            incrementor: newValue,
            limit: data.limit,
            id: nodeId
          });
        }

        // If we're in the same iteration, return the current value without incrementing
        return formatter.standardResponse({
          incrementor: incrementor,
          limit: data.limit,
          id: nodeId
        });
      } catch (error) {
        console.error('Counter node error:', error);
        return formatter.errorResponse(error.message);
      }
    }
  
    resetCounter(data) {
      if (data) {
        this.lastIterationContext = null;
        this.counterCache.delete(data.id);
        this.updateNodeData(data.id, 'incrementor', 0);
      }
    }
  }
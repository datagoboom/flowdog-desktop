import formatter from '../../utils/formatter';

export default class IteratorNode {
  constructor(updateNodeData) {
    this.updateNodeData = updateNodeData;
    this.iteratorState = new Map();
  }

  resetState(nodeId) {
    if (nodeId) {
      this.iteratorState.delete(nodeId);
    } else {
      this.iteratorState.clear();
    }
  }

  async execute(data, inputData) {
    try {
      const nodeId = data.id;
      const mode = data.mode || 'input';
      
      console.log("Iterator Node Data:", {
        nodeId,
        mode,
        fullData: data,
        outputList: data.outputList,
        inputData,
        currentState: this.iteratorState.get(nodeId)
      });
      
      let itemsToIterate;
      if (mode === 'custom') {
        itemsToIterate = data.outputList;
      } else if (mode === 'input' && inputData) {
        itemsToIterate = data.outputList || [];
      } else {
        itemsToIterate = [];
      }
  
      if (!Array.isArray(itemsToIterate)) {
        throw new Error('Items to iterate must be an array');
      }
  
      let state = this.iteratorState.get(nodeId);
      const isInnerIterator = Boolean(inputData?.isIterator);
      const parentIteration = inputData?.isIterator ? inputData.iteration.current : 1;
  
      // Initialize state for new iteration cycle
      if (!state || 
          (!isInnerIterator && state.currentIndex >= state.items.length) ||
          (isInnerIterator && (state.parentIteration !== parentIteration || !inputData.shouldContinue))) {
        
        state = {
          currentIndex: 0,
          parentIteration,
          items: itemsToIterate.slice(),
          totalItems: itemsToIterate.length,
          isInnerIterator,
          completed: false
        };
        this.iteratorState.set(nodeId, state);
        
        if (mode === 'custom') {
          await this.updateNodeData(nodeId, 'outputList', itemsToIterate);
        }
      }
  
      // Check for completion
      if (state.currentIndex >= state.items.length) {
        if (!state.isInnerIterator || !inputData?.shouldContinue) {
          this.iteratorState.delete(nodeId);
          await this.updateNodeData(nodeId, 'result', null);
          await this.updateNodeData(nodeId, 'progress', {
            current: state.totalItems,
            total: state.totalItems,
            percentage: 100
          });
          return formatter.standardResponse(true, {
            complete: true,
            processedItems: state.totalItems
          });
        }
        
        // Reset inner iterator for next parent item
        state.currentIndex = 0;
        state.parentIteration = parentIteration;
        this.iteratorState.set(nodeId, state);
      }
  
      const currentItem = state.items[state.currentIndex];
      
      await this.updateNodeData(nodeId, 'result', currentItem);
      await this.updateNodeData(nodeId, 'progress', {
        current: state.currentIndex + 1,
        total: state.totalItems,
        percentage: Math.round(((state.currentIndex + 1) / state.totalItems) * 100)
      });
  
      state.currentIndex++;
      this.iteratorState.set(nodeId, state);
  
      const hasMore = state.currentIndex < state.items.length;
      
      return {
        ...formatter.standardResponse(true, currentItem),
        isIterator: true,
        shouldContinue: hasMore || (state.isInnerIterator && inputData?.shouldContinue),
        iteration: {
          current: state.isInnerIterator ? state.currentIndex : parentIteration,
          total: state.totalItems,
          hasMore: hasMore || (state.isInnerIterator && inputData?.shouldContinue)
        }
      };
  
    } catch (error) {
      console.error('Iterator node execution failed:', error);
      return formatter.errorResponse(error.message);
    }
  }
}
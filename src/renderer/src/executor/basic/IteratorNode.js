import formatter from '../../utils/formatter';
import JQParser from '../../utils/jq';

const jq = new JQParser();

export default class IteratorNode {
  constructor(updateNodeData, getEnvVar) {
    this.updateNodeData = updateNodeData;
    this.getEnvVar = getEnvVar;
    this.iteratorState = new Map();
  }

  resetState(nodeId) {
    if (nodeId) {
      this.iteratorState.delete(nodeId);
    } else {
      this.iteratorState.clear();
    }
  }

  evaluateEnvTemplate(template, context) {
    if (!template?.includes('{{')) return template;
    
    let result = template;
    const matches = template.match(/\{\{(.+?)\}\}/g);
    if (matches) {
      for (const match of matches) {
        const path = match.slice(2, -2).trim();
        let value;
        
        if (path.startsWith('$')) {
          value = this.getEnvVar(path);
          if (value === undefined) {
            console.warn(`Environment variable ${path} not found`);
            value = '';
          }
        } else {
          value = jq.evaluate(path, context);
        }
        
        result = result.replace(match, value);
      }
    }
    return result;
  }

  async execute(data, inputData) {
    try {
      const nodeId = data.id;
      const mode = data.mode || 'input';
      
      let itemsToIterate;
      if (mode === 'custom') {
        itemsToIterate = data.outputList;
      } else if (mode === 'input' && inputData) {
        // Handle both direct array input and RSS feed items
        itemsToIterate = inputData?.response?.items || data.outputList || [];
        
        // If array path is specified, try to extract array using it
        if (data.arrayPath) {
          try {
            itemsToIterate = jq.evaluate(data.arrayPath, inputData);
            if (!Array.isArray(itemsToIterate)) {
              throw new Error(`Path ${data.arrayPath} did not resolve to an array`);
            }
          } catch (error) {
            console.error('Array path evaluation failed:', error);
            return formatter.errorResponse(`Failed to get array from path: ${error.message}`);
          }
        }
      } else {
        itemsToIterate = [];
      }
  
      if (!Array.isArray(itemsToIterate)) {
        return formatter.errorResponse('Items to iterate must be an array');
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
      
      // Apply any template transformations to the current item
      let processedItem = currentItem;
      if (data.itemTemplate) {
        try {
          const context = { ...inputData, item: currentItem };
          processedItem = this.evaluateEnvTemplate(data.itemTemplate, context);
        } catch (error) {
          console.error('Item templating failed:', error);
        }
      }
      
      await this.updateNodeData(nodeId, 'result', processedItem);
      await this.updateNodeData(nodeId, 'progress', {
        current: state.currentIndex + 1,
        total: state.totalItems,
        percentage: Math.round(((state.currentIndex + 1) / state.totalItems) * 100)
      });
  
      state.currentIndex++;
      this.iteratorState.set(nodeId, state);
  
      const hasMore = state.currentIndex < state.items.length;
      
      return {
        ...formatter.standardResponse(true, processedItem),
        isIterator: true,
        shouldContinue: hasMore || (state.isInnerIterator && inputData?.shouldContinue),
        iteration: {
          current: state.currentIndex,
          total: state.totalItems,
          hasMore: hasMore || (state.isInnerIterator && inputData?.shouldContinue)
        },
        progress: {
          current: state.currentIndex,
          total: state.totalItems,
          percentage: Math.round((state.currentIndex / state.totalItems) * 100)
        }
      };
  
    } catch (error) {
      console.error('Iterator node execution failed:', error);
      return formatter.errorResponse(error.message);
    }
  }
}
import formatter from '../../utils/formatter';

export default class CounterNode {
    constructor(updateNodeData) {
      this.updateNodeData = updateNodeData;
    }
  
    async execute(data, inputData = null, _, nodeId) {
      console.log("Counter Node Data (before):", data);
      console.log("Counter Node Input Data:", inputData);
      let incrementor = parseInt(data.incrementor || 0, 10);
      if(data.limit !== 0 && incrementor >= data.limit) {
        return formatter.errorResponse('Counter limit reached');
      }

      console.log("Counter Node Data (after):", {
        nodeId: nodeId,
        incrementor: incrementor,
        limit: data.limit
      });

      const newValue = incrementor + 1;
      this.updateNodeData(nodeId, 'incrementor', newValue);

      return formatter.standardResponse({
        incrementor: newValue,
        limit: data.limit,
        id: nodeId
      });
    }
  
    resetCounter(data) {
      if (data) {
        this.updateNodeData(data.id, 'incrementor', 0);
      }
    }
  }
import formatter from '../../utils/formatter';
import JQParser from '../../utils/jq';

const jq = new JQParser();

export default class CollectorNode {
  constructor(getEnvVar, setEnvironmentVariable, localEnvironment, updateNodeData) {
    this.getEnvVar = getEnvVar;
    this.setEnvironmentVariable = setEnvironmentVariable;
    this.localEnvironment = localEnvironment || { variables: {} };
    this.updateNodeData = updateNodeData;
  }

  // Helper function for evaluating templates with environment variables
  evaluateEnvTemplate(template, context) {
    if (!template.includes('{{')) return template;
    
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

  async execute(data, inputData = null, sourceNodes = [], nodeId) {
    let collection = data.collection || [];
    console.log('Collector node executing with data:', data);
    console.log('Collector Node ID:', nodeId);

    try {
      const { path } = data;

      if (!path) {
        return formatter.errorResponse('Collection path is required but was not specified');
      }

      // Build context from source nodes
      const context = sourceNodes?.reduce((acc, source) => ({
        ...acc,
        [source.id]: source.data
      }), {}) || {};

      // Extract value using the specified path
      let valueToCollect;
      try {
        // Check for templates first
        if (path.includes('{{')) {
          valueToCollect = this.evaluateEnvTemplate(path, context);
        } 
        // If no template or template evaluation returned undefined, try JQ
        else if (path.includes('.')) {
          valueToCollect = jq.evaluate(path, context);
        } 
        // If neither, use the raw path value
        else {
          valueToCollect = path;
        }

        console.log('Collecting value:', { path, value: valueToCollect });
      } catch (error) {
        console.error('Value extraction failed:', error, { path, context });
        return formatter.errorResponse(`Value extraction failed: ${error.message}`);
      }

      // Add the value to the collection
      collection.push(valueToCollect);

      if (data.makeUnique) {
        collection = [...new Set(collection)];
      }

      // Update the node data with the new collection
      let temp_collection = [];
      if(data.batch && data.batch_size === collection.length){
        temp_collection = collection;
        console.log(`Batch size met for node ${nodeId} (${data.batch_size}). Emptying collection.`);
        collection = [];
      }

      this.updateNodeData(nodeId, 'collection', collection);


      if(data.batch){
        if(data.batch_size == collection.length){
          return formatter.standardResponse(true, temp_collection);
        }else{
          return formatter.standardResponse(true, null);
        }
      }

      return formatter.standardResponse(true, collection);

    } catch (error) {
      console.error('Collector node execution failed:', error);
      return formatter.errorResponse(error.message);
    }
  }
} 
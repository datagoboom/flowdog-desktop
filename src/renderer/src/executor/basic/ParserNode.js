import formatter from '../../utils/formatter';
import JQParser from '../../utils/jq';

const jq = new JQParser();

export default class ParserNode {
  constructor(getEnvVar, setEnvironmentVariable, localEnvironment) {
    this.getEnvVar = getEnvVar;
    this.setEnvironmentVariable = setEnvironmentVariable;
    this.localEnvironment = localEnvironment || { variables: {} };
  }

  async execute(data, inputData) {
    try {
      console.log('Parser executing with data:', data);
      console.log('Input data:', inputData);

      const { template = '' } = data;

      if (!template.trim()) {
        return formatter.errorResponse('Template expression cannot be empty');
      }

      // Split the template path
      const pathParts = template.split('.');
      
      // Get the source node ID
      const sourceNodeId = pathParts[0];
      
      // Get the source data by traversing the path
      let sourceData = inputData;
      for (const part of pathParts) {
        if (sourceData === undefined) break;
        sourceData = sourceData[part];
      }

      console.log('Source data for parsing:', sourceData);

      if (!sourceData) {
        return formatter.errorResponse('No valid source data found');
      }

      try {
        // No need to adjust template since we've already traversed the path
        const result = sourceData;
        console.log('Parser result:', result);
        return formatter.standardResponse(true, result);
      } catch (error) {
        console.error('Parser error:', error);
        return formatter.errorResponse(`Parser error: ${error.message}`);
      }
    } catch (error) {
      console.error('Parser execution error:', error);
      return formatter.errorResponse(error.message);
    }
  }
} 
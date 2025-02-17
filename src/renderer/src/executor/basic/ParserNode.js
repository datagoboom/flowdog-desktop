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

      // Get the source node ID from the template
      const sourceNodeId = template.split('.')[0];
      
      // Get the source data from the nested structure
      const sourceData = inputData[Object.keys(inputData)[0]][sourceNodeId];
      console.log('Source data for parsing:', sourceData);

      if (!sourceData || !sourceData.success) {
        return formatter.errorResponse('No valid source data found');
      }

      try {
        // Adjust the template to remove the node ID prefix
        const adjustedTemplate = template.substring(template.indexOf('.') + 1);
        console.log('Using adjusted template:', adjustedTemplate);

        const result = jq.evaluate(adjustedTemplate, sourceData);
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
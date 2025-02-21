import formatter from '../../utils/formatter';
import JQParser from '../../utils/jq';

const jq = new JQParser();

export default class TextDisplayNode {
  constructor(getEnvVar, setEnvironmentVariable, localEnvironment, updateNodeData) {
    this.getEnvVar = getEnvVar;
    this.setEnvironmentVariable = setEnvironmentVariable;
    this.localEnvironment = localEnvironment || { variables: {} };
    this.updateNodeData = updateNodeData;  // Store the updateNodeData function
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
          try {
            // Extract the node ID and path
            const [nodeId, ...pathParts] = path.split('.');
            const nodePath = pathParts.join('.');
            
            // Get the node's data from context
            const nodeData = context[nodeId];
            if (!nodeData) {
              console.warn(`Node data not found for ${nodeId}`);
              value = '';
            } else {
              // First try to get data from response.data
              if (nodeData.response?.data && nodePath === 'response.data') {
                value = nodeData.response.data;
              } else {
                // Fallback to regular path evaluation
                value = jq.evaluate(nodePath, nodeData);
              }
            }
          } catch (error) {
            console.error('Path evaluation failed:', error);
            value = '';
          }
        }
        result = result.replace(match, value ?? '');
      }
    }
    return result;
  }

  async execute(data, inputData = null, sourceNodes = []) {
    try {
      const { inputText, id } = data;
      
      // Build context from source nodes
      const context = sourceNodes?.reduce((acc, source) => ({
        ...acc,
        [source.id]: source.data
      }), {}) || {};

      // Template the text
      let outputText;
      try {
        outputText = this.evaluateEnvTemplate(inputText || '', context);
        console.log('TextDisplay templating:', { inputText, outputText, context });
        
        // Update the node data with both response and outputText
        if (this.updateNodeData && id) {
          await this.updateNodeData(id, 'response', {
            data: outputText,
            success: true
          });
          await this.updateNodeData(id, 'outputText', outputText);
        }
      } catch (error) {
        console.error('Text templating failed:', error);
        outputText = 'Error: Failed to template text';
      }

      return formatter.standardResponse(true, {
        inputText,
        outputText,
        response: {
          data: outputText,
          success: true
        }
      });
    } catch (error) {
      console.error('Text display node execution failed:', error);
      return formatter.errorResponse(error.message, {
        inputText: data.inputText,
        outputText: 'Error: Execution failed'
      });
    }
  }
}
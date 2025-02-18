import Handlebars from 'handlebars';
import formatter from '../../utils/formatter';
import xml from '../../utils/xml';

export default class FormatNode {
  constructor(updateNodeData) {
    this.updateNodeData = updateNodeData;
  }

  decodeHTMLEntities(text) {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  }

  async execute(data, inputData, sourceNodes) {
    try {
      // Ensure node has an ID
      const nodeId = data.id || 'FORMAT_01';
      
      const { template, formatType } = data;
      if (!template) {
        return formatter.errorResponse('Template is missing', nodeId);
      }
  
      // Process source data
      const sourceData = sourceNodes?.reduce((acc, source) => ({
        ...acc,
        [source.id]: source.data
      }), {}) || {};
  
      // Get the most recent source node's data
      const mostRecentSource = sourceNodes?.[sourceNodes.length - 1];
      const primaryData = mostRecentSource?.data?.response || inputData;
  
      // Create template context with multiple ways to access data
      const templateContext = {
        sourceData,
        inputData: primaryData,
        data: primaryData,
        raw: sourceData
      };
  
      console.log('Format node template context:', templateContext); // Debug log
  
      // Execute template
      const compiled = Handlebars.compile(template);
      let result = compiled(templateContext);
      result = this.decodeHTMLEntities(result);
  
      // Parse based on formatType
      let parsedResult;
      switch (formatType?.toLowerCase()) {
        case 'json':
          try {
            parsedResult = JSON.parse(result);
          } catch (e) {
            console.error('JSON parsing failed:', e);
            parsedResult = result;
          }
          break;
        
        case 'xml':
          try {
            parsedResult = xml.parse(result);
          } catch (e) {
            console.error('XML parsing failed:', e);
            parsedResult = result;
          }
          break;
        
        default:
          parsedResult = result;
      }
  
      // Update node data if available
      if (this.updateNodeData) {
        await this.updateNodeData(nodeId, 'lastOutput', {
          sourceData,
          output: parsedResult,
          timestamp: new Date().toISOString()
        });
      }
  
      return formatter.standardResponse(true, parsedResult, null, nodeId);
  
    } catch (error) {
      console.error('Format node error:', error);
      return formatter.errorResponse(error.message, data.id || 'FORMAT_01');
    }
  }
} 
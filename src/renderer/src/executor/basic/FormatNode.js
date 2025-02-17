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
    if (!data.id) return formatter.errorResponse('Node ID is missing', 'unknown');
  
    try {
      const { template, formatType } = data;
      if (!template) return formatter.errorResponse('Template is missing', data.id);
  
      // Process source data
      const sourceData = sourceNodes?.reduce((acc, source) => ({
        ...acc,
        [source.id]: source.data
      }), {}) || {};
  
      // Create template context
      const templateContext = {
        sourceData,
        inputData: sourceData[Object.keys(sourceData)[0]],
        data: sourceData[Object.keys(sourceData)[0]]?.response?.data,
        raw: sourceData[Object.keys(sourceData)[0]]?.response?.data
      };
  
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
        await this.updateNodeData(data.id, 'lastOutput', {
          sourceData,
          output: parsedResult,
          timestamp: new Date().toISOString()
        });
      }
  
      return formatter.standardResponse(true, parsedResult, null, data.id);
  
    } catch (error) {
      return formatter.errorResponse(error, data.id);
    }
  }
} 
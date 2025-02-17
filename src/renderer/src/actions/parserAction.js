import get from 'lodash/get';

const parseJQPath = (path) => {
  // Remove leading dot if present
  path = path.startsWith('.') ? path.slice(1) : path;
  
  // Handle array operations
  path = path.replace(/\[\](?=\.|$)/g, '[*]');
  
  return path;
};

const evaluateJQExpression = (data, query) => {
  try {
    if (!query) return data;
    
    const path = parseJQPath(query);
    
    // Handle array wildcards
    if (path.includes('[*]')) {
      const basePath = path.split('[*]')[0];
      const remainingPath = path.split('[*]').slice(1).join('');
      const array = get(data, basePath);
      
      if (Array.isArray(array)) {
        if (!remainingPath) return array;
        return array.map(item => get({ item }, `item${remainingPath}`));
      }
    }
    
    return get(data, path);
  } catch (error) {
    throw new Error(`Invalid query: ${error.message}`);
  }
};

export const executeParserAction = async (config, inputData) => {
  const { mode, query, inputExpression } = config;

  try {
    // Get the input data using the expression
    const targetData = inputExpression ? get(inputData, inputExpression) : inputData;
    
    if (targetData === undefined) {
      throw new Error(`Input data not found at path: ${inputExpression}`);
    }

    switch (mode) {
      case 'json':
        const result = evaluateJQExpression(targetData, query);
        return {
          success: true,
          data: result,
          error: null
        };

      case 'xml':
      case 'text':
        return {
          success: false,
          data: null,
          error: 'Parser mode not yet implemented'
        };

      default:
        return {
          success: false,
          data: null,
          error: 'Invalid parser mode'
        };
    }
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
};

export const validateParserConfig = (config) => {
  const errors = [];

  if (!config.mode) {
    errors.push('Parser mode is required');
  }

  if (!config.inputExpression) {
    errors.push('Input expression is required');
  }

  if (config.mode === 'json' && !config.query) {
    errors.push('JSON query is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}; 
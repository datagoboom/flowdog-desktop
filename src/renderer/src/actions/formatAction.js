import Handlebars from 'handlebars';

export const executeFormatAction = async (config, inputData) => {
  const { template } = config;

  if (!template || !inputData) {
    return {
      success: false,
      error: { message: 'Template or input data is missing' }
    };
  }

  try {
    // Compile the template
    const compiledTemplate = Handlebars.compile(template);
    
    // Execute the template with the input data
    const result = compiledTemplate(inputData);
    
    // Try to parse the result as JSON if it looks like JSON
    let parsedResult = result;
    try {
      if (result.trim().startsWith('{') || result.trim().startsWith('[')) {
        parsedResult = JSON.parse(result);
      }
    } catch (e) {
      console.log('Result is not valid JSON, returning as string');
    }
    
    return {
      success: true,
      data: parsedResult
    };
  } catch (error) {
    return {
      success: false,
      error: { message: error.message }
    };
  }
};

export const validateFormatConfig = (config) => {
  const errors = [];

  if (!config.template) {
    errors.push('Template is required');
  }

  try {
    if (config.template) {
      Handlebars.compile(config.template);
    }
  } catch (error) {
    errors.push(`Invalid template: ${error.message}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}; 
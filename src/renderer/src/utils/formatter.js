import xml from './xml';

/**
 * Standard response format for all nodes
 * @param {boolean} success - Whether the operation was successful
 * @param {*} data - The data payload
 * @param {Error|string} [error] - Optional error message or object
 * @param {string} [sourceId] - ID of the node that generated this response
 * @returns {Object} Standardized response object
 */
const standardResponse = (success, data, error = null, sourceId = null) => {
  // If data is an object with status, headers, data structure, use it directly
  if (data && typeof data === 'object' && 'status' in data) {
    return {
      success,
      response: {
        status: data.status,
        headers: data.headers || {},
        data: data.data
      },
      error,
      source_id: sourceId
    };
  }

  // Otherwise wrap the data
  return {
    success,
    response: data,
    error,
    source_id: sourceId
  };
};

/**
 * Creates an error response
 * @param {Error|string} error - Error message or object
 * @param {string} [sourceId] - ID of the node that generated this error
 * @returns {Object} Standardized error response
 */
const errorResponse = (error, sourceId = null) => {
  return standardResponse(
    false, 
    null, 
    error instanceof Error ? error.message : error,
    sourceId
  );
};

/**
 * Processes input data into a consistent format
 * @param {*} input - Raw input data
 * @returns {Object} Standardized data object
 */
const processInput = (input) => {
  // If input is already in standard format, return it
  if (input && typeof input === 'object' && 'success' in input) {
    return input;
  }

  try {
    // Handle raw XML string
    if (typeof input === 'string' && input.trim().startsWith('<')) {
      try {
        const xmlDoc = xml.parse(input);
        const jsonData = xml.toObject(xmlDoc);
        return standardResponse(true, jsonData);
      } catch (error) {
        console.warn('XML parsing failed:', error);
        return standardResponse(true, input);
      }
    }

    // Handle regular data
    return standardResponse(true, input);

  } catch (error) {
    return errorResponse(error.message);
  }
};

/**
 * Extracts the actual data from a standardized response
 * @param {Object} input - Standardized input object
 * @returns {*} The actual data payload
 */
const extractData = (input) => {
  if (input && typeof input === 'object') {
    if ('success' in input && 'response' in input) {
      return input.response;
    }
    return input;
  }
  return input;
};

/**
 * Checks if input is in standard format
 * @param {*} input - Input to check
 * @returns {boolean} Whether input is in standard format
 */
const isStandardFormat = (input) => {
  return input && 
         typeof input === 'object' && 
         'success' in input && 
         'response' in input && 
         'error' in input;
};

export default {
  standardResponse,
  errorResponse,
  processInput,
  extractData,
  isStandardFormat
}; 
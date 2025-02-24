// these are helper functions that are used in the handlers and other parts of the app

export const responder = (success, data, error = null, sourceId = null) => {
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
  

export const sanitizePath = (str) => {
    return str.replace(/[^a-zA-Z0-9-_]/g, '');
}

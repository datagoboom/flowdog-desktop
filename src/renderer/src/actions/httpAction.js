import axios from 'axios';
import Handlebars from 'handlebars';

/**
 * Templates a string using Handlebars
 * @param {string} template - The template string
 * @param {object} data - The data to use for templating
 * @returns {string} The templated string
 */
const templateString = (template, data) => {
  if (!template || !data) return template;

  console.log('Templating string:', template, data);
  try {
    const compiled = Handlebars.compile(template);
    return compiled(data);
  } catch (error) {
    console.error('Template error:', error);
    return template;
  }
};

/**
 * Templates an object's values using Handlebars
 * @param {Array} items - Array of key-value objects
 * @param {object} data - The data to use for templating
 * @returns {Array} Array with templated values
 */
const templateItems = (items = [], data) => {
  return items.map(item => ({
    ...item,
    key: templateString(item.key, data),
    value: templateString(item.value, data)
  }));
};

/**
 * Builds the final URL with query parameters
 * @param {string} baseUrl - The base URL
 * @param {Array} params - Array of parameter objects
 * @returns {string} The complete URL with query parameters
 */
const buildUrl = (baseUrl, params = []) => {
  if (!params.length) return baseUrl;
  
  const queryString = params
    .filter(param => param.key && param.value) // Only include params with both key and value
    .map(param => `${encodeURIComponent(param.key)}=${encodeURIComponent(param.value)}`)
    .join('&');
    
  return queryString ? `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}${queryString}` : baseUrl;
};

/**
 * Parse body string into JSON if needed
 * @param {string|object} body - The request body
 * @returns {object} Parsed body
 */
const parseBody = (body) => {
  if (!body) return null;
  if (typeof body === 'object') return body;
  
  try {
    // Remove any extra whitespace and newlines
    const cleanBody = body.trim();
    return JSON.parse(cleanBody);
  } catch (error) {
    console.error('Failed to parse body:', error);
    return body; // Return original if parsing fails
  }
};

/**
 * Executes an HTTP request
 * @param {Object} config - The request configuration
 * @param {string} config.url - The URL to send the request to
 * @param {string} config.method - The HTTP method to use
 * @param {Array} config.headers - Array of header objects
 * @param {Array} config.params - Array of parameter objects
 * @param {string} config.body - The request body (for POST/PUT/PATCH)
 * @returns {Promise} The response data
 */
export const executeHttpAction = async (config, inputData = null) => {
  const { url, method, headers = [], params = [], body } = config;

  try {
    // Template the URL
    const templatedUrl = templateString(url, inputData);
    if (!templatedUrl) {
      throw new Error('URL is required');
    }

    // Create URL object and template query parameters
    const urlObj = new URL(templatedUrl);
    const templatedParams = templateItems(params, inputData);
    templatedParams.forEach(p => {
      if (p.key && p.value) {
        urlObj.searchParams.append(p.key, p.value);
      }
    });

    // Template headers
    const headerObj = {};
    const templatedHeaders = templateItems(headers, inputData);
    templatedHeaders.forEach(h => {
      if (h.key && h.value) {
        headerObj[h.key] = h.value;
      }
    });

    // Prepare request options
    const requestOptions = {
      method,
      headers: headerObj
    };

    // Handle body based on content type
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      if (body?.file) {
        // Handle file upload
        const formData = new FormData();
        formData.append('file', body.file, body.filename);
        requestOptions.body = formData;
        // Let the browser set the correct Content-Type for FormData
        delete requestOptions.headers['Content-Type'];
      } else if (body) {
        // Handle JSON/text body
        try {
          const templatedBody = templateString(body, inputData);
          requestOptions.body = JSON.stringify(JSON.parse(templatedBody));
          requestOptions.headers['Content-Type'] = 'application/json';
        } catch (error) {
          // If JSON parsing fails, send as plain text
          requestOptions.body = templateString(body, inputData);
          requestOptions.headers['Content-Type'] = 'text/plain';
        }
      } else if (inputData) {
        // Use inputData as body if no body specified
        requestOptions.body = JSON.stringify(inputData);
        requestOptions.headers['Content-Type'] = 'application/json';
      }
    }

    console.log('Making templated request:', {
      url: urlObj.toString(),
      method,
      headers: requestOptions.headers,
      body: requestOptions.body
    });

    const response = await fetch(urlObj.toString(), requestOptions);
    
    // Handle different response types
    let responseData;
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    return {
      success: response.ok,
      response: {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        data: responseData
      },
      error: response.ok ? null : { 
        message: typeof responseData === 'object' ? responseData.message : 'Request failed' 
      }
    };
  } catch (error) {
    console.error('HTTP request failed:', error);
    return {
      success: false,
      response: null,
      error: { message: error.message }
    };
  }
};

/**
 * Validates HTTP request configuration
 * @param {Object} config - The request configuration
 * @returns {Object} Validation result
 */
export const validateHttpConfig = (config) => {
  const errors = [];

  if (!config.url) {
    errors.push('URL is required');
  } else {
    try {
      new URL(config.url);
    } catch (e) {
      errors.push('Invalid URL format');
    }
  }

  if (!config.method) {
    errors.push('Method is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}; 
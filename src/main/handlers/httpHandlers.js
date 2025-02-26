import { responder } from '../utils/helpers';
import fetch from 'node-fetch';

export const httpHandlers = {
  'http:request': async (event,config) => {
    try {
      // Check if config exists
      if (!config) {
        throw new Error('Request configuration is required');
      }

      const { url, method = 'GET', headers = {}, body, params = {} } = config;

      console.log('http:request', config);

      if (!url) {
        throw new Error('URL is required');
      }

      // Add query parameters to URL
      const urlObj = new URL(url);
      Object.entries(params).forEach(([key, value]) => {
        urlObj.searchParams.append(key, value);
      });

      const response = await fetch(urlObj.toString(), {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      // Try to parse response as JSON first, fallback to text if that fails
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json().catch(async () => {
          // If JSON parsing fails, get raw text
          return await response.text();
        });
      } else {
        data = await response.text();
      }
      
      return responder(true, {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        data
      });
    } catch (error) {
      console.error('HTTP request failed:', error);
      return responder(false, null, error.message);
    }
  },

  'http:validate': async (event, { url, method }) => {
    try {
      if (!url) {
        throw new Error('URL is required');
      }

      // Validate URL format
      new URL(url);

      // Validate HTTP method
      const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
      if (method && !validMethods.includes(method.toUpperCase())) {
        throw new Error(`Invalid HTTP method. Must be one of: ${validMethods.join(', ')}`);
      }

      return responder(true);
    } catch (error) {
      console.error('HTTP validation failed:', error);
      return responder(false, null, error.message);
    }
  }
}; 
import { parse } from 'rss-to-json';
import formatter from '../../utils/formatter';
import JQParser from '../../utils/jq';

const jq = new JQParser();

export default class RSSNode {
  constructor(getEnvVar, setEnvironmentVariable, localEnvironment) {
    this.getEnvVar = getEnvVar;
    this.setEnvironmentVariable = setEnvironmentVariable;
    this.localEnvironment = localEnvironment || { variables: {} };
  }

  // Helper function for evaluating templates with environment variables
  evaluateEnvTemplate(template, context) {
    if (!template.includes('{{')) return template;
    
    let result = template;
    const matches = template.match(/\{\{(.+?)\}\}/g);
    if (matches) {
      for (const match of matches) {
        const path = match.slice(2, -2).trim();
        let value;
        
        if (path.startsWith('$')) {
          value = this.getEnvVar(path);
          if (value === undefined || value === null || value === '') {
            const varName = path.startsWith('$') ? path.slice(1) : path;
            throw new Error(`Environment variable "${varName}" is not set. Please configure this variable in your environment settings.`);
          }
        } else {
          value = jq.evaluate(path, context);
        }
        
        result = result.replace(match, value);
      }
    }
    return result;
  }

  async execute(data, inputData, sourceNodes = []) {
    try {
      console.log('RSS executing with data:', data);
      console.log('Input data:', inputData);

      const { url, maxItems = 10, sortBy = 'published', sortDirection = 'desc' } = data;
      
      if (!url) {
        return formatter.errorResponse('RSS Feed URL is required');
      }

      // Build context from source nodes
      const context = sourceNodes?.reduce((acc, source) => ({
        ...acc,
        [source.id]: source.data
      }), {}) || {};

      // Template the URL with better error handling
      let templatedUrl;
      try {
        templatedUrl = this.evaluateEnvTemplate(url, context);
      } catch (error) {
        console.error('URL templating failed:', error);
        return formatter.errorResponse(error.message);
      }

      try {
        // Parse the RSS feed
        const feed = await parse(`https://corsproxy.io/?key=9966be14&url=${encodeURIComponent(templatedUrl)}`);

        // Sort items if needed
        if (feed.items && Array.isArray(feed.items)) {
          feed.items.sort((a, b) => {
            const aValue = a[sortBy];
            const bValue = b[sortBy];
            return sortDirection === 'desc' ? 
              (bValue - aValue) : 
              (aValue - bValue);
          });

          // Limit number of items if specified
          if (maxItems > 0) {
            feed.items = feed.items.slice(0, maxItems);
          }
        }

        console.log('RSS result:', feed);
        return formatter.standardResponse(true, feed);
      } catch (error) {
        console.error('RSS Feed error:', error);
        return formatter.errorResponse(`RSS Feed error: ${error.message}`);
      }
    } catch (error) {
      console.error('RSS execution error:', error);
      return formatter.errorResponse(error.message);
    }
  }
} 
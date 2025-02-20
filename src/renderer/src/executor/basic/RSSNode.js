import Parser from 'rss-parser';
import formatter from '../../utils/formatter';
import JQParser from '../../utils/jq';

const jq = new JQParser();
const parser = new Parser({
  customFields: {
    feed: ['subtitle', 'image'],
    item: ['content', 'content:encoded', 'description']
  }
});

export default class RSSNode {
  constructor(getEnvVar, setEnvironmentVariable, localEnvironment, httpRequest) {
    this.getEnvVar = getEnvVar;
    this.setEnvironmentVariable = setEnvironmentVariable;
    this.localEnvironment = localEnvironment || { variables: {} };
    this.httpRequest = httpRequest;
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
        const response = await this.httpRequest({
          url: templatedUrl,
          method: 'GET',
          headers: {
            'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });

        if (!response.success) {
          throw new Error(response.error?.message || 'Failed to fetch feed');
        }

        const feedContent = response.data.data;
        
        if (typeof feedContent !== 'string') {
          throw new Error('Invalid feed format: Expected XML string');
        }

        // Parse the feed content using rss-parser
        const feed = await parser.parseString(feedContent);
        console.log('Parsed feed:', feed);

        if (!feed) {
          throw new Error('Failed to parse feed content');
        }

        // Normalize the feed structure
        const normalizedFeed = {
          title: feed.title,
          description: feed.description || feed.subtitle,
          link: feed.link,
          image: feed.image?.url || feed.image,
          items: (feed.items || []).map(item => ({
            title: item.title,
            description: item.description || item.content || item['content:encoded'],
            link: item.link,
            published: item.pubDate || item.published || item.date || item.isoDate,
            author: item.creator || item.author || item.dc?.creator,
            id: item.id || item.guid,
            content: item['content:encoded'] || item.content || item.description,
            categories: Array.isArray(item.categories) ? item.categories : 
                       item.category ? [item.category] : []
          }))
        };

        // Sort items
        if (normalizedFeed.items.length > 0) {
          normalizedFeed.items.sort((a, b) => {
            const aDate = new Date(a[sortBy] || 0);
            const bDate = new Date(b[sortBy] || 0);
            return sortDirection === 'desc' ? 
              (bDate - aDate) : 
              (aDate - bDate);
          });

          // Limit items
          if (maxItems > 0) {
            normalizedFeed.items = normalizedFeed.items.slice(0, maxItems);
          }
        }

        return formatter.standardResponse(true, normalizedFeed);
      } catch (error) {
        console.error('Feed error:', error);
        return formatter.errorResponse(`Feed error: ${error.message}`);
      }
    } catch (error) {
      console.error('Execution error:', error);
      return formatter.errorResponse(error.message);
    }
  }

  decodeHtmlEntities(str) {
    if (!str) return '';
    const textarea = document.createElement('textarea');
    textarea.innerHTML = str;
    return textarea.value;
  }
}
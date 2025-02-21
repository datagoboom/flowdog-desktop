import formatter from '../../utils/formatter';
import JQParser from '../../utils/jq';

const jq = new JQParser();

export default class PromptNode {
  constructor(getEnvVar, setEnvVar, localEnvironment, httpRequest) {
    this.getEnvVar = getEnvVar;
    this.setEnvVar = setEnvVar;
    this.localEnvironment = localEnvironment || { variables: {} };
    this.httpRequest = httpRequest;
    this.queryBuilders = {
      anthropic: {
        buildRequest: (prompt, apiKey) => ({
          method: 'POST',
          url: 'https://api.anthropic.com/v1/messages',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
          },
          data: {
            model: 'claude-3-opus-20240229',
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ],
            max_tokens: 4096
          }
        }),
        parseResponse: (response) => {
          console.log("Anthropic Response: ", response);
          if (!response?.data?.data?.content?.[0]?.text) {
            throw new Error('Invalid response format from Anthropic API');
          }
          return response.data.data.content[0].text;
        }
      },
      openai: {
        buildRequest: (prompt, apiKey) => ({
          method: 'POST',
          url: 'https://api.openai.com/v1/chat/completions',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          data: {
            model: 'gpt-4-turbo-preview',
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ],
            max_tokens: 4096
          }
        }),
        parseResponse: (response) => {
          if (!response?.data?.choices?.[0]?.message?.content) {
            throw new Error('Invalid response format from OpenAI API');
          }
          return response.data.choices[0].message.content;
        }
      }
    };
  }

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
          if (value === undefined) {
            console.warn(`Environment variable ${path} not found`);
            value = '';
          }
        } else {
          try {
            // Extract the node ID and path
            const [nodeId, ...pathParts] = path.split('.');
            const nodePath = pathParts.join('.');
            
            // Get the node's data from context
            const nodeData = context[nodeId];
            if (!nodeData) {
              console.warn(`Node data not found for ${nodeId}`);
              value = '';
            } else {
              // Evaluate the path within the node's data
              value = jq.evaluate(nodePath, nodeData);
              
              // Handle objects and arrays
              if (typeof value === 'object') {
                value = JSON.stringify(value, null, 2);
              }
            }
          } catch (error) {
            console.error('Path evaluation failed:', error);
            value = '';
          }
        }
        
        result = result.replace(match, value || '');
      }
    }
    return result;
  }

  async execute(data, inputData = null, sourceNodes = []) {
    console.log('Executing Prompt node with data:', data);
    try {
      const { integration, prompt, apiKey } = data;
      
      // Build context from source nodes
      const context = sourceNodes?.reduce((acc, source) => ({
        ...acc,
        [source.id]: source.data
      }), {}) || {};

      // Add inputData to context if available
      if (inputData) {
        context.input = inputData;
      }

      // Log the context and template
      console.log('Prompt templating context:', {
        context,
        prompt,
        localEnvironment: this.localEnvironment
      });

      if (!integration || !prompt) {
        return formatter.errorResponse('Missing integration or prompt configuration');
      }

      if (!apiKey) {
        return formatter.errorResponse('API key not found');
      }

      // Get the query builder for this integration
      const queryBuilder = this.queryBuilders[integration];
      if (!queryBuilder) {
        return formatter.errorResponse(`Unsupported integration: ${integration}`);
      }

      // Template the prompt
      let templatedPrompt;
      try {
        templatedPrompt = this.evaluateEnvTemplate(prompt, context);
        console.log('Templated prompt:', { 
          original: prompt, 
          templated: templatedPrompt,
          context: Object.keys(context) // Log keys only to avoid sensitive data
        });
      } catch (error) {
        console.error('Prompt templating failed:', error, { prompt, context });
        return formatter.errorResponse(`Prompt templating failed: ${error.message}`);
      }

      // Build and execute the request
      const requestConfig = queryBuilder.buildRequest(templatedPrompt, apiKey);
      const response = await this.httpRequest(requestConfig);
      
      console.log('API Response:', {
        success: response.success,
        status: response.status,
        dataShape: response.data ? Object.keys(response.data) : null
      });

      if (!response.success) {
        throw new Error(response.error?.message || 'Request failed');
      }

      // Parse the response with error handling
      let result;
      try {
        result = queryBuilder.parseResponse(response);
      } catch (error) {
        console.error('Response parsing failed:', error, {
          response: {
            ...response,
            data: response.data ? Object.keys(response.data) : null // Log shape without sensitive data
          }
        });
        return formatter.errorResponse(`Failed to parse API response: ${error.message}`);
      }

      // Try to parse the result as JSON if possible
      try {
        const parsedJson = JSON.parse(result);
        result = parsedJson;
      } catch (error) {
        // If parsing fails, keep the original string
        // This is expected for non-JSON responses
      }

      return formatter.standardResponse(true, {
        data: result,
      });

    } catch (error) {
      console.error('Prompt node execution failed:', error);
      return formatter.errorResponse(error.message);
    }
  }
}
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
          return response.data.choices[0].message.content;
        }
      }
    };
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
          if (value === undefined) {
            console.warn(`Environment variable ${path} not found`);
            value = '';
          }
        } else {
          value = jq.evaluate(path, context);
        }
        
        result = result.replace(match, value);
      }
    }
    return result;
  }

  async execute(data, inputData = null, sourceNodes = []) {
    console.log('Executing Prompt node with data:', data);
    console.log('Executing Prompt node with inputData:', inputData);
    try {
      const { integration, prompt, apiKey } = data;
      
      // Log the environment state at execution time
      console.log('Executing Prompt node with environment:', {
        localEnvironment: this.localEnvironment,
        integration,
        inputData
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

      // Build context from source nodes
      const context = sourceNodes?.reduce((acc, source) => ({
        ...acc,
        [source.id]: source.data
      }), {}) || {};

      // Add inputData to context
      if (inputData) {
        context.input = inputData;
      }

      // Template the prompt
      let templatedPrompt;
      try {
        templatedPrompt = this.evaluateEnvTemplate(prompt, context);
        console.log('Templated prompt:', { 
          original: prompt, 
          templated: templatedPrompt,
          context
        });
      } catch (error) {
        console.error('Prompt templating failed:', error, { prompt, context });
        return formatter.errorResponse(`Prompt templating failed: ${error.message}`);
      }

      // Build and execute the request
      const requestConfig = queryBuilder.buildRequest(templatedPrompt, apiKey);
      console.log('Making request with:', {
        ...requestConfig,
        headers: {
          ...requestConfig.headers,
          'x-api-key': '[REDACTED]',
          'Authorization': '[REDACTED]'
        }
      });

      const response = await this.httpRequest(requestConfig);
      
      if (!response.success) {
        throw new Error(response.error?.message || 'Request failed');
      }

      // Parse the response
      let result = queryBuilder.parseResponse(response);

      // try to parse the result as json
      try {
        result = JSON.parse(result);
      } catch (error) {
        result = result;
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
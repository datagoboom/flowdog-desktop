import formatter from '../../utils/formatter';
import JQParser from '../../utils/jq';

const jq = new JQParser();

export default class PromptNode {
  constructor(getEnvVar, setEnvVar, localEnvironment, httpRequest, updateNodeData, decrypt) {
    this.getEnvVar = getEnvVar;
    this.setEnvVar = setEnvVar;
    this.localEnvironment = localEnvironment || { variables: {} };
    this.httpRequest = httpRequest;
    this.updateNodeData = updateNodeData;
    this.decrypt = decrypt;
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
            max_tokens: 4096,
            messages: [{
              role: 'user',
              content: prompt
            }],
            system: "You are a helpful AI assistant. Provide clear, concise responses."
          }
        }),
        parseResponse: (response) => {
          if (response?.data?.error) {
            throw new Error(response.data.error.message || 'API Error');
          }
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
    try {
      const { prompt, integration, apiKey: encryptedKey } = data;
      
      // Build context from source nodes - use the data directly as it's already properly structured
      const context = sourceNodes?.reduce((acc, source) => ({
        ...acc,
        [source.id]: source.data
      }), {}) || {};

      if (inputData) {
        context.input = inputData;
      }

      console.log('Prompt templating context:', {
        contextKeys: Object.keys(context),
        sourceNodeIds: sourceNodes.map(n => n.id),
        sampleSourceData: sourceNodes[0]?.data,
        sampleContext: context[sourceNodes[0]?.id]
      });

      if (!integration || !prompt || !encryptedKey) {
        return formatter.errorResponse('Missing integration, prompt, or API key configuration');
      }

      // Decrypt the API key
      let decryptedApiKey;
      try {
        console.log('Decrypting API key:', encryptedKey);
        decryptedApiKey = await this.decrypt(encryptedKey);
        console.log('API key decrypted successfully')
        console.log('API key:', decryptedApiKey);
      } catch (error) {
        console.error('Failed to decrypt API key:', error);
        return formatter.errorResponse('Failed to decrypt API key');
      }

      const queryBuilder = this.queryBuilders[integration];
      if (!queryBuilder) {
        return formatter.errorResponse(`Unsupported integration: ${integration}`);
      }

      let templatedPrompt;
      try {
        templatedPrompt = this.evaluateEnvTemplate(prompt, context);
      } catch (error) {
        console.error('Prompt templating failed:', error);
        return formatter.errorResponse(`Prompt templating failed: ${error.message}`);
      }

      console.log('Templated Prompt:', templatedPrompt);
      const requestConfig = queryBuilder.buildRequest(templatedPrompt, decryptedApiKey);
      const response = await this.httpRequest(requestConfig);

      if (!response.success || response.data?.error) {
        throw new Error(response.data?.error?.message || 'Request failed');
      }

      let result;
      try {
        result = queryBuilder.parseResponse(response);
      } catch (error) {
        console.error('Response parsing failed:', error);
        return formatter.errorResponse(`Failed to parse API response: ${error.message}`);
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
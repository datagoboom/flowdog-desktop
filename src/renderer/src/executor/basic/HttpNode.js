import formatter from '../../utils/formatter';
import JQParser from '../../utils/jq';

const jq = new JQParser();

export default class HttpNode {
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
    try {
      const { method = 'GET', url, headers = [], params = [], body, environmentVars = [] } = data;
      
      // Log the environment state at execution time
      console.log('Executing HTTP node with environment:', {
        localEnvironment: this.localEnvironment,
        environmentVars
      });

      if (!url) {
        return formatter.errorResponse('URL is required but was not specified');
      }

      // Build context from source nodes
      const context = sourceNodes?.reduce((acc, source) => ({
        ...acc,
        [source.id]: source.data
      }), {}) || {};

      // Template the URL
      let templatedUrl = url;
      try {
        templatedUrl = this.evaluateEnvTemplate(url, context);
        console.log('Templated URL:', { original: url, templated: templatedUrl });
      } catch (error) {
        console.error('URL templating failed:', error, { url, context });
        return formatter.errorResponse(`URL templating failed: ${error.message}`);
      }

      // Template and convert headers array to object
      const headerObj = headers.reduce((acc, { key, value }) => {
        if (key && value) {
          try {
            const templatedKey = this.evaluateEnvTemplate(key, context);
            const templatedValue = this.evaluateEnvTemplate(value, context);
            acc[templatedKey] = templatedValue;
          } catch (error) {
            console.error('Header templating failed:', error);
            acc[key] = value;
          }
        }
        return acc;
      }, {});

      // Template and convert params array to URLSearchParams
      const templatedParams = params
        .filter(({ key, value }) => key && value)
        .map(({ key, value }) => {
          try {
            const templatedKey = this.evaluateEnvTemplate(key, context);
            const templatedValue = this.evaluateEnvTemplate(value, context);
            return [templatedKey, templatedValue];
          } catch (error) {
            console.error('Param templating failed:', error);
            return [key, value];
          }
        });

      const searchParams = new URLSearchParams(templatedParams);
      const fullUrl = `${templatedUrl}${searchParams.toString() ? '?' + searchParams.toString() : ''}`;

      // Prepare request config for API call
      const requestConfig = {
        method,
        url: fullUrl,
        headers: {
          'Content-Type': 'application/json',
          ...headerObj
        },
      };

      // Only add body for POST, PUT, PATCH
      if (['POST', 'PUT', 'PATCH'].includes(method) && body) {
        try {
          const templatedBody = this.evaluateEnvTemplate(body, context);
          requestConfig.data = templatedBody;
        } catch (error) {
          console.error('Body templating failed:', error);
          requestConfig.data = body;
        }
      }

      console.log('Making request with:', requestConfig);

      // Use the instance's httpRequest method
      const response = await this.httpRequest(requestConfig);
      
      if (!response.success) {
        throw new Error(response.error?.message || 'Request failed');
      }

      const result = {
        status: response.data.status,
        headers: response.data.headers,
        data: response.data.data
      };

      const formattedResult = formatter.standardResponse(true, result);

      // Handle environment variable setting
      if (environmentVars?.length > 0) {
        for (const envVar of environmentVars) {
          const variableName = envVar.variable === 'CREATE_NEW' ? envVar.newVariableName : envVar.variable;
          
          if (variableName && envVar.value) {
            try {
              const envContext = {
                response: result,
                ...context
              };

              const templatedValue = this.evaluateEnvTemplate(envVar.value, envContext);
              console.log('Setting environment variable:', {
                name: variableName,
                value: templatedValue,
                template: envVar.value,
                context: envContext
              });
              
              // Update both global and local environment
              if (this.setEnvironmentVariable) {
                this.setEnvironmentVariable(variableName, templatedValue);
                
                // Update local environment immediately
                if (!this.localEnvironment.variables) {
                  this.localEnvironment.variables = {};
                }
                this.localEnvironment.variables[variableName] = templatedValue;
              }
            } catch (error) {
              console.error('Environment variable setting failed:', error, {
                variable: envVar,
                context: context
              });
            }
          }
        }
      }

      return formattedResult;

    } catch (error) {
      console.error('HTTP node execution failed:', error);
      return formatter.errorResponse(error.message);
    }
  }
}
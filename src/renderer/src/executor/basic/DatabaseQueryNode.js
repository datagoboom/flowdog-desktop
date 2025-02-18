import formatter from '../../utils/formatter';
import JQParser from '../../utils/jq';

const jq = new JQParser();

export default class DatabaseQueryNode {
  constructor(getEnvVar, setEnvironmentVariable, localEnvironment) {
    this.getEnvVar = getEnvVar;
    this.setEnvironmentVariable = setEnvironmentVariable;
    this.localEnvironment = localEnvironment || { variables: {} };
  }

  async execute(data, inputData) {
    try {
      console.log('DatabaseQueryNode executing with data:', {
        ...data,
        password: data.password ? '[REDACTED]' : undefined
      });

      const { connectionId, query = '', parameters = [] } = data;
      
      if (!connectionId) {
        return formatter.errorResponse('No database connection selected');
      }

      if (!query || !query.trim()) {
        console.log('Query is empty or undefined:', { query, dataType: typeof query });
        return formatter.errorResponse('Query cannot be empty');
      }

      // Process any template variables in the query
      let processedQuery = query;
      let processedParams = [];

      try {
        // Replace {{variable}} templates in query
        // Replace {{variable}} templates in query
        processedQuery = query.replace(/\{\{(.*?)\}\}/g, (match, path) => {
          try {
            const value = jq.evaluate(path.trim(), inputData);
            // Handle different value types
            if (value === null || value === undefined) {
              return 'NULL';
            }
            if (typeof value === 'number') {
              return value;
            }
            if (typeof value === 'boolean') {
              return value ? 1 : 0;
            }
            if (Array.isArray(value) || typeof value === 'object') {
              return `'${JSON.stringify(value)}'`; // Single quotes for JSON
            }
            // Escape single quotes and wrap in single quotes
            return `'${value.toString().replace(/'/g, "''")}'`; // Use single quotes, escape internal single quotes
          } catch (error) {
            throw new Error(`Failed to process template ${match}: ${error.message}`);
          }
        });

        // Process parameter values
        parameters.forEach(param => {
          if (!param.value) {
            throw new Error(`Parameter "${param.name}" has no value`);
          }
          const value = jq.evaluate(param.value, inputData);
          processedParams.push(value);
        });

        console.log('Executing query:', {
          connectionId,
          processedQuery,
          processedParams,
          originalQuery: query
        });

      } catch (error) {
        return formatter.errorResponse(`Query template processing failed: ${error.message}`);
      }

      try {
        // Execute query through IPC
        const result = await window.api.invoke('nodes.database.query', {
          connectionId,
          query: processedQuery,
          parameters: processedParams
        });

        if (!result.success) {
          throw new Error(result.error);
        }

        return formatter.standardResponse(true, {
          success: true,
          rowCount: result.data.rowCount,
          rows: result.data.rows,
          fields: result.data.fields
        });
      } catch (error) {
        return formatter.errorResponse(`Database query failed: ${error.message}`);
      }
    } catch (error) {
      return formatter.errorResponse(error.message);
    }
  }
} 
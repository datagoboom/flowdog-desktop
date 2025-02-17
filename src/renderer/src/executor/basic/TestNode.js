import formatter from '../../utils/formatter';
import JQParser from '../../utils/jq';

const jq = new JQParser();

export default class TestNode {
  async execute(data, inputData, sourceNodes = []) {
    try {
      const { tests = [], requireAll = true, continueOnFailure = false } = data;
      
      // Build context mapping for source nodes
      const context = sourceNodes?.reduce((acc, source) => ({
        ...acc,
        [source.id]: source.data
      }), {}) || {};

      if (!tests.length) {
        return formatter.standardResponse(true, {
          success: true,
          message: 'No tests configured',
          results: []
        });
      }
  
      // Execute each test case
      const results = [];
      let allPassed = true;
  
      for (const test of tests) {
        try {
          const result = await this.executeTestCase(test, context);
          results.push(result);
          
          if (!result.success) {
            allPassed = false;
            if (!continueOnFailure && test.stopOnFailure) {
              break;
            }
          }
        } catch (error) {
          const errorResult = {
            id: test.id,
            name: test.name,
            success: false,
            error: error.message
          };
          results.push(errorResult);
          allPassed = false;
          
          if (!continueOnFailure && test.stopOnFailure) {
            break;
          }
        }
      }
  
      // Determine overall success based on requireAll setting
      const success = requireAll ? allPassed : results.some(r => r.success);
  
      return formatter.standardResponse(true, {
        success,
        message: success ? 'All tests passed' : 'Some tests failed',
        results,
        timestamp: new Date().toISOString(),
        data: context
      });
  
    } catch (error) {
      return formatter.errorResponse(error.message);
    }
  }

  async executeTestCase(test, context) {
    try {
      const { type, operator, expected, path, header, sourceNodeId, id, name } = test;
      let actual;
      
      // Get the source node's data
      const sourceData = context[sourceNodeId];
      if (!sourceData) {
        return {
          id,
          name,
          success: false,
          error: `Source node ${sourceNodeId} not found in context`
        };
      }
    
      // Get actual value based on test type
      try {
        switch (type) {
          case 'status':
            actual = sourceData?.response?.status;
            break;
            
          case 'headers':
            const headers = sourceData?.response?.headers || {};
            const headerKey = Object.keys(headers)
              .find(key => key.toLowerCase() === header?.toLowerCase());
            actual = headers[headerKey];
            break;
            
          case 'body':
            actual = jq.evaluate(path, sourceData);
            break;
            
          default:
            throw new Error(`Unsupported test type: ${type}`);
        }
      } catch (error) {
        return {
          id,
          name,
          success: false,
          error: `Failed to get test value: ${error.message}`
        };
      }
    
      // Compare values based on operator
      let success = false;
      let message = '';
    
      try {
        switch (operator) {
          case 'equals':
            success = String(actual) === String(expected);
            message = success ? 'Values match' : 'Values do not match';
            break;
            
          case 'not_equals':
            success = String(actual) !== String(expected);
            message = success ? 'Values differ as expected' : 'Values match when they should differ';
            break;
            
          case 'contains':
            success = String(actual).includes(String(expected));
            message = success ? 'Value contains expected string' : 'Value does not contain expected string';
            break;
            
          case 'not_contains':
            success = !String(actual).includes(String(expected));
            message = success ? 'Value does not contain string as expected' : 'Value contains string when it should not';
            break;
            
          case 'greater_than':
            success = Number(actual) > Number(expected);
            message = success ? 'Value is greater' : 'Value is not greater';
            break;
            
          case 'less_than':
            success = Number(actual) < Number(expected);
            message = success ? 'Value is less' : 'Value is not less';
            break;
            
          case 'exists':
            success = actual !== undefined && actual !== null;
            message = success ? 'Value exists' : 'Value does not exist';
            break;
            
          case 'not_exists':
            success = actual === undefined || actual === null;
            message = success ? 'Value does not exist as expected' : 'Value exists when it should not';
            break;
            
          default:
            throw new Error(`Unsupported operator: ${operator}`);
        }
      } catch (error) {
        return {
          id,
          name,
          success: false,
          error: `Comparison failed: ${error.message}`
        };
      }
    
      return {
        id,
        name,
        type,
        success,
        message,
        expected,
        actual,
        operator
      };
    } catch (error) {
      return {
        id: test.id,
        name: test.name,
        success: false,
        error: error.message
      };
    }
  }
} 
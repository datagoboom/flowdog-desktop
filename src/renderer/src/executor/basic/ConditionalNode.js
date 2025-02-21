import formatter from '../../utils/formatter';
import JQParser from '../../utils/jq';

const jq = new JQParser();

// Define supported operators and their validation rules
const OPERATORS = {
  '===': { label: 'equals (strict)', requiresValue: true },
  '==': { label: 'equals', requiresValue: true },
  '!==': { label: 'not equals (strict)', requiresValue: true },
  '!=': { label: 'not equals', requiresValue: true },
  '>': { label: 'greater than', requiresValue: true, numeric: true },
  '>=': { label: 'greater than or equal', requiresValue: true, numeric: true },
  '<': { label: 'less than', requiresValue: true, numeric: true },
  '<=': { label: 'less than or equal', requiresValue: true, numeric: true },
  'contains': { label: 'contains', requiresValue: true, string: true },
  '!contains': { label: 'does not contain', requiresValue: true, string: true },
  'startsWith': { label: 'starts with', requiresValue: true, string: true },
  'endsWith': { label: 'ends with', requiresValue: true, string: true },
  'matches': { label: 'matches regex', requiresValue: true, string: true },
  'isNull': { label: 'is null', requiresValue: false },
  'notNull': { label: 'is not null', requiresValue: false },
  'isEmpty': { label: 'is empty', requiresValue: false },
  'notEmpty': { label: 'is not empty', requiresValue: false }
};

export default class ConditionalNode {
  constructor(getEnvVar, setEnvironmentVariable, localEnvironment) {
    this.getEnvVar = getEnvVar;
    this.setEnvironmentVariable = setEnvironmentVariable;
    this.localEnvironment = localEnvironment;
    this.evaluationCache = new Map();
  }

  resetCache() {
    this.evaluationCache.clear();
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
          value = jq.evaluate(path, context);
        }
        
        result = result.replace(match, value);
      }
    }
    return result;
  }

  validateCondition(condition) {
    const { field, operator, value } = condition;
    
    if (!field) {
      throw new Error('Field is required for condition');
    }
    if (!operator) {
      throw new Error('Operator is required for condition');
    }
    if (!OPERATORS[operator]) {
      throw new Error(`Unsupported operator: ${operator}`);
    }
    
    const operatorRules = OPERATORS[operator];
    if (operatorRules.requiresValue && value === undefined) {
      throw new Error(`Value is required for operator: ${operator}`);
    }
  }

  evaluateExpression(expression, context) {
    if (!expression) return null;
    
    const cacheKey = `${expression}-${JSON.stringify(context)}`;
    if (this.evaluationCache.has(cacheKey)) {
      return this.evaluationCache.get(cacheKey);
    }

    try {
      const result = this.evaluateEnvTemplate(expression, context);
      this.evaluationCache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.warn(`Expression evaluation failed: ${error.message}`);
      return expression;
    }
  }

  compareValues(field, operator, value) {
    // Handle null/undefined cases
    if (field === null || field === undefined) {
      switch (operator) {
        case 'isNull': return true;
        case 'notNull': return false;
        case '==': return value === null;
        case '===': return value === null;
        default: return false;
      }
    }

    // Handle empty checks
    if (operator === 'isEmpty') {
      return field === '' || 
             field === null || 
             field === undefined ||
             (Array.isArray(field) && field.length === 0) ||
             (typeof field === 'object' && Object.keys(field).length === 0);
    }
    if (operator === 'notEmpty') {
      return !this.compareValues(field, 'isEmpty', null);
    }

    // Handle numeric comparisons
    if (OPERATORS[operator]?.numeric) {
      const numField = Number(field);
      const numValue = Number(value);
      if (isNaN(numField) || isNaN(numValue)) {
        throw new Error('Numeric comparison requires valid numbers');
      }
      switch (operator) {
        case '>': return numField > numValue;
        case '>=': return numField >= numValue;
        case '<': return numField < numValue;
        case '<=': return numField <= numValue;
        default: return false;
      }
    }

    // Handle string operations
    if (OPERATORS[operator]?.string) {
      const strField = String(field);
      const strValue = String(value);
      switch (operator) {
        case 'contains': return strField.includes(strValue);
        case '!contains': return !strField.includes(strValue);
        case 'startsWith': return strField.startsWith(strValue);
        case 'endsWith': return strField.endsWith(strValue);
        case 'matches': 
          try {
            return new RegExp(strValue).test(strField);
          } catch (e) {
            throw new Error(`Invalid regex pattern: ${e.message}`);
          }
        default: return false;
      }
    }

    // Handle equality
    switch (operator) {
      case '===': return field === value;
      case '==': return field == value;
      case '!==': return field !== value;
      case '!=': return field != value;
      default: return false;
    }
  }

  async execute(data, inputData, sourceNodes) {
    try {
      const { conditions = [], ignoreEmptyInput = true } = data;
      this.resetCache();

      // If ignoreEmptyInput is true and inputData is empty/null, skip evaluation
      if (ignoreEmptyInput && (!inputData || Object.keys(inputData).length === 0)) {
        console.log('Skipping conditional evaluation - empty input data');
        return formatter.standardResponse(true, {
          success: true,
          outputPath: 'output-false',
          data: inputData,
          evaluation: {
            result: false,
            skipped: true,
            reason: 'empty_input'
          }
        });
      }

      // Build context from source nodes
      const context = sourceNodes?.reduce((acc, source) => ({
        ...acc,
        [source.id]: source.data
      }), {}) || {};

      // Log the evaluation context
      console.log('Executing Conditional node with context:', {
        conditions,
        context,
        localEnvironment: this.localEnvironment,
        ignoreEmptyInput
      });

      if (!conditions.length) {
        return formatter.standardResponse(true, {
          success: true,
          outputPath: 'output-false',
          data: inputData
        });
      }

      for (const condition of conditions) {
        try {
          this.validateCondition(condition);
          
          const evaluatedField = this.evaluateExpression(condition.field, context);
          const evaluatedValue = condition.value ? 
            this.evaluateExpression(condition.value, context) : 
            null;
          

          const result = this.compareValues(
            evaluatedField, 
            condition.operator, 
            evaluatedValue
          );
          
          if (result) {
            return formatter.standardResponse(true, {
              success: true,
              outputPath: 'output-true',
              data: inputData,
              evaluation: {
                field: condition.field,
                operator: condition.operator,
                value: condition.value,
                evaluatedField,
                evaluatedValue,
                result: true
              }
            });
          }
        } catch (error) {
          console.error('Condition evaluation failed:', error, {
            condition,
            context
          });
        }
      }

      return formatter.standardResponse(true, {
        success: true,
        outputPath: 'output-false',
        data: inputData,
        evaluation: {
          result: false,
          evaluatedConditions: conditions.length
        }
      });

    } catch (error) {
      console.error('Conditional node execution failed:', error);
      return formatter.errorResponse(error.message);
    }
  }
}
import formatter from '../../utils/formatter';
import JQParser from '../../utils/jq';

const jq = new JQParser();

export default class ConditionalNode {
  async execute(data, inputData, sourceNodes) {
    try {
      const { conditions = [] } = data;

      const context = sourceNodes?.reduce((acc, source) => ({
        ...acc,
        [source.id]: source.data
      }), {}) || {};
      
      if (!conditions.length) {
        console.warn('Conditional node has no conditions configured');
        return {
          success: true,
          outputPath: 'else'  // Default to else path if no conditions
        };
      }

      console.log('conditions', conditions);

      // Evaluate each condition in order
      for (let i = 0; i < conditions.length; i++) {
        const condition = conditions[i];
        let { field, operator, value } = condition;
        // try evaluating field and value as jq expressions, if failing, use the raw values
        try {
          field = jq.evaluate(field, context);
          value = jq.evaluate(value, context);
        } catch (e) {
          field = field;
          value = value;
        }

        console.log('parsed field, value', [field, value]);

        let conditionMet = false;

        switch (operator) {
          case '==':
            conditionMet = Number(field) == Number(value);  // Use loose equality for type coercion
            break;
          case '>=':
            conditionMet = Number(field) >= Number(value);
            break;
          case '<=':
            conditionMet = Number(field) <= Number(value);
            break;
          case 'contains':
            conditionMet = String(field).includes(String(value));
            break;
          default:
            throw new Error(`Unsupported operator: ${operator}`);
        }

        if (conditionMet) {
          return formatter.standardResponse(true, {
            success: true,
            outputPath: `output-${i + 1}`,
            data: inputData
          });
        }
      }

      // If no conditions matched, return else path
      return {
        success: true,
        outputPath: 'output-else'
      };

    } catch (error) {
      console.error('Conditional node execution failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
} 
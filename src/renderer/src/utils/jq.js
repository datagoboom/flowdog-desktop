class JQParser {
  evaluate(path, data) {
    if (!path || !data) {
      throw new Error('Path and data are required');
    }

    // Handle empty path
    if (path.trim() === '') {
      return data;
    }

    // Split path into segments
    const segments = this.tokenizePath(path);
    let result = data;

    try {
      // Process each path segment
      for (const segment of segments) {
        result = this.evaluateSegment(segment, result);
      }

      return result;
    } catch (error) {
      throw new Error(`Error evaluating path '${path}': ${error.message}`);
    }
  }

  tokenizePath(path) {
    // Split on dots while preserving array operations
    const tokens = [];
    let currentToken = '';
    let inBrackets = 0;

    for (let i = 0; i < path.length; i++) {
      const char = path[i];
      
      if (char === '[') {
        inBrackets++;
      } else if (char === ']') {
        inBrackets--;
      }

      if (char === '.' && inBrackets === 0) {
        if (currentToken) {
          tokens.push(currentToken);
          currentToken = '';
        }
      } else {
        currentToken += char;
      }
    }

    if (currentToken) {
      tokens.push(currentToken);
    }

    return tokens;
  }

  evaluateSegment(segment, data) {
    // Handle array operations (e.g., data[].id)
    if (segment.endsWith('[]')) {
      const arrayProp = segment.slice(0, -2);
      if (!data || !(arrayProp in data)) {
        throw new Error(`Property '${arrayProp}' not found`);
      }
      if (!Array.isArray(data[arrayProp])) {
        throw new Error(`Expected array at '${arrayProp}'`);
      }
      return data[arrayProp];
    }

    // Handle array mapping (e.g., id after data[])
    if (Array.isArray(data)) {
      return data.map(item => {
        if (!(segment in item)) {
          throw new Error(`Property '${segment}' not found in array item`);
        }
        return item[segment];
      });
    }

    // Handle array index access (e.g., data[0])
    if (segment.includes('[') && segment.includes(']')) {
      const [prop, indexExpr] = segment.split('[');
      const index = parseInt(indexExpr.replace(']', ''), 10);

      if (!data || !(prop in data)) {
        throw new Error(`Property '${prop}' not found`);
      }

      if (!Array.isArray(data[prop])) {
        throw new Error(`Expected array at '${prop}'`);
      }

      if (isNaN(index) || index < 0 || index >= data[prop].length) {
        throw new Error(`Invalid array index: ${indexExpr}`);
      }

      return data[prop][index];
    }

    // Handle regular object property access
    if (!data || typeof data !== 'object') {
      throw new Error(`Cannot access property '${segment}' of ${data}`);
    }

    if (!(segment in data)) {
      throw new Error(`Property '${segment}' not found`);
    }

    return data[segment];
  }
}

export default JQParser;
/**
 * A utility for safe regex operations
 */

// Maximum time (in milliseconds) to allow a regex operation to run
const REGEX_TIMEOUT = 1000;

// Maximum input length to prevent catastrophic backtracking
const MAX_INPUT_LENGTH = 1000000; // 1MB

// Maximum pattern length
const MAX_PATTERN_LENGTH = 1000;

/**
 * Predefined safe patterns for common use cases
 */
export const PATTERNS = {
  // Text extraction
  WORDS: '\\w+',
  SENTENCES: '[^.!?]+[.!?]',
  PARAGRAPHS: '\\n\\s*\\n',
  
  // Data formats
  EMAIL: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
  URL: 'https?://[\\w\\d.-]+\\.[a-zA-Z]{2,}(?:/[\\w\\d./-]*)*',
  IP_ADDRESS: '\\b\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\b',
  DATE_ISO: '\\d{4}-\\d{2}-\\d{2}',
  TIME_24H: '(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d',
  
  // Common formats
  PHONE_BASIC: '\\+?\\d{10,}',
  ZIPCODE_US: '\\d{5}(?:-\\d{4})?',
  
  // Programming
  JSON_PROPS: '"([^"]+)":',
  HTML_TAGS: '<([^>]+)>',
  COMMENTS_LINE: '\\/\\/.*$',
  COMMENTS_BLOCK: '\\/\\*[\\s\\S]*?\\*\\/',
};

/**
 * Error class for regex timeouts
 */
class RegexTimeoutError extends Error {
  constructor(message = 'Regex evaluation timed out') {
    super(message);
    this.name = 'RegexTimeoutError';
  }
}

/**
 * Validates a regex pattern for safety
 */
function validatePattern(pattern) {
  if (!pattern) {
    throw new Error('Regex pattern is required');
  }
  
  if (pattern.length > MAX_PATTERN_LENGTH) {
    throw new Error(`Pattern exceeds maximum length of ${MAX_PATTERN_LENGTH} characters`);
  }
}

/**
 * Validates input text length
 */
function validateInput(input) {
  if (input.length > MAX_INPUT_LENGTH) {
    throw new Error(`Input exceeds maximum length of ${MAX_INPUT_LENGTH} characters`);
  }
}

/**
 * Executes a regex operation with a timeout
 */
function withTimeout(operation) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new RegexTimeoutError());
    }, REGEX_TIMEOUT);

    try {
      const result = operation();
      clearTimeout(timeoutId);
      resolve(result);
    } catch (error) {
      clearTimeout(timeoutId);
      reject(error);
    }
  });
}

/**
 * Safely executes a regex match operation
 * @param {string} pattern - The regex pattern
 * @param {string} input - The input text
 * @param {string} flags - Regex flags (default: 'g')
 * @returns {Promise<Object>} Match results
 */
export async function analyze(pattern, input, flags = 'g') {
  validatePattern(pattern);
  validateInput(input);
  
  return withTimeout(() => {
    try {
      const regex = new RegExp(pattern, flags);
      const matches = [];
      let match;

      while ((match = regex.exec(input)) !== null) {
        matches.push(match[0]);  // Just store the matched text
        
        // Prevent infinite loops
        if (match.index === regex.lastIndex) {
          regex.lastIndex++;
        }
      }

      return {
        success: true,
        matches
      };
    } catch (error) {
      return {
        success: false,
        matches: []
      };
    }
  });
}

export const regex = {
  PATTERNS,
  analyze
};

export default regex; 
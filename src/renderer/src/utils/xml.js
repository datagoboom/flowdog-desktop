import {convertXML} from 'simple-xml-to-json';
/**
 * Parse XML string into a DOM Document
 * @param {string} xmlString - The XML string to parse
 * @returns {Document} The parsed XML document
 */
export function parseXML(xmlString) {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "text/xml");
    
    // Check for parsing errors
    const parseError = xmlDoc.querySelector('parsererror');
    if (parseError) {
      throw new Error(parseError.textContent);
    }
    
    return xmlDoc;
  } catch (error) {
    console.log('XML parsing error:', xmlString);
    throw new Error(`XML parsing error: ${error.message}`);
  }
}

/**
 * Evaluate an XPath expression against an XML document
 * @param {string} xpath - The XPath expression
 * @param {Document|Node} xmlNode - The XML document or node to query
 * @param {string} returnType - The type of result to return ('string', 'number', 'boolean', 'nodes')
 * @returns {string|number|boolean|Node[]} The query result
 */
export function evaluateXPath(xpath, xmlNode, returnType = 'nodes') {
  try {
    const resolver = xmlNode.createNSResolver(xmlNode.documentElement);
    let result;

    switch (returnType) {
      case 'string':
        result = xmlNode.evaluate(
          xpath,
          xmlNode,
          resolver,
          XPathResult.STRING_TYPE,
          null
        );
        return result.stringValue;

      case 'number':
        result = xmlNode.evaluate(
          xpath,
          xmlNode,
          resolver,
          XPathResult.NUMBER_TYPE,
          null
        );
        return result.numberValue;

      case 'boolean':
        result = xmlNode.evaluate(
          xpath,
          xmlNode,
          resolver,
          XPathResult.BOOLEAN_TYPE,
          null
        );
        return result.booleanValue;

      case 'nodes':
        result = xmlNode.evaluate(
          xpath,
          xmlNode,
          resolver,
          XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
          null
        );
        const nodes = [];
        for (let i = 0; i < result.snapshotLength; i++) {
          nodes.push(result.snapshotItem(i));
        }
        return nodes;

      default:
        throw new Error(`Unsupported return type: ${returnType}`);
    }
  } catch (error) {
    throw new Error(`XPath evaluation error: ${error.message}`);
  }
}

/**
 * Convert XML nodes to a JavaScript object/array
 * @param {Node|Node[]} nodes - The XML node(s) to convert
 * @returns {object|array} The converted JavaScript object/array
 */
export function xmlNodesToObject(nodes) {
  if (Array.isArray(nodes)) {
    return nodes.map(node => nodeToObject(node));
  }
  return nodeToObject(nodes);
}

/**
 * Convert a single XML node to a JavaScript object
 * @param {Node} node - The XML node to convert
 * @returns {object|string} The converted JavaScript object or string
 */
function nodeToObject(node) {
  // Handle text nodes
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent.trim();
    return text || undefined;
  }

  // Handle element nodes
  if (node.nodeType === Node.ELEMENT_NODE) {
    const obj = {};
    
    // Add attributes if present
    if (node.attributes.length > 0) {
      obj['@attributes'] = {};
      for (const attr of node.attributes) {
        obj['@attributes'][attr.name] = attr.value;
      }
    }

    // Process child nodes
    for (const child of node.childNodes) {
      const childResult = nodeToObject(child);
      if (childResult !== undefined) {
        const name = child.nodeName;
        if (name === '#text') {
          // If it's just text content, assign it directly
          if (Object.keys(obj).length === 0) {
            return childResult;
          }
          obj['#text'] = childResult;
        } else {
          // Handle multiple children with same name
          if (obj[name]) {
            if (!Array.isArray(obj[name])) {
              obj[name] = [obj[name]];
            }
            obj[name].push(childResult);
          } else {
            obj[name] = childResult;
          }
        }
      }
    }

    return obj;
  }

  return undefined;
}

export function to_json(xmlString) {
  return convertXML(xmlString);
}

function simplifyXmlStructure(obj) {
  console.log('simplifyXmlStructure - obj:', obj);
  // Handle arrays of children
  if (obj && obj.children && Array.isArray(obj.children)) {
    // Convert children array to object
    const result = obj.children.reduce((acc, child) => {
      const key = Object.keys(child)[0];
      
      // If the child has its own children, recursively process them
      if (child[key].children) {
        const processedChild = simplifyXmlStructure(child[key]);
        
        // If we already have this key, make it an array
        if (acc[key]) {
          if (!Array.isArray(acc[key])) {
            acc[key] = [acc[key]];
          }
          acc[key].push(processedChild);
        } else {
          acc[key] = processedChild;
        }
      } else if (child[key].content) {
        // If it's a leaf node with content, just get the content
        acc[key] = child[key].content;
      }
      
      return acc;
    }, {});

    return result;
  }

  // If it's an object but not a children array
  if (obj && typeof obj === 'object') {
    // If it has content, return the content
    if ('content' in obj) {
      return obj.content;
    }

    // Otherwise process each property
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = simplifyXmlStructure(value);
    }
    return result;
  }

  return obj;
}

// Update the toObject function to use the new simplifier
function toObject(xmlDoc) {
  // Your existing XML to initial object conversion
  const rawObj = xmlNodesToObject(xmlDoc.documentElement.childNodes);
  
  // Simplify the structure
  const simplified = simplifyXmlStructure(rawObj);
  
  // If posts is not an array but should be, wrap it
  if (simplified.posts && simplified.posts.post && !Array.isArray(simplified.posts)) {
    simplified.posts = [simplified.posts];
  }
  
  return simplified;
}

export const xml = {
  parse: parseXML,
  evaluate: evaluateXPath,
  toObject: toObject,
  to_json: to_json
};

export default xml; 
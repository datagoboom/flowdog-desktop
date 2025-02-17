const generatePathSuggestions = (data) => {
  const paths = [];
  
  const traverse = (obj, path = '') => {
    if (!obj || typeof obj !== 'object') return;
    
    Object.entries(obj).forEach(([key, value]) => {
      const currentPath = path ? `${path}.${key}` : key;
      paths.push(currentPath);
      
      // Handle arrays
      if (Array.isArray(value)) {
        // Add array notation
        paths.push(`${currentPath}[]`);
        
        // Sample first item for array structure
        if (value.length > 0 && typeof value[0] === 'object') {
          traverse(value[0], `${currentPath}[]`);
        }
        
        // Add direct index access for small arrays
        if (value.length <= 5) {
          value.forEach((_, index) => {
            paths.push(`${currentPath}[${index}]`);
          });
        }
      }
      // Recurse into nested objects
      else if (value && typeof value === 'object') {
        traverse(value, currentPath);
      }
    });
  };
  
  traverse(data);
  return paths;
};

export default generatePathSuggestions; 
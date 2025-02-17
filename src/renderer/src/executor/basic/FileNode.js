import formatter from '../../utils/formatter';

export default class FileNode {
  async execute(data, inputData) {
    try {
      const { operation, fileName, content } = data;

      switch (operation) {
        case 'read':
          return {
            success: true,
            operation: 'read',
            fileName,
            content,
            timestamp: new Date().toISOString()
          };

        case 'write':
          // Create a blob from the input data
          let contentToWrite = inputData;
          
          // Convert to string if it's an object
          if (typeof inputData === 'object') {
            contentToWrite = JSON.stringify(inputData, null, 2);
          }

          const blob = new Blob([contentToWrite], { type: 'text/plain' });
          const url = window.URL.createObjectURL(blob);
          
          // Create a temporary link and trigger download
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName || 'output.txt';
          document.body.appendChild(link);
          link.click();
          
          // Cleanup
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);

          return {
            success: true,
            operation: 'write',
            fileName,
            timestamp: new Date().toISOString()
          };

        default:
          throw new Error(`Unsupported file operation: ${operation}`);
      }
    } catch (error) {
      return formatter.errorResponse(`File operation failed: ${error.message}`);
    }
  }
} 
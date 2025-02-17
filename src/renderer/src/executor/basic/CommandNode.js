import formatter from '../../utils/formatter';
import JQParser from '../../utils/jq';

const jq = new JQParser();

export default class CommandNode {
  constructor(getEnvVar, setEnvironmentVariable, localEnvironment) {
    this.getEnvVar = getEnvVar;
    this.setEnvironmentVariable = setEnvironmentVariable;
    this.localEnvironment = localEnvironment || { variables: {} };
  }

  evaluateTemplate(template, context) {
    if (!template || !template.includes('{{')) return template;
    
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
        
        result = result.replace(match, String(value));
      }
    }
    return result;
  }

  async execute(data, inputData = null, sourceNodes = []) {
    try {
      const { 
        command = '', 
        workingDirectory,
        timeout = 30000,
        environmentVars = []
      } = data;

      // Evaluate command template
      const evaluatedCommand = this.evaluateTemplate(command, inputData);
      
      // Execute command through IPC
      const result = await window.api.executeCommand(evaluatedCommand, {
        workingDirectory,
        timeout,
        environmentVars
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      return formatter.standardResponse(true, result.data);
      
    } catch (error) {
      return formatter.errorResponse(error.message);
    }
  }
}
import HttpNodeConfig from './HttpNodeConfig';
import FormatNodeConfig from './FormatNodeConfig';
import FileOpNodeConfig from './FileOpNodeConfig';
import ParserNodeConfig from './ParserNodeConfig';
import ConditionalNodeConfig from './ConditionalNodeConfig';
import PromptNodeConfig from './PromptNodeConfig';
import DatabaseNodeConfig from './DatabaseNodeConfig';

export const NODE_CONFIGS = {
  http: HttpNodeConfig,
  format: FormatNodeConfig,
  fileop: FileOpNodeConfig,
  parser: ParserNodeConfig,
  conditional: ConditionalNodeConfig,
  prompt: PromptNodeConfig,
  database: DatabaseNodeConfig,
};

export const getNodeConfig = (type) => {
  return NODE_CONFIGS[type] || null;
}; 
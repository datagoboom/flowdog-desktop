import HttpNodeConfig from './HttpNodeConfig';
import FormatNodeConfig from './FormatNodeConfig';
import FileOpNodeConfig from './FileOpNodeConfig';
import ParserNodeConfig from './ParserNodeConfig';
import ConditionalNodeConfig from './ConditionalNodeConfig';

export const nodeConfigs = {
  http: HttpNodeConfig,
  format: FormatNodeConfig,
  fileop: FileOpNodeConfig,
  parser: ParserNodeConfig,
  conditional: ConditionalNodeConfig,
}; 
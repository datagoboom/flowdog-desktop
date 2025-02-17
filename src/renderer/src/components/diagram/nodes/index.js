import PromptNode from './PromptNode';
import ParserNode from './ParserNode';
import ConditionalNode from './ConditionalNode';
import FileOpNode from './FileOpNode';
import HTTPNode from './HTTPNode';
import FormatNode from './FormatNode';
import LoggerNode from './LoggerNode';

export const nodeTypes = {
  prompt: PromptNode,
  parser: ParserNode,
  conditional: ConditionalNode,
  fileop: FileOpNode,
  http: HTTPNode,
  format: FormatNode,
  logger: LoggerNode,
};

export {
  PromptNode,
  ParserNode,
  ConditionalNode,
  FileOpNode,
  HTTPNode,
  FormatNode,
}; 
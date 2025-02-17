import { 
  ArrowUpDown, 
  Code, 
  FileCog, 
  FileJson, 
  GitBranch, 
  RefreshCw, 
  MessageSquare, 
  TestTube,
  Database,
  Terminal,
  Rss
} from 'lucide-react';

// First import all node configs
import HTTPNodeConfig from '../components/diagram/utility/nodeConfigs/HTTPNodeConfig';
import FormatNodeConfig from '../components/diagram/utility/nodeConfigs/FormatNodeConfig';
import FileOpNodeConfig from '../components/diagram/utility/nodeConfigs/FileOpNodeConfig';
import ParserNodeConfig from '../components/diagram/utility/nodeConfigs/ParserNodeConfig';
import ConditionalNodeConfig from '../components/diagram/utility/nodeConfigs/ConditionalNodeConfig';
import IteratorNodeConfig from '../components/diagram/utility/nodeConfigs/IteratorNodeConfig';
import TestNodeConfig from '../components/diagram/utility/nodeConfigs/TestNodeConfig';
import DatabaseQueryNodeConfig from '../components/diagram/utility/nodeConfigs/DatabaseQueryNodeConfig';
import CommandNodeConfig from '../components/diagram/utility/nodeConfigs/CommandNodeConfig';
// Then import all node components
import HTTPNode from '../components/diagram/nodes/HTTPNode';
import FormatNode from '../components/diagram/nodes/FormatNode';
import FileOpNode from '../components/diagram/nodes/FileOpNode';
import ParserNode from '../components/diagram/nodes/ParserNode';
import ConditionalNode from '../components/diagram/nodes/ConditionalNode';
import IteratorNode from '../components/diagram/nodes/IteratorNode';
import PromptNode from '../components/diagram/nodes/PromptNode';
import LoggerNode from '../components/diagram/nodes/LoggerNode';
import TestNode from '../components/diagram/nodes/TestNode';
import DatabaseQueryNode from '../components/diagram/nodes/DatabaseQueryNode';
import CommandNode from '../components/diagram/nodes/CommandNode';
import RSSNode from '../components/diagram/nodes/RSSNode';
import RSSNodeConfig from '../components/diagram/utility/nodeConfigs/RSSNodeConfig';

export const NODE_CATEGORIES = {
  input: {
    label: 'Input/Output',
    color: 'orange'
  },
  transform: {
    label: 'Transform',
    color: 'purple'
  },
  flow: {
    label: 'Flow Control',
    color: 'yellow'
  },
  ai: {
    label: 'AI',
    color: 'red'
  },
  utility: {
    label: 'Utility',
    color: 'blue'
  },
  testing: {
    label: 'Testing',
    color: 'green'
  }
};

export const NODE_TYPES = {
  test: {
    type: 'test',
    label: 'Test Case',
    description: 'Validate response data against test conditions',
    category: 'testing',
    icon: TestTube,
    component: TestNode,
    config: TestNodeConfig,
    defaultData: {
      name: 'Test Case',
      tests: [],
      requireAll: true,
      continueOnFailure: false,
      timeout: 5000
    },
  },
  http: {
    type: 'http',
    label: 'HTTP Request',
    description: 'Make HTTP requests to external APIs',
    category: 'input',
    icon: ArrowUpDown,
    component: HTTPNode,
    config: HTTPNodeConfig,
    defaultData: {
      name: 'HTTP Request',
      method: 'GET',
      url: '',
      headers: [
        { id: 'default-content-type', key: 'Content-Type', value: 'application/json' }
      ],
      contentType: 'json',
      body: null
    },
  },
  format: {
    type: 'format',
    label: 'Format',
    description: 'Format and transform data using templates',
    category: 'transform',
    icon: Code,
    component: FormatNode,
    config: FormatNodeConfig,
    defaultData: {
      name: 'Format',
      template: '',
    },
  },
  fileop: {
    type: 'fileop',
    label: 'File Operation',
    description: 'Read from or write to files',
    category: 'input',
    icon: FileCog,
    component: FileOpNode,
    config: FileOpNodeConfig,
    defaultData: {
      name: 'File Operation',
      operation: 'read',
      path: '',
    },
  },
  parser: {
    type: 'parser',
    label: 'Parser',
    description: 'Parse data using JQ expressions (currently JSON only)',
    category: 'transform',
    icon: FileJson,
    component: ParserNode,
    config: ParserNodeConfig,
    defaultData: {
      name: 'Parser',
      format: 'json',
    },
  },
  conditional: {
    type: 'conditional',
    label: 'Conditional',
    description: 'Branch flow based on conditions',
    category: 'flow',
    icon: GitBranch,
    component: ConditionalNode,
    config: ConditionalNodeConfig,
    defaultData: {
      name: 'Conditional',
      conditions: [],
    },
  },
  iterator: {
    type: 'iterator',
    label: 'Iterator',
    description: 'Iterate through array or list items',
    category: 'flow',
    icon: RefreshCw,
    component: IteratorNode,
    config: IteratorNodeConfig,
    defaultData: {
      name: 'Iterator',
      inputType: 'json',
      testInput: '',
    },
  },
  prompt: {
    type: 'prompt',
    label: 'Prompt',
    description: 'Use an AI prompt to generate text',
    category: 'ai',
    icon: MessageSquare,
    component: PromptNode,
  },
  databaseQuery: {
    type: 'databaseQuery',
    label: 'Database Query',
    description: 'Execute SQL queries against a database',
    category: 'input',
    icon: Database,
    component: DatabaseQueryNode,
    config: DatabaseQueryNodeConfig,
    defaultData: {
      name: 'Database Query',
      query: 'SELECT * FROM table_name',
      parameters: [],
      timeout: 30000,
    },
  },
  command: {
    type: 'command',
    label: 'Command',
    description: 'Execute system commands',
    icon: Terminal,
    component: CommandNode,
    config: CommandNodeConfig,
    defaultData: {
      name: 'Command',
      command: '',
    },
    category: 'input'
  },
  rss: {
    type: 'rss',
    label: 'RSS Feed',
    description: 'Fetch and parse RSS/ATOM feeds',
    category: 'input',
    icon: Rss,
    component: RSSNode,
    config: RSSNodeConfig,
    defaultData: {
      name: 'RSS Feed',
      url: '',
      timeout: 30000,
      maxItems: 10,
      sortBy: 'published',
      sortDirection: 'desc'
    },
  },
};

// Helper functions at the end
export const getNodeTypes = () => {
  return Object.fromEntries(
    Object.entries(NODE_TYPES).map(([key, value]) => [key, value.component])
  );
};

export const paletteItems = Object.values(NODE_TYPES)
  .sort((a, b) => a.type.localeCompare(b.type))
  .map(node => ({
    type: node.type,
    label: node.label,
    description: node.description,
    color: node.color,
    icon: node.icon,
  }));

export const getDefaultData = (type) => {
  return NODE_TYPES[type]?.defaultData || {};
};

export const getNodeColor = (type) => {
  const category = NODE_TYPES[type]?.category;
  return NODE_CATEGORIES[category]?.color || 'gray';
};
import { 
  GithubIcon, 
  GitlabIcon, 
  ShieldCheckIcon, 
  BarChart2Icon, 
  SparklesIcon,
  CloudIcon,
  ServerIcon,
  BrainCircuitIcon
} from 'lucide-react';

export const INTEGRATION_CATEGORIES = {
  SOURCE_CONTROL: 'Source Control',
  SECURITY: 'Security',
  AI: 'Artificial Intelligence',
  CLOUD: 'Cloud Services',
  MONITORING: 'Monitoring'
};

export const integrations = [
  {
    id: 'github',
    name: 'GitHub',
    description: 'GitHub API integration for repository management and code analysis',
    icon: GithubIcon,
    image: 'github.png',
    category: INTEGRATION_CATEGORIES.SOURCE_CONTROL,
    config: {
      token: {
        type: 'password',
        label: 'Personal Access Token',
        required: true,
        validation: /^ghp_[a-zA-Z0-9]{36}$/,
        placeholder: 'ghp_...',
        helpText: 'Generate a token with repo and workflow permissions'
      }
    }
  },
  {
    id: 'gitlab',
    name: 'GitLab',
    description: 'GitLab API integration for repository and CI/CD management',
    icon: GitlabIcon,
    image: 'gitlab.jpg',
    category: INTEGRATION_CATEGORIES.SOURCE_CONTROL,
    config: {
      token: {
        type: 'password',
        label: 'Personal Access Token',
        required: true,
        validation: /^glpat-[a-zA-Z0-9]{20}$/,
        placeholder: 'glpat-...',
        helpText: 'Generate a token with api scope'
      },
      url: {
        type: 'text',
        label: 'GitLab URL',
        required: false,
        placeholder: 'https://gitlab.com',
        helpText: 'Leave empty for gitlab.com, specify for self-hosted'
      }
    }
  },
  {
    id: 'snyk',
    name: 'Snyk',
    description: 'Security vulnerability scanning and dependency analysis',
    icon: ShieldCheckIcon,
    image: 'snyk.png',
    category: INTEGRATION_CATEGORIES.SECURITY,
    config: {
      token: {
        type: 'password',
        label: 'API Token',
        required: true,
        validation: /^[a-zA-Z0-9]{8}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{12}$/,
        placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
        helpText: 'Find in Account Settings > API Token'
      }
    }
  },
  {
    id: 'sonarqube',
    name: 'SonarQube',
    description: 'Code quality and security analysis',
    icon: BarChart2Icon,
    image: 'sonar.png',
    category: INTEGRATION_CATEGORIES.SECURITY,
    config: {
      token: {
        type: 'password',
        label: 'Authentication Token',
        required: true,
        validation: /^[a-zA-Z0-9]+$/,
        placeholder: 'Enter your token',
        helpText: 'Generate in User > Security > Generate Token'
      },
      url: {
        type: 'text',
        label: 'SonarQube URL',
        required: true,
        placeholder: 'https://sonarqube.yourdomain.com',
        helpText: 'Your SonarQube instance URL'
      }
    }
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Claude AI integration for code analysis and generation',
    icon: BrainCircuitIcon,
    image: 'anthropic.jpg',
    category: INTEGRATION_CATEGORIES.AI,
    config: {
      apiKey: {
        type: 'password',
        label: 'API Key',
        required: true,
        validation: /^sk-ant-[a-zA-Z0-9]{48}$/,
        placeholder: 'sk-ant-...',
        helpText: 'Get your API key from Anthropic Console'
      }
    }
  },
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT integration for code analysis and generation',
    icon: SparklesIcon,
    image: 'openai.png',
    category: INTEGRATION_CATEGORIES.AI,
    config: {
      apiKey: {
        type: 'password',
        label: 'API Key',
        required: true,
        validation: /^sk-[a-zA-Z0-9]{48}$/,
        placeholder: 'sk-...',
        helpText: 'Get your API key from OpenAI Dashboard'
      }
    }
  },
  {
    id: 'aws',
    name: 'AWS',
    description: 'Amazon Web Services integration for cloud resources',
    icon: CloudIcon,
    image: 'aws.jpg',
    category: INTEGRATION_CATEGORIES.CLOUD,
    config: {
      accessKeyId: {
        type: 'text',
        label: 'Access Key ID',
        required: true,
        validation: /^[A-Z0-9]{20}$/,
        placeholder: 'AKIA...',
        helpText: 'AWS IAM Access Key ID'
      },
      secretAccessKey: {
        type: 'password',
        label: 'Secret Access Key',
        required: true,
        validation: /^[A-Za-z0-9/+=]{40}$/,
        placeholder: 'Enter your secret key',
        helpText: 'AWS IAM Secret Access Key'
      },
      region: {
        type: 'text',
        label: 'Region',
        required: true,
        placeholder: 'us-east-1',
        helpText: 'AWS Region'
      }
    }
  },
  {
    id: 'datadog',
    name: 'Datadog',
    description: 'Infrastructure and application monitoring',
    icon: ServerIcon,
    image: 'datadog.png',
    category: INTEGRATION_CATEGORIES.MONITORING,
    config: {
      apiKey: {
        type: 'password',
        label: 'API Key',
        required: true,
        validation: /^[a-zA-Z0-9]{32}$/,
        placeholder: 'Enter your API key',
        helpText: 'Find in Organization Settings > API Keys'
      },
      appKey: {
        type: 'password',
        label: 'Application Key',
        required: true,
        validation: /^[a-zA-Z0-9]{40}$/,
        placeholder: 'Enter your application key',
        helpText: 'Find in Organization Settings > Application Keys'
      }
    }
  }
]; 
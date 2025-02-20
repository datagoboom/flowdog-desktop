import { useState, useEffect, memo, useCallback } from 'react';
import { useApi } from '../../../../contexts/ApiContext';
import { useAuth } from '../../../../contexts/AuthContext';
import {useDiagram} from '../../../../contexts/DiagramContext';
import { integrations, INTEGRATION_CATEGORIES } from '../../../../constants/integrations';
import Input from '../../../common/Input';
import Select from '../../../common/Select';
import { Body2, Caption } from '../../../common/Typography';
import Button from '../../../common/Button';
import { useNavigate } from 'react-router-dom';

const PromptNodeConfig = memo(({ node }) => {
  const [selectedIntegration, setSelectedIntegration] = useState(node.data?.integration || '');
  const [configuredIntegrations, setConfiguredIntegrations] = useState([]);
  const api = useApi();
  const { decrypt, hasSecretKey } = useAuth();
  const navigate = useNavigate();
  const { updateNodeData } = useDiagram();

  // Get list of configured AI integrations
  useEffect(() => {
    const loadIntegrations = async () => {
      try {
        const result = await api.storage.listIntegrations();
        console.log('list integrations result', result);
        if (result.success && Array.isArray(result.data)) {
          setConfiguredIntegrations(result.data);
          
          // If there's only one integration and none selected, auto-select it
          if (result.data.length === 1 && !selectedIntegration) {
            const integration = result.data[0];
            const integrationId = integration.dataValues.id;
            const apiKey = integration.dataValues.config.apiKey;
            
            if (apiKey) {
              const decryptedApiKey = decrypt(apiKey);
              updateNodeData(node.id, 'integration', integrationId);
              updateNodeData(node.id, 'apiKey', apiKey);
              setSelectedIntegration(integrationId);
            }
          }
        }
      } catch (error) {
        console.error('Failed to load integrations:', error);
      }
    };

    if (hasSecretKey) {
      loadIntegrations();
    }
  }, [api, hasSecretKey, selectedIntegration, node.id, updateNodeData, decrypt]);

  const handleIntegrationChange = useCallback(async (value) => {
    const selectedConfig = configuredIntegrations.find(i => i.dataValues.id === value);
    
    if (selectedConfig) {
      try {
        const apiKey = selectedConfig.dataValues.config.apiKey;
        if (apiKey) {
          const decryptedApiKey = await decrypt(apiKey);
          updateNodeData(node.id, 'apiKey', decryptedApiKey);
          updateNodeData(node.id, 'integration', value);
          setSelectedIntegration(value);
        }
      } catch (error) {
        console.error('Failed to decrypt API key:', error);
      }
    }
  }, [configuredIntegrations, decrypt, node.id, updateNodeData]);

  

  const handlePromptChange = useCallback((e) => {
    updateNodeData(node.id, 'prompt', e.target.value);
  }, [node]);

  const navigateToSettings = () => {
    navigate('/settings');
  };

  if (!hasSecretKey) {
    return (
      <div className="p-4">
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <Body2 className="font-medium text-yellow-800 dark:text-yellow-200">
            Authentication Required
          </Body2>
          <Caption className="text-yellow-700 dark:text-yellow-300 mt-1">
            Please log in to access AI services.
          </Caption>
        </div>
      </div>
    );
  }

  if (configuredIntegrations.length === 0) {
    return (
      <div className="p-4">
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <Body2 className="font-medium text-yellow-800 dark:text-yellow-200">
            No AI Services Configured
          </Body2>
          <Caption className="text-yellow-700 dark:text-yellow-300 mt-1">
            You need to configure at least one AI service (like Anthropic or OpenAI) to use this node.
          </Caption>
          <Button
            variant="light"
            color="yellow"
            onClick={navigateToSettings}
            className="mt-3"
          >
            Configure AI Service
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <div>
        <Select
          label="AI Service"
          value={node.data.integration}
          onChange={handleIntegrationChange}
          helper="Select which AI service to use for this prompt"
          options={configuredIntegrations.map(integration => ({
            value: integration.dataValues.id,
            label: integration.dataValues.id.charAt(0).toUpperCase() + 
                   integration.dataValues.id.slice(1)
          }))}
        />
      </div>

      <div>
        <Body2 className="font-medium">Prompt</Body2>
        <Input
          value={node.data.prompt || ''}
          onChange={handlePromptChange}
          placeholder="Enter your prompt here. Use {{input}} to reference input data"
          variant="filled"
          size="lg"
          fullWidth
        />
      </div>

      {/* Debug Info */}
      <div className="p-2 mb-4 bg-slate-100 dark:bg-slate-800 rounded text-xs font-mono space-y-1">
        <div>Node ID: {node.id}</div>
        <div>Type: {node.type}</div>
        <div>Integration: {node.data.integration}</div>
        <div>Prompt: {node.data.prompt}</div>
        <div>API Key: {node.data.apiKey ? node.data.apiKey.slice(0, Math.floor(node.data.apiKey.length/2)) + '*'.repeat(Math.floor(node.data.apiKey.length/2)) : ''}</div>
        <div className="text-xs text-slate-400 mt-1">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
});

PromptNodeConfig.displayName = 'PromptNodeConfig';

export default PromptNodeConfig;
import { useState, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
import { Body1, Body2, Caption } from '../common/Typography';
import Button from '../common/Button';
import Card from '../common/Card';
import Modal from '../common/Modal';
import Input from '../common/Input';
import { useApi } from '../../contexts/ApiContext';
import { useAuth } from '../../contexts/AuthContext';
import { integrations, INTEGRATION_CATEGORIES } from '../../constants/integrations';

const IntegrationCard = ({ integration, isConfigured, onConfigure }) => {
  const Icon = integration.icon;
  
  const getLogo = (integration) => {
    let path = "../../assets/vendor/" + integration.image;
    // load image from path
    let logo = new URL(path, import.meta.url).href;
    return logo;
  }
  return (
    <Card layout="horizontal" className="h-48">
      {/* Placeholder for product logo */}
      <div className="flex-shrink-0 bg-slate-100 flex items-center justify-center rounded-md">
        {integration.image && (

          <img src={getLogo(integration)} alt={integration.name} className="h-full w-auto aspect-square object-contain opacity-95 rounded-md" />
        )}  
        {!integration.image && (
          <Icon className="w-12 h-12 text-slate-400 dark:text-slate-500" />
        )}
      </div>
      
      <div className="flex flex-col flex-1">
        <Card.Header
          title={
            <div className="flex items-center justify-between pl-4 h-12">
              <span className="font-medium">{integration.name}</span>
              {isConfigured && (
                <div className="flex items-center gap-1 text-green-500">
                  <CheckCircle className="w-4 h-4 ml-2" />
                </div>
              )}
            </div>
          }
        />
        <Card.Content className="flex-1 h-full">
          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 pl-4">
            {integration.description}
          </p>
        </Card.Content>
        <Card.Footer divider={false} className="pl-4 h-12">
          <Button 
            variant="light" 
            color={isConfigured ? "green" : "purple"}
            onClick={() => onConfigure(integration)}
            className="w-full"
          >
            {isConfigured ? 'Update Configuration' : 'Configure'}
          </Button>
        </Card.Footer>
      </div>
    </Card>
  );
};

const IntegrationConfigModal = ({ integration, isOpen, onClose, onSave }) => {
  const [config, setConfig] = useState({});
  const [errors, setErrors] = useState({});
  const { encrypt } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Encrypt sensitive fields before saving
      const encryptedConfig = {};
      for (const [key, value] of Object.entries(config)) {
        if (integration.config[key].type === 'password' || key === 'apiKey') {
          encryptedConfig[key] = await encrypt(value);
        } else {
          encryptedConfig[key] = value;
        }
      }

      await onSave(integration.id, encryptedConfig);
      onClose();
    } catch (error) {
      console.error('Failed to encrypt and save config:', error);
      setErrors({ submit: 'Failed to save configuration' });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Configure ${integration.name}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {Object.entries(integration.config).map(([key, field]) => (
          <div key={key}>
            <Input
              label={field.label}
              type={field.type}
              placeholder={field.placeholder}
              value={config[key] || ''}
              onChange={(e) => {
                setConfig(prev => ({ ...prev, [key]: e.target.value }));
                if (errors[key]) {
                  setErrors(prev => ({ ...prev, [key]: null }));
                }
              }}
              aria-label={field.helpText}
            />
            {field.helpText && (
              <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {field.helpText}
              </div>
            )}
          </div>
        ))}
        {errors.submit && (
          <div className="text-red-500 text-sm">{errors.submit}</div>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="light" onClick={onClose}>Cancel</Button>
          <Button type="submit" color="purple">Save Configuration</Button>
        </div>
      </form>
    </Modal>
  );
};

const IntegrationsSection = () => {
  const [selectedIntegration, setSelectedIntegration] = useState(null);
  const [configuredIntegrations, setConfiguredIntegrations] = useState({});
  const api = useApi();

  useEffect(() => {
    const loadIntegrations = async () => {
      try {
        const result = await api.integration.list();
        if (result.success && Array.isArray(result.data)) {
          const configured = {};
          result.data.forEach(integration => {
            const config = integration.config || integration.dataValues?.config;
            const id = integration.id || integration.dataValues?.id;
            
            if (id && config) {
              configured[id] = config;
            }
          });
          setConfiguredIntegrations(configured);
        }
      } catch (error) {
        console.error('Failed to load integrations:', error);
      }
    };

    loadIntegrations();
  }, [api]);

  const handleSaveConfig = async (integrationId, config) => {
    try {
      const result = await api.integration.save({ id: integrationId, config });
      if (result.success) {
        setConfiguredIntegrations(prev => ({
          ...prev,
          [integrationId]: config
        }));
      }
    } catch (error) {
      console.error('Failed to save integration:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Body1 className="font-bold">Integrations</Body1>
        <Caption className="text-slate-500">Configure your external services</Caption>
      </div>

      {Object.values(INTEGRATION_CATEGORIES).map(category => (
        <div key={category} className="space-y-4">
          <Body2 className="font-semibold">{category}</Body2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {integrations
              .filter(integration => integration.category === category)
              .map(integration => (
                <IntegrationCard
                  key={integration.id}
                  integration={integration}
                  isConfigured={!!configuredIntegrations[integration.id]}
                  onConfigure={() => setSelectedIntegration(integration)}
                />
              ))}
          </div>
        </div>
      ))}

      {selectedIntegration && (
        <IntegrationConfigModal
          integration={selectedIntegration}
          isOpen={!!selectedIntegration}
          onClose={() => setSelectedIntegration(null)}
          onSave={handleSaveConfig}
        />
      )}
    </div>
  );
};

export default IntegrationsSection; 
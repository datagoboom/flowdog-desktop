import { useState, useEffect } from 'react';
import { User, CreditCard, Database, Plug, ChevronRight, Bell, Moon, Sun, Globe } from 'lucide-react';
import { Body1, Body2, Caption } from '../components/common/Typography';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Switch from '../components/common/Switch';
import DatabaseConnectionForm from '../components/settings/DatabaseConnectionForm';
import { useApi } from '../contexts/ApiContext';

const SECTIONS = {
  USER: 'user',
  INTEGRATIONS: 'integrations',
  DATA_SOURCES: 'data-sources',
  BILLING: 'billing'
};

const Settings = () => {
  const [activeSection, setActiveSection] = useState(SECTIONS.USER);
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [language, setLanguage] = useState('en');
  const [plan] = useState('free');
  const [connections, setConnections] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const api = useApi();

  // Load connections when component mounts
  useEffect(() => {
    const loadConnections = async () => {
      const result = await api.storage.listConnections();
      if (result.success) {
        setConnections(result.data || []);
      }
    };
    loadConnections();
  }, []);

  const renderContent = () => {
    switch (activeSection) {
      case SECTIONS.USER:
        return (
          <div className="space-y-6">
            <div>
              <Body1 className="font-bold">User Settings</Body1>
              <Caption className="text-slate-500">Manage your account preferences</Caption>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 divide-y divide-slate-200 dark:divide-slate-700">
              {/* Dark Mode */}
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {darkMode ? <Moon size={20} /> : <Sun size={20} />}
                  <div>
                    <Body2 className="font-medium">Dark Mode</Body2>
                    <Caption className="text-slate-500">Toggle dark mode theme</Caption>
                  </div>
                </div>
                <Switch checked={darkMode} onChange={setDarkMode} />
              </div>

              {/* Notifications */}
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell size={20} />
                  <div>
                    <Body2 className="font-medium">Notifications</Body2>
                    <Caption className="text-slate-500">Manage notification preferences</Caption>
                  </div>
                </div>
                <Switch checked={notifications} onChange={setNotifications} />
              </div>

              {/* Language */}
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe size={20} />
                  <div>
                    <Body2 className="font-medium">Language</Body2>
                    <Caption className="text-slate-500">Select your preferred language</Caption>
                  </div>
                </div>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                </select>
              </div>
            </div>
          </div>
        );

      case SECTIONS.INTEGRATIONS:
        return (
          <div className="space-y-6">
            <div>
              <Body1 className="font-bold">Integrations</Body1>
              <Caption className="text-slate-500">Connect your external services</Caption>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 divide-y divide-slate-200 dark:divide-slate-700">
              {['GitHub', 'Slack', 'Google Drive'].map((integration) => (
                <div key={integration} className="p-4 flex items-center justify-between">
                  <div>
                    <Body2 className="font-medium">{integration}</Body2>
                    <Caption className="text-slate-500">
                      {`Connect your ${integration} account`}
                    </Caption>
                  </div>
                  <Button variant="light">Connect</Button>
                </div>
              ))}
            </div>
          </div>
        );

      case SECTIONS.DATA_SOURCES:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Body1 className="font-bold">Data Sources</Body1>
                <Caption className="text-slate-500">Manage your database connections</Caption>
              </div>
              {!showForm && (
                <Button color="purple" onClick={() => setShowForm(true)}>
                  Add Connection
                </Button>
              )}
            </div>

            {showForm ? (
              <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
                <DatabaseConnectionForm 
                  onSubmit={async (connectionData) => {
                    console.log('Submitting connection data:', {
                      ...connectionData,
                      password: connectionData.password ? '[REDACTED]' : undefined
                    });
                    try {
                      const result = await api.storage.saveConnection(connectionData);
                      console.log('Save result:', result);
                      if (result.success) {
                        setShowForm(false);
                        // Refresh connections list
                        const listResult = await api.storage.listConnections();
                        if (listResult.success) {
                          setConnections(listResult.data || []);
                        }
                      }
                    } catch (error) {
                      console.error('Failed to save connection:', error);
                    }
                  }}
                  onCancel={() => setShowForm(false)}
                />
              </div>
            ) : null}

            {/* List existing connections */}
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 divide-y divide-slate-200 dark:divide-slate-700">
              {connections.length === 0 ? (
                <div className="p-4 text-center text-slate-500">
                  No connections configured
                </div>
              ) : (
                connections.map((connection) => (
                  <div key={connection.id} className="p-4 flex items-center justify-between">
                    <div>
                      <Body2 className="font-medium">{connection.name}</Body2>
                      <Caption className="text-slate-500">
                        {connection.type} • {connection.host || connection.file}
                      </Caption>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="light" onClick={() => {
                        setShowForm(true);
                        // Set form data for editing
                      }}>
                        Edit
                      </Button>
                      <Button 
                        variant="light" 
                        color="red"
                        onClick={async () => {
                          const result = await api.storage.deleteConnection(connection.id);
                          if (result.success) {
                            setConnections(prev => prev.filter(c => c.id !== connection.id));
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );

      case SECTIONS.BILLING:
        return (
          <div className="space-y-6">
            <div>
              <Body1 className="font-bold">Billing</Body1>
              <Caption className="text-slate-500">Manage your subscription</Caption>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Body2 className="font-medium">Current Plan</Body2>
                  <Caption className="text-slate-500">
                    {plan === 'free' ? 'Free Tier' : 'Premium Plan'}
                  </Caption>
                </div>
                {plan === 'free' && (
                  <Button color="purple">Upgrade to Premium</Button>
                )}
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-64 border-r border-slate-200 dark:border-slate-700 p-4">
        <div className="space-y-1">
          {[
            { id: SECTIONS.USER, icon: User, label: 'User' },
            { id: SECTIONS.INTEGRATIONS, icon: Plug, label: 'Integrations' },
            { id: SECTIONS.DATA_SOURCES, icon: Database, label: 'Data Sources' },
            { id: SECTIONS.BILLING, icon: CreditCard, label: 'Billing' }
          ].map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className={`
                w-full px-3 py-2 rounded-md flex items-center gap-2
                ${activeSection === id 
                  ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400' 
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800'}
              `}
            >
              <Icon size={20} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-auto">
        {renderContent()}
      </div>
    </div>
  );
};

export default Settings; 
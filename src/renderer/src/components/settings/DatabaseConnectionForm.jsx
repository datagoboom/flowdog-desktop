import { useState, memo, useEffect } from 'react';
import { Body2, Caption } from '../common/Typography';
import Button from '../common/Button';
import Input from '../common/Input';

const DATABASE_TYPES = {
  POSTGRES: 'postgres',
  MYSQL: 'mysql',
  SQLITE: 'sqlite'
};

const DATABASE_CONFIGS = {
  [DATABASE_TYPES.POSTGRES]: {
    name: 'PostgreSQL',
    fields: ['host', 'port', 'database', 'username', 'password', 'ssl'],
    defaults: {
      port: '5432',
      host: 'localhost'
    }
  },
  [DATABASE_TYPES.MYSQL]: {
    name: 'MySQL',
    fields: ['host', 'port', 'database', 'username', 'password', 'ssl'],
    defaults: {
      port: '3306',
      host: 'localhost'
    }
  },
  [DATABASE_TYPES.SQLITE]: {
    name: 'SQLite',
    fields: ['file'],
    defaults: {
      file: ''
    }
  }
};

const DatabaseConnectionForm = memo(({ onSubmit, onCancel, initialData = null }) => {
  const [dbType, setDbType] = useState(initialData?.type || '');
  const [sqliteMode, setSqliteMode] = useState('existing');
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    ...initialData?.config || {}
  });
  const [testStatus, setTestStatus] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Add useEffect to log state changes
  useEffect(() => {
    console.log('Current state:', {
      dbType,
      formData,
      sqliteMode
    });
  }, [dbType, formData, sqliteMode]);

  const handleTypeSelect = (type) => {
    console.log('Setting database type to:', type);
    setDbType(type);
    setFormData(prev => ({
      name: prev.name,
      ...DATABASE_CONFIGS[type].defaults
    }));
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTestConnection = async () => {
    setTestStatus('testing');
    try {
      // Ensure we have the required fields
      if (!dbType) {
        throw new Error('Database type is required');
      }

      if (dbType === 'sqlite' && !formData.file) {
        throw new Error('Database file is required');
      }

      // Create test config
      const testConfig = {
        type: dbType,
        ...(dbType === 'sqlite' 
          ? { file: formData.file }
          : {
              host: formData.host,
              port: formData.port,
              database: formData.database,
              username: formData.username,
              password: formData.password,
              ssl: formData.ssl
            })
      };

      console.log('Sending test config:', {
        ...testConfig,
        password: testConfig.password ? '[REDACTED]' : undefined
      });

      // Use the storage.testConnection method directly
      const result = await window.api.storage.testConnection(testConfig);
      
      console.log('Test connection result:', result);
      
      setTestStatus(result.success ? 'success' : 'error');
      if (!result.success) {
        throw new Error(result.error || 'Connection test failed');
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      setTestStatus('error');
    }
  };

  const handleSqliteFileSelect = async () => {
    try {
      const options = {
        filters: [{ name: 'SQLite Database', extensions: ['db', 'sqlite', 'sqlite3'] }]
      };

      if (sqliteMode === 'new') {
        const result = await window.api.invoke('dialog.save-file', {
          ...options,
          title: 'Create New SQLite Database',
          defaultPath: 'database.db'
        });
        if (result.success) {
          handleInputChange('file', result.filePath);
        }
      } else {
        const result = await window.api.invoke('dialog.open-file', {
          ...options,
          title: 'Select Existing SQLite Database'
        });
        if (result.success) {
          handleInputChange('file', result.filePath);
        }
      }
    } catch (error) {
      console.error('Failed to select SQLite file:', error);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name?.trim()) {
      return;
    }

    setIsSaving(true);
    try {
      // Prepare connection data
      const connectionData = {
        id: initialData?.id,
        name: formData.name.trim(),
        type: dbType,
        config: {}
      };

      // Add appropriate config based on database type
      if (dbType === 'sqlite') {
        connectionData.config = {
          file: formData.file
        };
      } else {
        // For MySQL and PostgreSQL
        connectionData.config = {
          host: formData.host,
          port: formData.port,
          database: formData.database,
          username: formData.username,
          password: formData.password,
          ssl: formData.ssl
        };
      }

      console.log('Submitting connection:', {
        ...connectionData,
        config: {
          ...connectionData.config,
          password: connectionData.config.password ? '[REDACTED]' : undefined
        }
      });

      // Use invoke directly instead of through the API context
      const result = await window.api.invoke('storage.save-connection', connectionData);

      if (!result.success) {
        throw new Error(result.error || 'Failed to save connection');
      }

      if (onSubmit) {
        await onSubmit(result);
      }
    } catch (error) {
      console.error('Failed to save connection:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!dbType) {
    return (
      <div className="space-y-4">
        <Body2 className="font-medium">Select Database Type</Body2>
        <div className="grid grid-cols-3 gap-4">
          {Object.entries(DATABASE_CONFIGS).map(([type, config]) => (
            <button
              key={type}
              onClick={() => handleTypeSelect(type)}
              className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-purple-500 dark:hover:border-purple-400 transition-colors"
            >
              <Body2 className="font-medium">{config.name}</Body2>
              <Caption className="text-slate-500">Click to configure</Caption>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const config = DATABASE_CONFIGS[dbType];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Body2 className="font-medium">{config.name} Connection</Body2>
        <Button variant="light" onClick={() => setDbType('')}>
          Change Type
        </Button>
      </div>

      {/* SQLite Mode Toggle */}
      {dbType === DATABASE_TYPES.SQLITE && (
        <div className="flex items-center gap-2 p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <button
            onClick={() => setSqliteMode('existing')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              sqliteMode === 'existing'
                ? 'bg-white dark:bg-slate-700 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            Existing Database
          </button>
          <button
            onClick={() => setSqliteMode('new')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              sqliteMode === 'new'
                ? 'bg-white dark:bg-slate-700 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            New Database
          </button>
        </div>
      )}

      <div className="space-y-4">
        {/* Connection Name field */}
        <Input
          label="Connection Name"
          value={formData.name || ''}
          onChange={(e) => handleInputChange('name', e.target.value)}
          placeholder="Enter a name for this connection"
          required
        />

        {/* Database-specific fields */}
        {config.fields.map(field => (
          <div key={field}>
            {field === 'file' && dbType === DATABASE_TYPES.SQLITE ? (
              <div className="space-y-2">
                <Input
                  label="Database File"
                  value={formData[field] || ''}
                  onChange={(e) => handleInputChange(field, e.target.value)}
                  placeholder={sqliteMode === 'new' ? 'Choose location for new database' : 'Select existing database file'}
                  readOnly
                />
                <Button
                  variant="light"
                  onClick={handleSqliteFileSelect}
                  className="w-full"
                >
                  {sqliteMode === 'new' ? 'Choose Location' : 'Select File'}
                </Button>
              </div>
            ) : (
              <Input
                label={field.charAt(0).toUpperCase() + field.slice(1)}
                type={field === 'password' ? 'password' : 'text'}
                value={formData[field] || ''}
                onChange={(e) => handleInputChange(field, e.target.value)}
                placeholder={`Enter ${field}`}
              />
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <Button
          color="purple"
          onClick={handleTestConnection}
          disabled={testStatus === 'testing'}
        >
          {testStatus === 'testing' ? 'Testing...' : 'Test Connection'}
        </Button>
        {testStatus && (
          <Caption
            className={
              testStatus === 'success'
                ? 'text-green-500'
                : testStatus === 'error'
                ? 'text-red-500'
                : ''
            }
          >
            {testStatus === 'success'
              ? 'Connection successful!'
              : testStatus === 'error'
              ? 'Connection failed'
              : ''}
          </Caption>
        )}
      </div>

      <div className="flex items-center gap-4">
        <Button 
          color="purple" 
          onClick={handleSubmit}
          disabled={isSaving || !formData.name.trim()}
        >
          {isSaving ? 'Saving...' : 'Save Connection'}
        </Button>
        <Button variant="light" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
});

export default DatabaseConnectionForm; 
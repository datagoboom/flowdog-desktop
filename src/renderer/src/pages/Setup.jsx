import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useApi } from '../contexts/ApiContext';
import Box from '../components/common/Box';
import Input from '../components/common/Input';

const DEFAULT_CONFIGS = {
  mysql: {
    host: 'localhost',
    port: '3306',
    database: '',
    username: 'root',
    password: '',
    ssl: {
      enabled: false,
      rejectUnauthorized: false,
      allowSelfSigned: true
    }
  },
  postgres: {
    host: 'localhost',
    port: '5432',
    database: '',
    username: 'postgres',
    password: '',
    ssl: {
      enabled: false,
      rejectUnauthorized: false,
      allowSelfSigned: true
    }
  },
  sqlite: {
    host: '',
    port: '',
    database: '',
    username: '',
    password: '',
    ssl: {
      enabled: false,
      rejectUnauthorized: false
    }
  }
};

const Setup = () => {
  const navigate = useNavigate();
  const { setup } = useAuth();
  const api = useApi();
  const [step, setStep] = useState(1); // 1: Database setup, 2: User setup
  
  // Database configuration
  const [dbType, setDbType] = useState('sqlite');
  const [dbConfig, setDbConfig] = useState(DEFAULT_CONFIGS.sqlite);
  
  // User credentials
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [setupStatus, setSetupStatus] = useState('');

  const handleDbTypeChange = (e) => {
    const newType = e.target.value;
    setDbType(newType);
    setDbConfig(DEFAULT_CONFIGS[newType]);
  };

  const handleDbConfigChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'ssl') {
      setDbConfig(prev => ({
        ...prev,
        ssl: {
          ...prev.ssl,
          enabled: checked
        }
      }));
    } else {
      setDbConfig(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleNextStep = async () => {
    if (step === 1) {
      setError('');
      setIsLoading(true);
      
      try {
        // Update to use new API structure
        const testResult = await api.connection.test({
          type: dbType,
          ...(dbType !== 'sqlite' ? dbConfig : {})
        });

        if (!testResult.success) {
          throw new Error(testResult.error || 'Failed to connect to database');
        }

        setStep(2);
      } catch (error) {
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handlePrevStep = () => {
    setStep(1);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setSetupStatus('Initializing setup...');

    try {
      const setupData = {
        database: {
          type: dbType,
          ...(dbType !== 'sqlite' ? dbConfig : {})
        },
        user: {
          username,
          password
        }
      };

      console.log('Setup data:', setupData);
      setSetupStatus('Creating user account...');
      
      // Update to use new API structure
      const result = await api.auth.setup(setupData);
      
      if (result.success) {
        setSetupStatus('Setting up database...');
        // Add artificial delay for better UX
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setSetupStatus('Setup complete! Redirecting...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Force a page reload to ensure all auth states are updated
        window.location.href = '/dashboard';
      } else {
        setError(result.error || 'Setup failed');
      }
    } catch (error) {
      setError(error.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
      setSetupStatus('');
    }
  };

  const renderDatabaseForm = () => {
    if (dbType === 'sqlite') {
      return (
        <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          Using SQLite as the default database. All data will be stored locally.
        </div>
      );
    }

    return (
      <div className="space-y-4 mt-4">
        <Input
          label="Host"
          name="host"
          value={dbConfig.host}
          onChange={handleDbConfigChange}
          fullWidth
        />
        <Input
          label="Port"
          name="port"
          value={dbConfig.port}
          onChange={handleDbConfigChange}
          fullWidth
        />
        <Input
          label="Database Name"
          name="database"
          value={dbConfig.database}
          onChange={handleDbConfigChange}
          fullWidth
          required
        />
        <Input
          label="Username"
          name="username"
          value={dbConfig.username}
          onChange={handleDbConfigChange}
          fullWidth
        />
        <Input
          label="Password"
          name="password"
          type="password"
          value={dbConfig.password}
          onChange={handleDbConfigChange}
          fullWidth
        />
        <div className="space-y-2">
          <div className="flex items-center">
            <input
              type="checkbox"
              name="ssl"
              checked={dbConfig.ssl.enabled}
              onChange={handleDbConfigChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              Use SSL
            </label>
          </div>
          {dbConfig.ssl.enabled && (
            <div className="flex items-center ml-6">
              <input
                type="checkbox"
                name="allowSelfSigned"
                checked={dbConfig.ssl.allowSelfSigned}
                onChange={(e) => {
                  setDbConfig(prev => ({
                    ...prev,
                    ssl: {
                      ...prev.ssl,
                      allowSelfSigned: e.target.checked,
                      rejectUnauthorized: !e.target.checked
                    }
                  }));
                }}
                className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-yellow-500">
                Allow self-signed certificates (less secure)
              </label>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gray-900 fixed inset-0">
      <Box className="max-w-md w-full space-y-8 p-8 bg-gray-800 rounded-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            {step === 1 ? 'Database Setup' : 'Create Admin Account'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            {step === 1 
              ? 'Choose your database configuration' 
              : 'Create your administrator account'}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {step === 1 ? (
            <div>
              <label className="block text-sm font-medium text-gray-300">
                Database Type
              </label>
              <select
                value={dbType}
                onChange={handleDbTypeChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-gray-800 text-white"
              >
                <option value="sqlite">SQLite (Local)</option>
                <option value="mysql">MySQL</option>
                <option value="postgres">PostgreSQL</option>
              </select>

              {renderDatabaseForm()}
            </div>
          ) : (
            <div className="space-y-4">
              <Input
                label="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value.trim())}
                disabled={isLoading}
                fullWidth
                required
              />
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                fullWidth
                required
              />
              <Input
                label="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                fullWidth
                required
                error={error === 'Passwords do not match' ? error : undefined}
              />
            </div>
          )}

          {error && error !== 'Passwords do not match' && (
            <div className="text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <div className="flex justify-between space-x-4">
            {step === 2 && (
              <button
                type="button"
                onClick={handlePrevStep}
                className="group relative flex-1 flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Back
              </button>
            )}
            <button
              type={step === 1 ? "button" : "submit"}
              onClick={step === 1 ? handleNextStep : undefined}
              disabled={isLoading || (step === 1 && dbType !== 'sqlite' && !dbConfig.database)}
              className={`group relative flex-1 flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                isLoading || (step === 1 && dbType !== 'sqlite' && !dbConfig.database)
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 focus:ring-offset-gray-900'
              }`}
            >
              {isLoading ? (
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              ) : null}
              {isLoading
                ? 'Setting up...'
                : step === 1
                ? 'Next'
                : 'Create Account'}
            </button>
          </div>
        </form>
      </Box>
    </div>
  );
};

export default Setup; 
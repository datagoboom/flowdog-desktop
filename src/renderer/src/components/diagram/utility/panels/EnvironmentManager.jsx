import React, { useState, useEffect, useMemo } from 'react';
import { 
  Save, Plus, Trash2, Copy, Check, 
  FileDown, FileUp, X, Shield, ShieldOff, Edit
} from 'lucide-react';
import { Body1, Body2, Caption } from '../../../common/Typography';
import Input from '../../../common/Input';
import Button from '../../../common/Button';
import Select from '../../../common/Select';
import { useFlow } from '../../../../contexts/FlowContext';
import { useApi } from '../../../../contexts/ApiContext';
import {cn} from '../../../../utils';

const normalizeVariables = (vars) => {
  if (!vars) return {};
  
  let normalized = vars;
  // Keep parsing until we get an object
  while (typeof normalized === 'string') {
    try {
      normalized = JSON.parse(normalized);
      console.log('Parsed variables:', normalized);
    } catch (e) {
      console.error('Failed to parse variables:', e);
      return {};
    }
  }
  
  return typeof normalized === 'object' ? normalized : {};
};

const EnvironmentManager = () => {
  const {
    environment,
    setEnvironment,
    environments,
    switchEnvironment,
    saveEnvironment,
    deleteEnvironment
  } = useFlow();

  const api = useApi();

  const [localVars, setLocalVars] = useState({});
  const [localEnv, setLocalEnv] = useState({});
  const [envOptions, setEnvOptions] = useState([]);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [tempVar, setTempVar] = useState({
    key: '',
    value: ''
  });

  // only once
  useEffect(() => {
    console.log("Environment Manager Loading", environment);
    if (environment) {
      localEnv == {} && setLocalEnv(environment);
    }
  }, []);

  // track unsaved changes when local env changes
  useEffect(() => {
    if (localEnv !== environment) {
      setUnsavedChanges(true);
    }
  }, [localEnv]);

  // update env options
  useEffect(() => {
    setEnvOptions(formatEnvOptions(environments));
  }, [environments]);

  // save changes
  useEffect(() => {
    if (unsavedChanges) {
      setIsSaving(true);
      setTimeout(() => {
        handleSave();
        setIsSaving(false);
      }, 1000);
    }
  }, [unsavedChanges]);

  const handleSave = async () => {
    let env = {
      ...localEnv, 
      variables: JSON.stringify(localVars) // Single stringify when saving
    };
    let res = await saveEnvironment(env);
    setUnsavedChanges(false);
  }

  const handleAddVar = () => {
    setLocalVars({...localVars, [tempVar.key]: tempVar.value});
    setTempVar({key: '', value: ''});
  }

  const handleNewEnv = async (name) => {
    let res = await saveEnvironment({name});
    if (res.success) {
      setLocalEnv(res.data);
    }
  }

  const formatEnvOptions = (envs) => {
    let formatted = envs.map(env => ({
      id: env.id,
      value: env.id,
      label: env.name
    }));

    return formatted;
  }

  const handleEnvChange = async (id) => {
    let res = await api.env.get(id);
    console.log("New Env", res);
    if (res.success) {
      const envData = res.response.dataValues;
      console.log("Raw environment variables:", envData.variables);
      
      const normalizedVars = normalizeVariables(envData.variables);
      console.log("Normalized variables:", normalizedVars);
      
      switchEnvironment(envData.id);
      setLocalEnv(envData);
      setLocalVars(normalizedVars);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <Body1>Environment Manager</Body1>
        
        </div>
        
        <div className="flex items-center gap-2">
          <Select
            value={localEnv?.id || ''}
            onChange={(value) => {handleEnvChange(value)}}
            options={envOptions}
            placeholder="Select Environment"
            className="flex-1"
          />
          
          <div className="flex items-center gap-1">
            <Button
              variant="light"
              color="green"
              size="sm"
              onClick={() => {}}
              title="New Environment"
            >
              <Plus size={16} />
            </Button>
            
            {environment && (
              <>
                <Button
                  variant="light"
                  color="red"
                  size="sm"
                  onClick={() => {}}
                  title="Delete Environment"
                >
                  <Trash2 size={16} />
                </Button>
              </>
            )}

            {isSaving &&
              <span className="text-sm text-yellow-500">Saving...</span>
            }
          </div>
        </div>
      </div>
      
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Variables List */}
          <div className="flex-1 overflow-y-auto">
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {Object.keys(localVars).map((key) => (
                <div key={key} className="py-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 px-1">
                    <div className="flex items-center gap-2">
                      <Input
                        value={key}
                        onChange={(e) => {}}
                        placeholder="Variable name"
                        variant="glass"
                        disabled
                      />
                      
                      <Input
                        value={localVars[key]}
                        onChange={(e) => {}}
                        placeholder="Value"
                        variant="filled"
                        fullWidth
                        type={'text'}
                      />
                      
                      <div className="flex items-center">
                        <Button
                          variant="text"
                          color="blue"
                          size="sm"
                          onClick={() => {}}
                          title="Edit variable name"
                        >
                          <Edit size={16} />
                        </Button>
                        
                        <Button
                          variant="text"
                          color="red"
                          size="sm"
                          onClick={() => {}}
                          title="Delete variable"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                </div>
              ))}
              
              {/* Add New Variable Row - Moved here */}
              <div className="py-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 px-1">
                <div className="flex items-center gap-2">
                  { localEnv.id &&
                    <>
                      <Input
                        value={tempVar.key}
                        onChange={(e) => {setTempVar({...tempVar, key: e.target.value})}}
                        placeholder="New variable name"
                        variant="filled"
                      />
                  
                      <Input
                        value={tempVar.value}
                        onChange={(e) => {setTempVar({...tempVar, value: e.target.value})}}
                        placeholder="Value"
                        variant="filled"
                        disabled={!tempVar.key}
                        className={cn(
                          !tempVar.key && "opacity-50"
                        )}
                        fullWidth
                        type={'text'}
                      />
                      
                      <Button
                        variant="filled"
                        color="green"
                        size="sm"
                        onClick={handleAddVar}
                        disabled={false}
                      >
                        <Plus size={16} />
                      </Button>
                    </>
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
};

export default EnvironmentManager;
import { createContext, useContext, useState, useCallback } from 'react';

const LoggerContext = createContext(null);

export const useLogger = () => {
  const context = useContext(LoggerContext);
  if (!context) {
    throw new Error('useLogger must be used within a LoggerProvider');
  }
  return context;
};

export const LoggerProvider = ({ children }) => {
  const [logs, setLogs] = useState([]);

  const addLog = useCallback((log) => {
    setLogs(prevLogs => [...prevLogs, {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      ...log
    }]);
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return (
    <LoggerContext.Provider value={{ logs, addLog, clearLogs }}>
      {children}
    </LoggerContext.Provider>
  );
}; 
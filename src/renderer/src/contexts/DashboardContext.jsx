import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useApi } from './ApiContext';

const DashboardContext = createContext({});

export const DashboardProvider = ({ children }) => {
  const [dashboards, setDashboards] = useState([]);
  const [activeDashboard, setActiveDashboard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const api = useApi();

  const loadDashboards = useCallback(async () => {
    try {
      setIsLoading(true);
      const loadedDashboards = await window.api.dashboard.list();
      setDashboards(loadedDashboards || []);
      return loadedDashboards;
    } catch (error) {
      console.error('Failed to load dashboards:', error);
      setDashboards([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load dashboards when the provider mounts
  useEffect(() => {
    loadDashboards();
  }, [loadDashboards]);

  const createDashboard = useCallback(async ({ name, description }) => {
    const newDashboard = {
      id: uuidv4(),
      name,
      description,
      panels: [],
      created_at: Date.now(),
      updated_at: Date.now()
    };

    try {
      await window.api.dashboard.save(newDashboard);
      setDashboards(prev => [...prev, newDashboard]);
      setActiveDashboard(newDashboard);
      return newDashboard;
    } catch (error) {
      console.error('Failed to create dashboard:', error);
      throw error;
    }
  }, []);

  const updateDashboard = useCallback(async (dashboardId, updates) => {
    try {
      const updatedDashboard = {
        ...dashboards.find(d => d.id === dashboardId),
        ...updates,
        updated_at: Date.now()
      };
      
      await window.api.dashboard.save(updatedDashboard);
      setDashboards(prev => prev.map(d => d.id === dashboardId ? updatedDashboard : d));
      
      if (activeDashboard?.id === dashboardId) {
        setActiveDashboard(updatedDashboard);
      }
      
      return updatedDashboard;
    } catch (error) {
      console.error('Failed to update dashboard:', error);
      throw error;
    }
  }, [dashboards, activeDashboard]);

  const deleteDashboard = useCallback(async (dashboardId) => {
    try {
      await window.api.dashboard.delete(dashboardId);
      setDashboards(prev => prev.filter(d => d.id !== dashboardId));
      
      if (activeDashboard?.id === dashboardId) {
        setActiveDashboard(null);
      }
    } catch (error) {
      console.error('Failed to delete dashboard:', error);
      throw error;
    }
  }, [activeDashboard]);

  return (
    <DashboardContext.Provider value={{
      dashboards,
      activeDashboard,
      setActiveDashboard,
      loadDashboards,
      createDashboard,
      updateDashboard,
      deleteDashboard,
      isLoading
    }}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboards = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboards must be used within a DashboardProvider');
  }
  return context;
}; 
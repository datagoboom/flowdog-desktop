// main/handlers/dashboardHandlers.js
import { ipcMain, app } from 'electron';
import fs from 'fs/promises';
import path from 'path';
import { validateDashboard, sanitizePath } from '../utils/validation';

// Ensure dashboards directory exists
const ensureDashboardsDir = async () => {
  const dashboardsPath = path.join(app.getPath('userData'), 'dashboards');
  await fs.mkdir(dashboardsPath, { recursive: true });
  return dashboardsPath;
};

export const setupDashboardHandlers = () => {
  // List all dashboards
  ipcMain.handle('dashboard.list', async () => {
    try {
      const dashboardsPath = await ensureDashboardsDir();
      const files = await fs.readdir(dashboardsPath);
      
      const dashboards = await Promise.all(
        files
          .filter(file => file.endsWith('.json'))
          .map(async (file) => {
            const filePath = path.join(dashboardsPath, file);
            // Validate path is within dashboards directory
            if (!filePath.startsWith(dashboardsPath)) {
              throw new Error('Invalid dashboard path');
            }
            const content = await fs.readFile(filePath, 'utf-8');
            const dashboard = JSON.parse(content);
            return validateDashboard(dashboard);
          })
      );

      return dashboards.sort((a, b) => b.updated_at - a.updated_at);
    } catch (error) {
      console.error('Failed to list dashboards:', error);
      throw error;
    }
  });

  // Save dashboard
  ipcMain.handle('dashboard.save', async (_, dashboard) => {
    try {
      // Validate dashboard data
      const validatedDashboard = validateDashboard(dashboard);
      
      const dashboardsPath = await ensureDashboardsDir();
      const sanitizedId = sanitizePath(validatedDashboard.id);
      const filePath = path.join(dashboardsPath, `${sanitizedId}.json`);
      
      // Ensure path is within dashboards directory
      if (!filePath.startsWith(dashboardsPath)) {
        throw new Error('Invalid dashboard path');
      }
      
      await fs.writeFile(
        filePath,
        JSON.stringify(validatedDashboard, null, 2),
        'utf-8'
      );

      return validatedDashboard;
    } catch (error) {
      console.error('Failed to save dashboard:', error);
      throw error;
    }
  });

  // Delete dashboard
  ipcMain.handle('dashboard.delete', async (_, dashboardId) => {
    try {
      const dashboardsPath = await ensureDashboardsDir();
      const filePath = path.join(dashboardsPath, `${dashboardId}.json`);
      
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      console.error('Failed to delete dashboard:', error);
      throw error;
    }
  });

  // Get single dashboard
  ipcMain.handle('dashboard.get', async (_, dashboardId) => {
    try {
      const dashboardsPath = await ensureDashboardsDir();
      const filePath = path.join(dashboardsPath, `${dashboardId}.json`);
      
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.error('Failed to get dashboard:', error);
      throw error;
    }
  });
}; 
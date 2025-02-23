// main/handlers/dashboardHandlers.js
import { app } from 'electron';
import fs from 'fs/promises';
import path from 'path';
import { sanitizePath, responder } from '../utils/helpers';

const dashboardsDir = path.join(app.getPath('userData'), 'dashboards');

const ensureDashboardsDir = async () => {
  try {
    await fs.mkdir(dashboardsDir, { recursive: true });
  } catch (error) {
    console.error('Failed to create dashboards directory:', error);
  }
};

export const dashboardHandlers = {
  'dashboard:list': async () => {
    try {
      await ensureDashboardsDir();
      const files = await fs.readdir(dashboardsDir);
      
      const dashboards = await Promise.all(
        files
          .filter(file => file.endsWith('.json'))
          .map(async (file) => {
            const filePath = path.join(dashboardsDir, file);
            if (!filePath.startsWith(dashboardsDir)) {
              throw new Error('Invalid dashboard path');
            }
            const content = await fs.readFile(filePath, 'utf-8');
            return JSON.parse(content);
          })
      );

      return responder(true, dashboards.sort((a, b) => b.updated_at - a.updated_at), null);
    } catch (error) {
      console.error('Failed to list dashboards:', error);
      return responder(false, null, error.message);
    }
  },

  'dashboard:save': async (_, dashboard) => {
    try {
      if (!dashboard?.id) {
        throw new Error('Dashboard ID is required');
      }

      await ensureDashboardsDir();
      const sanitizedId = sanitizePath(dashboard.id);
      const filePath = path.join(dashboardsDir, `${sanitizedId}.json`);
      
      if (!filePath.startsWith(dashboardsDir)) {
        throw new Error('Invalid dashboard path');
      }
      
      const dashboardData = {
        ...dashboard,
        updated_at: Date.now()
      };

      await fs.writeFile(
        filePath,
        JSON.stringify(dashboardData, null, 2),
        'utf-8'
      );

      return responder(true, dashboardData, null);
    } catch (error) {
      console.error('Failed to save dashboard:', error);
      return responder(false, null, error.message);
    }
  },

  'dashboard:delete': async (_, dashboardId) => {
    try {
      if (!dashboardId) {
        throw new Error('Dashboard ID is required');
      }

      await ensureDashboardsDir();
      const filePath = path.join(dashboardsDir, `${dashboardId}.json`);
      
      await fs.unlink(filePath);
      return responder(true, null, null);
    } catch (error) {
      console.error('Failed to delete dashboard:', error);
      return responder(false, null, error.message);
    }
  },

  'dashboard:get': async (_, dashboardId) => {
    try {
      if (!dashboardId) {
        throw new Error('Dashboard ID is required');
      }

      await ensureDashboardsDir();
      const filePath = path.join(dashboardsDir, `${dashboardId}.json`);
      
      const content = await fs.readFile(filePath, 'utf-8');
      return responder(true, JSON.parse(content), null);
    } catch (error) {
      console.error('Failed to get dashboard:', error);
      return responder(false, null, error.message);
    }
  }
}; 
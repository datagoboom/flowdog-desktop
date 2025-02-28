import database from '../services/databaseService';
import { responder } from '../utils/helpers';

export const envHandlers = {
  'env:save': async (_, data) => {
    try {
      const { id, ...envData } = data;
      
      // Always ensure variables is stored as a string in the database
      let processedData = { ...envData };
      
      if (processedData.variables) {
        // Convert variables to string if it's an object
        if (typeof processedData.variables === 'object') {
          processedData.variables = JSON.stringify(processedData.variables);
        }
      }

      let env = await database.models.Environment.findOne({
        where: { id }
      });

      if (env) {
        await env.update(processedData);
      } else {
        env = await database.models.Environment.create({
          id,
          ...processedData
        });
      }

      return responder(true, {
          id: env.id,
          name: env.name,
          description: env.description,
          variables: env.variables, // This will be the string representation
          createdAt: env.createdAt,
          updatedAt: env.updatedAt
        }, null);
    } catch (error) {
      console.error('Failed to save environment:', error);
      return responder(false, null, error.message);
    }
  },

  'env:get': async (_, id) => {
    try {
      const env = await database.models.Environment.findOne({
        where: { id }
      });
      
      console.log('Found environment:', env);
      
      if (!env) {
        return responder(false, null, 'Environment not found');
      }
      
      return responder(true, env, null);
    } catch (error) {
      console.error('Failed to get environment:', error);
      return responder(false, null, error.message);
    }
  },

  'env:list': async () => {
    try {
      const environments = await database.models.Environment.findAll();
      return responder(true, environments, null);
    } catch (error) {
      console.error('Failed to list environments:', error);
      return responder(false, null, error.message);
    }
  },

  'env:delete': async (_, id) => {
    try {
      await database.models.Environment.destroy({ where: { id } });
      return responder(true, null, null);
    } catch (error) {
      return responder(false, null, error.message);
    }
  }
};

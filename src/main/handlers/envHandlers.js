import database from '../services/databaseService';

export const envHandlers = {
  'env:save': async (_, data) => {
    try {
      const { id, ...envData } = data;
      
      let env = await database.models.Environment.findOne({
        where: { id }
      });

      if (env) {
        await env.update(envData);
      } else {
        env = await database.models.Environment.create({
          id,
          ...envData
        });
      }

      return responder(true, {
          id: env.id,
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
  }
}; 
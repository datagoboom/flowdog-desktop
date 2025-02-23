import database from '../services/databaseService';
import { responder } from '../utils/helpers';

export const integrationHandlers = {
  'integration:save': async (_, data) => {
    try {
      const { id, config } = data;
      
      // Get or create integration record
      let integration = await database.models.Integration.findOne({
        where: { id }
      });

      if (integration) {
        integration.config = config;
        await integration.save();
      } else {
        integration = await database.models.Integration.create({
          id,
          config
        });
      }

      return responder(true, {
          id: integration.id,
          createdAt: integration.createdAt,
          updatedAt: integration.updatedAt
        }, null);
    } catch (error) {
      console.error('Failed to save integration:', error);
      return responder(false, null, error.message);
    }
  },

  'integration:get': async (_, id) => {
    try {
      const integration = await database.models.Integration.findOne({
        where: { id }
      });

      return responder(true, integration, null);
    } catch (error) {
      console.error('Failed to get integration:', error);
      return responder(false, null, error.message);
    }
  },

  'integration:list': async () => {
    try {
      const integrations = await database.models.Integration.findAll();

      return responder(true, integrations, null);
    } catch (error) {
      console.error('Failed to list integrations:', error);
      return responder(false, null, error.message);
    }
  },

  'integration:delete': async (_, id) => {
    try {
      await database.models.Integration.destroy({
        where: { id }
      });
    return responder(true, null, null);
    } catch (error) {
      console.error('Failed to delete integration:', error);
      return responder(false, null, error.message);
    }
  }
}; 
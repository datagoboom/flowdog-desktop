import database from '../services/databaseService';
import authService from '../services/authService';

export const userHandlers = {
  'user:get-info': async (event) => {
    try {
      const user = await database.models.User.findOne({
        where: { id: currentUserId },
        attributes: ['id', 'username', 'firstName', 'lastName', 'avatar', 'createdAt', 'updatedAt']
      });

      return {
        success: true,
        data: user,
        error: null
      };
    } catch (error) {
      console.error('Failed to get user info:', error);
      return {
        success: false,
        data: null,
        error: error.message
      };
    }
  },

  'user:update-info': async (event, data) => {
    try {
      const { firstName, lastName, avatar } = data;
      
      const user = await database.models.User.findOne({
        where: { id: currentUserId }
      });

      if (!user) {
        throw new Error('User not found');
      }

      await user.update({
        firstName,
        lastName,
        avatar
      });

      return {
        success: true,
        data: {
          id: user.id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          avatar: user.avatar,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        },
        error: null
      };
    } catch (error) {
      console.error('Failed to update user info:', error);
      return {
        success: false,
        data: null,
        error: error.message
      };
    }
  },

  'user:change-password': async (event, data) => {
    try {
      const { currentPassword, newPassword } = data;

      // Verify current password
      const user = await database.models.User.findOne({
        where: { id: currentUserId }
      });

      if (!user) {
        throw new Error('User not found');
      }

      const isValid = await authService.verifyPassword(currentPassword, user.digest);
      if (!isValid) {
        throw new Error('Current password is incorrect');
      }

      // Update password
      const newDigest = await authService.hashPassword(newPassword);
      await user.update({ digest: newDigest });

      return {
        success: true,
        data: null,
        error: null
      };
    } catch (error) {
      console.error('Failed to change password:', error);
      return {
        success: false,
        data: null,
        error: error.message
      };
    }
  },

  'user:get-settings': async (event) => {
    try {
      let settings = await database.models.UserSettings.findOne({
        where: { userId: currentUserId }
      });

      if (!settings) {
        settings = await database.models.UserSettings.create({
          userId: currentUserId,
          config: {}
        });
      }

      return {
        success: true,
        data: settings.config,
        error: null
      };
    } catch (error) {
      console.error('Failed to get user settings:', error);
      return {
        success: false,
        data: null,
        error: error.message
      };
    }
  },

  'user:update-settings': async (event, config) => {
    try {
      let settings = await database.models.UserSettings.findOne({
        where: { userId: currentUserId }
      });

      if (settings) {
        await settings.update({ config });
      } else {
        settings = await database.models.UserSettings.create({
          userId: currentUserId,
          config
        });
      }

      return {
        success: true,
        data: settings.config,
        error: null
      };
    } catch (error) {
      console.error('Failed to update user settings:', error);
      return {
        success: false,
        data: null,
        error: error.message
      };
    }
  }
}; 
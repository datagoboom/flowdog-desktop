import authService from '../services/authService';

export const authHandlers = {
  'auth.check-setup': async () => {
    return await authService.isSetupComplete();
  },

  'auth.setup': async (event, { username, password }) => {
    if (!username || !password) {
      return {
        success: false,
        error: 'Username and password are required'
      };
    }

    return await authService.setup(username, password);
  },

  'auth.login': async (event, { username, password }) => {
    if (!username || !password) {
      return {
        success: false,
        error: 'Username and password are required'
      };
    }

    return await authService.login(username, password);
  }
}; 
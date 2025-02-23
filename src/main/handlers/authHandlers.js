import authService from '../services/authService';
import database from '../services/databaseService';

export const authHandlers = {
  'auth:check-setup': async () => {
    try {
      const result = await authService.isSetupComplete();
      console.log('Setup check result:', result);
      return result;
    } catch (error) {
      console.error('Setup check failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  'auth:setup': async (event, setupData) => {
    console.log('Auth Handler - Setup data received:', JSON.stringify(setupData, null, 2));
    
    try {
      // Validate the complete data structure
      if (!setupData || typeof setupData !== 'object') {
        console.error('Auth Handler - Invalid data structure:', setupData);
        return {
          success: false,
          error: 'Invalid setup data'
        };
      }

      // Validate database configuration
      if (setupData.database) {
        if (!setupData.database.type) {
          console.error('Auth Handler - Missing database type');
          return {
            success: false,
            error: 'Database type is required'
          };
        }

        // Validate additional database fields based on type
        if (setupData.database.type !== 'sqlite') {
          const requiredFields = ['host', 'port', 'database', 'username', 'password'];
          const missingFields = requiredFields.filter(field => !setupData.database[field]);
          
          if (missingFields.length > 0) {
            console.error('Auth Handler - Missing database fields:', missingFields);
            return {
              success: false,
              error: `Missing required database fields: ${missingFields.join(', ')}`
            };
          }
        }

        // Test database connection
        try {
          const testResult = await database.testConnection(setupData.database);
          if (!testResult.success) {
            console.error('Auth Handler - Database connection test failed:', testResult.error);
            return testResult;
          }
        } catch (error) {
          console.error('Auth Handler - Database connection test error:', error);
          return {
            success: false,
            error: `Database connection failed: ${error.message}`
          };
        }
      }

      // Validate user data
      if (setupData.user) {
        if (!setupData.user.username || !setupData.user.password) {
          console.error('Auth Handler - Missing user credentials');
          return {
            success: false,
            error: 'Username and password are required'
          };
        }

        // Validate username format
        if (!/^[a-zA-Z0-9_-]{3,}$/.test(setupData.user.username)) {
          return {
            success: false,
            error: 'Username must be at least 3 characters and contain only letters, numbers, underscores, and hyphens'
          };
        }

        // Validate password strength
        if (setupData.user.password.length < 8) {
          return {
            success: false,
            error: 'Password must be at least 8 characters long'
          };
        }
      }

      // If we have both database and user data, perform the complete setup
      if (setupData.database && setupData.user) {
        console.log('Auth Handler - Performing complete setup');
        const result = await authService.setup({
          database: setupData.database,
          user: {
            username: setupData.user.username,
            password: setupData.user.password
          }
        });

        console.log('Auth Handler - Setup completed:', {
          success: result.success,
          error: result.error || null
        });

        return result;
      }

      console.error('Auth Handler - Incomplete setup data');
      return {
        success: false,
        error: 'Both database configuration and user credentials are required'
      };

    } catch (error) {
      console.error('Auth Handler - Setup failed:', error);
      return {
        success: false,
        error: error.message || 'Setup failed'
      };
    }
  },

  'auth:login': async (event, credentials) => {
    try {
      console.log('Auth Handler - Login attempt for user:', credentials?.username);

      if (!credentials?.username || !credentials?.password) {
        console.error('Auth Handler - Missing login credentials');
        return {
          success: false,
          error: 'Username and password are required'
        };
      }

      const result = await authService.login(credentials.username, credentials.password);
      
      console.log('Auth Handler - Login result:', {
        success: result.success,
        userId: result.success ? result.user?.id : null
      });

      return result;
    } catch (error) {
      console.error('Auth Handler - Login failed:', error);
      return {
        success: false,
        error: error.message || 'Login failed'
      };
    }
  }
};
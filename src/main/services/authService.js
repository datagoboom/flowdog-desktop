import bcrypt from 'bcrypt';
import database from './databaseService';

const SALT_ROUNDS = 10;

export class AuthService {
  async hashPassword(password) {
    console.log('AuthService - Hashing password, length:', password?.length);
    return await bcrypt.hash(password, SALT_ROUNDS);
  }

  async verifyPassword(password, digest) {
    return bcrypt.compare(password, digest);
  }

  async setup({ user, database: dbConfig }) {
    console.log('AuthService setup - Received data structure:', {
      hasUser: !!user,
      hasDatabase: !!dbConfig,
      userData: {
        username: user?.username,
        hasPassword: !!user?.password
      }
    });
    
    try {
      // Check if any users exist
      const users = await database.models.User.count();
      if (users > 0) {
        throw new Error('Setup has already been completed');
      }

      if (!user?.username || !user?.password) {
        console.error('AuthService setup - Invalid user data:', {
          hasUsername: !!user?.username,
          hasPassword: !!user?.password
        });
        throw new Error('Username and password are required');
      }

      // Initialize database with configuration
      console.log('AuthService setup - Initializing database');
      await database.firstRun(dbConfig);

      // Create first user
      console.log('AuthService setup - Creating user:', {
        username: user.username,
        passwordLength: user.password?.length
      });
      
      const digest = await this.hashPassword(user.password);
      const result = await database.createUser({
        username: user.username,
        digest
      });

      console.log('AuthService setup - User creation result:', result);

      if (!result.success) {
        throw new Error(result.error);
      }

      return {
        success: true,
        user: {
          id: result.user.id,
          username: result.user.username
        }
      };
    } catch (error) {
      console.error('AuthService setup - Failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async login(username, password) {
    try {
      const user = await database.getUserByUsername(username);
      if (!user) {
        return {
          success: false,
          error: 'Invalid username or password'
        };
      }

      const isValid = await this.verifyPassword(password, user.digest);
      if (!isValid) {
        return {
          success: false,
          error: 'Invalid username or password'
        };
      }

      return {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          avatar: user.avatar
        }
      };
    } catch (error) {
      console.error('Login failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async isSetupComplete() {
    try {
      const users = await database.models.User.count();
      return {
        success: true,
        isComplete: users > 0
      };
    } catch (error) {
      console.error('Failed to check setup status:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default new AuthService(); 
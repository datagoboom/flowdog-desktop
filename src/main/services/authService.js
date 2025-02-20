import bcrypt from 'bcrypt';
import database from './database';

const SALT_ROUNDS = 10;

export class AuthService {
  async hashPassword(password) {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  async verifyPassword(password, digest) {
    return bcrypt.compare(password, digest);
  }

  async setup(username, password) {
    try {
      // Check if any users exist
      const users = await database.models.User.count();
      if (users > 0) {
        throw new Error('Setup has already been completed');
      }

      // Create first user
      const digest = await this.hashPassword(password);
      const result = await database.createUser({
        username,
        digest
      });

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
      console.error('Setup failed:', error);
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
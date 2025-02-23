import { Sequelize, DataTypes } from 'sequelize'
import { app } from 'electron'
import path from 'path'
import { randomUUID } from 'crypto'
import fs from 'fs/promises'
import { encrypt, decrypt } from '../utils/crypto'

class Database {
  constructor() {
    this.sequelize = null
    this.models = {}
    this.dbPath = null
    this.mainDbConfig = null
  }

  async initialize() {
    try {
      // Store the database path for SQLite
      const userDataPath = app.getPath('userData')
      this.dbPath = path.join(userDataPath, 'flowdog.db')
      
      console.log('Local database location:', this.dbPath)

      // Ensure the directory exists
      await fs.mkdir(path.dirname(this.dbPath), { recursive: true })

      // Check if we have a stored database configuration
      const storedConfig = await this.getStoredDatabaseConfig()
      
      if (storedConfig) {
        // Initialize with the stored database configuration
        console.log('Using stored database configuration:', {
          type: storedConfig.type,
          database: storedConfig.database
        })
        
        this.sequelize = new Sequelize({
          dialect: storedConfig.type,
          host: storedConfig.host,
          port: storedConfig.port,
          database: storedConfig.database,
          username: storedConfig.username,
          password: storedConfig.password,
          logging: false
        })
      } else {
        // Initialize with SQLite as default
        console.log('Using default SQLite configuration')
        this.sequelize = new Sequelize({
          dialect: 'sqlite',
          storage: this.dbPath,
          logging: false
        })
      }

      // Define all models
      await this.defineAllModels()

      // Sync models with database
      await this.sequelize.sync({ force: false })
      console.log('Database schema synchronized')

      // Test the connection
      await this.sequelize.authenticate()
      console.log('Database connection established successfully')

    } catch (error) {
      console.error('Failed to initialize database:', error)
      throw error
    }
  }

  async getStoredDatabaseConfig() {
    try {
      // Create a temporary SQLite connection to get the stored config
      const tempDb = new Sequelize({
        dialect: 'sqlite',
        storage: this.dbPath,
        logging: false
      });

      // Define the DatabaseConfig model temporarily
      const DatabaseConfig = tempDb.define('DatabaseConfig', {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true
        },
        type: {
          type: DataTypes.STRING,
          allowNull: false
        },
        host: {
          type: DataTypes.STRING,
          allowNull: true
        },
        port: {
          type: DataTypes.INTEGER,
          allowNull: true
        },
        database: {
          type: DataTypes.STRING,
          allowNull: true
        },
        username: {
          type: DataTypes.STRING,
          allowNull: true
        },
        password: {
          type: DataTypes.STRING,
          allowNull: true
        },
        encrypted: {
          type: DataTypes.BOOLEAN,
          defaultValue: false
        }
      });

      await tempDb.sync();
      const config = await DatabaseConfig.findOne();
      await tempDb.close();

      if (!config) {
        console.log('No stored database configuration found');
        return null;
      }

      // Handle decryption more gracefully
      let decryptedPassword = config.password;
      if (config.encrypted && config.password) {
        try {
          decryptedPassword = await decrypt(config.password);
          if (decryptedPassword === null) {
            console.warn('Failed to decrypt database password, treating as unencrypted');
            decryptedPassword = config.password;
          }
        } catch (error) {
          console.warn('Error decrypting database password:', error);
          decryptedPassword = config.password;
        }
      }

      return {
        type: config.type,
        host: config.host,
        port: config.port,
        database: config.database,
        username: config.username,
        password: decryptedPassword
      };
    } catch (error) {
      console.error('Failed to get stored database config:', error);
      return null;
    }
  }

  async defineAllModels() {
    console.log('Defining database models...');
    
    // Define DatabaseConfig model
    this.models.DatabaseConfig = this.sequelize.define('DatabaseConfig', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false
      },
      host: {
        type: DataTypes.STRING,
        allowNull: true
      },
      port: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      database: {
        type: DataTypes.STRING,
        allowNull: true
      },
      username: {
        type: DataTypes.STRING,
        allowNull: true
      },
      password: {
        type: DataTypes.STRING,
        allowNull: true
      },
      encrypted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      }
    });

    // Define Connection model
    this.models.Connection = this.sequelize.define('Connection', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false
      },
      config: {
        type: DataTypes.JSON,
        allowNull: false
      }
    });

    // Define User model
    this.models.User = this.sequelize.define('User', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: true
        }
      },
      digest: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true
        }
      },
      firstName: {
        type: DataTypes.STRING,
        allowNull: true
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: true
      },
      avatar: {
        type: DataTypes.STRING,
        allowNull: true
      }
    }, {
      tableName: 'Users',
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['username']
        }
      ]
    });

    // Define Integration model
    this.models.Integration = this.sequelize.define('Integration', {
      id: {
        type: DataTypes.STRING,
        primaryKey: true
      },
      config: {
        type: DataTypes.JSON,
        allowNull: false
      }
    }, {
      timestamps: true
    });

    this.models.Environment = this.sequelize.define('Environment', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      description: {
        type: DataTypes.STRING,
        allowNull: true
      },
      variables: {
        type: DataTypes.TEXT,
        allowNull: false,
        get() {
          const rawValue = this.getDataValue('variables');
          try {
            return JSON.parse(rawValue);
          } catch (error) {
            console.error('Failed to parse variables JSON:', error);
            return {};
          }
        },
        set(value) {
          try {
            this.setDataValue('variables', JSON.stringify(value));
          } catch (error) {
            console.error('Failed to stringify variables:', error);
            this.setDataValue('variables', '{}');
          }
        }
      }
    }, {
      hooks: {
        beforeValidate: (environment) => {
          // Ensure variables is always a string
          if (typeof environment.variables === 'object') {
            environment.variables = JSON.stringify(environment.variables);
          }
        }
      }
    });

    console.log('Models defined successfully');
  }

  async firstRun(dbConfig) {
    console.log('Database firstRun - Starting with config:', {
      type: dbConfig.type,
      host: dbConfig.host,
      database: dbConfig.database,
      username: dbConfig.username
    });

    try {
      if (dbConfig.type !== 'sqlite') {
        // Store encrypted database credentials in SQLite
        const tempDb = new Sequelize({
          dialect: 'sqlite',
          storage: this.dbPath,
          logging: false
        })

        // Define and sync the DatabaseConfig model
        const DatabaseConfig = tempDb.define('DatabaseConfig', {
          id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
          },
          type: {
            type: DataTypes.STRING,
            allowNull: false
          },
          host: {
            type: DataTypes.STRING,
            allowNull: true
          },
          port: {
            type: DataTypes.INTEGER,
            allowNull: true
          },
          database: {
            type: DataTypes.STRING,
            allowNull: true
          },
          username: {
            type: DataTypes.STRING,
            allowNull: true
          },
          password: {
            type: DataTypes.STRING,
            allowNull: true
          },
          encrypted: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
          }
        })

        await tempDb.sync()

        // Store the configuration
        await DatabaseConfig.create({
          id: randomUUID(),
          type: dbConfig.type,
          host: dbConfig.host,
          port: parseInt(dbConfig.port),
          database: dbConfig.database,
          username: dbConfig.username,
          password: await encrypt(dbConfig.password),
          encrypted: true
        })

        await tempDb.close()

        // Switch the main connection to the new database
        this.sequelize = new Sequelize({
          dialect: dbConfig.type,
          host: dbConfig.host,
          port: parseInt(dbConfig.port),
          database: dbConfig.database,
          username: dbConfig.username,
          password: dbConfig.password,
          logging: false
        })

        // Re-define models on the new connection
        await this.defineAllModels()
      }

      // Sync models with the database
      console.log('Syncing database models...')
      await this.sequelize.sync({ alter: true })

      console.log('Database firstRun - Completed successfully')
      return true
    } catch (error) {
      console.error('Database firstRun - Failed:', error)
      throw error
    }
  }

  // Flow methods
  async saveFlow(flowData) {
    const { id, name, data } = flowData
    return await this.sequelize.query(
      `INSERT OR REPLACE INTO flows (id, name, data, updated_at) 
       VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
      {
        replacements: [id, name, JSON.stringify(data)],
        type: this.sequelize.QueryTypes.INSERT
      }
    )
  }

  async getFlow(id) {
    const flow = await this.sequelize.query(
      'SELECT * FROM flows WHERE id = ?',
      {
        replacements: [id],
        type: this.sequelize.QueryTypes.SELECT
      }
    )
    if (flow.length > 0) {
      flow[0].data = JSON.parse(flow[0].data)
    }
    return flow[0]
  }

  // Environment methods
  async saveEnv(envData) {
    const { id, name, variables } = envData
    return await this.sequelize.query(
      `INSERT OR REPLACE INTO environments (id, name, variables, updated_at) 
       VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
      {
        replacements: [id, name, JSON.stringify(variables)],
        type: this.sequelize.QueryTypes.INSERT
      }
    )
  }

  async getEnv(id) {
    const env = await this.sequelize.query(
      'SELECT * FROM environments WHERE id = ?',
      {
        replacements: [id],
        type: this.sequelize.QueryTypes.SELECT
      }
    )
    if (env.length > 0) {
      env[0].variables = JSON.parse(env[0].variables)
    }
    return env[0]
  }

  async listEnv() {
    const envs = await this.sequelize.query(
      'SELECT id, name, created_at, updated_at FROM environments',
      {
        type: this.sequelize.QueryTypes.SELECT
      }
    )
    return envs
  }

  async saveConnection(connection) {
    try {
      console.log('Database service: saving connection:', {
        ...connection,
        config: connection.config ? {
          ...connection.config,
          password: connection.config.password ? '[REDACTED]' : undefined
        } : undefined
      })

      // Validate required fields
      if (!connection?.name || !connection?.type) {
        throw new Error('Connection name and type are required')
      }

      // Create or update the connection
      const [record, created] = await this.models.Connection.upsert({
        id: connection.id, // Will be generated if not provided
        name: connection.name.trim(),
        type: connection.type,
        config: connection.config || {}
      })

      console.log(`Connection ${created ? 'created' : 'updated'} with ID:`, record.id)
      return { success: true, id: record.id }
    } catch (error) {
      console.error('Failed to save connection:', error)
      return { success: false, error: error.message }
    }
  }

  async getConnection(id) {
    try {
      const connection = await this.models.Connection.findByPk(id)
      if (!connection) {
        return null
      }
      
      const data = connection.toJSON()
      console.log('Retrieved connection:', {
        ...data,
        config: {
          ...data.config,
          password: data.config?.password ? '[REDACTED]' : undefined
        }
      })
      
      return data
    } catch (error) {
      console.error('Failed to get connection:', error)
      throw error
    }
  }

  async listConnections() {
    try {
      const connections = await this.models.Connection.findAll()
      const data = connections.map(conn => conn.toJSON())
      
      console.log('Retrieved connections:', data.map(conn => ({
        ...conn,
        config: {
          ...conn.config,
          password: conn.config?.password ? '[REDACTED]' : undefined
        }
      })))
      
      return data
    } catch (error) {
      console.error('Failed to list connections:', error)
      throw error
    }
  }

  async deleteConnection(id) {
    try {
      const deleted = await this.models.Connection.destroy({
        where: { id }
      })
      
      console.log('Deleted connection:', { id, success: deleted > 0 })
      return { success: deleted > 0 }
    } catch (error) {
      console.error('Failed to delete connection:', error)
      return { success: false, error: error.message }
    }
  }

  // Method to create a new Sequelize instance for a connection
  async createConnectionInstance(config) {
    try {
      const sequelize = new Sequelize({
        ...config,
        logging: console.log // Set to false in production
      })

      await sequelize.authenticate()
      return sequelize
    } catch (error) {
      console.error('Failed to create connection instance:', error)
      throw error
    }
  }

  // User management methods
  async createUser(userData) {
    console.log('Database createUser - Received data:', userData);
    
    try {
      if (!userData.username || !userData.digest) {
        console.error('Database createUser - Missing required fields:', { 
          hasUsername: !!userData.username, 
          hasDigest: !!userData.digest 
        });
        return {
          success: false,
          error: 'Username and password are required'
        };
      }

      const user = await this.models.User.create({
        username: userData.username,
        digest: userData.digest
      });

      console.log('Database createUser - User created:', user.toJSON());

      return {
        success: true,
        user: {
          id: user.id,
          username: user.username
        }
      };
    } catch (error) {
      console.error('Database createUser - Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getUser(id) {
    try {
      const user = await this.models.User.findByPk(id);
      return user ? user.toJSON() : null;
    } catch (error) {
      console.error('Failed to get user:', error);
      throw error;
    }
  }

  async getUserByUsername(username) {
    try {
      const user = await this.models.User.findOne({
        where: { username }
      });
      return user ? user.toJSON() : null;
    } catch (error) {
      console.error('Failed to get user by username:', error);
      throw error;
    }
  }

  async updateUser(id, userData) {
    try {
      const [updated] = await this.models.User.update(userData, {
        where: { id }
      });
      if (updated) {
        const user = await this.getUser(id);
        return {
          success: true,
          user
        };
      }
      return {
        success: false,
        error: 'User not found'
      };
    } catch (error) {
      console.error('Failed to update user:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async deleteUser(id) {
    try {
      const deleted = await this.models.User.destroy({
        where: { id }
      });
      return {
        success: deleted > 0
      };
    } catch (error) {
      console.error('Failed to delete user:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Integration methods
  async saveIntegration(data) {
    return await this.models.Integration.create(data);
  }

  async getIntegration(id) {
    return await this.models.Integration.findByPk(id);
  }

  async listIntegrations() {
    return await this.models.Integration.findAll();
  }

  async deleteIntegration(id) {
    return await this.models.Integration.destroy({ where: { id } });
  }

  async testConnection(config) {
    try {
      let testConfig;

      switch (config.type) {
        case 'mysql':
          testConfig = {
            dialect: 'mysql',
            host: config.host,
            port: parseInt(config.port),
            database: config.database,
            username: config.username,
            password: config.password,
            dialectOptions: config.ssl.enabled ? {
              ssl: {
                rejectUnauthorized: config.ssl.rejectUnauthorized,
                // Add these options for self-signed certificates
                require: true,
                requestCert: true,
                ca: null // Allow any CA
              }
            } : {},
            logging: false
          };
          break;

        case 'postgres':
          testConfig = {
            dialect: 'postgres',
            host: config.host,
            port: parseInt(config.port),
            database: config.database,
            username: config.username,
            password: config.password,
            dialectOptions: config.ssl.enabled ? {
              ssl: {
                rejectUnauthorized: config.ssl.rejectUnauthorized,
                // Add these options for self-signed certificates
                require: true,
                requestCert: true,
                ca: null // Allow any CA
              }
            } : {},
            logging: false
          };
          break;

        case 'sqlite':
          testConfig = {
            dialect: 'sqlite',
            storage: this.dbPath,
            logging: false
          };
          break;

        default:
          throw new Error(`Unsupported database type: ${config.type}`);
      }

      const testConnection = new Sequelize(testConfig);
      await testConnection.authenticate();
      await testConnection.close();
      
      return { success: true };
    } catch (error) {
      console.error('Connection test failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

const database = new Database()
export default database 
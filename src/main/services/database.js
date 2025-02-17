import { Sequelize, DataTypes } from 'sequelize'
import { app } from 'electron'
import path from 'path'
import { randomUUID } from 'crypto'
import fs from 'fs/promises'

class Database {
  constructor() {
    this.sequelize = null
    this.models = {}
    this.dbPath = null
  }

  async initialize() {
    try {
      // Store the database path
      const userDataPath = app.getPath('userData')
      this.dbPath = path.join(userDataPath, 'flowdog.db')
      
      console.log('Database location:', this.dbPath)

      // Ensure the directory exists
      await fs.mkdir(path.dirname(this.dbPath), { recursive: true })

      // Initialize SQLite connection
      this.sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: this.dbPath,
        logging: console.log, // Set to false in production
        define: {
          timestamps: true // Enable timestamps by default
        }
      })

      // Define models
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
      })

      // Sync models with database
      // In production, you might want to use { force: false }
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
}

const database = new Database()
export default database 
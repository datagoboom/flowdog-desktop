import { Sequelize } from 'sequelize'

class ConnectionService {
  createSequelizeInstance(connection) {
    const baseConfig = {
      logging: console.log,
      dialect: connection.type
    }

    switch (connection.type) {
      case 'sqlite':
        return new Sequelize({
          ...baseConfig,
          storage: connection.config.file
        })

      case 'postgres':
      case 'mysql':
        return new Sequelize({
          ...baseConfig,
          host: connection.config.host,
          port: connection.config.port,
          database: connection.config.database,
          username: connection.config.username,
          password: connection.config.password,
          ssl: connection.config.ssl
        })

      default:
        throw new Error(`Unsupported database type: ${connection.type}`)
    }
  }

  async testConnection(config) {
    if (!config?.type) {
      throw new Error('Database type is required')
    }

    const sequelize = new Sequelize({
      dialect: config.type,
      host: config.host,
      port: parseInt(config.port),
      database: config.database,
      username: config.username,
      password: config.password,
      ssl: config.ssl,
      logging: false
    })

    try {
      await sequelize.authenticate()
      return true
    } finally {
      await sequelize.close()
    }
  }

  async executeQuery(params, database) {
    const { connectionId, query, input = {} } = params

    // Get connection
    const connection = await database.getConnection(connectionId)
    if (!connection) {
      throw new Error(`Connection not found: ${connectionId}`)
    }

    // Process query
    const systemQuery = getSystemQuery(query, connection.type)
    const finalQuery = interpolateQuery(systemQuery, input)
    const queryType = getQueryType(finalQuery)

    // Create and use connection
    const sequelize = this.createSequelizeInstance(connection)
    try {
      const [results, metadata] = await sequelize.query(finalQuery, {
        type: queryType
      })

      return this.formatResults(results, metadata, queryType)
    } finally {
      await sequelize.close()
    }
  }

  formatResults(results, metadata, queryType) {
    if (queryType === QueryTypes.SELECT) {
      return {
        success: true,
        data: {
          rowCount: Array.isArray(results) ? results.length : 1,
          rows: Array.isArray(results) ? results : [results],
          fields: metadata?.fields || []
        }
      }
    }

    return {
      success: true,
      data: {
        rowCount: typeof metadata === 'number' ? metadata : 0,
        rows: [],
        fields: [],
        message: `Affected ${typeof metadata === 'number' ? metadata : 0} rows`
      }
    }
  }
}

export const connectionService = new ConnectionService()
// utils/database.js
import { QueryTypes } from 'sequelize'

export function escapeValue(value) {
  if (value === null || value === undefined) {
    return 'NULL'
  }
  if (typeof value === 'number') {
    return value
  }
  if (typeof value === 'boolean') {
    return value ? 1 : 0
  }
  return `'${value.toString().replace(/'/g, "''")}'`
}

export function interpolateQuery(query, input = {}) {
  return query.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
    const value = path.trim().split('.').reduce((obj, key) => obj?.[key], input)
    return escapeValue(value)
  })
}

export function getQueryType(query) {
  const normalizedQuery = query.trim().toLowerCase()
  if (normalizedQuery.startsWith('select') || normalizedQuery === 'show tables') {
    return QueryTypes.SELECT
  }
  if (normalizedQuery.startsWith('insert')) {
    return QueryTypes.INSERT
  }
  if (normalizedQuery.startsWith('update')) {
    return QueryTypes.UPDATE
  }
  if (normalizedQuery.startsWith('delete')) {
    return QueryTypes.DELETE
  }
  if (normalizedQuery.startsWith('create') || 
      normalizedQuery.startsWith('alter') || 
      normalizedQuery.startsWith('drop')) {
    return QueryTypes.RAW
  }
  return QueryTypes.RAW
}

export function getSystemQuery(query, dbType) {
  const normalizedQuery = query.trim().toLowerCase()
  
  if (normalizedQuery === 'show tables') {
    switch (dbType) {
      case 'sqlite':
        return `SELECT name as table_name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`
      case 'postgres':
        return `SELECT tablename as table_name FROM pg_catalog.pg_tables WHERE schemaname != 'pg_catalog' AND schemaname != 'information_schema'`
      case 'mysql':
        return 'SHOW TABLES'
      default:
        throw new Error(`Unsupported database type for system query: ${dbType}`)
    }
  }
  
  return query
}

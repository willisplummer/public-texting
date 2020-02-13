const isProduction = process.env.NODE_ENV === 'production'

if (!isProduction) {
  require('dotenv').config()
}

const { Pool } = require('pg')

const connectionString = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}`

// make it easier to run locally without a database
let pool
if (process.env.DATABASE_URL && process.env.DB_USER && process.env.DB_PASSWORD && process.env.DB_PORT && process.env.DB_DATABASE) {
  pool = new Pool({
    connectionString: isProduction ? process.env.DATABASE_URL : connectionString,
    ssl: isProduction,
  })
} else {
  console.log('running with mock database - provide necessary env variables to run with real DB')
  const query = () => Promise.resolve({ rows: [] })
  pool = {
    connect: () => ({ query }),
    query
  }
}

module.exports = { pool }

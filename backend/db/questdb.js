const { Pool } = require('pg');

const host = process.env.QUESTDB_HOST || '127.0.0.1';
const port = parseInt(process.env.QUESTDB_PG_PORT || '8812', 10);
const user = process.env.QUESTDB_USER || 'admin';
const password = process.env.QUESTDB_PASSWORD || 'quest';
const database = process.env.QUESTDB_DATABASE || 'qdb';

const pool = new Pool({
  host,
  port,
  user,
  password,
  database,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.warn('[QuestDB Pool Notice] Idle client error:', err.message);
});

let isConnected = false;

const query = async (text, params = []) => {
  return await pool.query(text, params);
};

const createTables = async () => {
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR,
      email VARCHAR,
      password VARCHAR,
      role VARCHAR,
      created_at TIMESTAMP
    );
  `;

  const createDrawsTable = `
    CREATE TABLE IF NOT EXISTS draws (
      id VARCHAR,
      draw_date TIMESTAMP,
      draw_name VARCHAR,
      draw_number VARCHAR,
      prize_distribution VARCHAR,
      uploaded_at TIMESTAMP,
      uploaded_by VARCHAR,
      status VARCHAR
    );
  `;

  const createLivePrizesTable = `
    CREATE TABLE IF NOT EXISTS live_prizes (
      lottery_name VARCHAR,
      top_prize VARCHAR,
      board VARCHAR,
      draw_number VARCHAR,
      letter VARCHAR,
      winning_numbers VARCHAR,
      updated_at TIMESTAMP
    );
  `;

  await pool.query(createUsersTable);
  await pool.query(createDrawsTable);
  await pool.query(createLivePrizesTable);
};

const initDB = async (retries = 5, delayMs = 3000) => {
  for (let i = 1; i <= retries; i++) {
    try {
      console.log(`Connecting to QuestDB at ${host}:${port} (Attempt ${i}/${retries})...`);
      await createTables();
      isConnected = true;
      console.log('QuestDB successfully connected and tables verified.');
      return true;
    } catch (error) {
      console.error(`QuestDB connection attempt ${i} failed:`, error.message);
      if (i < retries) {
        console.log(`Retrying connection in ${delayMs / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }
  console.warn('Warning: Could not connect to QuestDB after multiple attempts. Application will start but database operations require active QuestDB server.');
  return false;
};

const getStatus = () => {
  return isConnected ? 'CONNECTED' : 'DISCONNECTED';
};

module.exports = {
  pool,
  query,
  initDB,
  getStatus
};

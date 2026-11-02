const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

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

// -------------------------------------------------------------
// Resilient In-Memory & File Store Fallback (when QuestDB is offline)
// -------------------------------------------------------------
const DB_STORE_PATH = path.join(__dirname, '..', 'data', 'db_store.json');
let memoryStore = {};

function loadMemoryStore() {
  try {
    if (fs.existsSync(DB_STORE_PATH)) {
      memoryStore = JSON.parse(fs.readFileSync(DB_STORE_PATH, 'utf8'));
    }
  } catch (e) {
    console.warn('[DB Store] Error loading persistent store:', e.message);
  }
}

function persistMemoryStore() {
  try {
    const dir = path.dirname(DB_STORE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DB_STORE_PATH, JSON.stringify(memoryStore, null, 2), 'utf8');
  } catch (e) {
    console.warn('[DB Store] Error saving persistent store:', e.message);
  }
}

loadMemoryStore();

function getExprVal(expr, row, params) {
  if (!expr) return null;
  expr = expr.trim();
  if (expr.startsWith('$')) {
    const idx = parseInt(expr.slice(1), 10) - 1;
    return params[idx];
  }
  if ((expr.startsWith("'") && expr.endsWith("'")) || (expr.startsWith('"') && expr.endsWith('"'))) {
    return expr.slice(1, -1);
  }
  const lowerMatch = expr.match(/^lower\((.*?)\)$/i);
  if (lowerMatch) {
    const inner = getExprVal(lowerMatch[1], row, params);
    return inner ? String(inner).toLowerCase() : '';
  }
  const upperMatch = expr.match(/^upper\((.*?)\)$/i);
  if (upperMatch) {
    const inner = getExprVal(upperMatch[1], row, params);
    return inner ? String(inner).toUpperCase() : '';
  }
  const colName = expr.toLowerCase();
  if (row[colName] !== undefined) return row[colName];
  if (colName === 'user_id' && row.id !== undefined) return row.id;
  if (colName === 'id' && row.user_id !== undefined) return row.user_id;
  if (colName === 'password_hash' && row.password !== undefined) return row.password;
  if (colName === 'password' && row.password_hash !== undefined) return row.password_hash;
  return null;
}

function evalWhere(whereClause, row, params) {
  if (!whereClause) return true;
  
  if (/\s+OR\s+/i.test(whereClause)) {
    const parts = whereClause.split(/\s+OR\s+/i);
    return parts.some(part => evalWhere(part.trim(), row, params));
  }

  if (/\s+AND\s+/i.test(whereClause)) {
    const parts = whereClause.split(/\s+AND\s+/i);
    return parts.every(part => evalWhere(part.trim(), row, params));
  }

  const cond = whereClause.trim();

  if (cond.includes('!=') || cond.includes('<>')) {
    const op = cond.includes('!=') ? '!=' : '<>';
    const [left, right] = cond.split(op).map(s => s.trim());
    const valL = getExprVal(left, row, params);
    const valR = getExprVal(right, row, params);
    return String(valL ?? '') !== String(valR ?? '');
  }

  if (cond.includes('>=')) {
    const [left, right] = cond.split('>=').map(s => s.trim());
    return getExprVal(left, row, params) >= getExprVal(right, row, params);
  }

  if (cond.includes('<=')) {
    const [left, right] = cond.split('<=').map(s => s.trim());
    return getExprVal(left, row, params) <= getExprVal(right, row, params);
  }

  if (cond.includes('=')) {
    const [left, right] = cond.split('=').map(s => s.trim());
    const valL = getExprVal(left, row, params);
    const valR = getExprVal(right, row, params);
    return String(valL ?? '').toLowerCase() === String(valR ?? '').toLowerCase();
  }

  return true;
}

function memoryQuery(text, params = []) {
  const sql = text.trim();
  const lowerSql = sql.toLowerCase();

  // 1. CREATE TABLE
  if (lowerSql.startsWith('create table')) {
    const match = sql.match(/create\s+table\s+(?:if\s+not\s+exists\s+)?([a-zA-Z0-9_]+)/i);
    if (match) {
      const table = match[1].toLowerCase();
      if (!memoryStore[table]) memoryStore[table] = [];
    }
    return { rows: [] };
  }

  // 2. INSERT INTO
  if (lowerSql.startsWith('insert into')) {
    const match = sql.match(/insert\s+into\s+([a-zA-Z0-9_]+)\s*\(([^)]+)\)\s*values/i);
    if (match) {
      const table = match[1].toLowerCase();
      const colList = match[2].split(',').map(c => c.trim().toLowerCase());
      if (!memoryStore[table]) memoryStore[table] = [];

      const row = {};
      colList.forEach((col, idx) => {
        row[col] = params[idx] !== undefined ? params[idx] : null;
      });

      if (row.user_id && !row.id) row.id = row.user_id;
      if (row.id && !row.user_id) row.user_id = row.id;
      if (row.password_hash && !row.password) row.password = row.password_hash;
      if (row.password && !row.password_hash) row.password_hash = row.password;

      memoryStore[table].push(row);
      persistMemoryStore();
      return { rows: [row], rowCount: 1 };
    }
    return { rows: [] };
  }

  // 3. UPDATE
  if (lowerSql.startsWith('update')) {
    const match = sql.match(/update\s+([a-zA-Z0-9_]+)\s+set\s+(.*?)(?:\s+where\s+(.*))?$/is);
    if (match) {
      const table = match[1].toLowerCase();
      const setClause = match[2];
      const whereClause = match[3] || '';
      const rows = memoryStore[table] || [];
      const setAssignments = setClause.split(',').map(s => s.trim());
      
      let updatedCount = 0;
      rows.forEach(row => {
        if (!whereClause || evalWhere(whereClause, row, params)) {
          setAssignments.forEach(assign => {
            const [rawCol, rawVal] = assign.split('=').map(s => s.trim());
            const col = rawCol.toLowerCase();
            let val;
            if (rawVal.startsWith('$')) {
              const pIdx = parseInt(rawVal.slice(1), 10) - 1;
              val = params[pIdx];
            } else if ((rawVal.startsWith("'") && rawVal.endsWith("'")) || (rawVal.startsWith('"') && rawVal.endsWith('"'))) {
              val = rawVal.slice(1, -1);
            } else if (!isNaN(Number(rawVal))) {
              val = Number(rawVal);
            } else {
              val = rawVal;
            }
            row[col] = val;
          });
          updatedCount++;
        }
      });
      persistMemoryStore();
      return { rows: [], rowCount: updatedCount };
    }
  }

  // 4. DELETE
  if (lowerSql.startsWith('delete from')) {
    const match = sql.match(/delete\s+from\s+([a-zA-Z0-9_]+)(?:\s+where\s+(.*))?$/is);
    if (match) {
      const table = match[1].toLowerCase();
      const whereClause = match[2];
      const rows = memoryStore[table] || [];
      if (!whereClause) {
        memoryStore[table] = [];
      } else {
        memoryStore[table] = rows.filter(row => !evalWhere(whereClause, row, params));
      }
      persistMemoryStore();
      return { rows: [] };
    }
  }

  // 5. SELECT
  if (lowerSql.startsWith('select')) {
    const fromMatch = sql.match(/select\s+(.*?)\s+from\s+([a-zA-Z0-9_]+)(?:\s+where\s+(.*?))?(?:\s+order\s+by\s+(.*?))?(?:\s+limit\s+(\$?\d+))?$/is);
    if (fromMatch) {
      const colsPart = fromMatch[1].trim();
      const table = fromMatch[2].toLowerCase();
      const wherePart = fromMatch[3]?.trim();
      const orderPart = fromMatch[4]?.trim();
      const limitPart = fromMatch[5]?.trim();

      let rows = [...(memoryStore[table] || [])];

      if (wherePart) {
        rows = rows.filter(row => evalWhere(wherePart, row, params));
      }

      if (colsPart.toLowerCase().includes('count(*)')) {
        const count = rows.length;
        return { rows: [{ count }] };
      }

      if (orderPart) {
        const [orderCol, orderDir] = orderPart.split(/\s+/);
        const col = orderCol.toLowerCase();
        const desc = (orderDir || '').toLowerCase() === 'desc';
        rows.sort((a, b) => {
          const valA = a[col] || '';
          const valB = b[col] || '';
          if (valA < valB) return desc ? 1 : -1;
          if (valA > valB) return desc ? -1 : 1;
          return 0;
        });
      }

      if (limitPart) {
        let lim = 0;
        if (limitPart.startsWith('$')) {
          const pIdx = parseInt(limitPart.slice(1), 10) - 1;
          lim = parseInt(params[pIdx], 10);
        } else {
          lim = parseInt(limitPart, 10);
        }
        if (!isNaN(lim) && lim > 0) {
          rows = rows.slice(0, lim);
        }
      }

      if (colsPart !== '*') {
        const colNames = colsPart.split(',').map(c => c.trim().toLowerCase());
        rows = rows.map(r => {
          const projected = {};
          colNames.forEach(c => {
            if (c.includes(' as ')) {
              const [orig, alias] = c.split(' as ').map(x => x.trim());
              projected[alias] = r[orig] !== undefined ? r[orig] : null;
            } else {
              projected[c] = r[c] !== undefined ? r[c] : null;
            }
          });
          return projected;
        });
      }

      return { rows, rowCount: rows.length };
    }
  }

  return { rows: [] };
}

const query = async (text, params = []) => {
  if (isConnected) {
    return await pool.query(text, params);
  }
  return memoryQuery(text, params);
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

  const createEmployeesTable = `
    CREATE TABLE IF NOT EXISTS employees (
      id VARCHAR,
      agent_id VARCHAR,
      name VARCHAR,
      email VARCHAR,
      phone VARCHAR,
      counter_name VARCHAR,
      commission_rate DOUBLE,
      status VARCHAR,
      created_at TIMESTAMP
    );
  `;

  const createWinningClaimsTable = `
    CREATE TABLE IF NOT EXISTS winning_claims (
      id VARCHAR,
      agent_id VARCHAR,
      employee_id VARCHAR,
      employee_name VARCHAR,
      lottery_name VARCHAR,
      board VARCHAR,
      draw_number VARCHAR,
      draw_date TIMESTAMP,
      ticket_serial VARCHAR,
      matched_tier VARCHAR,
      prize_amount DOUBLE,
      payout_status VARCHAR,
      claimed_at TIMESTAMP
    );
  `;

  const createDailyOrdersTable = `
    CREATE TABLE IF NOT EXISTS daily_orders (
      id VARCHAR,
      agent_id VARCHAR,
      order_date TIMESTAMP,
      employee_id VARCHAR,
      employee_name VARCHAR,
      lottery_name VARCHAR,
      board VARCHAR,
      ordered_qty INT,
      additional_qty INT,
      returned_qty INT,
      remaining_qty INT,
      commission_rate DOUBLE,
      created_at TIMESTAMP
    );
  `;

  const createAgentsTable = `
    CREATE TABLE IF NOT EXISTS agents (
      id VARCHAR,
      user_id VARCHAR,
      agency_name VARCHAR,
      agent_code VARCHAR,
      email VARCHAR,
      phone VARCHAR,
      board_affiliation VARCHAR,
      location VARCHAR,
      status VARCHAR,
      created_at TIMESTAMP
    );
  `;

  const createAuditLogsTable = `
    CREATE TABLE IF NOT EXISTS audit_logs (
      id VARCHAR,
      actor_id VARCHAR,
      actor_role VARCHAR,
      action_type VARCHAR,
      details VARCHAR,
      ip_address VARCHAR,
      timestamp TIMESTAMP
    );
  `;

  const createScanSessionsTable = `
    CREATE TABLE IF NOT EXISTS scan_sessions (
      id VARCHAR,
      session_number VARCHAR,
      agent_id VARCHAR,
      employee_id VARCHAR,
      employee_name VARCHAR,
      counter_name VARCHAR,
      started_at TIMESTAMP,
      ended_at TIMESTAMP,
      status VARCHAR,
      total_tickets INT,
      winning_tickets INT,
      non_winning_tickets INT,
      total_winning_amount DOUBLE,
      return_shortage_amount DOUBLE,
      net_total_amount DOUBLE,
      prize_breakdown VARCHAR,
      tickets_data VARCHAR,
      notes VARCHAR,
      created_at TIMESTAMP
    );
  `;

  await query(createUsersTable);
  await query(createDrawsTable);
  await query(createLivePrizesTable);
  await query(createEmployeesTable);
  await query(createWinningClaimsTable);
  await query(createDailyOrdersTable);
  await query(createAgentsTable);
  await query(createAuditLogsTable);
  await query(createScanSessionsTable);
};

const initDB = async (retries = 1, delayMs = 1000) => {
  for (let i = 1; i <= retries; i++) {
    try {
      console.log(`Connecting to QuestDB at ${host}:${port} (Attempt ${i}/${retries})...`);
      await pool.query('SELECT 1');
      isConnected = true;
      await createTables();
      console.log('QuestDB successfully connected and tables verified.');
      return true;
    } catch (error) {
      console.warn(`QuestDB connection attempt ${i} failed:`, error.message);
      if (i < retries) {
        console.log(`Retrying connection in ${delayMs / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }
  console.log('[QuestDB] Operating in resilient In-Memory + Local JSON Persistence mode.');
  await createTables();
  return false;
};

const getStatus = () => {
  return isConnected ? 'CONNECTED' : 'LOCAL_IN_MEMORY';
};

module.exports = {
  pool,
  query,
  initDB,
  getStatus
};

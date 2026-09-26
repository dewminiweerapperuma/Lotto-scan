const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/questdb');

const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  AREA_AGENT: 'AREA_AGENT',
  COUNTER_STAFF: 'COUNTER_STAFF'
};

function normalizeRole(role) {
  if (!role) return ROLES.COUNTER_STAFF;
  const r = String(role).toUpperCase().trim();
  if (r === 'SUPER_ADMIN' || r === 'ADMIN') return ROLES.SUPER_ADMIN;
  if (r === 'AREA_AGENT' || r === 'AGENT') return ROLES.AREA_AGENT;
  if (r === 'COUNTER_STAFF' || r === 'USER' || r === 'STAFF') return ROLES.COUNTER_STAFF;
  return r;
}

class User {
  static ROLES = ROLES;
  static normalizeRole = normalizeRole;

  static async findByEmail(email) {
    if (!email) return null;
    const res = await db.query(
      'SELECT user_id, email, password_hash, role, created_at FROM users WHERE lower(email) = lower($1) LIMIT 1',
      [email.trim()]
    );
    if (res.rows.length === 0) return null;
    const row = res.rows[0];
    return {
      id: row.user_id,
      _id: row.user_id,
      email: row.email,
      password: row.password_hash,
      role: normalizeRole(row.role),
      createdAt: row.created_at
    };
  }

  static async findByEmailOrCode(identifier) {
    if (!identifier) return null;
    const trimmed = identifier.trim();

    // 1. Try finding by email
    const userByEmail = await User.findByEmail(trimmed);
    if (userByEmail) return userByEmail;

    // 2. Try finding by agent code
    try {
      const Agent = require('./Agent');
      const agent = await Agent.findByAgentCode(trimmed);
      if (agent && agent.userId) {
        const user = await User.findById(agent.userId);
        if (user) {
          user.agentProfile = agent;
          return user;
        }
      }
    } catch (err) {
      console.warn('Agent code lookup notice:', err.message);
    }

    return null;
  }

  static async findById(id) {
    if (!id) return null;
    const res = await db.query(
      'SELECT user_id, email, password_hash, role, created_at FROM users WHERE user_id = $1 LIMIT 1',
      [id]
    );
    if (res.rows.length === 0) return null;
    const row = res.rows[0];
    return {
      id: row.user_id,
      _id: row.user_id,
      email: row.email,
      password: row.password_hash,
      role: normalizeRole(row.role),
      createdAt: row.created_at
    };
  }

  static async create({ email, password, role = ROLES.COUNTER_STAFF }) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const id = uuidv4();
    const createdAt = new Date().toISOString();
    const assignedRole = normalizeRole(role);

    await db.query(
      'INSERT INTO users (user_id, email, password_hash, role, created_at) VALUES ($1, $2, $3, $4, $5)',
      [id, email.trim().toLowerCase(), hashedPassword, assignedRole, createdAt]
    );

    return {
      id,
      _id: id,
      email: email.trim().toLowerCase(),
      role: assignedRole,
      createdAt
    };
  }

  static async comparePassword(candidatePassword, hashedPassword) {
    return await bcrypt.compare(candidatePassword, hashedPassword);
  }
}

module.exports = User;
